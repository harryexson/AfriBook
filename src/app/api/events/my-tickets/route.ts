import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    const userId = user.id;

    let query = supabase
      .from("ticket_purchases")
      .select(
        "*, events!inner(id, title, slug, start_date, end_date, venue_name, venue_city, cover_image_url, currency_code, status)",
        { count: "exact" },
      )
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === "upcoming") {
      query = query
        .eq("order_status", "confirmed")
        .gte("events.start_date", new Date().toISOString());
    } else if (status === "past") {
      query = query
        .eq("order_status", "confirmed")
        .lt("events.start_date", new Date().toISOString());
    } else if (status && status !== "all") {
      query = query.eq("order_status", status);
    }

    const { data, error, count } = await query;

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
