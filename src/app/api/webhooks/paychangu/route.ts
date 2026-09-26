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

async function getDb() {
  const { query } = await import('@/lib/neon/admin');
  return query;
}

async function handleChargeWebhook(data: PayChanguChargeWebhook) {
  const query = await getDb();
  const isSuccess = data.status === 'success' || data.status === 'successful';

  // The webhook exposes the PayChangu charge_id; our stored
  // provider_transaction_id is either the tx_ref (checkout) or the
  // charge_id (direct MoMo). Try charge_id first, then reference.
  const lookupIds = [data.charge_id, data.reference].filter(Boolean);

  let txId: string | null = null;
  for (const id of lookupIds) {
    const rows = await query<{ id: string }>(
      `SELECT id FROM payment_transactions WHERE provider_transaction_id = $1`,
      [id],
    );
    if (rows[0]) {
      txId = rows[0].id;
      break;
    }
  }

  const status = isSuccess ? 'succeeded' : 'failed';

  if (txId) {
    await query(
      `UPDATE payment_transactions SET status = $2, provider_transaction_id = $3, updated_at = now() WHERE id = $1`,
      [txId, status, data.charge_id],
    );
  } else if (data.mode) {
    // Store as an orphan event so it can be reconciled later.
    await query(
      `INSERT INTO webhook_events (provider, event_type, event_id, raw_event, processed_at)
       VALUES ('paychangu', $1, $2, $3, now())`,
      [data.event_type, data.charge_id, JSON.stringify(data)],
    );
  }

  if (!txId) return;

  const txRows = await query<{
    metadata: Record<string, unknown> | null;
    booking_id: string | null;
    order_id: string | null;
  }>(
    `SELECT metadata, booking_id, order_id FROM payment_transactions WHERE id = $1`,
    [txId],
  );

  const meta = txRows[0]?.metadata ?? {};
  const bookingId = (meta.afribook_booking_id as string) ?? txRows[0]?.booking_id;
  const orderId = (meta.afribook_order_id as string) ?? txRows[0]?.order_id;

  if (isSuccess && bookingId) {
    // payment_status enum has no 'completed' value; 'succeeded' is the closest fit.
    await query(
      `UPDATE bookings SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [bookingId],
    );
  }

  if (isSuccess && orderId) {
    await query(
      `UPDATE orders SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [orderId],
    );
  }

  const customerId = meta.afribook_customer_id as string | undefined;
  if (customerId) {
    const amount = Number(data.amount ?? 0);
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', $2, $3, $4)`,
      [
        customerId,
        isSuccess ? 'Payment Successful' : 'Payment Failed',
        isSuccess
          ? `Payment of ${amount.toFixed(2)} ${data.currency} was successful.`
          : `Your payment of ${amount.toFixed(2)} ${data.currency} was not completed.`,
        JSON.stringify({
          charge_id: data.charge_id,
          reference: data.reference,
          amount,
          currency: data.currency,
        }),
      ],
    );
  }
}

async function handlePayoutWebhook(data: PayChanguPayoutWebhook) {
  const query = await getDb();
  const isSuccess = data.status === 'success' || data.status === 'successful';

  // payouts has no updated_at column — only created_at / paid_at.
  await query(
    `UPDATE payouts SET status = $3, provider_payout_id = $1, paid_at = $4, metadata = $5
     WHERE provider_payout_id = $1 OR metadata->>'paychangu_transfer_id' = $2`,
    [
      data.charge_id,
      data.charge_id,
      isSuccess ? 'completed' : 'failed',
      isSuccess ? new Date().toISOString() : null,
      JSON.stringify({
        paychangu_transfer_id: data.charge_id,
        paychangu_reference: data.reference,
        failure_reason: isSuccess ? null : `PayChangu status: ${data.status}`,
      }),
    ],
  );
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

  const query = await getDb();
  await query(
    `INSERT INTO webhook_events (provider, event_type, event_id, idempotency_key, raw_event, processed_at)
     VALUES ('paychangu', $1, $2, $3, $4, now())`,
    [
      payload.event_type,
      payload.charge_id,
      `${payload.event_type}:${payload.charge_id}`,
      JSON.stringify(payload),
    ],
  );

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
