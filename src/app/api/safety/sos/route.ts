import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';
import { handleSOSAlert } from '@/lib/pickup/safety-manager';
import { getEmergencyNumber } from '@/lib/localization/emergency-numbers';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { lat, lng, rideId, deliveryId, description } = body;

  if (lat === undefined || lng === undefined) {
    return NextResponse.json({ error: 'Location required' }, { status: 400 });
  }

  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('profile_id', user.id)
    .single() as unknown as { data: { id: string } | null };

  if (!driver) {
    return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
  }

  const result = await handleSOSAlert({
    driverId: driver.id,
    location: { lat, lng },
    rideId,
    deliveryId,
    description,
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('country_code')
    .eq('id', user.id)
    .maybeSingle();
  const emergencyNumber = getEmergencyNumber(profile?.country_code ?? 'NG');

  await query(
    `INSERT INTO emergency_escalations
       (ride_id, delivery_id, triggered_by_user_id, triggered_by_role, lat, lng, emergency_number, notes)
     VALUES ($1, $2, $3, 'driver', $4, $5, $6, $7)`,
    [rideId ?? null, deliveryId ?? null, user.id, lat, lng, emergencyNumber, description ?? null],
  ).catch(() => {
    // The driver-safety-events record above is the primary log; this is a
    // secondary cross-role log and must never block the SOS response itself.
  });

  return NextResponse.json({ ...result, emergencyNumber });
}
