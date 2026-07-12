// ─── useRide Hook ────────────────────────────────────────────
// Ride request lifecycle management for the mobile app.
// Handles creating rides, tracking status, and driver matching.
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtime } from './useRealtime';
import { useLocation } from './useLocation';

interface RideRequest {
  pickup: { lat: number; lng: number };
  pickupAddress: string;
  destination: { lat: number; lng: number };
  destinationAddress: string;
  rideType: string;
  paymentType: string;
}

interface RideState {
  rideId: string | null;
  status: string;
  driverId: string | null;
  driverName: string | null;
  driverRating: number | null;
  vehicleInfo: string | null;
  etaMinutes: number | null;
  estimatedFare: number | null;
  currencyCode: string | null;
  routePolyline: string | null;
}

interface UseRideReturn {
  /** Current ride state. */
  ride: RideState;
  /** Whether a ride is in progress. */
  isActive: boolean;
  /** Error message. */
  error: string | null;
  /** Loading state. */
  isLoading: boolean;
  /** Request a new ride. */
  requestRide: (request: RideRequest) => Promise<string | null>;
  /** Cancel the current ride. */
  cancelRide: (reason?: string) => Promise<void>;
  /** Rate the completed ride. */
  rateRide: (rating: number, review?: string) => Promise<void>;
}

const INITIAL_RIDE_STATE: RideState = {
  rideId: null,
  status: 'idle',
  driverId: null,
  driverName: null,
  driverRating: null,
  vehicleInfo: null,
  etaMinutes: null,
  estimatedFare: null,
  currencyCode: null,
  routePolyline: null,
};

export function useRide(): UseRideReturn {
  const [ride, setRide] = useState<RideState>(INITIAL_RIDE_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rideIdRef = useRef<string | null>(null);

  // Subscribe to ride status changes
  const { payload: statusPayload } = useRealtime({
    table: 'ridely_rides',
    filter: rideIdRef.current ? `id=eq.${rideIdRef.current}` : undefined,
    event: 'UPDATE',
    enabled: !!rideIdRef.current,
  });

  // Subscribe to driver offers
  const { payload: offerPayload } = useRealtime({
    table: 'driver_offers',
    filter: rideIdRef.current ? `ride_id=eq.${rideIdRef.current}` : undefined,
    event: 'UPDATE',
    enabled: !!rideIdRef.current,
  });

  // Handle ride status changes
  useEffect(() => {
    if (!statusPayload?.new) return;
    const row = statusPayload.new as any;

    setRide((prev) => ({
      ...prev,
      status: row.status,
      driverId: row.driver_id ?? prev.driverId,
      routePolyline: row.route_polyline ?? prev.routePolyline,
    }));
  }, [statusPayload]);

  // Handle driver acceptance
  useEffect(() => {
    if (!offerPayload?.new) return;
    const row = offerPayload.new as any;

    if (row.status === 'accepted') {
      setRide((prev) => ({
        ...prev,
        driverId: row.driver_id,
        status: 'matched',
      }));
    }
  }, [offerPayload]);

  const requestRide = useCallback(async (request: RideRequest): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ridely/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to create ride');
      }

      const { ride: newRide } = await response.json();
      rideIdRef.current = newRide.id;

      setRide({
        rideId: newRide.id,
        status: newRide.status,
        driverId: newRide.driverId ?? null,
        driverName: newRide.driverName ?? null,
        driverRating: newRide.driverRating ?? null,
        vehicleInfo: newRide.vehicleInfo ?? null,
        etaMinutes: newRide.etaMinutes ?? null,
        estimatedFare: newRide.pricing?.estimatedFare ?? null,
        currencyCode: newRide.pricing?.currencyCode ?? null,
        routePolyline: newRide.routePolyline ?? null,
      });

      return newRide.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request ride');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelRide = useCallback(async (reason?: string): Promise<void> => {
    if (!rideIdRef.current) return;

    try {
      setIsLoading(true);
      await fetch(`/api/ridely/rides/${rideIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancelReason: reason ?? 'Rider cancelled',
        }),
      });

      setRide(INITIAL_RIDE_STATE);
      rideIdRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel ride');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rateRide = useCallback(async (rating: number, review?: string): Promise<void> => {
    if (!rideIdRef.current) return;

    try {
      setIsLoading(true);
      await fetch(`/api/ridely/rides/${rideIdRef.current}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review }),
      });

      setRide(INITIAL_RIDE_STATE);
      rideIdRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rate ride');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    ride,
    isActive: ride.status !== 'idle' && ride.status !== 'completed' && ride.status !== 'cancelled',
    error,
    isLoading,
    requestRide,
    cancelRide,
    rateRide,
  };
}
