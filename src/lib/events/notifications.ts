import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  TicketPurchase,
  NotificationPayload,
  NotificationChannel,
  NotificationType,
} from '@/types/events';

// ─── Types ────────────────────────────────────────────────────

export type { NotificationPayload, NotificationChannel, NotificationType };

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

async function logNotification(
  sb: SupabaseClient,
  payload: NotificationPayload,
  refs: { eventId?: string; registrationId?: string; status?: 'queued' | 'sent' | 'delivered' | 'failed' },
): Promise<void> {
  await sb.from('notification_logs').insert({
    event_id: refs.eventId ?? null,
    registration_id: refs.registrationId ?? null,
    recipient_email: payload.recipientEmail ?? null,
    recipient_phone: payload.recipientPhone ?? null,
    channel: payload.channel,
    type: payload.type,
    status: refs.status ?? 'queued',
    payload,
    created_at: new Date().toISOString(),
  });
}

// ─── Registration Confirmation ────────────────────────────────

export async function sendRegistrationConfirmation(
  sb: SupabaseClient,
  registration: TicketPurchase,
  event: { title: string; startDate: string; venueName?: string; currencyCode: string },
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];

  // Email notification
  const emailBody = `Hi ${registration.buyerName},\n\n` +
    `Your registration for "${event.title}" is confirmed!\n\n` +
    `Date: ${new Date(event.startDate).toLocaleDateString()}\n` +
    `Venue: ${event.venueName ?? 'Virtual Event'}\n` +
    `Tickets: ${registration.quantity}\n` +
    `Total: ${formatCurrency(registration.total, event.currencyCode)}\n\n` +
    `Ticket Code: ${registration.ticketCode}\n\n` +
    `Present your QR code at the entrance for check-in.\n\n` +
    `See you there!\n- AfriBook Team`;

  const emailPayload: NotificationPayload = {
    channel: 'email',
    type: 'registration_confirmation',
    recipientEmail: registration.buyerEmail,
    subject: `Registration Confirmed: ${event.title}`,
    body: emailBody,
    metadata: {
      registrationId: registration.id,
      eventId: registration.eventId,
      ticketCode: registration.ticketCode,
    },
  };

  notifications.push(emailPayload);
  await logNotification(sb, emailPayload, { eventId: registration.eventId, registrationId: registration.id });

  // SMS notification
  if (registration.buyerPhone) {
    const smsBody = `AfriBook: Your ticket for "${event.title}" is confirmed! ` +
      `Code: ${registration.ticketCode}. ` +
      `${new Date(event.startDate).toLocaleDateString()} at ${event.venueName ?? 'Virtual'}. ` +
      `Show QR code at entrance.`;

    const smsPayload: NotificationPayload = {
      channel: 'sms',
      type: 'registration_confirmation',
      recipientPhone: registration.buyerPhone,
      body: smsBody,
      metadata: {
        registrationId: registration.id,
        eventId: registration.eventId,
      },
    };

    notifications.push(smsPayload);
    await logNotification(sb, smsPayload, { eventId: registration.eventId, registrationId: registration.id });
  }

  // WhatsApp notification
  if (registration.buyerPhone) {
    const whatsappBody = `Hi ${registration.buyerName}! Your ticket for "${event.title}" is confirmed. ` +
      `Ticket code: ${registration.ticketCode}. ` +
      `Date: ${new Date(event.startDate).toLocaleDateString()}. ` +
      `See you there!`;

    const whatsappPayload: NotificationPayload = {
      channel: 'whatsapp',
      type: 'registration_confirmation',
      recipientPhone: registration.buyerPhone,
      body: whatsappBody,
      metadata: {
        registrationId: registration.id,
        eventId: registration.eventId,
      },
    };

    notifications.push(whatsappPayload);
    await logNotification(sb, whatsappPayload, { eventId: registration.eventId, registrationId: registration.id });
  }

  return notifications;
}

// ─── Event Reminder ───────────────────────────────────────────

