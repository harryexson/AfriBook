import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckInResult, CheckInStats } from './types';

// ─── Check In Attendee ────────────────────────────────────────

export async function checkInAttendee(
  sb: SupabaseClient,
  ticketCode: string,
  eventId: string,
  checkedInBy: string,
  method: 'qr_scan' | 'manual' | 'nfc' = 'qr_scan',
): Promise<CheckInResult> {
  // 1. Find the ticket
  const { data: ticket, error: ticketError } = await sb
    .from('event_individual_tickets')
    .select('*')
    .eq('ticket_code', ticketCode)
    .eq('event_id', eventId)
    .single();

  if (ticketError || !ticket) {
    return {
      success: false,
      ticketCode,
      attendeeName: '',
      attendeeEmail: '',
      ticketType: '',
      checkedInAt: '',
      isGuest: false,
      error: 'Ticket not found',
    };
  }

  // 2. Check ticket status
  if (ticket.check_in_status === 'checked_in') {
    return {
      success: false,
      ticketCode,
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
      ticketType: ticket.ticket_type,
      checkedInAt: ticket.checked_in_at ?? '',
      isGuest: false,
      error: 'Ticket already checked in',
    };
  }

  if (ticket.check_in_status === 'cancelled') {
    return {
      success: false,
      ticketCode,
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
      ticketType: ticket.ticket_type,
      checkedInAt: '',
      isGuest: false,
      error: 'Ticket has been cancelled',
    };
  }

  // 3. Verify event is active
  const { data: event } = await sb
    .from('events')
    .select('status, start_date, end_date')
    .eq('id', eventId)
    .single();

  if (event && event.status !== 'published' && event.status !== 'completed') {
    return {
      success: false,
      ticketCode,
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
      ticketType: ticket.ticket_type,
      checkedInAt: '',
      isGuest: false,
      error: 'Event is not active',
    };
  }

  const now = new Date().toISOString();

  // 4. Mark ticket as checked in
  const { error: updateError } = await sb
    .from('event_individual_tickets')
    .update({
      check_in_status: 'checked_in',
      checked_in_at: now,
      checked_in_by: checkedInBy,
    })
    .eq('id', ticket.id);

  if (updateError) {
    throw new Error(`Failed to check in: ${updateError.message}`);
  }

  // 5. Update parent registration check-in status
  if (ticket.registration_id) {
    await sb
      .from('ticket_purchases')
      .update({
        check_in_status: 'checked_in',
        checked_in_at: now,
      })
      .eq('id', ticket.registration_id);
  }

  // 6. Log check-in record
  await sb.from('check_in_logs').insert({
    event_id: eventId,
    ticket_purchase_id: ticket.registration_id ?? null,
    ticket_individual_id: ticket.id,
    scanned_by: checkedInBy,
    scanned_at: now,
    method,
    ticket_code: ticketCode,
  });

  return {
    success: true,
    ticketCode,
    attendeeName: ticket.attendee_name,
    attendeeEmail: ticket.attendee_email,
    ticketType: ticket.ticket_type,
    checkedInAt: now,
    isGuest: false,
  };
}

// ─── Check In Guest ───────────────────────────────────────────

