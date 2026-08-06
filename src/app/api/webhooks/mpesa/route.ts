import { NextRequest, NextResponse } from 'next/server';

/**
 * M-Pesa STK Push (Daraja) callback.
 *
 * Safaricom does not sign STK callbacks; authenticity is established by
 * matching the CheckoutRequestID against a payment_transactions row that the
 * server itself created during the STK push. Idempotency is enforced by the
 * terminal-state guard (a transaction already `succeeded`/`failed` is not
 * re-transitioned).
 */
export async function POST(req: NextRequest) {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const supabase = createAdminClient() as any;

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const stkCallback = (payload.Body as Record<string, unknown> | undefined)
    ?.stkCallback as Record<string, unknown> | undefined;

  if (!stkCallback) {
    return NextResponse.json({ error: 'Missing stkCallback' }, { status: 400 });
  }

  const checkoutRequestID = String(stkCallback.CheckoutRequestID ?? '');
  if (!checkoutRequestID) {
    return NextResponse.json({ error: 'Missing CheckoutRequestID' }, { status: 400 });
  }

  const resultCode = String(stkCallback.ResultCode ?? '');
  const isSuccess = resultCode === '0';

  const callbackMetadata = (stkCallback.CallbackMetadata as Record<string, unknown> | undefined)
    ?.Item as Array<{ Name?: string; Value?: unknown }> | undefined;

  const getMeta = (name: string): string | null => {
    const item = callbackMetadata?.find((i) => i.Name === name);
    return item ? String(item.Value ?? '') : null;
  };

  const mpesaReceipt = getMeta('MpesaReceiptNumber');

  // Record the raw event for the reconciliation ledger.
  await supabase
    .from('webhook_events')
    .insert({
      provider: 'mpesa',
      event_type: 'stk_callback',
      event_id: checkoutRequestID,
      idempotency_key: `stk:${checkoutRequestID}`,
      raw_event: payload as unknown as Record<string, unknown>,
      processed_at: new Date().toISOString(),
    } as never)
    .then(() => {})
    .catch(() => {});

  const txResult = await supabase
    .from('payment_transactions')
    .select('id, status')
    .eq('provider_transaction_id', checkoutRequestID)
    .maybeSingle();

  const tx = txResult.data as { id: string; status: string } | null;
  if (!tx) {
    return NextResponse.json({ received: true });
  }

  if (tx.status === 'succeeded' || tx.status === 'failed') {
    return NextResponse.json({ received: true, idempotent: true });
  }

  if (isSuccess) {
    const id = tx.id;
    const updateResult = await supabase
      .from('payment_transactions')
      .update({
        status: 'succeeded',
        provider_transaction_id: mpesaReceipt ?? checkoutRequestID,
        metadata: {
          mpesa_receipt: mpesaReceipt,
          mpesa_result_desc: String(stkCallback.ResultDesc ?? ''),
          paid_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id);

    if (!updateResult.error) {
      await supabase.rpc('handle_payment_succeeded', {
        p_transaction_id: id,
      } as never);
    }
  } else {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        metadata: {
          mpesa_result_code: resultCode,
          mpesa_result_desc: String(stkCallback.ResultDesc ?? ''),
          failed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', tx.id);
  }

  return NextResponse.json({ received: true });
}
