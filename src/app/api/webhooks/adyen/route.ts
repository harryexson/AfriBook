import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { applyWebhookEvent, type ParsedWebhookEvent } from '@/lib/webhooks/process-webhook';

interface AdyenNotificationItem {
  NotificationRequestItem?: {
    pspReference?: string;
    originalReference?: string;
    merchantAccountCode?: string;
    merchantReference?: string;
    value?: string | number;
    currency?: string;
    eventCode?: string;
    success?: string;
    additionalData?: {
      hmacSignature?: string;
    };
  };
}

/**
 * Adyen webhook. Verifies the HMAC signature using the official canonical
 * signing string (field order matters), then maps payment events.
 */
function verifySignature(item: AdyenNotificationItem['NotificationRequestItem']): boolean {
  const secret = process.env.ADYEN_WEBHOOK_HMAC ?? '';
  if (!secret || !item) return false;

  const provided = item.additionalData?.hmacSignature;
  if (!provided) return false;

  const signingValues = [
    item.pspReference ?? '',
    item.originalReference ?? '',
    item.merchantAccountCode ?? '',
    item.merchantReference ?? '',
    String(item.value ?? ''),
    item.currency ?? '',
    item.eventCode ?? '',
    item.success ?? '',
  ];

  const hmac = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(signingValues.join(':'))
    .digest('base64');

  const a = Buffer.from(hmac);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const PAYMENT_EVENT_CODES = new Set([
  'AUTHORISATION',
  'AUTHORISATION_ADJUSTMENT',
  'PAYMENT_SUCCESS',
  'REFUND',
  'CANCELLATION',
  'CANCEL_OR_REFUND',
  'CAPTURE',
  'CAPTURE_FAILED',
  'PAYMENT_FAILED',
  'NOTIFICATION_OF_CHARGEBACK',
  'REQUEST_FOR_INFORMATION',
  'REFUND_FAILED',
]);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let payload: { notificationItems?: AdyenNotificationItem[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const item = payload.notificationItems?.[0]?.NotificationRequestItem;
  if (!item?.pspReference || !item.eventCode) {
    return NextResponse.json({ error: 'Invalid Adyen notification' }, { status: 400 });
  }

  if (!verifySignature(item)) {
    return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 400 });
  }

  if (!PAYMENT_EVENT_CODES.has(item.eventCode)) {
    return NextResponse.json({ accepted: true });
  }

  const success = item.success === 'true';
  const isFailure = item.eventCode.endsWith('_FAILED') || item.eventCode === 'PAYMENT_FAILED';

  const event: ParsedWebhookEvent = {
    eventId: `${item.pspReference}:${item.eventCode}`,
    eventType: item.eventCode,
    providerTransactionId: item.pspReference,
    status: isFailure ? 'failed' : success ? 'succeeded' : 'ignored',
    rawEvent: payload as unknown as Record<string, unknown>,
  };

  try {
    await applyWebhookEvent('adyen', event);
  } catch (err) {
    console.error('[Adyen Webhook] Error handling event:', err);
  }

  // Adyen requires an empty [accepted] JSON body to acknowledge receipt.
  return NextResponse.json({ accepted: true });
}
