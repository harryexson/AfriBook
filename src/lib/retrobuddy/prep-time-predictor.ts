import { createClient } from '@/lib/supabase/server';
import type { RestaurantConfig, PrepTimeEstimate } from './types';

const PEAK_HOUR_MODIFIERS: Record<number, number> = {
  11: 0.2,
  12: 0.25,
  13: 0.2,
  18: 0.15,
  19: 0.15,
  20: 0.1,
};

const WEEKEND_MODIFIER = 0.1;

const COMPLEXITY_BASE_TIMES: Record<string, number> = {
  simple: 5,
  moderate: 10,
  complex: 18,
};

export async function estimatePrepTime(
  orderItems: { menuItemId: string; quantity: number; notes?: string }[],
  restaurantConfig: RestaurantConfig,
): Promise<PrepTimeEstimate[]> {
  const supabase = await createClient();

  const menuItemIds = [...new Set(orderItems.map((i) => i.menuItemId))];
  const { data: menuItems } = await supabase
    .from('menu_items' as never)
    .select('id, prep_time_min, complexity')
    .in('id', menuItemIds) as unknown as {
    data: { id: string; prep_time_min: number; complexity: string }[] | null;
  };

  const itemMap = new Map(menuItems?.map((m) => [m.id, m]) ?? []);

  const { count: activeOrders } = await supabase
    .from('restaurant_orders' as never)
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantConfig.id)
    .in('status', ['received', 'accepted', 'preparing']) as unknown as { count: number | null };

  const currentLoad = activeOrders ?? 0;
  const now = new Date();
  const currentHour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const estimates: PrepTimeEstimate[] = [];

  for (const item of orderItems) {
    const menuItem = itemMap.get(item.menuItemId);
    const baseTime = menuItem?.prep_time_min ?? COMPLEXITY_BASE_TIMES.moderate;
    const complexity = (menuItem?.complexity as PrepTimeEstimate['complexity']) ?? 'moderate';

    let estimatedTime = baseTime * item.quantity;
    estimatedTime = adjustForCurrentLoad(estimatedTime, currentLoad, restaurantConfig.maxOrdersPerHour);
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
  const supabase = await createClient();
  const { data } = await supabase
    .from('menu_items' as never)
    .select('prep_time_min')
    .eq('id', menuItemId)
    .single() as unknown as { data: { prep_time_min: number } | null };

  return data?.prep_time_min ?? COMPLEXITY_BASE_TIMES.moderate;
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
  const supabase = await createClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data } = await supabase
    .from('restaurant_orders' as never)
    .select('actual_prep_time')
    .eq('restaurant_id', restaurantId)
    .not('actual_prep_time', 'is', null)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(100) as unknown as {
    data: { actual_prep_time: number }[] | null;
  };

  if (!data || data.length === 0) {
    return COMPLEXITY_BASE_TIMES.moderate;
  }

  const total = data.reduce((sum, d) => sum + d.actual_prep_time, 0);
  return Math.round(total / data.length);
}

export function getComplexityBaseTime(
  level: 'simple' | 'moderate' | 'complex',
): number {
  return COMPLEXITY_BASE_TIMES[level];
}
