import { NextRequest, NextResponse } from 'next/server';
import {
  RideType,
  RIDE_TYPE_CONFIG,
  RIDE_STATUS_TRANSITIONS,
  type RidePricing,
} from '@/types/ridely';
import { estimateRideFare } from '@/lib/ridely/ride-pricing';

async function getDb() {
  const { createClient } = await import('@/lib/neon/server');
  return createClient() as any;
}

async function getAdminQuery() {
  const { query } = await import('@/lib/neon/admin');
  return query;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinHalfLng * sinHalfLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** 4-digit ride verification PIN — the rider reads it to the driver, or the driver asks for it, before the trip starts. Same safety pattern Uber uses in higher-risk markets. */
function generateRidePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function estimatePricing(
  rideType: RideType,
  distanceKm: number,
  durationMin: number,
  surgeMultiplier: number = 1,
  countryCode: string = 'NG',
): RidePricing {
  return estimateRideFare(rideType, distanceKm, durationMin, countryCode, surgeMultiplier);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getDb();
    const adminQuery = await getAdminQuery();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      rideType = 'economy',
      pickup,
      pickupAddress,
      destination,
      destinationAddress,
      paymentType = 'cash',
      countryCode,
      /** Set when a caregiver/organization is booking on behalf of a managed rider (minor, elderly, disabled, or otherwise vulnerable person in their care). */
      riderId,
    } = body;

    if (!pickup || !destination) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: pickup, destination' },
        { status: 400 },
      );
    }

    let effectiveRiderId = user.id;
    let bookedBy: string | null = null;
    if (riderId && riderId !== user.id) {
      const dependentRows = await adminQuery<{ guardian_id: string | null }>(
        'SELECT guardian_id FROM profiles WHERE id = $1',
        [riderId],
      );
      if (dependentRows[0]?.guardian_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'You are not authorized to book rides for this person' },
          { status: 403 },
        );
      }
      effectiveRiderId = riderId;
      bookedBy = user.id;
    }

    if (
      typeof pickup.lat !== 'number' ||
      typeof pickup.lng !== 'number' ||
      typeof destination.lat !== 'number' ||
      typeof destination.lng !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: 'pickup and destination must have numeric lat/lng' },
        { status: 400 },
      );
    }

    if (!RIDE_TYPE_CONFIG[rideType as RideType]) {
      return NextResponse.json(
        { success: false, error: `Invalid rideType: ${rideType}` },
        { status: 400 },
      );
    }

    const distanceKm = haversineKm(pickup, destination);
    const durationMin = Math.max(1, Math.round(distanceKm * 2.5));

    const surgeRows = await adminQuery<{ multiplier: number | null }>(
      'SELECT get_surge_multiplier($1, $2) AS multiplier',
      [pickup.lat, pickup.lng],
    );

    const multiplier = surgeRows[0]?.multiplier ?? 1;
    const country = typeof countryCode === 'string' && countryCode ? countryCode : 'NG';
    const pricing = estimatePricing(rideType as RideType, distanceKm, durationMin, multiplier, country);

    const { data: ride, error } = await supabase
      .from('ridely_rides')
      .insert({
        rider_id: effectiveRiderId,
        booked_by: bookedBy,
        ride_type: rideType,
        status: 'requesting',
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickupAddress ?? null,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        destination_address: destinationAddress ?? null,
        distance_km: distanceKm,
        duration_min: durationMin,
        pricing,
        payment_type: paymentType,
        pin: generateRidePin(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create ride request' },
        { status: 500 },
      );
    }

    Promise.resolve(
      adminQuery('SELECT ridely_dispatch($1)', [ride.id]),
    ).catch(() => {});

    // Safety: any rider with a linked guardian/caregiver — a minor, an
    // elderly or disabled person, or anyone else an organization is
    // monitoring — gets an auto-created, no-login tracking link sent
    // straight to whoever is responsible for them. Covers both cases: the
    // rider booking their own trip, and a caregiver booking it for them
    // (bookedBy is already known in that case, so we skip the extra lookup).
    Promise.resolve(
      (async () => {
        const { randomBytes } = await import('crypto');

        let guardianId = bookedBy;
        if (!guardianId) {
          const profileRows = await adminQuery<{ guardian_id: string | null }>(
            'SELECT guardian_id FROM profiles WHERE id = $1',
            [effectiveRiderId],
          );
          guardianId = profileRows[0]?.guardian_id ?? null;
        }
        if (!guardianId) return;

        const token = randomBytes(16).toString('base64url');
        await adminQuery(
          `INSERT INTO ride_safety_shares (ride_id, share_token, created_by, auto_created, expires_at)
           VALUES ($1, $2, $3, true, now() + interval '6 hours')`,
          [ride.id, token, user.id],
        );
        await adminQuery(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, 'safety', 'Trip started', $2, $3)`,
          [
            guardianId,
            'The rider you monitor just started a trip. Tap to track it live.',
            JSON.stringify({ ride_id: ride.id, track_url: `/track/${token}` }),
          ],
        );
      })(),
    ).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: {
          ...ride,
          estimatedFare: pricing.estimatedFare,
          surgeMultiplier: multiplier,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await getDb();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('ridely_rides')
      .select('*', { count: 'exact' })
      .eq('rider_id', user.id);

    if (status) {
      if (!RIDE_STATUS_TRANSITIONS[status as keyof typeof RIDE_STATUS_TRANSITIONS] && status !== 'requesting') {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${status}` },
          { status: 400 },
        );
      }
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rides' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        rides: data,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
