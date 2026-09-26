import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function getDb() {
  const { query } = await import('@/lib/neon/admin');
  return query;
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
  const query = await getDb();
  const amount = data.amount / 100;

  await query(
    `UPDATE payment_transactions SET status = 'succeeded', provider_transaction_id = $1, updated_at = now()
     WHERE provider_transaction_id = $1`,
    [data.reference],
  );

  const bookingId = data.metadata?.afribook_booking_id;
  if (bookingId) {
    // payment_status enum has no 'completed' value; 'succeeded' is the closest fit.
    await query(
      `UPDATE bookings SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [bookingId],
    );
  }

  const orderId = data.metadata?.afribook_order_id;
  if (orderId) {
    await query(
      `UPDATE orders SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [orderId],
    );
  }

  const customerId = data.metadata?.afribook_customer_id;
  if (customerId) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Payment Successful', $2, $3)`,
      [
        customerId,
        `Payment of ${amount.toFixed(2)} ${data.currency} via Paystack was successful.`,
        JSON.stringify({ paystack_reference: data.reference, amount, currency: data.currency }),
      ],
    );
  }
}

async function handleChargeFailed(data: PaystackEventData) {
  const query = await getDb();
  const failureMessage = data.failure_reason ?? data.gateway_response ?? 'Charge failed';

  await query(
    `UPDATE payment_transactions SET status = 'failed', metadata = $2, updated_at = now()
     WHERE provider_transaction_id = $1`,
    [
      data.reference,
      JSON.stringify({ failure_message: failureMessage, failed_at: new Date().toISOString() }),
    ],
  );
}

async function handleTransferSuccess(data: PaystackEventData) {
  const query = await getDb();

  // payouts has no updated_at column — only created_at / paid_at.
  await query(
    `UPDATE payouts SET status = 'completed', provider_payout_id = $2, paid_at = now()
     WHERE metadata->>'paystack_transfer_code' = $1`,
    [data.reference, String(data.id)],
  );
}

async function handleTransferFailed(data: PaystackEventData) {
  const query = await getDb();
  const failureMessage = data.failure_reason ?? 'Transfer failed';

  await query(
    `UPDATE payouts SET status = 'failed', metadata = $2
     WHERE metadata->>'paystack_transfer_code' = $1`,
    [
      data.reference,
      JSON.stringify({ failure_message: failureMessage, failed_at: new Date().toISOString() }),
    ],
  );
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