export async function checkInGuest(
  sb: SupabaseClient,
  guestId: string,
  eventId: string,
  checkedInBy: string,
): Promise<CheckInResult> {
  const { data: guest, error: guestError } = await sb
    .from('event_guests')
    .select('*')
    .eq('id', guestId)
    .eq('event_id', eventId)
    .single();

  if (guestError || !guest) {
    return {
      success: false,
      ticketCode: '',
      attendeeName: '',
      attendeeEmail: '',
      ticketType: 'Guest',
      checkedInAt: '',
      isGuest: true,
      error: 'Guest not found',
    };
  }

  if (guest.check_in_status === 'checked_in') {
    return {
      success: false,
      ticketCode: guest.ticket_code,
      attendeeName: guest.guest_name,
      attendeeEmail: guest.guest_email,
      ticketType: 'Guest',
      checkedInAt: guest.checked_in_at ?? '',
      isGuest: true,
      error: 'Guest already checked in',
    };
  }

  if (guest.check_in_status === 'cancelled') {
    return {
      success: false,
      ticketCode: guest.ticket_code,
      attendeeName: guest.guest_name,
      attendeeEmail: guest.guest_email,
      ticketType: 'Guest',
      checkedInAt: '',
      isGuest: true,
      error: 'Guest registration cancelled',
    };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await sb
    .from('event_guests')
    .update({
      check_in_status: 'checked_in',
      checked_in_at: now,
      checked_in_by: checkedInBy,
    })
    .eq('id', guestId);

  if (updateError) {
    throw new Error(`Failed to check in guest: ${updateError.message}`);
  }

  // Log check-in
  await sb.from('check_in_logs').insert({
    event_id: eventId,
    ticket_purchase_id: guest.ticket_purchase_id,
    guest_id: guestId,
    scanned_by: checkedInBy,
    scanned_at: now,
    method: 'manual',
    ticket_code: guest.ticket_code,
  });

  return {
    success: true,
    ticketCode: guest.ticket_code,
    attendeeName: guest.guest_name,
    attendeeEmail: guest.guest_email,
    ticketType: 'Guest',
    checkedInAt: now,
    isGuest: true,
  };
}

// ─── Undo Check-In ────────────────────────────────────────────

export async function undoCheckIn(
  sb: SupabaseClient,
  ticketCode: string,
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  // Find the individual ticket
  const { data: ticket, error: ticketError } = await sb
    .from('event_individual_tickets')
    .select('*')
    .eq('ticket_code', ticketCode)
    .eq('event_id', eventId)
    .single();

  if (ticketError || !ticket) {
    return { success: false, error: 'Ticket not found' };
  }

  if (ticket.check_in_status !== 'checked_in') {
    return { success: false, error: 'Ticket is not checked in' };
  }

  // Reset check-in status
  const { error: updateError } = await sb
    .from('event_individual_tickets')
    .update({
      check_in_status: 'not_checked_in',
      checked_in_at: null,
      checked_in_by: null,
    })
    .eq('id', ticket.id);

  if (updateError) {
    throw new Error(`Failed to undo check-in: ${updateError.message}`);
  }

  // Update parent registration if applicable
  if (ticket.registration_id) {
    // Check if any other tickets from this registration are still checked in
    const { data: otherTickets } = await sb
      .from('event_individual_tickets')
      .select('id')
      .eq('registration_id', ticket.registration_id)
      .eq('check_in_status', 'checked_in')
      .neq('id', ticket.id);

    if (!otherTickets || otherTickets.length === 0) {
      await sb
        .from('ticket_purchases')
        .update({
          check_in_status: 'not_checked_in',
          checked_in_at: null,
        })
        .eq('id', ticket.registration_id);
    }
  }

  // Log undo
  await sb.from('check_in_logs').insert({
    event_id: eventId,
    ticket_purchase_id: ticket.registration_id ?? null,
    ticket_individual_id: ticket.id,
    scanned_by: 'system',
    scanned_at: new Date().toISOString(),
    method: 'manual',
    ticket_code: ticketCode,
    action: 'undo',
  });

  return { success: true };
}

// ─── Check-In Statistics ──────────────────────────────────────

export async function getCheckInStats(
  sb: SupabaseClient,
  eventId: string,
): Promise<CheckInStats & { tierBreakdown: { tier: string; total: number; checkedIn: number }[] }> {
  // Get all individual tickets for this event
  const { data: tickets, error: ticketError } = await sb
    .from('event_individual_tickets')
    .select('ticket_type, check_in_status')
    .eq('event_id', eventId);

  if (ticketError) throw new Error(`Failed to get check-in stats: ${ticketError.message}`);

  const allTickets = tickets ?? [];
  const totalExpected = allTickets.length;
  const totalCheckedIn = allTickets.filter((t) => t.check_in_status === 'checked_in').length;
  const noShows = allTickets.filter((t) => t.check_in_status === 'no_show').length;
  // Get check-in timeline
  const { data: logs } = await sb
    .from('check_in_logs')
    .select('scanned_at')
    .eq('event_id', eventId)
    .eq('action', null)
    .order('scanned_at', { ascending: true });

  const hourCounts: Record<string, number> = {};
  for (const log of logs ?? []) {
    const hour = new Date(log.scanned_at).toISOString().slice(0, 13);
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }

  const timeline = Object.entries(hourCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }));

  // Peak check-in time
  const peakEntry = timeline.reduce(
    (peak, entry) => (entry.count > peak.count ? entry : peak),
    { hour: '', count: 0 },
  );

  // Tier breakdown
  const tierMap: Record<string, { total: number; checkedIn: number }> = {};
  for (const ticket of allTickets) {
    const tier = ticket.ticket_type ?? 'Unknown';
    if (!tierMap[tier]) tierMap[tier] = { total: 0, checkedIn: 0 };
    tierMap[tier].total++;
    if (ticket.check_in_status === 'checked_in') {
      tierMap[tier].checkedIn++;
    }
  }

  const tierBreakdown = Object.entries(tierMap).map(([tier, counts]) => ({
    tier,
    ...counts,
  }));

  // Also count guests
  const { data: guests } = await sb
    .from('event_guests')
    .select('check_in_status')
    .eq('event_id', eventId);

  const guestTotal = (guests ?? []).length;
  const guestCheckedIn = (guests ?? []).filter(
    (g) => g.check_in_status === 'checked_in',
  ).length;

  return {
    totalExpected: totalExpected + guestTotal,
    totalCheckedIn: totalCheckedIn + guestCheckedIn,
    noShows,
    checkInRate:
      (totalExpected + guestTotal) > 0
        ? ((totalCheckedIn + guestCheckedIn) / (totalExpected + guestTotal)) * 100
        : 0,
    timeline,
    peakCheckInTime: peakEntry.hour,
    peakCheckInCount: peakEntry.count,
    tierBreakdown: [
      ...tierBreakdown,
      ...(guestTotal > 0
        ? [{ tier: 'Guest', total: guestTotal, checkedIn: guestCheckedIn }]
        : []),
    ],
  } as CheckInStats & { tierBreakdown: { tier: string; total: number; checkedIn: number }[] };
}

