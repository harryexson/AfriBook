import { NextRequest, NextResponse } from 'next/server';

/**
 * PayChangu Standard Checkout callback.
 *
 * PayChangu appends `tx_ref` and `status` to the callback_url after the
 * customer finishes payment. We verify the final status server-side,
 * update our records, then redirect the customer back into the app.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txRef = searchParams.get('tx_ref');
  const status = searchParams.get('status');

  const { query } = await import('@/lib/neon/admin');

  if (txRef) {
    const { PayChanguProvider } = await import(
      '@/lib/payments/providers/paychangu-provider'
    );

    let providerStatus: string | null = null;
    try {
      // The provider is only constructible when the secret key is present.
      const provider = new PayChanguProvider();
      providerStatus = await provider.getTransactionStatus(txRef);
    } catch {
      // Fall back to the status PayChangu passed on the redirect.
      providerStatus = status;
    }

    const isSuccess =
      providerStatus === 'succeeded' ||
      status === 'success' ||
      status === 'successful';

    const txRows = await query<{
      id: string;
      metadata: Record<string, unknown> | null;
      booking_id: string | null;
      order_id: string | null;
    }>(
      `SELECT id, metadata, booking_id, order_id FROM payment_transactions WHERE provider_transaction_id = $1`,
      [txRef],
    );
    const tx = txRows[0] ?? null;

    if (tx) {
      await query(
        `UPDATE payment_transactions SET status = $2, updated_at = now() WHERE id = $1`,
        [tx.id, isSuccess ? 'succeeded' : 'failed'],
      );

      const meta = tx.metadata ?? {};
      const bookingId = (meta.afribook_booking_id as string) ?? tx.booking_id;
      const orderId = (meta.afribook_order_id as string) ?? tx.order_id;

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
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '/';
  const ok = status === 'success' || status === 'successful';
  return NextResponse.redirect(
    new URL(`/checkout?payment=${ok ? 'success' : 'failed'}`, baseUrl),
  );
}

export async function POST(req: NextRequest) {
  return GET(req);
}
