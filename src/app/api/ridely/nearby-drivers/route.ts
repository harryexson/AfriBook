import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';

function estimateEta(distanceKm: number): number {
  const avgSpeedKmh = 25;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

interface NearbyDriverRow {
  driver_id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  rating: number;
  total_trips: number;
  lat: number;
  lng: number;
  distance_km: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const radiusKm = Math.min(25, Math.max(0.5, parseFloat(searchParams.get('radiusKm') ?? '10')));
    const vehicleType = searchParams.get('vehicleType') || null;
    const countryCode = searchParams.get('countryCode') || null;

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'lat and lng query parameters are required' },
        { status: 400 },
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates' },
        { status: 400 },
      );
    }

    let rows: NearbyDriverRow[];
    try {
      rows = await query<NearbyDriverRow>(
        'SELECT * FROM ridely_find_nearby_drivers($1, $2, $3, $4, $5)',
        [lat, lng, radiusKm, vehicleType, countryCode],
      );
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch drivers' },
        { status: 500 },
      );
    }

    const drivers = (rows ?? []).map((d) => ({
      driverId: d.driver_id,
      userId: d.user_id,
      name: d.name,
      avatarUrl: d.avatar_url,
      vehicleType: d.vehicle_type,
      vehicleMake: d.vehicle_make,
      vehicleModel: d.vehicle_model,
      vehicleColor: d.vehicle_color,
      rating: d.rating,
      totalTrips: d.total_trips,
      lat: d.lat,
      lng: d.lng,
      distanceKm: d.distance_km,
      etaMinutes: estimateEta(d.distance_km),
    }));

    return NextResponse.json({
      success: true,
      data: {
        drivers,
        total: drivers.length,
        searchCenter: { lat, lng },
        radiusKm,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
