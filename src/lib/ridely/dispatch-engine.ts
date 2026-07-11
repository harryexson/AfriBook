// ─── Dispatch Engine ──────────────────────────────────────────
// Uber-style dispatch: search nearby drivers, rank them, send
// simultaneous offers, wait for the first acceptance, and expand
// the search radius if no one accepts.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type { GeoPoint } from '@/types';
import type {
  RideRequest,
  DeliveryRequest,
  FoodOrder,
  DispatchResult,
  DriverCandidate,
  SurgeZone,
} from '@/types/ridely';
import {
  findNearbyDrivers,
  calculateDistance,
  calculateETA,
} from './geospatial';
import { rankDrivers, getTopDrivers } from './driver-ranking';

// ─── Constants ────────────────────────────────────────────────

const OFFER_TIMEOUT_MS = 12_000;
const MAX_OFFERS_PER_ROUND = 3;
const RADIUS_EXPANSION = [5, 8, 12, 20] as const;

// ─── Dispatch Ride ────────────────────────────────────────────
// Main dispatch flow: search → rank → offer → assign.

export async function dispatchRide(
  rideRequest: RideRequest,
): Promise<DispatchResult> {
  const supabase = await createClient();

  await updateRideStatus(supabase, rideRequest.id, 'searching');

  const surgeZones = await getActiveSurgeZones();

  const pickup: GeoPoint = {
    latitude: rideRequest.pickup.lat,
    longitude: rideRequest.pickup.lng,
  };

  for (const radius of RADIUS_EXPANSION) {
    const candidates = await findNearbyDrivers(
      rideRequest.pickup,
      radius,
      rideRequest.rideType,
    );

    if (!candidates.length) continue;

    const ranked = rankDrivers(candidates, {
      pickup,
      rideType: rideRequest.rideType,
      surgeZones,
    });

    const topDrivers = getTopDrivers(ranked, MAX_OFFERS_PER_ROUND);

    const acceptedDriverId = await offerAndWait(
      rideRequest.id,
      topDrivers.map((d) => d.driverId),
      OFFER_TIMEOUT_MS,
    );

    if (acceptedDriverId) {
      const topScore = topDrivers.find((d) => d.driverId === acceptedDriverId)!;
      const candidate = candidates.find((c) => c.driverId === acceptedDriverId)!;

      await assignDriverToRide(supabase, rideRequest.id, acceptedDriverId);

      return {
        success: true,
        driverId: acceptedDriverId,
        driverName: candidate.name,
        driverRating: candidate.rating,
        vehicleInfo: `${candidate.vehicle.year} ${candidate.vehicle.color} ${candidate.vehicle.make} ${candidate.vehicle.model}`,
        etaMinutes: topScore.etaMinutes,
        searchRadiusKm: radius,
        candidatesConsidered: candidates.length,
      };
    }
  }

  await updateRideStatus(supabase, rideRequest.id, 'requesting');

  return {
    success: false,
    searchRadiusKm: RADIUS_EXPANSION[RADIUS_EXPANSION.length - 1],
    candidatesConsidered: 0,
    error: 'No drivers available in the area',
  };
}

// ─── Dispatch Delivery ────────────────────────────────────────

export async function dispatchDelivery(
  deliveryRequest: DeliveryRequest,
): Promise<DispatchResult> {
  const supabase = await createClient();

  await updateDeliveryStatus(supabase, deliveryRequest.id, 'searching');

  const surgeZones = await getActiveSurgeZones();

  const pickup: GeoPoint = {
    latitude: deliveryRequest.pickup.lat,
    longitude: deliveryRequest.pickup.lng,
  };

  for (const radius of RADIUS_EXPANSION) {
    const candidates = await findNearbyDrivers(
      deliveryRequest.pickup,
      radius,
    );

    if (!candidates.length) continue;

    const ranked = rankDrivers(candidates, {
      pickup,
      rideType: 'economy',
      surgeZones,
    });

    const topDrivers = getTopDrivers(ranked, MAX_OFFERS_PER_ROUND);

    const acceptedDriverId = await offerAndWait(
      deliveryRequest.id,
      topDrivers.map((d) => d.driverId),
      OFFER_TIMEOUT_MS,
    );

    if (acceptedDriverId) {
      const topScore = topDrivers.find((d) => d.driverId === acceptedDriverId)!;
      const candidate = candidates.find((c) => c.driverId === acceptedDriverId)!;

      await assignDriverToDelivery(supabase, deliveryRequest.id, acceptedDriverId);

      return {
        success: true,
        driverId: acceptedDriverId,
        driverName: candidate.name,
        driverRating: candidate.rating,
        vehicleInfo: `${candidate.vehicle.year} ${candidate.vehicle.color} ${candidate.vehicle.make} ${candidate.vehicle.model}`,
        etaMinutes: topScore.etaMinutes,
        searchRadiusKm: radius,
        candidatesConsidered: candidates.length,
      };
    }
  }

  await updateDeliveryStatus(supabase, deliveryRequest.id, 'requesting');

  return {
    success: false,
    searchRadiusKm: RADIUS_EXPANSION[RADIUS_EXPANSION.length - 1],
    candidatesConsidered: 0,
    error: 'No drivers available for delivery',
  };
}

