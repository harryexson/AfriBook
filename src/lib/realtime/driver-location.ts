// ─── Driver Location Realtime ───────────────────────────────
// Real-time driver location tracking via Supabase Realtime.
// Broadcasts GPS updates to riders during active trips.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { GeoLocation, LocationUpdateEvent } from '@/types/ridely';

// ─── Server: Record Driver Location ──────────────────────────
// Inserts a new GPS sample and returns the channel name for
// clients to subscribe to.

export async function recordDriverLocation(
  driverId: string,
  location: GeoLocation,
  heading: number,
  speed: number,
  accuracy: number,
): Promise<{ channelName: string; h3Index?: string }> {
  const supabase = await createClient();

  const point = {
    type: 'Point' as const,
    coordinates: [location.lng, location.lat],
  };

  // The PostGIS trigger will auto-compute h3_index
  const { data, error } = await supabase
    .from('driver_locations')
    .insert({
      driver_id: driverId,
      location: point,
      heading,
      speed,
      accuracy,
      timestamp: new Date().toISOString(),
    } as any)
    .select('id')
    .single();

  if (error) {
    console.error('[realtime:driver-location] insert error:', error);
    return { channelName: `driver:${driverId}` };
  }

  return {
    channelName: `driver:${driverId}`,
    h3Index: data?.id ? undefined : undefined,
  };
}

// ─── Server: Start Online Session ────────────────────────────

export async function startDriverOnlineSession(
  driverId: string,
  initialLocation: GeoLocation,
): Promise<void> {
  const supabase = await createClient();

  await supabase.rpc('start_driver_session' as any, {
    p_driver_id: driverId,
    p_location: {
      type: 'Point',
      coordinates: [initialLocation.lng, initialLocation.lat],
    },
  } as any);

  await supabase
    .from('drivers')
    .update({ status: 'available' } as any)
    .eq('id', driverId);
}

// ─── Server: End Online Session ──────────────────────────────

export async function endDriverOnlineSession(driverId: string): Promise<void> {
  const supabase = await createClient();

  await supabase.rpc('end_driver_session' as any, {
    p_driver_id: driverId,
  } as any);

  await supabase
    .from('drivers')
    .update({ status: 'offline' } as any)
    .eq('id', driverId);
}

// ─── Client: Subscribe to Driver Location Updates ────────────
// Returns an unsubscribe function.

export function subscribeToDriverLocation(
  driverId: string,
  onUpdate: (event: LocationUpdateEvent) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel(`driver-location:${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_locations',
        filter: `driver_id=eq.${driverId}`,
      },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new as any;
        const coordinates = row.location?.coordinates;
        if (!coordinates) return;

        onUpdate({
          driverId: row.driver_id,
          location: { lat: coordinates[1], lng: coordinates[0] },
          heading: row.heading,
          speed: row.speed,
          accuracy: row.accuracy,
          timestamp: row.timestamp,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Client: Subscribe to Multiple Drivers ───────────────────
// For rider view showing multiple nearby drivers on the map.

export function subscribeToNearbyDrivers(
  driverIds: string[],
  onUpdate: (event: LocationUpdateEvent) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel('nearby-drivers')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_locations',
      },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new as any;
        if (!driverIds.includes(row.driver_id)) return;

        const coordinates = row.location?.coordinates;
        if (!coordinates) return;

        onUpdate({
          driverId: row.driver_id,
          location: { lat: coordinates[1], lng: coordinates[0] },
          heading: row.heading,
          speed: row.speed,
          accuracy: row.accuracy,
          timestamp: row.timestamp,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
