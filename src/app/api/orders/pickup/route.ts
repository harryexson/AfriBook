import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPickupOrder } from '@/lib/pickup/pickup-manager';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, businessId, pickupLocation, pickupAddress, pickupNotes, estimatedReadyAt } = body;

  if (!orderId || !businessId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.customer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pickupOrder = await createPickupOrder({
    orderId,
    businessId,
    customerId: user.id,
    pickupLocation,
    pickupAddress,
    pickupNotes,
    estimatedReadyAt,
  });

  if (!pickupOrder) {
    return NextResponse.json({ error: 'Failed to create pickup order' }, { status: 500 });
  }

  await supabase
    .from('orders')
    .update({ fulfillment_method: 'pickup', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  return NextResponse.json(pickupOrder, { status: 201 });
}
