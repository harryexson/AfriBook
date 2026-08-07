// ─── Email service ──────────────────────────────────────────────
// Provider-agnostic transactional email sending with an audit trail.
//
// Selects a provider from EMAIL_PROVIDER (resend | sendgrid | postmark | console).
// When no provider key is configured it falls back to a console log so local
// and preview environments never hard-fail. Every attempt is recorded in the
// `email_logs` table (migration 013) for back-office auditing.
//
// SECURITY: sending uses raw `fetch` to each provider REST API — no SDK
// dependency — and secrets only ever live in server env vars.
// ─────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/lib/supabase/admin';

export type EmailProvider = 'resend' | 'sendgrid' | 'postmark' | 'console';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  ok: boolean;
  provider: EmailProvider;
  messageId?: string;
  error?: string;
}

interface EmailLogInsert {
  user_id: string | null;
  recipient: string;
  subject: string | null;
  template: string | null;
  provider: EmailProvider | 'console';
  status: 'queued' | 'sent' | 'failed';
  message_id: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
  sent_at: string | null;
}

function resolveProvider(): EmailProvider {
  const configured = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
  if (configured === 'resend' && process.env.RESEND_API_KEY) return 'resend';
  if (configured === 'sendgrid' && process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (configured === 'postmark' && process.env.POSTMARK_SERVER_TOKEN) return 'postmark';
  return 'console';
}

async function deliver(
  provider: EmailProvider,
  from: string,
  params: SendEmailParams,
): Promise<{ messageId?: string; error?: string }> {
  switch (provider) {
    case 'resend': {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          ...(params.text ? { text: params.text } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { error: body?.message ?? `Resend error ${res.status}` };
      return { messageId: body?.id };
    }

    case 'sendgrid': {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: from },
          subject: params.subject,
          content: [{ type: 'text/html', value: params.html }],
        }),
      });
      if (!res.ok) return { error: `SendGrid error ${res.status}` };
      return { messageId: res.headers.get('x-message-id') ?? undefined };
    }

    case 'postmark': {
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: from,
          To: params.to,
          Subject: params.subject,
          HtmlBody: params.html,
          ...(params.text ? { TextBody: params.text } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { error: body?.Message ?? `Postmark error ${res.status}` };
      return { messageId: body?.MessageID };
    }

    case 'console':
    default:
      return { messageId: undefined };
  }
}

async function logEmail(insert: EmailLogInsert): Promise<void> {
  try {
    const admin = createAdminClient() as any;
    await admin.from('email_logs').insert(insert);
  } catch {
    // Audit logging must never break email delivery.
  }
}

/**
 * Send a transactional email and persist the attempt in `email_logs`.
 * Returns ok=false (never throws) so callers can fail gracefully.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const provider = resolveProvider();
  const from = process.env.EMAIL_FROM ?? 'AfriBook <no-reply@afribook.com>';
  const now = new Date().toISOString();

  if (provider === 'console') {
    console.log(`[email:console] to=${params.to} subject="${params.subject}"`);
    await logEmail({
      user_id: params.userId ?? null,
      recipient: params.to,
      subject: params.subject,
      template: params.template ?? null,
      provider: 'console',
      status: 'queued',
      message_id: null,
      error: null,
      metadata: params.metadata ?? {},
      sent_at: now,
    });
    return { ok: true, provider };
  }

  const { messageId, error } = await deliver(provider, from, params);

  await logEmail({
    user_id: params.userId ?? null,
    recipient: params.to,
    subject: params.subject,
    template: params.template ?? null,
    provider,
    status: error ? 'failed' : 'sent',
    message_id: messageId ?? null,
    error: error ?? null,
    metadata: params.metadata ?? {},
    sent_at: now,
  });

  return error ? { ok: false, provider, error } : { ok: true, provider, messageId };
}
