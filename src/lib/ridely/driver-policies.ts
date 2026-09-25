// ─── Driver Operational Policies ──────────────────────────────
// Pure, currency-safe calculators for the two money-moving rules
// drivers are promised in the Driver Agreement:
//
//  1. Wait-time pay: the first 5 minutes waiting at pickup are free
//     to the rider; every minute after that is paid to the driver
//     at the same per-minute rate they earn while driving, so it's
//     always denominated correctly regardless of currency.
//
//  2. Rider cancellation fee: free to cancel before a driver has
//     been driving toward pickup for 5 minutes. Once a driver has
//     committed 5+ minutes to the pickup, or has already arrived,
//     the rider is charged a fee (a percentage of the fare, so it
//     scales correctly across currencies) that goes to the driver.
//
// Both are pure functions — no I/O — so they're trivial to unit test
// and safe to call from either the TS API routes or the SQL layer's
// callers.
// ──────────────────────────────────────────────────────────────

import type { RideType } from '@/types/ridely';
import { RIDE_TYPE_CONFIG } from '@/types/ridely';

// ─── Wait-Time Pay ────────────────────────────────────────────

export const WAIT_TIME_FREE_MINUTES = 5;
/** Cap billable wait time so a stranded driver isn't left uncompensated,
 *  but a rider also isn't billed for an unbounded wait — beyond this the
 *  driver should cancel and collect the cancellation fee instead. */
export const WAIT_TIME_MAX_BILLABLE_MINUTES = 15;

export interface WaitTimePayResult {
  waitMinutes: number;
  freeMinutes: number;
  billableMinutes: number;
  perMinuteRate: number;
  pay: number;
}

/**
 * @param rideType Vehicle class, used to look up the driver's own
 *   per-minute rate so wait pay matches what they'd earn driving.
 * @param arrivedAt ISO timestamp of when the driver marked "arrived".
 * @param pickupAt ISO timestamp of when the rider actually got in
 *   (defaults to now — used for a live estimate before pickup happens).
 */
export function calculateWaitTimePay(
  rideType: RideType,
  arrivedAt: string | null | undefined,
  pickupAt: string | Date = new Date(),
): WaitTimePayResult {
  const perMinuteRate = RIDE_TYPE_CONFIG[rideType]?.perMinRate ?? RIDE_TYPE_CONFIG.economy.perMinRate;

  if (!arrivedAt) {
    return { waitMinutes: 0, freeMinutes: 0, billableMinutes: 0, perMinuteRate, pay: 0 };
  }

  const arrivedMs = new Date(arrivedAt).getTime();
  const untilMs = new Date(pickupAt).getTime();
  const waitMinutes = Math.max(0, (untilMs - arrivedMs) / 60_000);

  const billableMinutes = Math.min(
    Math.max(0, waitMinutes - WAIT_TIME_FREE_MINUTES),
    WAIT_TIME_MAX_BILLABLE_MINUTES,
  );

  return {
    waitMinutes: round2(waitMinutes),
    freeMinutes: WAIT_TIME_FREE_MINUTES,
    billableMinutes: round2(billableMinutes),
    perMinuteRate,
    pay: round2(billableMinutes * perMinuteRate),
  };
}

// ─── Rider Cancellation Fee ───────────────────────────────────

/** Grace period, in minutes of driving toward pickup, before a
 *  cancelling rider owes the driver anything. */
export const CANCELLATION_GRACE_MINUTES = 5;

/** Percentage of the estimated fare charged when the rider cancels
 *  after the driver has been driving 5+ minutes but hasn't arrived. */
export const CANCELLATION_FEE_RATE_EN_ROUTE = 0.25;
/** Percentage charged when the rider cancels after the driver has
 *  already arrived at pickup (the driver completed the whole drive). */
export const CANCELLATION_FEE_RATE_ARRIVED = 0.5;
/** A cancellation fee never exceeds the fare itself. */
const CANCELLATION_FEE_MAX_RATE = 1.0;

export interface RiderCancellationInput {
  /** Whether a driver had been assigned at the moment of cancellation. */
  hasDriver: boolean;
  /** Current lifecycle status at the moment of cancellation. */
  status: 'requesting' | 'searching' | 'matched' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | string;
  /** ISO timestamp the driver accepted / started heading to pickup. */
  acceptedAt?: string | null;
  /** ISO timestamp the driver marked "arrived" at pickup, if applicable. */
  arrivedAt?: string | null;
  /** Estimated fare for the trip (fee is a percentage of this). */
  estimatedFare: number;
  /** Evaluation time; defaults to now. */
  now?: string | Date;
}

export interface RiderCancellationResult {
  fee: number;
  reason: 'no_driver' | 'grace_period' | 'driver_en_route' | 'driver_arrived';
  minutesSinceAccepted: number;
}

export function calculateRiderCancellationFee(
  input: RiderCancellationInput,
): RiderCancellationResult {
  if (!input.hasDriver || !input.acceptedAt) {
    return { fee: 0, reason: 'no_driver', minutesSinceAccepted: 0 };
  }

  const now = new Date(input.now ?? new Date()).getTime();
  const acceptedMs = new Date(input.acceptedAt).getTime();
  const minutesSinceAccepted = round2(Math.max(0, (now - acceptedMs) / 60_000));

  if (input.arrivedAt) {
    return {
      fee: round2(input.estimatedFare * CANCELLATION_FEE_RATE_ARRIVED * feeCapMultiplier()),
      reason: 'driver_arrived',
      minutesSinceAccepted,
    };
  }

  if (minutesSinceAccepted < CANCELLATION_GRACE_MINUTES) {
    return { fee: 0, reason: 'grace_period', minutesSinceAccepted };
  }

  return {
    fee: round2(input.estimatedFare * CANCELLATION_FEE_RATE_EN_ROUTE * feeCapMultiplier()),
    reason: 'driver_en_route',
    minutesSinceAccepted,
  };
}

function feeCapMultiplier(): number {
  return Math.min(1, CANCELLATION_FEE_MAX_RATE);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
