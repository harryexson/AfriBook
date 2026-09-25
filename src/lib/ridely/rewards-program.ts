// ─── Driver Rewards Program ───────────────────────────────────
// "AfriBook Road Rewards" — a tier ladder driven by the same metrics
// Uber/Lyft-style platforms use (acceptance rate, cancellation rate,
// on-time pickup rate, rating) but with materially better payouts:
// a lower AfriBook take-rate at every tier, not just the top one.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

export type RewardTierId = 'blue' | 'silver' | 'gold' | 'platinum';

export interface DriverMetrics {
  tripsLast30Days: number;
  acceptanceRate: number; // 0-100
  cancellationRate: number; // 0-100 (lower is better)
  onTimePickupRate: number; // 0-100
  averageRating: number; // 0-5
}

export interface RewardTier {
  id: RewardTierId;
  name: string;
  /** Minimum trips in the trailing 30 days to qualify. */
  minTrips: number;
  minAcceptanceRate: number;
  maxCancellationRate: number;
  minOnTimePickupRate: number;
  minRating: number;
  /** AfriBook's own margin at this tier — see PLATFORM_FEE_BREAKDOWN
   *  in earnings-report.ts for how the base platform fee splits. Higher
   *  tiers get a larger rebate of AfriBook's own margin, paid back as
   *  a per-trip bonus. */
  platformMarginRebate: number;
  perks: string[];
}

export const REWARD_TIERS: RewardTier[] = [
  {
    id: 'blue',
    name: 'Blue',
    minTrips: 0,
    minAcceptanceRate: 0,
    maxCancellationRate: 100,
    minOnTimePickupRate: 0,
    minRating: 0,
    platformMarginRebate: 0,
    perks: [
      '24/7 in-app support',
      'Free basic RideShield accident coverage while on a trip',
      'Weekly payouts',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    minTrips: 30,
    minAcceptanceRate: 70,
    maxCancellationRate: 8,
    minOnTimePickupRate: 80,
    minRating: 4.5,
    platformMarginRebate: 0.15,
    perks: [
      'Everything in Blue',
      '15% rebate of AfriBook’s own margin, credited weekly',
      'Instant payouts with no fee, twice a week',
      'Priority phone support',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    minTrips: 80,
    minAcceptanceRate: 80,
    maxCancellationRate: 5,
    minOnTimePickupRate: 88,
    minRating: 4.7,
    platformMarginRebate: 0.3,
    perks: [
      'Everything in Silver',
      '30% rebate of AfriBook’s own margin, credited weekly',
      'Unlimited fee-free instant payouts',
      '10% discount on RideShield Plus insurance add-on',
      'Fuel & data partner discounts',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minTrips: 150,
    minAcceptanceRate: 88,
    maxCancellationRate: 3,
    minOnTimePickupRate: 93,
    minRating: 4.85,
    platformMarginRebate: 0.5,
    perks: [
      'Everything in Gold',
      '50% rebate of AfriBook’s own margin — AfriBook’s effective take-rate on your\n        trips drops below 10%',
      '25% discount on RideShield Plus insurance add-on',
      'Dedicated account manager',
      'Airport & event priority dispatch zones',
      'Annual vehicle maintenance voucher',
    ],
  },
];

/** Pure — given a driver's metrics, returns the highest tier they qualify
 *  for (falls back to the entry tier). Every threshold must be met. */
export function computeRewardTier(metrics: DriverMetrics): RewardTier {
  let best = REWARD_TIERS[0];
  for (const tier of REWARD_TIERS) {
    const qualifies =
      metrics.tripsLast30Days >= tier.minTrips &&
      metrics.acceptanceRate >= tier.minAcceptanceRate &&
      metrics.cancellationRate <= tier.maxCancellationRate &&
      metrics.onTimePickupRate >= tier.minOnTimePickupRate &&
      metrics.averageRating >= tier.minRating;
    if (qualifies) best = tier;
  }
  return best;
}

/** Returns the next tier above the driver's current one, or null at the top. */
export function nextRewardTier(currentTierId: RewardTierId): RewardTier | null {
  const idx = REWARD_TIERS.findIndex((t) => t.id === currentTierId);
  return idx >= 0 && idx < REWARD_TIERS.length - 1 ? REWARD_TIERS[idx + 1] : null;
}

export interface DriverRewardsProfile {
  metrics: DriverMetrics;
  tier: RewardTier;
  next: RewardTier | null;
  /** How close the driver is (0-1 per requirement) to unlocking `next`. */
  progressToNext: Record<string, number> | null;
}

/**
 * Aggregates real driver activity from the last 30 days into the metrics
 * the rewards ladder scores. Cancellation rate and on-time pickup rate
 * are computed directly here (get_driver_stats_batch only covers
 * acceptance rate, hours and trip count).
 */
export async function getDriverRewardsProfile(driverId: string): Promise<DriverRewardsProfile> {
  const supabase = await createClient();

  const [{ data: statsBatch }, { data: rides }, { data: driverRow }] = await Promise.all([
    (supabase.rpc as any)('get_driver_stats_batch', { p_driver_ids: [driverId] }),
    (supabase.from('ridely_rides') as any)
      .select('status, cancelled_by, accepted_at, arrived_at')
      .eq('driver_id', driverId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    (supabase.from('drivers') as any).select('rating').eq('id', driverId).maybeSingle(),
  ]);

  const stats = (statsBatch as any[] | null)?.[0] ?? { p_acceptance_rate: 100, p_total_rides: 0 };
  const rows: any[] = rides ?? [];

  const assigned = rows.filter((r) => r.status !== 'requesting' && r.status !== 'searching');
  const driverCancelled = rows.filter((r) => r.status === 'cancelled' && r.cancelled_by === 'driver');
  const cancellationRate = assigned.length > 0
    ? Math.round((driverCancelled.length / assigned.length) * 100)
    : 0;

  const withArrival = rows.filter((r) => r.accepted_at && r.arrived_at);
  const onTime = withArrival.filter((r) => {
    const minutes = (new Date(r.arrived_at).getTime() - new Date(r.accepted_at).getTime()) / 60_000;
    return minutes <= 10; // arriving within 10 minutes of accepting counts as on-time
  });
  const onTimePickupRate = withArrival.length > 0
    ? Math.round((onTime.length / withArrival.length) * 100)
    : 100;

  const metrics: DriverMetrics = {
    tripsLast30Days: Number(stats.p_total_rides ?? 0),
    acceptanceRate: Number(stats.p_acceptance_rate ?? 100),
    cancellationRate,
    onTimePickupRate,
    averageRating: Number(driverRow?.rating ?? 5),
  };

  const tier = computeRewardTier(metrics);
  const next = nextRewardTier(tier.id);

  const progressToNext = next
    ? {
        trips: ratio(metrics.tripsLast30Days, next.minTrips),
        acceptanceRate: ratio(metrics.acceptanceRate, next.minAcceptanceRate),
        onTimePickupRate: ratio(metrics.onTimePickupRate, next.minOnTimePickupRate),
        rating: ratio(metrics.averageRating, next.minRating),
      }
    : null;

  return { metrics, tier, next, progressToNext };
}

function ratio(current: number, target: number): number {
  if (target <= 0) return 1;
  return Math.max(0, Math.min(1, current / target));
}
