// ─── Driver Location Realtime ───────────────────────────────
// Real-time driver location tracking via Supabase Realtime.
// Broadcasts GPS updates to riders during active trips.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/neon/server';
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

  // NOTE: `start_driver_session(p_driver_id uuid)` only accepts the driver
  // id (verified via pg_get_function_identity_arguments) — the original
  // code also passed `p_location`, an argument the function doesn't
  // declare, which would fail the RPC call. Dropped here; if the initial
  // location needs to reach the function it needs its own signature change
  // (out of scope for this migration).
  await supabase.rpc('start_driver_session' as any, {
    p_driver_id: driverId,
  } as any);

  // `driver_status` enum has no `'available'` value (only offline, online,
  // busy, on_trip, pending_review) — the original code's `'available'` was
  // an invalid enum value that would error. Using `'online'`, the closest
  // valid value.
  await supabase
    .from('drivers')
    .update({ status: 'online' } as any)
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
//
// NOTE (Neon migration gap): the original implementation subscribed to
// Supabase Realtime (`.channel().on('postgres_changes', ...)`) for live
// INSERT notifications on `driver_locations`. `@/lib/neon/client` (the
// Neon-backed browser client, via SupabaseAuthAdapter + Data API) has no
// realtime/channel primitive — confirmed during the ridely migration
// (see src/lib/ridely/dispatch-engine.ts) and true here too. There is no
// documented Neon equivalent as of this migration.
//
// Unlike dispatch-engine.ts's blocking waits (which had a natural
// polling substitution), this is a push-style UI subscription with no
// deadline to poll against, so it is left broken rather than silently
// turned into an unbounded polling loop from client code. Callers of
// `subscribeToDriverLocation`/`subscribeToNearbyDrivers` currently
// receive no updates — flagged as a follow-up (e.g. a polling hook on an
// interval, or a real realtime channel once Neon exposes one).

export function subscribeToDriverLocation(
  driverId: string,
  onUpdate: (event: LocationUpdateEvent) => void,
): () => void {
  void driverId;
  void onUpdate;
  console.warn(
    '[realtime:driver-location] subscribeToDriverLocation is a no-op: ' +
      'Neon has no Supabase-Realtime equivalent (no channel()/postgres_changes). ' +
      'See NOTE above driver-location.ts subscribe functions.',
  );
  return () => {};
}

// ─── Client: Subscribe to Multiple Drivers ───────────────────
// For rider view showing multiple nearby drivers on the map.
//
// Same Neon Realtime gap as subscribeToDriverLocation above — no-op.

export function subscribeToNearbyDrivers(
  driverIds: string[],
  onUpdate: (event: LocationUpdateEvent) => void,
): () => void {
  void driverIds;
  void onUpdate;
  console.warn(
    '[realtime:driver-location] subscribeToNearbyDrivers is a no-op: ' +
      'Neon has no Supabase-Realtime equivalent (no channel()/postgres_changes). ' +
      'See NOTE above driver-location.ts subscribe functions.',
  );
  return () => {};
}
