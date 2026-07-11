import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRestaurantOrder, getRestaurantOrders } from '@/lib/retrobuddy/order-manager';
import type { CreateOrderParams, RestaurantOrderStatus } from '@/lib/retrobuddy/types';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurantId');
  const status = searchParams.get('status') as RestaurantOrderStatus | null;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    const { data: owns } = await supabase
      .from('restaurant_configs' as never)
      .select('id')
      .eq('id', restaurantId)
      .eq('business_id', user.id)
      .single() as unknown as { data: { id: string } | null };

    if (!owns) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const result = await getRestaurantOrders(
      restaurantId,
      status ?? undefined,
      page,
      limit,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateOrderParams;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    restaurantId,
    items,
    type,
    paymentMethod,
  } = body;

  if (!restaurantId || !items?.length || !type || !paymentMethod) {
    return NextResponse.json(
      { error: 'Missing required fields: restaurantId, items, type, paymentMethod' },
      { status: 400 },
    );
  }

  if (!['delivery', 'dine_in', 'pickup'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid order type. Must be delivery, dine_in, or pickup' },
      { status: 400 },
    );
  }

  if (type === 'delivery' && !body.deliveryAddress) {
    return NextResponse.json(
      { error: 'deliveryAddress is required for delivery orders' },
      { status: 400 },
    );
  }

  try {
    const order = await createRestaurantOrder({
      ...body,
      customerId: user.id,
      customerName: body.customerName ?? user.email ?? 'Customer',
      customerPhone: body.customerPhone ?? '',
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    const status = message.includes('not found')
      ? 404
      : message.includes('not accepting')
        ? 409
        : message.includes('Minimum order')
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
