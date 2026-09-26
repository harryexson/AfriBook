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
  const { query } = await import('@/lib/neon/admin');

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
  await query(
    `INSERT INTO webhook_events (provider, event_type, event_id, idempotency_key, raw_event, processed_at)
     VALUES ('mpesa', 'stk_callback', $1, $2, $3, now())`,
    [checkoutRequestID, `stk:${checkoutRequestID}`, JSON.stringify(payload)],
  ).catch(() => {});

  const txRows = await query<{ id: string; status: string }>(
    `SELECT id, status FROM payment_transactions WHERE provider_transaction_id = $1`,
    [checkoutRequestID],
  );

  const tx = txRows[0] ?? null;
  if (!tx) {
    return NextResponse.json({ received: true });
  }

  if (tx.status === 'succeeded' || tx.status === 'failed') {
    return NextResponse.json({ received: true, idempotent: true });
  }

  if (isSuccess) {
    const id = tx.id;
    await query(
      `UPDATE payment_transactions SET status = 'succeeded', provider_transaction_id = $2, metadata = $3, updated_at = now()
       WHERE id = $1`,
      [
        id,
        mpesaReceipt ?? checkoutRequestID,
        JSON.stringify({
          mpesa_receipt: mpesaReceipt,
          mpesa_result_desc: String(stkCallback.ResultDesc ?? ''),
          paid_at: new Date().toISOString(),
        }),
      ],
    );

    await query(`SELECT handle_payment_succeeded($1::uuid)`, [id]);
  } else {
    await query(
      `UPDATE payment_transactions SET status = 'failed', metadata = $2, updated_at = now() WHERE id = $1`,
      [
        tx.id,
        JSON.stringify({
          mpesa_result_code: resultCode,
          mpesa_result_desc: String(stkCallback.ResultDesc ?? ''),
          failed_at: new Date().toISOString(),
        }),
      ],
    );
  }

  return NextResponse.json({ received: true });
}
