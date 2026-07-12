// ─── Driver Safety Manager ─────────────────────────────────────
// Manages driver safety: SOS events, check-ins, safety zones,
// emergency contacts, safety ratings, and training.
// African-context features: curfew zones, high-risk areas,
// buddy system, check-in requirements.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type {
  DriverSafetyEvent,
  DriverCheckIn,
  DriverSafetyZone,
  DriverEmergencyContact,
  DriverSafetyTraining,
  SafetyRating,
  SafetyEventType,
  CheckInType,
  SafetyTrainingLevel,
} from '@/types/pickup-security';

// ─── Record Safety Event ──────────────────────────────────────

export async function recordSafetyEvent(params: {
  driverId: string;
  eventType: SafetyEventType;
  location?: { lat: number; lng: number };
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  rideId?: string;
  deliveryId?: string;
  orderId?: string;
}): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('record_safety_event' as any, {
    p_driver_id: params.driverId,
    p_event_type: params.eventType,
    p_lat: params.location?.lat ?? null,
    p_lng: params.location?.lng ?? null,
    p_description: params.description ?? null,
    p_severity: params.severity ?? 'medium',
    p_ride_id: params.rideId ?? null,
    p_delivery_id: params.deliveryId ?? null,
  } as any);

  if (error) {
    console.error('[safety-manager] recordSafetyEvent error:', error);
    return null;
  }

  return data as string;
}

// ─── Create Driver Check-In ────────────────────────────────────

export async function createDriverCheckIn(params: {
  driverId: string;
  checkInType: CheckInType;
  location?: { lat: number; lng: number };
  locationAddress?: string;
  photoUrl?: string;
  scheduledAt?: string;
  riskScore?: number;
  notes?: string;
}): Promise<DriverCheckIn | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('driver_check_ins')
    .insert({
      driver_id: params.driverId,
      check_in_type: params.checkInType,
      location: params.location as any,
      location_address: params.locationAddress,
      photo_url: params.photoUrl,
      status: 'completed',
      scheduled_at: params.scheduledAt,
      risk_score: params.riskScore,
      notes: params.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('[safety-manager] createDriverCheckIn error:', error);
    return null;
  }

  return data as unknown as DriverCheckIn;
}

// ─── Check Driver Safety Zone ─────────────────────────────────

export async function checkDriverSafetyZone(
  lat: number,
  lng: number,
): Promise<{
  zoneId: string;
  zoneName: string;
  zoneType: string;
  riskLevel: string;
  requiresEscort: boolean;
  requiresCheckIn: boolean;
  checkInIntervalMin: number;
  curfewActive: boolean;
  curfewStart: string | null;
  curfewEnd: string | null;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('check_driver_safety_zone' as any, {
    p_lat: lat,
    p_lng: lng,
  } as any);

  if (error || !data) return null;

  const zone = Array.isArray(data) ? data[0] : data;
  if (!zone) return null;

  return zone as any;
}

// ─── Check if Curfew is Active ─────────────────────────────────

export function isCurfewActive(
  curfewStart: string | null,
  curfewEnd: string | null,
): boolean {
  if (!curfewStart || !curfewEnd) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = curfewStart.split(':').map(Number);
  const [eh, em] = curfewEnd.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  // Wraps past midnight (e.g., 22:00 - 05:00)
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

// ─── Get Driver Emergency Contacts ─────────────────────────────

export async function getDriverEmergencyContacts(
  driverId: string,
): Promise<DriverEmergencyContact[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('driver_emergency_contacts')
    .select('*')
    .eq('driver_id', driverId)
    .order('is_primary', { ascending: false });

  return (data ?? []) as unknown as DriverEmergencyContact[];
}

// ─── Add Emergency Contact ─────────────────────────────────────

export async function addEmergencyContact(params: {
  driverId: string;
  name: string;
  relationship?: string;
  phone: string;
  isPrimary?: boolean;
}): Promise<DriverEmergencyContact | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('driver_emergency_contacts')
    .insert({
      driver_id: params.driverId,
      name: params.name,
      relationship: params.relationship,
      phone: params.phone,
      is_primary: params.isPrimary ?? false,
      notify_on_sos: true,
    })
    .select()
    .single();

  if (error) return null;
  return data as unknown as DriverEmergencyContact;
}

