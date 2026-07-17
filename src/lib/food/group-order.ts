// ─── Group Order Service ─────────────────────────────────────
// Allows friends/colleagues to contribute items to a shared
// food order. Each participant adds their items, then the
// order creator confirms and pays for the entire group order.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

// ─── Types ───────────────────────────────────────────────────

interface GroupOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  modifiers?: string[];
}

interface GroupOrderMember {
  userId: string;
  name: string;
  items: GroupOrderItem[];
  subtotal: number;
  joinedAt: string;
  isReady: boolean;
}

interface GroupOrder {
  id: string;
  restaurantId: string;
  restaurantName: string;
  creatorId: string;
  creatorName: string;
  members: GroupOrderMember[];
  status: 'collecting' | 'locked' | 'submitted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  currencyCode: string;
  maxMembers: number;
  inviteCode: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Create Group Order ──────────────────────────────────────

export async function createGroupOrder(
  restaurantId: string,
  creatorId: string,
  maxMembers: number = 10,
): Promise<GroupOrder | null> {
  const supabase = await createClient();

  const inviteCode = generateInviteCode();

  const { data: restaurant } = await (supabase
    .from('businesses')
    .select('id, name')
    .eq('id', restaurantId)
    .single() as any);

  const { data: user } = await (supabase
    .from('users')
    .select('id, name')
    .eq('id', creatorId)
    .single() as any);

  const { data, error } = await (supabase
    .from('group_orders')
    .insert({
      restaurant_id: restaurantId,
      restaurant_name: restaurant?.name ?? 'Restaurant',
      creator_id: creatorId,
      creator_name: user?.name ?? 'Creator',
      status: 'collecting',
      max_members: maxMembers,
      invite_code: inviteCode,
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min deadline
    } as any)
    .select()
    .single() as any);

  if (error || !data) return null;

  // Add creator as first member
  await (supabase.from('group_order_members').insert({
    group_order_id: data.id,
    user_id: creatorId,
    name: user?.name ?? 'Creator',
    items: [],
    subtotal: 0,
    is_ready: false,
  } as any) as any);

  return rowToGroupOrder(data);
}

// ─── Join Group Order ────────────────────────────────────────

export async function joinGroupOrder(
  inviteCode: string,
  userId: string,
): Promise<GroupOrder | null> {
  const supabase = await createClient();

  const { data: groupOrder } = await (supabase
    .from('group_orders')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'collecting')
    .single() as any);

  if (!groupOrder) return null;

  // Check member limit
  const { count } = await (supabase
    .from('group_order_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_order_id', groupOrder.id) as any);

  if ((count ?? 0) >= groupOrder.max_members) return null;

  // Check if already a member
  const { data: existing } = await (supabase
    .from('group_order_members')
    .select('id')
    .eq('group_order_id', groupOrder.id)
    .eq('user_id', userId)
    .single() as any);

  if (existing) return rowToGroupOrder(groupOrder);

  const { data: user } = await (supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single() as any);

  await (supabase.from('group_order_members').insert({
    group_order_id: groupOrder.id,
    user_id: userId,
    name: user?.name ?? 'Member',
    items: [],
    subtotal: 0,
    is_ready: false,
  } as any) as any);

  return rowToGroupOrder(groupOrder);
}

// ─── Add Item to Member's Selection ──────────────────────────

export async function addGroupOrderItem(
  groupOrderId: string,
  userId: string,
  item: GroupOrderItem,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: member } = await (supabase
    .from('group_order_members')
    .select('id, items')
    .eq('group_order_id', groupOrderId)
    .eq('user_id', userId)
    .single() as any);

  if (!member) return false;

  const currentItems = (member.items as GroupOrderItem[]) ?? [];
  const newItems = [...currentItems, { ...item, quantity: item.quantity || 1 }];
  const newSubtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  await (supabase.from('group_order_members') as any)
    .update({
      items: newItems,
      subtotal: newSubtotal,
    })
    .eq('id', member.id);

  // Update group order total
  await recalculateGroupOrderTotal(groupOrderId);

  return true;
}

