import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';

/**
 * Reduces a full street address down to just the street name/number for
 * the driver-facing trip list — never show a rider's full formatted
 * address (unit numbers, landmarks) history to a driver after the trip
 * is over, only enough to recognize where it was.
 */
function toStreetLevel(address: string | null): string {
  if (!address) return 'Unknown location';
  const firstSegment = address.split(',')[0]?.trim();
  return firstSegment || address;
}

async function resolveDriverId(supabase: any, profileId: string): Promise<string | null> {
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return (driver?.id as string | undefined) ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();

    const driverId = await resolveDriverId(supabase, user.id);
    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver profile not found' },
        { status: 404 },
      );
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status'); // 'completed' | 'cancelled' | null (all)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

    let ridesQuery = supabase
      .from('ridely_rides')
      .select(
        'id, status, pickup_address, destination_address, distance_km, duration_min, actual_fare, estimated_fare, rating, tip, requested_at, completed_at, cancelled_at',
      )
      .eq('driver_id', driverId)
      .order('requested_at', { ascending: false })
      .limit(limit);

    let deliveriesQuery = supabase
      .from('ridely_deliveries')
      .select(
        'id, status, pickup_address, destination_address, distance_km, estimated_duration_min, duration_min, actual_fare, estimated_fare, requested_at, delivered_at, cancelled_at',
      )
      .eq('driver_id', driverId)
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (status === 'completed') {
      ridesQuery = ridesQuery.eq('status', 'completed');
      deliveriesQuery = deliveriesQuery.eq('status', 'delivered');
    } else if (status === 'cancelled') {
      ridesQuery = ridesQuery.eq('status', 'cancelled');
      deliveriesQuery = deliveriesQuery.eq('status', 'cancelled');
    }

    const [{ data: rides }, { data: deliveries }] = await Promise.all([
      ridesQuery,
      deliveriesQuery,
    ]);

    const rideTrips = (rides ?? []).map((r: any) => ({
      id: r.id,
      kind: 'ride' as const,
      status: r.status,
      pickup: toStreetLevel(r.pickup_address),
      dropoff: toStreetLevel(r.destination_address),
      distanceKm: Number(r.distance_km ?? 0),
      durationMin: Number(r.duration_min ?? 0),
      earnings: Number(r.actual_fare ?? r.estimated_fare ?? 0),
      rating: r.rating ?? null,
      tip: Number(r.tip ?? 0),
      requestedAt: r.requested_at,
      completedAt: r.completed_at ?? r.cancelled_at ?? null,
    }));

    const deliveryTrips = (deliveries ?? []).map((d: any) => ({
      id: d.id,
      kind: 'delivery' as const,
      status: d.status,
      pickup: toStreetLevel(d.pickup_address),
      dropoff: toStreetLevel(d.destination_address),
      distanceKm: Number(d.distance_km ?? 0),
      durationMin: Number(d.duration_min ?? d.estimated_duration_min ?? 0),
      earnings: Number(d.actual_fare ?? d.estimated_fare ?? 0),
      rating: null,
      tip: 0,
      requestedAt: d.requested_at,
      completedAt: d.delivered_at ?? d.cancelled_at ?? null,
    }));

    const trips = [...rideTrips, ...deliveryTrips].sort(
      (a, b) => new Date(b.requestedAt ?? 0).getTime() - new Date(a.requestedAt ?? 0).getTime(),
    );

    return NextResponse.json({ success: true, trips });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load trips' },
      { status },
    );
  }
}
