import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import type { Booking, Order } from '@/types';

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function getSupabase() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient();
}

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  email?: string;
  contact?: string;
  method?: string;
  description?: string;
  error_code?: string;
  error_description?: string;
  notes?: Record<string, string>;
}

interface RazorpayPayout {
  id: string;
  entity: string;
  status: string;
  amount: number;
  currency: string;
  notes?: Record<string, string>;
  failure_reason?: string;
}

async function handlePaymentAuthorized(payment: RazorpayPayment) {
  const supabase = await getSupabase();

  await supabase
    .from('payment_transactions')
    .update({
      status: 'processing',
      provider_transaction_id: payment.id,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', payment.order_id);
}

async function handlePaymentCaptured(payment: RazorpayPayment) {
  const supabase = await getSupabase();

  await supabase
    .from('payment_transactions')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', payment.id);

  const bookingId = payment.notes?.afribook_booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', bookingId);
  }

  const orderId = payment.notes?.afribook_order_id;
  if (orderId) {
    await supabase
      .from('orders')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', orderId);
  }

  const customerId = payment.notes?.afribook_customer_id;
  if (customerId) {
    await supabase.from('notifications').insert({
      userId: customerId,
      type: 'payment',
      title: 'Payment Successful',
      body: `Payment of ${(payment.amount / 100).toFixed(2)} ${payment.currency} via Razorpay was successful.`,
      data: { razorpay_payment_id: payment.id, order_id: payment.order_id },
    } as never);
  }
}

async function handlePaymentFailed(payment: RazorpayPayment) {
  const supabase = await getSupabase();
  const failureMessage = payment.error_description ?? payment.error_code ?? 'Payment failed';

  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      metadata: {
        failure_message: failureMessage,
        error_code: payment.error_code,
        failed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', payment.id);
}

async function handlePayoutProcessed(payout: RazorpayPayout) {
  const supabase = await getSupabase();

  await supabase
    .from('payouts')
    .update({
      status: payout.status === 'processed' ? 'completed' : 'failed',
      provider_payout_id: payout.id,
      paid_at: payout.status === 'processed' ? new Date().toISOString() : null,
      metadata: {
        razorpay_payout_id: payout.id,
        failure_reason: payout.failure_reason,
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('metadata->>razorpay_payout_id', payout.id);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: { event: string; payload: { payment?: { entity: RazorpayPayment }; payout?: { entity: RazorpayPayout } } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    switch (payload.event) {
      case 'payment.authorized':
        if (payload.payload.payment?.entity) {
          await handlePaymentAuthorized(payload.payload.payment.entity);
        }
        break;
      case 'payment.captured':
        if (payload.payload.payment?.entity) {
          await handlePaymentCaptured(payload.payload.payment.entity);
        }
        break;
      case 'payment.failed':
        if (payload.payload.payment?.entity) {
          await handlePaymentFailed(payload.payload.payment.entity);
        }
        break;
      case 'payout.processed':
        if (payload.payload.payout?.entity) {
          await handlePayoutProcessed(payload.payload.payout.entity);
        }
        break;
    }
  } catch (err) {
    console.error(`[Razorpay Webhook] Error handling ${payload.event}:`, err);
  }

  return NextResponse.json({ received: true });
}

