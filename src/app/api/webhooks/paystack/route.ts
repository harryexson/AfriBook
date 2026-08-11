import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function getSupabase() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient();
}

interface PaystackEventData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  gateway_response?: string;
  paid_at?: string;
  authorization?: Record<string, unknown>;
  customer?: { email: string; id: number };
  metadata?: Record<string, string>;
  fees?: number;
  failure_reason?: string;
  transferred_at?: string;
  recipient?: Record<string, unknown>;
  reason?: string;
}

async function handleChargeSuccess(data: PaystackEventData) {
  const supabase = await getSupabase();
  const amount = data.amount / 100;

  await supabase
    .from('payment_transactions')
    .update({
      status: 'succeeded',
      provider_transaction_id: data.reference,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', data.reference);

  const bookingId = data.metadata?.afribook_booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', bookingId);
  }

  const orderId = data.metadata?.afribook_order_id;
  if (orderId) {
    await supabase
      .from('orders')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', orderId);
  }

  const customerId = data.metadata?.afribook_customer_id;
  if (customerId) {
    await supabase.from('notifications').insert({
      userId: customerId,
      type: 'payment',
      title: 'Payment Successful',
      body: `Payment of ${amount.toFixed(2)} ${data.currency} via Paystack was successful.`,
      data: { paystack_reference: data.reference, amount, currency: data.currency },
    } as never);
  }
}

async function handleChargeFailed(data: PaystackEventData) {
  const supabase = await getSupabase();
  const failureMessage = data.failure_reason ?? data.gateway_response ?? 'Charge failed';

  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      metadata: {
        failure_message: failureMessage,
        failed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', data.reference);
}

async function handleTransferSuccess(data: PaystackEventData) {
  const supabase = await getSupabase();

  await supabase
    .from('payouts')
    .update({
      status: 'completed',
      provider_payout_id: String(data.id),
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('metadata->>paystack_transfer_code', data.reference);
}

async function handleTransferFailed(data: PaystackEventData) {
  const supabase = await getSupabase();
  const failureMessage = data.failure_reason ?? 'Transfer failed';

  await supabase
    .from('payouts')
    .update({
      status: 'failed',
      metadata: {
        failure_message: failureMessage,
        failed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('metadata->>paystack_transfer_code', data.reference);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = req.headers.get('x-paystack-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-paystack-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: { event: string; data: PaystackEventData };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    switch (payload.event) {
      case 'charge.success':
        await handleChargeSuccess(payload.data);
        break;
      case 'charge.failed':
        await handleChargeFailed(payload.data);
        break;
      case 'transfer.success':
        await handleTransferSuccess(payload.data);
        break;
      case 'transfer.failed':
        await handleTransferFailed(payload.data);
        break;
    }
  } catch (err) {
    console.error(`[Paystack Webhook] Error handling ${payload.event}:`, err);
  }

  return NextResponse.json({ received: true });
}

