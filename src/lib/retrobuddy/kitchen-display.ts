import { createClient } from '@/lib/supabase/server';
import type {
  KitchenDisplayItem,
  KitchenDisplayPriority,
  PrepTimeStatus,
  RestaurantOrderItem,
} from './types';

interface KitchenStats {
  pendingCount: number;
  inProgressCount: number;
  readyCount: number;
  averageWaitMinutes: number;
  overdueCount: number;
}

function calculatePrepTimeStatus(
  estimatedReadyAt: string,
  status: 'pending' | 'in_progress' | 'ready',
): PrepTimeStatus {
  if (status === 'ready') return 'on_time';

  const now = new Date();
  const estimated = new Date(estimatedReadyAt);
  const diffMinutes = (estimated.getTime() - now.getTime()) / 60000;

  if (diffMinutes < -10) return 'critical';
  if (diffMinutes < 0) return 'delayed';
  return 'on_time';
}

function calculatePriority(
  estimatedReadyAt: string,
  status: 'pending' | 'in_progress' | 'ready',
): KitchenDisplayPriority {
  if (status === 'ready') return 'normal';

  const now = new Date();
  const estimated = new Date(estimatedReadyAt);
  const diffMinutes = (estimated.getTime() - now.getTime()) / 60000;

  if (diffMinutes < -5) return 'rush';
  if (diffMinutes < 5) return 'urgent';
  return 'normal';
}

