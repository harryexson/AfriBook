// ─── Delivery Manager ─────────────────────────────────────────
// Delivery lifecycle management: creation, status transitions,
// proof-of-delivery, cancellation, and history.
//
// NOTE: DeliveryStatus = "requesting" | "searching" | "matched" | "accepted"
//       | "en_route_to_pickup" | "at_pickup" | "picked_up" | "in_transit"
//       | "at_dropoff" | "delivered" | "cancelled"
//       CancellationActor = "rider" | "driver" | "system"
//       DeliveryType = "package" | "food" | "grocery" | "pharmacy" | "document"
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type {
  DeliveryRequest,
  DeliveryStatus,
  DeliveryType,
  GeoLocation,
  PackageDetails,
  ProofOfDelivery,
  CancellationActor,
} from '@/types/ridely';
import type { DbGeoLocation } from '@/types';
import { DELIVERY_STATUS_TRANSITIONS, DELIVERY_TYPE_CONFIG } from '@/types/ridely';
import { dispatchDelivery } from './dispatch-engine';
import { getPricingEstimate } from './surge-pricing';
import { COUNTRIES } from '@/lib/localization/countries';

// ─── Cancellation Fee Configs by Country ──────────────────────

const DEFAULT_CANCELLATION_FEES = { beforeAssignment: 0, afterAssignment: 2, afterPickup: 5 };

// ─── Create Delivery Request ──────────────────────────────────

export async function createDeliveryRequest(params: {
  customerId: string;
  deliveryType: DeliveryType;
  pickup: GeoLocation;
  pickupAddress: string;
  destination: GeoLocation;
  destinationAddress: string;
  packageDetails: PackageDetails;
  countryCode: string;
  paymentType: DeliveryRequest['paymentType'];
}): Promise<DeliveryRequest | null> {
  const supabase = await createClient();
  const country = COUNTRIES[params.countryCode];
  const currencyCode = country?.currency.code ?? 'USD';

  const estimate = await getPricingEstimate(
    params.pickup,
    params.destination,
    'economy',
    params.countryCode,
  );

  const typeConfig = DELIVERY_TYPE_CONFIG[params.deliveryType] ?? DELIVERY_TYPE_CONFIG.package;
  const typeMultiplier = typeConfig.baseFare / DELIVERY_TYPE_CONFIG.package.baseFare;

  const adjustedTotal = round2(estimate.estimatedTotal * typeMultiplier);

  const { data, error } = await supabase
    .from('delivery_requests')
    .insert({
      customer_id: params.customerId,
      delivery_type: params.deliveryType,
      status: 'requesting',
      pickup_location: params.pickup as unknown as DbGeoLocation,
      pickup_address: params.pickupAddress,
      pickup_contact_name: '',
      pickup_contact_phone: '',
      destination_location: params.destination as unknown as DbGeoLocation,
      destination_address: params.destinationAddress,
      destination_contact_name: '',
      destination_contact_phone: '',
      package_description: params.packageDetails.description,
      package_weight: params.packageDetails.weight ?? 0,
      package_value: 0,
      distance_km: estimate.estimatedDistanceKm,
      estimated_duration_min: estimate.estimatedDurationMin,
      estimated_fare: adjustedTotal,
      surge_multiplier: estimate.surgeMultiplier,
      payment_type: params.paymentType,
      signature_required: params.packageDetails.fragile,
      currency: currencyCode,
      metadata: {
        pricing: {
          baseFare: estimate.baseFare,
          perKmRate: 0,
          perMinRate: 0,
          minimumFare: 0,
          surgeMultiplier: estimate.surgeMultiplier,
          estimatedFare: adjustedTotal,
          currencyCode,
        },
      } as Record<string, unknown>,
    } as any)
    .select()
    .single();

  if (error || !data) {
    console.error('[delivery-manager] createDeliveryRequest error:', error);
    return null;
  }

  const delivery = rowToDeliveryRequest(data);

  dispatchDelivery(delivery).catch((err) =>
    console.error('[delivery-manager] dispatchDelivery failed:', err),
  );

  return delivery;
}

// ─── Update Delivery Status ───────────────────────────────────

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('delivery_requests')
    .select('status')
    .eq('id', deliveryId)
    .single();

  if (!current) return false;

  const currentStatus = current.status as DeliveryStatus;
  const allowed = DELIVERY_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(status)) {
    console.error(
      `[delivery-manager] Invalid transition: ${currentStatus} -> ${status}`,
    );
    return false;
  }

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'delivered') updatePayload.delivered_at = new Date().toISOString();
  if (status === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();
  if (status === 'picked_up') updatePayload.picked_up_at = new Date().toISOString();
  if (metadata) updatePayload.metadata = metadata;

  const { error } = await supabase
    .from('delivery_requests')
    .update(updatePayload as any)
    .eq('id', deliveryId);

  if (error) {
    console.error('[delivery-manager] updateDeliveryStatus error:', error);
    return false;
  }

  return true;
}

// ─── Cancel Delivery ──────────────────────────────────────────

