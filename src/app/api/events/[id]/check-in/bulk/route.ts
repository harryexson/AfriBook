import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";

interface GuestRow {
  id: string;
  guest_name: string | null;
  check_in_status: string;
  ticket_purchase_id: string | null;
}

interface TicketRow {
  id: string;
  buyer_name: string;
  check_in_status: string;
  order_status: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { ticketIds, guestIds, scannedBy, method } = body;

    if (
      (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) &&
      (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0)
    ) {
      return NextResponse.json(
        { success: false, error: "Provide ticketIds or guestIds array" },
        { status: 400 },
      );
    }

    if (!method || !["qr_scan", "manual"].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'method must be "qr_scan" or "manual"' },
        { status: 400 },
      );
    }

    const eventRows = await query<{ id: string }>(
      `SELECT id FROM events WHERE id = $1`,
      [eventId],
    );

    if (!eventRows[0]) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    const results: {
      id: string;
      type: string;
      name: string;
      status: string;
      error?: string;
    }[] = [];
    const now = new Date().toISOString();

    if (guestIds && guestIds.length > 0) {
      const guests = await query<GuestRow>(
        `SELECT id, guest_name, check_in_status, ticket_purchase_id
         FROM event_guests
         WHERE event_id = $1 AND id = ANY($2::uuid[])`,
        [eventId, guestIds],
      );

      for (const guest of guests) {
        if (guest.check_in_status === "checked_in") {
          results.push({
            id: guest.id,
            type: "guest",
            name: guest.guest_name ?? "",
            status: "already_checked_in",
          });
          continue;
        }

        await query(
          `UPDATE event_guests
           SET check_in_status = 'checked_in', checked_in_at = $1, checked_in_by = $2
           WHERE id = $3`,
          [now, scannedBy ?? null, guest.id],
        );

        await query(
          `INSERT INTO check_in_logs
             (event_id, ticket_purchase_id, guest_id, scanned_by, scanned_at, method)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [eventId, guest.ticket_purchase_id, guest.id, scannedBy ?? "system", now, method],
        );

        results.push({
          id: guest.id,
          type: "guest",
          name: guest.guest_name ?? "",
          status: "checked_in",
        });
      }
    }

    if (ticketIds && ticketIds.length > 0) {
      const tickets = await query<TicketRow>(
        `SELECT id, buyer_name, check_in_status, order_status
         FROM ticket_purchases
         WHERE event_id = $1 AND id = ANY($2::uuid[])`,
        [eventId, ticketIds],
      );

      for (const ticket of tickets) {
        if (ticket.check_in_status === "checked_in") {
          results.push({
            id: ticket.id,
            type: "ticket",
            name: ticket.buyer_name,
            status: "already_checked_in",
          });
          continue;
        }

        if (ticket.order_status === "cancelled") {
          results.push({
            id: ticket.id,
            type: "ticket",
            name: ticket.buyer_name,
            status: "cancelled",
            error: "Ticket is cancelled",
          });
          continue;
        }

        await query(
          `UPDATE ticket_purchases
           SET check_in_status = 'checked_in', checked_in_at = $1
           WHERE id = $2`,
          [now, ticket.id],
        );

        await query(
          `INSERT INTO check_in_logs
             (event_id, ticket_purchase_id, guest_id, scanned_by, scanned_at, method)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [eventId, ticket.id, null, scannedBy ?? "system", now, method],
        );

        results.push({
          id: ticket.id,
          type: "ticket",
          name: ticket.buyer_name,
          status: "checked_in",
        });
      }
    }

    const summary = {
      total: results.length,
      checkedIn: results.filter((r) => r.status === "checked_in").length,
      alreadyCheckedIn: results.filter((r) => r.status === "already_checked_in")
        .length,
      failed: results.filter((r) => r.status === "cancelled" || r.error).length,
    };

    return NextResponse.json({ success: true, data: { summary, results } });
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
