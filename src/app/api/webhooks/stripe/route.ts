import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function getDb() {
  const { query } = await import('@/lib/neon/admin');
  return query;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  const query = await getDb();
  const { transactionId } = intent.metadata;

  await query(
    `UPDATE payment_transactions SET status = 'succeeded', updated_at = now() WHERE provider_transaction_id = $1`,
    [intent.id],
  );

  if (transactionId) {
    await query(`SELECT handle_payment_succeeded($1::uuid)`, [transactionId]);
  }

  if (intent.metadata.afribook_booking_id) {
    await query(
      `UPDATE bookings SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [intent.metadata.afribook_booking_id],
    );
  }

  if (intent.metadata.afribook_order_id) {
    await query(
      `UPDATE orders SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [intent.metadata.afribook_order_id],
    );
  }

  // Event registration payments: confirm the registration and mint tickets.
  const eventId = intent.metadata.event_id;
  const registrationId = intent.metadata.registration_id;
  if (eventId && registrationId) {
    const registrationRows = await query<{
      id: string; event_id: string; user_id: string; user_name: string;
      user_email: string | null; user_phone: string | null; quantity: number;
      ticket_tier_name: string; total: number; currency_code: string;
    }>(
      `SELECT id, event_id, user_id, user_name, user_email, user_phone, quantity, ticket_tier_name, total, currency_code
       FROM event_registrations WHERE id = $1 AND event_id = $2`,
      [registrationId, eventId],
    );
    const registration = registrationRows[0];

    if (registration) {
      const eventRows = await query<{
        id: string; title: string; start_date: string | null; end_date: string | null;
        venue_name: string | null; is_virtual: boolean;
      }>(
        `SELECT id, title, start_date, end_date, venue_name, is_virtual FROM events WHERE id = $1`,
        [eventId],
      );
      const event = eventRows[0];

      await query(
        `UPDATE event_registrations SET status = 'confirmed', payment_status = 'completed', updated_at = now() WHERE id = $1`,
        [registrationId],
      );

      const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${eventId}/ticket/${registrationId}`;
      const createdTickets: { id: string; ticket_code: string }[] = [];
      for (let i = 0; i < registration.quantity; i++) {
        const rows = await query<{ id: string; ticket_code: string }>(
          `INSERT INTO event_tickets
             (registration_id, event_id, user_id, tier_name, attendee_name, attendee_email, status, qr_code_url, valid_from, valid_until)
           VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9)
           RETURNING id, ticket_code`,
          [
            registrationId, eventId, registration.user_id, registration.ticket_tier_name,
            registration.user_name, registration.user_email, ticketUrl,
            event?.start_date ?? null, event?.end_date ?? null,
          ],
        );
        createdTickets.push(rows[0]);
      }

      const ticketCode = createdTickets[0]?.ticket_code ?? '';

      await query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'system', 'Registration Confirmed', $2, $3)`,
        [
          registration.user_id,
          `Payment received. You're registered for "${event?.title ?? 'the event'}".`,
          JSON.stringify({
            event_id: eventId,
            registration_id: registrationId,
            ticket_codes: createdTickets.map((t) => t.ticket_code),
          }),
        ],
      );

      // Dispatch confirmation email + SMS.
      if (registration.user_email) {
        const origin = process.env.NEXT_PUBLIC_APP_URL ?? '';
        const ticketUrl = `${origin}/events/${eventId}/confirmation?registration=${registrationId}&code=${ticketCode}`;
        const emailHtml = [
          `Hi ${escapeHtml(registration.user_name ?? 'there')},`,
          '',
          `Payment received — your registration for <strong>${escapeHtml(event?.title ?? '')}</strong> is confirmed!`,
          '',
          `Ticket code: <strong>${ticketCode}</strong>`,
          `Tickets: ${registration.quantity}`,
          `Total: ${(registration.total ?? 0).toFixed(2)} ${registration.currency_code ?? ''}`,
          `Date: ${event?.start_date ? new Date(event.start_date).toLocaleDateString() : ''}`,
          `Venue: ${event?.is_virtual ? 'Virtual event' : escapeHtml(event?.venue_name ?? 'TBA')}`,
          '',
          `<a href="${ticketUrl}">View your ticket</a>`,
          '',
          'Present your QR code at the entrance for check-in.',
          '- AfriBook Team',
        ].join('<br/>');

        await sendEmail({
          to: registration.user_email,
          subject: `Registration Confirmed: ${event?.title ?? ''}`,
          html: emailHtml,
          template: 'event_registration_confirmation',
          userId: registration.user_id,
          metadata: { event_id: eventId, registration_id: registrationId },
        }).catch(() => {});

        if (registration.user_phone) {
          await sendSms({
            to: registration.user_phone,
            body: `AfriBook: Payment received. You're registered for "${event?.title ?? ''}"! Code: ${ticketCode}. Show QR at entrance.`,
            eventId,
            recipientName: registration.user_name,
            templateKey: 'event_registration_confirmation',
          }).catch(() => {});
        }
      }
    }
  }
}

