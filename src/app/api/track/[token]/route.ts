import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';

/** Public (no-login) endpoint backing the /track/[token] page — deliberately minimal: status, driver first name only, vehicle, live location, no phone numbers or precise addresses. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const shareRows = await query<{ ride_id: string; expires_at: string }>(
      'SELECT ride_id, expires_at FROM ride_safety_shares WHERE share_token = $1',
      [token],
    );
    const share = shareRows[0];
    if (!share) {
      return NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 });
    }
    if (new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'This tracking link has expired' }, { status: 410 });
    }

    const rideRows = await query<{
      status: string;
      pickup_address: string | null;
      destination_address: string | null;
      requested_at: string;
      driver_id: string | null;
      driver_name: string | null;
      vehicle_make: string | null;
      vehicle_model: string | null;
      vehicle_color: string | null;
      plate_number: string | null;
    }>(
      `SELECT r.status, r.pickup_address, r.destination_address, r.requested_at, r.driver_id,
              p.full_name AS driver_name,
              v.make AS vehicle_make, v.model AS vehicle_model, v.color AS vehicle_color, v.plate_number
       FROM ridely_rides r
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN profiles p ON p.id = d.profile_id
       LEFT JOIN LATERAL (
         SELECT * FROM vehicles v WHERE v.driver_id = d.id AND v.is_active = true ORDER BY v.id LIMIT 1
       ) v ON true
       WHERE r.id = $1`,
      [share.ride_id],
    );
    const ride = rideRows[0];
    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 });
    }

    let location: { lat: number; lng: number } | null = null;
    if (ride.driver_id) {
      const locRows = await query<{ lat: number; lng: number }>(
        `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
         FROM driver_locations WHERE driver_id = $1 ORDER BY last_seen_at DESC LIMIT 1`,
        [ride.driver_id],
      );
      location = locRows[0] ?? null;
    }

    return NextResponse.json({
      success: true,
      status: ride.status,
      pickup: ride.pickup_address?.split(',')[0]?.trim() ?? null,
      dropoff: ride.destination_address?.split(',')[0]?.trim() ?? null,
      requestedAt: ride.requested_at,
      driver: ride.driver_name
        ? {
            firstName: ride.driver_name.split(' ')[0],
            vehicle: [ride.vehicle_color, ride.vehicle_make, ride.vehicle_model].filter(Boolean).join(' '),
            plate: ride.plate_number,
          }
        : null,
      location,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load trip' }, { status: 500 });
  }
}
