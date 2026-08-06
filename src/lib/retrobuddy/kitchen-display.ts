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

const KITCHEN_STATUS_MAP: Record<string, 'pending' | 'in_progress' | 'ready'> = {
  accepted: 'pending',
  en_route_to_pickup: 'in_progress',
  at_pickup: 'ready',
};

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

interface FoodDeliveryRow {
  id: string;
  restaurant_id: string;
  items: RestaurantOrderItem[];
  status: string;
  special_instructions: string | null;
  estimated_prep_time: number;
  requested_at: string;
  restaurant_ready_at: string | null;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

function estimatedReadyAt(row: FoodDeliveryRow): string {
  if (row.restaurant_ready_at) return row.restaurant_ready_at;
  const requested = new Date(row.requested_at).getTime();
  return new Date(requested + row.estimated_prep_time * 60000).toISOString();
}

function rowToKitchenItem(row: FoodDeliveryRow): KitchenDisplayItem {
  const status = KITCHEN_STATUS_MAP[row.status] ?? 'pending';
  const readyAt = estimatedReadyAt(row);
  return {
    id: row.id,
    orderId: row.id,
    orderNumber: 0,
    items: row.items,
    priority: calculatePriority(readyAt, status),
    status,
    prepTimeStatus: calculatePrepTimeStatus(readyAt, status),
    estimatedReadyAt: readyAt,
    actualReadyAt: row.restaurant_ready_at ?? undefined,
    assignedTo: (row.metadata?.assigned_staff as string | undefined) ?? undefined,
    specialInstructions: row.special_instructions ?? undefined,
    createdAt: row.requested_at,
    updatedAt: row.updated_at,
  };
}

export async function getKitchenQueue(
  restaurantId: string,
): Promise<KitchenDisplayItem[]> {
  const supabase = await createClient() as any;

  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .in('status', ['accepted', 'en_route_to_pickup', 'at_pickup'])
    .order('requested_at', { ascending: true }) as unknown as {
    data: FoodDeliveryRow[] | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to fetch kitchen queue: ${error.message}`);
  }

  return (data ?? []).map(rowToKitchenItem);
}

export async function addToKitchenDisplay(
  orderId: string,
  _priority: KitchenDisplayPriority = 'normal',
): Promise<KitchenDisplayItem> {
  const supabase = await createClient() as any;

  const { data: order, error } = await supabase
    .from('ridely_food_deliveries')
    .select('*')
    .eq('id', orderId)
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error || !order) {
    throw new Error('Order not found');
  }

  return rowToKitchenItem(order);
}

export async function updateKitchenItemStatus(
  itemId: string,
  status: 'pending' | 'in_progress' | 'ready',
): Promise<KitchenDisplayItem> {
  const supabase = await createClient() as any;

  const orderStatus: string =
    status === 'ready' ? 'at_pickup' : status === 'in_progress' ? 'en_route_to_pickup' : 'accepted';

  const updateData: Record<string, unknown> = {
    status: orderStatus,
    updated_at: new Date().toISOString(),
  };

  if (status === 'ready') {
    updateData.restaurant_ready_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to update kitchen item: ${error.message}`);
  }

  return rowToKitchenItem(data!);
}

export async function assignToStaff(
  itemId: string,
  staffId: string,
): Promise<KitchenDisplayItem> {
  const supabase = await createClient() as any;

  const { data: existing } = await supabase
    .from('ridely_food_deliveries')
    .select('metadata')
    .eq('id', itemId)
    .single() as unknown as {
    data: { metadata: Record<string, unknown> | null } | null;
  };

  if (!existing) {
    throw new Error('Order not found');
  }

  const { data, error } = await supabase
    .from('ridely_food_deliveries')
    .update({
      metadata: {
        ...(existing.metadata ?? {}),
        assigned_staff: staffId,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single() as unknown as {
    data: FoodDeliveryRow | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`Failed to assign item: ${error.message}`);
  }

  return rowToKitchenItem(data!);
}

export async function getPrepTimeStatus(
  orderId: string,
): Promise<{ status: PrepTimeStatus; estimatedReadyAt: string; actualReadyAt?: string; minutesElapsed: number }> {
  const supabase = await createClient() as any;

  const { data } = await supabase
    .from('ridely_food_deliveries')
    .select('*')
    .eq('id', orderId)
    .single() as unknown as { data: FoodDeliveryRow | null };

  if (!data) {
    throw new Error('Order not found');
  }

  const readyAt = estimatedReadyAt(data);
  const status = KITCHEN_STATUS_MAP[data.status] ?? 'pending';
  const now = new Date();
  const estimated = new Date(readyAt);
  const minutesElapsed = Math.round((now.getTime() - estimated.getTime()) / 60000);

  return {
    status: calculatePrepTimeStatus(readyAt, status),
    estimatedReadyAt: readyAt,
    actualReadyAt: data.restaurant_ready_at ?? undefined,
    minutesElapsed,
  };
}

export async function getKitchenStats(restaurantId: string): Promise<KitchenStats> {
  const supabase = await createClient() as any;

  const { data } = await supabase
    .from('ridely_food_deliveries')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .in('status', ['accepted', 'en_route_to_pickup', 'at_pickup', 'picked_up', 'in_transit', 'at_dropoff', 'delivered'])
    .gte('requested_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()) as unknown as {
    data: FoodDeliveryRow[] | null;
  };

  const items = data ?? [];
  const active = items.filter((i) => KITCHEN_STATUS_MAP[i.status]);

  const pendingCount = active.filter((i) => KITCHEN_STATUS_MAP[i.status] === 'pending').length;
  const inProgressCount = active.filter((i) => KITCHEN_STATUS_MAP[i.status] === 'in_progress').length;
  const readyCount = active.filter((i) => KITCHEN_STATUS_MAP[i.status] === 'ready').length;

  const completedItems = items.filter((i) => i.restaurant_ready_at && i.requested_at);
  const averageWaitMinutes =
    completedItems.length > 0
      ? Math.round(
          completedItems.reduce((sum, i) => {
            const wait =
              (new Date(i.restaurant_ready_at!).getTime() - new Date(i.requested_at).getTime()) / 60000;
            return sum + wait;
          }, 0) / completedItems.length,
        )
      : 0;

  const now = new Date();
  const overdueCount = active.filter(
    (i) => i.status !== 'at_pickup' && new Date(estimatedReadyAt(i)) < now,
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
  const supabase = await createClient() as any;

  for (const entry of newOrder) {
    const { data: existing } = await supabase
      .from('ridely_food_deliveries')
      .select('metadata')
      .eq('id', entry.itemId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle() as unknown as {
      data: { metadata: Record<string, unknown> | null } | null;
    };

    if (existing) {
      await supabase
        .from('ridely_food_deliveries')
        .update({
          metadata: {
            ...(existing.metadata ?? {}),
            queue_priority: entry.newPosition,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.itemId)
        .eq('restaurant_id', restaurantId);
    }
  }
}
