import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_EVENTS ?? process.env.STRIPE_WEBHOOK_SECRET!;

function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { registration_id, event_id, user_id, ticket_code } = paymentIntent.metadata;

  if (!registration_id) return;

  const { data: registration } = await supabase
    .from('ticket_purchases')
    .select('id, event_id, quantity, ticket_type_id, buyer_email')
    .eq('id', registration_id)
    .single();

  if (!registration) return;

  await supabase
    .from('ticket_purchases')
    .update({
      payment_status: 'completed',
      order_status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration_id);

  const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${event_id}/ticket/${ticket_code}`;

  await supabase
    .from('ticket_purchases')
    .update({ qr_code_url: qrCodeUrl })
    .eq('id', registration_id);

  if (user_id) {
    await supabase.from('notifications').insert({
      user_id,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      body: `Your payment for the event has been confirmed. Your ticket code is ${ticket_code}.`,
      data: { event_id, registration_id, ticket_code, payment_intent_id: paymentIntent.id },
    });
  }

  if (registration.buyer_email) {
    await supabase.from('notifications').insert({
      user_id: user_id ?? '',
      type: 'ticket_confirmed',
      title: 'Ticket Confirmed',
      body: `Your ticket is confirmed! Ticket code: ${ticket_code}. Present this code at the event entrance.`,
      data: { event_id, registration_id, ticket_code },
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { registration_id, event_id, user_id } = paymentIntent.metadata;
  const failureMessage = paymentIntent.last_payment_error?.message ?? 'Payment failed';

  if (!registration_id) return;

  await supabase
    .from('ticket_purchases')
    .update({
      payment_status: 'failed',
      order_status: 'pending',
      metadata: { failure_message: failureMessage, failed_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration_id);

  const { data: registration } = await supabase
    .from('ticket_purchases')
    .select('quantity, ticket_type_id')
    .eq('id', registration_id)
    .single();

  if (registration) {
    await supabase
      .from('events')
      .update({
        tickets_sold: Math.max(0, (await supabase.from('events').select('tickets_sold').eq('id', event_id).single()).data?.tickets_sold ?? 0 - registration.quantity),
      })
      .eq('id', event_id);

    const { data: tt } = await supabase
      .from('event_ticket_types')
      .select('quantity_sold')
      .eq('id', registration.ticket_type_id)
      .single();

    if (tt) {
      await supabase
        .from('event_ticket_types')
        .update({ quantity_sold: Math.max(0, (tt.quantity_sold ?? 0) - registration.quantity) })
        .eq('id', registration.ticket_type_id);
    }
  }

  if (user_id) {
    await supabase.from('notifications').insert({
      user_id,
      type: 'payment_failed',
      title: 'Payment Failed',
      body: `Your payment could not be processed: ${failureMessage}. Please try again.`,
      data: { event_id, registration_id, failure_message: failureMessage },
    });
  }
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  const { data: registration } = await supabase
    .from('ticket_purchases')
    .select('id, event_id, buyer_id, quantity, ticket_type_id, total')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (!registration) return;

  const refundAmount = (charge.amount_refunded ?? 0) / 100;
  const isFullRefund = refundAmount >= registration.total;

  await supabase
    .from('ticket_purchases')
    .update({
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      refund_amount: refundAmount,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration.id);

  if (isFullRefund) {
    await supabase
      .from('ticket_purchases')
      .update({ order_status: 'cancelled' })
      .eq('id', registration.id);

    const { data: event } = await supabase
      .from('events')
      .select('tickets_sold')
      .eq('id', registration.event_id)
      .single();

    if (event) {
      await supabase
        .from('events')
        .update({ tickets_sold: Math.max(0, event.tickets_sold - registration.quantity) })
        .eq('id', registration.event_id);
    }

    const { data: tt } = await supabase
      .from('event_ticket_types')
      .select('quantity_sold')
      .eq('id', registration.ticket_type_id)
      .single();

    if (tt) {
      await supabase
        .from('event_ticket_types')
        .update({ quantity_sold: Math.max(0, (tt.quantity_sold ?? 0) - registration.quantity) })
        .eq('id', registration.ticket_type_id);
    }
  }

  if (registration.buyer_id) {
    await supabase.from('notifications').insert({
      user_id: registration.buyer_id,
      type: 'refund_processed',
      title: 'Refund Processed',
      body: `A refund of ${refundAmount} has been processed for your ticket.`,
      data: { registration_id: registration.id, event_id: registration.event_id, refund_amount: refundAmount },
    });
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
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
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
