import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { getEmergencyNumber } from '@/lib/localization/emergency-numbers';

/**
 * Rider-side (or guardian/caregiver-side, via booked_by) emergency trigger.
 * Logs the escalation with live location and returns the right local
 * emergency number for the app to offer a one-tap `tel:` call — this app
 * cannot dial or notify dispatch on its own (see emergency-numbers.ts).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { lat, lng, description } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ success: false, error: 'Location required' }, { status: 400 });
    }

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('country_code')
      .eq('id', user.id)
      .maybeSingle();
    const emergencyNumber = getEmergencyNumber(profile?.country_code ?? 'NG');
    const triggeredByRole = ride.booked_by === user.id && ride.rider_id !== user.id ? 'guardian' : 'rider';

    const rows = await query<{ id: string }>(
      `INSERT INTO emergency_escalations
         (ride_id, triggered_by_user_id, triggered_by_role, lat, lng, emergency_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [id, user.id, triggeredByRole, lat, lng, emergencyNumber, description ?? null],
    );

    // Best-effort: notify the rider's own guardian too, if this is a minor's ride.
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       SELECT p.guardian_id, 'safety', 'Emergency alert', 'An emergency alert was triggered during a ride you are monitoring.',
              $2
       FROM profiles p
       WHERE p.id = $1 AND p.guardian_id IS NOT NULL`,
      [ride.rider_id, JSON.stringify({ ride_id: id, lat, lng })],
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      escalationId: rows[0]?.id ?? null,
      emergencyNumber,
      message: `Alert logged. Tap Call to reach emergency services (${emergencyNumber}).`,
    });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to send SOS alert' },
      { status },
    );
  }
}