async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
  const query = await getDb();
  const failureMessage = intent.last_payment_error?.message ?? 'Payment failed';

  await query(
    `UPDATE payment_transactions SET status = 'failed', metadata = $2, updated_at = now() WHERE provider_transaction_id = $1`,
    [intent.id, JSON.stringify({ failure_message: failureMessage, failed_at: new Date().toISOString() })],
  );
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const query = await getDb();

  const metadata = session.metadata ?? {};
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  const transactionId = metadata.afribook_transaction_id;
  const amount = session.amount_total ? session.amount_total / 100 : 0;

  if (transactionId) {
    await query(
      `UPDATE payment_transactions SET status = 'succeeded', provider_transaction_id = $2, updated_at = now() WHERE id = $1`,
      [transactionId, (session.payment_intent as string) ?? session.id],
    );
  }

  if (metadata.afribook_booking_id) {
    await query(
      `UPDATE bookings SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [metadata.afribook_booking_id],
    );
  }

  if (metadata.afribook_order_id) {
    await query(
      `UPDATE orders SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [metadata.afribook_order_id],
    );
  }

  if (session.customer_details?.email && metadata.afribook_customer_id) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Payment Successful', $2, $3)`,
      [
        metadata.afribook_customer_id,
        `Payment of ${amount.toFixed(2)} ${session.currency?.toUpperCase()} was successful.`,
        JSON.stringify({
          session_id: session.id,
          payment_intent: session.payment_intent,
          line_items: lineItems.data.map((i) => ({
            description: i.description,
            amount: i.amount_total ? i.amount_total / 100 : 0,
            quantity: i.quantity,
          })),
        }),
      ],
    );
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const query = await getDb();
  const vendorId = account.metadata?.afribook_vendor_id;
  if (!vendorId) return;

  await query(
    `UPDATE vendor_wallets SET metadata = $2, updated_at = now() WHERE vendor_id = $1`,
    [
      vendorId,
      JSON.stringify({
        stripe_account_id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        currently_due: account.requirements?.currently_due ?? [],
        updated_at: new Date().toISOString(),
      }),
    ],
  );
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  const query = await getDb();

  await query(
    `UPDATE payouts SET status = 'completed', paid_at = now() WHERE metadata->>'stripe_payout_id' = $1`,
    [payout.id],
  );
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  const query = await getDb();
  const failureMessage = payout.failure_message ?? 'Payout failed';

  await query(
    `UPDATE payouts SET status = 'failed', metadata = $2 WHERE metadata->>'stripe_payout_id' = $1`,
    [payout.id, JSON.stringify({ failure_message: failureMessage, failed_at: new Date().toISOString() })],
  );
}

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('idempotency-key') ?? '';
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (idempotencyKey) {
    const query = await getDb();
    const existing = await query<{ id: string }>(
      `SELECT id FROM webhook_events WHERE idempotency_key = $1`,
      [idempotencyKey],
    );

    if (existing.length > 0) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    await query(
      `INSERT INTO webhook_events (provider, event_type, event_id, idempotency_key, raw_event, processed_at)
       VALUES ('stripe', $1, $2, $3, $4, now())`,
      [event.type, event.id, idempotencyKey, JSON.stringify(event)],
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;
      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout);
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}
