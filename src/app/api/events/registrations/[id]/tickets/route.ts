import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: registrationId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();

    const { data: registration, error: regError } = await supabase
      .from("ticket_purchases")
      .select(
        `
        id, event_id, buyer_id, buyer_name, buyer_email, buyer_phone,
        quantity, ticket_code, qr_code_url, order_status, check_in_status,
        check_in_at, ticket_tier_name,
        event_ticket_types(name, tier, benefits),
        events(title, slug, start_date, end_date, venue_name, venue_address, venue_city, timezone)
      `,
      )
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found" },
        { status: 404 },
      );
    }

    const profileResponse = await authSupabase
      .from("users")
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

    const ticketCode = registration.ticket_code;
    const qrCodeUrl =
      registration.qr_code_url ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${registration.event_id}/ticket/${ticketCode}`;

    const tickets = Array.from({ length: registration.quantity }, (_, i) => ({
      id: `${registration.id}-${i + 1}`,
      registrationId: registration.id,
      eventId: registration.event_id,
      ticketCode: `${ticketCode}${registration.quantity > 1 ? `-${i + 1}` : ""}`,
      tierName:
        (registration.event_ticket_types as unknown as Record<string, unknown>)
          ?.name ?? registration.ticket_tier_name,
      attendeeName: registration.buyer_name,
      attendeeEmail: registration.buyer_email,
      status: registration.order_status,
      qrCodeUrl,
      checkedIn: registration.check_in_status === "checked_in",
      checkedInAt: registration.check_in_at,
      event: {
        title: (registration.events as unknown as Record<string, unknown>)
          ?.title,
        startDate: (registration.events as unknown as Record<string, unknown>)
          ?.start_date,
        endDate: (registration.events as unknown as Record<string, unknown>)
          ?.end_date,
        venue: (registration.events as unknown as Record<string, unknown>)
          ?.venue_name,
        address: (registration.events as unknown as Record<string, unknown>)
          ?.venue_address,
        city: (registration.events as unknown as Record<string, unknown>)
          ?.venue_city,
        timezone: (registration.events as unknown as Record<string, unknown>)
          ?.timezone,
      },
      benefits:
        (registration.event_ticket_types as unknown as Record<string, unknown>)
          ?.benefits ?? [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        registrationId,
        tickets,
        totalTickets: registration.quantity,
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