// ─── Get Checked-In Attendees ─────────────────────────────────

export async function getCheckedInAttendees(
  sb: SupabaseClient,
  eventId: string,
): Promise<{ name: string; email: string; ticketType: string; checkedInAt: string; isGuest: boolean }[]> {
  const { data: tickets } = await sb
    .from('event_individual_tickets')
    .select('attendee_name, attendee_email, ticket_type, checked_in_at')
    .eq('event_id', eventId)
    .eq('check_in_status', 'checked_in')
    .order('checked_in_at', { ascending: true });

  const { data: guests } = await sb
    .from('event_guests')
    .select('guest_name, guest_email, checked_in_at')
    .eq('event_id', eventId)
    .eq('check_in_status', 'checked_in')
    .order('checked_in_at', { ascending: true });

  const attendees = [
    ...(tickets ?? []).map((t) => ({
      name: t.attendee_name,
      email: t.attendee_email,
      ticketType: t.ticket_type,
      checkedInAt: t.checked_in_at ?? '',
      isGuest: false,
    })),
    ...(guests ?? []).map((g) => ({
      name: g.guest_name,
      email: g.guest_email,
      ticketType: 'Guest',
      checkedInAt: g.checked_in_at ?? '',
      isGuest: true,
    })),
  ];

  return attendees.sort((a, b) =>
    new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime(),
  );
}

