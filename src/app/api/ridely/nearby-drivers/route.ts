import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinHalfLng * sinHalfLng;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function estimateEta(distanceKm: number): number {
  const avgSpeedKmh = 25;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const radiusKm = Math.min(50, Math.max(0.5, parseFloat(searchParams.get('radiusKm') ?? '10')));
    const vehicleType = searchParams.get('vehicleType');
    const countryCode = searchParams.get('countryCode');

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

    const { data: drivers, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id, name, phone, avatar_url, vehicle_type, vehicle_make, vehicle_model, vehicle_color, rating, total_trips, status')
      .eq('status', 'available');

    if (driverError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch drivers' },
        { status: 500 },
      );
    }

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({
        success: true,
        data: { drivers: [], total: 0 },
      });
    }

    const driverIds = drivers.map((d) => d.id);

    const { data: locations } = await supabase
      .from('ridely_driver_locations')
      .select('driver_id, lat, lng')
      .in('driver_id', driverIds)
      .order('updated_at', { ascending: false });

    const latestLocationMap = new Map<string, { lat: number; lng: number }>();
    for (const loc of locations ?? []) {
      if (!latestLocationMap.has(loc.driver_id)) {
        latestLocationMap.set(loc.driver_id, { lat: loc.lat, lng: loc.lng });
      }
    }

    let filteredDrivers = drivers
      .map((driver) => {
        const loc = latestLocationMap.get(driver.id);
        if (!loc) return null;
        const distanceKm = haversineKm({ lat, lng }, loc);
        if (distanceKm > radiusKm) return null;
        return {
          driverId: driver.id,
          userId: driver.user_id,
          name: driver.name,
          avatarUrl: driver.avatar_url,
          vehicleType: driver.vehicle_type,
          vehicleMake: driver.vehicle_make,
          vehicleModel: driver.vehicle_model,
          vehicleColor: driver.vehicle_color,
          rating: driver.rating,
          totalTrips: driver.total_trips,
          lat: loc.lat,
          lng: loc.lng,
          distanceKm: Math.round(distanceKm * 100) / 100,
          etaMinutes: estimateEta(distanceKm),
        };
      })
      .filter(Boolean) as Array<{
        driverId: string;
        userId: string;
        name: string;
        avatarUrl: string | null;
        vehicleType: string;
        vehicleMake: string;
        vehicleModel: string;
        vehicleColor: string;
        rating: number;
        totalTrips: number;
        lat: number;
        lng: number;
        distanceKm: number;
        etaMinutes: number;
      }>;

    if (vehicleType) {
      filteredDrivers = filteredDrivers.filter(
        (d) => d.vehicleType === vehicleType,
      );
    }

    filteredDrivers.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      data: {
        drivers: filteredDrivers,
        total: filteredDrivers.length,
        searchCenter: { lat, lng },
        radiusKm,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
