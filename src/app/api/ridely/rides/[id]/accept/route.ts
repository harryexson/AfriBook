import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/neon/admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { driverId } = body;

    if (!id || !driverId) {
      return NextResponse.json(
        { success: false, error: 'Ride ID and driverId are required' },
        { status: 400 },
      );
    }

    const rideRows = await query<{
      status: string; rider_id: string; ride_type: string;
      pickup_lat: number; pickup_lng: number; destination_lat: number; destination_lng: number; pricing: unknown;
    }>(
      `SELECT status, rider_id, ride_type, pickup_lat, pickup_lng, destination_lat, destination_lng, pricing
       FROM ridely_rides WHERE id = $1`,
      [id],
    );
    const ride = rideRows[0];

    if (!ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 },
      );
    }

    if (ride.status !== 'searching' && ride.status !== 'requesting') {
      return NextResponse.json(
        { success: false, error: `Ride cannot be accepted in "${ride.status}" status` },
        { status: 400 },
      );
    }

    // NOTE: original code selected user_id/name/phone/avatar_url/vehicle_*
    // directly off `drivers`, none of which exist there (verified against
    // information_schema) — those live on `profiles` (via drivers.profile_id)
    // and the driver's active row in `vehicles`. Rebuilt as a join.
    const driverRows = await query<{
      id: string; user_id: string; name: string | null; phone: string | null; avatar_url: string | null;
      vehicle_type: string | null; vehicle_make: string | null; vehicle_model: string | null; vehicle_color: string | null;
      rating: number | null; total_trips: number | null; status: string;
    }>(
      `SELECT d.id, d.profile_id AS user_id, p.full_name AS name, p.phone AS phone, p.avatar_url AS avatar_url,
              v.type AS vehicle_type, v.make AS vehicle_make, v.model AS vehicle_model, v.color AS vehicle_color,
              d.rating AS rating, d.total_trips AS total_trips, d.status AS status
       FROM drivers d
       LEFT JOIN profiles p ON p.id = d.profile_id
       LEFT JOIN LATERAL (
         SELECT * FROM vehicles v WHERE v.driver_id = d.id AND v.is_active = true
         ORDER BY v.id LIMIT 1
       ) v ON true
       WHERE d.id = $1`,
      [driverId],
    );
    const driver = driverRows[0];

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 },
      );
    }

    // NOTE: `drivers.status` is `driver_status` — valid values are
    // offline/online/busy/on_trip/pending_review, not 'available'. The
    // original code's `driver.status !== 'available'` check could never be
    // true against real data (Supabase would just never match), so drivers
    // could always be "accepted" here. Preserving the closest real
    // equivalent: a driver must be `online` (and not already mid-trip).
    if (driver.status !== 'online') {
      return NextResponse.json(
        { success: false, error: 'Driver is not available' },
        { status: 409 },
      );
    }

    await withTransaction(async (txQuery) => {
      await txQuery(
        `UPDATE ridely_rides
         SET driver_id = $2, status = 'accepted', accepted_at = now(), updated_at = now()
         WHERE id = $1`,
        [id, driverId],
      );

      // NOTE: original code also set `current_trip_id: id` here, but
      // `drivers` has no `current_trip_id` column — dropped, same as the
      // other ridely route handlers.
      await txQuery(
        `UPDATE drivers SET status = 'on_trip' WHERE id = $1`,
        [driverId],
      );

      await txQuery(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'system', 'Driver Found!', $2, $3)`,
        [
          ride.rider_id,
          `${driver.name} has accepted your ride. Vehicle: ${driver.vehicle_color} ${driver.vehicle_make} ${driver.vehicle_model}.`,
          JSON.stringify({
            ride_id: id,
            driver_id: driverId,
            driver_name: driver.name,
            vehicle: `${driver.vehicle_color} ${driver.vehicle_make} ${driver.vehicle_model}`,
          }),
        ],
      );
    });

    return NextResponse.json({
      success: true,
      data: {
        rideId: id,
        status: 'accepted',
        driver: {
          id: driver.id,
          userId: driver.user_id,
          name: driver.name,
          phone: driver.phone,
          avatarUrl: driver.avatar_url,
          vehicleType: driver.vehicle_type,
          vehicleMake: driver.vehicle_make,
          vehicleModel: driver.vehicle_model,
          vehicleColor: driver.vehicle_color,
          rating: driver.rating,
          totalTrips: driver.total_trips,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
