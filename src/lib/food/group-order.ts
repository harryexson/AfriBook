// ─── Group Order Service ─────────────────────────────────────
// Allows friends/colleagues to contribute items to a shared
// food order. Each participant adds their items, then the
// order creator confirms and pays for the entire group order.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/neon/server';

// NOTE: the real `group_orders` table only has
// (id, organizer_id, business_id, status, share_token, deadline, metadata,
// created_at, updated_at) — no creator_name/restaurant_name/subtotal/tax/
// delivery_fee/total/currency_code/max_members/invite_code columns like the
// original code assumed (those were silently no-op'd under Supabase, since
// nothing here checked `.error`). This module has no other callers in the
// codebase, so column names below are corrected to match the live schema:
// creatorId -> organizer_id, restaurantId -> business_id, inviteCode ->
// share_token, and everything else that has no dedicated column (names,
// totals, max_members) is kept in `metadata` jsonb. Likewise
// `group_order_members` has `status` (varchar) instead of `is_ready`
// (boolean) and `created_at` instead of `joined_at`.

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

  // Was querying a `users` table (doesn't exist — the real table is
  // `profiles`, and its name column is `full_name`, not `name`) — same bug
  // found across ~18 files this migration, see proxy.ts's comment for the
  // full story.
  const { data: user } = await (supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', creatorId)
    .single() as any);

  const { data, error } = await (supabase
    .from('group_orders')
    .insert({
      business_id: restaurantId,
      organizer_id: creatorId,
      status: 'collecting',
      share_token: inviteCode,
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min deadline
      metadata: {
        restaurant_name: restaurant?.name ?? 'Restaurant',
        creator_name: user?.full_name ?? 'Creator',
        subtotal: 0,
        tax: 0,
        delivery_fee: 0,
        total: 0,
        currency_code: 'NGN',
        max_members: maxMembers,
      },
    } as any)
    .select()
    .single() as any);

  if (error || !data) return null;

  // Add creator as first member
  await (supabase.from('group_order_members').insert({
    group_order_id: data.id,
    user_id: creatorId,
    name: user?.full_name ?? 'Creator',
    items: [],
    subtotal: 0,
    status: 'active',
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
    .eq('share_token', inviteCode)
    .eq('status', 'collecting')
    .single() as any);

  if (!groupOrder) return null;

  // Check member limit
  const { count } = await (supabase
    .from('group_order_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_order_id', groupOrder.id) as any);

  const maxMembers = (groupOrder.metadata?.max_members as number | undefined) ?? 10;
  if ((count ?? 0) >= maxMembers) return null;

  // Check if already a member
  const { data: existing } = await (supabase
    .from('group_order_members')
    .select('id')
    .eq('group_order_id', groupOrder.id)
    .eq('user_id', userId)
    .single() as any);

  if (existing) return rowToGroupOrder(groupOrder);

  const { data: user } = await (supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single() as any);

  await (supabase.from('group_order_members').insert({
    group_order_id: groupOrder.id,
    user_id: userId,
    name: user?.full_name ?? 'Member',
    items: [],
    subtotal: 0,
    status: 'active',
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
    .update({ status: 'ready' })
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
    .select('organizer_id')
    .eq('id', groupOrderId)
    .single() as any);

  if (!groupOrder || groupOrder.organizer_id !== creatorId) return false;

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
      joinedAt: m.created_at as string,
      isReady: m.status === 'ready',
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

  const { data: groupOrder } = await (supabase
    .from('group_orders')
    .select('metadata')
    .eq('id', groupOrderId)
    .single() as any);

  const subtotal = members.reduce((sum: number, m: Record<string, unknown>) => sum + ((m.subtotal as number) ?? 0), 0);
  const tax = Math.round(subtotal * 0.08); // 8% default tax
  const deliveryFee = subtotal > 0 ? 500 : 0; // NGN 500 delivery fee
  const total = subtotal + tax + deliveryFee;

  // `group_orders` has no dedicated subtotal/tax/delivery_fee/total columns
  // — these live in `metadata` jsonb alongside the other derived fields.
  await (supabase.from('group_orders') as any)
    .update({
      metadata: {
        ...(groupOrder?.metadata ?? {}),
        subtotal: Math.round(subtotal),
        tax: Math.round(tax),
        delivery_fee: Math.round(deliveryFee),
        total: Math.round(total),
      },
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
  const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: row.id as string,
    restaurantId: row.business_id as string,
    restaurantName: (metadata.restaurant_name as string) ?? 'Restaurant',
    creatorId: row.organizer_id as string,
    creatorName: (metadata.creator_name as string) ?? 'Creator',
    members: [],
    status: row.status as GroupOrder['status'],
    subtotal: (metadata.subtotal as number) ?? 0,
    tax: (metadata.tax as number) ?? 0,
    deliveryFee: (metadata.delivery_fee as number) ?? 0,
    total: (metadata.total as number) ?? 0,
    currencyCode: (metadata.currency_code as string) ?? 'NGN',
    maxMembers: (metadata.max_members as number) ?? 10,
    inviteCode: row.share_token as string,
    deadline: row.deadline as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
