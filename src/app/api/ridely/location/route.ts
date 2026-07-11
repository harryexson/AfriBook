import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { driverId, lat, lng, heading = 0, speed = 0, accuracy = 0 } = body;

    if (!driverId || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { success: false, error: 'driverId, lat, and lng are required' },
        { status: 400 },
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates' },
        { status: 400 },
      );
    }

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, status')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('ridely_driver_locations')
      .insert({
        driver_id: driverId,
        lat,
        lng,
        heading,
        speed,
        accuracy,
        updated_at: now,
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Failed to store location' },
        { status: 500 },
      );
    }

    await supabase.channel(`driver_location:${driverId}`).send({
      type: 'broadcast',
      event: 'location_update',
      payload: {
        driverId,
        lat,
        lng,
        heading,
        speed,
        accuracy,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: { driverId, lat, lng, heading, speed, accuracy, updatedAt: now },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'driverId query parameter is required' },
        { status: 400 },
      );
    }

    const { data: location, error } = await supabase
      .from('ridely_driver_locations')
      .select('driver_id, lat, lng, heading, speed, accuracy, updated_at')
      .eq('driver_id', driverId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch location' },
        { status: 500 },
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'No location data found for this driver' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: location });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
