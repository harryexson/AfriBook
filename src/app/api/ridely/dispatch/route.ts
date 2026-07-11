import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MAX_SEARCH_RADIUS_KM = 15;
const INITIAL_SEARCH_RADIUS_KM = 5;
const RADIUS_EXPANSION_KM = 2.5;

interface DispatchCandidate {
  driver_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  rating: number;
  total_trips: number;
  lat: number;
  lng: number;
  distance_km: number;
  score: number;
}

function rankCandidates(candidates: DispatchCandidate[]): DispatchCandidate[] {
  return candidates
    .map((c) => {
      const distanceScore = Math.max(0, 1 - c.distance_km / 15);
      const ratingScore = (c.rating ?? 4) / 5;
      const experienceScore = Math.min(c.total_trips / 1000, 1);
      c.score = distanceScore * 0.5 + ratingScore * 0.3 + experienceScore * 0.2;
      return c;
    })
    .sort((a, b) => b.score - a.score);
}

async function dispatchRide(requestId: string) {
  const { data: ride, error: rideError } = await supabase
    .from('ridely_rides')
    .select('id, pickup_lat, pickup_lng, ride_type, rider_id, status')
    .eq('id', requestId)
    .single();

  if (rideError || !ride) {
    return { dispatched: false, status: 'no_drivers' as const, searchRadius: 0, candidatesConsidered: 0 };
  }

  if (ride.status !== 'requesting' && ride.status !== 'searching') {
    return { dispatched: false, status: 'searching' as const, searchRadius: 0, candidatesConsidered: 0 };
  }

  await supabase
    .from('ridely_rides')
    .update({ status: 'searching', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  let searchRadius = INITIAL_SEARCH_RADIUS_KM;
  let candidates: DispatchCandidate[] = [];

  while (searchRadius <= MAX_SEARCH_RADIUS_KM) {
    const { data: nearbyDrivers } = await supabase.rpc(
      'ridely_find_nearby_drivers' as never,
      {
        p_lat: ride.pickup_lat,
        p_lng: ride.pickup_lng,
        p_radius_km: searchRadius,
        p_vehicle_type: ride.ride_type,
      } as never,
    );

    if (nearbyDrivers && nearbyDrivers.length > 0) {
      candidates = nearbyDrivers as unknown as DispatchCandidate[];
      break;
    }

    searchRadius += RADIUS_EXPANSION_KM;
  }

  if (candidates.length === 0) {
    return { dispatched: false, status: 'no_drivers' as const, searchRadius, candidatesConsidered: 0 };
  }

  const ranked = rankCandidates(candidates);
  const best = ranked[0];

  const { error: acceptError } = await supabase
    .from('ridely_rides')
    .update({
      driver_id: best.driver_id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (acceptError) {
    return { dispatched: false, status: 'searching' as const, searchRadius, candidatesConsidered: candidates.length };
  }

  await supabase
    .from('drivers')
    .update({ status: 'on_trip', current_trip_id: requestId })
    .eq('id', best.driver_id);

  await supabase.from('notifications').insert({
    user_id: ride.rider_id,
    type: 'system',
    title: 'Driver Found!',
    body: `${best.name} has been assigned to your ride.`,
    data: { ride_id: requestId, driver_id: best.driver_id },
  });

  return {
    dispatched: true,
    assignedDriverId: best.driver_id,
    status: 'assigned' as const,
    searchRadius,
    candidatesConsidered: candidates.length,
  };
}

async function dispatchDelivery(requestId: string, table: string) {
  const { data: delivery, error: fetchError } = await supabase
    .from(table)
    .select('id, pickup_lat, pickup_lng, delivery_type, customer_id, status')
    .eq('id', requestId)
    .single();

  if (fetchError || !delivery) {
    return { dispatched: false, status: 'no_drivers' as const, searchRadius: 0, candidatesConsidered: 0 };
  }

  if (delivery.status !== 'requesting' && delivery.status !== 'searching') {
    return { dispatched: false, status: 'searching' as const, searchRadius: 0, candidatesConsidered: 0 };
  }

  await supabase
    .from(table)
    .update({ status: 'searching', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  const { data: nearbyDrivers } = await supabase.rpc(
    'ridely_find_nearby_drivers' as never,
    {
      p_lat: delivery.pickup_lat,
      p_lng: delivery.pickup_lng,
      p_radius_km: 10,
      p_vehicle_type: null,
    } as never,
  );

  if (!nearbyDrivers || nearbyDrivers.length === 0) {
    return { dispatched: false, status: 'no_drivers' as const, searchRadius: 10, candidatesConsidered: 0 };
  }

  const candidates = nearbyDrivers as unknown as DispatchCandidate[];
  const ranked = rankCandidates(candidates);
  const best = ranked[0];

  await supabase
    .from(table)
    .update({
      driver_id: best.driver_id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  await supabase
    .from('drivers')
    .update({ status: 'on_trip', current_trip_id: requestId })
    .eq('id', best.driver_id);

  await supabase.from('notifications').insert({
    user_id: delivery.customer_id,
    type: 'system',
    title: 'Driver Found!',
    body: `${best.name} has been assigned to your delivery.`,
    data: { delivery_id: requestId, driver_id: best.driver_id },
  });

  return {
    dispatched: true,
    assignedDriverId: best.driver_id,
    status: 'assigned' as const,
    searchRadius: 10,
    candidatesConsidered: candidates.length,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, requestId } = body;

    if (!type || !requestId) {
      return NextResponse.json(
        { success: false, error: 'type and requestId are required' },
        { status: 400 },
      );
    }

    if (!['ride', 'delivery', 'food_delivery'].includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid dispatch type: ${type}` },
        { status: 400 },
      );
    }

    let result;

    switch (type) {
      case 'ride':
        result = await dispatchRide(requestId);
        break;
      case 'delivery':
        result = await dispatchDelivery(requestId, 'ridely_deliveries');
        break;
      case 'food_delivery':
        result = await dispatchDelivery(requestId, 'ridely_food_deliveries');
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unhandled dispatch type' },
          { status: 500 },
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
