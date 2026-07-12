// ─── Pickup Order Manager ──────────────────────────────────────
// Manages pickup order lifecycle: creation, verification, status
// transitions, and secure code-based handoff.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type { PickupOrder, PickupStatus, PickupOrderInsert } from '@/types/pickup-security';

// ─── Create Pickup Order ──────────────────────────────────────

export async function createPickupOrder(params: PickupOrderInsert): Promise<PickupOrder | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pickup_orders')
    .insert({
      order_id: params.orderId,
      business_id: params.businessId,
      customer_id: params.customerId,
      status: 'pending',
      pickup_location: params.pickupLocation as any,
      pickup_address: params.pickupAddress,
      pickup_notes: params.pickupNotes,
      estimated_ready_at: params.estimatedReadyAt,
    })
    .select()
    .single();

  if (error) {
    console.error('[pickup-manager] createPickupOrder error:', error);
    return null;
  }

  return rowToPickupOrder(data);
}

// ─── Update Pickup Status ─────────────────────────────────────

export async function updatePickupStatus(
  orderId: string,
  status: PickupStatus,
): Promise<boolean> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'picked_up') updateData.picked_up_at = new Date().toISOString();
  if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();

  const { error } = await supabase
    .from('pickup_orders')
    .update(updateData)
    .eq('order_id', orderId);

  if (error) {
    console.error('[pickup-manager] updatePickupStatus error:', error);
    return false;
  }

  return true;
}

// ─── Verify Pickup Code & Complete Handoff ─────────────────────

export async function verifyPickupCodeAndHandoff(params: {
  orderId: string;
  code: string;
  collectorName?: string;
  collectorPhone?: string;
  photoUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Call the DB function
  const { data, error } = await supabase.rpc('verify_pickup_code' as any, {
    p_order_id: params.orderId,
    p_code: params.code,
    p_collector_id: null as any,
    p_collector_name: params.collectorName ?? null,
    p_lat: null as any,
    p_lng: null as any,
  } as any);

  if (error) {
    console.error('[pickup-manager] verifyPickupCode error:', error);
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; message: string } | undefined;

  if (!result?.success) {
    return { success: false, error: result?.message ?? 'Verification failed' };
  }

  // If photo provided, update
  if (params.photoUrl) {
    await supabase
      .from('pickup_orders')
      .update({ collection_photo_url: params.photoUrl })
      .eq('order_id', params.orderId);
  }

  return { success: true };
}

// ─── Get Pickup Order by Order ID ─────────────────────────────

export async function getPickupOrderByOrderId(
  orderId: string,
): Promise<PickupOrder | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pickup_orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToPickupOrder(data);
}

// ─── Get Pickup Code for Customer ──────────────────────────────

export async function getPickupCode(orderId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('pickup_orders')
    .select('pickup_code')
    .eq('order_id', orderId)
    .single();

  return (data?.pickup_code as string) ?? null;
}

// ─── Get Customer's Active Pickup Orders ──────────────────────

export async function getCustomerPickups(
  customerId: string,
): Promise<PickupOrder[]> {
  const supabase = await createClient();

  const activeStatuses: PickupStatus[] = ['pending', 'preparing', 'ready_for_pickup'];

  const { data } = await supabase
    .from('pickup_orders')
    .select('*, orders!inner(*)')
    .eq('customer_id', customerId)
    .in('status', activeStatuses)
    .order('estimated_ready_at', { ascending: true });

  return (data ?? []).map(rowToPickupOrder);
}

// ─── Get Vendor's Pickup Orders ────────────────────────────────

export async function getVendorPickups(
  businessId: string,
  status?: PickupStatus,
): Promise<PickupOrder[]> {
  const supabase = await createClient();

  let query = supabase
    .from('pickup_orders')
    .select('*, orders!inner(*)')
    .eq('business_id', businessId);

  if (status) query = query.eq('status', status);

  const { data } = await query.order('created_at', { ascending: false });

  return (data ?? []).map(rowToPickupOrder);
}

// ─── Private ───────────────────────────────────────────────────

function rowToPickupOrder(row: Record<string, unknown>): PickupOrder {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    businessId: row.business_id as string,
    customerId: row.customer_id as string,
    status: row.status as PickupStatus,
    pickupLocation: row.pickup_location as any,
    pickupAddress: row.pickup_address as string | undefined,
    pickupNotes: row.pickup_notes as string | undefined,
    pickupCode: row.pickup_code as string,
    pickupCodeGeneratedAt: row.pickup_code_generated_at as string,
    estimatedReadyAt: row.estimated_ready_at as string | undefined,
    pickedUpAt: row.picked_up_at as string | undefined,
    cancelledAt: row.cancelled_at as string | undefined,
    cancelReason: row.cancel_reason as string | undefined,
    collectionPhotoUrl: row.collection_photo_url as string | undefined,
    collectedBy: row.collected_by as string | undefined,
    collectedByName: row.collected_by_name as string | undefined,
    collectedByPhone: row.collected_by_phone as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
