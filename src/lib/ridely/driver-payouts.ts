// ─── Driver Payouts Service ──────────────────────────────────
// Handles driver earnings tracking, payout scheduling, and
// instant payout/EWA (Earned Wage Access).
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

// ─── Types ───────────────────────────────────────────────────

interface DriverEarning {
  id: string;
  driverId: string;
  tripId: string;
  tripType: 'ride' | 'delivery' | 'food_delivery';
  baseAmount: number;
  tips: number;
  surgeBonus: number;
  promotionBonus: number;
  totalAmount: number;
  currencyCode: string;
  status: 'pending' | 'cleared' | 'paid' | 'disputed';
  clearedAt?: string;
  paidAt?: string;
  createdAt: string;
}

interface DriverBalance {
  available: number;
  pending: number;
  totalEarned: number;
  currencyCode: string;
}

// ─── Get Driver Balance ──────────────────────────────────────

export async function getDriverBalance(driverId: string): Promise<DriverBalance> {
  const supabase = await createClient();

  const { data: earnings } = (await (supabase.from('driver_earnings') as any)
    .select('total_amount, status')
    .eq('driver_id', driverId)) as { data: any[] | null };

  if (!earnings) {
    return { available: 0, pending: 0, totalEarned: 0, currencyCode: 'NGN' };
  }

  let available = 0;
  let pending = 0;
  let totalEarned = 0;

  for (const e of earnings) {
    const amount = (e.total_amount as number) ?? 0;
    totalEarned += amount;

    if (e.status === 'cleared') {
      available += amount;
    } else if (e.status === 'pending') {
      pending += amount;
    }
  }

  return {
    available: Math.round(available),
    pending: Math.round(pending),
    totalEarned: Math.round(totalEarned),
    currencyCode: 'NGN',
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

  return data.map(rowToDriverEarning);
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
  promotionEarnings: number;
  byDay: Array<{ date: string; earnings: number; trips: number }>;
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
      promotionEarnings: 0,
      byDay: [],
    };
  }

  let totalEarnings = 0;
  let tips = 0;
  let surgeEarnings = 0;
  let promotionEarnings = 0;
  const byDayMap = new Map<string, { earnings: number; trips: number }>();

  for (const e of earnings) {
    const amount = (e.total_amount as number) ?? 0;
    totalEarnings += amount;
    tips += (e.tips as number) ?? 0;
    surgeEarnings += (e.surge_bonus as number) ?? 0;
    promotionEarnings += (e.promotion_bonus as number) ?? 0;

    const date = (e.created_at as string).slice(0, 10);
    const dayData = byDayMap.get(date) ?? { earnings: 0, trips: 0 };
    dayData.earnings += amount;
    dayData.trips++;
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
    promotionEarnings: Math.round(promotionEarnings),
    byDay,
  };
}

// ─── Request Instant Payout ──────────────────────────────────

export async function requestInstantPayout(
  driverId: string,
  amount: number,
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  const supabase = await createClient();

  const balance = await getDriverBalance(driverId);

  if (amount > balance.available) {
    return { success: false, error: 'Insufficient available balance' };
  }

  if (amount < 100) {
    return { success: false, error: 'Minimum instant payout is 100' };
  }

  // Get driver's payout method
  const { data: driver } = await supabase
    .from('drivers')
    .select('userId')
    .eq('id', driverId)
    .single();

  if (!driver) {
    return { success: false, error: 'Driver not found' };
  }

  const { data: payoutMethod } = await (supabase.from('driver_payout_methods') as any)
    .select('*')
    .eq('user_id', driver.userId)
    .eq('is_primary', true)
    .single();

  if (!payoutMethod) {
    return { success: false, error: 'No payout method configured' };
  }

  // Create payout record
  const { data: payout, error } = await (supabase.from('driver_payouts') as any)
    .insert({
      driver_id: driverId,
      amount,
      currency_code: 'NGN',
      method: 'instant',
      status: 'processing',
      reference: `INST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })
    .select()
    .single();

  if (error || !payout) {
    return { success: false, error: 'Failed to create payout' };
  }

  // Mark related earnings as paid
  const { data: earningsToPay } = await (supabase.from('driver_earnings') as any)
    .select('id')
    .eq('driver_id', driverId)
    .eq('status', 'cleared')
    .order('created_at', { ascending: true });

  if (earningsToPay?.length) {
    const earningIds = earningsToPay.map((e: any) => e.id).slice(0, 100);

    await (supabase.from('driver_earnings') as any)
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .in('id', earningIds);
  }

  // Process via payment provider (simplified)
  // In production, this would call Flutterwave/M-Pesa/Stripe payout API
  setTimeout(async () => {
    await (supabase.from('driver_payouts') as any)
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', payout.id);
  }, 5000);

  return { success: true, payoutId: payout.id as string };
}

// ─── Record Earning ──────────────────────────────────────────

export async function recordEarning(
  driverId: string,
  tripId: string,
  tripType: DriverEarning['tripType'],
  baseAmount: number,
  tips: number = 0,
  surgeBonus: number = 0,
  promotionBonus: number = 0,
): Promise<DriverEarning | null> {
  const supabase = await createClient();

  const totalAmount = baseAmount + tips + surgeBonus + promotionBonus;

  const { data, error } = await (supabase.from('driver_earnings') as any)
    .insert({
      driver_id: driverId,
      trip_id: tripId,
      trip_type: tripType,
      base_amount: baseAmount,
      tips,
      surge_bonus: surgeBonus,
      promotion_bonus: promotionBonus,
      total_amount: totalAmount,
      currency_code: 'NGN',
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) return null;
  return rowToDriverEarning(data);
}

// ─── Private Helpers ──────────────────────────────────────────

function rowToDriverEarning(row: Record<string, unknown>): DriverEarning {
  return {
    id: row.id as string,
    driverId: row.driver_id as string,
    tripId: row.trip_id as string,
    tripType: row.trip_type as DriverEarning['tripType'],
    baseAmount: row.base_amount as number,
    tips: (row.tips as number) ?? 0,
    surgeBonus: (row.surge_bonus as number) ?? 0,
    promotionBonus: (row.promotion_bonus as number) ?? 0,
    totalAmount: row.total_amount as number,
    currencyCode: (row.currency_code as string) ?? 'NGN',
    status: row.status as DriverEarning['status'],
    clearedAt: row.cleared_at as string | undefined,
    paidAt: row.paid_at as string | undefined,
    createdAt: row.created_at as string,
  };
}
