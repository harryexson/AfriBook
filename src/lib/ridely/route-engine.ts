// ─── Route Engine ────────────────────────────────────────────
// Real routing engine integration. Uses OSRM (free, no API key)
// with fallback to Haversine when OSRM is unavailable.
// Supports Mapbox/Google as paid upgrade paths.
// ──────────────────────────────────────────────────────────────

import type { GeoPoint } from '@/types';
import type { GeoLocation, RouteResult, RouteStep, TrafficLevel } from '@/types/ridely';

// ─── Constants ───────────────────────────────────────────────

const OSRM_BASE_URL = process.env.OSRM_BASE_URL ?? 'http://router.project-osrm.org';
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN ?? '';
const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const URBAN_SPEED_KMH = 30;
const TRAFFIC_MULTIPLIER: Record<TrafficLevel, number> = {
  light: 1.0,
  moderate: 1.3,
  heavy: 1.8,
  unknown: 1.2,
};

// ─── Get Route ───────────────────────────────────────────────
// Primary route calculation. Tries OSRM first, falls back to
// Haversine estimation.

export async function getRoute(
  origin: GeoLocation,
  destination: GeoLocation,
): Promise<RouteResult> {
  try {
    return await getOSRMRoute(origin, destination);
  } catch {
    return getHaversineRoute(origin, destination);
  }
}

// ─── Get Route with Alternatives ─────────────────────────────
// Returns up to 3 route alternatives for rider choice.

export async function getRouteAlternatives(
  origin: GeoLocation,
  destination: GeoLocation,
): Promise<RouteResult[]> {
  const alternatives: RouteResult[] = [];

  try {
    const osrmRoutes = await getOSRMRouteAlternatives(origin, destination);
    alternatives.push(...osrmRoutes);
  } catch {
    // Fall back to single route
  }

  if (!alternatives.length) {
    alternatives.push(getHaversineRoute(origin, destination));
  }

  return alternatives;
}

// ─── Get Route with Waypoints ────────────────────────────────
// Multi-stop route for delivery with multiple pickups/dropoffs.

export async function getMultiStopRoute(
  origin: GeoLocation,
  waypoints: GeoLocation[],
  destination: GeoLocation,
): Promise<RouteResult> {
  const allPoints = [origin, ...waypoints, destination];

  let totalDistance = 0;
  let totalDuration = 0;
  const allSteps: RouteStep[] = [];

  for (let i = 0; i < allPoints.length - 1; i++) {
    const segment = await getRoute(allPoints[i], allPoints[i + 1]);
    totalDistance += segment.distanceKm;
    totalDuration += segment.durationMin;
    allSteps.push(...segment.steps);
  }

  const polyline = encodePolyline(allPoints.map(toGeoPoint));

  return {
    distanceKm: round2(totalDistance),
    durationMin: Math.round(totalDuration),
    polyline,
    steps: allSteps,
    trafficLevel: 'unknown',
  };
}

// ─── Get Driver ETA to Pickup ────────────────────────────────
// Quick ETA calculation for a driver to reach a pickup point.

export async function getDriverETA(
  driverLocation: GeoLocation,
  pickupLocation: GeoLocation,
): Promise<{ distanceKm: number; durationMin: number }> {
  try {
    const route = await getRoute(driverLocation, pickupLocation);
    return {
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
    };
  } catch {
    const distance = haversine(driverLocation, pickupLocation);
    const duration = (distance / URBAN_SPEED_KMH) * 60;
    return {
      distanceKm: round2(distance),
      durationMin: Math.round(duration),
    };
  }
}

// ─── OSRM Route ──────────────────────────────────────────────

async function getOSRMRoute(
  origin: GeoLocation,
  destination: GeoLocation,
): Promise<RouteResult> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error('OSRM request failed');

  const data = await response.json() as any;
  if (!data.routes?.length) throw new Error('No OSRM route found');

  const route = data.routes[0];
  const distanceKm = route.distance / 1000;
  const durationMin = route.duration / 60;

  // Decode GeoJSON coordinates to polyline
  const coordinates: [number, number][] = route.geometry?.coordinates ?? [];
  const polyline = encodeGeoJSONPolyline(coordinates);

  // Extract steps
  const steps: RouteStep[] = [];
  if (route.legs?.[0]?.steps) {
    for (const step of route.legs[0].steps) {
      const coords = step.maneuver?.location;
      steps.push({
        instruction: step.name || step.maneuver?.type || 'Continue',
        distanceKm: round2((step.distance ?? 0) / 1000),
        durationMin: Math.round((step.duration ?? 0) / 60),
        startLocation: { latitude: coords?.[1] ?? 0, longitude: coords?.[0] ?? 0 },
        endLocation: { latitude: coords?.[1] ?? 0, longitude: coords?.[0] ?? 0 },
        maneuver: step.maneuver?.type ?? 'straight',
      });
    }
  }

  return {
    distanceKm: round2(distanceKm),
    durationMin: Math.round(durationMin),
    polyline,
    steps,
    trafficLevel: 'unknown',
  };
}

