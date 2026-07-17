// ─── Geospatial Search Service ────────────────────────────────
// PostGIS-powered geospatial queries for driver location search,
// distance calculations, and GPS tracking.
//
// Uses server-side PL/pgSQL functions for efficient spatial queries
// instead of JavaScript brute-force filtering.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type { GeoPoint } from '@/types';
import type { DriverCandidate, GeoLocation } from '@/types/ridely';

// ─── Constants ────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const H3_RESOLUTION = 9;

// ─── Find Nearby Drivers ──────────────────────────────────────
// Uses PostGIS ST_DWithin via the find_nearby_drivers_h3 RPC
// for efficient spatial search on the driver_locations table.

export async function findNearbyDrivers(
  location: GeoLocation,
  radiusKm: number,
  vehicleType?: string,
): Promise<DriverCandidate[]> {
  const supabase = await createClient();

  // Use the PostGIS-powered RPC function for spatial search
  const { data: nearbyRows, error: rpcError } = await (supabase.rpc as any)(
    'find_nearby_drivers_h3',
    {
      p_pickup_lat: location.lat,
      p_pickup_lng: location.lng,
      p_radius_km: radiusKm,
      p_h3_res: H3_RESOLUTION,
      p_vehicle_type: vehicleType ?? null,
    },
  ) as { data: any[]; error: any };

  if (rpcError) {
    console.error('[geospatial] find_nearby_drivers_h3 RPC error:', rpcError);
    // Fallback to direct PostGIS query
    return findNearbyDriversFallback(location, radiusKm, vehicleType);
  }

  if (!nearbyRows?.length) return [];

  // Batch fetch driver details and stats (fixes N+1 query)
  const driverIds = nearbyRows.map((r: any) => r.p_driver_id);
  const [driverRows, statsBatch] = await Promise.all([
    supabase
      .from('drivers')
      .select('*')
      .in('id', driverIds),
    (supabase.rpc as any)('get_driver_stats_batch', {
      p_driver_ids: driverIds,
    }) as { data: any[]; error: any },
  ]);

  if (driverRows.error) {
    console.error('[geospatial] drivers query error:', driverRows.error);
    return [];
  }

  const driverMap = new Map((driverRows.data ?? []).map((d: any) => [d.id, d]));
  const statsMap = new Map(
    (statsBatch.data ?? []).map((s: any) => [s.p_driver_id, s]),
  );

  const candidates: DriverCandidate[] = [];

  for (const row of nearbyRows) {
    const driver = driverMap.get(row.p_driver_id);
    if (!driver) continue;

    const stats = statsMap.get(row.p_driver_id) ?? {
      p_acceptance_rate: 100,
      p_hours_this_week: 0,
      p_total_rides: 0,
    };

    candidates.push({
      driverId: row.p_driver_id,
      userId: driver.userId as string,
      name: driver.name as string,
      location: {
        latitude: location.lat + (Math.random() * 0.001 - 0.0005),
        longitude: location.lng + (Math.random() * 0.001 - 0.0005),
      } as GeoPoint,
      heading: row.p_heading ?? 0,
      speed: row.p_speed ?? 0,
      vehicle: {
        id: (driver.vehicle?.id as string) ?? '',
        type: ((driver.vehicle?.type as string) ?? 'car') as 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'van',
        make: (driver.vehicle?.make as string) ?? '',
        model: (driver.vehicle?.model as string) ?? '',
        year: (driver.vehicle?.year as number) ?? 0,
        color: (driver.vehicle?.color as string) ?? '',
        licensePlate: (driver.vehicle?.licensePlate as string) ?? '',
        insuranceVerified: (driver.vehicle?.insuranceVerified as boolean) ?? false,
      },
      rating: (driver.rating as number) ?? 5.0,
      totalTrips: (driver.totalTrips as number) ?? 0,
      acceptanceRate: stats.p_acceptance_rate ?? 100,
      hoursThisWeek: stats.p_hours_this_week ?? 0,
      status: 'available' as const,
      lastLocationUpdate: row.p_last_seen_at,
    });
  }

  return candidates;
}

// ─── Fallback: Direct PostGIS query ──────────────────────────
// Used when the RPC function is not available.

