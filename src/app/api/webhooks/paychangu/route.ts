import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

interface PayChanguChargeWebhook {
  event_type: string;
  currency: string;
  amount: number | string;
  charge: string | number;
  mode: string;
  type: string;
  status: string;
  charge_id: string;
  reference: string;
  authorization?: {
    channel?: string;
    card_details?: Record<string, unknown> | null;
    mobile_money?: Record<string, unknown> | null;
    bank_payment_details?: Record<string, unknown> | null;
    completed_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface PayChanguPayoutWebhook {
  event_type: string;
  charge_id: string;
  reference: string;
  currency: string;
  amount: number | string;
  charge: string | number;
  mode: string;
  type: string;
  status: string;
  recipient_account_details?: Record<string, unknown> | null;
}

function verifySignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function getSupabase() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

async function handleChargeWebhook(data: PayChanguChargeWebhook) {
  const supabase = await getSupabase();
  const isSuccess = data.status === 'success' || data.status === 'successful';

  // The webhook exposes the PayChangu charge_id; our stored
  // provider_transaction_id is either the tx_ref (checkout) or the
  // charge_id (direct MoMo). Try charge_id first, then reference.
  const lookupIds = [
    data.charge_id,
    data.reference,
  ].filter(Boolean);

  let txId: string | null = null;
  for (const id of lookupIds) {
    const txResult = await supabase
      .from('payment_transactions')
      .select('id, metadata')
      .eq('provider_transaction_id', id)
      .maybeSingle() as unknown as {
      data: { id: string; metadata: Record<string, unknown> } | null;
    };
    if (txResult.data) {
      txId = txResult.data.id;
      break;
    }
  }

  const status = isSuccess ? 'succeeded' : 'failed';

  if (txId) {
    await supabase
      .from('payment_transactions')
      .update({
        status,
        provider_transaction_id: data.charge_id,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', txId);
  } else if (data.mode) {
    // Store as an orphan event so it can be reconciled later.
    await supabase.from('webhook_events').insert({
      provider: 'paychangu',
      event_type: data.event_type,
      event_id: data.charge_id,
      raw_event: data as unknown as Record<string, unknown>,
      processed_at: new Date().toISOString(),
    } as never);
  }

  if (!txId) return;

  const txResult = await supabase
    .from('payment_transactions')
    .select('metadata, booking_id, order_id')
    .eq('id', txId)
    .single() as unknown as {
    data: {
      metadata: Record<string, unknown>;
      booking_id: string | null;
      order_id: string | null;
    } | null;
  };

  const meta = txResult.data?.metadata ?? {};
  const bookingId = (meta.afribook_booking_id as string) ?? txResult.data?.booking_id;
  const orderId = (meta.afribook_order_id as string) ?? txResult.data?.order_id;

  if (isSuccess && bookingId) {
    await supabase
      .from('bookings')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', bookingId);
  }

  if (isSuccess && orderId) {
    await supabase
      .from('orders')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', orderId);
  }

  const customerId = meta.afribook_customer_id as string | undefined;
  if (customerId) {
    const amount = Number(data.amount ?? 0);
    await supabase.from('notifications').insert({
      userId: customerId,
      type: 'payment',
      title: isSuccess ? 'Payment Successful' : 'Payment Failed',
      body: isSuccess
        ? `Payment of ${amount.toFixed(2)} ${data.currency} was successful.`
        : `Your payment of ${amount.toFixed(2)} ${data.currency} was not completed.`,
      data: {
        charge_id: data.charge_id,
        reference: data.reference,
        amount,
        currency: data.currency,
      },
    } as never);
  }
}

async function handlePayoutWebhook(data: PayChanguPayoutWebhook) {
  const supabase = await getSupabase();
  const isSuccess = data.status === 'success' || data.status === 'successful';

  await supabase
    .from('payouts')
    .update({
      status: isSuccess ? 'completed' : 'failed',
      provider_payout_id: data.charge_id,
      paid_at: isSuccess ? new Date().toISOString() : null,
      metadata: {
        paychangu_transfer_id: data.charge_id,
        paychangu_reference: data.reference,
        failure_reason: isSuccess ? null : `PayChangu status: ${data.status}`,
      },
      updated_at: new Date().toISOString(),
    } as never)
    .or(`provider_payout_id.eq.${data.charge_id},metadata->>paychangu_transfer_id.eq.${data.charge_id}`);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    );
  }

  const signature = req.headers.get('signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature header' },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 },
    );
  }

  let payload: PayChanguChargeWebhook | PayChanguPayoutWebhook;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = await getSupabase();
  await supabase.from('webhook_events').insert({
    provider: 'paychangu',
    event_type: payload.event_type,
    event_id: payload.charge_id,
    idempotency_key: `${payload.event_type}:${payload.charge_id}`,
    raw_event: payload as unknown as Record<string, unknown>,
    processed_at: new Date().toISOString(),
  } as never);

  try {
    if (payload.event_type === 'api.payout') {
      await handlePayoutWebhook(payload as PayChanguPayoutWebhook);
    } else if (payload.event_type === 'api.charge.payment') {
      await handleChargeWebhook(payload as PayChanguChargeWebhook);
    }
  } catch (err) {
    console.error(`[PayChangu Webhook] Error handling ${payload.event_type}:`, err);
  }

  // PayChangu expects a 200 to acknowledge receipt.
  return NextResponse.json({ received: true });
}
