import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, createClient } from '@/lib/neon/server';

export async function GET(_req: NextRequest) {
  const { user } = await requireAuthenticatedUser();

  const db = await createClient();

  const { data: driver, error: driverErr } = await (db.from('drivers') as any)
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (driverErr || !driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }

  const { data: offers, error } = await (db.from('driver_offers') as any)
    .select(
      'id, ride_id, status, expires_at, ridely_rides(pickup_address, destination_address, distance_km, estimated_duration_min, estimated_fare, ride_type)',
    )
    .eq('driver_id', driver.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }

  const result = (offers ?? []).map((o: any) => ({
    offerId: o.id,
    rideId: o.ride_id,
    pickupAddress: o.ridely_rides?.pickup_address ?? null,
    destinationAddress: o.ridely_rides?.destination_address ?? null,
    distanceKm: o.ridely_rides?.distance_km ?? null,
    estimatedDurationMin: o.ridely_rides?.estimated_duration_min ?? null,
    estimatedEarnings: o.ridely_rides?.estimated_fare ?? null,
    rideType: o.ridely_rides?.ride_type ?? 'standard',
    expiresAt: o.expires_at,
  }));

  return NextResponse.json({ offers: result });
}
