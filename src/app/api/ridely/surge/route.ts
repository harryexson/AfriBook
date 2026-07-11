import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  RIDE_TYPE_CONFIG,
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

function calculateSurgeMultiplier(activeDrivers: number, activeRequests: number): number {
  if (activeDrivers === 0) return 3.0;
  const ratio = activeRequests / activeDrivers;
  if (ratio <= 0.5) return 1.0;
  if (ratio <= 1.0) return 1.2;
  if (ratio <= 1.5) return 1.5;
  if (ratio <= 2.0) return 2.0;
  if (ratio <= 3.0) return 2.5;
  return 3.0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const rideType = (searchParams.get('rideType') ?? 'economy') as RideType;
    const countryCode = searchParams.get('countryCode');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'lat and lng query parameters are required' },
        { status: 400 },
      );
    }

    if (!RIDE_TYPE_CONFIG[rideType]) {
      return NextResponse.json(
        { success: false, error: `Invalid rideType: ${rideType}` },
        { status: 400 },
      );
    }

    const { data: surgeArea } = await supabase
      .from('ridely_surge_areas')
      .select('multiplier, reason, active')
      .contains('bounds', JSON.stringify([lng, lat]))
      .eq('active', true)
      .maybeSingle();

    if (surgeArea) {
      const cfg = RIDE_TYPE_CONFIG[rideType];
      return NextResponse.json({
        success: true,
        data: {
          multiplier: surgeArea.multiplier,
          reason: surgeArea.reason ?? 'High demand in area',
          activeDrivers: 0,
          activeRequests: 0,
          estimatedFare: {
            baseFare: cfg.baseFare,
            perKmRate: cfg.perKmRate,
            perMinRate: cfg.perMinRate,
            minimumFare: cfg.minimumFare,
            surgeMultiplier: surgeArea.multiplier,
            estimatedFare: Math.round(cfg.baseFare * surgeArea.multiplier),
            currencyCode: 'XAF',
          },
        },
      });
    }

    const searchRadius = 3;
    const { data: nearbyDrivers } = await supabase.rpc(
      'ridely_find_nearby_drivers' as never,
      {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: searchRadius,
        p_vehicle_type: rideType,
      } as never,
    );

    const activeDrivers = nearbyDrivers?.length ?? 0;

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: activeRequests } = await supabase
      .from('ridely_rides')
      .select('id', { count: 'exact', head: true })
      .in('status', ['requesting', 'searching'])
      .gte('created_at', fiveMinAgo);

    const multiplier = calculateSurgeMultiplier(activeDrivers, activeRequests ?? 0);

    const cfg = RIDE_TYPE_CONFIG[rideType];
    const estimatedFare = {
      baseFare: cfg.baseFare,
      perKmRate: cfg.perKmRate,
      perMinRate: cfg.perMinRate,
      minimumFare: cfg.minimumFare,
      surgeMultiplier: multiplier,
      estimatedFare: Math.round(cfg.baseFare * multiplier),
      currencyCode: 'XAF',
    };

    return NextResponse.json({
      success: true,
      data: {
        multiplier,
        reason:
          multiplier > 1
            ? `High demand: ${activeRequests ?? 0} requests for ${activeDrivers} drivers`
            : 'Normal pricing',
        activeDrivers,
        activeRequests: activeRequests ?? 0,
        estimatedFare,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
