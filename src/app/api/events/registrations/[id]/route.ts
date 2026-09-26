import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: registrationId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();

    const regRows = await query<Record<string, unknown>>(
      `SELECT tp.*,
              et.name AS tier_name, et.tier AS tier_tier, et.type AS tier_type, et.benefits AS tier_benefits,
              ev.id AS ev_id, ev.title AS ev_title, ev.slug AS ev_slug, ev.start_date AS ev_start_date,
              ev.end_date AS ev_end_date, ev.venue_name AS ev_venue_name, ev.venue_address AS ev_venue_address,
              ev.venue_city AS ev_venue_city, ev.cover_image_url AS ev_cover_image_url,
              ev.organizer_name AS ev_organizer_name, ev.timezone AS ev_timezone, ev.status AS ev_status
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
          error: "Forbidden: you can only view your own registrations",
        },
        { status: 403 },
      );
    }

    const guests = await query<Record<string, unknown>>(
      `SELECT * FROM event_guests WHERE ticket_purchase_id = $1 ORDER BY created_at ASC`,
      [registrationId],
    );

    return NextResponse.json({
      success: true,
      data: {
        ...registration,
        event: {
          id: registration.ev_id,
          title: registration.ev_title,
          slug: registration.ev_slug,
          start_date: registration.ev_start_date,
          end_date: registration.ev_end_date,
          venue_name: registration.ev_venue_name,
          venue_address: registration.ev_venue_address,
          venue_city: registration.ev_venue_city,
          cover_image_url: registration.ev_cover_image_url,
          organizer_name: registration.ev_organizer_name,
          timezone: registration.ev_timezone,
          status: registration.ev_status,
        },
        guests: guests ?? [],
        tickets: [
          {
            id: registration.id,
            ticketCode: registration.ticket_code,
            tierName: registration.tier_name,
            quantity: registration.quantity,
            status: registration.order_status,
            qrCodeUrl: registration.qr_code_url,
            checkedIn: registration.check_in_status === "checked_in",
            checkedInAt: registration.checked_in_at,
          },
        ],
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
    const { id: registrationId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { specialRequests } = body;

    const regRows = await query<{
      id: string;
      buyer_id: string | null;
      event_id: string;
      order_status: string;
      metadata: Record<string, unknown> | null;
    }>(
      `SELECT id, buyer_id, event_id, order_status, metadata FROM ticket_purchases WHERE id = $1 LIMIT 1`,
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
          error: "Forbidden: you can only update your own registrations",
        },
        { status: 403 },
      );
    }

    if (specialRequests !== undefined) {
      // ticket_purchases has no `special_requests` column — store it in metadata (jsonb).
      const newMetadata = {
        ...(registration.metadata ?? {}),
        special_requests: specialRequests,
      };
      await query(
        `UPDATE ticket_purchases SET metadata = $1, updated_at = now() WHERE id = $2`,
        [JSON.stringify(newMetadata), registrationId],
      );
    }

    const updatedRows = await query<Record<string, unknown>>(
      `SELECT * FROM ticket_purchases WHERE id = $1 LIMIT 1`,
      [registrationId],
    );
    const updated = updatedRows[0];

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Registration updated successfully",
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: registrationId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason") ?? "User requested cancellation";

    const regRows = await query<{
      id: string;
      buyer_id: string | null;
      event_id: string;
      order_status: string;
      payment_status: string;
      quantity: number;
      total: number;
      ticket_type_id: string | null;
      metadata: Record<string, unknown> | null;
    }>(
      `SELECT id, buyer_id, event_id, order_status, payment_status, quantity, total, ticket_type_id, metadata
       FROM ticket_purchases WHERE id = $1 LIMIT 1`,
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
          error: "Forbidden: you can only cancel your own registrations",
        },
        { status: 403 },
      );
    }

    if (!["pending", "confirmed"].includes(registration.order_status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel registration with status "${registration.order_status}"`,
        },
        { status: 400 },
      );
    }

    let refundResult: { refundId?: string; amount?: number; error?: string } | null = null;
    if (registration.total > 0 && registration.payment_status === "completed") {
      const eventRows = await query<{
        allow_refunds: boolean | null;
        refund_deadline_days: number | null;
        start_date: string | null;
      }>(
        `SELECT allow_refunds, refund_deadline_days, start_date FROM events WHERE id = $1 LIMIT 1`,
        [registration.event_id],
      );
      const event = eventRows[0];

      const allowsRefunds = event?.allow_refunds !== false;
      const deadlineDays = event?.refund_deadline_days ?? 7;
      const eventStart = event?.start_date ? new Date(event.start_date) : null;
      const refundDeadline = eventStart
        ? new Date(eventStart.getTime() - deadlineDays * 24 * 60 * 60 * 1000)
        : new Date();
      const canRefund = allowsRefunds && new Date() < refundDeadline;

      // ticket_purchases has no `payment_intent_id` column — it is stored in metadata (jsonb).
      const paymentIntentId =
        (registration.metadata?.payment_intent_id as string | undefined) ?? null;

      if (canRefund && paymentIntentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: "requested_by_customer",
            metadata: {
              registration_id: registrationId,
              reason,
            },
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
    }

    const newMetadata = {
      ...(registration.metadata ?? {}),
      refund_amount: registration.total,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
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
        refundResult && !refundResult.error ? "refunded" : registration.payment_status,
        JSON.stringify(newMetadata),
        registrationId,
      ],
    );

    if (!cancelRows[0]) {
      return NextResponse.json(
        { success: false, error: "Failed to cancel registration" },
        { status: 500 },
      );
    }

    const eventRows = await query<{ tickets_sold: number }>(
      `SELECT tickets_sold FROM events WHERE id = $1 LIMIT 1`,
      [registration.event_id],
    );
    const event = eventRows[0];

    if (event) {
      await query(
        `UPDATE events SET tickets_sold = GREATEST(0, tickets_sold - $1), updated_at = now() WHERE id = $2`,
        [registration.quantity, registration.event_id],
      );
    }

    if (registration.ticket_type_id) {
      await query(
        `UPDATE event_ticket_types SET quantity_sold = GREATEST(0, quantity_sold - $1), updated_at = now() WHERE id = $2`,
        [registration.quantity, registration.ticket_type_id],
      );
    }

    if (registration.buyer_id) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'registration_cancelled', 'Registration Cancelled', $2, $3)`,
        [
          registration.buyer_id,
          refundResult && !refundResult.error
            ? `Your registration has been cancelled. A refund of ${refundResult.amount} has been initiated.`
            : `Your registration has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
          JSON.stringify({
            registration_id: registrationId,
            event_id: registration.event_id,
            refund: refundResult,
          }),
        ],
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        registrationId,
        status: "cancelled",
        refund: refundResult,
      },
      message: "Registration cancelled successfully",
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
