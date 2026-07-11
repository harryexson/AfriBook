import { createClient } from '@/lib/supabase/server';
import type {
  RestaurantOrder,
  RestaurantOrderStatus,
  OrderStatusMetadata,
  CreateOrderParams,
  OrderCancelledBy,
  RestaurantConfig,
} from './types';
import { estimatePrepTime } from './prep-time-predictor';
import { addToKitchenDisplay } from './kitchen-display';

const VALID_STATUS_TRANSITIONS: Record<RestaurantOrderStatus, RestaurantOrderStatus[]> = {
  received: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['driver_assigned', 'cancelled'],
  driver_assigned: ['driver_arriving', 'cancelled'],
  driver_arriving: ['picked_up', 'cancelled'],
  picked_up: ['in_transit'],
  in_transit: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

function getTimestampField(status: RestaurantOrderStatus): string | null {
  const map: Partial<Record<RestaurantOrderStatus, string>> = {
    accepted: 'accepted_at',
    preparing: 'preparing_at',
    ready: 'ready_at',
    picked_up: 'picked_up_at',
    delivered: 'delivered_at',
    cancelled: 'cancelled_at',
  };
  return map[status] ?? null;
}

interface RestaurantConfigRow {
  id: string;
  business_id: string;
  restaurant_name: string;
  avg_prep_time_min: number;
  max_orders_per_hour: number;
  accepts_orders: boolean;
  opens_at: string;
  closes_at: string;
  delivery_radius_km: number;
  minimum_order: number;
  delivery_fee: number;
  auto_accept_orders: boolean;
  pos_integration_type?: string | null;
  pos_api_key?: string | null;
}

interface RestaurantOrderRow {
  id: string;
  restaurant_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  items: RestaurantOrder['items'];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  tip: number;
  total: number;
  currency_code: string;
  status: RestaurantOrderStatus;
  type: string;
  delivery_address: string | null;
  delivery_location: { lat: number; lng: number } | null;
  driver_id: string | null;
  estimated_prep_time: number;
  estimated_delivery_time: number;
  actual_prep_time: number | null;
  special_instructions: string | null;
  payment_method: string;
  payment_status: string;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: RestaurantOrderRow): RestaurantOrder {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    items: row.items,
    subtotal: row.subtotal,
    tax: row.tax,
    deliveryFee: row.delivery_fee,
    tip: row.tip,
    total: row.total,
    currencyCode: row.currency_code,
    status: row.status,
    type: row.type as RestaurantOrder['type'],
    deliveryAddress: row.delivery_address ?? undefined,
    deliveryLocation: row.delivery_location ?? undefined,
    driverId: row.driver_id ?? undefined,
    estimatedPrepTime: row.estimated_prep_time,
    estimatedDeliveryTime: row.estimated_delivery_time,
    actualPrepTime: row.actual_prep_time ?? undefined,
    specialInstructions: row.special_instructions ?? undefined,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status as RestaurantOrder['paymentStatus'],
    acceptedAt: row.accepted_at ?? undefined,
    preparingAt: row.preparing_at ?? undefined,
    readyAt: row.ready_at ?? undefined,
    pickedUpAt: row.picked_up_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    rating: row.rating ?? undefined,
    review: row.review ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function configToTyped(row: RestaurantConfigRow): RestaurantConfig {
  return {
    id: row.id,
    businessId: row.business_id,
    restaurantName: row.restaurant_name,
    avgPrepTimeMin: row.avg_prep_time_min,
    maxOrdersPerHour: row.max_orders_per_hour,
    acceptsOrders: row.accepts_orders,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    deliveryRadiusKm: row.delivery_radius_km,
    minimumOrder: row.minimum_order,
    deliveryFee: row.delivery_fee,
    autoAcceptOrders: row.auto_accept_orders,
    posIntegrationType: row.pos_integration_type as RestaurantConfig['posIntegrationType'] ?? null,
    posApiKey: row.pos_api_key ?? undefined,
  };
}

async function initRideLyDispatch(orderId: string, restaurantId: string): Promise<void> {
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from('restaurant_configs' as never)
    .select('restaurant_name, delivery_radius_km')
    .eq('id', restaurantId)
    .single() as unknown as {
    data: { restaurant_name: string; delivery_radius_km: number } | null;
  };

  const { data: order } = await supabase
    .from('restaurant_orders' as never)
    .select('delivery_address, delivery_location, estimated_prep_time, delivery_fee, total')
    .eq('id', orderId)
    .single() as unknown as {
    data: {
      delivery_address: string;
      delivery_location: { lat: number; lng: number } | null;
      estimated_prep_time: number;
      delivery_fee: number;
      total: number;
    } | null;
  };

  if (!order) return;

  await supabase.from('ridely_dispatches' as never).insert({
    order_id: orderId,
    restaurant_id: restaurantId,
    restaurant_name: restaurant?.restaurant_name ?? 'Restaurant',
    pickup_address: restaurant?.restaurant_name ?? '',
    delivery_address: order.delivery_address,
    delivery_location: order.delivery_location,
    estimated_prep_time: order.estimated_prep_time,
    delivery_fee: order.delivery_fee,
    order_total: order.total,
    status: 'searching',
    radius_km: restaurant?.delivery_radius_km ?? 5,
  } as never);

  console.log(`[RideLy] Dispatch initiated for order ${orderId}`);
}

export async function createRestaurantOrder(
  params: CreateOrderParams,
): Promise<RestaurantOrder> {
  const supabase = await createClient();

  const { data: configRow } = await supabase
    .from('restaurant_configs' as never)
    .select('*')
    .eq('id', params.restaurantId)
    .single() as unknown as {
    data: RestaurantConfigRow | null;
  };

  if (!configRow) {
    throw new Error('Restaurant not found');
  }

  if (!configRow.accepts_orders) {
    throw new Error('Restaurant is not accepting orders');
  }

  const restaurantConfig = configToTyped(configRow);
  const estimates = await estimatePrepTime(params.items, restaurantConfig);
  const maxPrepTime = Math.max(...estimates.map((e) => e.estimatedTimeMin), 0);

  let subtotal = 0;
  const orderItems = params.items.map((item, index) => {
    const totalPrice = item.unitPrice * item.quantity;
    subtotal += totalPrice;
    return {
      id: `item_${Date.now()}_${index}`,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice,
      notes: item.notes ?? null,
      modifications: item.modifications ?? null,
    };
  });

  const tax = 0;
  const deliveryFee = params.type === 'delivery' ? restaurantConfig.deliveryFee : 0;
  const tip = params.tip ?? 0;
  const total = subtotal + tax + deliveryFee + tip;

  if (subtotal < restaurantConfig.minimumOrder) {
    throw new Error(`Minimum order amount is ${restaurantConfig.minimumOrder}`);
  }

  const estimatedDeliveryTime = params.type === 'delivery' ? maxPrepTime + 20 : maxPrepTime;

  const now = new Date().toISOString();
  const { data: orderRow, error } = await supabase
    .from('restaurant_orders' as never)
    .insert({
      restaurant_id: params.restaurantId,
      customer_id: params.customerId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      items: orderItems,
      subtotal,
      tax,
      delivery_fee: deliveryFee,
      tip,
      total,
      currency_code: 'XAF',
      status: 'received',
      type: params.type,
      delivery_address: params.deliveryAddress ?? null,
      delivery_location: params.deliveryLocation ?? null,
      estimated_prep_time: maxPrepTime,
      estimated_delivery_time: estimatedDeliveryTime,
      special_instructions: params.specialInstructions ?? null,
      payment_method: params.paymentMethod,
      payment_status: 'pending',
      created_at: now,
      updated_at: now,
    } as never)
    .select()
    .single() as unknown as {
    data: RestaurantOrderRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  if (restaurantConfig.autoAcceptOrders) {
    await acceptOrder(orderRow!.id, params.restaurantId);
  }

  if (params.type === 'delivery') {
    await initRideLyDispatch(orderRow!.id, params.restaurantId);
  }

  return rowToOrder(orderRow!);
}

export async function acceptOrder(
  orderId: string,
  restaurantId: string,
): Promise<RestaurantOrder> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('restaurant_orders' as never)
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
    .from('restaurant_orders' as never)
    .update({
      status: 'accepted',
      accepted_at: now,
      updated_at: now,
    } as never)
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: RestaurantOrderRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to accept order: ${error.message}`);
  }

  await addToKitchenDisplay(orderId);

  return rowToOrder(data!);
}

export async function updateOrderStatus(
  orderId: string,
  status: RestaurantOrderStatus,
  metadata?: OrderStatusMetadata,
): Promise<RestaurantOrder> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('restaurant_orders' as never)
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

  if (status === 'driver_assigned' && metadata?.driverId) {
    updateData.driver_id = metadata.driverId;
  }

  if (metadata?.note) {
    updateData.special_instructions = metadata.note;
  }

  const { data, error } = await supabase
    .from('restaurant_orders' as never)
    .update(updateData as never)
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: RestaurantOrderRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  return rowToOrder(data!);
}

export async function markOrderReady(orderId: string): Promise<RestaurantOrder> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('restaurant_orders' as never)
    .select('status, type, restaurant_id')
    .eq('id', orderId)
    .single() as unknown as {
    data: {
      status: RestaurantOrderStatus;
      type: string;
      restaurant_id: string;
    } | null;
  };

  if (!existing) {
    throw new Error('Order not found');
  }

  if (!VALID_STATUS_TRANSITIONS[existing.status]?.includes('ready')) {
    throw new Error(`Cannot mark order as ready from status: ${existing.status}`);
  }

  const now = new Date().toISOString();

  const { data: kitchenItem } = await supabase
    .from('kitchen_display' as never)
    .select('id')
    .eq('order_id', orderId)
    .single() as unknown as { data: { id: string } | null };

  if (kitchenItem) {
    await supabase
      .from('kitchen_display' as never)
      .update({
        status: 'ready',
        actual_ready_at: now,
        updated_at: now,
      } as never)
      .eq('id', kitchenItem.id);
  }

  const { data: prepTime } = await supabase
    .from('restaurant_orders' as never)
    .select('preparing_at')
    .eq('id', orderId)
    .single() as unknown as { data: { preparing_at: string | null } | null };

  let actualPrepTime: number | undefined;
  if (prepTime?.preparing_at) {
    actualPrepTime = Math.round(
      (new Date(now).getTime() - new Date(prepTime.preparing_at).getTime()) / 60000,
    );
  }

  const updateData: Record<string, unknown> = {
    status: 'ready',
    ready_at: now,
    updated_at: now,
  };

  if (actualPrepTime !== undefined) {
    updateData.actual_prep_time = actualPrepTime;
  }

  const { data, error } = await supabase
    .from('restaurant_orders' as never)
    .update(updateData as never)
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: RestaurantOrderRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to mark order ready: ${error.message}`);
  }

  if (existing.type === 'delivery') {
    await initRideLyDispatch(orderId, existing.restaurant_id);
  }

  return rowToOrder(data!);
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy: OrderCancelledBy,
): Promise<RestaurantOrder> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('restaurant_orders' as never)
    .select('status, payment_status, total, payment_method')
    .eq('id', orderId)
    .single() as unknown as {
    data: {
      status: RestaurantOrderStatus;
      payment_status: string;
      total: number;
      payment_method: string;
    } | null;
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
    cancelled_at: now,
    cancel_reason: reason,
    updated_at: now,
  };

  const shouldRefund =
    existing.payment_status === 'paid' &&
    cancelledBy !== 'customer';

  if (shouldRefund) {
    updateData.payment_status = 'refunded';
    updateData.status = 'refunded';

    await supabase.from('payment_refunds' as never).insert({
      order_id: orderId,
      amount: existing.total,
      reason,
      status: 'pending',
      initiated_by: cancelledBy,
      created_at: now,
    } as never);
  }

  const { data, error } = await supabase
    .from('restaurant_orders' as never)
    .update(updateData as never)
    .eq('id', orderId)
    .select()
    .single() as unknown as {
    data: RestaurantOrderRow | null;
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
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('restaurant_orders' as never)
    .select('*', { count: 'exact' })
    .eq('restaurant_id', restaurantId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1) as unknown as {
    data: RestaurantOrderRow[] | null;
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('restaurant_orders' as never)
    .select('*')
    .eq('id', orderId)
    .single() as unknown as {
    data: RestaurantOrderRow | null;
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
  const supabase = await createClient();

  const { data } = await supabase
    .from('restaurant_orders' as never)
    .select('status, accepted_at, preparing_at, ready_at, picked_up_at, delivered_at, cancelled_at, cancel_reason')
    .eq('id', orderId)
    .single() as unknown as {
    data: {
      status: RestaurantOrderStatus;
      accepted_at: string | null;
      preparing_at: string | null;
      ready_at: string | null;
      picked_up_at: string | null;
      delivered_at: string | null;
      cancelled_at: string | null;
      cancel_reason: string | null;
    } | null;
  };

  if (!data) {
    throw new Error('Order not found');
  }

  const timeline: OrderTimelineEvent[] = [
    { status: 'received', timestamp: '' },
  ];

  const statusTimestamps: { status: RestaurantOrderStatus; timestamp: string | null; note?: string }[] = [
    { status: 'accepted', timestamp: data.accepted_at },
    { status: 'preparing', timestamp: data.preparing_at },
    { status: 'ready', timestamp: data.ready_at },
    { status: 'picked_up', timestamp: data.picked_up_at },
    { status: 'delivered', timestamp: data.delivered_at },
  ];

  if (data.cancelled_at) {
    statusTimestamps.push({
      status: 'cancelled',
      timestamp: data.cancelled_at,
      note: data.cancel_reason ?? undefined,
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
