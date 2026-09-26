import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ticketId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();

    const rows = await query<Record<string, unknown>>(
      `SELECT tp.*,
              et.name AS tier_name, et.tier AS tier_tier, et.type AS tier_type, et.benefits AS tier_benefits,
              ev.title AS event_title, ev.slug AS event_slug, ev.start_date AS event_start_date,
              ev.end_date AS event_end_date, ev.venue_name AS event_venue_name,
              ev.venue_address AS event_venue_address, ev.venue_city AS event_venue_city,
              ev.venue_country AS event_venue_country, ev.cover_image_url AS event_cover_image_url,
              ev.organizer_name AS event_organizer_name, ev.timezone AS event_timezone,
              ev.is_virtual AS event_is_virtual, ev.virtual_link AS event_virtual_link
       FROM ticket_purchases tp
       LEFT JOIN event_ticket_types et ON et.id = tp.ticket_type_id
       LEFT JOIN events ev ON ev.id = tp.event_id
       WHERE tp.id = $1
       LIMIT 1`,
      [ticketId],
    );
    const ticket = rows[0];

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";

    if (ticket.buyer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const guests = await query<Record<string, unknown>>(
      `SELECT * FROM event_guests WHERE ticket_purchase_id = $1 ORDER BY created_at ASC`,
      [ticketId],
    );

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        qrCodeData: ticket.ticket_code,
        barcodeData: `AFRIBOOK-${ticket.ticket_code}`,
        guests: guests ?? [],
        event: {
          title: ticket.event_title,
          slug: ticket.event_slug,
          start_date: ticket.event_start_date,
          end_date: ticket.event_end_date,
          venue_name: ticket.event_venue_name,
          venue_address: ticket.event_venue_address,
          venue_city: ticket.event_venue_city,
          venue_country: ticket.event_venue_country,
          cover_image_url: ticket.event_cover_image_url,
          organizer_name: ticket.event_organizer_name,
          timezone: ticket.event_timezone,
          is_virtual: ticket.event_is_virtual,
          virtual_link: ticket.event_virtual_link,
        },
        tier: {
          name: ticket.tier_name,
          tier: ticket.tier_tier,
          type: ticket.tier_type,
          benefits: ticket.tier_benefits,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ticketId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { action, transferTo, reason } = body;

    const ticketRows = await query<{
      id: string;
      buyer_id: string | null;
      buyer_name: string | null;
      buyer_email: string | null;
      event_id: string;
      order_status: string;
      payment_status: string;
      quantity: number;
      total: number;
      ticket_type_id: string | null;
      metadata: Record<string, unknown> | null;
    }>(
      `SELECT id, buyer_id, buyer_name, buyer_email, event_id, order_status, payment_status, quantity, total, ticket_type_id, metadata
       FROM ticket_purchases WHERE id = $1 LIMIT 1`,
      [ticketId],
    );
    const ticket = ticketRows[0];

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";

    if (ticket.buyer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: you can only modify your own tickets",
        },
        { status: 403 },
      );
    }

    if (action === "transfer") {
      if (ticket.order_status !== "confirmed") {
        return NextResponse.json(
          { success: false, error: "Can only transfer confirmed tickets" },
          { status: 400 },
        );
      }

      if (!transferTo || !transferTo.email) {
        return NextResponse.json(
          { success: false, error: "transferTo.email is required" },
          { status: 400 },
        );
      }

      const targetUserRows = await query<{ id: string }>(
        `SELECT id FROM profiles WHERE email = $1 LIMIT 1`,
        [transferTo.email],
      );
      const newBuyerId = targetUserRows[0]?.id ?? null;

      const newCode = generateTicketCode();
      // ticket_purchases has no `transferred_to` column — store it in metadata (jsonb).
      const newMetadata = {
        ...(ticket.metadata ?? {}),
        transferred_to: transferTo.email,
      };

      const updatedRows = await query<Record<string, unknown>>(
        `UPDATE ticket_purchases
         SET buyer_name = $1, buyer_email = $2, buyer_phone = $3, buyer_id = $4,
             ticket_code = $5, qr_code_url = $6, metadata = $7, updated_at = now()
         WHERE id = $8
         RETURNING *`,
        [
          transferTo.name ?? transferTo.email,
          transferTo.email,
          transferTo.phone ?? null,
          newBuyerId,
          newCode,
          `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${ticket.event_id}/ticket/${newCode}`,
          JSON.stringify(newMetadata),
          ticketId,
        ],
      );
      const updated = updatedRows[0];

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Failed to transfer ticket" },
          { status: 500 },
        );
      }

      if (ticket.buyer_id) {
        await query(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, 'ticket_transferred', 'Ticket Transferred', $2, $3)`,
          [
            ticket.buyer_id,
            `Your ticket has been transferred to ${transferTo.email}.`,
            JSON.stringify({ ticket_id: ticketId, event_id: ticket.event_id }),
          ],
        );
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Ticket transferred to ${transferTo.email}`,
      });
    }

    if (action === "cancel") {
      if (!["pending", "confirmed"].includes(ticket.order_status)) {
        return NextResponse.json(
          { success: false, error: "Cannot cancel ticket in this status" },
          { status: 400 },
        );
      }

      let refundResult: { refundId?: string; amount?: number; error?: string } | null = null;
      // ticket_purchases has no `payment_intent_id` column — it is stored in metadata (jsonb).
      const paymentIntentId = (ticket.metadata?.payment_intent_id as string | undefined) ?? null;
      if (ticket.total > 0 && ticket.payment_status === "completed" && paymentIntentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: "requested_by_customer",
          });
          refundResult = { refundId: refund.id, amount: refund.amount / 100 };
        } catch (stripeError) {
          refundResult = {
            error:
              stripeError instanceof Error
                ? stripeError.message
                : "Refund failed",
          };
        }
      }

      const newMetadata = {
        ...(ticket.metadata ?? {}),
        refund_amount: ticket.total,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? null,
      };

      const cancelRows = await query<{ id: string }>(
        `UPDATE ticket_purchases
         SET order_status = 'cancelled',
             payment_status = $1,
             metadata = $2,
             updated_at = now()
         WHERE id = $3
         RETURNING id`,
        [
          refundResult && !refundResult.error ? "refunded" : ticket.payment_status,
          JSON.stringify(newMetadata),
          ticketId,
        ],
      );

      if (!cancelRows[0]) {
        return NextResponse.json(
          { success: false, error: "Failed to cancel ticket" },
          { status: 500 },
        );
      }

      const eventRows = await query<{ tickets_sold: number }>(
        `SELECT tickets_sold FROM events WHERE id = $1 LIMIT 1`,
        [ticket.event_id],
      );
      const event = eventRows[0];

      if (event) {
        await query(
          `UPDATE events SET tickets_sold = GREATEST(0, tickets_sold - $1), updated_at = now() WHERE id = $2`,
          [ticket.quantity, ticket.event_id],
        );
      }

      if (ticket.ticket_type_id) {
        await query(
          `UPDATE event_ticket_types SET quantity_sold = GREATEST(0, quantity_sold - $1), updated_at = now() WHERE id = $2`,
          [ticket.quantity, ticket.ticket_type_id],
        );
      }

      if (ticket.buyer_id) {
        await query(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, 'ticket_cancelled', 'Ticket Cancelled', $2, $3)`,
          [
            ticket.buyer_id,
            refundResult && !refundResult.error
              ? `Your ticket has been cancelled. Refund of ${refundResult.amount} initiated.`
              : `Your ticket has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
            JSON.stringify({
              ticket_id: ticketId,
              event_id: ticket.event_id,
              refund: refundResult,
            }),
          ],
        );
      }

      return NextResponse.json({
        success: true,
        data: { ticketId, status: "cancelled", refund: refundResult },
        message: "Ticket cancelled successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "cancel" or "transfer"' },
      { status: 400 },
    );
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ticketId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { name, email, phone, dietaryRestrictions, specialRequirements } =
      body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email" },
        { status: 400 },
      );
    }

    const ticketRows = await query<{
      id: string;
      event_id: string;
      buyer_id: string | null;
      quantity: number;
      ticket_type_id: string | null;
    }>(
      `SELECT id, event_id, buyer_id, quantity, ticket_type_id FROM ticket_purchases WHERE id = $1 LIMIT 1`,
      [ticketId],
    );
    const ticket = ticketRows[0];

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";

    if (ticket.buyer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: you can only add guests to your own ticket",
        },
        { status: 403 },
      );
    }

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_guests WHERE ticket_purchase_id = $1`,
      [ticketId],
    );
    const count = Number(countRows[0]?.count ?? 0);

    const ticketTypeRows = await query<{
      max_guests_per_ticket: number | null;
      includes_guest_registration: boolean | null;
    }>(
      `SELECT max_guests_per_ticket, includes_guest_registration FROM event_ticket_types WHERE id = $1 LIMIT 1`,
      [ticket.ticket_type_id],
    );
    const ticketType = ticketTypeRows[0];

    if (!ticketType?.includes_guest_registration) {
      return NextResponse.json(
        {
          success: false,
          error: "Guest registration is not enabled for this ticket type",
        },
        { status: 400 },
      );
    }

    const maxGuests = (ticketType.max_guests_per_ticket ?? 0) * ticket.quantity;
    if (count >= maxGuests) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${maxGuests} guests allowed for this ticket`,
        },
        { status: 400 },
      );
    }

    const guestCode = generateTicketCode();
    // event_guests has no `dietary_restrictions`/`special_requirements` columns —
    // the real columns are `dietary_notes`/`notes`.
    const guestRows = await query<Record<string, unknown>>(
      `INSERT INTO event_guests
         (event_id, ticket_purchase_id, host_id, guest_name, guest_email, guest_phone,
          ticket_code, qr_code_url, check_in_status, dietary_notes, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'not_checked_in', $9, $10, now())
       RETURNING *`,
      [
        ticket.event_id,
        ticketId,
        ticket.buyer_id ?? "",
        name,
        email,
        phone ?? null,
        guestCode,
        `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${ticket.event_id}/guest/${guestCode}`,
        dietaryRestrictions ?? null,
        specialRequirements ?? null,
      ],
    );
    const guest = guestRows[0];

    if (!guest) {
      return NextResponse.json(
        { success: false, error: "Failed to add guest" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: guest }, { status: 201 });
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ticketId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "guestId query parameter is required" },
        { status: 400 },
      );
    }

    const guestRows = await query<{
      id: string;
      ticket_purchase_id: string;
      host_id: string | null;
      event_id: string;
      check_in_status: string | null;
    }>(
      `SELECT id, ticket_purchase_id, host_id, event_id, check_in_status
       FROM event_guests WHERE id = $1 AND ticket_purchase_id = $2 LIMIT 1`,
      [guestId, ticketId],
    );
    const guest = guestRows[0];

    if (!guest) {
      return NextResponse.json(
        { success: false, error: "Guest not found" },
        { status: 404 },
      );
    }

    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";

    if (guest.host_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: you can only remove your own guests",
        },
        { status: 403 },
      );
    }

    if (guest.check_in_status === "checked_in") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot remove a guest who has already checked in",
        },
        { status: 400 },
      );
    }

    await query(`DELETE FROM event_guests WHERE id = $1`, [guestId]);

    return NextResponse.json({
      success: true,
      data: { message: "Guest removed successfully" },
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
