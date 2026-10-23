// ─── Ride Status Polling ─────────────────────────────────────
// Real-time ride/delivery status tracking via polling.
//
// Neon has no Supabase Realtime equivalent (no channel()/postgres_changes).
// These functions subscribe to status changes by polling REST endpoints at
// a fixed interval — serverless-compatible, zero new dependencies.
//
// Poll interval: 4 s for active rides (low latency needed), 8 s for
// offers (driver sees new offers within one interval).
// ──────────────────────────────────────────────────────────────

import type { RideStatusEvent } from '@/types/ridely';

const RIDE_POLL_INTERVAL_MS = 4_000;
const OFFER_POLL_INTERVAL_MS = 8_000;

// ─── Client: Subscribe to Ride Status Changes ────────────────

export function subscribeToRideStatus(
  rideId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  let lastStatus: string | null = null;
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/ridely/status/${rideId}?type=ride`);
      if (res.ok) {
        const data = await res.json();
        if (data.status && data.status !== lastStatus) {
          lastStatus = data.status;
          onStatusChange({ rideId, status: data.status, driverId: data.driver_id, timestamp: data.updated_at });
        }
      }
    } catch { /* network errors are silent — caller sees no update */ }
  };

  poll();
  const timer = setInterval(poll, RIDE_POLL_INTERVAL_MS);

  return () => {
    active = false;
    clearInterval(timer);
  };
}

// ─── Client: Subscribe to Delivery Status Changes ────────────

export function subscribeToDeliveryStatus(
  deliveryId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  let lastStatus: string | null = null;
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/ridely/status/${deliveryId}?type=delivery`);
      if (res.ok) {
        const data = await res.json();
        if (data.status && data.status !== lastStatus) {
          lastStatus = data.status;
          onStatusChange({ rideId: deliveryId, status: data.status, driverId: data.driver_id, timestamp: data.updated_at });
        }
      }
    } catch { /* silent */ }
  };

  poll();
  const timer = setInterval(poll, RIDE_POLL_INTERVAL_MS);

  return () => {
    active = false;
    clearInterval(timer);
  };
}

// ─── Client: Subscribe to Food Delivery Status ───────────────

export function subscribeToFoodDeliveryStatus(
  orderId: string,
  onStatusChange: (event: RideStatusEvent) => void,
): () => void {
  let lastStatus: string | null = null;
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/ridely/status/${orderId}?type=food`);
      if (res.ok) {
        const data = await res.json();
        if (data.status && data.status !== lastStatus) {
          lastStatus = data.status;
          onStatusChange({ rideId: orderId, status: data.status, driverId: data.driver_id, timestamp: data.updated_at });
        }
      }
    } catch { /* silent */ }
  };

  poll();
  const timer = setInterval(poll, RIDE_POLL_INTERVAL_MS);

  return () => {
    active = false;
    clearInterval(timer);
  };
}

// ─── Client: Subscribe to Driver Offer Responses ─────────────

export function subscribeToOfferResponse(
  rideId: string,
  onOfferUpdate: (driverId: string, status: string) => void,
): () => void {
  let lastDriverId: string | null = null;
  let lastStatus: string | null = null;
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/ridely/status/${rideId}?type=ride`);
      if (res.ok) {
        const data = await res.json();
        if (data.driver_id !== lastDriverId || data.status !== lastStatus) {
          lastDriverId = data.driver_id;
          lastStatus = data.status;
          if (data.driver_id) {
            onOfferUpdate(data.driver_id, data.status);
          }
        }
      }
    } catch { /* silent */ }
  };

  poll();
  const timer = setInterval(poll, OFFER_POLL_INTERVAL_MS);

  return () => {
    active = false;
    clearInterval(timer);
  };
}

// ─── Client: Subscribe to New Incoming Offers (driver side) ──

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
  const seenOfferIds = new Set<string>();
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch('/api/driver/offers/pending');
      if (res.ok) {
        const data = await res.json();
        for (const offer of data.offers ?? []) {
          if (!seenOfferIds.has(offer.offerId)) {
            seenOfferIds.add(offer.offerId);
            onNewOffer(offer as DriverOfferEvent);
          }
        }
      }
    } catch { /* silent */ }
  };

  void driverId; // driverId resolved server-side from session; kept in signature for API compatibility
  poll();
  const timer = setInterval(poll, OFFER_POLL_INTERVAL_MS);

  return () => {
    active = false;
    clearInterval(timer);
  };
}