// ─── Get Not-Checked-In Attendees ─────────────────────────────

export async function getNotCheckedInAttendees(
  sb: SupabaseClient,
  eventId: string,
): Promise<{ name: string; email: string; ticketType: string; ticketCode: string; isGuest: boolean; guestId?: string }[]> {
  const { data: tickets } = await sb
    .from('event_individual_tickets')
    .select('attendee_name, attendee_email, ticket_type, ticket_code')
    .eq('event_id', eventId)
    .eq('check_in_status', 'not_checked_in');

  const { data: guests } = await sb
    .from('event_guests')
    .select('id, guest_name, guest_email, ticket_code')
    .eq('event_id', eventId)
    .eq('check_in_status', 'not_checked_in');

  return [
    ...(tickets ?? []).map((t) => ({
      name: t.attendee_name,
      email: t.attendee_email,
      ticketType: t.ticket_type,
      ticketCode: t.ticket_code,
      isGuest: false,
    })),
    ...(guests ?? []).map((g) => ({
      name: g.guest_name,
      email: g.guest_email,
      ticketType: 'Guest',
      ticketCode: g.ticket_code,
      isGuest: true,
      guestId: g.id,
    })),
  ];
}

// ─── Validate Check-In (Quick) ────────────────────────────────

export async function validateCheckIn(
  sb: SupabaseClient,
  ticketCode: string,
  eventId: string,
): Promise<{ valid: boolean; attendeeName?: string; ticketType?: string; alreadyCheckedIn?: boolean; error?: string }> {
  // Check individual tickets
  const { data: ticket } = await sb
    .from('event_individual_tickets')
    .select('attendee_name, ticket_type, check_in_status')
    .eq('ticket_code', ticketCode)
    .eq('event_id', eventId)
    .single();

  if (ticket) {
    if (ticket.check_in_status === 'checked_in') {
      return {
        valid: false,
        attendeeName: ticket.attendee_name,
        ticketType: ticket.ticket_type,
        alreadyCheckedIn: true,
        error: 'Already checked in',
      };
    }
    if (ticket.check_in_status === 'cancelled') {
      return { valid: false, error: 'Ticket cancelled' };
    }
    return {
      valid: true,
      attendeeName: ticket.attendee_name,
      ticketType: ticket.ticket_type,
    };
  }

  // Check guests
  const { data: guest } = await sb
    .from('event_guests')
    .select('guest_name, check_in_status')
    .eq('ticket_code', ticketCode)
    .eq('event_id', eventId)
    .single();

  if (guest) {
    if (guest.check_in_status === 'checked_in') {
      return {
        valid: false,
        attendeeName: guest.guest_name,
        ticketType: 'Guest',
        alreadyCheckedIn: true,
        error: 'Already checked in',
      };
    }
    return {
      valid: true,
      attendeeName: guest.guest_name,
      ticketType: 'Guest',
    };
  }

  return { valid: false, error: 'Ticket not found' };
}

// ─── Bulk Check-In ────────────────────────────────────────────

export interface BulkCheckInResult {
  successful: CheckInResult[];
  failed: { ticketCode: string; error: string }[];
  totalProcessed: number;
}

export async function bulkCheckIn(
  sb: SupabaseClient,
  ticketCodes: string[],
  eventId: string,
  checkedInBy: string,
): Promise<BulkCheckInResult> {
  const successful: CheckInResult[] = [];
  const failed: { ticketCode: string; error: string }[] = [];

  for (const code of ticketCodes) {
    try {
      const result = await checkInAttendee(sb, code, eventId, checkedInBy, 'manual');
      if (result.success) {
        successful.push(result);
      } else {
        failed.push({ ticketCode: code, error: result.error ?? 'Unknown error' });
      }
    } catch (err) {
      failed.push({
        ticketCode: code,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return {
    successful,
    failed,
    totalProcessed: ticketCodes.length,
  };
}
