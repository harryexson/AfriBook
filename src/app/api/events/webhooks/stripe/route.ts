import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

async function getAdminDb() {
  const { query } = await import('@/lib/neon/admin');
  return query;
}

type QueryFn = Awaited<ReturnType<typeof getAdminDb>>;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_EVENTS ?? process.env.STRIPE_WEBHOOK_SECRET!;

// Find-or-create the organizer's wallet (event organizers have no business,
// so business_id is NULL) and credit it with the net amount after fees.
async function creditOrganizerWallet(
  query: QueryFn,
  organizerId: string,
  netAmount: number,
  eventId: string,
): Promise<void> {
  const existingRows = await query<{
    id: string; balance: string | number; available_balance: string | number; currency: string;
  }>(
    `SELECT id, balance, available_balance, currency FROM vendor_wallets
     WHERE vendor_id = $1 AND business_id IS NULL`,
    [organizerId],
  );
  const existing = existingRows[0] ?? null;

  const evtRows = await query<{ currency_code: string | null }>(
    `SELECT currency_code FROM events WHERE id = $1`,
    [eventId],
  );

  const currency = evtRows[0]?.currency_code ?? 'USD';

  if (existing) {
    await query(
      `UPDATE vendor_wallets SET balance = $2, available_balance = $3, updated_at = now() WHERE id = $1`,
      [
        existing.id,
        Number(existing.balance ?? 0) + netAmount,
        Number(existing.available_balance ?? 0) + netAmount,
      ],
    );
  } else {
    await query(
      `INSERT INTO vendor_wallets (vendor_id, business_id, balance, available_balance, currency)
       VALUES ($1, NULL, $2, $2, $3)`,
      [organizerId, netAmount, currency],
    );
  }
}

// Debit the organizer's wallet ledger by the net amount (full-refund reverse).
async function debitOrganizerWallet(
  query: QueryFn,
  organizerId: string,
  netAmount: number,
): Promise<void> {
  const existingRows = await query<{ id: string; balance: string | number; available_balance: string | number }>(
    `SELECT id, balance, available_balance FROM vendor_wallets WHERE vendor_id = $1 AND business_id IS NULL`,
    [organizerId],
  );
  const existing = existingRows[0] ?? null;
  if (!existing) return;

  const balance = Number(existing.balance ?? 0);
  const available = Number(existing.available_balance ?? 0);

  await query(
    `UPDATE vendor_wallets SET balance = $2, available_balance = $3, updated_at = now() WHERE id = $1`,
    [existing.id, Math.max(balance - netAmount, 0), Math.max(available - netAmount, 0)],
  );
}

