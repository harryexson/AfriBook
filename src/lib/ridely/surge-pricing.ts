// ─── Surge Pricing Service ────────────────────────────────────
// Dynamic supply/demand pricing. Calculates surge multipliers
// based on ride request volume vs available driver count in an area.
//
// NOTE: SurgeZone.center is GeoPoint (latitude/longitude).
//       Ride pickup/destination are GeoLocation (lat/lng).
//       calculateDistance handles both via duck-typing.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type { GeoPoint } from '@/types';
import type {
  RideType,
  GeoLocation,
  SurgeZone,
  SurgeZoneInsert,
  SurgePricingInfo,
  PricingEstimate,
} from '@/types/ridely';
import { calculateDistance } from './geospatial';
import { COUNTRIES } from '@/lib/localization/countries';
import { getSurgeMultiplierForLocation } from './h3-grid';
import { COUNTRY_PRICING, DEFAULT_PRICING, getRideTypeMultiplier } from './ride-pricing';

// ─── Surge Thresholds ─────────────────────────────────────────

interface SurgeThreshold {
  minRatio: number;
  multiplier: number;
}

const SURGE_THRESHOLDS: SurgeThreshold[] = [
  { minRatio: 0, multiplier: 1.0 },
  { minRatio: 1.5, multiplier: 1.2 },
  { minRatio: 2.5, multiplier: 1.5 },
  { minRatio: 3.5, multiplier: 2.0 },
  { minRatio: 5.0, multiplier: 2.5 },
  { minRatio: 8.0, multiplier: 3.0 },
];

// ─── Country Pricing Configs ──────────────────────────────────
// Shared per-country fare tables live in `./ride-pricing` (pure module)
// so the booking page and API routes can use them without pulling in
// the Supabase server client.
export { COUNTRY_PRICING, DEFAULT_PRICING } from './ride-pricing';

// ─── Calculate Surge Multiplier ───────────────────────────────

export async function calculateSurgeMultiplier(
  location: GeoLocation,
  _rideType: RideType,
): Promise<SurgePricingInfo> {
  // Try H3-based surge first (uses PostGIS RPC)
  try {
    const h3Result = await getSurgeMultiplierForLocation(location);
    if (h3Result.h3Index) {
      const demand = await estimateSurgeDemand(location, 3);
      const supply = await estimateSurgeSupply(location, 3);

      return {
        active: h3Result.multiplier > 1.0,
        multiplier: h3Result.multiplier,
        reason: h3Result.multiplier > 1.0
          ? `High demand in your area (${demand} requests, ${supply} drivers)`
          : 'Normal pricing',
        demand,
        supply,
      };
    }
  } catch {
    // Fall back to legacy computation
  }

  // Legacy: estimate demand/supply via bounding box
  const demand = await estimateSurgeDemand(location, 3);
  const supply = await estimateSurgeSupply(location, 3);

  const ratio = supply > 0 ? demand / supply : demand > 0 ? 10 : 0;
  const multiplier = getMultiplierFromRatio(ratio);

  return {
    active: multiplier > 1.0,
    multiplier,
    reason: multiplier > 1.0
      ? `High demand in your area (${demand} requests, ${supply} drivers)`
      : 'Normal pricing',
    demand,
    supply,
  };
}

// ─── Get Active Surge Zones ───────────────────────────────────

export async function getSurgeZones(
  countryCode: string,
): Promise<SurgeZone[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('surge_zones')
    .select('*')
    .eq('active', true);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    countryCode: countryCode,
    name: row.name as string,
    center: row.center as GeoPoint,
    radiusKm: row.radius_km as number,
    multiplier: row.multiplier as number,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.created_at as string,
  }));
}

// ─── Estimate Surge Demand ────────────────────────────────────

export async function estimateSurgeDemand(
  location: GeoLocation,
  radiusKm: number,
): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('ride_requests')
    .select('pickup_location')
    .in('status', ['requesting', 'searching'])
    .gte('created_at', since);

  if (error || !data) return 0;

  return data.filter((row) => {
    const loc = row.pickup_location as unknown as GeoPoint;
    if (!loc) return false;
    const geoLoc: GeoLocation = { lat: loc.latitude, lng: loc.longitude };
    const dist = calculateDistance(location, geoLoc);
    return dist <= radiusKm;
  }).length;
}

