// ─── Vendor Analytics Service ─────────────────────────────────
// Aggregates a vendor's own `bookings` (services) and `orders`
// (products/food) into dashboard-ready numbers. Mirrors the pattern in
// `driver-payouts.ts`: pure aggregation functions, currency resolved from
// the business's own registered country — never hardcoded.
//
// Bookings revenue and orders revenue are kept SEPARATE throughout, by
// product decision — a business selling both services and physical
// products/food needs to see which side is actually driving revenue, not
// one blended number.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry } from '@/lib/money';

export type AnalyticsPeriod = '7d' | '30d';

export interface RevenueDayPoint {
  date: string;
  bookingsRevenue: number;
  ordersRevenue: number;
}

export interface PeakHourPoint {
  hour: string; // '0'..'23'
  count: number;
}

export interface TopServicePoint {
  serviceId: string;
  name: string;
  bookingCount: number;
  revenue: number;
}

export interface StaffPerformancePoint {
  staffId: string;
  name: string;
  bookingCount: number;
  revenue: number;
  avgRating: number | null; // null when no reviews in period — not faked as 0
}

export interface VendorAnalytics {
  currencyCode: string;
  bookings: {
    count: number;
    revenue: number;
    changePercent: number; // vs the prior period of equal length
  };
  orders: {
    count: number;
    revenue: number;
    changePercent: number;
  };
  avgRating: number;
  activeServices: number;
  revenueByDay: RevenueDayPoint[];
  // Added for the vendor/analytics page consolidation — same endpoint,
  // same currency resolution, same period model (7d/30d), rather than a
  // second parallel data source.
  totalRevenue: number;
  totalOrders: number; // bookings + orders combined count
  avgOrderValue: number;
  repeatCustomerRate: number; // 0-100
  peakHours: PeakHourPoint[]; // UTC hour buckets — see note in getVendorAnalytics
  topServices: TopServicePoint[];
  staffPerformance: StaffPerformancePoint[];
}

