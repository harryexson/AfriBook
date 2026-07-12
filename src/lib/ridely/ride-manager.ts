// ─── Ride Manager ─────────────────────────────────────────────
// Ride lifecycle management: creation, status transitions,
// cancellation fee logic, history, and rating.
//
// NOTE: RideStatus = "requesting" | "searching" | "matched" | "accepted"
//       | "en_route" | "arrived" | "in_progress" | "completed" | "cancelled"
//       CancellationActor = "rider" | "driver" | "system"
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type {
  RideRequest,
  RideStatus,
  RideType,
  GeoLocation,
  CancellationActor,
  CancellationFeeConfig,
} from '@/types/ridely';
import type { DbGeoLocation } from '@/types';
import { RIDE_STATUS_TRANSITIONS, RIDE_TYPE_CONFIG } from '@/types/ridely';
import { dispatchRide } from './dispatch-engine';
import { getPricingEstimate } from './surge-pricing';
import { COUNTRIES } from '@/lib/localization/countries';

// ─── Cancellation Fee Configs by Country ──────────────────────

const CANCELLATION_FEES: Record<string, CancellationFeeConfig> = {
  NG: { beforeAssignment: 0, withinTwoMinutes: 500, afterEnRoute: 1000, afterArrived: 2000 },
  US: { beforeAssignment: 0, withinTwoMinutes: 1, afterEnRoute: 2, afterArrived: 4 },
  GB: { beforeAssignment: 0, withinTwoMinutes: 1, afterEnRoute: 2, afterArrived: 4 },
  KE: { beforeAssignment: 0, withinTwoMinutes: 50, afterEnRoute: 100, afterArrived: 200 },
  ZA: { beforeAssignment: 0, withinTwoMinutes: 10, afterEnRoute: 20, afterArrived: 40 },
  IN: { beforeAssignment: 0, withinTwoMinutes: 20, afterEnRoute: 50, afterArrived: 100 },
  GH: { beforeAssignment: 0, withinTwoMinutes: 5, afterEnRoute: 10, afterArrived: 20 },
  TZ: { beforeAssignment: 0, withinTwoMinutes: 2000, afterEnRoute: 4000, afterArrived: 8000 },
  UG: { beforeAssignment: 0, withinTwoMinutes: 2000, afterEnRoute: 4000, afterArrived: 8000 },
  MW: { beforeAssignment: 0, withinTwoMinutes: 1000, afterEnRoute: 2000, afterArrived: 4000 },
  EG: { beforeAssignment: 0, withinTwoMinutes: 10, afterEnRoute: 20, afterArrived: 40 },
  AE: { beforeAssignment: 0, withinTwoMinutes: 5, afterEnRoute: 10, afterArrived: 20 },
  CA: { beforeAssignment: 0, withinTwoMinutes: 1.5, afterEnRoute: 3, afterArrived: 6 },
  FR: { beforeAssignment: 0, withinTwoMinutes: 1.5, afterEnRoute: 3, afterArrived: 6 },
  DE: { beforeAssignment: 0, withinTwoMinutes: 2, afterEnRoute: 4, afterArrived: 8 },
};

const DEFAULT_CANCELLATION_FEES: CancellationFeeConfig = {
  beforeAssignment: 0,
  withinTwoMinutes: 2,
  afterEnRoute: 5,
  afterArrived: 10,
};

// ─── Create Ride Request ──────────────────────────────────────

