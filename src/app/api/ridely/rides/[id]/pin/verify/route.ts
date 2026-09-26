import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';

/** Driver enters what the rider told them; we check the match without ever exposing the real PIN back to the driver. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const submitted = typeof body?.pin === 'string' ? body.pin.trim() : '';

    if (!/^\d{4}$/.test(submitted)) {
      return NextResponse.json({ success: false, error: 'Enter the 4-digit PIN' }, { status: 400 });
    }

    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const rows = await query<{ pin: string | null; driver_id: string | null }>(
      'SELECT pin, driver_id FROM ridely_rides WHERE id = $1',
      [id],
    );
    const ride = rows[0];

    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 });
    }
    if (ride.driver_id !== driver.id) {
      return NextResponse.json({ success: false, error: 'You are not assigned to this ride' }, { status: 403 });
    }

    const matched = Boolean(ride.pin) && ride.pin === submitted;

    if (matched) {
      await query('UPDATE ridely_rides SET pin_verified_at = now() WHERE id = $1', [id]);
    }

    return NextResponse.json({ success: true, matched });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to verify PIN' },
      { status },
    );
  }
}