// ─── OSRM Route Alternatives ─────────────────────────────────

async function getOSRMRouteAlternatives(
  origin: GeoLocation,
  destination: GeoLocation,
): Promise<RouteResult[]> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true&alternatives=true&alternatives=3`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error('OSRM alternatives request failed');

  const data = await response.json() as any;
  if (!data.routes?.length) return [];

  return data.routes.map((route: any) => {
    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;
    const coordinates: [number, number][] = route.geometry?.coordinates ?? [];
    const polyline = encodeGeoJSONPolyline(coordinates);

    return {
      distanceKm: round2(distanceKm),
      durationMin: Math.round(durationMin),
      polyline,
      steps: [] as RouteStep[],
      trafficLevel: 'unknown' as TrafficLevel,
    };
  });
}

// ─── Haversine Fallback Route ────────────────────────────────

function getHaversineRoute(
  origin: GeoLocation,
  destination: GeoLocation,
): RouteResult {
  const straightDistance = haversine(origin, destination);
  const roadDistance = straightDistance * 1.3; // urban road factor
  const durationMin = Math.round((roadDistance / URBAN_SPEED_KMH) * 60);

  const polyline = encodePolyline([toGeoPoint(origin), toGeoPoint(destination)]);

  const steps: RouteStep[] = [
    {
      instruction: 'Head to your destination',
      distanceKm: round2(roadDistance),
      durationMin,
      startLocation: toGeoPoint(origin),
      endLocation: toGeoPoint(destination),
      maneuver: 'straight',
    },
  ];

  return {
    distanceKm: round2(roadDistance),
    durationMin,
    polyline,
    steps,
    trafficLevel: 'unknown',
  };
}

// ─── Mapbox Route (Premium) ──────────────────────────────────
// Uses Mapbox Directions API for traffic-aware routing.

export async function getMapboxRoute(
  origin: GeoLocation,
  destination: GeoLocation,
): Promise<RouteResult | null> {
  if (!MAPBOX_TOKEN) return null;

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?overview=full&geometries=geojson&steps=true&access_token=${MAPBOX_TOKEN}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) return null;

  const data = await response.json() as any;
  if (!data.routes?.length) return null;

  const route = data.routes[0];
  const distanceKm = route.distance / 1000;
  const durationMin = route.duration / 60;
  const coordinates: [number, number][] = route.geometry?.coordinates ?? [];
  const polyline = encodeGeoJSONPolyline(coordinates);

  // Mapbox traffic awareness
  let trafficLevel: TrafficLevel = 'unknown';
  if (route.weight) {
    const ratio = route.weight / route.duration;
    if (ratio < 1.1) trafficLevel = 'light';
    else if (ratio < 1.4) trafficLevel = 'moderate';
    else trafficLevel = 'heavy';
  }

  const steps: RouteStep[] = [];
  if (route.legs?.[0]?.steps) {
    for (const step of route.legs[0].steps) {
      const coords = step.maneuver?.location;
      steps.push({
        instruction: step.name || step.maneuver?.type || 'Continue',
        distanceKm: round2((step.distance ?? 0) / 1000),
        durationMin: Math.round((step.duration ?? 0) / 60),
        startLocation: { latitude: coords?.[1] ?? 0, longitude: coords?.[0] ?? 0 },
        endLocation: { latitude: coords?.[1] ?? 0, longitude: coords?.[0] ?? 0 },
        maneuver: step.maneuver?.type ?? 'straight',
      });
    }
  }

  return {
    distanceKm: round2(distanceKm),
    durationMin: Math.round(durationMin),
    polyline,
    steps,
    trafficLevel,
  };
}

// ─── Private Helpers ──────────────────────────────────────────

function toGeoPoint(loc: GeoLocation): GeoPoint {
  return { latitude: loc.lat, longitude: loc.lng };
}

function haversine(a: GeoLocation, b: GeoLocation): number {
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const x =
    sinHalfLat * sinHalfLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfLng * sinHalfLng;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function encodePolyline(points: GeoPoint[]): string {
  if (!points.length) return '';
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);
    encoded += encodeValue(lat - prevLat);
    encoded += encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

function encodeGeoJSONPolyline(coordinates: [number, number][]): string {
  const points: GeoPoint[] = coordinates.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));
  return encodePolyline(points);
}

function encodeValue(value: number): string {
  let result = '';
  let v = value < 0 ? ~(value << 1) : value << 1;
  if (value < 0) v = ~v;

  while (v >= 0x20) {
    result += String.fromCharCode((v & 0x1f) | 0x20);
    v >>= 5;
  }

  result += String.fromCharCode(v);
  return result;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