export async function cancelDelivery(
  deliveryId: string,
  customerId: string,
  reason: string,
): Promise<{ success: boolean; cancellationFee: number; error?: string }> {
  const supabase = await createClient();

  const { data: delivery } = await supabase
    .from('delivery_requests')
    .select('*')
    .eq('id', deliveryId)
    .eq('customer_id', customerId)
    .single();

  if (!delivery) {
    return { success: false, cancellationFee: 0, error: 'Delivery not found' };
  }

  const status = delivery.status as DeliveryStatus;
  if (status === 'delivered' || status === 'cancelled') {
    return { success: false, cancellationFee: 0, error: 'Delivery cannot be cancelled' };
  }

  const cancellationFee = calculateCancellationFee(status);

  const { error } = await supabase
    .from('delivery_requests')
    .update({
      status: 'cancelled',
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', deliveryId);

  if (error) {
    console.error('[delivery-manager] cancelDelivery error:', error);
    return { success: false, cancellationFee: 0, error: error.message };
  }

  if (delivery.driver_id) {
    await supabase
      .from('drivers')
      .update({ status: 'available' } as any)
      .eq('id', delivery.driver_id);
  }

  return { success: true, cancellationFee };
}

// ─── Get Active Delivery ──────────────────────────────────────

export async function getActiveDelivery(
  customerId: string,
): Promise<DeliveryRequest | null> {
  const supabase = await createClient();

  const activeStatuses = [
    'requesting', 'searching', 'matched', 'accepted',
    'en_route_to_pickup', 'at_pickup', 'picked_up', 'in_transit', 'at_dropoff',
  ];

  const { data, error } = await supabase
    .from('delivery_requests')
    .select('*')
    .eq('customer_id', customerId)
    .in('status', activeStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToDeliveryRequest(data);
}

// ─── Get Delivery History ─────────────────────────────────────

export async function getDeliveryHistory(
  customerId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ deliveries: DeliveryRequest[]; total: number; hasMore: boolean }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { count } = await supabase
    .from('delivery_requests')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .in('status', ['delivered', 'cancelled']);

  const { data, error } = await supabase
    .from('delivery_requests')
    .select('*')
    .eq('customer_id', customerId)
    .in('status', ['delivered', 'cancelled'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return { deliveries: [], total: 0, hasMore: false };

  return {
    deliveries: data.map(rowToDeliveryRequest),
    total: count ?? 0,
    hasMore: offset + limit < (count ?? 0),
  };
}

// ─── Confirm Delivery (Proof of Delivery) ─────────────────────

export async function confirmDelivery(
  deliveryId: string,
  signature?: string,
  photoUrl?: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: delivery } = await supabase
    .from('delivery_requests')
    .select('status')
    .eq('id', deliveryId)
    .single();

  if (!delivery || delivery.status !== 'in_transit') return false;

  const updatePayload: Record<string, unknown> = {
    status: 'delivered',
    delivered_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (signature) updatePayload.signature = signature;
  if (photoUrl) updatePayload.photo_url = photoUrl;

  const { error } = await supabase
    .from('delivery_requests')
    .update(updatePayload as any)
    .eq('id', deliveryId);

  if (error) {
    console.error('[delivery-manager] confirmDelivery error:', error);
    return false;
  }

  return true;
}

// ─── Get Delivery By ID ───────────────────────────────────────

export async function getDeliveryById(
  deliveryId: string,
): Promise<DeliveryRequest | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('delivery_requests')
    .select('*')
    .eq('id', deliveryId)
    .single();

  if (error || !data) return null;
  return rowToDeliveryRequest(data);
}

// ─── Private Helpers ──────────────────────────────────────────

function calculateCancellationFee(status: DeliveryStatus): number {
  const fees = DEFAULT_CANCELLATION_FEES;

  const postPickupStatuses: DeliveryStatus[] = ['picked_up', 'in_transit', 'at_dropoff'];
  if (postPickupStatuses.includes(status)) return fees.afterPickup;

  const assignedStatuses: DeliveryStatus[] = ['matched', 'accepted', 'en_route_to_pickup', 'at_pickup'];
  if (assignedStatuses.includes(status)) return fees.afterAssignment;

  return fees.beforeAssignment;
}

function rowToDeliveryRequest(row: Record<string, unknown>): DeliveryRequest {
  const pickupLoc = row.pickup_location as GeoLocation;
  const destLoc = row.destination_location as GeoLocation;

  const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
  const pricingMeta = (metadata.pricing as Record<string, unknown> | undefined) ?? {};

  const proofOfDelivery: ProofOfDelivery | undefined =
    row.signature || row.photo_url
      ? {
          signature: row.signature as string | undefined,
          photoUrl: row.photo_url as string | undefined,
        }
      : undefined;

  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    driverId: row.driver_id as string | undefined,
    deliveryType: row.delivery_type as DeliveryType,
    status: row.status as DeliveryStatus,
    pickup: pickupLoc,
    pickupAddress: row.pickup_address as string,
    destination: destLoc,
    destinationAddress: row.destination_address as string,
    packageDetails: {
      description: row.package_description as string,
      weight: row.package_weight as number | undefined,
      dimensions: undefined,
      fragile: false,
      specialInstructions: row.special_instructions as string | undefined,
    },
    distanceKm: row.distance_km as number,
    durationMin: row.estimated_duration_min as number,
    pricing: {
      baseFare: (pricingMeta.baseFare as number) ?? (row.estimated_fare as number),
      perKmRate: (pricingMeta.perKmRate as number) ?? 0,
      perMinRate: (pricingMeta.perMinRate as number) ?? 0,
      minimumFare: (pricingMeta.minimumFare as number) ?? 0,
      surgeMultiplier: (pricingMeta.surgeMultiplier as number) ?? (row.surge_multiplier as number),
      estimatedFare: (pricingMeta.estimatedFare as number) ?? (row.estimated_fare as number),
      currencyCode: (pricingMeta.currencyCode as string) ?? ((row.currency as string) ?? 'USD'),
    },
    paymentType: row.payment_type as DeliveryRequest['paymentType'],
    cancelledBy: row.cancelled_by as CancellationActor | undefined,
    cancelReason: row.cancel_reason as string | undefined,
    cancellationFee: row.cancellation_fee as number | undefined,
    proofOfDelivery,
    metadata: {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