async function handlePaymentSucceeded(
  query: QueryFn,
  paymentIntent: Stripe.PaymentIntent,
) {
  const { type } = paymentIntent.metadata;

  // Celebrations: per-event billing charge paid → flip the event to paid.
  if (type === 'celebration_per_event') {
    const { event_id } = paymentIntent.metadata;
    if (event_id) {
      await query(
        `UPDATE events SET billing_status = 'paid', billing_paid_at = now(), updated_at = now() WHERE id = $1`,
        [event_id],
      );
    }
    return;
  }

  // Celebrations: donation paid → mark completed and credit the organizer wallet.
  if (type === 'celebration_donation') {
    const { donation_id, event_id, organizer_id, net_amount } = paymentIntent.metadata;

    if (!donation_id) return;

    const donationRows = await query<{
      id: string; event_id: string; donor_name: string | null; status: string; net_amount: string | number | null;
    }>(
      `SELECT id, event_id, donor_name, status, net_amount FROM celebration_donations WHERE id = $1`,
      [donation_id],
    );
    const donation = donationRows[0];

    if (!donation) return;
    if (donation.status === 'completed') return;

    await query(
      `UPDATE celebration_donations SET status = 'completed', paid_at = now(), stripe_payment_intent_id = $2, updated_at = now()
       WHERE id = $1`,
      [donation.id, paymentIntent.id],
    );

    const net = Number(net_amount ?? donation.net_amount ?? 0);
    if (organizer_id && net > 0) {
      await creditOrganizerWallet(query, organizer_id, net, event_id ?? donation.event_id);
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Donation Received', $2, $3)`,
      [
        organizer_id,
        `${donation.donor_name ?? 'A guest'} donated to your celebration.`,
        JSON.stringify({
          event_id: event_id ?? donation.event_id,
          donation_id: donation.id,
          net_amount: net,
          payment_intent_id: paymentIntent.id,
        }),
      ],
    );
    return;
  }

  const { registration_id } = paymentIntent.metadata;
  if (!registration_id) return;

  const registrationRows = await query<{
    id: string; event_id: string; user_id: string | null; user_name: string | null; user_email: string | null;
    quantity: number; ticket_tier_id: string; ticket_tier_name: string; subtotal: string | number;
    platform_fee: string | number; processing_fee: string | number; total: string | number;
    status: string; payment_status: string;
  }>(
    `SELECT id, event_id, user_id, user_name, user_email, quantity, ticket_tier_id, ticket_tier_name,
            subtotal, platform_fee, processing_fee, total, status, payment_status
     FROM event_registrations WHERE id = $1`,
    [registration_id],
  );
  const registration = registrationRows[0];

  if (!registration) return;

  // Idempotency guard: never re-confirm an already-confirmed registration.
  if (registration.payment_status === 'completed' || registration.status === 'confirmed') {
    return;
  }

  await query(
    `UPDATE event_registrations SET payment_status = 'completed', status = 'confirmed', payment_method = 'card', updated_at = now()
     WHERE id = $1`,
    [registration_id],
  );

  // 003's counter trigger only handles confirmed<->cancelled transitions, so
  // a pending->confirmed flip must increment counters explicitly.
  const tierRows = await query<{ sold: number | null }>(
    `SELECT sold FROM event_ticket_tiers WHERE id = $1`,
    [registration.ticket_tier_id],
  );
  const tier = tierRows[0];

  if (tier) {
    await query(
      `UPDATE event_ticket_tiers SET sold = $2 WHERE id = $1`,
      [registration.ticket_tier_id, (tier.sold ?? 0) + registration.quantity],
    );
  }

  const eventCountRows = await query<{ tickets_sold: number | null }>(
    `SELECT tickets_sold FROM events WHERE id = $1`,
    [registration.event_id],
  );
  const eventCount = eventCountRows[0];

  if (eventCount) {
    await query(
      `UPDATE events SET tickets_sold = $2 WHERE id = $1`,
      [registration.event_id, (eventCount.tickets_sold ?? 0) + registration.quantity],
    );
  }

  // Create individual tickets (QR codes auto-generated by DB trigger).
  const evtRows = await query<{ title: string | null; start_date: string | null; end_date: string | null }>(
    `SELECT title, start_date, end_date FROM events WHERE id = $1`,
    [registration.event_id],
  );
  const evt = evtRows[0];

  const createdTickets: { ticket_code: string }[] = [];
  for (let i = 0; i < registration.quantity; i++) {
    const rows = await query<{ ticket_code: string }>(
      `INSERT INTO event_tickets
         (registration_id, event_id, user_id, tier_name, attendee_name, attendee_email, status, qr_code_url, valid_from, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9)
       RETURNING ticket_code`,
      [
        registration.id,
        registration.event_id,
        registration.user_id,
        registration.ticket_tier_name,
        registration.user_name,
        registration.user_email,
        `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${registration.event_id}/ticket/${registration.id}`,
        evt?.start_date ?? null,
        evt?.end_date ?? null,
      ],
    );
    createdTickets.push(rows[0]);
  }

  // Credit the organizer's wallet ledger with the net amount after the
  // platform fee deduction (funds themselves are transferred via Stripe
  // Connect destination charges; this keeps the AfriBook wallet in sync).
  const organizerId = paymentIntent.metadata.afribook_organizer_id;
  const netAmount = Number(paymentIntent.metadata.afribook_net_to_organizer ?? 0);

  if (organizerId && netAmount > 0) {
    await creditOrganizerWallet(query, organizerId, netAmount, registration.event_id);
  }

  if (registration.user_id) {
    const ticketCodes = createdTickets.map((t) => t.ticket_code);
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Payment Confirmed', $2, $3)`,
      [
        registration.user_id,
        `Your payment for ${evt?.title ?? 'the event'} has been confirmed.`,
        JSON.stringify({
          event_id: registration.event_id,
          registration_id: registration.id,
          ticket_codes: ticketCodes,
          payment_intent_id: paymentIntent.id,
        }),
      ],
    );
  }
}