export async function sendEventReminder(
  sb: SupabaseClient,
  registration: TicketPurchase,
  event: { title: string; startDate: string; venueName?: string; venueAddress?: string },
  reminderType: '24h' | '1h',
): Promise<NotificationPayload> {
  const timeLabel = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
  const emoji = reminderType === '24h' ? '📅' : '⏰';

  const body = `${emoji} Reminder: "${event.title}" is ${timeLabel}!\n\n` +
    `Date: ${new Date(event.startDate).toLocaleDateString()}\n` +
    `Time: ${new Date(event.startDate).toLocaleTimeString()}\n` +
    `Venue: ${event.venueName ?? 'Virtual Event'}\n` +
    `${event.venueAddress ? `Address: ${event.venueAddress}\n` : ''}` +
    `\nTicket Code: ${registration.ticketCode}\n` +
    `Don't forget to bring your QR code!\n\n` +
    `See you there! - AfriBook`;

  const payload: NotificationPayload = {
    channel: 'email',
    type: reminderType === '24h' ? 'event_reminder_24h' : 'event_reminder_1h',
    recipientEmail: registration.buyerEmail,
    subject: `${reminderType === '24h' ? 'Tomorrow' : 'Starting Soon'}: ${event.title}`,
    body,
    metadata: {
      registrationId: registration.id,
      eventId: registration.eventId,
      reminderType,
    },
  };

  await logNotification(sb, payload, { eventId: registration.eventId, registrationId: registration.id });

  return payload;
}

// ─── Event Update Notification ────────────────────────────────

export async function sendEventUpdate(
  sb: SupabaseClient,
  event: { id: string; title: string },
  updateMessage: string,
): Promise<{ notificationsSent: number }> {
  // Get all confirmed registrations for this event
  const { data: registrations } = await sb
    .from('ticket_purchases')
    .select('buyer_name, buyer_email, buyer_phone')
    .eq('event_id', event.id)
    .eq('order_status', 'confirmed');

  if (!registrations || registrations.length === 0) {
    return { notificationsSent: 0 };
  }

  let count = 0;

  for (const reg of registrations) {
    const body = `Update for "${event.title}":\n\n${updateMessage}\n\n- AfriBook`;

    const payload: NotificationPayload = {
      channel: 'email',
      type: 'event_update',
      recipientEmail: reg.buyer_email,
      subject: `Update: ${event.title}`,
      body,
      metadata: { eventId: event.id },
    };

    await logNotification(sb, payload, { eventId: event.id });

    count++;
  }

  return { notificationsSent: count };
}

// ─── Refund Confirmation ──────────────────────────────────────

export async function sendRefundConfirmation(
  sb: SupabaseClient,
  registration: TicketPurchase,
  event: { title: string },
  refundAmount: number,
): Promise<NotificationPayload> {
  const body = `Hi ${registration.buyerName},\n\n` +
    `Your refund for "${event.title}" has been processed.\n\n` +
    `Refund Amount: ${formatCurrency(refundAmount, registration.currencyCode)}\n` +
    `Original Amount: ${formatCurrency(registration.total, registration.currencyCode)}\n\n` +
    `The refund will appear on your statement within 5-10 business days.\n\n` +
    `- AfriBook Team`;

  const payload: NotificationPayload = {
    channel: 'email',
    type: 'refund_confirmation',
    recipientEmail: registration.buyerEmail,
    subject: `Refund Processed: ${event.title}`,
    body,
    metadata: {
      registrationId: registration.id,
      eventId: registration.eventId,
      refundAmount,
    },
  };

  await logNotification(sb, payload, { eventId: registration.eventId, registrationId: registration.id });

  return payload;
}

// ─── Check-In Confirmation ────────────────────────────────────

export async function sendCheckInConfirmation(
  sb: SupabaseClient,
  ticket: { ticketCode: string; attendeeName: string; attendeeEmail: string; ticketType: string },
  event: { id: string; title: string; venueName?: string },
): Promise<NotificationPayload> {
  const body = `Welcome, ${ticket.attendeeName}! 🎉\n\n` +
    `You've been checked in to "${event.title}".\n` +
    `Ticket Type: ${ticket.ticketType}\n\n` +
    `Enjoy the event!\n- AfriBook Team`;

  const payload: NotificationPayload = {
    channel: 'email',
    type: 'check_in_confirmation',
    recipientEmail: ticket.attendeeEmail,
    subject: `Welcome to ${event.title}!`,
    body,
    metadata: {
      ticketCode: ticket.ticketCode,
      eventId: event.id,
    },
  };

  await logNotification(sb, payload, { eventId: event.id });

  return payload;
}

// ─── Invitation Email ─────────────────────────────────────────

