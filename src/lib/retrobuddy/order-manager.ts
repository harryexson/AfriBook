import { createClient } from '@/lib/supabase/server';
import type {
  RestaurantOrder,
  RestaurantOrderStatus,
  OrderStatusMetadata,
  CreateOrderParams,
  OrderCancelledBy,
} from './types';
import { estimatePrepTime } from './prep-time-predictor';
import { addToKitchenDisplay } from './kitchen-display';

const VALID_STATUS_TRANSITIONS: Record<RestaurantOrderStatus, RestaurantOrderStatus[]> = {
  requesting: ['accepted', 'cancelled'],
  searching: ['accepted', 'cancelled'],
  matched: ['accepted', 'cancelled'],
  accepted: ['en_route_to_pickup', 'at_pickup', 'cancelled'],
  en_route_to_pickup: ['at_pickup', 'cancelled'],
  at_pickup: ['picked_up', 'cancelled'],
  picked_up: ['in_transit'],
  in_transit: ['at_dropoff', 'delivered'],
  at_dropoff: ['delivered'],
  delivered: [],
  cancelled: [],
};

function getTimestampField(status: RestaurantOrderStatus): string | null {
  const map: Partial<Record<RestaurantOrderStatus, string>> = {
    accepted: 'restaurant_accepted_at',
    at_pickup: 'restaurant_ready_at',
    picked_up: 'driver_picked_up_at',
    delivered: 'delivered_at',
  };
  return map[status] ?? null;
}

interface RestaurantBusinessRow {
  id: string;
  business_id: string;
  preparation_time: number | null;
  minimum_order: number | null;
  delivery_radius_km: number | null;
  businesses?: {
    id: string;
    name: string;
    status: string;
    owner_id: string;
    location: unknown;
    address: { formatted?: string } | null;
    metadata: Record<string, unknown> | null;
  } | null;
}