async function handlePaymentFailed(
  query: QueryFn,
  paymentIntent: Stripe.PaymentIntent,
) {
  const failureMessage = paymentIntent.last_payment_error?.message ?? 'Payment failed';

  const { type, donation_id } = paymentIntent.metadata;

  if (type === 'celebration_donation' && donation_id) {
    await query(
      `UPDATE celebration_donations SET status = 'failed', updated_at = now() WHERE id = $1`,
      [donation_id],
    );
    return;
  }

  const { registration_id } = paymentIntent.metadata;

  if (!registration_id) return;

  const registrationRows = await query<{ user_id: string | null }>(
    `SELECT user_id FROM event_registrations WHERE id = $1`,
    [registration_id],
  );
  const registration = registrationRows[0];

  await query(
    `UPDATE event_registrations SET payment_status = 'failed', payment_method = 'card', updated_at = now() WHERE id = $1`,
    [registration_id],
  );

  if (registration?.user_id) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Payment Failed', $2, $3)`,
      [
        registration.user_id,
        `Your payment could not be processed: ${failureMessage}. Please try again.`,
        JSON.stringify({ registration_id, payment_intent_id: paymentIntent.id, failure_message: failureMessage }),
      ],
    );
  }
}

async function handleRefund(query: QueryFn, charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  const donationRows = await query<{
    id: string; event_id: string; status: string; net_amount: string | number | null; refund_amount: string | number | null;
  }>(
    `SELECT id, event_id, status, net_amount, refund_amount FROM celebration_donations WHERE stripe_payment_intent_id = $1`,
    [paymentIntentId],
  );
  const donation = donationRows[0];

  if (donation) {
    const refundAmount = (charge.amount_refunded ?? 0) / 100;
    await query(
      `UPDATE celebration_donations SET status = 'refunded', refund_amount = $2, refunded_at = now(), updated_at = now()
       WHERE id = $1`,
      [donation.id, refundAmount],
    );

    if (donation.status === 'completed') {
      const evtRows = await query<{ organizer_id: string | null }>(
        `SELECT organizer_id FROM events WHERE id = $1`,
        [donation.event_id],
      );
      const evt = evtRows[0];

      if (evt?.organizer_id) {
        const netRefund = Math.max(Number(donation.net_amount ?? 0), 0);
        await debitOrganizerWallet(query, evt.organizer_id, netRefund);
      }
    }
    return;
  }

  const registrationRows = await query<{
    id: string; event_id: string; user_id: string | null; quantity: number; total: string | number;
    subtotal: string | number; platform_fee: string | number; processing_fee: string | number;
    status: string; payment_status: string; refund_amount: string | number | null;
  }>(
    `SELECT id, event_id, user_id, quantity, total, subtotal, platform_fee, processing_fee, status, payment_status, refund_amount
     FROM event_registrations WHERE payment_intent_id = $1`,
    [paymentIntentId],
  );
  const registration = registrationRows[0];

  if (!registration) return;

  const refundAmount = (charge.amount_refunded ?? 0) / 100;
  const isFullRefund = refundAmount >= Number(registration.total ?? 0);

  await query(
    `UPDATE event_registrations SET payment_status = $2, status = $3, refund_amount = $4, refunded_at = now(), updated_at = now()
     WHERE id = $1`,
    [
      registration.id,
      isFullRefund ? 'refunded' : 'completed',
      isFullRefund ? 'cancelled' : registration.status,
      refundAmount,
    ],
  );

  if (isFullRefund) {
    // status confirmed->cancelled: 003 trigger decrements tier/event counters.
    // Debit the organizer's wallet ledger so balances stay reconciled with the
    // Stripe Connect transfer that will be reversed.
    const evtRows = await query<{ organizer_id: string | null }>(
      `SELECT organizer_id FROM events WHERE id = $1`,
      [registration.event_id],
    );
    const evt = evtRows[0];

    if (evt?.organizer_id) {
      const netRefund = Math.max(
        Number(registration.total ?? 0) - Number(registration.platform_fee ?? 0) - Number(registration.processing_fee ?? 0),
        0,
      );
      await debitOrganizerWallet(query, evt.organizer_id, netRefund);
    }

    await query(
      `UPDATE event_tickets SET status = 'cancelled' WHERE registration_id = $1`,
      [registration.id],
    );
  }

  if (registration.user_id) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Refund Processed', $2, $3)`,
      [
        registration.user_id,
        `A refund of ${refundAmount} has been processed for your ticket.`,
        JSON.stringify({ registration_id: registration.id, event_id: registration.event_id, refund_amount: refundAmount }),
      ],
    );
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { success: false, error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }

  try {
    const query = await getAdminDb();

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(query, event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(query, event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(query, event.data.object as Stripe.Charge);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`[Events Stripe Webhook] Error handling ${event.type}:`, err);
    return NextResponse.json(
      { success: false, error: 'Webhook handler error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, received: true });
}
