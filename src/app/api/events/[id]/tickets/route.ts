import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/supabase/server";
import type { EventGuest } from "@/types/events";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();
    const body = await req.json();
    const {
      ticketTypeId,
      quantity,
      buyerName,
      buyerEmail,
      buyerPhone,
      guests,
      promoCode,
      paymentMethod,
    } = body;

    if (!ticketTypeId || !quantity || !buyerName || !buyerEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: ticketTypeId, quantity, buyerName, buyerEmail",
        },
        { status: 400 },
      );
    }

    if (quantity < 1 || quantity > 50) {
      return NextResponse.json(
        { success: false, error: "Quantity must be between 1 and 50" },
        { status: 400 },
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, status, total_capacity, tickets_sold, is_free, currency_code, platform_fee_percent, platform_fee_fixed, enable_waitlist",
      )
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Event is not accepting tickets" },
        { status: 400 },
      );
    }

    const { data: ticketType, error: ttError } = await supabase
      .from("event_ticket_types")
      .select("*")
      .eq("id", ticketTypeId)
      .eq("event_id", eventId)
      .eq("is_active", true)
      .single();

    if (ttError || !ticketType) {
      return NextResponse.json(
        { success: false, error: "Ticket type not found or inactive" },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();
    if (ticketType.sale_starts_at && now < ticketType.sale_starts_at) {
      return NextResponse.json(
        { success: false, error: "Ticket sales have not started yet" },
        { status: 400 },
      );
    }
    if (ticketType.sale_ends_at && now > ticketType.sale_ends_at) {
      return NextResponse.json(
        { success: false, error: "Ticket sales have ended" },
        { status: 400 },
      );
    }

    if (quantity < (ticketType.min_per_order ?? 1)) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order is ${ticketType.min_per_order} tickets`,
        },
        { status: 400 },
      );
    }

    if (quantity > (ticketType.max_per_order ?? 10)) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum order is ${ticketType.max_per_order} tickets`,
        },
        { status: 400 },
      );
    }

    const available =
      (ticketType.quantity_available ?? 0) - (ticketType.quantity_sold ?? 0);
    if (quantity > available) {
      if (event.enable_waitlist) {
        return NextResponse.json(
          {
            success: false,
            error: "Not enough tickets available. You can join the waitlist.",
            waitlistAvailable: true,
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { success: false, error: `Only ${available} tickets remaining` },
        { status: 400 },
      );
    }

    const remainingCapacity = event.total_capacity - event.tickets_sold;
    if (quantity > remainingCapacity && event.total_capacity > 0) {
      return NextResponse.json(
        { success: false, error: "Event has reached full capacity" },
        { status: 400 },
      );
    }

    let unitPrice = ticketType.price ?? 0;
    let discountAmount = 0;

    if (promoCode) {
      const { data: promo } = await supabase
        .from("event_promo_codes")
        .select("*")
        .eq("event_id", eventId)
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (
        promo &&
        new Date(promo.valid_until) > new Date() &&
        promo.used_count < promo.max_uses
      ) {
        if (promo.discount_type === "percent") {
          discountAmount = unitPrice * (promo.discount_value / 100);
        } else {
          discountAmount = Math.min(promo.discount_value, unitPrice);
        }
        unitPrice = Math.max(0, unitPrice - discountAmount);
        await supabase
          .from("event_promo_codes")
          .update({ used_count: promo.used_count + 1 })
          .eq("id", promo.id);
      }
    }

    const subtotal = unitPrice * quantity;
    const platformFee =
      subtotal * (event.platform_fee_percent / 100) +
      event.platform_fee_fixed * quantity;
    const processingFee = event.is_free ? 0 : Math.max(subtotal * 0.015, 0);
    const total = subtotal + platformFee + processingFee;

    const ticketCode = generateTicketCode();
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${eventId}/ticket/${ticketCode}`;

    const purchaseData: Record<string, unknown> = {
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      buyer_id: user.id,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone ?? null,
      quantity,
      unit_price: unitPrice,
      subtotal,
      platform_fee: platformFee,
      processing_fee: processingFee,
      total,
      currency_code: event.currency_code,
      payment_status: event.is_free ? "completed" : "pending",
      payment_method: paymentMethod ?? null,
      order_status: event.is_free ? "confirmed" : "pending",
      ticket_code: ticketCode,
      qr_code_url: qrCodeUrl,
      promo_code: promoCode ?? null,
      check_in_status: "not_checked_in",
      metadata: discountAmount > 0 ? { discount_amount: discountAmount } : {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: purchase, error: purchaseError } = await supabase
      .from("ticket_purchases")
      .insert(purchaseData)
      .select()
      .single();

    if (purchaseError) {
      return NextResponse.json(
        { success: false, error: "Failed to create ticket purchase" },
        { status: 500 },
      );
    }

    await supabase
      .from("event_ticket_types")
      .update({ quantity_sold: (ticketType.quantity_sold ?? 0) + quantity })
      .eq("id", ticketTypeId);

    await supabase
      .from("events")
      .update({ tickets_sold: event.tickets_sold + quantity })
      .eq("id", eventId);

    const createdGuests: EventGuest[] = [];
    if (
      guests &&
      Array.isArray(guests) &&
      guests.length > 0 &&
      ticketType.includes_guest_registration
    ) {
      const maxGuests = ticketType.max_guests_per_ticket * quantity;
      const guestsToAdd = guests.slice(0, maxGuests);

      const guestRows = guestsToAdd.map(
        (g: { name: string; email: string; phone?: string }) => ({
          event_id: eventId,
          ticket_purchase_id: purchase.id,
          host_id: user.id,
          guest_name: g.name,
          guest_email: g.email,
          guest_phone: g.phone ?? null,
          ticket_code: generateTicketCode(),
          qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${eventId}/guest/${generateTicketCode()}`,
          check_in_status: "not_checked_in",
          created_at: new Date().toISOString(),
        }),
      );

      const { data: insertedGuests } = await supabase
        .from("event_guests")
        .insert(guestRows)
        .select();

      createdGuests.push(
        ...((insertedGuests as unknown as EventGuest[]) ?? []),
      );
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "ticket_purchase",
      title: "Ticket Confirmed",
      body: `Your ticket for event has been confirmed. Ticket code: ${ticketCode}`,
      data: {
        event_id: eventId,
        ticket_purchase_id: purchase.id,
        ticket_code: ticketCode,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...purchase,
          guests: createdGuests,
          pricing: {
            unitPrice,
            quantity,
            subtotal,
            platformFee,
            processingFee,
            discountAmount,
            total,
            currency: event.currency_code,
          },
        },
      },
      { status: 201 },
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
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

    let query = supabase
      .from("ticket_purchases")
      .select("*, event_ticket_types(name, type)", { count: "exact" })
      .eq("event_id", eventId);

    if (event.organizer_id !== user.id && !isAdmin) {
      query = query.eq("buyer_id", user.id);
    }

    if (status) {
      query = query.eq("order_status", status);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch tickets" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
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
