// ─── SMS service ──────────────────────────────────────────────
// Provider-agnostic SMS sending with an audit trail, mirroring `email.ts`.
//
// Selects a provider from SMS_PROVIDER (twilio | console). When no Twilio
// credentials are configured it falls back to a console log so local and
// preview environments never hard-fail. Every attempt is recorded in the
// `sms_logs` table (migration 017) for back-office auditing and to enforce
// per-event reminder quotas.
//
// SECURITY: sending uses raw `fetch` to the Twilio REST API — no SDK
// dependency — and secrets only ever live in server env vars.
// ─────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/lib/supabase/admin';

export type SmsProvider = 'twilio' | 'console';

export interface SendSmsParams {
  to: string;
  body: string;
  eventId?: string;
  recipientName?: string;
  templateKey?: string;
  metadata?: Record<string, unknown>;
}

export interface SendSmsResult {
  ok: boolean;
  provider: SmsProvider;
  providerMessageId?: string;
  error?: string;
}

interface SmsLogInsert {
  event_id: string | null;
  recipient_name: string | null;
  recipient_phone: string;
  template_key: string | null;
  body: string;
  provider: SmsProvider;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  provider_message_id: string | null;
  error: string | null;
  sent_at: string | null;
}

function resolveProvider(): SmsProvider {
  const configured = (process.env.SMS_PROVIDER ?? 'console').toLowerCase();
  if (configured === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return 'twilio';
  }
  return 'console';
}

async function deliverTwilio(
  params: SendSmsParams,
): Promise<{ providerMessageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!from) {
    return { error: 'TWILIO_FROM_NUMBER is not configured' };
  }

  const body = new URLSearchParams({
    To: params.to,
    From: from,
    Body: params.body,
  });

  const credentials = btoa(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`);

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: (json as { message?: string })?.message ?? `Twilio error ${res.status}` };
  }
  return { providerMessageId: (json as { sid?: string })?.sid };
}

async function logSms(insert: SmsLogInsert): Promise<void> {
  try {
    const admin = createAdminClient() as any;
    await admin.from('sms_logs').insert(insert);
  } catch {
    // Audit logging must never break SMS delivery.
  }
}

/**
 * Send an SMS and persist the attempt in `sms_logs`.
 * Returns ok=false (never throws) so callers can fail gracefully.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const provider = resolveProvider();
  const now = new Date().toISOString();

  if (provider === 'console') {
    console.log(`[sms:console] to=${params.to} body="${params.body}"`);
    await logSms({
      event_id: params.eventId ?? null,
      recipient_name: params.recipientName ?? null,
      recipient_phone: params.to,
      template_key: params.templateKey ?? null,
      body: params.body,
      provider: 'console',
      status: 'sent',
      provider_message_id: null,
      error: null,
      sent_at: now,
    });
    return { ok: true, provider };
  }

  const { providerMessageId, error } = await deliverTwilio(params);

  await logSms({
    event_id: params.eventId ?? null,
    recipient_name: params.recipientName ?? null,
    recipient_phone: params.to,
    template_key: params.templateKey ?? null,
    body: params.body,
    provider,
    status: error ? 'failed' : 'sent',
    provider_message_id: providerMessageId ?? null,
    error: error ?? null,
    sent_at: now,
  });

  return error
    ? { ok: false, provider, error }
    : { ok: true, provider, providerMessageId };
}
