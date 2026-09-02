import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { resolveDriverId } from '@/lib/ridely/driver-auth';

// Reads/writes `drivers.status` (the driver_status enum: offline/online/
// busy/on_trip) via the `start_driver_session` / `end_driver_session` RPCs
// that already exist in migration 006 — those also keep the
// `driver_online_sessions` table in sync, which a raw UPDATE would not.
// This was the missing piece behind "Go Online" on the driver dashboard:
// previously it only flipped local React state, so the dispatch engine's
// `find_nearby_drivers_h3` query (which requires status = 'online' AND
// is_available = true) could never actually see the driver as eligible.

export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const driverId = await resolveDriverId(supabase, user.id);

    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('status')
      .eq('id', driverId)
      .single();

    if (error || !driver) {
      return NextResponse.json({ success: false, error: 'Failed to load driver status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      driverId,
      isOnline: (driver as any).status === 'online',
    });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load driver status' },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const driverId = await resolveDriverId(supabase, user.id);

    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const online = Boolean(body?.online);

    const { error } = await (supabase.rpc as any)(
      online ? 'start_driver_session' : 'end_driver_session',
      { p_driver_id: driverId },
    );

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to update driver status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, driverId, isOnline: online });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to update driver status' },
      { status },
    );
  }
}
