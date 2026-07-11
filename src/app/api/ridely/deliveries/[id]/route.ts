import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DELIVERY_STATUS_TRANSITIONS,
  type DeliveryStatus,
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
        { success: false, error: 'Delivery ID is required' },
        { status: 400 },
      );
    }

    const { data: delivery, error } = await supabase
      .from('ridely_deliveries')
      .select(`
        *,
        driver:drivers!ridely_deliveries_driver_id_fkey (
          id, user_id, name, phone, avatar_url,
          vehicle_type, vehicle_make, vehicle_model, vehicle_color, license_plate,
          rating, total_trips
        )
      `)
      .eq('id', id)
      .single();

    if (error || !delivery) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 },
      );
    }

    let driverLocation = null;
    if (delivery.driver_id) {
      const { data: loc } = await supabase
        .from('ridely_driver_locations')
        .select('lat, lng, heading, speed, updated_at')
        .eq('driver_id', delivery.driver_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      driverLocation = loc;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...delivery,
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
        { success: false, error: 'Delivery ID is required' },
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
      .from('ridely_deliveries')
      .select('status, driver_id, pricing, customer_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 },
      );
    }

    const allowed = DELIVERY_STATUS_TRANSITIONS[existing.status as DeliveryStatus];
    if (!allowed || !allowed.includes(status as DeliveryStatus)) {
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

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
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

    if (status === 'in_transit' && existing.driver_id) {
      await supabase
        .from('drivers')
        .update({ status: 'on_trip' })
        .eq('id', existing.driver_id);
    }

    const { data: delivery, error } = await supabase
      .from('ridely_deliveries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update delivery' },
        { status: 500 },
      );
    }

    await supabase.from('notifications').insert({
      user_id: existing.customer_id,
      type: 'system',
      title: `Delivery ${status.replace(/_/g, ' ')}`,
      body: `Your delivery status has been updated to ${status.replace(/_/g, ' ')}.`,
      data: { delivery_id: id, status },
    });

    return NextResponse.json({ success: true, data: delivery });
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
        { success: false, error: 'Delivery ID is required' },
        { status: 400 },
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from('ridely_deliveries')
      .select('status, driver_id, customer_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 },
      );
    }

    if (existing.status === 'delivered' || existing.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a delivery that is completed or already cancelled' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('ridely_deliveries')
      .update({
        status: 'cancelled',
        cancelled_by: cancelledBy ?? 'customer',
        cancel_reason: reason ?? null,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel delivery' },
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
        title: 'Delivery Cancelled',
        body: `Delivery has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        data: { delivery_id: id },
      });
    }

    return NextResponse.json({ success: true, data: { id, status: 'cancelled' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
