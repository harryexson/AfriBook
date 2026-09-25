// ─── Driver Insurance Add-Ons ─────────────────────────────────
// Every driver already gets free "RideShield Basic" accident coverage
// while actively on a trip (bundled into the platform fee — see
// PLATFORM_FEE_BREAKDOWN in earnings-report.ts). This module lets a
// driver opt into a bigger, Uber/Lyft-style commercial add-on plan,
// paid weekly and deducted directly from their earnings.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

export interface InsurancePlan {
  code: string;
  name: string;
  /** Weekly premium as a fraction of the driver's trailing-week earnings
   *  (currency-safe across markets — a flat number wouldn't be). */
  weeklyPremiumRate: number;
  coverage: string[];
  /** Rewards tiers can discount this — see rewards-program.ts. */
  rewardsDiscountEligible: boolean;
}

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    code: 'ride_shield_basic',
    name: 'RideShield Basic',
    weeklyPremiumRate: 0,
    coverage: [
      'Included free with every trip — no opt-in required',
      'Third-party liability while a rider or order is in the vehicle',
      'Basic medical payments coverage for the driver, on-trip only',
    ],
    rewardsDiscountEligible: false,
  },
  {
    code: 'ride_shield_plus',
    name: 'RideShield Plus',
    weeklyPremiumRate: 0.02,
    coverage: [
      'Everything in Basic',
      'Coverage extended to the moment you go online — not just while a trip is active',
      'Contingent comprehensive & collision, subject to deductible',
      'Uninsured/underinsured motorist protection',
    ],
    rewardsDiscountEligible: true,
  },
  {
    code: 'ride_shield_total',
    name: 'RideShield Total',
    weeklyPremiumRate: 0.045,
    coverage: [
      'Everything in Plus',
      'Zero deductible on collision claims while dispatched',
      'Lost-earnings compensation while your vehicle is in the shop after a covered claim',
      'Roadside assistance included',
    ],
    rewardsDiscountEligible: true,
  },
];

export interface DriverInsuranceSubscription {
  id: string;
  driverId: string;
  planCode: string;
  status: 'active' | 'cancelled';
  weeklyPremium: number;
  currencyCode: string;
  startedAt: string;
  cancelledAt: string | null;
}

export async function getActiveInsuranceSubscription(
  driverId: string,
): Promise<DriverInsuranceSubscription | null> {
  const supabase = await createClient();
  const { data } = await (supabase.from('driver_insurance_subscriptions') as any)
    .select('*')
    .eq('driver_id', driverId)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return null;
  return rowToSubscription(data);
}

export async function subscribeToInsurancePlan(
  driverId: string,
  planCode: string,
  weeklyEarningsEstimate: number,
  currencyCode: string,
): Promise<{ success: boolean; subscription?: DriverInsuranceSubscription; error?: string }> {
  const plan = INSURANCE_PLANS.find((p) => p.code === planCode);
  if (!plan) return { success: false, error: 'Unknown insurance plan' };
  if (plan.weeklyPremiumRate === 0) {
    return { success: false, error: 'RideShield Basic is already included — nothing to subscribe to' };
  }

  const supabase = await createClient();

  // One active add-on at a time: cancel any existing one first.
  await (supabase.from('driver_insurance_subscriptions') as any)
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('driver_id', driverId)
    .eq('status', 'active');

  const weeklyPremium = Math.round(Math.max(0, weeklyEarningsEstimate) * plan.weeklyPremiumRate * 100) / 100;

  const { data, error } = await (supabase.from('driver_insurance_subscriptions') as any)
    .insert({
      driver_id: driverId,
      plan_code: planCode,
      status: 'active',
      weekly_premium: weeklyPremium,
      currency: currencyCode,
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: 'Failed to subscribe' };
  return { success: true, subscription: rowToSubscription(data) };
}

export async function cancelInsuranceSubscription(driverId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase.from('driver_insurance_subscriptions') as any)
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('driver_id', driverId)
    .eq('status', 'active');
  return !error;
}

function rowToSubscription(row: Record<string, unknown>): DriverInsuranceSubscription {
  return {
    id: row.id as string,
    driverId: row.driver_id as string,
    planCode: row.plan_code as string,
    status: row.status as 'active' | 'cancelled',
    weeklyPremium: Number(row.weekly_premium ?? 0),
    currencyCode: (row.currency as string) ?? 'USD',
    startedAt: row.started_at as string,
    cancelledAt: (row.cancelled_at as string) ?? null,
  };
}
