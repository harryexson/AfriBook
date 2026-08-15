import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function getSupabase() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient();
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
  const supabase = await getSupabase();
  const { transactionId } = intent.metadata;

  await supabase
    .from('payment_transactions')
    .update({ status: 'succeeded', updated_at: new Date().toISOString() } as never)
    .eq('provider_transaction_id', intent.id);

  if (transactionId) {
    await supabase.rpc('handle_payment_succeeded', {
      p_transaction_id: transactionId,
    } as never);
  }

  if (intent.metadata.afribook_booking_id) {
    await supabase
      .from('bookings')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', intent.metadata.afribook_booking_id);
  }

  if (intent.metadata.afribook_order_id) {
    await supabase
      .from('orders')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', intent.metadata.afribook_order_id);
  }

  // Event registration payments: confirm the registration and mint tickets.
  const eventId = intent.metadata.event_id;
  const registrationId = intent.metadata.registration_id;
  if (eventId && registrationId) {
    const { data: registration } = await (supabase as any)
      .from('event_registrations')
      .select(
        'id, event_id, user_id, user_name, user_email, user_phone, quantity, ticket_tier_name, total, currency_code'
      )
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .single();

    if (registration) {
      const { data: event } = await (supabase as any)
        .from('events')
        .select('id, title, start_date, end_date, venue_name, is_virtual')
        .eq('id', eventId)
        .single();

      await (supabase as any)
        .from('event_registrations')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', registrationId);

      const ticketRows = Array.from({ length: registration.quantity }).map(() => ({
        registration_id: registrationId,
        event_id: eventId,
        user_id: registration.user_id,
        tier_name: registration.ticket_tier_name,
        attendee_name: registration.user_name,
        attendee_email: registration.user_email,
        status: 'active',
        qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${eventId}/ticket/${registrationId}`,
        valid_from: event?.start_date ?? null,
        valid_until: event?.end_date ?? null,
      }));

      const { data: createdTickets } = await (supabase as any)
        .from('event_tickets')
        .insert(ticketRows)
        .select('id, ticket_code');

      const ticketCode = createdTickets?.[0]?.ticket_code ?? '';

      await supabase.from('notifications').insert({
        user_id: registration.user_id,
        type: 'system',
        title: 'Registration Confirmed',
        body: `Payment received. You're registered for "${event?.title ?? 'the event'}".`,
        data: {
          event_id: eventId,
          registration_id: registrationId,
          ticket_codes: createdTickets?.map((t: any) => t.ticket_code) ?? [],
        },
      } as never);

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
  const supabase = await getSupabase();
  const failureMessage = intent.last_payment_error?.message ?? 'Payment failed';

  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      metadata: { failure_message: failureMessage, failed_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', intent.id);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = await getSupabase();

  const metadata = session.metadata ?? {};
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  const transactionId = metadata.afribook_transaction_id;
  const amount = session.amount_total ? session.amount_total / 100 : 0;

  if (transactionId) {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'succeeded',
        provider_transaction_id: session.payment_intent as string ?? session.id,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', transactionId);
  }

  if (metadata.afribook_booking_id) {
    await supabase
      .from('bookings')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', metadata.afribook_booking_id);
  }

  if (metadata.afribook_order_id) {
    await supabase
      .from('orders')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', metadata.afribook_order_id);
  }

  if (session.customer_details?.email) {
    await supabase.from('notifications').insert({
      userId: metadata.afribook_customer_id ?? '',
      type: 'payment',
      title: 'Payment Successful',
      body: `Payment of ${(amount).toFixed(2)} ${session.currency?.toUpperCase()} was successful.`,
      data: {
        session_id: session.id,
        payment_intent: session.payment_intent,
        line_items: lineItems.data.map((i) => ({
          description: i.description,
          amount: i.amount_total / 100,
          quantity: i.quantity,
        })),
      },
    } as never);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = await getSupabase();
  const vendorId = account.metadata?.afribook_vendor_id;
  if (!vendorId) return;

  await supabase
    .from('vendor_wallets')
    .update({
      metadata: {
        stripe_account_id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        currently_due: account.requirements?.currently_due ?? [],
        updated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('vendor_id', vendorId);
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  const supabase = await getSupabase();

  await supabase
    .from('payouts')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('metadata->>stripe_payout_id', payout.id);
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  const supabase = await getSupabase();
  const failureMessage = payout.failure_message ?? 'Payout failed';

  await supabase
    .from('payouts')
    .update({
      status: 'failed',
      metadata: { failure_message: failureMessage, failed_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('metadata->>stripe_payout_id', payout.id);
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
    const supabase = await getSupabase();
    const existing = await supabase
      .from('webhook_events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing.data) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    await supabase.from('webhook_events').insert({
      provider: 'stripe',
      event_type: event.type,
      event_id: event.id,
      idempotency_key: idempotencyKey,
      raw_event: event as unknown as Record<string, unknown>,
      processed_at: new Date().toISOString(),
    } as never);
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
