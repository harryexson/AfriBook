// ─── Geospatial Search Service ────────────────────────────────
// PostGIS-powered geospatial queries for driver location search,
// distance calculations, and GPS tracking.
//
// NOTE: Two coordinate types are used throughout Ridely:
//   - GeoLocation { lat, lng }   – ride/delivery request locations
//   - GeoPoint { latitude, longitude } – driver GPS, surge zones, route steps
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type { GeoPoint } from '@/types';
import type { DriverCandidate, GeoLocation } from '@/types/ridely';

// ─── Constants ────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// ─── Find Nearby Drivers ──────────────────────────────────────
// Uses PostGIS ST_DWithin for efficient radius search on the
// driver_locations table which should have a geography column.

export async function findNearbyDrivers(
  location: GeoLocation,
  radiusKm: number,
  vehicleType?: string,
): Promise<DriverCandidate[]> {
  const supabase = await createClient();

  // Query driver_locations and drivers separately to avoid join resolution issues
  const { data: locationRows, error: locError } = await supabase
    .from('driver_locations')
    .select('driver_id, location, heading, speed, accuracy, timestamp')
    .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString());

  if (locError) {
    console.error('[geospatial] findNearbyDrivers query error:', locError);
    return [];
  }

  if (!locationRows?.length) return [];

  // Get unique driver IDs
  const driverIds = [...new Set(locationRows.map((r) => r.driver_id))];

  // Fetch available drivers
  const { data: driverRows } = await supabase
    .from('drivers')
    .select('*')
    .in('id', driverIds)
    .eq('status', 'available');

  if (!driverRows?.length) return [];

  const driverMap = new Map(driverRows.map((d) => [d.id, d]));

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

    const driverStats = await getDriverStats(row.driver_id);

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
      acceptanceRate: driverStats.acceptanceRate,
      hoursThisWeek: driverStats.hoursThisWeek,
      status: 'available' as const,
      lastLocationUpdate: row.timestamp,
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
// Upserts a driver's GPS position. Called by the driver app
// on location change (every few seconds while online).

export async function updateDriverLocation(
  driverId: string,
  location: GeoLocation,
  heading: number,
  speed: number,
): Promise<boolean> {
  const supabase = await createClient();

  const geoPoint: GeoPoint = {
    latitude: location.lat,
    longitude: location.lng,
  };

  const { error } = await supabase.from('driver_locations').upsert(
    {
      driver_id: driverId,
      location: geoPoint,
      heading,
      speed,
      timestamp: new Date().toISOString(),
    } as any,
    { onConflict: 'driver_id' },
  );

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

// ─── Private Helpers ──────────────────────────────────────────

interface DriverStats {
  acceptanceRate: number;
  hoursThisWeek: number;
}

async function getDriverStats(driverId: string): Promise<DriverStats> {
  const supabase = await createClient();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rides } = await supabase
    .from('ride_requests')
    .select('status, driver_id')
    .eq('driver_id', driverId)
    .gte('created_at', weekAgo);

  const { data: onlineHours } = await supabase
    .from('driver_online_sessions')
    .select('started_at, ended_at')
    .eq('driver_id', driverId)
    .gte('started_at', weekAgo);

  let acceptanceRate = 100;
  let hoursThisWeek = 0;

  if (rides && rides.length > 0) {
    const totalOffers = rides.length;
    const accepted = rides.filter(
      (r) => r.status !== 'searching' && r.status !== 'requesting',
    ).length;
    acceptanceRate = Math.round((accepted / totalOffers) * 100);
  }

  if (onlineHours && onlineHours.length > 0) {
    hoursThisWeek = onlineHours.reduce((total, session) => {
      const start = new Date(session.started_at as string).getTime();
      const end = session.ended_at
        ? new Date(session.ended_at as string).getTime()
        : Date.now();
      return total + (end - start) / (1000 * 60 * 60);
    }, 0);
  }

  return { acceptanceRate, hoursThisWeek: Math.round(hoursThisWeek * 10) / 10 };
}