// ─── Dispatch Food Delivery ───────────────────────────────────
// Coordinates restaurant prep time with driver ETA for optimal
// dispatch timing.

export async function dispatchFoodDelivery(
  foodOrder: FoodOrder,
): Promise<DispatchResult> {
  const supabase = await createClient();

  const surgeZones = await getActiveSurgeZones();
  const allCandidates: DriverCandidate[] = [];

  const restaurantGeoLoc = {
    lat: foodOrder.restaurantLocation.latitude,
    lng: foodOrder.restaurantLocation.longitude,
  };

  for (const radius of RADIUS_EXPANSION) {
    const candidates = await findNearbyDrivers(restaurantGeoLoc, radius);

    if (candidates.length) {
      allCandidates.push(...candidates);
      break;
    }
  }

  if (!allCandidates.length) {
    return {
      success: false,
      searchRadiusKm: RADIUS_EXPANSION[RADIUS_EXPANSION.length - 1],
      candidatesConsidered: 0,
      error: 'No drivers available for food delivery',
    };
  }

  const ranked = rankDrivers(allCandidates, {
    pickup: foodOrder.restaurantLocation,
    rideType: 'economy',
    surgeZones,
  });

  const prepTimeMin = foodOrder.subtotal > 0 ? 20 : 15; // estimate from order size

  for (const topDriver of getTopDrivers(ranked, MAX_OFFERS_PER_ROUND)) {
    const candidate = allCandidates.find(
      (c) => c.driverId === topDriver.driverId,
    )!;

    const driverDistance = calculateDistance(
      foodOrder.restaurantLocation,
      candidate.location,
    );
    const driverToRestaurantETA = calculateETA(driverDistance, 30, 1.2);

    let delayMs = 0;

    if (driverToRestaurantETA < prepTimeMin) {
      const waitMinutes = Math.max(0, prepTimeMin - driverToRestaurantETA - 2);
      delayMs = waitMinutes * 60 * 1000;
    }

    const offerResult = await sendOfferWithDelay(
      foodOrder.id,
      topDriver.driverId,
      delayMs,
    );

    if (offerResult) {
      await assignDriverToFoodOrder(supabase, foodOrder.id, topDriver.driverId);

      return {
        success: true,
        driverId: topDriver.driverId,
        driverName: candidate.name,
        driverRating: candidate.rating,
        vehicleInfo: `${candidate.vehicle.year} ${candidate.vehicle.color} ${candidate.vehicle.make} ${candidate.vehicle.model}`,
        etaMinutes: topDriver.etaMinutes,
        searchRadiusKm: driverDistance,
        candidatesConsidered: allCandidates.length,
      };
    }
  }

  return {
    success: false,
    searchRadiusKm: RADIUS_EXPANSION[0],
    candidatesConsidered: allCandidates.length,
    error: 'No drivers accepted the food delivery offer',
  };
}

// ─── Send Driver Offer ────────────────────────────────────────

export async function sendDriverOffer(
  rideId: string,
  driverId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_MS).toISOString();

  const { error } = await supabase.from('driver_offers').insert({
    ride_id: rideId,
    driver_id: driverId,
    status: 'pending',
    expires_at: expiresAt,
  });

  if (error) {
    console.error('[dispatch] sendDriverOffer error:', error);
    return false;
  }

  await sendPushNotification(driverId, {
    title: 'New Ride Request',
    body: 'You have a new ride request. Tap to view details.',
    data: { rideId, type: 'ride_offer' },
  });

  return true;
}

// ─── Handle Offer Response ────────────────────────────────────

export async function handleOfferResponse(
  rideId: string,
  driverId: string,
  accepted: boolean,
): Promise<boolean> {
  const supabase = await createClient();

  const status = accepted ? 'accepted' : 'declined';

  const { error } = await supabase
    .from('driver_offers')
    .update({ status })
    .eq('ride_id', rideId)
    .eq('driver_id', driverId)
    .eq('status', 'pending');

  if (error) {
    console.error('[dispatch] handleOfferResponse error:', error);
    return false;
  }

  if (accepted) {
    await supabase
      .from('driver_offers')
      .update({ status: 'expired' })
      .eq('ride_id', rideId)
      .eq('status', 'pending');
  }

  return true;
}

