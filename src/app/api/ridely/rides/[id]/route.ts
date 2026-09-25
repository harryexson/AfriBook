import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  RIDE_STATUS_TRANSITIONS,
  type RideStatus,
} from '@/types/ridely';
import { releaseDriverAfterTrip } from '@/lib/ridely/driver-availability';
import { calculateRiderCancellationFee, calculateWaitTimePay } from '@/lib/ridely/driver-policies';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Credits a driver for wait-time pay or a rider cancellation fee.
 * Uses the service-role client already held by this route (bypasses
 * RLS, same as every other write below) rather than driver-payouts.ts's
 * recordEarning(), which opens its own cookie-bound client.
 */
async function creditDriverExtra(
  driverId: string,
  rideId: string,
  extra: { waitTimePay?: number; cancellationFee?: number },
): Promise<void> {
  const { data: driver } = await supabase
    .from('drivers')
    .select('profile_id')
    .eq('id', driverId)
    .maybeSingle();

  let currency = 'USD';
  if (driver?.profile_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_code')
      .eq('id', driver.profile_id)
      .maybeSingle();
    if (profile?.country_code) {
      const { getCurrencyForCountry } = await import('@/lib/money');
      currency = getCurrencyForCountry(profile.country_code);
    }
  }

  const waitTimePay = extra.waitTimePay ?? 0;
  const cancellationFee = extra.cancellationFee ?? 0;

  await supabase.from('driver_earnings').insert({
    driver_id: driverId,
    ride_id: rideId,
    base_fare: 0,
    distance_fare: 0,
    time_fare: 0,
    surge_bonus: 0,
    tip: 0,
    platform_fee: 0,
    total_earnings: waitTimePay + cancellationFee,
    currency,
    status: 'pending',
    metadata: { waitTimePay, cancellationFee, insurancePremium: 0 },
  });
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

    const { data: ride, error } = await supabase
      .from('ridely_rides')
      .select(`
        *,
        driver:drivers!ridely_rides_driver_id_fkey (
          id, user_id, name, phone, avatar_url,
          vehicle_type, vehicle_make, vehicle_model, vehicle_color, license_plate,
          rating, total_trips
        )
      `)
      .eq('id', id)
      .single();

    if (error || !ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 },
      );
    }

    let driverLocation = null;
    if (ride.driver_id) {
      const { data: loc } = await supabase
        .from('ridely_driver_locations')
        .select('lat, lng, heading, speed, updated_at')
        .eq('driver_id', ride.driver_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      driverLocation = loc;
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

    const { data: existing, error: fetchError } = await supabase
      .from('ridely_rides')
      .select('status, driver_id, pricing, rider_id, ride_type, estimated_fare, accepted_at, arrived_at')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
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

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    if (status === 'accepted') {
      updateData.accepted_at = new Date().toISOString();
    }

    if (status === 'arrived') {
      updateData.arrived_at = new Date().toISOString();
    }

    if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString();

      // Wait-time pay: the first 5 minutes at pickup are free to the
      // rider; anything past that is paid to the driver at their normal
      // per-minute rate (driver-policies.ts).
      if (existing.driver_id && existing.arrived_at) {
        const wait = calculateWaitTimePay(
          (existing.ride_type as any) ?? 'economy',
          existing.arrived_at as string,
        );
        if (wait.pay > 0) {
          await creditDriverExtra(existing.driver_id as string, id, { waitTimePay: wait.pay });
        }
      }
    }

    if (status === 'completed' && existing.driver_id) {
      updateData.completed_at = new Date().toISOString();
      await releaseDriverAfterTrip(supabase, existing.driver_id as string);
    }

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (existing.driver_id) {
        // Rider cancellation fee: free within the grace period, then a
        // percentage of the fare once the driver has committed 5+
        // minutes to the pickup (or already arrived).
        const cancellation = calculateRiderCancellationFee({
          hasDriver: true,
          status: existing.status as string,
          acceptedAt: existing.accepted_at as string | null,
          arrivedAt: existing.arrived_at as string | null,
          estimatedFare: Number(existing.estimated_fare ?? 0),
        });
        if (cancellation.fee > 0) {
          updateData.metadata = { ...(metadata ?? {}), cancellationFee: cancellation.fee };
          await creditDriverExtra(existing.driver_id as string, id, { cancellationFee: cancellation.fee });
        }
        await releaseDriverAfterTrip(supabase, existing.driver_id as string);
      }
    }

    const { data: ride, error } = await supabase
      .from('ridely_rides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update ride' },
        { status: 500 },
      );
    }

    await supabase.from('notifications').insert({
      user_id: existing.rider_id,
      type: 'system',
      title: `Ride ${status.replace(/_/g, ' ')}`,
      body: `Your ride status has been updated to ${status.replace(/_/g, ' ')}.`,
      data: { ride_id: id, status },
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

    const { data: existing, error: fetchError } = await supabase
      .from('ridely_rides')
      .select('status, driver_id, rider_id, ride_type, estimated_fare, accepted_at, arrived_at')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
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

    const { error } = await supabase
      .from('ridely_rides')
      .update({
        status: 'cancelled',
        cancelled_by: actor,
        cancel_reason: reason ?? null,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: cancellation.fee > 0 ? { cancellationFee: cancellation.fee } : undefined,
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel ride' },
        { status: 500 },
      );
    }

    if (existing.driver_id) {
      if (cancellation.fee > 0) {
        await creditDriverExtra(existing.driver_id as string, id, { cancellationFee: cancellation.fee });
      }
      await releaseDriverAfterTrip(supabase, existing.driver_id as string);

      await supabase.from('notifications').insert({
        user_id: existing.driver_id,
        type: 'system',
        title: 'Ride Cancelled',
        body: `Ride has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        data: { ride_id: id },
      });
    }

    return NextResponse.json({
      success: true,
      data: { id, status: 'cancelled', cancellationFee: cancellation.fee, cancellationFeeReason: cancellation.reason },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