interface FoodDeliveryRow {
  id: string;
  customer_id: string;
  restaurant_id: string;
  restaurant_name: string;
  items: RestaurantOrder['items'];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  status: RestaurantOrderStatus;
  driver_id: string | null;
  special_instructions: string | null;
  payment_type: string;
  requested_at: string;  restaurant_accepted_at: string | null;
  restaurant_ready_at: string | null;
  driver_picked_up_at: string | null;
  delivered_at: string | null;
  destination_address: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  estimated_prep_time: number;
  estimated_delivery_time: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: FoodDeliveryRow): RestaurantOrder {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    customerId: row.customer_id,
    items: row.items,
    subtotal: row.subtotal,
    tax: row.tax,
    deliveryFee: row.delivery_fee,
    total: row.total,
    currencyCode: 'XAF',
    status: row.status,
    type: 'delivery',
    deliveryAddress: row.destination_address ?? undefined,
    deliveryLocation:
      row.destination_lat != null && row.destination_lng != null
        ? { lat: row.destination_lat, lng: row.destination_lng }
        : undefined,
    driverId: row.driver_id ?? undefined,
    estimatedPrepTime: row.estimated_prep_time,
    estimatedDeliveryTime: row.estimated_delivery_time,
    specialInstructions: row.special_instructions ?? undefined,
    paymentMethod: row.payment_type,
    requestedAt: row.requested_at,
    restaurantAcceptedAt: row.restaurant_accepted_at ?? undefined,
    restaurantReadyAt: row.restaurant_ready_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    cancelledAt: (row.metadata?.cancelled_at as string | undefined) ?? undefined,
    cancelReason: (row.metadata?.cancel_reason as string | undefined) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseWktPoint(location: unknown): { lat: number; lng: number } | null {
  if (!location) return null;
  const str = String(location);
  const match = str.match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
}

export async function isRestaurantOwner(
  userId: string,
  restaurantId: string,
): Promise<boolean> {
  const adminDb = await getAdminDb();
  const { data } = await adminDb
    .from('restaurants')
    .select('business_id, businesses!inner(owner_id)')
    .eq('id', restaurantId)
    .maybeSingle();

  const ownerId = (data?.businesses as { owner_id?: string } | null | undefined)?.owner_id;
  return ownerId === userId;
}

async function initRideLyDispatch(orderId: string): Promise<void> {
  const adminDb = await getAdminDb();
  Promise.resolve(
    adminDb.rpc('ridely_dispatch_delivery' as never, {
      p_delivery_id: orderId,
      p_table: 'ridely_food_deliveries',
    } as never),
  ).catch((err: unknown) => {
    console.log(`[RideLy] Dispatch initiation failed for order ${orderId}:`, err);
  });
}

const VALID_PAYMENT_TYPES = ['cash', 'card', 'wallet', 'mobile_money'];

export async function createRestaurantOrder(
  params: CreateOrderParams,
): Promise<RestaurantOrder> {
  const supabase = await createClient() as any;

  if (params.type !== 'delivery') {
    throw new Error('Only delivery orders are supported. Dine-in and pickup have been discontinued.');
  }

  if (!VALID_PAYMENT_TYPES.includes(params.paymentMethod)) {
    throw new Error('Invalid payment method');
  }

  const adminDb = await getAdminDb();
  const { data: restaurantRow, error: restaurantError } = await adminDb
    .from('restaurants')
    .select('id, business_id, preparation_time, minimum_order, delivery_radius_km, businesses!inner(id, name, status, owner_id, location, address, metadata)')
    .eq('id', params.restaurantId)
    .single();

  const business = restaurantRow?.businesses ?? null;

  if (restaurantError || !restaurantRow || !business) {
    throw new Error('Restaurant not found');
  }

  if (business.status !== 'active') {
    throw new Error('Restaurant is not accepting orders');
  }

  const restaurantName = (business.name as string) ?? 'Restaurant';
  const pickup = parseWktPoint(business.location);
  if (!pickup) {
    throw new Error('Restaurant location is not available');
  }

  if (!params.deliveryLocation) {
    throw new Error('deliveryLocation is required for delivery orders');
  }

  const estimates = await estimatePrepTime(
    params.items,
    params.restaurantId,
    restaurantRow.preparation_time ?? 15,
  );
  const maxPrepTime = Math.max(...estimates.map((e) => e.estimatedTimeMin), 0);

  const itemIds = [...new Set(params.items.map((i) => i.menuItemId))];
  const { data: menuRows } = await adminDb
    .from('menu_items')
    .select('id, name, price, is_available, restaurant_id')
    .in('id', itemIds);

  interface MenuRow {
    id: string;
    name: string;
    price: number;
    is_available: boolean;
    restaurant_id: string;
  }

  const menuMap = new Map<string, MenuRow>(
    ((menuRows ?? []) as Array<Record<string, unknown>>).map((m) => [
      String(m.id),
      {
        id: String(m.id),
        name: String(m.name ?? ''),
        price: Number(m.price ?? 0),
        is_available: (m.is_available as boolean | null | undefined) !== false,
        restaurant_id: String(m.restaurant_id ?? ''),
      },
    ]),
  );

  let subtotal = 0;
  const orderItems = params.items.map((item, index) => {
    const menuItem = menuMap.get(item.menuItemId);
    if (!menuItem || menuItem.restaurant_id !== params.restaurantId) {
      throw new Error(`Menu item ${item.menuItemId} not found for this restaurant`);
    }
    if (menuItem.is_available === false) {
      throw new Error(`Menu item "${menuItem.name}" is not available`);
    }
    const unitPrice = Number(menuItem.price);
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    return {
      id: `item_${Date.now()}_${index}`,
      menuItemId: item.menuItemId,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      notes: item.notes ?? null,
    };
  });

  const tax = 0;
  const deliveryFee = Number(
    (business.metadata as Record<string, unknown> | null)?.delivery_fee ?? 0,
  );
  const tip = params.tip ?? 0;
  const total = subtotal + tax + deliveryFee + tip;

  const minimumOrder = Number(restaurantRow.minimum_order ?? 0);
  if (subtotal < minimumOrder) {
    throw new Error(`Minimum order amount is ${minimumOrder}`);
  }

  const estimatedDeliveryTime = maxPrepTime + 20;
  const destination = params.deliveryLocation;
  const pickupAddress = (business.address as { formatted?: string } | null)?.formatted ?? restaurantName;

  const { data: orderRow, error: insertError } = await supabase
    .from('ridely_food_deliveries')
    .insert({
      customer_id: params.customerId,
      restaurant_id: params.restaurantId,
      restaurant_name: restaurantName,
      items: orderItems,
      subtotal,
      delivery_fee: deliveryFee,
      tax,
      total,
      status: 'requesting',
      delivery_type: 'food',
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      pickup_address: pickupAddress,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      destination_address: params.deliveryAddress ?? null,
      estimated_prep_time: maxPrepTime,
      estimated_delivery_time: estimatedDeliveryTime,
      special_instructions: params.specialInstructions ?? null,
      payment_type: params.paymentMethod,
      metadata: {
        tip,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
      },
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create order: ${insertError.message}`);
  }

  await addToKitchenDisplay(orderRow.id);

  await initRideLyDispatch(orderRow.id);

  return rowToOrder(orderRow);
}

export async function acceptOrder(
  orderId: string,
  restaurantId: string,
): Promise<RestaurantOrder> {
  const supabase = await createClient() as any;

  const { data: existing } = await supabase
    .from('ridely_food_deliveries')
    .select('status, restaurant_id')
    .eq('id', orderId)
    .single() as unknown as {
    data: { status: RestaurantOrderStatus; restaurant_id: string } | null;
  };

  if (!existing) {
    throw new Error('Order not found');
  }

  if (existing.restaurant_id !== restaurantId) {
    throw new Error('Order does not belong to this restaurant');
  }

  if (!VALID_STATUS_TRANSITIONS[existing.status]?.includes('accepted')) {
    throw new Error(`Cannot accept order in status: ${existing.status}`);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .update({
      status: 'accepted',
      restaurant_accepted_at: now,
      updated_at: now,
    })
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to accept order: ${error.message}`);
  }

  return rowToOrder(data!);
}

export async function updateOrderStatus(
  orderId: string,
  status: RestaurantOrderStatus,
  metadata?: OrderStatusMetadata,
): Promise<RestaurantOrder> {
  const supabase = await createClient() as any;

  const { data: existing } = await supabase
    .from('ridely_food_deliveries')
    .select('status')
    .eq('id', orderId)
    .single() as unknown as { data: { status: RestaurantOrderStatus } | null };

  if (!existing) {
    throw new Error('Order not found');
  }

  if (!VALID_STATUS_TRANSITIONS[existing.status]?.includes(status)) {
    throw new Error(`Cannot transition from ${existing.status} to ${status}`);
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  const timestampField = getTimestampField(status);
  if (timestampField) {
    updateData[timestampField] = now;
  }

  if (
    metadata?.driverId &&
    ['picked_up', 'in_transit', 'at_dropoff', 'delivered'].includes(status)
  ) {
    updateData.driver_id = metadata.driverId;
  }

  if (metadata?.note) {
    updateData.special_instructions = metadata.note;
  }

  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  return rowToOrder(data!);
}

export async function markOrderReady(orderId: string): Promise<RestaurantOrder> {
  const supabase = await createClient() as any;

  const { data: existing } = await supabase
    .from('ridely_food_deliveries')
    .select('status, restaurant_id, restaurant_accepted_at')
    .eq('id', orderId)
    .single() as unknown as {
    data: {
      status: RestaurantOrderStatus;
      restaurant_id: string;
      restaurant_accepted_at: string | null;
    } | null;
  };

  if (!existing) {
    throw new Error('Order not found');
  }

  if (!VALID_STATUS_TRANSITIONS[existing.status]?.includes('at_pickup')) {
    throw new Error(`Cannot mark order as ready from status: ${existing.status}`);
  }

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: 'at_pickup',
    restaurant_ready_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to mark order ready: ${error.message}`);
  }

  await initRideLyDispatch(orderId);

  return rowToOrder(data!);
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy: OrderCancelledBy,
): Promise<RestaurantOrder> {
  const supabase = await createClient() as any;

  const { data: existing } = await supabase
    .from('ridely_food_deliveries')
    .select('status, metadata')
    .eq('id', orderId)
    .single() as unknown as {
    data: { status: RestaurantOrderStatus; metadata: Record<string, unknown> | null } | null;
  };

  if (!existing) {
    throw new Error('Order not found');
  }

  if (!VALID_STATUS_TRANSITIONS[existing.status]?.includes('cancelled')) {
    throw new Error(`Cannot cancel order in status: ${existing.status}`);
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    updated_at: now,
    metadata: {
      ...(existing.metadata ?? {}),
      cancelled_at: now,
      cancel_reason: reason,
      cancelled_by: cancelledBy,
    },
  };

  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }

  return rowToOrder(data!);
}

export async function getRestaurantOrders(
  restaurantId: string,
  status?: RestaurantOrderStatus,
  page: number = 1,
  limit: number = 20,
): Promise<{ orders: RestaurantOrder[]; total: number; page: number; limit: number }> {
  const supabase = await createClient() as any;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('ridely_food_deliveries')
    .select('*', { count: 'exact' })
    .eq('restaurant_id', restaurantId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1) as unknown as {
    data: FoodDeliveryRow[] | null;
    count: number | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return {
    orders: (data ?? []).map(rowToOrder),
    total: count ?? 0,
    page,
    limit,
  };
}

export async function getOrderById(orderId: string): Promise<RestaurantOrder> {
  const supabase = await createClient() as any;

  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .select('*')
    .eq('id', orderId)
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error || !data) {
    throw new Error('Order not found');
  }

  return rowToOrder(data);
}

export interface OrderTimelineEvent {
  status: RestaurantOrderStatus;
  timestamp: string;
  note?: string;
}

export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
  const supabase = await createClient() as any;

  const { data } = await supabase
    .from('ridely_food_deliveries')
    .select('status, requested_at, restaurant_accepted_at, restaurant_ready_at, driver_picked_up_at, delivered_at, metadata')
    .eq('id', orderId)
    .single() as unknown as {
    data: {
      status: RestaurantOrderStatus;
      requested_at: string;
      restaurant_accepted_at: string | null;
      restaurant_ready_at: string | null;
      driver_picked_up_at: string | null;
      delivered_at: string | null;
      metadata: Record<string, unknown> | null;
    } | null;
  };

  if (!data) {
    throw new Error('Order not found');
  }

  const timeline: OrderTimelineEvent[] = [
    { status: 'requesting', timestamp: data.requested_at },
  ];

  const statusTimestamps: { status: RestaurantOrderStatus; timestamp: string | null; note?: string }[] = [
    { status: 'accepted', timestamp: data.restaurant_accepted_at },
    { status: 'at_pickup', timestamp: data.restaurant_ready_at },
    { status: 'picked_up', timestamp: data.driver_picked_up_at },
    { status: 'delivered', timestamp: data.delivered_at },
  ];

  const cancelledAt = data.metadata?.cancelled_at as string | undefined;
  if (cancelledAt) {
    statusTimestamps.push({
      status: 'cancelled',
      timestamp: cancelledAt,
      note: (data.metadata?.cancel_reason as string | undefined) ?? undefined,
    });
  }

  for (const entry of statusTimestamps) {
    if (entry.timestamp) {
      timeline.push({
        status: entry.status,
        timestamp: entry.timestamp,
        note: entry.note,
      });
    }
  }

  return timeline;
}