interface KitchenDisplayRow {
  id: string;
  order_id: string;
  order_number: number;
  items: RestaurantOrderItem[];
  priority: KitchenDisplayPriority;
  status: 'pending' | 'in_progress' | 'ready';
  estimated_ready_at: string;
  actual_ready_at: string | null;
  assigned_to: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export async function getKitchenQueue(
  restaurantId: string,
): Promise<KitchenDisplayItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('kitchen_display' as never)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true }) as unknown as {
    data: KitchenDisplayRow[] | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to fetch kitchen queue: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    orderId: item.order_id,
    orderNumber: item.order_number,
    items: item.items,
    priority: calculatePriority(item.estimated_ready_at, item.status),
    status: item.status,
    prepTimeStatus: calculatePrepTimeStatus(item.estimated_ready_at, item.status),
    estimatedReadyAt: item.estimated_ready_at,
    actualReadyAt: item.actual_ready_at ?? undefined,
    assignedTo: item.assigned_to ?? undefined,
    specialInstructions: item.special_instructions ?? undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function addToKitchenDisplay(
  orderId: string,
  priority: KitchenDisplayPriority = 'normal',
): Promise<KitchenDisplayItem> {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('restaurant_orders' as never)
    .select('id, restaurant_id, items, estimated_prep_time, special_instructions')
    .eq('id', orderId)
    .single() as unknown as {
    data: {
      id: string;
      restaurant_id: string;
      items: RestaurantOrderItem[];
      estimated_prep_time: number;
      special_instructions: string | null;
    } | null;
  };

  if (!order) {
    throw new Error('Order not found');
  }

  const { count: orderNumber } = await supabase
    .from('kitchen_display' as never)
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', order.restaurant_id) as unknown as { count: number | null };

  const now = new Date();
  const estimatedReadyAt = new Date(now.getTime() + order.estimated_prep_time * 60000);

  const insertPayload = {
    order_id: orderId,
    restaurant_id: order.restaurant_id,
    order_number: (orderNumber ?? 0) + 1,
    items: order.items,
    priority,
    status: 'pending' as const,
    estimated_ready_at: estimatedReadyAt.toISOString(),
    special_instructions: order.special_instructions,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabase
    .from('kitchen_display' as never)
    .insert(insertPayload as never)
    .select()
    .single() as unknown as {
    data: KitchenDisplayRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to add to kitchen display: ${error.message}`);
  }

  return {
    id: data!.id,
    orderId: data!.order_id,
    orderNumber: data!.order_number,
    items: data!.items,
    priority: data!.priority,
    status: data!.status,
    prepTimeStatus: calculatePrepTimeStatus(estimatedReadyAt.toISOString(), 'pending'),
    estimatedReadyAt: data!.estimated_ready_at,
    specialInstructions: data!.special_instructions ?? undefined,
    createdAt: data!.created_at,
    updatedAt: data!.updated_at,
  };
}

export async function updateKitchenItemStatus(
  itemId: string,
  status: 'pending' | 'in_progress' | 'ready',
): Promise<KitchenDisplayItem> {
  const supabase = await createClient();

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (status === 'ready') {
    updateData.actual_ready_at = now;
  }

  const { data, error } = await supabase
    .from('kitchen_display' as never)
    .update(updateData as never)
    .eq('id', itemId)
    .select()
    .single() as unknown as {
    data: KitchenDisplayRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to update kitchen item: ${error.message}`);
  }

  return {
    id: data!.id,
    orderId: data!.order_id,
    orderNumber: data!.order_number,
    items: data!.items,
    priority: data!.priority,
    status: data!.status,
    prepTimeStatus: calculatePrepTimeStatus(data!.estimated_ready_at, data!.status),
    estimatedReadyAt: data!.estimated_ready_at,
    actualReadyAt: data!.actual_ready_at ?? undefined,
    assignedTo: data!.assigned_to ?? undefined,
    specialInstructions: data!.special_instructions ?? undefined,
    createdAt: data!.created_at,
    updatedAt: data!.updated_at,
  };
}

export async function assignToStaff(
  itemId: string,
  staffId: string,
): Promise<KitchenDisplayItem> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('kitchen_display' as never)
    .update({
      assigned_to: staffId,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', itemId)
    .select()
    .single() as unknown as {
    data: KitchenDisplayRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to assign item: ${error.message}`);
  }

  return {
    id: data!.id,
    orderId: data!.order_id,
    orderNumber: data!.order_number,
    items: data!.items,
    priority: data!.priority,
    status: data!.status,
    prepTimeStatus: calculatePrepTimeStatus(data!.estimated_ready_at, data!.status),
    estimatedReadyAt: data!.estimated_ready_at,
    actualReadyAt: data!.actual_ready_at ?? undefined,
    assignedTo: data!.assigned_to ?? undefined,
    specialInstructions: data!.special_instructions ?? undefined,
    createdAt: data!.created_at,
    updatedAt: data!.updated_at,
  };
}

export async function getPrepTimeStatus(
  orderId: string,
): Promise<{ status: PrepTimeStatus; estimatedReadyAt: string; actualReadyAt?: string; minutesElapsed: number }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('kitchen_display' as never)
    .select('estimated_ready_at, actual_ready_at, status')
    .eq('order_id', orderId)
    .single() as unknown as {
    data: {
      estimated_ready_at: string;
      actual_ready_at: string | null;
      status: 'pending' | 'in_progress' | 'ready';
    } | null;
  };

  if (!data) {
    throw new Error('Kitchen display item not found');
  }

  const now = new Date();
  const estimated = new Date(data.estimated_ready_at);
  const minutesElapsed = Math.round((now.getTime() - estimated.getTime()) / 60000);

  return {
    status: calculatePrepTimeStatus(data.estimated_ready_at, data.status),
    estimatedReadyAt: data.estimated_ready_at,
    actualReadyAt: data.actual_ready_at ?? undefined,
    minutesElapsed,
  };
}

export async function getKitchenStats(restaurantId: string): Promise<KitchenStats> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('kitchen_display' as never)
    .select('status, estimated_ready_at, actual_ready_at, created_at')
    .eq('restaurant_id', restaurantId)
    .in('status', ['pending', 'in_progress', 'ready'])
    .gte('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()) as unknown as {
    data: {
      status: string;
      estimated_ready_at: string;
      actual_ready_at: string | null;
      created_at: string;
    }[] | null;
  };

  const items = data ?? [];

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const readyCount = items.filter((i) => i.status === 'ready').length;

  const completedItems = items.filter(
    (i) => i.status === 'ready' && i.actual_ready_at && i.created_at,
  );
  const averageWaitMinutes =
    completedItems.length > 0
      ? Math.round(
          completedItems.reduce((sum, i) => {
            const wait =
              (new Date(i.actual_ready_at!).getTime() - new Date(i.created_at).getTime()) / 60000;
            return sum + wait;
          }, 0) / completedItems.length,
        )
      : 0;

  const now = new Date();
  const overdueCount = items.filter(
    (i) =>
      i.status !== 'ready' && new Date(i.estimated_ready_at) < now,
  ).length;

  return {
    pendingCount,
    inProgressCount,
    readyCount,
    averageWaitMinutes,
    overdueCount,
  };
}

export async function reorderQueue(
  restaurantId: string,
  newOrder: { itemId: string; newPosition: number }[],
): Promise<void> {
  const supabase = await createClient();

  for (const entry of newOrder) {
    await supabase
      .from('kitchen_display' as never)
      .update({
        priority: entry.newPosition <= 2 ? 'rush' : entry.newPosition <= 5 ? 'urgent' : 'normal',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', entry.itemId)
      .eq('restaurant_id', restaurantId);
  }
}
