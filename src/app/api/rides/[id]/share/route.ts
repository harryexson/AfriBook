import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';

const SHARE_TTL_HOURS = 6;

function generateToken(): string {
  return randomBytes(16).toString('base64url');
}

/** Creates a no-login-required live-tracking link for this ride — for a guardian, caregiver, or anyone the rider wants to share their trip with. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireAuthenticatedUser();

    const rideRows = await query<{ id: string; rider_id: string; booked_by: string | null }>(
      'SELECT id, rider_id, booked_by FROM ridely_rides WHERE id = $1',
      [id],
    );
    const ride = rideRows[0];
    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 });
    }
    if (ride.rider_id !== user.id && ride.booked_by !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const token = generateToken();
    await query(
      `INSERT INTO ride_safety_shares (ride_id, share_token, created_by, expires_at)
       VALUES ($1, $2, $3, now() + interval '${SHARE_TTL_HOURS} hours')`,
      [id, token, user.id],
    );

    return NextResponse.json({
      success: true,
      token,
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/track/${token}`,
      expiresInHours: SHARE_TTL_HOURS,
    });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to create share link' },
      { status },
    );
  }
}