export async function sendInvitationEmail(
  sb: SupabaseClient,
  invitation: {
    id: string;
    eventId: string;
    inviteeEmail: string;
    inviterName: string;
    personalMessage?: string;
  },
  event: {
    title: string;
    description: string;
    startDate: string;
    venueName?: string;
    slug: string;
  },
): Promise<NotificationPayload> {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const eventUrl = `${origin}/events/${event.slug}`;

  const body = `${invitation.inviterName} invited you to "${event.title}"!\n\n` +
    `${event.description.slice(0, 200)}...\n\n` +
    `Date: ${new Date(event.startDate).toLocaleDateString()}\n` +
    `Venue: ${event.venueName ?? 'Virtual Event'}\n\n` +
    `${invitation.personalMessage ? `"${invitation.personalMessage}"\n\n` : ''}` +
    `Get your tickets: ${eventUrl}\n\n` +
    `- AfriBook`;

  const payload: NotificationPayload = {
    channel: 'email',
    type: 'invitation_email',
    recipientEmail: invitation.inviteeEmail,
    subject: `${invitation.inviterName} invited you: ${event.title}`,
    body,
    metadata: {
      invitationId: invitation.id,
      eventId: invitation.eventId,
    },
  };

  await logNotification(sb, payload, { eventId: invitation.eventId });

  return payload;
}

// ─── Invitation SMS ───────────────────────────────────────────

export async function sendInvitationSMS(
  sb: SupabaseClient,
  invitation: {
    id: string;
    eventId: string;
    inviteePhone: string;
    inviterName: string;
  },
  event: {
    title: string;
    startDate: string;
    venueName?: string;
    slug: string;
  },
): Promise<NotificationPayload> {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const eventUrl = `${origin}/events/${event.slug}`;

  const body = `${invitation.inviterName} invited you to "${event.title}"! ` +
    `${new Date(event.startDate).toLocaleDateString()} at ${event.venueName ?? 'Virtual'}. ` +
    `Get tickets: ${eventUrl}`;

  const payload: NotificationPayload = {
    channel: 'sms',
    type: 'invitation_sms',
    recipientPhone: invitation.inviteePhone,
    body,
    metadata: {
      invitationId: invitation.id,
      eventId: invitation.eventId,
    },
  };

  await logNotification(sb, payload, { eventId: invitation.eventId });

  return payload;
}

// ─── Host Notification ────────────────────────────────────────

export async function sendHostNotification(
  sb: SupabaseClient,
  event: { id: string; title: string; organizerEmail: string; organizerName: string },
  stats: {
    type: 'milestone' | 'sold_out' | 'first_registration' | 'event_starting';
    message: string;
    ticketsSold?: number;
    revenue?: number;
  },
): Promise<NotificationPayload> {
  let subject: string;
  let body: string;

  switch (stats.type) {
    case 'milestone':
      subject = `Milestone: ${stats.ticketsSold} tickets sold for "${event.title}"`;
      body = `Great news, ${event.organizerName}! 🎉\n\n` +
        `"${event.title}" has reached ${stats.ticketsSold} tickets sold!\n` +
        `Revenue: ${formatCurrency(stats.revenue ?? 0)}\n\n` +
        `Keep promoting your event!\n- AfriBook`;
      break;

    case 'sold_out':
      subject = `Sold Out: "${event.title}"`;
      body = `Congratulations, ${event.organizerName}! 🎊\n\n` +
        `"${event.title}" is now SOLD OUT!\n` +
        `Total tickets: ${stats.ticketsSold}\n` +
        `Total revenue: ${formatCurrency(stats.revenue ?? 0)}\n\n` +
        `- AfriBook`;
      break;

    case 'first_registration':
      subject = `First ticket sold: "${event.title}"`;
      body = `Exciting news, ${event.organizerName}! 🎟️\n\n` +
        `"${event.title}" just received its first registration!\n\n` +
        `- AfriBook`;
      break;

    case 'event_starting':
      subject = `Starting now: "${event.title}"`;
      body = `Hi ${event.organizerName},\n\n` +
        `"${event.title}" is starting now!\n` +
        `Don't forget to check in your attendees.\n\n` +
        `- AfriBook`;
      break;
  }

  const payload: NotificationPayload = {
    channel: 'email',
    type: 'host_notification',
    recipientEmail: event.organizerEmail,
    subject,
    body,
    metadata: {
      eventId: event.id,
      notificationType: stats.type,
    },
  };

  await logNotification(sb, payload, { eventId: event.id });

  return payload;
}
