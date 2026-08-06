import { createAdminClient } from '@/lib/supabase/admin';

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
  const supabase = createAdminClient();

  const existing = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', provider)
    .eq('event_id', event.eventId)
    .maybeSingle();

  if (!existing.data) {
    await supabase.from('webhook_events').insert({
      provider,
      event_type: event.eventType,
      event_id: event.eventId,
      idempotency_key: event.eventId,
      raw_event: event.rawEvent,
      processed_at: new Date().toISOString(),
    } as never);
  }

  if (event.status === 'ignored' || !event.providerTransactionId) {
    return;
  }

  const nextStatus = event.status === 'succeeded' ? 'succeeded' : 'failed';

  await supabase
    .from('payment_transactions')
    .update({
      status: nextStatus,
      provider_transaction_id: event.providerTransactionId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('provider_transaction_id', event.providerTransactionId);

  if (nextStatus !== 'succeeded') {
    return;
  }

  const txResult = await supabase
    .from('payment_transactions')
    .select('metadata, booking_id, order_id, ridely_ride_id, delivery_id')
    .eq('provider_transaction_id', event.providerTransactionId)
    .single() as unknown as {
    data: {
      metadata: Record<string, unknown> | null;
      booking_id: string | null;
      order_id: string | null;
    } | null;
  };

  const meta = txResult.data?.metadata ?? {};
  const bookingId = (meta.afribook_booking_id as string) ?? txResult.data?.booking_id;
  const orderId = (meta.afribook_order_id as string) ?? txResult.data?.order_id;
  const customerId = (meta.afribook_customer_id as string) ?? null;

  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', bookingId);
  }

  if (orderId) {
    await supabase
      .from('orders')
      .update({ paymentStatus: 'completed', updatedAt: new Date().toISOString() } as never)
      .eq('id', orderId);
  }

  if (customerId) {
    const amount = Number(meta.amount ?? 0);
    const currency = (meta.currency as string) ?? 'USD';
    await supabase.from('notifications').insert({
      userId: customerId,
      type: 'payment',
      title: 'Payment Successful',
      body: `Payment of ${amount.toFixed(2)} ${currency} via ${provider} was successful.`,
      data: {
        provider_transaction_id: event.providerTransactionId,
        amount,
        currency,
      },
    } as never);
  }
}
