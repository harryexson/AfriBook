import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  RIDE_TYPE_CONFIG,
  FOOD_DELIVERY_STATUS_TRANSITIONS,
  type RideType,
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

function estimatePricing(distanceKm: number, durationMin: number) {
  const baseFare = 800;
  const perKmRate = 180;
  const perMinRate = 55;
  const minimumFare = 1200;
  const raw = baseFare + distanceKm * perKmRate + durationMin * perMinRate;
  const estimatedFare = Math.max(minimumFare, Math.round(raw));

  return {
    baseFare,
    perKmRate,
    perMinRate,
    minimumFare,
    surgeMultiplier: 1,
    estimatedFare,
    currencyCode: 'XAF',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      restaurantId,
      items = [],
      destination,
      destinationAddress,
      specialInstructions,
      paymentType = 'cash',
    } = body;

    if (!customerId || !restaurantId || !items.length || !destination) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: customerId, restaurantId, items, destination',
        },
        { status: 400 },
      );
    }

    if (typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      return NextResponse.json(
        { success: false, error: 'destination must have numeric lat/lng' },
        { status: 400 },
      );
    }

    const { data: restaurant, error: restError } = await supabase
      .from('businesses')
      .select('id, name, address, location')
      .eq('id', restaurantId)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 },
      );
    }

    const restaurantLoc = restaurant.location as { latitude?: number; longitude?: number } | null;
    const pickupLat = restaurantLoc?.latitude ?? (restaurant as unknown as Record<string, unknown>).pickup_lat as number ?? 0;
    const pickupLng = restaurantLoc?.longitude ?? (restaurant as unknown as Record<string, unknown>).pickup_lng as number ?? 0;

    if (!pickupLat || !pickupLng) {
      return NextResponse.json(
        { success: false, error: 'Restaurant location not available' },
        { status: 400 },
      );
    }

    const pickup = { lat: pickupLat, lng: pickupLng };
    const distanceKm = haversineKm(pickup, destination);
    const estimatedPrepTime = Math.max(10, Math.round(items.length * 5));
    const durationMin = Math.max(1, Math.round(distanceKm * 3)) + estimatedPrepTime;
    const pricing = estimatePricing(distanceKm, durationMin);

    const totalItemPrice = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0,
    );

    const { data: foodDelivery, error } = await supabase
      .from('ridely_food_deliveries')
      .insert({
        customer_id: customerId,
        restaurant_id: restaurantId,
        status: 'requesting',
        items: items.map((item: { name: string; quantity: number; price: number; specialInstructions?: string }) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions ?? null,
        })),
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: restaurant.address?.formatted ?? restaurant.name ?? null,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        destination_address: destinationAddress ?? null,
        distance_km: distanceKm,
        duration_min: durationMin,
        estimated_prep_time: estimatedPrepTime,
        pricing,
        payment_type: paymentType,
        special_instructions: specialInstructions ?? null,
        item_total: totalItemPrice,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create food delivery' },
        { status: 500 },
      );
    }

    Promise.resolve(
      supabase.from('notifications').insert({
        user_id: restaurantId,
        type: 'order',
        title: 'New Food Order',
        body: `New order received with ${items.length} item(s).`,
        data: { food_delivery_id: foodDelivery.id },
      }),
    ).catch(() => {});

    Promise.resolve(
      supabase.rpc('ridely_dispatch_delivery' as never, {
        p_delivery_id: foodDelivery.id,
        p_table: 'ridely_food_deliveries',
      } as never),
    ).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: {
          ...foodDelivery,
          estimatedFare: pricing.estimatedFare,
          totalItemPrice,
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
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    if (!userId && !restaurantId) {
      return NextResponse.json(
        { success: false, error: 'userId or restaurantId query parameter is required' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('ridely_food_deliveries')
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('customer_id', userId);
    }
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    if (status) {
      const allowedStatuses = Object.keys(FOOD_DELIVERY_STATUS_TRANSITIONS);
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
        { success: false, error: 'Failed to fetch food deliveries' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        foodDeliveries: data,
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
