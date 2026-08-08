import { NextRequest, NextResponse } from 'next/server';
import {
  RideType,
  RIDE_TYPE_CONFIG,
  RIDE_STATUS_TRANSITIONS,
  type RidePricing,
} from '@/types/ridely';
import { getCurrencyForCountry } from '@/lib/money';

async function getDb() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient() as any;
}

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
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

function estimatePricing(
  rideType: RideType,
  distanceKm: number,
  durationMin: number,
  surgeMultiplier: number = 1,
  countryCode: string = 'NG',
): RidePricing {
  const cfg = RIDE_TYPE_CONFIG[rideType];
  const baseFare = cfg.baseFare;
  const distanceFare = distanceKm * cfg.perKmRate;
  const timeFare = durationMin * cfg.perMinRate;
  const raw = baseFare + distanceFare + timeFare;
  const estimatedFare = Math.max(cfg.minimumFare, Math.round(raw * surgeMultiplier));

  return {
    baseFare,
    perKmRate: cfg.perKmRate,
    perMinRate: cfg.perMinRate,
    minimumFare: cfg.minimumFare,
    surgeMultiplier,
    estimatedFare,
    currencyCode: getCurrencyForCountry(countryCode),
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getDb();
    const adminDb = await getAdminDb();

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
    } = body;

    if (!pickup || !destination) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: pickup, destination' },
        { status: 400 },
      );
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

    const { data: surgeMultiplier } = await adminDb.rpc(
      'get_surge_multiplier' as never,
      { p_lat: pickup.lat, p_lng: pickup.lng } as never,
    );

    const multiplier = (surgeMultiplier as number | null) ?? 1;
    const country = typeof countryCode === 'string' && countryCode ? countryCode : 'NG';
    const pricing = estimatePricing(rideType as RideType, distanceKm, durationMin, multiplier, country);

    const { data: ride, error } = await supabase
      .from('ridely_rides')
      .insert({
        rider_id: user.id,
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
      adminDb.rpc('ridely_dispatch' as never, {
        p_ride_id: ride.id,
      } as never),
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
