// ─── Driver Ranking Service ───────────────────────────────────
// Weighted scoring algorithm for ranking driver candidates.
// Each factor returns 0–100; weights are applied for the final score.
//
// NOTE: DriverCandidate.location is GeoPoint (latitude/longitude).
//       Ride pickup/destination are GeoLocation (lat/lng).
//       calculateDistance handles both via duck-typing.
// ──────────────────────────────────────────────────────────────

import type { GeoPoint } from '@/types';
import type {
  DriverCandidate,
  DriverScore,
  RideType,
  SurgeZone,
} from '@/types/ridely';
import { calculateDistance, calculateETA } from './geospatial';

// ─── Scoring Weights ──────────────────────────────────────────

const WEIGHTS = {
  distance: 0.35,
  eta: 0.25,
  acceptance: 0.10,
  rating: 0.10,
  activeTime: 0.05,
  surge: 0.10,
  vehicleMatch: 0.05,
} as const;

// ─── Rank Drivers ─────────────────────────────────────────────
// Scores every candidate against the ride request and returns
// them sorted descending by total weighted score.

export function rankDrivers(
  candidates: DriverCandidate[],
  rideRequest: {
    pickup: GeoPoint;
    rideType: RideType;
    surgeZones: SurgeZone[];
  },
): DriverScore[] {
  const scores = candidates.map((candidate) => {
    const distanceKm = calculateDistance(
      rideRequest.pickup,
      candidate.location,
    );

    const etaMinutes = calculateETA(distanceKm, 30, 1.2);

    const distanceScore = calculateDistanceScore(distanceKm);
    const etaScore = calculateETAScore(etaMinutes);
    const acceptanceScore = calculateAcceptanceScore(candidate.acceptanceRate);
    const ratingScore = calculateRatingScore(candidate.rating);
    const activeTimeScore = calculateActiveTimeScore(candidate.hoursThisWeek);
    const surgeScore = calculateSurgeScore(
      candidate.location,
      rideRequest.surgeZones,
    );
    const vehicleMatchScore = calculateVehicleMatchScore(
      candidate.vehicle.type,
      rideRequest.rideType,
    );

    const totalScore =
      distanceScore * WEIGHTS.distance +
      etaScore * WEIGHTS.eta +
      acceptanceScore * WEIGHTS.acceptance +
      ratingScore * WEIGHTS.rating +
      activeTimeScore * WEIGHTS.activeTime +
      surgeScore * WEIGHTS.surge +
      vehicleMatchScore * WEIGHTS.vehicleMatch;

    return {
      driverId: candidate.driverId,
      totalScore: Math.round(totalScore * 100) / 100,
      distanceScore,
      etaScore,
      acceptanceScore,
      ratingScore,
      activeTimeScore,
      surgeScore,
      vehicleMatchScore,
      distanceKm: Math.round(distanceKm * 100) / 100,
      etaMinutes: Math.round(etaMinutes),
    };
  });

  scores.sort((a, b) => b.totalScore - a.totalScore);
  return scores;
}

// ─── Distance Score ───────────────────────────────────────────
// Closer drivers score higher. 0 km → 100, 5+ km → 0.

export function calculateDistanceScore(distanceKm: number): number {
  if (distanceKm <= 0) return 100;
  if (distanceKm >= 5) return 0;
  return Math.max(0, Math.round((1 - distanceKm / 5) * 100));
}

// ─── ETA Score ────────────────────────────────────────────────
// Shorter ETA scores higher. 0 min → 100, 15+ min → 0.

export function calculateETAScore(etaMinutes: number): number {
  if (etaMinutes <= 0) return 100;
  if (etaMinutes >= 15) return 0;
  return Math.max(0, Math.round((1 - etaMinutes / 15) * 100));
}

// ─── Acceptance Rate Score ────────────────────────────────────
// Higher acceptance rate scores higher. 100% → 100, 0% → 0.

export function calculateAcceptanceScore(rate: number): number {
  return Math.max(0, Math.min(100, Math.round(rate)));
}

// ─── Rating Score ─────────────────────────────────────────────
// Driver rating (1–5 scale) mapped to 0–100.

export function calculateRatingScore(rating: number): number {
  if (rating <= 0) return 0;
  if (rating >= 5) return 100;
  return Math.max(0, Math.round((rating / 5) * 100));
}

// ─── Active Time Score ────────────────────────────────────────
// Drivers with more hours online this week score higher.
// 40+ hours → 100, 0 hours → 0. Encourages consistent availability.

export function calculateActiveTimeScore(hoursThisWeek: number): number {
  if (hoursThisWeek <= 0) return 0;
  if (hoursThisWeek >= 40) return 100;
  return Math.max(0, Math.round((hoursThisWeek / 40) * 100));
}

// ─── Surge Zone Score ─────────────────────────────────────────
// Drivers located within an active surge zone get bonus points.
// Being inside the zone → 100, outside → 0.

export function calculateSurgeScore(
  driverLocation: GeoPoint,
  surgeZones: SurgeZone[],
): number {
  if (!surgeZones.length) return 50; // neutral when no surge

  for (const zone of surgeZones) {
    if (!zone.active) continue;
    const dist = calculateDistance(driverLocation, zone.center);
    if (dist <= zone.radiusKm) return 100;
  }

  return 0;
}

// ─── Vehicle Match Score ──────────────────────────────────────
// Perfect vehicle type match → 100, related type → 50, no match → 0.

export function calculateVehicleMatchScore(
  driverVehicleType: string,
  requestedType: RideType,
): number {
  if (driverVehicleType === requestedType) return 100;

  const compatibility: Record<string, string[]> = {
    economy: ['car', 'motorcycle'],
    comfort: ['car'],
    premium: ['car'],
    xl: ['car', 'van', 'truck'],
    motorcycle: ['motorcycle'],
    bicycle: ['bicycle'],
  };

  const compatible = compatibility[requestedType] ?? [];
  if (compatible.includes(driverVehicleType)) return 50;

  return 0;
}

// ─── Get Top Drivers ──────────────────────────────────────────
// Returns the top N ranked drivers from a scored list.

export function getTopDrivers(
  ranked: DriverScore[],
  count: number = 3,
): DriverScore[] {
  return ranked.slice(0, Math.max(1, count));
}