export async function createRideRequest(params: {
  riderId: string;
  rideType: RideType;
  pickup: GeoLocation;
  pickupAddress: string;
  destination: GeoLocation;
  destinationAddress: string;
  countryCode: string;
  paymentType: RideRequest['paymentType'];
  scheduledAt?: string;
}): Promise<RideRequest | null> {
  const supabase = await createClient();
  const country = COUNTRIES[params.countryCode];
  const currencyCode = country?.currency.code ?? 'USD';

  const estimate = await getPricingEstimate(
    params.pickup,
    params.destination,
    params.rideType,
    params.countryCode,
  );

  const pricing = {
    baseFare: estimate.baseFare,
    perKmRate: round2(estimate.distanceFare / Math.max(estimate.estimatedDistanceKm, 0.1)),
    perMinRate: round2(estimate.timeFare / Math.max(estimate.estimatedDurationMin, 1)),
    minimumFare: RIDE_TYPE_CONFIG[params.rideType].minimumFare,
    surgeMultiplier: estimate.surgeMultiplier,
    estimatedFare: estimate.estimatedTotal,
    currencyCode,
  };

  const { data, error } = await supabase
    .from('ride_requests')
    .insert({
      rider_id: params.riderId,
      ride_type: params.rideType,
      status: 'requesting',
      pickup_location: params.pickup as unknown as DbGeoLocation,
      pickup_address: params.pickupAddress,
      destination_location: params.destination as unknown as DbGeoLocation,
      destination_address: params.destinationAddress,
      distance_km: estimate.estimatedDistanceKm,
      estimated_duration_min: estimate.estimatedDurationMin,
      estimated_fare: estimate.estimatedTotal,
      surge_multiplier: estimate.surgeMultiplier,
      payment_type: params.paymentType,
      route_polyline: null,
    } as any)
    .select()
    .single();

  if (error || !data) {
    console.error('[ride-manager] createRideRequest error:', error);
    return null;
  }

  const ride = rowToRideRequest(data);

  dispatchRide(ride).catch((err) =>
    console.error('[ride-manager] dispatchRide failed:', err),
  );

  return ride;
}

// ─── Update Ride Status ───────────────────────────────────────

export async function updateRideStatus(
  rideId: string,
  status: RideStatus,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('ride_requests')
    .select('status')
    .eq('id', rideId)
    .single();

  if (!current) return false;

  const currentStatus = current.status as RideStatus;
  const allowed = RIDE_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(status)) {
    console.error(
      `[ride-manager] Invalid transition: ${currentStatus} -> ${status}`,
    );
    return false;
  }

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') updatePayload.completed_at = new Date().toISOString();
  if (status === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();
  if (status === 'en_route') updatePayload.accepted_at = new Date().toISOString();
  if (status === 'arrived') updatePayload.arrived_at = new Date().toISOString();
  if (status === 'in_progress') updatePayload.started_at = new Date().toISOString();

  const { error } = await supabase
    .from('ride_requests')
    .update(updatePayload as any)
    .eq('id', rideId);

  if (error) {
    console.error('[ride-manager] updateRideStatus error:', error);
    return false;
  }

  return true;
}

// ─── Cancel Ride ──────────────────────────────────────────────

