import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';

/** Reveals the ride's verification PIN — rider (or whoever booked it, e.g. a guardian/caregiver) only. Never returned via the general ride GET. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireAuthenticatedUser();

    const rows = await query<{ pin: string | null; rider_id: string; booked_by: string | null }>(
      'SELECT pin, rider_id, booked_by FROM ridely_rides WHERE id = $1',
      [id],
    );
    const ride = rows[0];

    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 });
    }

    if (ride.rider_id !== user.id && ride.booked_by !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, pin: ride.pin });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load PIN' },
      { status },
    );
  }
}
