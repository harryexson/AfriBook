import { createClient } from '@/lib/supabase/server';

const PEAK_HOUR_MODIFIERS: Record<number, number> = {
  11: 0.2,
  12: 0.25,
  13: 0.2,
  18: 0.15,
  19: 0.15,
  20: 0.1,
};

const WEEKEND_MODIFIER = 0.1;

const DEFAULT_BASE_TIME = 10;

export interface PrepTimeEstimate {
  menuItemId: string;
  baseTimeMin: number;
  complexity: 'simple' | 'moderate' | 'complex';
  currentLoad: number;
  estimatedTimeMin: number;
}

export async function estimatePrepTime(
  orderItems: { menuItemId: string; quantity: number; notes?: string }[],
  restaurantId: string,
  basePrepTime: number = DEFAULT_BASE_TIME,
): Promise<PrepTimeEstimate[]> {
  const supabase = await createClient() as any;

  const menuItemIds = [...new Set(orderItems.map((i) => i.menuItemId))];
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, preparation_time')
    .in('id', menuItemIds);

  const itemMap = new Map(
    (menuItems ?? []).map((m: { id: string; preparation_time: number | null }) => [
      m.id,
      m.preparation_time ?? basePrepTime,
    ]),
  );

  const { count: activeOrders } = await supabase
    .from('ridely_food_deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .in('status', ['requesting', 'searching', 'matched', 'accepted', 'en_route_to_pickup']);

  const currentLoad = activeOrders ?? 0;
  const now = new Date();
  const currentHour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const estimates: PrepTimeEstimate[] = [];

  for (const item of orderItems) {
    const baseTime = itemMap.get(item.menuItemId) ?? basePrepTime;
    const complexity: PrepTimeEstimate['complexity'] = baseTime >= 18 ? 'complex' : baseTime >= 10 ? 'moderate' : 'simple';

    let estimatedTime = baseTime * item.quantity;
    estimatedTime = adjustForCurrentLoad(estimatedTime, currentLoad, 12);
    estimatedTime = adjustForTimeOfDay(estimatedTime, currentHour);
    if (isWeekend) {
      estimatedTime = Math.ceil(estimatedTime * (1 + WEEKEND_MODIFIER));
    }

    estimates.push({
      menuItemId: item.menuItemId,
      baseTimeMin: baseTime,
      complexity,
      currentLoad,
      estimatedTimeMin: Math.round(estimatedTime),
    });
  }

  return estimates;
}

export async function getMenuItemPrepTime(menuItemId: string): Promise<number> {
  const supabase = await createClient() as any;
  const { data } = await supabase
    .from('menu_items')
    .select('preparation_time')
    .eq('id', menuItemId)
    .single();

  return data?.preparation_time ?? DEFAULT_BASE_TIME;
}

export function calculateComplexityScore(
  items: { quantity: number; notes?: string; modifications?: unknown[] }[],
): { score: number; level: 'simple' | 'moderate' | 'complex' } {
  let score = 0;

  for (const item of items) {
    score += item.quantity;
    if (item.notes && item.notes.length > 0) score += 1;
    if (item.modifications && item.modifications.length > 0) {
      score += item.modifications.length;
    }
  }

  if (items.length > 5) score += 2;

  let level: 'simple' | 'moderate' | 'complex' = 'simple';
  if (score > 8) level = 'complex';
  else if (score > 3) level = 'moderate';

  return { score, level };
}

export function adjustForCurrentLoad(
  baseTime: number,
  activeOrders: number,
  maxCapacity: number,
): number {
  if (maxCapacity <= 0) return baseTime;

  const loadRatio = activeOrders / maxCapacity;

  if (loadRatio >= 1.0) return Math.ceil(baseTime * 1.5);
  if (loadRatio >= 0.8) return Math.ceil(baseTime * 1.3);
  if (loadRatio >= 0.6) return Math.ceil(baseTime * 1.15);
  if (loadRatio <= 0.2) return Math.ceil(baseTime * 0.9);

  return baseTime;
}

export function adjustForTimeOfDay(baseTime: number, hour: number): number {
  const modifier = PEAK_HOUR_MODIFIERS[hour];
  if (modifier) {
    return Math.ceil(baseTime * (1 + modifier));
  }
  return baseTime;
}

export async function getHistoricalAveragePrepTime(
  restaurantId: string,
  days: number = 30,
): Promise<number> {
  const supabase = await createClient() as any;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data } = await supabase
    .from('ridely_food_deliveries')
    .select('requested_at, restaurant_ready_at')
    .eq('restaurant_id', restaurantId)
    .not('restaurant_ready_at', 'is', null)
    .gte('requested_at', cutoffDate.toISOString())
    .order('requested_at', { ascending: false })
    .limit(100);

  if (!data || data.length === 0) {
    return DEFAULT_BASE_TIME;
  }

  let total = 0;
  let count = 0;
  for (const d of data) {
    if (d.restaurant_ready_at) {
      total += (new Date(d.restaurant_ready_at).getTime() - new Date(d.requested_at).getTime()) / 60000;
      count += 1;
    }
  }

  return count > 0 ? Math.round(total / count) : DEFAULT_BASE_TIME;
}