// ─── Expand Search Radius ─────────────────────────────────────

export function expandSearchRadius(currentRadius: number): number {
  const idx = RADIUS_EXPANSION.indexOf(currentRadius as (typeof RADIUS_EXPANSION)[number]);
  if (idx < 0 || idx >= RADIUS_EXPANSION.length - 1) {
    return RADIUS_EXPANSION[RADIUS_EXPANSION.length - 1];
  }
  return RADIUS_EXPANSION[idx + 1];
}

// ─── Handle Driver Timeout ────────────────────────────────────

export async function handleDriverTimeout(rideId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('driver_offers')
    .update({ status: 'expired' })
    .eq('ride_id', rideId)
    .eq('status', 'pending');

  console.log(`[dispatch] All offers expired for ride ${rideId}`);
}

// ─── Private Helpers ──────────────────────────────────────────

async function offerAndWait(
  rideId: string,
  driverIds: string[],
  timeoutMs: number,
): Promise<string | null> {
  const supabase = await createClient();

  for (const driverId of driverIds) {
    await sendDriverOffer(rideId, driverId);
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('driver_offers')
      .select('driver_id, status')
      .eq('ride_id', rideId)
      .eq('status', 'accepted')
      .maybeSingle();

    if (data) {
      return data.driver_id as string;
    }

    await sleep(500);
  }

  await handleDriverTimeout(rideId);
  return null;
}

async function sendOfferWithDelay(
  rideId: string,
  driverId: string,
  delayMs: number,
): Promise<boolean> {
  if (delayMs > 0) {
    await sleep(delayMs);
  }

  const supabase = await createClient();

  const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_MS).toISOString();

  const { error } = await supabase.from('driver_offers').insert({
    ride_id: rideId,
    driver_id: driverId,
    status: 'pending',
    expires_at: expiresAt,
  });

  if (error) return false;

  await sendPushNotification(driverId, {
    title: 'New Food Delivery',
    body: 'You have a food delivery request. Tap to view.',
    data: { rideId, type: 'food_delivery_offer' },
  });

  const deadline = Date.now() + OFFER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('driver_offers')
      .select('status')
      .eq('ride_id', rideId)
      .eq('driver_id', driverId)
      .maybeSingle();

    if (data?.status === 'accepted') return true;
    if (data?.status === 'declined') return false;

    await sleep(500);
  }

  await supabase
    .from('driver_offers')
    .update({ status: 'expired' })
    .eq('ride_id', rideId)
    .eq('driver_id', driverId)
    .eq('status', 'pending');

  return false;
}

async function updateRideStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rideId: string,
  status: string,
): Promise<void> {
  await supabase
    .from('ride_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', rideId);
}

async function updateDeliveryStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deliveryId: string,
  status: string,
): Promise<void> {
  await supabase
    .from('delivery_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', deliveryId);
}

async function assignDriverToRide(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rideId: string,
  driverId: string,
): Promise<void> {
  await supabase
    .from('ride_requests')
    .update({
      driver_id: driverId,
      status: 'matched',
      matched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId);

  await supabase
    .from('drivers')
    .update({ status: 'on_trip', currentTripId: rideId } as any)
    .eq('id', driverId);
}

async function assignDriverToDelivery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deliveryId: string,
  driverId: string,
): Promise<void> {
  await supabase
    .from('delivery_requests')
    .update({
      driver_id: driverId,
      status: 'matched',
      matched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliveryId);

  await supabase
    .from('drivers')
    .update({ status: 'on_trip' } as any)
    .eq('id', driverId);
}

async function assignDriverToFoodOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  driverId: string,
): Promise<void> {
  await supabase
    .from('food_orders')
    .update({
      driver_id: driverId,
      status: 'matched',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  await supabase
    .from('drivers')
    .update({ status: 'on_trip' } as any)
    .eq('id', driverId);
}

async function getActiveSurgeZones(): Promise<SurgeZone[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('surge_zones')
    .select('*')
    .eq('active', true);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    countryCode: (row.country_code as string) ?? '',
    name: row.name as string,
    center: row.center as GeoPoint,
    radiusKm: row.radius_km as number,
    multiplier: row.multiplier as number,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? row.created_at as string,
  }));
}

async function sendPushNotification(
  driverId: string,
  notification: { title: string; body: string; data: Record<string, unknown> },
): Promise<void> {
  const supabase = await createClient();

  const { data: driver } = await supabase
    .from('drivers')
    .select('userId')
    .eq('id', driverId)
    .single();

  if (!driver) return;

  await supabase.from('notifications').insert({
    userId: driver.userId,
    type: 'booking',
    title: notification.title,
    body: notification.body,
    data: notification.data,
    isRead: false,
  } as any);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
