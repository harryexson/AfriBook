import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

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

    const eventRows = await query<{
      id: string;
      organizer_id: string;
      view_count: number;
      share_count: number;
      favorite_count: number;
      tickets_sold: number;
      total_capacity: number;
      is_free: boolean;
      start_date: string;
      created_at: string;
    }>(
      `SELECT id, organizer_id, view_count, share_count, favorite_count, tickets_sold, total_capacity, is_free, start_date, created_at
       FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const event = eventRows[0];

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

    const totalRegistrationsRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed'`,
      [eventId],
    );
    const totalCheckedInRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND check_in_status = 'checked_in'`,
      [eventId],
    );
    const totalPendingRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND order_status = 'pending'`,
      [eventId],
    );
    const totalCancelledRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND order_status = 'cancelled'`,
      [eventId],
    );

    const revenueData = await query<{
      total: number;
      created_at: string;
      tier_name: string | null;
      tier_tier: string | null;
      tier_price: number | null;
    }>(
      `SELECT tp.total, tp.created_at, ett.name AS tier_name, ett.tier AS tier_tier, ett.price AS tier_price
       FROM ticket_purchases tp
       LEFT JOIN event_ticket_types ett ON ett.id = tp.ticket_type_id
       WHERE tp.event_id = $1 AND tp.order_status = 'confirmed' AND tp.created_at >= $2`,
      [eventId, sinceDateStr],
    );

    let totalRevenue = 0;
    const platformFees = 0;
    const tierBreakdown: Record<string, { count: number; revenue: number }> =
      {};

    revenueData.forEach((r) => {
      totalRevenue += r.total ?? 0;
      const tierName = r.tier_name ?? "Unknown";
      if (!tierBreakdown[tierName]) {
        tierBreakdown[tierName] = { count: 0, revenue: 0 };
      }
      tierBreakdown[tierName].count += 1;
      tierBreakdown[tierName].revenue += r.total ?? 0;
    });

    const dailySales = await query<{
      date: string;
      count: string | number;
      revenue: string | number;
    }>(`SELECT * FROM get_event_daily_sales($1, $2)`, [eventId, sinceDateStr]);

    const dailySalesChart: { date: string; count: number; revenue: number }[] =
      dailySales.map((d) => ({
        date: d.date,
        count: Number(d.count),
        revenue: Number(d.revenue),
      }));

    if (dailySalesChart.length === 0) {
      const dateMap: Record<string, { count: number; revenue: number }> = {};
      revenueData.forEach((r) => {
        const day = r.created_at?.split("T")[0] ?? "";
        if (!dateMap[day]) dateMap[day] = { count: 0, revenue: 0 };
        dateMap[day].count += 1;
        dateMap[day].revenue += r.total ?? 0;
      });
      Object.entries(dateMap).forEach(([date, data]) => {
        dailySalesChart.push({ date, ...data });
      });
    }

    const referralData = await query<{ promo_code: string | null }>(
      `SELECT promo_code FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed' AND promo_code IS NOT NULL`,
      [eventId],
    );

    const referralStats: Record<string, number> = {};
    referralData.forEach((r) => {
      if (r.promo_code) {
        referralStats[r.promo_code] = (referralStats[r.promo_code] ?? 0) + 1;
      }
    });

    const totalSharesRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_shares WHERE event_id = $1`,
      [eventId],
    );
    const totalGuestsRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_guests WHERE event_id = $1`,
      [eventId],
    );

    const totalRegistrations = Number(totalRegistrationsRows[0]?.count ?? 0);
    const totalCheckedIn = Number(totalCheckedInRows[0]?.count ?? 0);
    const totalPending = Number(totalPendingRows[0]?.count ?? 0);
    const totalCancelled = Number(totalCancelledRows[0]?.count ?? 0);
    const totalShares = Number(totalSharesRows[0]?.count ?? 0);
    const totalGuests = Number(totalGuestsRows[0]?.count ?? 0);

    const conversionRate =
      event.view_count > 0
        ? Math.round((totalRegistrations / event.view_count) * 100)
        : 0;

    const checkInRate =
      totalRegistrations > 0
        ? Math.round((totalCheckedIn / (totalRegistrations || 1)) * 100)
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
          totalRegistrations,
          totalCheckedIn,
          totalPending,
          totalCancelled,
          totalGuests,
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
        recentRegistrations: revenueData.slice(-10).map((r) => ({
          date: r.created_at,
          total: r.total,
          tier: r.tier_name,
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
