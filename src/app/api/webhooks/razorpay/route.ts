import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function getDb() {
  const { query } = await import('@/lib/neon/admin');
  return query;
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
  const query = await getDb();

  await query(
    `UPDATE payment_transactions SET status = 'processing', provider_transaction_id = $2, updated_at = now()
     WHERE provider_transaction_id = $1`,
    [payment.order_id, payment.id],
  );
}

async function handlePaymentCaptured(payment: RazorpayPayment) {
  const query = await getDb();

  await query(
    `UPDATE payment_transactions SET status = 'succeeded', updated_at = now() WHERE provider_transaction_id = $1`,
    [payment.id],
  );

  const bookingId = payment.notes?.afribook_booking_id;
  if (bookingId) {
    // payment_status enum has no 'completed' value; 'succeeded' is the closest fit.
    await query(
      `UPDATE bookings SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [bookingId],
    );
  }

  const orderId = payment.notes?.afribook_order_id;
  if (orderId) {
    await query(
      `UPDATE orders SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [orderId],
    );
  }

  const customerId = payment.notes?.afribook_customer_id;
  if (customerId) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Payment Successful', $2, $3)`,
      [
        customerId,
        `Payment of ${(payment.amount / 100).toFixed(2)} ${payment.currency} via Razorpay was successful.`,
        JSON.stringify({ razorpay_payment_id: payment.id, order_id: payment.order_id }),
      ],
    );
  }
}

async function handlePaymentFailed(payment: RazorpayPayment) {
  const query = await getDb();
  const failureMessage = payment.error_description ?? payment.error_code ?? 'Payment failed';

  await query(
    `UPDATE payment_transactions SET status = 'failed', metadata = $2, updated_at = now()
     WHERE provider_transaction_id = $1`,
    [
      payment.id,
      JSON.stringify({
        failure_message: failureMessage,
        error_code: payment.error_code,
        failed_at: new Date().toISOString(),
      }),
    ],
  );
}

async function handlePayoutProcessed(payout: RazorpayPayout) {
  const query = await getDb();
  const isSuccess = payout.status === 'processed';

  // payouts has no updated_at column — only created_at / paid_at.
  await query(
    `UPDATE payouts SET status = $2, provider_payout_id = $3, paid_at = $4, metadata = $5
     WHERE metadata->>'razorpay_payout_id' = $1`,
    [
      payout.id,
      isSuccess ? 'completed' : 'failed',
      payout.id,
      isSuccess ? new Date().toISOString() : null,
      JSON.stringify({
        razorpay_payout_id: payout.id,
        failure_reason: payout.failure_reason,
      }),
    ],
  );
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
