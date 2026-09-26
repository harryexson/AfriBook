import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: registrationId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();

    const regRows = await query<Record<string, unknown>>(
      `SELECT tp.id, tp.event_id, tp.buyer_id, tp.buyer_name, tp.buyer_email, tp.buyer_phone,
              tp.quantity, tp.ticket_code, tp.qr_code_url, tp.order_status, tp.check_in_status,
              tp.check_in_at, tp.ticket_tier_name,
              et.name AS tier_name, et.benefits AS tier_benefits,
              ev.title AS ev_title, ev.slug AS ev_slug, ev.start_date AS ev_start_date,
              ev.end_date AS ev_end_date, ev.venue_name AS ev_venue_name,
              ev.venue_address AS ev_venue_address, ev.venue_city AS ev_venue_city,
              ev.timezone AS ev_timezone
       FROM ticket_purchases tp
       LEFT JOIN event_ticket_types et ON et.id = tp.ticket_type_id
       LEFT JOIN events ev ON ev.id = tp.event_id
       WHERE tp.id = $1
       LIMIT 1`,
      [registrationId],
    );
    const registration = regRows[0];

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found" },
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

    if (registration.buyer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: you can only view your own registration",
        },
        { status: 403 },
      );
    }

    const ticketCode = registration.ticket_code as string;
    const qrCodeUrl =
      (registration.qr_code_url as string | null) ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${registration.event_id}/ticket/${ticketCode}`;

    const quantity = registration.quantity as number;
    const tickets = Array.from({ length: quantity }, (_, i) => ({
      id: `${registration.id}-${i + 1}`,
      registrationId: registration.id,
      eventId: registration.event_id,
      ticketCode: `${ticketCode}${quantity > 1 ? `-${i + 1}` : ""}`,
      tierName: registration.tier_name ?? registration.ticket_tier_name,
      attendeeName: registration.buyer_name,
      attendeeEmail: registration.buyer_email,
      status: registration.order_status,
      qrCodeUrl,
      checkedIn: registration.check_in_status === "checked_in",
      checkedInAt: registration.check_in_at,
      event: {
        title: registration.ev_title,
        startDate: registration.ev_start_date,
        endDate: registration.ev_end_date,
        venue: registration.ev_venue_name,
        address: registration.ev_venue_address,
        city: registration.ev_venue_city,
        timezone: registration.ev_timezone,
      },
      benefits: registration.tier_benefits ?? [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        registrationId,
        tickets,
        totalTickets: quantity,
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