// ─── Estimate Surge Supply ────────────────────────────────────

export async function estimateSurgeSupply(
  location: GeoLocation,
  radiusKm: number,
): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('driver_locations')
    .select('location')
    .gte('timestamp', since);

  if (error || !data) return 0;

  return data.filter((row) => {
    const loc = row.location as GeoPoint;
    if (!loc) return false;
    const geoLoc: GeoLocation = { lat: loc.latitude, lng: loc.longitude };
    const dist = calculateDistance(location, geoLoc);
    return dist <= radiusKm;
  }).length;
}

// ─── Create / Update Surge Zone ───────────────────────────────

export async function createSurgeZone(
  params: SurgeZoneInsert,
): Promise<SurgeZone | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('surge_zones')
    .select('id')
    .eq('name', params.name)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('surge_zones')
      .update({
        center: params.center,
        radius_km: params.radiusKm,
        multiplier: params.multiplier,
        active: params.active,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !data) return null;
    return rowToSurgeZone(data, params.countryCode);
  }

  const { data, error } = await supabase
    .from('surge_zones')
    .insert({
      country_code: params.countryCode,
      name: params.name,
      center: params.center,
      radius_km: params.radiusKm,
      multiplier: params.multiplier,
      demand: 0,
      supply: 0,
      ratio: 0,
      active: params.active,
    } satisfies Omit<import('@/types').SurgeZoneRow, 'id' | 'created_at' | 'updated_at'>)
    .select()
    .single();

  if (error || !data) return null;
  return rowToSurgeZone(data, params.countryCode);
}

// ─── Full Pricing Estimate ────────────────────────────────────

export async function getPricingEstimate(
  pickup: GeoLocation,
  destination: GeoLocation,
  rideType: RideType,
  countryCode: string,
): Promise<PricingEstimate> {
  const pricing = COUNTRY_PRICING[countryCode] ?? DEFAULT_PRICING;
  const country = COUNTRIES[countryCode];
  const currencyCode = country?.currency.code ?? 'USD';

  const distanceKm = calculateDistance(pickup, destination);
  const durationMin = Math.round((distanceKm / 30) * 60);

  const surgeInfo = await calculateSurgeMultiplier(pickup, rideType);

  const typeMultiplier = getRideTypeMultiplier(rideType);

  const baseFare = pricing.baseFare * typeMultiplier;
  const distanceFare = distanceKm * pricing.perKm * typeMultiplier;
  const timeFare = durationMin * pricing.perMinute * typeMultiplier;

  const subtotalBeforeSurge = baseFare + distanceFare + timeFare;
  const surgeAmount =
    surgeInfo.multiplier > 1
      ? subtotalBeforeSurge * (surgeInfo.multiplier - 1)
      : 0;

  const estimatedTotal = Math.max(subtotalBeforeSurge + surgeAmount, pricing.minimumFare);

  return {
    rideType,
    baseFare: round2(baseFare),
    distanceFare: round2(distanceFare),
    timeFare: round2(timeFare),
    surgeMultiplier: surgeInfo.multiplier,
    surgeAmount: round2(surgeAmount),
    estimatedTotal: round2(estimatedTotal),
    currencyCode,
    estimatedDurationMin: durationMin,
    estimatedDistanceKm: round2(distanceKm),
  };
}

// ─── Private Helpers ──────────────────────────────────────────

function getMultiplierFromRatio(ratio: number): number {
  let multiplier = 1.0;
  for (const threshold of SURGE_THRESHOLDS) {
    if (ratio >= threshold.minRatio) {
      multiplier = threshold.multiplier;
    }
  }
  return multiplier;
}

function rowToSurgeZone(row: Record<string, unknown>, countryCode: string): SurgeZone {
  return {
    id: row.id as string,
    countryCode,
    name: row.name as string,
    center: row.center as GeoPoint,
    radiusKm: row.radius_km as number,
    multiplier: row.multiplier as number,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.created_at as string,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
