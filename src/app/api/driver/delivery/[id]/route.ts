import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';

// Driver-controlled leg of the delivery lifecycle only — everything up to
// "ready for pickup" belongs to the restaurant (see vendor/restaurant/orders'
// PATCH). Mirrors VALID_STATUS_TRANSITIONS in order-manager.ts.
const DRIVER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  at_pickup: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['at_dropoff', 'delivered'],
  at_dropoff: ['delivered'],
};

const TIMESTAMP_FIELD: Record<string, string> = {
  picked_up: 'driver_picked_up_at',
  delivered: 'delivered_at',
};

/** Everything the driver-facing delivery screen needs: restaurant contact, customer contact, items, and live coordinates for navigation — assembled from ridely_food_deliveries + restaurants/businesses/profiles, none of which carry all of this on their own. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const { id } = await params;

    const { data: driver } = await supabase.from('drivers').select('id').eq('profile_id', user.id).maybeSingle();
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const rows = await query<{
      id: string;
      order_id: string;
      status: string;
      items: unknown;
      subtotal: number;
      delivery_fee: number;
      tax: number;
      total: number;
      special_instructions: string | null;
      pickup_address: string | null;
      pickup_lat: number | null;
      pickup_lng: number | null;
      destination_address: string | null;
      destination_lat: number | null;
      destination_lng: number | null;
      driver_id: string | null;
      restaurant_name: string | null;
      restaurant_phone: string | null;
      customer_name: string | null;
      customer_phone: string | null;
    }>(
      `SELECT fd.id, fd.id AS order_id, fd.status, fd.items, fd.subtotal, fd.delivery_fee, fd.tax, fd.total,
              fd.special_instructions, fd.pickup_address, fd.pickup_lat, fd.pickup_lng,
              fd.destination_address, fd.destination_lat, fd.destination_lng, fd.driver_id,
              fd.restaurant_name, owner.phone AS restaurant_phone,
              cust.full_name AS customer_name, cust.phone AS customer_phone
       FROM ridely_food_deliveries fd
       LEFT JOIN restaurants r ON r.id = fd.restaurant_id
       LEFT JOIN businesses b ON b.id = r.business_id
       LEFT JOIN profiles owner ON owner.id = b.owner_id
       LEFT JOIN profiles cust ON cust.id = fd.customer_id
       WHERE fd.id = $1`,
      [id],
    );

    const delivery = rows[0];
    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
    }
    if (delivery.driver_id !== driver.id) {
      return NextResponse.json({ success: false, error: 'Not assigned to you' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: delivery.id,
        orderId: delivery.order_id,
        status: delivery.status,
        items: delivery.items,
        subtotal: Number(delivery.subtotal ?? 0),
        deliveryFee: Number(delivery.delivery_fee ?? 0),
        tax: Number(delivery.tax ?? 0),
        total: Number(delivery.total ?? 0),
        specialInstructions: delivery.special_instructions,
        vendorName: delivery.restaurant_name ?? 'Restaurant',
        vendorAddress: delivery.pickup_address,
        vendorLocation: delivery.pickup_lat != null && delivery.pickup_lng != null
          ? { lat: delivery.pickup_lat, lng: delivery.pickup_lng }
          : null,
        vendorPhone: delivery.restaurant_phone,
        customerName: delivery.customer_name ?? 'Customer',
        customerAddress: delivery.destination_address,
        customerLocation: delivery.destination_lat != null && delivery.destination_lng != null
          ? { lat: delivery.destination_lat, lng: delivery.destination_lng }
          : null,
        customerPhone: delivery.customer_phone,
      },
    });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load delivery' },
      { status },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const { id } = await params;

    const { data: driver } = await supabase.from('drivers').select('id').eq('profile_id', user.id).maybeSingle();
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const nextStatus = String(body?.status ?? '');

    const current = await query<{ status: string; driver_id: string | null }>(
      'SELECT status, driver_id FROM ridely_food_deliveries WHERE id = $1',
      [id],
    );
    const delivery = current[0];
    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
    }
    if (delivery.driver_id !== driver.id) {
      return NextResponse.json({ success: false, error: 'Not assigned to you' }, { status: 403 });
    }
    if (!DRIVER_ALLOWED_TRANSITIONS[delivery.status]?.includes(nextStatus)) {
      return NextResponse.json(
        { success: false, error: `Cannot move from ${delivery.status} to ${nextStatus}` },
        { status: 400 },
      );
    }

    const timestampField = TIMESTAMP_FIELD[nextStatus];
    const updated = await query(
      timestampField
        ? `UPDATE ridely_food_deliveries SET status = $1, updated_at = now(), ${timestampField} = now() WHERE id = $2 RETURNING id, status`
        : `UPDATE ridely_food_deliveries SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, status`,
      [nextStatus, id],
    );

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to update delivery' },
      { status },
    );
  }
}
