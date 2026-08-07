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
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";

    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "30d";

    const { data: event } = await supabase
      .from("events")
      .select(
        "id, organizer_id, view_count, share_count, favorite_count, tickets_sold, total_capacity, is_free, start_date, created_at",
      )
      .eq("id", eventId)
      .single();

    if (!event || (event.organizer_id !== user.id && !isAdmin)) {
      return NextResponse.json(
        { success: false, error: "Event not found or unauthorized" },
        { status: 404 },
      );
    }

    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      all: 365,
    };
    const days = daysMap[period] ?? 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceDateStr = sinceDate.toISOString();

    const { count: totalRegistrations } = await supabase
      .from("ticket_purchases")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("order_status", "confirmed");

    const { count: totalCheckedIn } = await supabase
      .from("ticket_purchases")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("check_in_status", "checked_in");

    const { count: totalPending } = await supabase
      .from("ticket_purchases")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("order_status", "pending");

    const { count: totalCancelled } = await supabase
      .from("ticket_purchases")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("order_status", "cancelled");

    const { data: revenueData } = await supabase
      .from("ticket_purchases")
      .select("total, created_at, event_ticket_types(name, tier, price)")
      .eq("event_id", eventId)
      .eq("order_status", "confirmed")
      .gte("created_at", sinceDateStr);

    let totalRevenue = 0;
    const platformFees = 0;
    const tierBreakdown: Record<string, { count: number; revenue: number }> =
      {};

    (revenueData ?? []).forEach((r) => {
      totalRevenue += r.total ?? 0;
      const tierName =
        ((r.event_ticket_types as unknown as Record<string, unknown>)
          ?.name as string) ?? "Unknown";
      if (!tierBreakdown[tierName]) {
        tierBreakdown[tierName] = { count: 0, revenue: 0 };
      }
      tierBreakdown[tierName].count += 1;
      tierBreakdown[tierName].revenue += r.total ?? 0;
    });

    const { data: dailySales } = await supabase.rpc(
      "get_event_daily_sales" as never,
      {
        p_event_id: eventId,
        p_since_date: sinceDateStr,
      } as never,
    );

    const dailySalesChart =
      (dailySales as
        { date: string; count: number; revenue: number }[] | null) ?? [];

    if (dailySalesChart.length === 0) {
      const dateMap: Record<string, { count: number; revenue: number }> = {};
      (revenueData ?? []).forEach((r) => {
        const day = r.created_at?.split("T")[0] ?? "";
        if (!dateMap[day]) dateMap[day] = { count: 0, revenue: 0 };
        dateMap[day].count += 1;
        dateMap[day].revenue += r.total ?? 0;
      });
      Object.entries(dateMap).forEach(([date, data]) => {
        dailySalesChart.push({ date, ...data });
      });
    }

    const { data: referralData } = await supabase
      .from("ticket_purchases")
      .select("promo_code")
      .eq("event_id", eventId)
      .eq("order_status", "confirmed")
      .not("promo_code", "is", null);

    const referralStats: Record<string, number> = {};
    (referralData ?? []).forEach((r) => {
      if (r.promo_code) {
        referralStats[r.promo_code] = (referralStats[r.promo_code] ?? 0) + 1;
      }
    });

    const { count: totalShares } = await supabase
      .from("event_shares")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    const { count: totalGuests } = await supabase
      .from("event_guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    const conversionRate =
      event.view_count > 0
        ? Math.round(((totalRegistrations ?? 0) / event.view_count) * 100)
        : 0;

    const checkInRate =
      (totalRegistrations ?? 0) > 0
        ? Math.round(((totalCheckedIn ?? 0) / (totalRegistrations ?? 1)) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        eventId,
        period,
        overview: {
          views: event.view_count ?? 0,
          uniqueViews: event.view_count ?? 0,
          ticketsSold: event.tickets_sold ?? 0,
          totalCapacity: event.total_capacity ?? 0,
          capacityUsedPercent:
            event.total_capacity > 0
              ? Math.round(
                  ((event.tickets_sold ?? 0) / event.total_capacity) * 100,
                )
              : 0,
          totalRegistrations: totalRegistrations ?? 0,
          totalCheckedIn: totalCheckedIn ?? 0,
          totalPending: totalPending ?? 0,
          totalCancelled: totalCancelled ?? 0,
          totalGuests: totalGuests ?? 0,
          totalRevenue,
          platformFees,
          conversionRate,
          checkInRate,
          shareCount: totalShares ?? event.share_count ?? 0,
          favoriteCount: event.favorite_count ?? 0,
        },
        tierBreakdown,
        referralStats: Object.entries(referralStats)
          .map(([code, conversions]) => ({ code, conversions }))
          .sort((a, b) => b.conversions - a.conversions),
        dailySales: dailySalesChart.sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        recentRegistrations: (revenueData ?? []).slice(-10).map((r) => ({
          date: r.created_at,
          total: r.total,
          tier: (r.event_ticket_types as unknown as Record<string, unknown>)
            ?.name,
        })),
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
