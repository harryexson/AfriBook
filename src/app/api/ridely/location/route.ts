import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';

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

    const driverRows = await query<{ id: string; status: string }>(
      'SELECT id, status FROM drivers WHERE id = $1',
      [driverId],
    );
    const driver = driverRows[0];

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    // NOTE: original code wrote to a table named `ridely_driver_locations`,
    // which does not exist in the real schema (confirmed via information_schema) —
    // the real table is `driver_locations`, storing position as a PostGIS
    // `geography` point rather than separate lat/lng columns. This was a
    // silently-dropped write under Supabase; fixed here to hit the real table.
    await query(
      `INSERT INTO driver_locations (driver_id, location, heading, speed, accuracy, last_seen_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5, $6, $7)`,
      [driverId, lng, lat, heading, speed, accuracy, now],
    );

    // NOTE: the original code also broadcast this update via Supabase
    // Realtime (`supabase.channel(...).send(...)`). Neon has no equivalent
    // realtime broadcast primitive documented for this migration, so the
    // broadcast is dropped here — real-time driver location updates to
    // subscribed clients need a separate solution (follow-up, not in scope).

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

    const rows = await query<{
      driver_id: string;
      lat: number;
      lng: number;
      heading: number | null;
      speed: number | null;
      accuracy: number | null;
      updated_at: string;
    }>(
      `SELECT driver_id,
              ST_Y(location::geometry) AS lat,
              ST_X(location::geometry) AS lng,
              heading, speed, accuracy,
              last_seen_at AS updated_at
       FROM driver_locations
       WHERE driver_id = $1
       ORDER BY last_seen_at DESC
       LIMIT 1`,
      [driverId],
    );
    const location = rows[0] ?? null;

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
