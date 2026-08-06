import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient() as any;
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
    .select('id, name, status, metadata, countries(currency_code)')
    .eq('id', businessId)
    .single();

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }
  if (business.status !== 'active') {
    return NextResponse.json({ error: 'Business is not accepting orders' }, { status: 400 });
  }

  const businessMeta = (business.metadata as Record<string, unknown>) ?? {};
  const minimumOrder = Number(businessMeta.minimum_order ?? 0);
  const deliveryFee = Number(businessMeta.delivery_fee ?? 0);
  const currency = (business.countries as { currency_code?: string }[] | null)?.[0]?.currency_code ?? 'USD';

  const productIds = items.map((i: { productId: string }) => i.productId);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, stock, is_available')
    .in('id', productIds);

  interface ProductRow {
    id: string;
    name: string;
    price: number;
    stock: number;
    is_available: boolean;
  }

  const productMap = new Map<string, ProductRow>(
    (products as ProductRow[] | null)?.map((p) => [p.id, p]) ?? [],
  );

  let subtotal = 0;
  const orderItems = items.map((item: { productId: string; quantity: number; variant?: string; notes?: string }) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    if (product.is_available === false) throw new Error(`Product ${product.name} is unavailable`);
    if (item.quantity <= 0) throw new Error('Quantity must be positive');
    if (Number(product.stock ?? 0) < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    const unitPrice = Number(product.price);
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

  if (minimumOrder > 0 && subtotal < minimumOrder) {
    return NextResponse.json(
      { error: `Minimum order amount is ${minimumOrder}` },
      { status: 400 },
    );
  }

  const tax = 0;
  const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      business_id: businessId,
      customer_id: user.id,
      type: 'products',
      status: 'pending',
      items: orderItems,
      subtotal,
      tax,
      delivery_fee: deliveryFee,
      total,
      currency,
      payment_status: 'pending',
      delivery_address: deliveryAddress ?? {},
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  for (const item of orderItems) {
    const { data: current } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single();

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: Math.max(0, Number(current?.stock ?? 0) - item.quantity) })
      .eq('id', item.product_id)
      .gte('stock', item.quantity);

    if (stockError) continue;

    await supabase.from('inventory_log').insert({
      product_id: item.product_id,
      quantity_change: -item.quantity,
      reason: 'order',
      reference_id: order.id,
    });
  }

  const adminDb = await getAdminDb();
  await adminDb.from('notifications').insert({
    user_id: user.id,
    type: 'order',
    title: 'Order Created',
    body: `Your order #${order.id} has been placed.`,
    data: { order_id: order.id, total, currency },
  });

  return NextResponse.json(order, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient() as any;
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
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  if (role === 'super_admin') {
    // full access
  } else if (role === 'vendor') {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id);
    const ids = businesses?.map((b: { id: string }) => b.id) ?? [];
    if (ids.length === 0) return NextResponse.json({ data: [], count: 0, page, limit });
    query = query.in('business_id', ids);
  } else if (role === 'driver') {
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('order_id')
      .not('order_id', 'is', null)
      .eq('driver_id', user.id);
    const orderIds = deliveries?.map((d: { order_id: string }) => d.order_id) ?? [];
    if (orderIds.length === 0) return NextResponse.json({ data: [], count: 0, page, limit });
    query = query.in('id', orderIds);
  } else {
    query = query.eq('customer_id', user.id);
  }

  if (status) query = query.eq('status', status);
  if (businessId) query = query.eq('business_id', businessId);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, limit });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient() as any;
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
    .single();

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
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  return NextResponse.json(data);
}
