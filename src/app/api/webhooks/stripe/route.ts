import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { Booking, Order } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function getSupabase() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
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
