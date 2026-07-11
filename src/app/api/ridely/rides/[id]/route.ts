import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  RIDE_STATUS_TRANSITIONS,
  type RideStatus,
} from '@/types/ridely';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
      .select('status, driver_id, pricing, rider_id')
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

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (existing.driver_id) {
        await supabase
          .from('drivers')
          .update({ status: 'available', current_trip_id: null })
          .eq('id', existing.driver_id);
      }
    }

    if (status === 'in_progress' && existing.driver_id) {
      await supabase
        .from('drivers')
        .update({ status: 'on_trip' })
        .eq('id', existing.driver_id);
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
      .select('status, driver_id, rider_id')
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

    const { error } = await supabase
      .from('ridely_rides')
      .update({
        status: 'cancelled',
        cancelled_by: cancelledBy ?? 'rider',
        cancel_reason: reason ?? null,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel ride' },
        { status: 500 },
      );
    }

    if (existing.driver_id) {
      await supabase
        .from('drivers')
        .update({ status: 'available', current_trip_id: null })
        .eq('id', existing.driver_id);

      await supabase.from('notifications').insert({
        user_id: existing.driver_id,
        type: 'system',
        title: 'Ride Cancelled',
        body: `Ride has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        data: { ride_id: id },
      });
    }

    return NextResponse.json({ success: true, data: { id, status: 'cancelled' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
