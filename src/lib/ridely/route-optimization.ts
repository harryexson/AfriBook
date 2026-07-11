// ─── Route Optimization Service ───────────────────────────────
// Route calculation and ETA estimation. Uses Haversine distance
// with road-factor multipliers for realistic distance/duration
// estimates without external API dependencies.
//
// NOTE: RouteStep locations use GeoPoint (latitude/longitude).
//       Ride pickup/destination use GeoLocation (lat/lng).
//       calculateDistance handles both via duck-typing.
// ──────────────────────────────────────────────────────────────

import type { GeoPoint } from '@/types';
import type { GeoLocation, RouteResult, RouteStep, TrafficLevel } from '@/types/ridely';

// ─── Constants ────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const ROAD_FACTOR_URBAN = 1.3;
const URBAN_SPEED_KMH = 30;
const TRAFFIC_MULTIPLIER: Record<TrafficLevel, number> = {
  light: 1.0,
  moderate: 1.3,
  heavy: 1.8,
  unknown: 1.2,
};

// ─── Get Route ────────────────────────────────────────────────

export function getRoute(
  origin: GeoLocation,
  destination: GeoLocation,
): RouteResult {
  const straightDistance = haversine(origin, destination);
  const roadDistance = straightDistance * ROAD_FACTOR_URBAN;
  const trafficLevel: TrafficLevel = 'unknown';
  const duration = estimateRouteDuration(roadDistance, trafficLevel);
  const polyline = encodeSimplePolyline([toGeoPoint(origin), toGeoPoint(destination)]);
  const steps = generateRouteSteps(origin, destination, roadDistance);

  return {
    distanceKm: round2(roadDistance),
    durationMin: Math.round(duration),
    polyline,
    steps,
    trafficLevel,
  };
}

// ─── Get Optimal Route ────────────────────────────────────────

export function getOptimalRoute(
  origin: GeoLocation,
  destination: GeoLocation,
  waypoints: GeoLocation[] = [],
): RouteResult {
  if (!waypoints.length) return getRoute(origin, destination);

  const allPoints = [origin, ...waypoints, destination];
  let totalDistance = 0;
  let totalDuration = 0;
  const allSteps: RouteStep[] = [];

  for (let i = 0; i < allPoints.length - 1; i++) {
    const seg = getRoute(allPoints[i], allPoints[i + 1]);
    totalDistance += seg.distanceKm;
    totalDuration += seg.durationMin;
    allSteps.push(...seg.steps);
  }

  const polyline = encodeSimplePolyline(allPoints.map(toGeoPoint));

  return {
    distanceKm: round2(totalDistance),
    durationMin: Math.round(totalDuration),
    polyline,
    steps: allSteps,
    trafficLevel: 'unknown',
  };
}

// ─── Estimate Route Duration ──────────────────────────────────

export function estimateRouteDuration(
  distanceKm: number,
  trafficLevel: TrafficLevel,
  averageSpeedKmh: number = URBAN_SPEED_KMH,
): number {
  if (distanceKm <= 0) return 0;
  const trafficMult = TRAFFIC_MULTIPLIER[trafficLevel] ?? 1.2;
  const effectiveSpeed = averageSpeedKmh / trafficMult;
  return (distanceKm / effectiveSpeed) * 60;
}

// ─── Get Encoded Polyline ─────────────────────────────────────
// Simplified polyline: straight line between origin and destination.
// In production this would use the Google Polyline algorithm with
// actual road geometry.

export function getPolyline(
  origin: GeoLocation,
  destination: GeoLocation,
): string {
  return encodeSimplePolyline([toGeoPoint(origin), toGeoPoint(destination)]);
}

// ─── Get Route Steps ──────────────────────────────────────────

export function getRouteSteps(
  origin: GeoLocation,
  destination: GeoLocation,
): RouteStep[] {
  const distance = haversine(origin, destination);
  return generateRouteSteps(origin, destination, distance);
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

function generateRouteSteps(
  origin: GeoLocation,
  destination: GeoLocation,
  totalDistanceKm: number,
): RouteStep[] {
  const bearing = calculateBearing(origin, destination);
  const cardinal = bearingToCardinal(bearing);
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;

  const midPoint: GeoPoint = { latitude: midLat, longitude: midLng };

  const midFraction: GeoPoint = {
    latitude: midLat + (destination.lat - midLat) * 0.6,
    longitude: midLng + (destination.lng - midLng) * 0.6,
  };

  return [
    {
      instruction: `Head ${cardinal} from your location`,
      distanceKm: round2(totalDistanceKm * 0.4),
      durationMin: Math.round(estimateRouteDuration(totalDistanceKm * 0.4, 'unknown')),
      startLocation: toGeoPoint(origin),
      endLocation: midPoint,
      maneuver: 'straight',
    },
    {
      instruction: `Continue ${cardinal} for ${formatDistance(totalDistanceKm * 0.4)}`,
      distanceKm: round2(totalDistanceKm * 0.3),
      durationMin: Math.round(estimateRouteDuration(totalDistanceKm * 0.3, 'unknown')),
      startLocation: midPoint,
      endLocation: midFraction,
      maneuver: 'straight',
    },
    {
      instruction: `Arrive at your destination on the ${cardinal} side`,
      distanceKm: round2(totalDistanceKm * 0.3),
      durationMin: Math.round(estimateRouteDuration(totalDistanceKm * 0.3, 'unknown')),
      startLocation: midFraction,
      endLocation: toGeoPoint(destination),
      maneuver: 'straight',
    },
  ];
}

function calculateBearing(origin: GeoLocation, destination: GeoLocation): number {
  const lat1 = origin.lat * DEG_TO_RAD;
  const lat2 = destination.lat * DEG_TO_RAD;
  const dLng = (destination.lng - origin.lng) * DEG_TO_RAD;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function bearingToCardinal(bearing: number): string {
  const directions = [
    'North', 'North-East', 'East', 'South-East',
    'South', 'South-West', 'West', 'North-West',
  ];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

function encodeSimplePolyline(points: GeoPoint[]): string {
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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
