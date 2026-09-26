import { query } from '@/lib/neon/admin';
import type { CheckInResult, CheckInStats } from './types';

// The real individual-ticket table is `event_tickets` (not
// `event_individual_tickets`, which does not exist). Its check-in state is
// a `checked_in` boolean + `checked_in_at`/`checked_in_method`, not a
// check_in_status enum, and the tier name column is `tier_name`
// (not `ticket_type`).
interface EventTicketRow {
  id: string;
  registration_id: string | null;
  event_id: string;
  user_id: string | null;
  ticket_code: string;
  tier_name: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  status: 'active' | 'used' | 'cancelled' | 'refunded' | 'transferred';
  checked_in: boolean | null;
  checked_in_at: string | null;
  checked_in_method: 'qr_scan' | 'manual' | 'nfc' | null;
  created_at: string;
}

interface EventGuestRow {
  id: string;
  event_id: string;
  ticket_purchase_id: string | null;
  guest_name: string;
  guest_email: string;
  ticket_code: string;
  check_in_status: 'not_checked_in' | 'checked_in' | 'cancelled';
  checked_in_at: string | null;
  checked_in_by: string | null;
}

// ─── Check In Attendee ────────────────────────────────────────

export async function checkInAttendee(
  ticketCode: string,
  eventId: string,
  checkedInBy: string,
  method: 'qr_scan' | 'manual' | 'nfc' = 'qr_scan',
): Promise<CheckInResult> {
  // 1. Find the ticket
  const ticketRows = await query<EventTicketRow>(
    `SELECT * FROM event_tickets WHERE ticket_code = $1 AND event_id = $2 LIMIT 1`,
    [ticketCode, eventId],
  );
  const ticket = ticketRows[0];

  if (!ticket) {
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
  if (ticket.checked_in) {
    return {
      success: false,
      ticketCode,
      attendeeName: ticket.attendee_name ?? '',
      attendeeEmail: ticket.attendee_email ?? '',
      ticketType: ticket.tier_name ?? '',
      checkedInAt: ticket.checked_in_at ?? '',
      isGuest: false,
      error: 'Ticket already checked in',
    };
  }

  if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
    return {
      success: false,
      ticketCode,
      attendeeName: ticket.attendee_name ?? '',
      attendeeEmail: ticket.attendee_email ?? '',
      ticketType: ticket.tier_name ?? '',
      checkedInAt: '',
      isGuest: false,
      error: 'Ticket has been cancelled',
    };
  }

  // 3. Verify event is active
  const eventRows = await query<{ status: string; start_date: string; end_date: string }>(
    `SELECT status, start_date, end_date FROM events WHERE id = $1 LIMIT 1`,
    [eventId],
  );
  const event = eventRows[0];

  if (event && event.status !== 'published' && event.status !== 'completed') {
    return {
      success: false,
      ticketCode,
      attendeeName: ticket.attendee_name ?? '',
      attendeeEmail: ticket.attendee_email ?? '',
      ticketType: ticket.tier_name ?? '',
      checkedInAt: '',
      isGuest: false,
      error: 'Event is not active',
    };
  }

  const now = new Date().toISOString();

  // 4. Mark ticket as checked in
  await query(
    `UPDATE event_tickets SET checked_in = true, checked_in_at = $1, checked_in_method = $2 WHERE id = $3`,
    [now, method, ticket.id],
  );

  // 5. Update parent registration check-in status
  if (ticket.registration_id) {
    await query(
      `UPDATE ticket_purchases SET check_in_status = 'checked_in', checked_in_at = $1 WHERE id = $2`,
      [now, ticket.registration_id],
    );
  }

  // 6. Log check-in record. `check_in_logs` has no ticket_individual_id or
  // action column — only ticket_purchase_id/guest_id linkage.
  await query(
    `INSERT INTO check_in_logs (event_id, ticket_purchase_id, ticket_code, scanned_by, scanned_at, method, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [eventId, ticket.registration_id ?? null, ticketCode, checkedInBy, now, method, now],
  );

  return {
    success: true,
    ticketCode,
    attendeeName: ticket.attendee_name ?? '',
    attendeeEmail: ticket.attendee_email ?? '',
    ticketType: ticket.tier_name ?? '',
    checkedInAt: now,
    isGuest: false,
  };
}

// ─── Check In Guest ───────────────────────────────────────────

export async function checkInGuest(
  guestId: string,
  eventId: string,
  checkedInBy: string,
): Promise<CheckInResult> {
  const guestRows = await query<EventGuestRow>(
    `SELECT * FROM event_guests WHERE id = $1 AND event_id = $2 LIMIT 1`,
    [guestId, eventId],
  );
  const guest = guestRows[0];

  if (!guest) {
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

  await query(
    `UPDATE event_guests SET check_in_status = 'checked_in', checked_in_at = $1, checked_in_by = $2 WHERE id = $3`,
    [now, checkedInBy, guestId],
  );

  // Log check-in
  await query(
    `INSERT INTO check_in_logs (event_id, ticket_purchase_id, guest_id, ticket_code, scanned_by, scanned_at, method, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [eventId, guest.ticket_purchase_id ?? null, guestId, guest.ticket_code, checkedInBy, now, 'manual', now],
  );

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
  ticketCode: string,
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  // Find the individual ticket
  const ticketRows = await query<EventTicketRow>(
    `SELECT * FROM event_tickets WHERE ticket_code = $1 AND event_id = $2 LIMIT 1`,
    [ticketCode, eventId],
  );
  const ticket = ticketRows[0];

  if (!ticket) {
    return { success: false, error: 'Ticket not found' };
  }

  if (!ticket.checked_in) {
    return { success: false, error: 'Ticket is not checked in' };
  }

  // Reset check-in status
  await query(
    `UPDATE event_tickets SET checked_in = false, checked_in_at = NULL, checked_in_method = NULL WHERE id = $1`,
    [ticket.id],
  );

  // Update parent registration if applicable
  if (ticket.registration_id) {
    // Check if any other tickets from this registration are still checked in
    const otherTickets = await query<{ id: string }>(
      `SELECT id FROM event_tickets WHERE registration_id = $1 AND checked_in = true AND id != $2`,
      [ticket.registration_id, ticket.id],
    );

    if (otherTickets.length === 0) {
      await query(
        `UPDATE ticket_purchases SET check_in_status = 'not_checked_in', checked_in_at = NULL WHERE id = $1`,
        [ticket.registration_id],
      );
    }
  }

  // Log undo (check_in_logs has no `action` column, so this is recorded as
  // a plain scan entry with method 'manual')
  await query(
    `INSERT INTO check_in_logs (event_id, ticket_purchase_id, ticket_code, scanned_by, scanned_at, method, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [eventId, ticket.registration_id ?? null, ticketCode, 'system', new Date().toISOString(), 'manual', new Date().toISOString()],
  );

  return { success: true };
}

// ─── Check-In Statistics ──────────────────────────────────────

export async function getCheckInStats(
  eventId: string,
): Promise<CheckInStats & { tierBreakdown: { tier: string; total: number; checkedIn: number }[] }> {
  // Get all individual tickets for this event
  const allTickets = await query<{ tier_name: string | null; checked_in: boolean | null; status: string }>(
    `SELECT tier_name, checked_in, status FROM event_tickets WHERE event_id = $1`,
    [eventId],
  );

  const totalExpected = allTickets.length;
  const totalCheckedIn = allTickets.filter((t) => t.checked_in).length;
  // event_tickets has no 'no_show' state — approximate as not-checked-in,
  // non-cancelled tickets.
  const noShows = allTickets.filter((t) => !t.checked_in && t.status !== 'cancelled').length;

  // Get check-in timeline
  const logs = await query<{ scanned_at: string }>(
    `SELECT scanned_at FROM check_in_logs WHERE event_id = $1 ORDER BY scanned_at ASC`,
    [eventId],
  );

  const hourCounts: Record<string, number> = {};
  for (const log of logs) {
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
    const tier = ticket.tier_name ?? 'Unknown';
    if (!tierMap[tier]) tierMap[tier] = { total: 0, checkedIn: 0 };
    tierMap[tier].total++;
    if (ticket.checked_in) {
      tierMap[tier].checkedIn++;
    }
  }

  const tierBreakdown = Object.entries(tierMap).map(([tier, counts]) => ({
    tier,
    ...counts,
  }));

  // Also count guests
  const guests = await query<{ check_in_status: string }>(
    `SELECT check_in_status FROM event_guests WHERE event_id = $1`,
    [eventId],
  );

  const guestTotal = guests.length;
  const guestCheckedIn = guests.filter((g) => g.check_in_status === 'checked_in').length;

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
  eventId: string,
): Promise<{ name: string; email: string; ticketType: string; checkedInAt: string; isGuest: boolean }[]> {
  const tickets = await query<{ attendee_name: string | null; attendee_email: string | null; tier_name: string | null; checked_in_at: string | null }>(
    `SELECT attendee_name, attendee_email, tier_name, checked_in_at FROM event_tickets
     WHERE event_id = $1 AND checked_in = true ORDER BY checked_in_at ASC`,
    [eventId],
  );

  const guests = await query<{ guest_name: string; guest_email: string; checked_in_at: string | null }>(
    `SELECT guest_name, guest_email, checked_in_at FROM event_guests
     WHERE event_id = $1 AND check_in_status = 'checked_in' ORDER BY checked_in_at ASC`,
    [eventId],
  );

  const attendees = [
    ...tickets.map((t) => ({
      name: t.attendee_name ?? '',
      email: t.attendee_email ?? '',
      ticketType: t.tier_name ?? '',
      checkedInAt: t.checked_in_at ?? '',
      isGuest: false,
    })),
    ...guests.map((g) => ({
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
  eventId: string,
): Promise<{ name: string; email: string; ticketType: string; ticketCode: string; isGuest: boolean; guestId?: string }[]> {
  const tickets = await query<{ attendee_name: string | null; attendee_email: string | null; tier_name: string | null; ticket_code: string }>(
    `SELECT attendee_name, attendee_email, tier_name, ticket_code FROM event_tickets
     WHERE event_id = $1 AND checked_in = false`,
    [eventId],
  );

  const guests = await query<{ id: string; guest_name: string; guest_email: string; ticket_code: string }>(
    `SELECT id, guest_name, guest_email, ticket_code FROM event_guests
     WHERE event_id = $1 AND check_in_status = 'not_checked_in'`,
    [eventId],
  );

  return [
    ...tickets.map((t) => ({
      name: t.attendee_name ?? '',
      email: t.attendee_email ?? '',
      ticketType: t.tier_name ?? '',
      ticketCode: t.ticket_code,
      isGuest: false,
    })),
    ...guests.map((g) => ({
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
  ticketCode: string,
  eventId: string,
): Promise<{ valid: boolean; attendeeName?: string; ticketType?: string; alreadyCheckedIn?: boolean; error?: string }> {
  // Check individual tickets
  const ticketRows = await query<{ attendee_name: string | null; tier_name: string | null; checked_in: boolean | null; status: string }>(
    `SELECT attendee_name, tier_name, checked_in, status FROM event_tickets
     WHERE ticket_code = $1 AND event_id = $2 LIMIT 1`,
    [ticketCode, eventId],
  );
  const ticket = ticketRows[0];

  if (ticket) {
    if (ticket.checked_in) {
      return {
        valid: false,
        attendeeName: ticket.attendee_name ?? undefined,
        ticketType: ticket.tier_name ?? undefined,
        alreadyCheckedIn: true,
        error: 'Already checked in',
      };
    }
    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return { valid: false, error: 'Ticket cancelled' };
    }
    return {
      valid: true,
      attendeeName: ticket.attendee_name ?? undefined,
      ticketType: ticket.tier_name ?? undefined,
    };
  }

  // Check guests
  const guestRows = await query<{ guest_name: string; check_in_status: string }>(
    `SELECT guest_name, check_in_status FROM event_guests
     WHERE ticket_code = $1 AND event_id = $2 LIMIT 1`,
    [ticketCode, eventId],
  );
  const guest = guestRows[0];

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
  ticketCodes: string[],
  eventId: string,
  checkedInBy: string,
): Promise<BulkCheckInResult> {
  const successful: CheckInResult[] = [];
  const failed: { ticketCode: string; error: string }[] = [];

  for (const code of ticketCodes) {
    try {
      const result = await checkInAttendee(code, eventId, checkedInBy, 'manual');
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
