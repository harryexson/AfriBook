import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import {
  createClient as createAuthClient,
  requireAuthenticatedUser,
} from "@/lib/supabase/server";

const supabase = createServiceRoleClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      minOrderAmount,
    } = body;

    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !validFrom ||
      !validUntil
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: code, discountType, discountValue, validFrom, validUntil",
        },
        { status: 400 },
      );
    }

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

    if (event.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: only the event organizer or an admin can create promo codes",
        },
        { status: 403 },
      );
    }

    if (!["percent", "fixed"].includes(discountType)) {
      return NextResponse.json(
        { success: false, error: 'discountType must be "percent" or "fixed"' },
        { status: 400 },
      );
    }

    if (
      discountType === "percent" &&
      (discountValue < 1 || discountValue > 100)
    ) {
      return NextResponse.json(
        { success: false, error: "Percent discount must be between 1 and 100" },
        { status: 400 },
      );
    }

    if (discountType === "fixed" && discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Fixed discount must be greater than 0" },
        { status: 400 },
      );
    }

    if (new Date(validUntil) <= new Date(validFrom)) {
      return NextResponse.json(
        { success: false, error: "validUntil must be after validFrom" },
        { status: 400 },
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    const { data: existingPromo } = await supabase
      .from("event_promo_codes")
      .select("id")
      .eq("event_id", eventId)
      .eq("code", normalizedCode)
      .single();

    if (existingPromo) {
      return NextResponse.json(
        {
          success: false,
          error: "A promo code with this name already exists for this event",
        },
        { status: 409 },
      );
    }

    const promoData = {
      event_id: eventId,
      code: normalizedCode,
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses ?? 100,
      used_count: 0,
      min_order_amount: minOrderAmount ?? 0,
      valid_from: validFrom,
      valid_until: validUntil,
      is_active: true,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    const { data: promo, error: promoError } = await supabase
      .from("event_promo_codes")
      .insert(promoData)
      .select()
      .single();

    if (promoError) {
      return NextResponse.json(
        { success: false, error: "Failed to create promo code" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: promo,
        message: "Promo code created successfully",
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
    const authSupabase = await createAuthClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    const profileResponse = user
      ? await authSupabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
      : null;
    const isAdmin =
      profileResponse?.data?.role === "admin" ||
      profileResponse?.data?.role === "super_admin";

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, error: "code query parameter is required" },
        { status: 400 },
      );
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, status, organizer_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    const { data: promo, error: promoError } = await supabase
      .from("event_promo_codes")
      .select("*")
      .eq("event_id", eventId)
      .eq("code", code.toUpperCase().trim())
      .single();

    if (promoError || !promo) {
      return NextResponse.json(
        { success: false, error: "Promo code not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    if (!promo.is_active) {
      return NextResponse.json(
        { success: false, error: "Promo code is inactive" },
        { status: 400 },
      );
    }

    if (new Date(promo.valid_from) > now) {
      return NextResponse.json(
        { success: false, error: "Promo code is not yet valid" },
        { status: 400 },
      );
    }

    if (new Date(promo.valid_until) < now) {
      return NextResponse.json(
        { success: false, error: "Promo code has expired" },
        { status: 400 },
      );
    }

    if (promo.used_count >= promo.max_uses) {
      return NextResponse.json(
        {
          success: false,
          error: "Promo code has reached its maximum usage limit",
        },
        { status: 400 },
      );
    }

    const isOrganizer = user?.id === event.organizer_id;

    if (isOrganizer || isAdmin) {
      return NextResponse.json({
        success: true,
        data: {
          id: promo.id,
          code: promo.code,
          discountType: promo.discount_type,
          discountValue: promo.discount_value,
          maxUses: promo.max_uses,
          usedCount: promo.used_count,
          remainingUses: promo.max_uses - promo.used_count,
          minOrderAmount: promo.min_order_amount,
          validFrom: promo.valid_from,
          validUntil: promo.valid_until,
          isActive: promo.is_active,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        remainingUses: promo.max_uses - promo.used_count,
        minOrderAmount: promo.min_order_amount,
        validUntil: promo.valid_until,
      },
      message: "Promo code is valid",
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
