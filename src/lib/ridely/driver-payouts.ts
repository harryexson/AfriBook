// ─── Driver Payouts Service ──────────────────────────────────
// Handles driver earnings tracking, payout scheduling, and
// instant payout/EWA (Earned Wage Access).
//
// Currency is resolved per driver from their profile's country,
// never hard-coded. Every insert/select matches the schema in
// migrations 001/006 (earnings_status, payout_type, `currency`).
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry } from '@/lib/money';

// ─── Types ───────────────────────────────────────────────────

export interface DriverEarning {
  id: string;
  driverId: string;
  tripId?: string;
  tripType?: 'ride' | 'delivery' | 'food_delivery';
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeBonus: number;
  tips: number;
  platformFee: number;
  totalAmount: number;
  currencyCode: string;
  status: 'pending' | 'available' | 'paid_out' | 'disputed';
  createdAt: string;
}

export interface DriverBalance {
  available: number;
  pending: number;
  totalEarned: number;
  currencyCode: string;
}

// ─── Currency Resolution ─────────────────────────────────────

/**
 * Resolve the currency for a driver from their profile's country.
 * Falls back to the neutral global default (USD) when unknown.
 */
async function resolveDriverCurrencyCode(driverId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: driver } = await (supabase.from('drivers') as any)
      .select('profile_id')
      .eq('id', driverId)
      .maybeSingle();

    if (driver?.profile_id) {
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('country_code')
        .eq('id', driver.profile_id)
        .maybeSingle();

      if (profile?.country_code) {
        return getCurrencyForCountry(profile.country_code);
      }
    }
  } catch {
    // Fall through to the global default.
  }
  return 'USD';
}

// ─── Get Driver Balance ──────────────────────────────────────

export async function getDriverBalance(driverId: string): Promise<DriverBalance> {
  const supabase = await createClient();
  const currencyCode = await resolveDriverCurrencyCode(driverId);

  const { data: earnings } = (await (supabase.from('driver_earnings') as any)
    .select('total_earnings, status')
    .eq('driver_id', driverId)) as { data: any[] | null };

  const { data: payouts } = (await (supabase.from('driver_payouts') as any)
    .select('amount, status')
    .eq('driver_id', driverId)) as { data: any[] | null };

  let available = 0;
  let pending = 0;
  let totalEarned = 0;
  let paidOut = 0;

  for (const e of earnings ?? []) {
    const amount = Number(e.total_earnings ?? 0);
    totalEarned += amount;

    if (e.status === 'available') {
      available += amount;
    } else if (e.status === 'pending') {
      pending += amount;
    }
  }

  // Mirror the DB available-earnings invariant (migration 012
  // validate_driver_payout): outstanding payouts reduce the available balance.
  for (const p of payouts ?? []) {
    if (['pending', 'processing', 'completed'].includes(p.status)) {
      paidOut += Number(p.amount ?? 0);
    }
  }

  return {
    available: Math.max(0, Math.round(available - paidOut)),
    pending: Math.round(pending),
    totalEarned: Math.round(totalEarned),
    currencyCode,
  };
}

// ─── Get Driver Earnings ─────────────────────────────────────

export async function getDriverEarnings(
  driverId: string,
  options: {
    status?: DriverEarning['status'];
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<DriverEarning[]> {
  const supabase = await createClient();

  let query = (supabase.from('driver_earnings') as any)
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row: any) => rowToDriverEarning(row));
}

// ─── Get Earnings Summary ────────────────────────────────────

export async function getEarningsSummary(
  driverId: string,
  period: 'day' | 'week' | 'month' | 'all' = 'week',
): Promise<{
  totalEarnings: number;
  tripCount: number;
  avgPerTrip: number;
  tips: number;
  surgeEarnings: number;
  platformFees: number;
  promotionEarnings: number;
  byDay: Array<{
    date: string;
    earnings: number;
    trips: number;
    tips: number;
    surge: number;
  }>;
}> {
  const supabase = await createClient();

  let since: string;
  const now = new Date();

  switch (period) {
    case 'day':
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      break;
    case 'week': {
      const dayOfWeek = now.getDay();
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).toISOString();
      break;
    }
    case 'month':
      since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
    default:
      since = '2000-01-01T00:00:00Z';
  }

  const { data: earnings } = (await (supabase.from('driver_earnings') as any)
    .select('*')
    .eq('driver_id', driverId)
    .gte('created_at', since)) as { data: any[] | null };

  if (!earnings?.length) {
    return {
      totalEarnings: 0,
      tripCount: 0,
      avgPerTrip: 0,
      tips: 0,
      surgeEarnings: 0,
      platformFees: 0,
      promotionEarnings: 0,
      byDay: [],
    };
  }

  let totalEarnings = 0;
  let tips = 0;
  let surgeEarnings = 0;
  let platformFees = 0;
  const byDayMap = new Map<string, { earnings: number; trips: number; tips: number; surge: number }>();

  for (const e of earnings) {
    const amount = Number(e.total_earnings ?? 0);
    totalEarnings += amount;
    tips += Number(e.tip ?? 0);
    surgeEarnings += Number(e.surge_bonus ?? 0);
    platformFees += Number(e.platform_fee ?? 0);

    const date = (e.created_at as string).slice(0, 10);
    const dayData = byDayMap.get(date) ?? { earnings: 0, trips: 0, tips: 0, surge: 0 };
    dayData.earnings += amount;
    dayData.trips++;
    dayData.tips += Number(e.tip ?? 0);
    dayData.surge += Number(e.surge_bonus ?? 0);
    byDayMap.set(date, dayData);
  }

  const byDay = Array.from(byDayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalEarnings: Math.round(totalEarnings),
    tripCount: earnings.length,
    avgPerTrip: Math.round(totalEarnings / earnings.length),
    tips: Math.round(tips),
    surgeEarnings: Math.round(surgeEarnings),
    platformFees: Math.round(platformFees),
    promotionEarnings: 0,
    byDay,
  };
}