function periodDays(period: AnalyticsPeriod): number {
  return period === '30d' ? 30 : 7;
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Resolve the business a vendor profile owns. A profile could in theory
 *  own more than one business; this dashboard shows the first one until
 *  multi-business switching exists. */
export async function resolveVendorBusinessId(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await (supabase.from('businesses') as any)
    .select('id')
    .eq('owner_id', profileId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

/** Resolve the restaurant record for a vendor's business (restaurants are
 *  a distinct table from businesses — a business "is a" restaurant via
 *  this join, same relationship pattern as business_staff). */
export async function resolveVendorRestaurantId(businessId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await (supabase.from('restaurants') as any)
    .select('id')
    .eq('business_id', businessId)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

/** Last N bookings for a business, shaped to match the `Booking` type the
 *  `RecentBookings` component already expects — it was built to accept
 *  real data via a `bookings` prop, it just never received any. */
export async function getRecentBookings(businessId: string, limit = 5) {
  const supabase = await createClient();
  const { data } = await (supabase.from('bookings') as any)
    .select('id, business_id, service_id, customer_id, staff_id, start_time, end_time, status, amount, currency, payment_status, reminders_sent, created_at, updated_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    businessId: row.business_id,
    serviceId: row.service_id,
    customerId: row.customer_id,
    staffId: row.staff_id ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    amount: Number(row.amount),
    currencyCode: row.currency,
    paymentStatus: row.payment_status,
    reminders: row.reminders_sent ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getVendorAnalytics(
  businessId: string,
  period: AnalyticsPeriod = '7d',
): Promise<VendorAnalytics> {
  const supabase = await createClient();
  const days = periodDays(period);
  const now = new Date();
  const since = new Date(now.getTime() - days * 86400000);
  const previousSince = new Date(now.getTime() - days * 2 * 86400000);

  const [
    { data: business },
    { data: currentBookings },
    { data: previousBookings },
    { data: currentOrders },
    { data: previousOrders },
    { data: services },
    { data: businessStaff },
  ] = await Promise.all([
    ((supabase.from('businesses') as any) as any).select('rating, country_code').eq('id', businessId).single(),
    (supabase.from('bookings') as any)
      .select('amount, currency, created_at, status, service_id, staff_id, customer_id')
      .eq('business_id', businessId)
      .gte('created_at', since.toISOString())
      .neq('status', 'cancelled'),
    (supabase.from('bookings') as any)
      .select('amount, status')
      .eq('business_id', businessId)
      .gte('created_at', previousSince.toISOString())
      .lt('created_at', since.toISOString())
      .neq('status', 'cancelled'),
    (supabase.from('orders') as any)
      .select('total, currency, created_at, status, customer_id')
      .eq('business_id', businessId)
      .gte('created_at', since.toISOString())
      .neq('status', 'cancelled'),
    (supabase.from('orders') as any)
      .select('total, status')
      .eq('business_id', businessId)
      .gte('created_at', previousSince.toISOString())
      .lt('created_at', since.toISOString())
      .neq('status', 'cancelled'),
    ((supabase.from('services') as any) as any).select('id, name').eq('business_id', businessId).eq('is_available', true),
    ((supabase.from('business_staff') as any) as any).select('id, name').eq('business_id', businessId).eq('is_active', true),
  ]);

  const currencyCode = (business as any)?.country_code
    ? getCurrencyForCountry((business as any).country_code)
    : 'USD';

  const bookingRows = (currentBookings ?? []) as any[];
  const prevBookingRows = (previousBookings ?? []) as any[];
  const orderRows = (currentOrders ?? []) as any[];
  const prevOrderRows = (previousOrders ?? []) as any[];

  const bookingsRevenue = bookingRows.reduce((sum, b) => sum + Number(b.amount ?? 0), 0);
  const prevBookingsRevenue = prevBookingRows.reduce((sum, b) => sum + Number(b.amount ?? 0), 0);
  const ordersRevenue = orderRows.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const prevOrdersRevenue = prevOrderRows.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  // Build a per-day series for the revenue chart, bookings and orders kept
  // as separate values per day rather than summed into one bar/line.
  const byDay = new Map<string, RevenueDayPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10);
    byDay.set(d, { date: d, bookingsRevenue: 0, ordersRevenue: 0 });
  }
  for (const b of bookingRows) {
    const d = String(b.created_at).slice(0, 10);
    const point = byDay.get(d);
    if (point) point.bookingsRevenue += Number(b.amount ?? 0);
  }
  for (const o of orderRows) {
    const d = String(o.created_at).slice(0, 10);
    const point = byDay.get(d);
    if (point) point.ordersRevenue += Number(o.total ?? 0);
  }

  // Peak hours — bucketed in UTC. There's no per-business timezone field
  // in the schema, so this can't be shifted to local time without one;
  // flagging rather than silently assuming a timezone.
  const hourCounts = new Array(24).fill(0);
  for (const b of bookingRows) hourCounts[new Date(b.created_at).getUTCHours()]++;
  for (const o of orderRows) hourCounts[new Date(o.created_at).getUTCHours()]++;
  const peakHours: PeakHourPoint[] = hourCounts.map((count, hour) => ({ hour: String(hour), count }));

  // Top services — grouped from the same booking rows already fetched.
  const serviceNameById = new Map<string, string>(((services ?? []) as any[]).map((s) => [s.id, s.name]));
  const serviceAgg = new Map<string, { bookingCount: number; revenue: number }>();
  for (const b of bookingRows) {
    if (!b.service_id) continue;
    const entry = serviceAgg.get(b.service_id) ?? { bookingCount: 0, revenue: 0 };
    entry.bookingCount += 1;
    entry.revenue += Number(b.amount ?? 0);
    serviceAgg.set(b.service_id, entry);
  }
  const topServices: TopServicePoint[] = Array.from(serviceAgg.entries())
    .map(([serviceId, agg]) => ({
      serviceId,
      name: serviceNameById.get(serviceId) ?? 'Unknown service',
      ...agg,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Staff performance — bookings/revenue from rows already fetched;
  // ratings from a separate query since they live on `reviews`, joined
  // through the booking they were left for. Only reviews left in this same
  // period are counted, so a staff member with no reviews yet in-period
  // shows `avgRating: null` rather than a fabricated 0 or 5.
  const staffAgg = new Map<string, { bookingCount: number; revenue: number }>();
  for (const b of bookingRows) {
    if (!b.staff_id) continue;
    const entry = staffAgg.get(b.staff_id) ?? { bookingCount: 0, revenue: 0 };
    entry.bookingCount += 1;
    entry.revenue += Number(b.amount ?? 0);
    staffAgg.set(b.staff_id, entry);
  }

  const staffRatings = new Map<string, number[]>();
  if (staffAgg.size > 0) {
    const { data: reviewRows } = await (supabase.from('reviews') as any)
      .select('rating, bookings!inner(staff_id)')
      .eq('business_id', businessId)
      .gte('created_at', since.toISOString());
    for (const r of (reviewRows ?? []) as any[]) {
      const staffId = r.bookings?.staff_id;
      if (!staffId) continue;
      const list = staffRatings.get(staffId) ?? [];
      list.push(Number(r.rating));
      staffRatings.set(staffId, list);
    }
  }

  const staffNameById = new Map<string, string>(((businessStaff ?? []) as any[]).map((s) => [s.id, s.name]));
  const staffPerformance: StaffPerformancePoint[] = Array.from(staffAgg.entries())
    .map(([staffId, agg]) => {
      const ratings = staffRatings.get(staffId);
      return {
        staffId,
        name: staffNameById.get(staffId) ?? 'Unknown staff',
        ...agg,
        avgRating: ratings?.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Repeat customer rate — of the customers who transacted in this period,
  // what fraction had ALSO transacted with this business before it. This
  // is the standard definition of "repeat" (returning, not just multi-
  // buying within one window), so it requires a lookback query beyond the
  // period's own rows.
  const currentCustomerIds = Array.from(
    new Set([...bookingRows.map((b) => b.customer_id), ...orderRows.map((o) => o.customer_id)].filter(Boolean)),
  );
  let repeatCustomerRate = 0;
  if (currentCustomerIds.length > 0) {
    const [{ data: priorBookingCustomers }, { data: priorOrderCustomers }] = await Promise.all([
      (supabase.from('bookings') as any)
        .select('customer_id')
        .eq('business_id', businessId)
        .lt('created_at', since.toISOString())
        .in('customer_id', currentCustomerIds),
      (supabase.from('orders') as any)
        .select('customer_id')
        .eq('business_id', businessId)
        .lt('created_at', since.toISOString())
        .in('customer_id', currentCustomerIds),
    ]);
    const returningCustomerIds = new Set([
      ...((priorBookingCustomers ?? []) as any[]).map((r) => r.customer_id),
      ...((priorOrderCustomers ?? []) as any[]).map((r) => r.customer_id),
    ]);
    repeatCustomerRate = Math.round((returningCustomerIds.size / currentCustomerIds.length) * 1000) / 10;
  }

  const totalOrders = bookingRows.length + orderRows.length;
  const totalRevenue = bookingsRevenue + ordersRevenue;

  return {
    currencyCode,
    bookings: {
      count: bookingRows.length,
      revenue: bookingsRevenue,
      changePercent: percentChange(bookingsRevenue, prevBookingsRevenue),
    },
    orders: {
      count: orderRows.length,
      revenue: ordersRevenue,
      changePercent: percentChange(ordersRevenue, prevOrdersRevenue),
    },
    avgRating: Number((business as any)?.rating ?? 0),
    activeServices: (services ?? []).length,
    revenueByDay: Array.from(byDay.values()),
    totalRevenue,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
    repeatCustomerRate,
    peakHours,
    topServices,
    staffPerformance,
  };
}
