import type { SupabaseClient } from '@supabase/supabase-js';
import type { ShareChannel, EventInvitation } from '@/types/events';

// ─── Types ────────────────────────────────────────────────────

export interface ShareLink {
  channel: ShareChannel;
  url: string;
  text: string;
  imageUrl?: string;
}

export interface ShareLinksResult {
  facebook: ShareLink;
  twitter: ShareLink;
  whatsapp: ShareLink;
  linkedin: ShareLink;
  sms: ShareLink;
  email: ShareLink;
  copyLink: ShareLink;
}

export interface InvitationStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalAccepted: number;
  totalDeclined: number;
  conversionRate: number;
  byChannel: { channel: ShareChannel; sent: number; accepted: number }[];
}

// ─── Generate Share Links ─────────────────────────────────────

export function generateShareLinks(
  eventId: string,
  eventSlug: string,
  eventTitle: string,
  eventDescription?: string,
): ShareLinksResult {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const eventUrl = `${origin}/events/${eventSlug}`;
  const text = `Check out "${eventTitle}" on AfriBook!`;
  const longText = eventDescription
    ? `${text} ${eventDescription.slice(0, 100)}...`
    : text;

  return {
    facebook: {
      channel: 'facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(text)}`,
      text,
    },
    twitter: {
      channel: 'twitter',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(text)}`,
      text,
    },
    whatsapp: {
      channel: 'whatsapp',
      url: `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${eventUrl}`)}`,
      text: `${text}\n\n${eventUrl}`,
    },
    linkedin: {
      channel: 'linkedin',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
      text,
    },
    sms: {
      channel: 'sms',
      url: `sms:?body=${encodeURIComponent(`${text}\n${eventUrl}`)}`,
      text: `${text}\n${eventUrl}`,
    },
    email: {
      channel: 'email',
      url: `mailto:?subject=${encodeURIComponent(`You're invited: ${eventTitle}`)}&body=${encodeURIComponent(`${longText}\n\n${eventUrl}`)}`,
      text: longText,
    },
    copyLink: {
      channel: 'copy_link',
      url: eventUrl,
      text: eventUrl,
    },
  };
}

// ─── Track Share ──────────────────────────────────────────────

export async function trackShare(
  sb: SupabaseClient,
  eventId: string,
  platform: ShareChannel,
  userId?: string,
): Promise<void> {
  const now = new Date().toISOString();

  // Log the share event
  await sb.from('event_shares').insert({
    event_id: eventId,
    user_id: userId ?? null,
    channel: platform,
    url: '',
    metadata: {},
    created_at: now,
  });

  // Increment share count on event
  await sb.rpc('increment_event_share_count', {
    p_event_id: eventId,
  });
}

// ─── Create Invitation ────────────────────────────────────────

export async function createInvitation(
  sb: SupabaseClient,
  params: {
    eventId: string;
    inviterId: string;
    inviterName: string;
    inviteeEmail: string;
    inviteePhone?: string;
    channel: ShareChannel;
    personalMessage?: string;
  },
): Promise<EventInvitation> {
  const now = new Date().toISOString();

  const invitation = {
    event_id: params.eventId,
    inviter_id: params.inviterId,
    inviter_name: params.inviterName,
    invitee_email: params.inviteeEmail,
    invitee_phone: params.inviteePhone ?? null,
    channel: params.channel,
    status: 'pending' as const,
    personal_message: params.personalMessage ?? null,
    sent_at: null,
    delivered_at: null,
    opened_at: null,
    accepted_at: null,
    created_at: now,
  };

  const { data, error } = await sb
    .from('event_invitations')
    .insert(invitation)
    .select()
    .single();

  if (error) throw new Error(`Failed to create invitation: ${error.message}`);

  return {
    id: data.id,
    eventId: data.event_id,
    inviterId: data.inviter_id,
    inviterName: data.inviter_name,
    inviteeEmail: data.invitee_email,
    inviteePhone: data.invitee_phone,
    channel: data.channel,
    status: data.status,
    personalMessage: data.personal_message,
    sentAt: data.sent_at,
    deliveredAt: data.delivered_at,
    openedAt: data.opened_at,
    acceptedAt: data.accepted_at,
    createdAt: data.created_at,
  };
}

