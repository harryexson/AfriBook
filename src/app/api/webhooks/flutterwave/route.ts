import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import type { Booking, Order } from '@/types';

function verifySignature(signature: string, secret: string): boolean {
  const expected = crypto.createHash('sha256').update(secret).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function getSupabase() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

interface FlutterwaveChargeData {
  id: number;
  tx_ref: string;
  flw_ref: string;
  amount: number;
  currency: string;
  charged_amount: number;
  status: string;
  payment_type?: string;
  created_at?: string;
  customer?: { email: string; name: string; phone_number?: string };
  meta?: Record<string, string>;
  processor_response?: string;
}

interface FlutterwaveTransferData {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  complete_message?: string;
  failure_reason?: string;
  created_at?: string;
  meta?: Record<string, string>;
}

async function handleChargeCompleted(data: FlutterwaveChargeData) {
  const supabase = await getSupabase();

  await supabase
    .from('payment_transactions')
    .update({
      status: 'succeeded',
      provider_transaction_id: data.flw_ref,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', data.tx_ref);

  const bookingId = data.meta?.afribook_booking_id;
  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', bookingId);
  }

  const orderId = data.meta?.afribook_order_id;
  if (orderId) {
    await supabase
      .from('orders')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', orderId);
  }

  const customerId = data.meta?.afribook_customer_id;
  if (customerId) {
    await supabase.from('notifications').insert({
      userId: customerId,
      type: 'payment',
      title: 'Payment Successful',
      body: `Payment of ${data.charged_amount.toFixed(2)} ${data.currency} was successful.`,
      data: { flw_ref: data.flw_ref, tx_ref: data.tx_ref, amount: data.charged_amount },
    } as never);
  }
}

async function handleChargeFailed(data: FlutterwaveChargeData) {
  const supabase = await getSupabase();
  const failureMessage = data.processor_response ?? 'Charge failed';

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
    .eq('provider_transaction_id', data.tx_ref);
}

async function handleTransferCompleted(data: FlutterwaveTransferData) {
  const supabase = await getSupabase();

  await supabase
    .from('payouts')
    .update({
      status: data.status === 'successful' ? 'completed' : 'failed',
      provider_payout_id: String(data.id),
      paid_at: data.status === 'successful' ? new Date().toISOString() : null,
      metadata: {
        flutterwave_transfer_id: data.id,
        flutterwave_reference: data.reference,
        failure_reason: data.failure_reason,
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq('metadata->>flutterwave_transfer_reference', data.reference);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = req.headers.get('verif-hash');
  if (!signature) {
    return NextResponse.json({ error: 'Missing verif-hash header' }, { status: 400 });
  }

  if (!verifySignature(signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: { event: string; data: FlutterwaveChargeData | FlutterwaveTransferData };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    switch (payload.event) {
      case 'charge.completed':
        await handleChargeCompleted(payload.data as FlutterwaveChargeData);
        break;
      case 'charge.failed':
        await handleChargeFailed(payload.data as FlutterwaveChargeData);
        break;
      case 'transfer.completed':
        await handleTransferCompleted(payload.data as FlutterwaveTransferData);
        break;
    }
  } catch (err) {
    console.error(`[Flutterwave Webhook] Error handling ${payload.event}:`, err);
  }

  return NextResponse.json({ received: true });
}

