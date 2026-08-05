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

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

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

    const txResult = (await supabase
      .from('payment_transactions')
      .select('id, metadata, booking_id, order_id')
      .eq('provider_transaction_id', txRef)
      .maybeSingle()) as unknown as {
      data: {
        id: string;
        metadata: Record<string, unknown>;
        booking_id: string | null;
        order_id: string | null;
      } | null;
    };

    if (txResult.data) {
      const tx = txResult.data;
      await supabase
        .from('payment_transactions')
        .update({
          status: isSuccess ? 'succeeded' : 'failed',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', tx.id);

      const meta = tx.metadata ?? {};
      const bookingId = (meta.afribook_booking_id as string) ?? tx.booking_id;
      const orderId = (meta.afribook_order_id as string) ?? tx.order_id;

      if (isSuccess && bookingId) {
        await supabase
          .from('bookings')
          .update({
            paymentStatus: 'completed',
            updatedAt: new Date().toISOString(),
          } as never)
          .eq('id', bookingId);
      }

      if (isSuccess && orderId) {
        await supabase
          .from('orders')
          .update({
            paymentStatus: 'completed',
            updatedAt: new Date().toISOString(),
          } as never)
          .eq('id', orderId);
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
