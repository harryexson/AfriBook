import { createClient } from '@/lib/supabase/server';
import type {
  ComplianceScorecard,
  ComplianceViolation,
  ComplianceViolationType,
  TheftPreventionLog,
  DeliveryComplianceTracker,
} from '@/types/pickup-security';

const VIOLATION_PENALTIES: Record<ComplianceViolationType, number> = {
  late_delivery: 5,
  missing_item: 15,
  damaged_item: 10,
  wrong_item: 10,
  theft_suspected: 30,
  route_deviation: 8,
  no_show: 20,
  unprofessional_conduct: 10,
  safety_protocol_violation: 15,
  documentation_missing: 3,
};

export async function createComplianceViolation(params: {
  subjectType: 'driver' | 'vendor' | 'business';
  subjectId: string;
  violationType: ComplianceViolationType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  orderId?: string;
  deliveryId?: string;
  rideId?: string;
  evidenceUrls?: string[];
}): Promise<ComplianceViolation | null> {
  const supabase = await createClient();

  const penalty = VIOLATION_PENALTIES[params.violationType] ?? 0;
  const severityMultiplier =
    params.severity === 'low' ? 0.5
    : params.severity === 'medium' ? 1
    : params.severity === 'high' ? 2
    : 3;

  const { data, error } = await supabase
    .from('compliance_violations')
    .insert({
      subject_type: params.subjectType,
      subject_id: params.subjectId,
      violation_type: params.violationType,
      description: params.description,
      severity: params.severity,
      order_id: params.orderId,
      delivery_id: params.deliveryId,
      ride_id: params.rideId,
      score_penalty: penalty * severityMultiplier,
      evidence_urls: params.evidenceUrls ?? [],
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('[compliance] createViolation error:', error);
    return null;
  }

  return data as unknown as ComplianceViolation;
}

export async function resolveViolation(
  violationId: string,
  params: {
    resolution: 'resolved' | 'dismissed';
    resolvedBy: string;
    resolutionNotes?: string;
  },
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('compliance_violations')
    .update({
      status: params.resolution,
      resolved_at: new Date().toISOString(),
      resolved_by: params.resolvedBy,
      resolution_notes: params.resolutionNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', violationId);

  if (error) {
    console.error('[compliance] resolveViolation error:', error);
    return false;
  }

  return true;
}

export async function getComplianceScorecard(params: {
  subjectType: 'driver' | 'vendor' | 'business';
  subjectId: string;
}): Promise<ComplianceScorecard | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('compliance_scorecards')
    .select('*')
    .eq('subject_type', params.subjectType)
    .eq('subject_id', params.subjectId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as unknown as ComplianceScorecard | null;
}

export async function getOpenViolations(params: {
  subjectType: 'driver' | 'vendor' | 'business';
  subjectId: string;
}): Promise<ComplianceViolation[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('compliance_violations')
    .select('*')
    .eq('subject_type', params.subjectType)
    .eq('subject_id', params.subjectId)
    .in('status', ['open', 'investigating'])
    .order('created_at', { ascending: false });

  return (data ?? []) as unknown as ComplianceViolation[];
}

export async function getComplianceHistory(params: {
  subjectType: 'driver' | 'vendor' | 'business';
  subjectId: string;
  limit?: number;
}): Promise<ComplianceScorecard[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('compliance_scorecards')
    .select('*')
    .eq('subject_type', params.subjectType)
    .eq('subject_id', params.subjectId)
    .order('period_end', { ascending: false })
    .limit(params.limit ?? 12);

  return (data ?? []) as unknown as ComplianceScorecard[];
}

export async function createTheftPreventionRecord(
  orderId: string,
  expectedItems: unknown[],
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_theft_prevention_record' as any, {
    p_order_id: orderId,
    p_expected_items: JSON.stringify(expectedItems),
  } as any);

  if (error) {
    console.error('[compliance] createTheftRecord error:', error);
    return null;
  }

  return data as string;
}

export async function verifyItemIntegrity(params: {
  orderId: string;
  verifiedBy: string;
  role: 'vendor' | 'driver' | 'customer';
  itemsConfirmed?: unknown[];
  hasDiscrepancy?: boolean;
  discrepancyNotes?: string;
  photoUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('verify_item_integrity' as any, {
    p_order_id: params.orderId,
    p_verified_by: params.verifiedBy,
    p_role: params.role,
    p_items_confirmed: params.itemsConfirmed
      ? JSON.stringify(params.itemsConfirmed)
      : null,
    p_has_discrepancy: params.hasDiscrepancy ?? false,
    p_discrepancy_notes: params.discrepancyNotes ?? null,
    p_photo_url: params.photoUrl ?? null,
  } as any);

  if (error) {
    console.error('[compliance] verifyItemIntegrity error:', error);
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; message: string } | undefined;
  return { success: result?.success ?? true };
}

export async function getTheftPreventionRecord(
  orderId: string,
): Promise<TheftPreventionLog | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('theft_prevention_log')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  return data as unknown as TheftPreventionLog | null;
}

export async function createDeliveryComplianceRecord(params: {
  orderId: string;
  deliveryId?: string;
  estimatedDeliveryAt?: string;
}): Promise<string | null> {
  const supabase = await createClient();

  if (params.deliveryId && params.estimatedDeliveryAt) {
    const { data, error } = await supabase.rpc(
      'create_delivery_compliance_record' as any,
      {
        p_order_id: params.orderId,
        p_delivery_id: params.deliveryId,
        p_estimated_delivery_at: params.estimatedDeliveryAt,
      } as any,
    );

    if (error) {
      console.error('[compliance] createDeliveryRecord error:', error);
      return null;
    }

    return data as string;
  }

  const { data, error } = await supabase
    .from('delivery_compliance_tracker')
    .insert({
      order_id: params.orderId,
      delivery_id: params.deliveryId,
      estimated_delivery_at: params.estimatedDeliveryAt,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[compliance] createDeliveryRecord error:', error);
    return null;
  }

  return (data as unknown as DeliveryComplianceTracker).id;
}

export async function updateDeliveryCompliance(
  trackerId: string,
  updates: Partial<{
    acceptedAt: string;
    pickedUpAt: string;
    deliveredAt: string;
    delayMinutes: number;
    delayReason: string;
    delayWaived: boolean;
    itemsConfirmed: boolean;
    itemsDamaged: boolean;
    damageNotes: string;
    pickupPhotoUrl: string;
    deliveryPhotoUrl: string;
    customerSignature: string;
    routeLog: unknown[];
    complianceScore: number;
    status: 'pending' | 'in_transit' | 'completed' | 'flagged' | 'investigating';
  }>,
): Promise<boolean> {
  const supabase = await createClient();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.acceptedAt !== undefined) dbUpdates.accepted_at = updates.acceptedAt;
  if (updates.pickedUpAt !== undefined) dbUpdates.picked_up_at = updates.pickedUpAt;
  if (updates.deliveredAt !== undefined) dbUpdates.delivered_at = updates.deliveredAt;
  if (updates.delayMinutes !== undefined) dbUpdates.delay_minutes = updates.delayMinutes;
  if (updates.delayReason !== undefined) dbUpdates.delay_reason = updates.delayReason;
  if (updates.delayWaived !== undefined) dbUpdates.delay_waived = updates.delayWaived;
  if (updates.itemsConfirmed !== undefined) dbUpdates.items_confirmed = updates.itemsConfirmed;
  if (updates.itemsDamaged !== undefined) dbUpdates.items_damaged = updates.itemsDamaged;
  if (updates.damageNotes !== undefined) dbUpdates.damage_notes = updates.damageNotes;
  if (updates.pickupPhotoUrl !== undefined) dbUpdates.pickup_photo_url = updates.pickupPhotoUrl;
  if (updates.deliveryPhotoUrl !== undefined) dbUpdates.delivery_photo_url = updates.deliveryPhotoUrl;
  if (updates.customerSignature !== undefined) dbUpdates.customer_signature = updates.customerSignature;
  if (updates.routeLog !== undefined) dbUpdates.route_log = updates.routeLog;
  if (updates.complianceScore !== undefined) dbUpdates.compliance_score = updates.complianceScore;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('delivery_compliance_tracker')
    .update(dbUpdates)
    .eq('id', trackerId);

  if (error) {
    console.error('[compliance] updateDeliveryCompliance error:', error);
    return false;
  }

  return true;
}

export async function getDeliveryCompliance(
  orderId: string,
): Promise<DeliveryComplianceTracker | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('delivery_compliance_tracker')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  return data as unknown as DeliveryComplianceTracker | null;
}

export async function getFlaggedDeliveries(): Promise<DeliveryComplianceTracker[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('delivery_compliance_tracker')
    .select('*, orders!inner(*)')
    .in('status', ['flagged', 'investigating'])
    .order('updated_at', { ascending: false });

  return (data ?? []) as unknown as DeliveryComplianceTracker[];
}

export async function getTheftInvestigations(): Promise<TheftPreventionLog[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('theft_prevention_log')
    .select('*, orders!inner(*)')
    .in('status', ['discrepancy_found', 'escalated'])
    .order('updated_at', { ascending: false });

  return (data ?? []) as unknown as TheftPreventionLog[];
}

export async function calculateScore(params: {
  subjectType: 'driver' | 'vendor' | 'business';
  subjectId: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('calculate_compliance_score' as any, {
    p_subject_type: params.subjectType,
    p_subject_id: params.subjectId,
    p_period_start: params.periodStart ?? null,
    p_period_end: params.periodEnd ?? null,
  } as any);

  if (error) {
    console.error('[compliance] calculateScore error:', error);
    return null;
  }

  return data as number;
}

function scorecardStatusToDb(
  status: 'active' | 'probation' | 'suspended' | 'excellent',
): string {
  return status;
}
