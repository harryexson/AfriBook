import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    businessId,
    items,
    deliveryAddress,
    notes,
  } = body;

  if (!businessId || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('currency_code, delivery_fee, minimum_order')
    .eq('id', businessId)
    .single() as unknown as { data: { currency_code: string; delivery_fee: number; minimum_order: number } | null };

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const productIds = items.map((i: { productId: string }) => i.productId);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, stock')
    .in('id', productIds) as unknown as { data: { id: string; name: string; price: number; stock: number }[] };

  const productMap = new Map(products?.map((p) => [p.id, p]) ?? []);

  let subtotal = 0;
  const orderItems = items.map((item: { productId: string; quantity: number; variant?: string; notes?: string }) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    const unitPrice = product.price;
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    return {
      product_id: item.productId,
      name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      variant: item.variant ?? null,
      notes: item.notes ?? null,
    };
  });

  if (subtotal < business.minimum_order) {
    return NextResponse.json(
      { error: `Minimum order amount is ${business.minimum_order}` },
      { status: 400 },
    );
  }

  const taxRate = 0;
  const tax = subtotal * taxRate;
  const deliveryFee = business.delivery_fee ?? 0;
  const total = subtotal + tax + deliveryFee;

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      businessId,
      customerId: user.id,
      items: orderItems,
      status: 'pending',
      subtotal,
      tax,
      deliveryFee,
      tip: 0,
      total,
      currencyCode: business.currency_code,
      paymentStatus: 'pending',
      deliveryAddress,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  for (const item of orderItems) {
    await supabase.rpc('decrement_product_stock' as never, {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    } as never);
  }

  return NextResponse.json(order, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const businessId = searchParams.get('businessId');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = (page - 1) * limit;

  let query = supabase.from('orders').select('*', { count: 'exact' });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
  } else if (profile?.role === 'vendor') {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('ownerId', user.id) as unknown as { data: { id: string }[] };
    const ids = businesses?.map((b) => b.id) ?? [];
    query = query.in('business_id', ids);
  } else if (profile?.role === 'driver') {
    query = query.eq('driverId', user.id);
  } else {
    query = query.eq('customerId', user.id);
  }

  if (status) query = query.eq('status', status as Order['status']);
  if (businessId) query = query.eq('businessId', businessId);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, limit });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, status } = body;

  if (!orderId || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single() as unknown as { data: { status: string } | null };

  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: [],
    refunded: [],
  };

  if (!validTransitions[existing.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${existing.status} to ${status}` },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData as never)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  return NextResponse.json(data);
}