export async function cancelRide(
  rideId: string,
  riderId: string,
  reason: string,
): Promise<{ success: boolean; cancellationFee: number; error?: string }> {
  const supabase = await createClient();

  const { data: ride } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('id', rideId)
    .eq('rider_id', riderId)
    .single();

  if (!ride) return { success: false, cancellationFee: 0, error: 'Ride not found' };

  const status = ride.status as RideStatus;
  if (status === 'completed' || status === 'cancelled') {
    return { success: false, cancellationFee: 0, error: 'Ride cannot be cancelled' };
  }

  const cancellationFee = calculateCancellationFee(status, ride);

  const { error } = await supabase
    .from('ride_requests')
    .update({
      status: 'cancelled',
      cancelled_by: 'rider',
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', rideId);

  if (error) {
    console.error('[ride-manager] cancelRide error:', error);
    return { success: false, cancellationFee: 0, error: error.message };
  }

  if (ride.driver_id) {
    await supabase
      .from('drivers')
      .update({ status: 'available' } as any)
      .eq('id', ride.driver_id);
  }

  return { success: true, cancellationFee };
}

// ─── Get Active Ride ──────────────────────────────────────────

export async function getActiveRide(riderId: string): Promise<RideRequest | null> {
  const supabase = await createClient();

  const activeStatuses = ['requesting', 'searching', 'matched', 'accepted', 'en_route', 'arrived', 'in_progress'];

  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('rider_id', riderId)
    .in('status', activeStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRideRequest(data);
}

// ─── Get Ride History ─────────────────────────────────────────

export async function getRideHistory(
  riderId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ rides: RideRequest[]; total: number; hasMore: boolean }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { count } = await supabase
    .from('ride_requests')
    .select('*', { count: 'exact', head: true })
    .eq('rider_id', riderId)
    .in('status', ['completed', 'cancelled']);

  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('rider_id', riderId)
    .in('status', ['completed', 'cancelled'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return { rides: [], total: 0, hasMore: false };

  return {
    rides: data.map(rowToRideRequest),
    total: count ?? 0,
    hasMore: offset + limit < (count ?? 0),
  };
}

// ─── Rate Ride ────────────────────────────────────────────────

export async function rateRide(
  rideId: string,
  rating: number,
  review?: string,
): Promise<boolean> {
  const supabase = await createClient();

  if (rating < 1 || rating > 5) return false;

  const { data: ride } = await supabase
    .from('ride_requests')
    .select('status, driver_id')
    .eq('id', rideId)
    .single();

  if (!ride || ride.status !== 'completed') return false;

  const { error } = await supabase
    .from('ride_requests')
    .update({
      rating,
      review: review ?? null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', rideId);

  if (error) {
    console.error('[ride-manager] rateRide error:', error);
    return false;
  }

  if (ride.driver_id) {
    await updateDriverAverageRating(ride.driver_id);
  }

  return true;
}

// ─── Get Ride By ID ───────────────────────────────────────────

export async function getRideById(rideId: string): Promise<RideRequest | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('id', rideId)
    .single();

  if (error || !data) return null;
  return rowToRideRequest(data);
}

// ─── Private Helpers ──────────────────────────────────────────

function calculateCancellationFee(
  status: RideStatus,
  ride: Record<string, unknown>,
): number {
  if (!ride.driver_id) return 0;

  const fees = DEFAULT_CANCELLATION_FEES;
  const matchedAt = ride.matched_at as string | null;
  if (!matchedAt) return fees.beforeAssignment;

  const minutesSinceMatch = (Date.now() - new Date(matchedAt).getTime()) / (1000 * 60);

  switch (status) {
    case 'matched':
    case 'accepted':
      if (minutesSinceMatch <= 2) return fees.withinTwoMinutes;
      return fees.afterEnRoute;
    case 'en_route':
      return fees.afterEnRoute;
    case 'arrived':
      return fees.afterArrived;
    default:
      return fees.beforeAssignment;
  }
}

async function updateDriverAverageRating(driverId: string): Promise<void> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('ride_requests')
    .select('rating')
    .eq('driver_id', driverId)
    .eq('status', 'completed')
    .not('rating', 'is', null);

  if (!data?.length) return;

  const avgRating =
    data.reduce((sum, r) => sum + ((r.rating as number) ?? 0), 0) / data.length;

  await supabase
    .from('drivers')
    .update({ rating: Math.round(avgRating * 10) / 10 } as any)
    .eq('id', driverId);
}

function rowToRideRequest(row: Record<string, unknown>): RideRequest {
  const pickupLoc = row.pickup_location as GeoLocation;
  const destLoc = row.destination_location as GeoLocation;

  return {
    id: row.id as string,
    riderId: row.rider_id as string,
    driverId: row.driver_id as string | undefined,
    rideType: row.ride_type as RideType,
    status: row.status as RideStatus,
    pickup: pickupLoc,
    pickupAddress: row.pickup_address as string,
    destination: destLoc,
    destinationAddress: row.destination_address as string,
    distanceKm: row.distance_km as number,
    durationMin: (row.estimated_duration_min as number) ?? 0,
    pricing: {
      baseFare: row.estimated_fare as number,
      perKmRate: 0,
      perMinRate: 0,
      minimumFare: 0,
      surgeMultiplier: row.surge_multiplier as number,
      estimatedFare: row.estimated_fare as number,
      currencyCode: (row.currency_code as string) ?? 'USD',
    },
    paymentType: row.payment_type as RideRequest['paymentType'],
    routePolyline: row.route_polyline as string | undefined,
    cancelledBy: row.cancelled_by as CancellationActor | undefined,
    cancelReason: row.cancel_reason as string | undefined,
    rating: row.rating as number | undefined,
    review: row.review as string | undefined,
    metadata: {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
