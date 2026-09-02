// ─── Ride Status Realtime ───────────────────────────────────
// Real-time ride/delivery status tracking via Supabase Realtime.
// Broadcasts status transitions to rider and driver clients.
// ──────────────────────────────────────────────────────────────

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { RideStatusEvent, RideStatus } from '@/types/ridely';

// ─── Client: Subscribe to Ride Status Changes ────────────────

export function subscribeToRideStatus(
  rideId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel(`ride-status:${rideId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ridely_rides',
        filter: `id=eq.${rideId}`,
      },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new as any;

        onStatusChange({
          rideId: row.id,
          status: row.status as RideStatus,
          driverId: row.driver_id ?? undefined,
          timestamp: row.updated_at,
          metadata: {
            driverLat: row.driver_location?.coordinates?.[1],
            driverLng: row.driver_location?.coordinates?.[0],
            estimatedArrival: row.estimated_arrival,
          },
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Client: Subscribe to Delivery Status Changes ────────────

export function subscribeToDeliveryStatus(
  deliveryId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel(`delivery-status:${deliveryId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ridely_deliveries',
        filter: `id=eq.${deliveryId}`,
      },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new as any;

        onStatusChange({
          rideId: row.id,
          status: row.status as unknown as RideStatus,
          driverId: row.driver_id ?? undefined,
          timestamp: row.updated_at,
          metadata: {
            driverLat: row.driver_location?.coordinates?.[1],
            driverLng: row.driver_location?.coordinates?.[0],
            estimatedArrival: row.estimated_arrival,
          },
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Client: Subscribe to Food Delivery Status ───────────────

export function subscribeToFoodDeliveryStatus(
  orderId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel(`food-status:${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ridely_food_deliveries',
        filter: `id=eq.${orderId}`,
      },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new as any;

        onStatusChange({
          rideId: row.id,
          status: row.status as unknown as RideStatus,
          driverId: row.driver_id ?? undefined,
          timestamp: row.updated_at,
          metadata: {
            restaurantAccepted: row.restaurant_accepted_at,
            restaurantReady: row.restaurant_ready_at,
            driverPickedUp: row.driver_picked_up_at,
          },
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Client: Subscribe to Driver Offer Responses ─────────────
// For dispatch engine to detect when a driver accepts/declines.

export function subscribeToOfferResponse(
  rideId: string,
  onOfferUpdate: (driverId: string, status: string) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel(`offers:${rideId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'driver_offers',
        filter: `ride_id=eq.${rideId}`,
      },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new as any;
        onOfferUpdate(row.driver_id, row.status);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Client: Subscribe to New Incoming Offers (driver side) ──
// The counterpart to subscribeToOfferResponse above: this is what a
// driver's own dashboard listens on to learn a new trip has been offered
// to them. Fires on INSERT rather than UPDATE — driver_offers rows are
// created once per candidate driver by the dispatch engine and never
// re-inserted, so INSERT is the correct event to watch here. Relies on
// the existing `driver_offers_select` RLS policy, which already scopes
// visibility to `driver_id IN (SELECT id FROM drivers WHERE profile_id =
// auth.uid())` — the same policy realtime enforces for postgres_changes.
export interface DriverOfferEvent {
  offerId: string;
  rideId: string;
  pickupAddress: string | null;
  destinationAddress: string | null;
  distanceKm: number | null;
  estimatedDurationMin: number | null;
  estimatedEarnings: number | null;
  rideType: string;
  expiresAt: string;
}

export function subscribeToDriverOffers(
  driverId: string,
  onNewOffer: (offer: DriverOfferEvent) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel(`driver-offers:${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_offers',
        filter: `driver_id=eq.${driverId}`,
      },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new as any;

        // Only surface offers that are still pending and not already
        // expired by the time the realtime event arrives (clock skew,
        // reconnect after a dropped connection, etc.).
        if (row.status !== 'pending') return;
        if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return;

        onNewOffer({
          offerId: row.id,
          rideId: row.ride_id,
          pickupAddress: row.pickup_address ?? null,
          destinationAddress: row.destination_address ?? null,
          distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
          estimatedDurationMin: row.estimated_duration_min != null ? Number(row.estimated_duration_min) : null,
          estimatedEarnings: row.estimated_earnings != null ? Number(row.estimated_earnings) : null,
          rideType: row.ride_type,
          expiresAt: row.expires_at,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
