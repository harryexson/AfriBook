import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/neon/admin';
import { createClient } from '@/lib/neon/server';
import {
  RIDE_STATUS_TRANSITIONS,
  type RideStatus,
} from '@/types/ridely';
import { releaseDriverAfterTrip } from '@/lib/ridely/driver-availability';
import { calculateRiderCancellationFee, calculateWaitTimePay } from '@/lib/ridely/driver-policies';

interface RideRow {
  [key: string]: unknown;
  id: string;
  status: string;
  driver_id: string | null;
  rider_id: string;
  pricing: unknown;
}

interface DriverEmbed {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  rating: number | null;
  total_trips: number | null;
}

// NOTE: the original Supabase `.select()` embedded the driver relation as
// `driver:drivers!ridely_rides_driver_id_fkey (id, user_id, name, phone,
// avatar_url, vehicle_type, vehicle_make, vehicle_model, vehicle_color,
// license_plate, rating, total_trips)`. None of those column names exist on
// `drivers` directly (verified against information_schema) — `user_id` is
// `profile_id`, `name`/`phone`/`avatar_url` live on `profiles`, and
// `vehicle_type`/`vehicle_make`/`vehicle_model`/`vehicle_color`/
// `license_plate` live on the driver's active row in `vehicles`
// (`type`/`make`/`model`/`color`/`plate_number`). Supabase's PostgREST layer
// must have been resolving this through a differently-shaped view/FK setup
// that no longer matches this schema; rebuilt here as an explicit join.
async function fetchRide(id: string): Promise<(RideRow & { driver: DriverEmbed | null }) | null> {
  const rows = await query<RideRow & {
    driver_pk: string | null;
    driver_profile_id: string | null;
    driver_name: string | null;
    driver_phone: string | null;
    driver_avatar_url: string | null;
    driver_vehicle_type: string | null;
    driver_vehicle_make: string | null;
    driver_vehicle_model: string | null;
    driver_vehicle_color: string | null;
    driver_license_plate: string | null;
    driver_rating: number | null;
    driver_total_trips: number | null;
  }>(
    `SELECT r.*,
            d.id AS driver_pk,
            d.profile_id AS driver_profile_id,
            p.full_name AS driver_name,
            p.phone AS driver_phone,
            p.avatar_url AS driver_avatar_url,
            v.type AS driver_vehicle_type,
            v.make AS driver_vehicle_make,
            v.model AS driver_vehicle_model,
            v.color AS driver_vehicle_color,
            v.plate_number AS driver_license_plate,
            d.rating AS driver_rating,
            d.total_trips AS driver_total_trips
     FROM ridely_rides r
     LEFT JOIN drivers d ON d.id = r.driver_id
     LEFT JOIN profiles p ON p.id = d.profile_id
     LEFT JOIN LATERAL (
       SELECT * FROM vehicles v WHERE v.driver_id = d.id AND v.is_active = true
       ORDER BY v.id LIMIT 1
     ) v ON true
     WHERE r.id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;

  const {
    driver_pk, driver_profile_id, driver_name, driver_phone, driver_avatar_url,
    driver_vehicle_type, driver_vehicle_make, driver_vehicle_model, driver_vehicle_color,
    driver_license_plate, driver_rating, driver_total_trips,
    // Never leak the ride-verification PIN through the general ride payload —
    // both the rider and the driver hit this same GET, and the whole point
    // of the PIN is that only the rider knows it. See pin/route.ts (rider-only
    // reveal) and pin/verify/route.ts (driver-side check without disclosure).
    pin: _pin,
    ...ride
  } = row;

  const driver: DriverEmbed | null = driver_pk
    ? {
        id: driver_pk,
        user_id: driver_profile_id as string,
        name: driver_name,
        phone: driver_phone,
        avatar_url: driver_avatar_url,
        vehicle_type: driver_vehicle_type,
        vehicle_make: driver_vehicle_make,
        vehicle_model: driver_vehicle_model,
        vehicle_color: driver_vehicle_color,
        license_plate: driver_license_plate,
        rating: driver_rating,
        total_trips: driver_total_trips,
      }
    : null;

  return { ...(ride as RideRow), driver };
}

/**
 * Credits a driver for wait-time pay or a rider cancellation fee.
 * Uses the raw admin query() this route already writes through (bypasses
 * RLS, same as every other write below) rather than driver-payouts.ts's
 * recordEarning(), which opens its own cookie-bound client.
 */
async function creditDriverExtra(
  driverId: string,
  rideId: string,
  extra: { waitTimePay?: number; cancellationFee?: number },
): Promise<void> {
  const driverRows = await query<{ profile_id: string | null }>(
    'SELECT profile_id FROM drivers WHERE id = $1',
    [driverId],
  );
  const profileId = driverRows[0]?.profile_id ?? null;

  let currency = 'USD';
  if (profileId) {
    const profileRows = await query<{ country_code: string | null }>(
      'SELECT country_code FROM profiles WHERE id = $1',
      [profileId],
    );
    if (profileRows[0]?.country_code) {
      const { getCurrencyForCountry } = await import('@/lib/money');
      currency = getCurrencyForCountry(profileRows[0].country_code as string);
    }
  }

  const waitTimePay = extra.waitTimePay ?? 0;
  const cancellationFee = extra.cancellationFee ?? 0;

  await query(
    `INSERT INTO driver_earnings
       (driver_id, ride_id, base_fare, distance_fare, time_fare, surge_bonus, tip,
        platform_fee, total_earnings, currency, status, metadata)
     VALUES ($1, $2, 0, 0, 0, 0, 0, 0, $3, $4, 'pending', $5)`,
    [
      driverId,
      rideId,
      waitTimePay + cancellationFee,
      currency,
      JSON.stringify({ waitTimePay, cancellationFee, insurancePremium: 0 }),
    ],
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ride ID is required' },
        { status: 400 },
      );
    }

    const ride = await fetchRide(id);

    if (!ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 },
      );
    }

    let driverLocation = null;
    if (ride.driver_id) {
      // NOTE: original code queried a nonexistent `ridely_driver_locations`
      // table with plain `lat`/`lng` columns; the real table is
      // `driver_locations` with a PostGIS `geography` column and
      // `last_seen_at` instead of `updated_at`.
      const locRows = await query<{
        lat: number; lng: number; heading: number | null; speed: number | null; updated_at: string;
      }>(
        `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
                heading, speed, last_seen_at AS updated_at
         FROM driver_locations
         WHERE driver_id = $1
         ORDER BY last_seen_at DESC
         LIMIT 1`,
        [ride.driver_id],
      );
      driverLocation = locRows[0] ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...ride,
        driverLocation,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ride ID is required' },
        { status: 400 },
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'status is required' },
        { status: 400 },
      );
    }

    const existingRows = await query<{
      status: string; driver_id: string | null; pricing: unknown; rider_id: string;
      ride_type: string | null; estimated_fare: number | null; accepted_at: string | null; arrived_at: string | null;
    }>(
      'SELECT status, driver_id, pricing, rider_id, ride_type, estimated_fare, accepted_at, arrived_at FROM ridely_rides WHERE id = $1',
      [id],
    );
    const existing = existingRows[0];

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 },
      );
    }

    const allowed = RIDE_STATUS_TRANSITIONS[existing.status as RideStatus];
    if (!allowed || !allowed.includes(status as RideStatus)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${existing.status} to ${status}` },
        { status: 400 },
      );
    }

    // Wait-time pay and the rider cancellation fee are computed and
    // credited outside the transaction below, via the raw admin query()
    // this route already writes through — same reasoning as
    // deliveries/[id]/route.ts for releaseDriverAfterTrip (which needs a
    // Neon `.from()`-shaped client, not the raw query() the rest of this
    // route uses).
    if (status === 'in_progress' && existing.driver_id && existing.arrived_at) {
      // Wait-time pay: the first 5 minutes at pickup are free to the
      // rider; anything past that is paid to the driver at their normal
      // per-minute rate (driver-policies.ts).
      const wait = calculateWaitTimePay(
        (existing.ride_type as any) ?? 'economy',
        existing.arrived_at as string,
      );
      if (wait.pay > 0) {
        await creditDriverExtra(existing.driver_id as string, id, { waitTimePay: wait.pay });
      }
    }

    let cancellationFeeForUpdate = 0;
    if (status === 'cancelled' && existing.driver_id) {
      // Rider cancellation fee: free within the grace period, then a
      // percentage of the fare once the driver has committed 5+ minutes
      // to the pickup (or already arrived).
      const cancellation = calculateRiderCancellationFee({
        hasDriver: true,
        status: existing.status as string,
        acceptedAt: existing.accepted_at as string | null,
        arrivedAt: existing.arrived_at as string | null,
        estimatedFare: Number(existing.estimated_fare ?? 0),
      });
      if (cancellation.fee > 0) {
        cancellationFeeForUpdate = cancellation.fee;
        await creditDriverExtra(existing.driver_id as string, id, { cancellationFee: cancellation.fee });
      }
    }

    if ((status === 'completed' || status === 'cancelled') && existing.driver_id) {
      const supabase = await createClient();
      await releaseDriverAfterTrip(supabase, existing.driver_id as string);
    }

    const ride = await withTransaction(async (txQuery) => {
      if (status === 'in_progress' && existing.driver_id) {
        await txQuery(
          `UPDATE drivers SET status = 'on_trip' WHERE id = $1`,
          [existing.driver_id],
        );
      }

      const setClauses = ['status = $2', 'updated_at = now()'];
      const values: unknown[] = [id, status];
      let idx = 3;

      if (metadata || cancellationFeeForUpdate > 0) {
        setClauses.push(`metadata = $${idx}`);
        values.push(JSON.stringify(cancellationFeeForUpdate > 0 ? { ...(metadata ?? {}), cancellationFee: cancellationFeeForUpdate } : metadata));
        idx += 1;
      }
      if (status === 'completed') {
        setClauses.push('completed_at = now()');
      }
      if (status === 'cancelled') {
        setClauses.push('cancelled_at = now()');
      }

      const updated = await txQuery<RideRow>(
        `UPDATE ridely_rides SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
        values,
      );

      await txQuery(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'system', $2, $3, $4)`,
        [
          existing.rider_id,
          `Ride ${String(status).replace(/_/g, ' ')}`,
          `Your ride status has been updated to ${String(status).replace(/_/g, ' ')}.`,
          JSON.stringify({ ride_id: id, status }),
        ],
      );

      return updated[0];
    });

    return NextResponse.json({ success: true, data: ride });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason, cancelledBy } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ride ID is required' },
        { status: 400 },
      );
    }

    const existingRows = await query<{
      status: string; driver_id: string | null; rider_id: string;
      ride_type: string | null; estimated_fare: number | null; accepted_at: string | null; arrived_at: string | null;
    }>(
      'SELECT status, driver_id, rider_id, ride_type, estimated_fare, accepted_at, arrived_at FROM ridely_rides WHERE id = $1',
      [id],
    );
    const existing = existingRows[0];

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 },
      );
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a ride that is completed or already cancelled' },
        { status: 400 },
      );
    }

    const actor = cancelledBy ?? 'rider';
    const cancellation = actor === 'rider'
      ? calculateRiderCancellationFee({
          hasDriver: !!existing.driver_id,
          status: existing.status as string,
          acceptedAt: existing.accepted_at as string | null,
          arrivedAt: existing.arrived_at as string | null,
          estimatedFare: Number(existing.estimated_fare ?? 0),
        })
      : { fee: 0, reason: 'no_driver' as const, minutesSinceAccepted: 0 };

    if (existing.driver_id) {
      if (cancellation.fee > 0) {
        await creditDriverExtra(existing.driver_id as string, id, { cancellationFee: cancellation.fee });
      }
      const supabase = await createClient();
      await releaseDriverAfterTrip(supabase, existing.driver_id as string);
    }

    await withTransaction(async (txQuery) => {
      await txQuery(
        `UPDATE ridely_rides
         SET status = 'cancelled', cancelled_by = $2, cancel_reason = $3,
             cancelled_at = now(), updated_at = now(),
             metadata = CASE WHEN $4::numeric > 0 THEN coalesce(metadata, '{}'::jsonb) || jsonb_build_object('cancellationFee', $4::numeric) ELSE metadata END
         WHERE id = $1`,
        [id, actor, reason ?? null, cancellation.fee],
      );

      if (existing.driver_id) {
        await txQuery(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, 'system', 'Ride Cancelled', $2, $3)`,
          [
            existing.driver_id,
            `Ride has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
            JSON.stringify({ ride_id: id }),
          ],
        );
      }
    });

    return NextResponse.json({
      success: true,
      data: { id, status: 'cancelled', cancellationFee: cancellation.fee, cancellationFeeReason: cancellation.reason },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
