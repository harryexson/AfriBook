import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";
    const body = await req.json();
    const { ticketCode, guestId, ticketPurchaseId, method, scannedBy } = body;

    if (!ticketCode && !guestId && !ticketPurchaseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide ticketCode, guestId, or ticketPurchaseId",
        },
        { status: 400 },
      );
    }

    const checkInMethod = method ?? "qr_scan";
    if (!["qr_scan", "manual", "nfc"].includes(checkInMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: 'method must be "qr_scan", "manual", or "nfc"',
        },
        { status: 400 },
      );
    }

    const eventRows = await query<{
      id: string;
      organizer_id: string;
      title: string;
      start_date: string;
      end_date: string;
      status: string;
    }>(
      `SELECT id, organizer_id, title, start_date, end_date, status FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const event = eventRows[0];

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (event.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: only event organizers or admins can check in attendees",
        },
        { status: 403 },
      );
    }

    if (guestId) {
      const guestRows = await query<Record<string, unknown>>(
        `SELECT * FROM event_guests WHERE id = $1 AND event_id = $2 LIMIT 1`,
        [guestId, eventId],
      );
      const guest = guestRows[0];

      if (!guest) {
        return NextResponse.json(
          { success: false, error: "Guest not found for this event" },
          { status: 404 },
        );
      }

      if (guest.check_in_status === "checked_in") {
        return NextResponse.json(
          {
            success: false,
            error: "Guest already checked in",
            checkedInAt: guest.checked_in_at,
          },
          { status: 409 },
        );
      }

      const now = new Date().toISOString();

      try {
        await query(
          `UPDATE event_guests SET check_in_status = 'checked_in', checked_in_at = $1, checked_in_by = $2 WHERE id = $3`,
          [now, scannedBy ?? null, guestId],
        );
      } catch {
        return NextResponse.json(
          { success: false, error: "Failed to check in guest" },
          { status: 500 },
        );
      }

      await query(
        `INSERT INTO check_in_logs (event_id, ticket_purchase_id, guest_id, scanned_by, scanned_at, method)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          eventId,
          guest.ticket_purchase_id,
          guestId,
          scannedBy ?? "system",
          now,
          checkInMethod,
        ],
      );

      return NextResponse.json({
        success: true,
        data: {
          type: "guest",
          id: guest.id,
          name: guest.guest_name,
          email: guest.guest_email,
          ticketCode: guest.ticket_code,
          checkedInAt: now,
          method: checkInMethod,
        },
        message: "Guest checked in successfully",
      });
    }

    let ticket: Record<string, unknown> | undefined;
    if (ticketCode) {
      const rows = await query<Record<string, unknown>>(
        `SELECT * FROM ticket_purchases WHERE ticket_code = $1 AND event_id = $2 LIMIT 1`,
        [ticketCode, eventId],
      );
      ticket = rows[0];
    } else if (ticketPurchaseId) {
      const rows = await query<Record<string, unknown>>(
        `SELECT * FROM ticket_purchases WHERE id = $1 AND event_id = $2 LIMIT 1`,
        [ticketPurchaseId, eventId],
      );
      ticket = rows[0];
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found for this event" },
        { status: 404 },
      );
    }

    if (ticket.order_status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "This ticket has been cancelled" },
        { status: 400 },
      );
    }

    if (ticket.order_status === "pending") {
      return NextResponse.json(
        { success: false, error: "This ticket has not been paid for yet" },
        { status: 400 },
      );
    }

    if (ticket.check_in_status === "checked_in") {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket already checked in",
          checkedInAt: ticket.checked_in_at,
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    try {
      await query(
        `UPDATE ticket_purchases SET check_in_status = 'checked_in', checked_in_at = $1 WHERE id = $2`,
        [now, ticket.id],
      );
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to check in ticket" },
        { status: 500 },
      );
    }

    await query(
      `INSERT INTO check_in_logs (event_id, ticket_purchase_id, guest_id, scanned_by, scanned_at, method)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [eventId, ticket.id, null, scannedBy ?? "system", now, checkInMethod],
    );

    return NextResponse.json({
      success: true,
      data: {
        type: "ticket",
        id: ticket.id,
        name: ticket.buyer_name,
        email: ticket.buyer_email,
        ticketCode: ticket.ticket_code,
        quantity: ticket.quantity,
        tierName: ticket.ticket_tier_name ?? null,
        checkedInAt: now,
        method: checkInMethod,
      },
      message: "Attendee checked in successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );
    const offset = (page - 1) * limit;

    const eventRows = await query<{
      id: string;
      organizer_id: string;
      tickets_sold: number;
      total_capacity: number;
    }>(
      `SELECT id, organizer_id, tickets_sold, total_capacity FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const event = eventRows[0];

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (event.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: only event organizers or admins can view check-in data",
        },
        { status: 403 },
      );
    }

    const totalCheckedInRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND check_in_status = 'checked_in' AND order_status = 'confirmed'`,
      [eventId],
    );
    const guestsCheckedInRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_guests WHERE event_id = $1 AND check_in_status = 'checked_in'`,
      [eventId],
    );
    const totalGuestsRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_guests WHERE event_id = $1`,
      [eventId],
    );
    const totalConfirmedRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed'`,
      [eventId],
    );
    const attendeeCountRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed'`,
      [eventId],
    );

    const attendeeRows = await query<Record<string, unknown>>(
      `SELECT tp.id, tp.buyer_name, tp.buyer_email, tp.buyer_phone, tp.ticket_code, tp.quantity,
              tp.check_in_status, tp.check_in_at, ett.name AS tier_name, ett.tier AS tier_tier
       FROM ticket_purchases tp
       LEFT JOIN event_ticket_types ett ON ett.id = tp.ticket_type_id
       WHERE tp.event_id = $1 AND tp.order_status = 'confirmed'
       ORDER BY tp.check_in_status ASC, tp.buyer_name ASC
       LIMIT $2 OFFSET $3`,
      [eventId, limit, offset],
    );

    const attendees = attendeeRows.map((r) => {
      const { tier_name, tier_tier, ...rest } = r;
      return {
        ...rest,
        event_ticket_types: { name: tier_name, tier: tier_tier },
      };
    });

    const totalCheckedIn = Number(totalCheckedInRows[0]?.count ?? 0);
    const guestsCheckedIn = Number(guestsCheckedInRows[0]?.count ?? 0);
    const totalGuests = Number(totalGuestsRows[0]?.count ?? 0);
    const totalConfirmed = Number(totalConfirmedRows[0]?.count ?? 0);
    const attendeeCount = Number(attendeeCountRows[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          ticketsSold: event.tickets_sold,
          ticketsConfirmed: totalConfirmed,
          ticketsCheckedIn: totalCheckedIn,
          guestsTotal: totalGuests,
          guestsCheckedIn: guestsCheckedIn,
          totalAttendees: totalCheckedIn + guestsCheckedIn,
          attendanceRate:
            totalConfirmed > 0
              ? Math.round((totalCheckedIn / (totalConfirmed || 1)) * 100)
              : 0,
          capacity: event.total_capacity,
        },
        attendees,
        pagination: {
          page,
          limit,
          total: attendeeCount,
          totalPages: Math.ceil(attendeeCount / limit),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
