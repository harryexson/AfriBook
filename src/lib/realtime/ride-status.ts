// ─── Ride Status Realtime ───────────────────────────────────
// Real-time ride/delivery status tracking via Supabase Realtime.
// Broadcasts status transitions to rider and driver clients.
// ──────────────────────────────────────────────────────────────

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { RideStatusEvent, RideStatus, DeliveryStatus } from '@/types/ridely';

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
