import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { requestDriverOffline, requestDriverOnline } from '@/lib/ridely/driver-availability';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveDriverId(supabase: any, profileId: string): Promise<string | null> {
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return (driver?.id as string | undefined) ?? null;
}

// GET /api/driver/status — current online/offline state, including a
// pending "go offline" request that hasn't taken effect yet because a
// trip is still in progress.
export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const driverId = await resolveDriverId(supabase, user.id);
    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const { data: driver } = await supabase
      .from('drivers')
      .select('status, metadata')
      .eq('id', driverId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      status: driver?.status ?? 'offline',
      pendingOffline: (driver?.metadata as Record<string, unknown> | null)?.pending_offline === true,
    });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load status' },
      { status },
    );
  }
}

// POST /api/driver/status { action: 'online' | 'offline' }
//
// 'offline' while idle takes effect immediately. 'offline' mid-trip is
// stored as a pending request and honoured the moment the current trip
// ends — the driver is never interrupted mid-ride, and they receive no
// further requests (not even a second simultaneous ride) once asked.
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const driverId = await resolveDriverId(supabase, user.id);
    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'online' && action !== 'offline') {
      return NextResponse.json({ success: false, error: "action must be 'online' or 'offline'" }, { status: 400 });
    }

    const result = action === 'online'
      ? await requestDriverOnline(supabase, driverId)
      : await requestDriverOffline(supabase, driverId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error ?? 'Failed to update status' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to update status' },
      { status },
    );
  }
}
