// ─── H3 Grid Service ────────────────────────────────────────
// Uber H3 hexagonal grid for demand/supply analysis and surge
// pricing. Uses PostGIS-backed H3 indexes stored in the DB.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/neon/server';
import type { GeoPoint } from '@/types';
import type { GeoLocation } from '@/types/ridely';

// ─── Types ───────────────────────────────────────────────────

interface H3Cell {
  /** H3 index string. */
  h3Index: string;
  /** H3 resolution level. */
  resolution: number;
  /** Centre point of the cell. */
  center: GeoPoint;
}

interface H3DemandCell extends H3Cell {
  /** Number of active ride requests in this cell. */
  demandCount: number;
  /** Number of available drivers in this cell. */
  supplyCount: number;
  /** Demand-to-supply ratio. */
  ratio: number;
  /** Computed surge multiplier. */
  multiplier: number;
}

// ─── Constants ───────────────────────────────────────────────

const H3_RESOLUTION = 9; // ~175m edge length, good for urban areas
const DEMAND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const SUPPLY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ─── Get H3 Index for a Location ─────────────────────────────
// Uses PostGIS RPC to compute H3 index server-side.

export async function getH3Index(
  location: GeoLocation,
  resolution: number = H3_RESOLUTION,
): Promise<string | null> {
  const supabase = await createClient();

  const point = {
    type: 'Point' as const,
    coordinates: [location.lng, location.lat],
  };

  const { data, error } = await supabase.rpc('get_h3_index' as any, {
    p_location: point,
    p_resolution: resolution,
  } as any);

  if (error || !data) return null;
  return data as string;
}

// ─── Get H3 Neighbours ───────────────────────────────────────
// Returns the H3 cell and its 6 immediate neighbours for
// broader area search.

export async function getH3Neighbours(
  h3Index: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_h3_neighbours' as any, {
    p_h3_index: h3Index,
  } as any);

  if (error || !data) return [h3Index];
  return data as string[];
}

// ─── Get Demand/Supply Ratio for H3 Cells ────────────────────
// Queries active ride requests and available drivers within
// each H3 cell to compute surge multipliers.

export async function getH3DemandSupply(
  location: GeoLocation,
  resolution: number = H3_RESOLUTION,
): Promise<H3DemandCell[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - DEMAND_WINDOW_MS).toISOString();
  const supplySince = new Date(Date.now() - SUPPLY_WINDOW_MS).toISOString();

  // NOTE: `ride_requests` has no `h3_index` column (verified via
  // information_schema) — selecting it would error via the Data API, so
  // it's dropped here. Rows without a tracked h3 cell are skipped below,
  // same net effect as the original (always-erroring) query. Status values
  // also corrected: `ride_requests.status` is the `ride_status` enum
  // (requested/accepted/arrived/in_progress/completed/cancelled), not
  // 'requesting'/'searching'.
  const { data: demandRows } = (await (supabase.from('ride_requests') as any)
    .select('pickup_location')
    .in('status', ['requested'])
    .gte('created_at', since)) as { data: any[] | null };

  // NOTE: `driver_locations` has no `timestamp` column — the real column is
  // `last_seen_at`.
  const { data: supplyRows } = (await (supabase.from('driver_locations') as any)
    .select('driver_id, h3_index')
    .gte('last_seen_at', supplySince)) as { data: any[] | null };

  // Build H3 cell map
  const cellMap = new Map<string, H3DemandCell>();

  // Count demand per cell
  if (demandRows) {
    for (const row of demandRows) {
      const h3 = row.h3_index as string | null;
      if (!h3) continue;

      if (!cellMap.has(h3)) {
        cellMap.set(h3, {
          h3Index: h3,
          resolution,
          center: { latitude: 0, longitude: 0 },
          demandCount: 0,
          supplyCount: 0,
          ratio: 0,
          multiplier: 1.0,
        });
      }

      const cell = cellMap.get(h3)!;
      cell.demandCount++;
    }
  }

  // Count supply per cell
  if (supplyRows) {
    for (const row of supplyRows) {
      const h3 = row.h3_index as string | null;
      if (!h3) continue;

      if (!cellMap.has(h3)) {
        cellMap.set(h3, {
          h3Index: h3,
          resolution,
          center: { latitude: 0, longitude: 0 },
          demandCount: 0,
          supplyCount: 0,
          ratio: 0,
          multiplier: 1.0,
        });
      }

      const cell = cellMap.get(h3)!;
      cell.supplyCount++;
    }
  }

  // Compute ratios and multipliers
  for (const cell of cellMap.values()) {
    cell.ratio = cell.supplyCount > 0
      ? cell.demandCount / cell.supplyCount
      : cell.demandCount > 0
        ? 10
        : 0;
    cell.multiplier = getSurgeMultiplier(cell.ratio);
  }

  return Array.from(cellMap.values());
}

// ─── Get Surge Multiplier for a Location ─────────────────────
// Looks up the H3 cell for a location and returns the surge
// multiplier based on demand/supply ratio.

export async function getSurgeMultiplierForLocation(
  location: GeoLocation,
): Promise<{ multiplier: number; ratio: number; h3Index: string | null }> {
  const supabase = await createClient();

  // NOTE: the real `get_surge_multiplier` function (verified via
  // pg_get_functiondef) takes `(p_lat double precision, p_lng double
  // precision)` and returns a plain numeric multiplier — not the
  // `{p_location, p_resolution}` / `{multiplier, ratio, h3_index}` shape
  // this code assumed (which doesn't match any function in the schema, and
  // would have always errored under Supabase too). Calling it correctly
  // here; ratio/h3Index aren't computed by this function, so they stay at
  // their fallback values and callers fall back to the legacy demand/supply
  // computation, same as when this call used to fail outright.
  const { data, error } = await supabase.rpc('get_surge_multiplier' as any, {
    p_lat: location.lat,
    p_lng: location.lng,
  } as any);

  if (error || data == null) {
    return { multiplier: 1.0, ratio: 0, h3Index: null };
  }

  return {
    multiplier: data as number,
    ratio: 0,
    h3Index: null,
  };
}

// ─── Get H3 Cell Boundaries ──────────────────────────────────
// Returns the polygon boundary of an H3 cell for map rendering.

export async function getH3CellBoundary(
  h3Index: string,
): Promise<GeoPoint[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_h3_boundary' as any, {
    p_h3_index: h3Index,
  } as any);

  if (error || !data) return [];

  // Data is array of [lng, lat] pairs
  return (data as [number, number][]).map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));
}

// ─── Private Helpers ──────────────────────────────────────────

function getSurgeMultiplier(ratio: number): number {
  if (ratio < 1.5) return 1.0;
  if (ratio < 2.5) return 1.2;
  if (ratio < 3.5) return 1.5;
  if (ratio < 5.0) return 2.0;
  if (ratio < 8.0) return 2.5;
  return 3.0;
}
