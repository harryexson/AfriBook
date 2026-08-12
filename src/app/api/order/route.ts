import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry } from '@/lib/money';

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
}

interface OrderLineInput {
  productId?: string;
  menuItemId?: string;
  quantity?: number;
  variant?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { businessId, items, deliveryAddress, notes } = body as {
    businessId: string;
    items: OrderLineInput[];
    deliveryAddress?: unknown;
    notes?: string;
  };

  if (!businessId || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, status, country_code, metadata, countries(currency_code)')
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
  const joinCurrency = (business.countries as { currency_code?: string }[] | null)?.[0]?.currency_code;
  const currency =
    joinCurrency ?? (business.country_code ? getCurrencyForCountry(business.country_code) : 'USD');

  const productIds = items
    .filter((i) => i.productId)
    .map((i) => i.productId as string);
  const menuItemIds = items
    .filter((i) => i.menuItemId)
    .map((i) => i.menuItemId as string);

  const [{ data: products }, { data: menuItems }] = await Promise.all([
    productIds.length
      ? supabase.from('products').select('id, name, price, stock, is_available').in('id', productIds)
      : Promise.resolve({ data: [], error: null }),
    menuItemIds.length
      ? supabase
          .from('menu_items')
          .select('id, name, price, is_available, restaurant_id, currency')
          .in('id', menuItemIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const productMap = new Map<string, any>(
    (products as any[] | null)?.map((p) => [p.id, p]) ?? [],
  );
  const menuMap = new Map<string, any>(
    (menuItems as any[] | null)?.map((m) => [m.id, m]) ?? [],
  );

  if (menuItemIds.length) {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, business_id')
      .in('id', [...new Set((menuItems as any[] | null)?.map((m) => m.restaurant_id) ?? [])]);
    const restaurantsForBusiness = new Set(
      (restaurants ?? []).filter((r: any) => r.business_id === businessId).map((r: any) => r.id),
    );
    for (const menuItemId of menuItemIds) {
      const menuItem = menuMap.get(menuItemId);
      if (!menuItem || !restaurantsForBusiness.has(menuItem.restaurant_id)) {
        return NextResponse.json(
          { error: `Menu item ${menuItemId} is not sold by this business` },
          { status: 400 },
        );
      }
    }
  }

  let subtotal = 0;
  const hasProducts = items.some((i) => i.productId);
  const hasFood = items.some((i) => i.menuItemId);
  const orderType = hasProducts && hasFood ? 'mixed' : hasFood ? 'food' : 'products';

  const orderItems = items.map((item) => {
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }
    if (item.productId) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.is_available === false) throw new Error(`Product ${product.name} is unavailable`);
      if (Number(product.stock ?? 0) < quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;
      return {
        item_type: 'product',
        item_id: item.productId,
        name: product.name,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        variant: item.variant ?? null,
        notes: item.notes ?? null,
      };
    }
    if (item.menuItemId) {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
      if (menuItem.is_available === false) throw new Error(`${menuItem.name} is unavailable`);
      const unitPrice = Number(menuItem.price);
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;
      return {
        item_type: 'menu',
        item_id: item.menuItemId,
        name: menuItem.name,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        variant: null,
        notes: item.notes ?? null,
      };
    }
    throw new Error('Each item must include a productId or menuItemId');
  });

  if (minimumOrder > 0 && subtotal < minimumOrder) {
    return NextResponse.json(
      { error: `Minimum order amount is ${subtotal.toFixed(2)} below ${minimumOrder}` },
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
      type: orderType,
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

  const adminDb = await getAdminDb();

  // Persist canonical line items (RLS allows because the order belongs to the customer).
  await supabase
    .from('order_items')
    .insert(
      orderItems.map((line) => ({
        order_id: order.id,
        item_type: line.item_type,
        item_id: line.item_id,
        name: line.name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        modifiers: [],
        special_instructions: line.notes ?? null,
      })),
    );

  for (const item of orderItems) {
    if (item.item_type !== 'product') continue;
    const { data: current } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.item_id)
      .single();

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: Math.max(0, Number(current?.stock ?? 0) - item.quantity) })
      .eq('id', item.item_id)
      .gte('stock', item.quantity);

    if (stockError) continue;

    await supabase.from('inventory_log').insert({
      product_id: item.item_id,
      quantity_change: -item.quantity,
      reason: 'order',
      reference_id: order.id,
    });
  }

  await adminDb.from('notifications').insert({
    user_id: user.id,
    type: 'order',
    title: orderType === 'food' ? 'Food Order Placed' : 'Order Placed',
    body: `Your order #${order.id} has been placed.`,
    data: { order_id: order.id, total, currency, type: orderType },
  });

  const { data: ownerRow } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single();

  if (ownerRow?.owner_id && ownerRow.owner_id !== user.id) {
    await adminDb.from('notifications').insert({
      user_id: ownerRow.owner_id,
      type: 'order',
      title: 'New Order Received',
      body: `New ${orderType} order #${order.id} for ${business.name}.`,
      data: { order_id: order.id, total, currency, type: orderType },
    });
  }

  return NextResponse.json(order, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