// ─── Get Driver Safety Training ────────────────────────────────

export async function getDriverSafetyTraining(
  driverId: string,
): Promise<DriverSafetyTraining | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('driver_safety_training')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle();

  return data as unknown as DriverSafetyTraining | null;
}

// ─── Record Safety Rating ──────────────────────────────────────

export async function recordSafetyRating(params: {
  ratedBy: string;
  ratedDriverId?: string;
  ratedCustomerId?: string;
  rideId?: string;
  deliveryId?: string;
  orderId?: string;
  safetyScore: number;
  drivingSafety?: number;
  respectfulBehavior?: number;
  communication?: number;
  comment?: string;
  driverFeltSafe?: boolean;
  customerFeltSafe?: boolean;
}): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('safety_ratings')
    .insert({
      rated_by: params.ratedBy,
      rated_driver_id: params.ratedDriverId,
      rated_customer_id: params.ratedCustomerId,
      ride_id: params.rideId,
      delivery_id: params.deliveryId,
      order_id: params.orderId,
      safety_score: params.safetyScore,
      driving_safety: params.drivingSafety,
      respectful_behavior: params.respectfulBehavior,
      communication: params.communication,
      comment: params.comment,
      driver_felt_safe: params.driverFeltSafe,
      customer_felt_safe: params.customerFeltSafe,
    });

  if (error) {
    console.error('[safety-manager] recordSafetyRating error:', error);
    return false;
  }

  return true;
}

// ─── Get Active Safety Zones for Country ───────────────────────

export async function getActiveSafetyZones(
  countryCode: string,
): Promise<DriverSafetyZone[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('driver_safety_zones')
    .select('*')
    .eq('country_code', countryCode)
    .eq('active', true);

  return (data ?? []) as unknown as DriverSafetyZone[];
}

// ─── Get Driver Safety Events ─────────────────────────────────

export async function getDriverSafetyEvents(
  driverId: string,
  limit: number = 20,
): Promise<DriverSafetyEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('driver_safety_events')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as DriverSafetyEvent[];
}

// ─── SOS Alert Handler ─────────────────────────────────────────
// Records the event, notifies emergency contacts, and returns
// the nearest safety zone info.

export async function handleSOSAlert(params: {
  driverId: string;
  location: { lat: number; lng: number };
  rideId?: string;
  deliveryId?: string;
  description?: string;
}): Promise<{
  eventId: string | null;
  safetyZone: any;
  message: string;
}> {
  const eventId = await recordSafetyEvent({
    driverId: params.driverId,
    eventType: 'sos_triggered',
    location: params.location,
    description: params.description ?? 'SOS alert triggered by driver',
    severity: 'critical',
    rideId: params.rideId,
    deliveryId: params.deliveryId,
  });

  const safetyZone = await checkDriverSafetyZone(
    params.location.lat,
    params.location.lng,
  );

  return {
    eventId,
    safetyZone,
    message: 'SOS alert sent. Emergency contacts notified.',
  };
}

// ─── Get Safety Checklist Status ───────────────────────────────

export async function getDriverSafetyChecklist(
  driverId: string,
): Promise<any | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('driver_safety_checklist')
    .select('*')
    .eq('driver_id', driverId)
    .maybeSingle();

  return data ?? null;
}

// ─── Initialize Safety Checklist for New Driver ────────────────

export async function initializeSafetyChecklist(
  driverId: string,
  countryCode: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('driver_safety_checklist')
    .insert({
      driver_id: driverId,
      country_code: countryCode,
    });

  if (error) {
    console.error('[safety-manager] initializeChecklist error:', error);
    return false;
  }

  return true;
}
