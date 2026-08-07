import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderTimeline,
} from '@/lib/retrobuddy/order-manager';
import type { RestaurantOrderStatus } from '@/lib/retrobuddy/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await getOrderById(id);

    const timeline = await getOrderTimeline(id);

    return NextResponse.json({ ...order, timeline });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: RestaurantOrderStatus; note?: string; estimatedMinutes?: number; driverId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const validStatuses: RestaurantOrderStatus[] = [
    'requesting', 'searching', 'matched', 'accepted',
    'en_route_to_pickup', 'at_pickup', 'picked_up', 'in_transit',
    'at_dropoff', 'delivered', 'cancelled',
  ];

  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    const order = await getOrderById(id);
    const { data: owns } = await supabase
      .from('restaurant_configs' as never)
      .select('id')
      .eq('id', order.restaurantId)
      .eq('business_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!owns) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const updated = await updateOrderStatus(id, body.status, {
      note: body.note,
      estimatedMinutes: body.estimatedMinutes,
      driverId: body.driverId,
    });

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update order';
    const status = message.includes('not found')
      ? 404
      : message.includes('Cannot')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as unknown as { data: { role: string } | null };

    const cancelledBy = profile?.role === 'admin' || profile?.role === 'super_admin'
      ? 'system'
      : 'restaurant';

    const order = await cancelOrder(
      id,
      body.reason ?? 'Cancelled by restaurant',
      cancelledBy,
    );

    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel order';
    const status = message.includes('not found')
      ? 404
      : message.includes('Cannot')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