// ─── Send Bulk Invitations ────────────────────────────────────

export async function sendBulkInvitations(
  sb: SupabaseClient,
  eventId: string,
  inviterId: string,
  recipients: {
    email: string;
    phone?: string;
    name?: string;
    personalMessage?: string;
  }[],
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Get inviter info
  const { data: inviter } = await sb
    .from('profiles')
    .select('full_name, email')
    .eq('id', inviterId)
    .single();

  const inviterName = inviter?.full_name ?? inviter?.email ?? 'Someone';

  for (const recipient of recipients) {
    try {
      await createInvitation(sb, {
        eventId,
        inviterId,
        inviterName,
        inviteeEmail: recipient.email,
        inviteePhone: recipient.phone,
        channel: recipient.phone ? 'whatsapp' : 'email',
        personalMessage: recipient.personalMessage,
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push(
        `Failed to invite ${recipient.email}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  return { sent, failed, errors };
}

// ─── Get Invitation Stats ─────────────────────────────────────

export async function getInvitationStats(
  sb: SupabaseClient,
  eventId: string,
): Promise<InvitationStats> {
  const { data: invitations, error } = await sb
    .from('event_invitations')
    .select('channel, status')
    .eq('event_id', eventId);

  if (error) throw new Error(`Failed to get invitation stats: ${error.message}`);

  const all = invitations ?? [];
  const totalSent = all.filter((i) => ['sent', 'delivered', 'opened', 'accepted', 'declined'].includes(i.status)).length;
  const totalDelivered = all.filter((i) => ['delivered', 'opened', 'accepted', 'declined'].includes(i.status)).length;
  const totalOpened = all.filter((i) => ['opened', 'accepted', 'declined'].includes(i.status)).length;
  const totalAccepted = all.filter((i) => i.status === 'accepted').length;
  const totalDeclined = all.filter((i) => i.status === 'declined').length;

  const conversionRate = totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0;

  const channels: ShareChannel[] = ['email', 'whatsapp', 'sms', 'facebook', 'twitter', 'linkedin'];
  const byChannel = channels
    .map((channel) => {
      const channelInvites = all.filter((i) => i.channel === channel);
      return {
        channel,
        sent: channelInvites.filter((i) =>
          ['sent', 'delivered', 'opened', 'accepted', 'declined'].includes(i.status),
        ).length,
        accepted: channelInvites.filter((i) => i.status === 'accepted').length,
      };
    })
    .filter((c) => c.sent > 0);

  return {
    totalSent,
    totalDelivered,
    totalOpened,
    totalAccepted,
    totalDeclined,
    conversionRate: Math.round(conversionRate * 100) / 100,
    byChannel,
  };
}

// ─── Referral Code ────────────────────────────────────────────

export async function getReferralCode(
  sb: SupabaseClient,
  userId: string,
  eventId: string,
): Promise<string> {
  // Check if user already has a referral code for this event
  const { data: existing } = await sb
    .from('event_referrals')
    .select('code')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .single();

  if (existing) return existing.code;

  // Generate new referral code
  const code = `${userId.slice(0, 4)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

  const { error } = await sb.from('event_referrals').insert({
    user_id: userId,
    event_id: eventId,
    code,
    uses: 0,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to create referral code: ${error.message}`);
  return code;
}

// ─── Apply Referral Discount ──────────────────────────────────

export async function applyReferralDiscount(
  sb: SupabaseClient,
  referralCode: string,
  originalPrice: number,
): Promise<{ valid: boolean; discount: number; newPrice: number; error?: string }> {
  const { data: referral, error } = await sb
    .from('event_referrals')
    .select('*, events!inner(referral_discount_percent)')
    .eq('code', referralCode)
    .single();

  if (error || !referral) {
    return { valid: false, discount: 0, newPrice: originalPrice, error: 'Invalid referral code' };
  }

  const discountPercent = referral.events.referral_discount_percent ?? 10;
  const discount = Math.round(originalPrice * (discountPercent / 100) * 100) / 100;
  const newPrice = Math.max(0, originalPrice - discount);

  // Track the referral use
  await sb
    .from('event_referrals')
    .update({ uses: referral.uses + 1 })
    .eq('id', referral.id);

  return { valid: true, discount, newPrice };
}

// ─── WhatsApp Invite Link ─────────────────────────────────────

export function generateWhatsAppInviteLink(
  eventId: string,
  eventSlug: string,
  eventTitle: string,
  customMessage?: string,
): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const eventUrl = `${origin}/events/${eventSlug}`;
  const message = customMessage
    ? `${customMessage}\n\n${eventTitle}\n${eventUrl}`
    : `You're invited to "${eventTitle}"!\n\n${eventUrl}\n\nGet your tickets on AfriBook`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// ─── SMS Text Generation ──────────────────────────────────────

export function generateSMSText(params: {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  eventUrl: string;
  personalMessage?: string;
  inviterName?: string;
}): string {
  const parts: string[] = [];

  if (params.personalMessage) {
    parts.push(params.personalMessage);
    parts.push('');
  }

  if (params.inviterName) {
    parts.push(`${params.inviterName} invited you to:`);
  }

  parts.push(`🎟️ ${params.eventTitle}`);
  parts.push(`📅 ${params.eventDate} at ${params.eventTime}`);
  parts.push(`📍 ${params.venue}`);
  parts.push('');
  parts.push(`Get tickets: ${params.eventUrl}`);
  parts.push('');
  parts.push('Powered by AfriBook');

  return parts.join('\n');
}

// ─── Email Invite HTML ────────────────────────────────────────

export function generateEmailInviteHTML(params: {
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  coverImageUrl?: string;
  eventUrl: string;
  inviterName: string;
  personalMessage?: string;
}): string {
  const hasImage = !!params.coverImageUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited: ${params.eventTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
    ${hasImage ? `
    <tr>
      <td>
        <img src="${escapeHTML(params.coverImageUrl!)}" alt="${escapeHTML(params.eventTitle)}"
          style="width:100%;height:240px;object-fit:cover;display:block;" />
      </td>
    </tr>` : `
    <tr>
      <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 24px;text-align:center;">
        <h1 style="color:#fff;font-size:14px;margin:0;font-weight:600;letter-spacing:1px;">AFRIBOOK</h1>
      </td>
    </tr>`}

    <tr>
      <td style="padding:32px 24px;">
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">${escapeHTML(params.inviterName)} invited you to</p>
        <h2 style="color:#1a1a2e;font-size:24px;font-weight:700;margin:0 0 20px;">${escapeHTML(params.eventTitle)}</h2>

        ${params.personalMessage ? `
        <div style="background:#f8f9fa;border-left:3px solid #667eea;padding:12px 16px;margin-bottom:24px;border-radius:0 8px 8px 0;">
          <p style="color:#374151;font-size:14px;font-style:italic;margin:0;">"${escapeHTML(params.personalMessage)}"</p>
        </div>` : ''}

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #f0f2f5;">
              <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Date</span><br/>
              <span style="color:#1a1a2e;font-size:14px;font-weight:500;">${escapeHTML(params.eventDate)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #f0f2f5;">
              <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Time</span><br/>
              <span style="color:#1a1a2e;font-size:14px;font-weight:500;">${escapeHTML(params.eventTime)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Venue</span><br/>
              <span style="color:#1a1a2e;font-size:14px;font-weight:500;">${escapeHTML(params.venue)}</span>
            </td>
          </tr>
        </table>

        ${params.eventDescription ? `
        <p style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:24px;">
          ${escapeHTML(params.eventDescription.slice(0, 300))}${params.eventDescription.length > 300 ? '...' : ''}
        </p>` : ''}

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding:16px 0;">
              <a href="${escapeHTML(params.eventUrl)}"
                style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                Get Tickets
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:16px 24px;background:#f8f9fa;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">
          Powered by <a href="https://afribook.app" style="color:#667eea;text-decoration:none;">AfriBook</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helpers ──────────────────────────────────────────────────

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
