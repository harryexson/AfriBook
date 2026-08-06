import { NextRequest, NextResponse } from 'next/server';
import {
  RIDE_TYPE_CONFIG,
  FOOD_DELIVERY_STATUS_TRANSITIONS,
  type RideType,
} from '@/types/ridely';

async function getDb() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient() as any;
}

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
}

function parseWktPoint(location: unknown): { lat: number; lng: number } | null {
  if (!location) return null;
  const str = String(location);
  const match = str.match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
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
      restaurantId,
      items = [],
      destination,
      destinationAddress,
      specialInstructions,
      paymentType = 'cash',
    } = body;

    if (!restaurantId || !items.length || !destination) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: restaurantId, items, destination',
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

    const { data: restaurant, error: restError } = await adminDb
      .from('restaurants')
      .select('id, business_id, businesses!inner(id, name, owner_id, address, location)')
      .eq('id', restaurantId)
      .single();

    const business = (restaurant as { businesses?: Record<string, unknown> } | null)?.businesses as
      | Record<string, unknown>
      | null
      | undefined;

    if (restError || !restaurant || !business) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 },
      );
    }

    const restaurantName = (business.name as string) ?? 'Restaurant';
    const location = parseWktPoint(business.location);
    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Restaurant location not available' },
        { status: 400 },
      );
    }

    const pickup = { lat: location.lat, lng: location.lng };
    const distanceKm = haversineKm(pickup, destination);
    const estimatedPrepTime = Math.max(10, Math.round(items.length * 5));
    const durationMin = Math.max(1, Math.round(distanceKm * 3)) + estimatedPrepTime;
    const pricing = estimatePricing(distanceKm, durationMin);

    const totalItemPrice = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0,
    );
    const deliveryFee = pricing.estimatedFare;
    const tax = 0;
    const total = totalItemPrice + deliveryFee + tax;

    const address = (business.address as { formatted?: string } | null) ?? null;

    const { data: foodDelivery, error } = await supabase
      .from('ridely_food_deliveries')
      .insert({
        customer_id: user.id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        status: 'requesting',
        items: items.map((item: { name: string; quantity: number; price: number; specialInstructions?: string }) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions ?? null,
        })),
        subtotal: totalItemPrice,
        delivery_fee: deliveryFee,
        tax,
        total,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: address?.formatted ?? restaurantName,
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

    const ownerId = business.owner_id as string;
    if (ownerId) {
      Promise.resolve(
        adminDb.from('notifications').insert({
          user_id: ownerId,
          type: 'order',
          title: 'New Food Order',
          body: `New order received with ${items.length} item(s).`,
          data: { food_delivery_id: foodDelivery.id },
        }),
      ).catch(() => {});
    }

    Promise.resolve(
      adminDb.rpc('ridely_dispatch_delivery' as never, {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase.from('ridely_food_deliveries').select('*', { count: 'exact' });

    const restaurantId = searchParams.get('restaurantId');
    if (restaurantId) {
      const { data: owned } = await adminDb
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .eq('id', restaurantId)
        .maybeSingle();
      if (!owned) {
        return NextResponse.json(
          { success: false, error: 'Not authorized for this restaurant' },
          { status: 403 },
        );
      }
      query = query.eq('restaurant_id', restaurantId);
    } else {
      query = query.eq('customer_id', user.id);
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