// ─── Request Instant Payout ──────────────────────────────────

export async function requestInstantPayout(
  driverId: string,
  amount: number,
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  const supabase = await createClient();
  const currencyCode = await resolveDriverCurrencyCode(driverId);

  const balance = await getDriverBalance(driverId);

  if (amount > balance.available) {
    return { success: false, error: 'Insufficient available balance' };
  }

  if (amount < 100) {
    return { success: false, error: 'Minimum instant payout is 100' };
  }

  // Create payout record against the real schema. Drivers may only insert
  // 'pending' payouts (migration 012 validate_driver_payout + RLS INSERT
  // policy); the transition to 'processing'/'completed' is done by the payout
  // worker/webhook using a service-role client.
  const { data: payout, error } = await (supabase.from('driver_payouts') as any)
    .insert({
      driver_id: driverId,
      amount,
      fee: 0,
      net_amount: amount,
      payout_type: 'instant',
      status: 'pending',
      payout_method: {},
      currency: currencyCode,
    })
    .select()
    .single();

  if (error || !payout) {
    return { success: false, error: 'Failed to create payout' };
  }

  return { success: true, payoutId: payout.id as string };
}

// ─── Record Earning ──────────────────────────────────────────

export async function recordEarning(
  driverId: string,
  options: {
    rideId?: string;
    deliveryId?: string;
    baseFare?: number;
    distanceFare?: number;
    timeFare?: number;
    surgeBonus?: number;
    tip?: number;
    platformFee?: number;
  } = {},
): Promise<DriverEarning | null> {
  const supabase = await createClient();
  const currencyCode = await resolveDriverCurrencyCode(driverId);

  const baseFare = options.baseFare ?? 0;
  const distanceFare = options.distanceFare ?? 0;
  const timeFare = options.timeFare ?? 0;
  const surgeBonus = options.surgeBonus ?? 0;
  const tip = options.tip ?? 0;
  const platformFee = options.platformFee ?? 0;
  const totalAmount = baseFare + distanceFare + timeFare + surgeBonus + tip - platformFee;

  const { data, error } = await (supabase.from('driver_earnings') as any)
    .insert({
      driver_id: driverId,
      ride_id: options.rideId ?? null,
      delivery_id: options.deliveryId ?? null,
      base_fare: baseFare,
      distance_fare: distanceFare,
      time_fare: timeFare,
      surge_bonus: surgeBonus,
      tip,
      platform_fee: platformFee,
      total_earnings: totalAmount,
      currency: currencyCode,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) return null;
  return rowToDriverEarning(data);
}

// ─── Get Driver Payouts ──────────────────────────────────────

export interface DriverPayout {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  payoutType: 'weekly' | 'instant' | 'ewa';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'on_hold';
  currencyCode: string;
  createdAt: string;
  completedAt?: string | null;
}

export async function getDriverPayouts(
  driverId: string,
  options: { limit?: number } = {},
): Promise<DriverPayout[]> {
  const supabase = await createClient();
  const limit = options.limit ?? 20;

  const { data, error } = await (supabase.from('driver_payouts') as any)
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .range(0, limit - 1);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id as string,
    amount: Number(row.amount ?? 0),
    fee: Number(row.fee ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    payoutType: row.payout_type as DriverPayout['payoutType'],
    status: row.status as DriverPayout['status'],
    currencyCode: (row.currency as string) ?? 'USD',
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
  }));
}

// ─── Private Helpers ──────────────────────────────────────────

function rowToDriverEarning(row: Record<string, unknown>): DriverEarning {
  const status = row.status as string;
  return {
    id: row.id as string,
    driverId: row.driver_id as string,
    tripId: (row.ride_id as string) ?? (row.delivery_id as string),
    baseFare: Number(row.base_fare ?? 0),
    distanceFare: Number(row.distance_fare ?? 0),
    timeFare: Number(row.time_fare ?? 0),
    surgeBonus: Number(row.surge_bonus ?? 0),
    tips: Number(row.tip ?? 0),
    platformFee: Number(row.platform_fee ?? 0),
    totalAmount: Number(row.total_earnings ?? 0),
    currencyCode: (row.currency as string) ?? 'USD',
    status: (status as DriverEarning['status']) ?? 'pending',
    createdAt: row.created_at as string,
  };
}
