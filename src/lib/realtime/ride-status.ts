// ─── Ride Status Realtime ───────────────────────────────────
// Real-time ride/delivery status tracking — previously Supabase Realtime.
//
// NOTE (Neon migration gap): `@/lib/neon/client` (the Neon-backed browser
// client, via SupabaseAuthAdapter + Data API) has no realtime/channel
// primitive — confirmed during the ridely migration (see
// src/lib/ridely/dispatch-engine.ts and src/lib/realtime/driver-location.ts,
// which hit the exact same gap). There is no documented Neon equivalent as
// of this migration. Even leaving these on @/lib/supabase/client would not
// help: writes now go through Neon (src/lib/neon/server.ts), so the old
// Supabase Postgres these channels watched never receives the inserts/
// updates that would fire them — they would silently never call back
// rather than error.
//
// Left as explicit no-ops (matching driver-location.ts's precedent) rather
// than a broken `.channel()` call or a silent dead subscription, so a
// caller sees the warning in dev instead of debugging "why don't ride
// updates ever arrive". Follow-up: a polling hook on an interval, or a
// real realtime channel once Neon exposes one.
// ──────────────────────────────────────────────────────────────

import type { RideStatusEvent } from '@/types/ridely';

function warnNoRealtime(fn: string): void {
  console.warn(
    `[realtime:ride-status] ${fn} is a no-op: Neon has no Supabase-Realtime ` +
      'equivalent (no channel()/postgres_changes). See NOTE at the top of ride-status.ts.',
  );
}

// ─── Client: Subscribe to Ride Status Changes ────────────────

export function subscribeToRideStatus(
  rideId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  void rideId;
  void onStatusChange;
  warnNoRealtime('subscribeToRideStatus');
  return () => {};
}

// ─── Client: Subscribe to Delivery Status Changes ────────────

export function subscribeToDeliveryStatus(
  deliveryId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  void deliveryId;
  void onStatusChange;
  warnNoRealtime('subscribeToDeliveryStatus');
  return () => {};
}

// ─── Client: Subscribe to Food Delivery Status ───────────────

export function subscribeToFoodDeliveryStatus(
  orderId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  void orderId;
  void onStatusChange;
  warnNoRealtime('subscribeToFoodDeliveryStatus');
  return () => {};
}

// ─── Client: Subscribe to Driver Offer Responses ─────────────
// For dispatch engine to detect when a driver accepts/declines.

export function subscribeToOfferResponse(
  rideId: string,
  onOfferUpdate: (driverId: string, status: string) => void,
): () => void {
  void rideId;
  void onOfferUpdate;
  warnNoRealtime('subscribeToOfferResponse');
  return () => {};
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
  void driverId;
  void onNewOffer;
  warnNoRealtime('subscribeToDriverOffers');
  return () => {};
}
