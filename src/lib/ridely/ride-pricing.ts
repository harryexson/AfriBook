// ─── Ride Pricing (pure) ──────────────────────────────────────
// Dependency-free, per-country ride fare tables and estimators.
// Shared by the API routes (server) and the booking page (client).
// Surge is applied separately by `surge-pricing.ts` (DB-backed).
// ──────────────────────────────────────────────────────────────

import type { RideType } from '@/types/ridely';
import { RIDE_TYPE_CONFIG } from '@/types/ridely';
import { COUNTRIES } from '@/lib/localization/countries';

export interface CountryRidePricing {
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  platformFeePercent: number;
}

/** Base fare table, keyed by ISO country code. Values are in local currency. */
export const COUNTRY_PRICING: Record<string, CountryRidePricing> = {
  NG: { baseFare: 500, perKm: 150, perMinute: 25, minimumFare: 800, platformFeePercent: 0.2 },
  KE: { baseFare: 100, perKm: 50, perMinute: 8, minimumFare: 200, platformFeePercent: 0.2 },
  ZA: { baseFare: 15, perKm: 8, perMinute: 1.5, minimumFare: 30, platformFeePercent: 0.2 },
  US: { baseFare: 2.5, perKm: 1.2, perMinute: 0.25, minimumFare: 5, platformFeePercent: 0.25 },
  GB: { baseFare: 2, perKm: 1, perMinute: 0.2, minimumFare: 4, platformFeePercent: 0.25 },
  IN: { baseFare: 50, perKm: 12, perMinute: 2, minimumFare: 100, platformFeePercent: 0.2 },
  GH: { baseFare: 5, perKm: 3, perMinute: 0.5, minimumFare: 10, platformFeePercent: 0.2 },
  TZ: { baseFare: 2000, perKm: 800, perMinute: 150, minimumFare: 4000, platformFeePercent: 0.2 },
  UG: { baseFare: 2000, perKm: 1000, perMinute: 200, minimumFare: 5000, platformFeePercent: 0.2 },
  MW: { baseFare: 1000, perKm: 500, perMinute: 100, minimumFare: 2000, platformFeePercent: 0.2 },
  EG: { baseFare: 10, perKm: 5, perMinute: 1, minimumFare: 20, platformFeePercent: 0.2 },
  AE: { baseFare: 10, perKm: 2, perMinute: 0.5, minimumFare: 15, platformFeePercent: 0.2 },
  CA: { baseFare: 3, perKm: 1.5, perMinute: 0.3, minimumFare: 6, platformFeePercent: 0.25 },
  FR: { baseFare: 2.5, perKm: 1.2, perMinute: 0.25, minimumFare: 5, platformFeePercent: 0.25 },
  DE: { baseFare: 3, perKm: 1.5, perMinute: 0.3, minimumFare: 6, platformFeePercent: 0.25 },
};

export const DEFAULT_PRICING: CountryRidePricing = {
  baseFare: 5,
  perKm: 2,
  perMinute: 0.5,
  minimumFare: 10,
  platformFeePercent: 0.2,
};

/** Get the fare table for a country code, falling back to a neutral default. */
export function getRidePricingForCountry(countryCode: string): CountryRidePricing {
  return COUNTRY_PRICING[(countryCode || '').toUpperCase()] ?? DEFAULT_PRICING;
}

/**
 * Relative price multiplier of a ride type vs economy. Derived from the
 * NGN-denominated `RIDE_TYPE_CONFIG` so the proportions stay consistent
 * across every market without baking currency values into the multiplier.
 */
export function getRideTypeMultiplier(rideType: RideType): number {
  const config = RIDE_TYPE_CONFIG[rideType] ?? RIDE_TYPE_CONFIG.economy;
  const base = RIDE_TYPE_CONFIG.economy.baseFare;
  return base > 0 ? config.baseFare / base : 1;
}

export interface RideFareEstimate {
  baseFare: number;
  perKmRate: number;
  perMinRate: number;
  minimumFare: number;
  surgeMultiplier: number;
  estimatedFare: number;
  currencyCode: string;
}

/**
 * Estimate a fare for the given ride type, distance (km) and duration (min)
 * in the country's local currency.
 */
export function estimateRideFare(
  rideType: RideType,
  distanceKm: number,
  durationMin: number,
  countryCode: string,
  surgeMultiplier: number = 1,
): RideFareEstimate {
  const pricing = getRidePricingForCountry(countryCode);
  const multiplier = getRideTypeMultiplier(rideType);

  const baseFare = pricing.baseFare * multiplier;
  const perKmRate = pricing.perKm * multiplier;
  const perMinRate = pricing.perMinute * multiplier;
  const minimumFare = pricing.minimumFare * multiplier;

  const raw = baseFare + distanceKm * perKmRate + durationMin * perMinRate;
  const estimatedFare = Math.max(minimumFare, Math.round(raw * Math.max(surgeMultiplier, 1)));

  return {
    baseFare,
    perKmRate,
    perMinRate,
    minimumFare,
    surgeMultiplier: Math.max(surgeMultiplier, 1),
    estimatedFare,
    currencyCode: COUNTRIES[countryCode]?.currency?.code ?? 'USD',
  };
}
