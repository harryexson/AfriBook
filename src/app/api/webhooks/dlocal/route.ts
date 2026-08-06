import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { applyWebhookEvent, type ParsedWebhookEvent } from '@/lib/webhooks/process-webhook';

/**
 * dLocal webhook. Signature: HMAC-SHA256 (hex) of the raw body using
 * DLOCAL_WEBHOOK_SECRET, sent in the `x-dlocal-signature` header.
 * The stored provider_transaction_id is the dLocal transaction id
 * (or the merchant order_id fallback).
 */
function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.DLOCAL_WEBHOOK_SECRET ?? '';
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const FAILED_DLOCAL_STATUSES = new Set([
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'ERROR',
  'DECLINED',
]);

interface DLocalWebhookPayload {
  id?: string;
  event_type?: string;
  data?: {
    id?: string | number;
    order_id?: string;
    status?: string;
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-dlocal-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-dlocal-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: DLocalWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const data = payload.data ?? {};
  const transactionId = String(data.id ?? data.order_id ?? '');
  const statusText = (data.status ?? '').toUpperCase();

  if (!payload.id || !transactionId) {
    return NextResponse.json({ received: true });
  }

  let status: ParsedWebhookEvent['status'];
  if (statusText === 'PAID') {
    status = 'succeeded';
  } else if (FAILED_DLOCAL_STATUSES.has(statusText)) {
    status = 'failed';
  } else {
    status = 'ignored';
  }

  try {
    await applyWebhookEvent('dlocal', {
      eventId: payload.id,
      eventType: payload.event_type ?? 'payment.updated',
      providerTransactionId: transactionId,
      status,
      rawEvent: payload as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error('[dLocal Webhook] Error handling event:', err);
  }

  return NextResponse.json({ received: true });
}