// ─── Remove Item from Member's Selection ─────────────────────

export async function removeGroupOrderItem(
  groupOrderId: string,
  userId: string,
  itemIndex: number,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: member } = await (supabase
    .from('group_order_members')
    .select('id, items')
    .eq('group_order_id', groupOrderId)
    .eq('user_id', userId)
    .single() as any);

  if (!member) return false;

  const currentItems = (member.items as GroupOrderItem[]) ?? [];
  const newItems = currentItems.filter((_, i) => i !== itemIndex);
  const newSubtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  await (supabase.from('group_order_members') as any)
    .update({
      items: newItems,
      subtotal: newSubtotal,
    })
    .eq('id', member.id);

  await recalculateGroupOrderTotal(groupOrderId);

  return true;
}

// ─── Mark Member as Ready ────────────────────────────────────

export async function markMemberReady(
  groupOrderId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await (supabase.from('group_order_members') as any)
    .update({ is_ready: true })
    .eq('group_order_id', groupOrderId)
    .eq('user_id', userId);

  return !error;
}

// ─── Lock Group Order (Creator Only) ─────────────────────────

export async function lockGroupOrder(
  groupOrderId: string,
  creatorId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: groupOrder } = await (supabase
    .from('group_orders')
    .select('creator_id')
    .eq('id', groupOrderId)
    .single() as any);

  if (!groupOrder || groupOrder.creator_id !== creatorId) return false;

  const { error } = await (supabase.from('group_orders') as any)
    .update({ status: 'locked' })
    .eq('id', groupOrderId);

  return !error;
}

// ─── Get Group Order ─────────────────────────────────────────

export async function getGroupOrder(
  groupOrderId: string,
): Promise<GroupOrder | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase.from('group_orders') as any)
    .select('*')
    .eq('id', groupOrderId)
    .single();

  if (error || !data) return null;

  const { data: members } = await (supabase.from('group_order_members') as any)
    .select('*')
    .eq('group_order_id', groupOrderId);

  const order = rowToGroupOrder(data);
  if (order && members) {
    order.members = members.map((m: Record<string, unknown>) => ({
      userId: m.user_id,
      name: m.name,
      items: (m.items as GroupOrderItem[]) ?? [],
      subtotal: m.subtotal as number,
      joinedAt: m.joined_at as string,
      isReady: m.is_ready as boolean,
    }));
  }

  return order;
}

// ─── Private Helpers ──────────────────────────────────────────

async function recalculateGroupOrderTotal(groupOrderId: string): Promise<void> {
  const supabase = await createClient();

  const { data: members } = await (supabase.from('group_order_members') as any)
    .select('subtotal')
    .eq('group_order_id', groupOrderId);

  if (!members) return;

  const subtotal = members.reduce((sum: number, m: Record<string, unknown>) => sum + ((m.subtotal as number) ?? 0), 0);
  const tax = Math.round(subtotal * 0.08); // 8% default tax
  const deliveryFee = subtotal > 0 ? 500 : 0; // NGN 500 delivery fee
  const total = subtotal + tax + deliveryFee;

  await (supabase.from('group_orders') as any)
    .update({
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      delivery_fee: Math.round(deliveryFee),
      total: Math.round(total),
    })
    .eq('id', groupOrderId);
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function rowToGroupOrder(row: Record<string, unknown>): GroupOrder {
  return {
    id: row.id as string,
    restaurantId: row.restaurant_id as string,
    restaurantName: row.restaurant_name as string,
    creatorId: row.creator_id as string,
    creatorName: row.creator_name as string,
    members: [],
    status: row.status as GroupOrder['status'],
    subtotal: row.subtotal as number,
    tax: row.tax as number,
    deliveryFee: row.delivery_fee as number,
    total: row.total as number,
    currencyCode: (row.currency_code as string) ?? 'NGN',
    maxMembers: row.max_members as number,
    inviteCode: row.invite_code as string,
    deadline: row.deadline as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
