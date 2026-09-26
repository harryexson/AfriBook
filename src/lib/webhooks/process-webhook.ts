import { query } from '@/lib/neon/admin';

export interface ParsedWebhookEvent {
  /** Provider event id, used as the idempotency key. */
  eventId: string;
  eventType: string;
  /** Value stored in payment_transactions.provider_transaction_id. */
  providerTransactionId?: string;
  status: 'succeeded' | 'failed' | 'ignored';
  /** Raw webhook payload to persist on webhook_events. */
  rawEvent: Record<string, unknown>;
}

/**
 * Shared handling for provider webhook routes:
 *   1. Persist the raw event to webhook_events (deduped by eventId).
 *   2. Mark the matching payment_transactions row succeeded/failed.
 *   3. Complete linked bookings/orders and notify the customer on success.
 *
 * Runs as the service role (bypasses RLS) — the caller must verify the
 * webhook signature before invoking this.
 */
export async function applyWebhookEvent(
  provider: string,
  event: ParsedWebhookEvent,
): Promise<void> {
  const existing = await query<{ id: string }>(
    `SELECT id FROM webhook_events WHERE provider = $1 AND event_id = $2`,
    [provider, event.eventId],
  );

  if (existing.length === 0) {
    await query(
      `INSERT INTO webhook_events (provider, event_type, event_id, idempotency_key, raw_event, processed_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [provider, event.eventType, event.eventId, event.eventId, JSON.stringify(event.rawEvent)],
    );
  }

  if (event.status === 'ignored' || !event.providerTransactionId) {
    return;
  }

  const nextStatus = event.status === 'succeeded' ? 'succeeded' : 'failed';

  await query(
    `UPDATE payment_transactions SET status = $1, provider_transaction_id = $2, updated_at = now()
     WHERE provider_transaction_id = $2`,
    [nextStatus, event.providerTransactionId],
  );

  if (nextStatus !== 'succeeded') {
    return;
  }

  const txRows = await query<{
    metadata: Record<string, unknown> | null;
    booking_id: string | null;
    order_id: string | null;
  }>(
    `SELECT metadata, booking_id, order_id, ridely_ride_id, delivery_id
     FROM payment_transactions WHERE provider_transaction_id = $1`,
    [event.providerTransactionId],
  );

  const tx = txRows[0];
  const meta = tx?.metadata ?? {};
  const bookingId = (meta.afribook_booking_id as string) ?? tx?.booking_id;
  const orderId = (meta.afribook_order_id as string) ?? tx?.order_id;
  const customerId = (meta.afribook_customer_id as string) ?? null;

  if (bookingId) {
    await query(
      `UPDATE bookings SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [bookingId],
    );
  }

  if (orderId) {
    await query(
      `UPDATE orders SET payment_status = 'succeeded', updated_at = now() WHERE id = $1`,
      [orderId],
    );
  }

  if (customerId) {
    const amount = Number(meta.amount ?? 0);
    const currency = (meta.currency as string) ?? 'USD';
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'payment', 'Payment Successful', $2, $3)`,
      [
        customerId,
        `Payment of ${amount.toFixed(2)} ${currency} via ${provider} was successful.`,
        JSON.stringify({
          provider_transaction_id: event.providerTransactionId,
          amount,
          currency,
        }),
      ],
    );
  }
}
