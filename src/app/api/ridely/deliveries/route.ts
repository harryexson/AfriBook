import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DELIVERY_TYPE_CONFIG,
  DELIVERY_STATUS_TRANSITIONS,
  type DeliveryType,
} from '@/types/ridely';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
  deliveryType: DeliveryType,
  distanceKm: number,
  durationMin: number,
  surgeMultiplier: number = 1,
) {
  const cfg = DELIVERY_TYPE_CONFIG[deliveryType];
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
    currencyCode: 'XAF',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      deliveryType = 'general',
      pickup,
      pickupAddress,
      destination,
      destinationAddress,
      packageDetails = {},
      paymentType = 'cash',
    } = body;

    if (!customerId || !pickup || !destination) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customerId, pickup, destination' },
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

    if (!DELIVERY_TYPE_CONFIG[deliveryType as DeliveryType]) {
      return NextResponse.json(
        { success: false, error: `Invalid deliveryType: ${deliveryType}` },
        { status: 400 },
      );
    }

    const distanceKm = haversineKm(pickup, destination);
    const durationMin = Math.max(1, Math.round(distanceKm * 3));
    const pricing = estimatePricing(deliveryType as DeliveryType, distanceKm, durationMin);

    const { data: delivery, error } = await supabase
      .from('ridely_deliveries')
      .insert({
        customer_id: customerId,
        delivery_type: deliveryType,
        status: 'requesting',
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickupAddress ?? null,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        destination_address: destinationAddress ?? null,
        package_details: packageDetails,
        distance_km: distanceKm,
        duration_min: durationMin,
        pricing,
        payment_type: paymentType,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create delivery request' },
        { status: 500 },
      );
    }

    Promise.resolve(
      supabase.rpc('ridely_dispatch_delivery' as never, {
        p_delivery_id: delivery.id,
        p_table: 'ridely_deliveries',
      } as never),
    ).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: {
          ...delivery,
          estimatedFare: pricing.estimatedFare,
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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('ridely_deliveries')
      .select('*', { count: 'exact' })
      .eq('customer_id', userId);

    if (status) {
      const allowedStatuses = Object.keys(DELIVERY_STATUS_TRANSITIONS);
      if (!allowedStatuses.includes(status)) {
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
        { success: false, error: 'Failed to fetch deliveries' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deliveries: data,
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
