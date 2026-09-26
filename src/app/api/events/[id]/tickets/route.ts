import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";
import type { EventGuest } from "@/types/events";

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

    const eventRows = await query<{
      id: string;
      status: string;
      total_capacity: number;
      tickets_sold: number;
      is_free: boolean;
      currency_code: string;
      platform_fee_percent: number;
      platform_fee_fixed: number;
      enable_waitlist: boolean;
    }>(
      `SELECT id, status, total_capacity, tickets_sold, is_free, currency_code, platform_fee_percent, platform_fee_fixed, enable_waitlist
       FROM events WHERE id = $1`,
      [eventId],
    );
    const event = eventRows[0];

    if (!event) {
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

    const ticketTypeRows = await query<{
      id: string;
      event_id: string;
      price: number;
      quantity_available: number;
      quantity_sold: number;
      min_per_order: number | null;
      max_per_order: number | null;
      sale_starts_at: string | null;
      sale_ends_at: string | null;
      includes_guest_registration: boolean;
      max_guests_per_ticket: number;
      is_active: boolean;
    }>(
      `SELECT * FROM event_ticket_types WHERE id = $1 AND event_id = $2 AND is_active = true`,
      [ticketTypeId, eventId],
    );
    const ticketType = ticketTypeRows[0];

    if (!ticketType) {
      return NextResponse.json(
        { success: false, error: "Ticket type not found or inactive" },
        { status: 404 },
      );
    }

    const now = new Date();
    if (ticketType.sale_starts_at && now < new Date(ticketType.sale_starts_at)) {
      return NextResponse.json(
        { success: false, error: "Ticket sales have not started yet" },
        { status: 400 },
      );
    }
    if (ticketType.sale_ends_at && now > new Date(ticketType.sale_ends_at)) {
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
    let appliedPromo: { id: string; used_count: number } | null = null;

    if (promoCode) {
      const promoRows = await query<{
        id: string;
        discount_type: string;
        discount_value: number;
        used_count: number;
        max_uses: number;
        valid_until: string;
      }>(
        `SELECT * FROM event_promo_codes
         WHERE event_id = $1 AND code = $2 AND is_active = true`,
        [eventId, promoCode.toUpperCase()],
      );
      const promo = promoRows[0];

      if (
        promo &&
        new Date(promo.valid_until) > new Date() &&
        promo.used_count < promo.max_uses
      ) {
        if (promo.discount_type === "percent" || promo.discount_type === "percentage") {
          discountAmount = unitPrice * (promo.discount_value / 100);
        } else {
          discountAmount = Math.min(promo.discount_value, unitPrice);
        }
        unitPrice = Math.max(0, unitPrice - discountAmount);
        appliedPromo = { id: promo.id, used_count: promo.used_count };
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
    const nowIso = new Date().toISOString();

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
      metadata: JSON.stringify(
        discountAmount > 0 ? { discount_amount: discountAmount } : {},
      ),
      created_at: nowIso,
      updated_at: nowIso,
    };

    const createdGuests: EventGuest[] = [];

    // Purchase insert + the availability decrements it depends on must commit
    // together, so they run inside a single transaction.
    let purchase: Record<string, unknown> | undefined;
    try {
      purchase = await withTransaction(async (txQuery) => {
        const columns = Object.keys(purchaseData);
        const values = Object.values(purchaseData);
        const placeholders = columns.map((_, i) => `$${i + 1}`);

        const purchaseRows = await txQuery<Record<string, unknown>>(
          `INSERT INTO ticket_purchases (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
          values,
        );
        const created = purchaseRows[0];

        // decrement_ticket_quantity / increment_event_tickets_sold RPCs don't
        // exist in the database — replaced with direct atomic UPDATEs.
        await txQuery(
          `UPDATE event_ticket_types SET quantity_sold = quantity_sold + $1 WHERE id = $2`,
          [quantity, ticketTypeId],
        );
        await txQuery(
          `UPDATE events SET tickets_sold = tickets_sold + $1 WHERE id = $2`,
          [quantity, eventId],
        );

        if (appliedPromo) {
          await txQuery(
            `UPDATE event_promo_codes SET used_count = used_count + 1 WHERE id = $1`,
            [appliedPromo.id],
          );
        }

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
              ticket_purchase_id: created.id,
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

          const guestColumns = Object.keys(guestRows[0]);
          const guestValues: unknown[] = [];
          const guestPlaceholders = guestRows.map(
            (row: Record<string, unknown>, rowIndex: number) => {
              const rowPlaceholders = guestColumns.map((col, colIndex) => {
                guestValues.push(row[col]);
                return `$${rowIndex * guestColumns.length + colIndex + 1}`;
              });
              return `(${rowPlaceholders.join(", ")})`;
            },
          );

          const insertedGuests = await txQuery<EventGuest>(
            `INSERT INTO event_guests (${guestColumns.join(", ")}) VALUES ${guestPlaceholders.join(", ")} RETURNING *`,
            guestValues,
          );
          createdGuests.push(...insertedGuests);
        }

        return created;
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to create ticket purchase" },
        { status: 500 },
      );
    }

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: "Failed to create ticket purchase" },
        { status: 500 },
      );
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        "ticket_purchase",
        "Ticket Confirmed",
        `Your ticket for event has been confirmed. Ticket code: ${ticketCode}`,
        JSON.stringify({
          event_id: eventId,
          ticket_purchase_id: purchase.id,
          ticket_code: ticketCode,
        }),
      ],
    );

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

    const eventRows = await query<{ id: string; organizer_id: string }>(
      `SELECT id, organizer_id FROM events WHERE id = $1`,
      [eventId],
    );
    const event = eventRows[0];

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
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

    const conditions: string[] = ["tp.event_id = $1"];
    const queryParams: unknown[] = [eventId];

    if (event.organizer_id !== user.id && !isAdmin) {
      queryParams.push(user.id);
      conditions.push(`tp.buyer_id = $${queryParams.length}`);
    }

    if (status) {
      queryParams.push(status);
      conditions.push(`tp.order_status = $${queryParams.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases tp ${whereClause}`,
      queryParams,
    );
    const count = Number(countRows[0]?.count ?? 0);

    const dataParams = [...queryParams, limit, offset];
    const rows = await query<Record<string, unknown>>(
      `SELECT tp.*, ett.name AS "ett_name", ett.type AS "ett_type"
       FROM ticket_purchases tp
       LEFT JOIN event_ticket_types ett ON ett.id = tp.ticket_type_id
       ${whereClause}
       ORDER BY tp.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );

    const data = rows.map(({ ett_name, ett_type, ...rest }) => ({
      ...rest,
      event_ticket_types: { name: ett_name, type: ett_type },
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
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
