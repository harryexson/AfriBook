import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { applyWebhookEvent, type ParsedWebhookEvent } from '@/lib/webhooks/process-webhook';

/**
 * Airwallex webhook. The signature header is of the form
 * `t=<timestamp>,v1=<hmac-sha256-hex-of-raw-body>`. The stored
 * provider_transaction_id is the PaymentIntent id.
 */
function verifySignature(rawBody: string, headerValue: string): boolean {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret) return false;

  const v1 = headerValue.split(',').find((part) => part.startsWith('v1='));
  if (!v1) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(v1.slice(3));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

interface AirwallexEvent {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      payment_intent_id?: string;
      status?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-airwallex-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-airwallex-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: AirwallexEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventId = payload.id ?? '';
  const eventType = payload.type ?? 'unknown';
  const object = payload.data?.object ?? {};

  const providerTransactionId = object.id ?? object.payment_intent_id ?? '';
  if (!eventId || !providerTransactionId) {
    return NextResponse.json({ received: true });
  }

  let status: ParsedWebhookEvent['status'] = 'ignored';
  if (eventType.includes('succeeded') || eventType.includes('confirmed')) {
    status = 'succeeded';
  } else if (eventType.includes('failed') || eventType.includes('cancelled')) {
    status = 'failed';
  }

  try {
    await applyWebhookEvent('airwallex', {
      eventId,
      eventType,
      providerTransactionId,
      status,
      rawEvent: payload as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error('[Airwallex Webhook] Error handling event:', err);
  }

  return NextResponse.json({ received: true });
}
