// ─── Driver Availability ──────────────────────────────────────
// Single source of truth for taking a driver out of / back into
// the dispatch pool. Fixes a real bug: nothing previously reset a
// driver's `status` after a trip finished, so a driver stayed
// `on_trip` forever (never re-entered dispatch) and cancellations
// wrote the non-existent enum value 'available' (driver_status is
// offline | online | busy | on_trip — 'available' was never valid).
//
// Also implements "go offline" as a durable request rather than an
// instantaneous status flip: a driver mid-trip can ask to stop
// receiving new work without interrupting the trip they're already
// on. The request is honoured the moment that trip ends.
// ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export type DriverDbStatus = 'offline' | 'online' | 'busy' | 'on_trip';

interface DriverAvailabilityRow {
  id: string;
  status: DriverDbStatus;
  metadata: Record<string, unknown> | null;
}

/**
 * Explicitly requested by the driver: "stop sending me new requests."
 * If they're idle, this takes effect immediately. If they're mid-trip
 * (on_trip/busy), the current trip is never interrupted — the request
 * is stored and honoured by {@link releaseDriverAfterTrip} once the
 * trip they're already on reaches a terminal state.
 */
export async function requestDriverOffline(
  supabase: AnySupabase,
  driverId: string,
): Promise<{ success: boolean; tookEffectImmediately: boolean; error?: string }> {
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('id, status, metadata')
    .eq('id', driverId)
    .maybeSingle();

  if (error || !driver) {
    return { success: false, tookEffectImmediately: false, error: 'Driver not found' };
  }

  const row = driver as DriverAvailabilityRow;

  if (row.status === 'online') {
    await Promise.all([
      supabase
        .from('drivers')
        .update({
          status: 'offline',
          metadata: { ...(row.metadata ?? {}), pending_offline: false },
        })
        .eq('id', driverId),
      supabase
        .from('driver_online_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('driver_id', driverId)
        .is('ended_at', null),
    ]);
    return { success: true, tookEffectImmediately: true };
  }

  // Mid-trip (on_trip/busy) or already offline: durably record the
  // request. The dispatcher already excludes non-'online' drivers, so
  // this driver simply won't be offered anything new — including a
  // second simultaneous ride while they're out with another rider.
  await supabase
    .from('drivers')
    .update({ metadata: { ...(row.metadata ?? {}), pending_offline: true } })
    .eq('id', driverId);

  return { success: true, tookEffectImmediately: false };
}

/** Driver asks to resume receiving requests (cancels any pending "go offline"). */
export async function requestDriverOnline(
  supabase: AnySupabase,
  driverId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('id, status, metadata')
    .eq('id', driverId)
    .maybeSingle();

  if (error || !driver) {
    return { success: false, error: 'Driver not found' };
  }

  const row = driver as DriverAvailabilityRow;
  const metadata = { ...(row.metadata ?? {}), pending_offline: false };

  if (row.status === 'offline') {
    await Promise.all([
      supabase.from('drivers').update({ status: 'online', metadata }).eq('id', driverId),
      supabase.from('driver_online_sessions').insert({ driver_id: driverId }),
    ]);
  } else {
    // Already on_trip/busy/online: just clear the pending-offline flag
    // so they resume being offered work once free.
    await supabase.from('drivers').update({ metadata }).eq('id', driverId);
  }

  return { success: true };
}

/**
 * Call this whenever a trip (ride, delivery or food delivery) reaches a
 * terminal state (completed/delivered/cancelled) for a driver who was
 * assigned to it. Returns the driver to `online` so they keep receiving
 * requests — UNLESS they asked to go offline while this trip was still
 * running, in which case that request is now honoured.
 */
export async function releaseDriverAfterTrip(
  supabase: AnySupabase,
  driverId: string,
): Promise<void> {
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, status, metadata')
    .eq('id', driverId)
    .maybeSingle();

  if (!driver) return;

  const row = driver as DriverAvailabilityRow;
  const wantsOffline = row.metadata?.pending_offline === true;
  const nextStatus: DriverDbStatus = wantsOffline ? 'offline' : 'online';

  await supabase
    .from('drivers')
    .update({
      status: nextStatus,
      current_trip_id: null,
      metadata: { ...(row.metadata ?? {}), pending_offline: false },
    })
    .eq('id', driverId);

  if (wantsOffline) {
    await supabase
      .from('driver_online_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('driver_id', driverId)
      .is('ended_at', null);
  }
}
