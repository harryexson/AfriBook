import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { applyWebhookEvent, type ParsedWebhookEvent } from '@/lib/webhooks/process-webhook';

/**
 * PawaPay webhook. Signature: HMAC-SHA256 (hex) of the raw body using
 * PAWAPAY_WEBHOOK_SECRET, sent in the `x-pawapay-signature` header.
 * The stored provider_transaction_id is the deposit id.
 */
function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAWAPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

interface PawaPayWebhookPayload {
  id?: string;
  eventType?: string;
  resource?: {
    depositId?: string;
    status?: string;
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-pawapay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-pawapay-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: PawaPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventType = payload.eventType ?? '';
  const depositId = payload.resource?.depositId ?? '';
  const eventId = payload.id ?? depositId;

  if (!eventId || !depositId) {
    return NextResponse.json({ received: true });
  }

  let status: ParsedWebhookEvent['status'];
  if (eventType.toLowerCase().includes('completed') || eventType.toLowerCase().includes('success')) {
    status = 'succeeded';
  } else if (eventType.toLowerCase().includes('failed')) {
    status = 'failed';
  } else {
    status = 'ignored';
  }

  try {
    await applyWebhookEvent('pawapay', {
      eventId,
      eventType,
      providerTransactionId: depositId,
      status,
      rawEvent: payload as unknown as Record<string, unknown>,
    });
  } catch (err) {
    console.error('[PawaPay Webhook] Error handling event:', err);
  }

  return NextResponse.json({ received: true });
}
