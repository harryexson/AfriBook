import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

function verifySignature(signature: string, secret: string): boolean {
  const expected = crypto.createHash('sha256').update(secret).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function getDb() {
  const { query } = await import('@/lib/neon/admin');
  return query;
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
  const query = await getDb();

  await query(
    `UPDATE payment_transactions SET status = 'succeeded', provider_transaction_id = $2, updated_at = now()
     WHERE provider_transaction_id = $1`,
    [data.tx_ref, data.flw_ref],
  );

  const bookingId = data.meta?.afribook_booking_id;
  if (bookingId) {
    // payment_status enum has no 'completed' value; 'succeeded' is the closest fit.
    await query(
      `UPDATE bookings SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [bookingId],
    );
  }

  const orderId = data.meta?.afribook_order_id;
  if (orderId) {
    await query(
      `UPDATE orders SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [orderId],
    );
  }

  const customerId = data.meta?.afribook_customer_id;
  if (customerId) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Payment Successful', $2, $3)`,
      [
        customerId,
        `Payment of ${data.charged_amount.toFixed(2)} ${data.currency} was successful.`,
        JSON.stringify({ flw_ref: data.flw_ref, tx_ref: data.tx_ref, amount: data.charged_amount }),
      ],
    );
  }
}

async function handleChargeFailed(data: FlutterwaveChargeData) {
  const query = await getDb();
  const failureMessage = data.processor_response ?? 'Charge failed';

  await query(
    `UPDATE payment_transactions SET status = 'failed', metadata = $2, updated_at = now()
     WHERE provider_transaction_id = $1`,
    [
      data.tx_ref,
      JSON.stringify({ failure_message: failureMessage, failed_at: new Date().toISOString() }),
    ],
  );
}

async function handleTransferCompleted(data: FlutterwaveTransferData) {
  const query = await getDb();
  const isSuccess = data.status === 'successful';

  // payouts has no updated_at column — only created_at / paid_at.
  await query(
    `UPDATE payouts SET status = $2, provider_payout_id = $3, paid_at = $4, metadata = $5
     WHERE metadata->>'flutterwave_transfer_reference' = $1`,
    [
      data.reference,
      isSuccess ? 'completed' : 'failed',
      String(data.id),
      isSuccess ? new Date().toISOString() : null,
      JSON.stringify({
        flutterwave_transfer_id: data.id,
        flutterwave_reference: data.reference,
        failure_reason: data.failure_reason,
      }),
    ],
  );
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