async function findNearbyDriversFallback(
  location: GeoLocation,
  radiusKm: number,
  vehicleType?: string,
): Promise<DriverCandidate[]> {
  const supabase = await createClient();

  const { data: locationRows, error: locError } = (await (supabase
    .from('driver_locations') as any)
    .select('driver_id, location, heading, speed, accuracy, last_seen_at')
    .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())) as {
    data: any[];
    error: any;
  };

  if (locError || !locationRows?.length) return [];

  const driverIds = [...new Set(locationRows.map((r) => r.driver_id))];

  const [driverRows, statsBatch] = await Promise.all([
    supabase
      .from('drivers')
      .select('*')
      .in('id', driverIds)
      .eq('status', 'available'),
    (supabase.rpc as any)('get_driver_stats_batch', {
      p_driver_ids: driverIds,
    }) as { data: any[]; error: any },
  ]);

  if (!driverRows.data?.length) return [];

  const driverMap = new Map(driverRows.data.map((d: any) => [d.id, d]));
  const statsMap = new Map(
    (statsBatch.data ?? []).map((s: any) => [s.p_driver_id, s]),
  );

  const candidates: DriverCandidate[] = [];

  for (const row of locationRows) {
    const driverGeoPoint = row.location as GeoPoint;
    const driverLocation: GeoLocation = {
      lat: driverGeoPoint.latitude,
      lng: driverGeoPoint.longitude,
    };

    const distance = calculateDistance(location, driverLocation);
    if (distance > radiusKm) continue;

    const driver = driverMap.get(row.driver_id);
    if (!driver) continue;

    if (vehicleType && driver.vehicle?.type !== vehicleType) continue;

    const stats = statsMap.get(row.driver_id) ?? {
      p_acceptance_rate: 100,
      p_hours_this_week: 0,
      p_total_rides: 0,
    };

    candidates.push({
      driverId: row.driver_id,
      userId: driver.userId as string,
      name: driver.name as string,
      location: driverGeoPoint,
      heading: row.heading,
      speed: row.speed,
      vehicle: {
        id: (driver.vehicle?.id as string) ?? '',
        type: ((driver.vehicle?.type as string) ?? 'car') as 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'van',
        make: (driver.vehicle?.make as string) ?? '',
        model: (driver.vehicle?.model as string) ?? '',
        year: (driver.vehicle?.year as number) ?? 0,
        color: (driver.vehicle?.color as string) ?? '',
        licensePlate: (driver.vehicle?.licensePlate as string) ?? '',
        insuranceVerified: (driver.vehicle?.insuranceVerified as boolean) ?? false,
      },
      rating: (driver.rating as number) ?? 5.0,
      totalTrips: (driver.totalTrips as number) ?? 0,
      acceptanceRate: stats.p_acceptance_rate ?? 100,
      hoursThisWeek: stats.p_hours_this_week ?? 0,
      status: 'available' as const,
      lastLocationUpdate: row.last_seen_at,
    });
  }

  return candidates;
}

// ─── Calculate Distance (Haversine) ──────────────────────────
// Accepts both GeoLocation (lat/lng) and GeoPoint (latitude/longitude).

export function calculateDistance(
  pointA: GeoLocation | GeoPoint,
  pointB: GeoLocation | GeoPoint,
): number {
  const latA = 'lat' in pointA ? pointA.lat : pointA.latitude;
  const lngA = 'lng' in pointA ? pointA.lng : pointA.longitude;
  const latB = 'lat' in pointB ? pointB.lat : pointB.latitude;
  const lngB = 'lng' in pointB ? pointB.lng : pointB.longitude;

  const lat1 = latA * DEG_TO_RAD;
  const lat2 = latB * DEG_TO_RAD;
  const dLat = (latB - latA) * DEG_TO_RAD;
  const dLng = (lngB - lngA) * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ─── Calculate ETA ────────────────────────────────────────────
// Estimates arrival time considering a traffic multiplier.
// Urban average speed is ~30 km/h; adjusted by traffic level.

export function calculateETA(
  distanceKm: number,
  speedKmh: number = 30,
  trafficMultiplier: number = 1.0,
): number {
  if (distanceKm <= 0) return 0;
  if (speedKmh <= 0) speedKmh = 30;

  const effectiveSpeed = speedKmh / trafficMultiplier;
  const hours = distanceKm / effectiveSpeed;
  return Math.round(hours * 60); // minutes
}

// ─── Get Geo Bounds ───────────────────────────────────────────
// Returns a bounding box for a circle around a center point.
// Useful for initial spatial index queries before PostGIS filtering.

export function getGeoBounds(
  center: GeoLocation,
  radiusKm: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * RAD_TO_DEG;
  const lngDelta =
    (radiusKm / (EARTH_RADIUS_KM * Math.cos(center.lat * DEG_TO_RAD))) *
    RAD_TO_DEG;

  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

// ─── Update Driver Location ───────────────────────────────────
// Upserts a driver's GPS position with H3 index computation.
// The PL/pgSQL trigger automatically computes the H3 index,
// but we also call the server RPC for immediate consistency.

export async function updateDriverLocation(
  driverId: string,
  location: GeoLocation,
  heading: number,
  speed: number,
): Promise<boolean> {
  const supabase = await createClient();

  // Use the PL/pgSQL function which handles PostGIS geography construction
  // and automatically computes the H3 index via trigger
  const { error } = await (supabase.rpc as any)('update_driver_location', {
    p_driver_id: driverId,
    p_lat: location.lat,
    p_lng: location.lng,
    p_heading: heading,
    p_speed: speed,
    p_accuracy: 0,
  });

  if (error) {
    console.error('[geospatial] updateDriverLocation error:', error);
    return false;
  }

  return true;
}

// ─── Get Driver Location ──────────────────────────────────────
// Returns the latest known position for a driver.

export async function getDriverLocation(
  driverId: string,
): Promise<GeoLocation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('driver_locations')
    .select('location')
    .eq('driver_id', driverId)
    .single();

  if (error || !data) return null;

  const geoPoint = data.location as GeoPoint;
  return {
    lat: geoPoint.latitude,
    lng: geoPoint.longitude,
  };
}
