import { createClient } from '@/lib/supabase/client';
import type {
  HostProfile,
  Vehicle,
  VehicleImage,
  VehicleDocument,
  VehicleAvailability,
  VehicleBooking,
  VehicleReview,
  HostPayout,
  VehicleFavorite,
  VehicleSearchFilters,
  VehicleSearchResult,
  VehiclePricingBreakdown,
  VehicleType,
  HostType,
  VehicleVerificationStatus,
  VehicleBookingStatus,
} from '@/types';

export type {
  HostProfile,
  Vehicle,
  VehicleImage,
  VehicleDocument,
  VehicleAvailability,
  VehicleBooking,
  VehicleReview,
  HostPayout,
  VehicleFavorite,
  VehicleSearchFilters,
  VehicleSearchResult,
  VehiclePricingBreakdown,
  VehicleType,
  HostType,
  VehicleVerificationStatus,
  VehicleBookingStatus,
};

const supabase = createClient();

// Helper to convert snake_case keys to camelCase
function toCamelCase<T>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase) as any;
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result as T;
}

// Type assertion helper for Supabase queries
const qb = supabase as any;

// ─── Host Profile Functions ─────────────────────────────────────

export async function getHostProfile(userId: string): Promise<HostProfile | null> {
  const { data, error } = await qb
    .from('host_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toCamelCase<HostProfile>(data);
}

export async function createHostProfile(profile: Omit<HostProfile, 'id' | 'createdAt' | 'updatedAt' | 'totalVehicles' | 'totalBookings' | 'totalEarnings' | 'averageRating' | 'reviewCount'>): Promise<HostProfile> {
  const { data, error } = await qb
    .from('host_profiles')
    .insert({
      ...profile,
      total_vehicles: 0,
      total_bookings: 0,
      total_earnings: 0,
      average_rating: 0,
      review_count: 0,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<HostProfile>(data);
}

export async function updateHostProfile(hostId: string, updates: Partial<HostProfile>): Promise<HostProfile> {
  const { data, error } = await qb
    .from('host_profiles')
    .update(updates as any)
    .eq('id', hostId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<HostProfile>(data);
}

export async function getHostProfileById(hostId: string): Promise<HostProfile | null> {
  const { data, error } = await qb
    .from('host_profiles')
    .select('*')
    .eq('id', hostId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toCamelCase<HostProfile>(data);
}

// ─── Vehicle Functions ──────────────────────────────────────────

export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
  const { data, error } = await qb
    .from('vehicles')
    .select(`
      *,
      vehicle_images (*),
      host_profiles (
        id,
        user_id,
        host_type,
        company_name,
        is_verified,
        average_rating,
        review_count
      )
    `)
    .eq('id', vehicleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toCamelCase<Vehicle>(data);
}

export async function getVehiclesByHost(hostId: string): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('vehicles')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<Vehicle>(v));
}

export async function createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'totalBookings' | 'totalEarnings' | 'averageRating' | 'reviewCount' | 'images'>): Promise<Vehicle> {
  const { data, error } = await qb
    .from('vehicles')
    .insert({
      ...vehicle,
      total_bookings: 0,
      total_earnings: 0,
      average_rating: 0,
      review_count: 0,
      images: [],
    } as any)
    .select()
    .single();

  if (error) throw error;
  
  await qb.rpc('increment_host_vehicle_count', { host_id: vehicle.hostId });
  
  return toCamelCase<Vehicle>(data);
}

export async function updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await qb
    .from('vehicles')
    .update(updates as any)
    .eq('id', vehicleId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<Vehicle>(data);
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const { error } = await qb
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) throw error;
}

export async function searchVehicles(filters: VehicleSearchFilters, page = 1, pageSize = 20): Promise<VehicleSearchResult> {
  let query = qb
    .from('vehicles')
    .select(`
      *,
      vehicle_images!inner (url, type, is_primary),
      host_profiles (
        id,
        host_type,
        company_name,
        is_verified,
        average_rating,
        review_count
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('verification_status', 'approved');

  if (filters.location) {
    query = query.or(`location_city.ilike.%${filters.location}%,location_state.ilike.%${filters.location}%,location_address.ilike.%${filters.location}%`);
  }

  if (filters.vehicleTypes && filters.vehicleTypes.length > 0) {
    query = query.in('vehicle_type', filters.vehicleTypes);
  }

  if (filters.makes && filters.makes.length > 0) {
    query = query.in('make', filters.makes);
  }

  if (filters.priceMin !== undefined) {
    query = query.gte('daily_rate', filters.priceMin);
  }
  if (filters.priceMax !== undefined) {
    query = query.lte('daily_rate', filters.priceMax);
  }

  if (filters.transmission && filters.transmission.length > 0) {
    query = query.in('transmission', filters.transmission);
  }

  if (filters.fuelType && filters.fuelType.length > 0) {
    query = query.in('fuel_type', filters.fuelType);
  }

  if (filters.seats) {
    query = query.gte('seats', filters.seats);
  }

  if (filters.doors) {
    query = query.gte('doors', filters.doors);
  }

  if (filters.hostTypes && filters.hostTypes.length > 0) {
    query = query.in('host_profiles.host_type', filters.hostTypes);
  }

  if (filters.instantBook) {
    query = query.eq('is_instant_book', true);
  }

  if (filters.deliveryAvailable) {
    query = query.eq('delivery_available', true);
  }

  if (filters.minRating) {
    query = query.gte('average_rating', filters.minRating);
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    price_asc: { column: 'daily_rate', ascending: true },
    price_desc: { column: 'daily_rate', ascending: false },
    rating: { column: 'average_rating', ascending: false },
    newest: { column: 'created_at', ascending: false },
    popularity: { column: 'total_bookings', ascending: false },
  };

  const sort = sortMap[filters.sortBy || 'newest'] || sortMap.newest;
  query = query.order(sort.column, { ascending: sort.ascending });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    vehicles: (data || []).map((v: any) => toCamelCase<Vehicle>(v)),
    totalCount: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > to + 1,
  };
}

export async function getFeaturedVehicles(limit = 8): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('vehicles')
    .select(`
      *,
      vehicle_images!inner (url, type, is_primary),
      host_profiles (
        id,
        host_type,
        company_name,
        is_verified,
        average_rating,
        review_count
      )
    `)
    .eq('is_active', true)
    .eq('verification_status', 'approved')
    .gte('average_rating', 4.5)
    .gte('review_count', 5)
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<Vehicle>(v));
}

export async function getVehiclesByType(type: VehicleType, limit = 10): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('vehicles')
    .select(`
      *,
      vehicle_images!inner (url, type, is_primary),
      host_profiles (
        id,
        host_type,
        company_name,
        is_verified,
        average_rating,
        review_count
      )
    `)
    .eq('vehicle_type', type)
    .eq('is_active', true)
    .eq('verification_status', 'approved')
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<Vehicle>(v));
}

// ─── Vehicle Availability Functions ─────────────────────────────

export async function getVehicleAvailability(vehicleId: string, startDate: string, endDate: string): Promise<VehicleAvailability[]> {
  const { data, error } = await qb
    .from('vehicle_availability')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehicleAvailability>(v));
}

export async function setVehicleAvailability(vehicleId: string, dates: Array<{ date: string; isAvailable: boolean; priceOverride?: number; minimumDays?: number; note?: string }>): Promise<VehicleAvailability[]> {
  const { data, error } = await qb
    .from('vehicle_availability')
    .upsert(
      dates.map(d => ({
        vehicle_id: vehicleId,
        date: d.date,
        is_available: d.isAvailable,
        price_override: d.priceOverride,
        minimum_days: d.minimumDays,
        note: d.note,
      } as any)),
      { onConflict: 'vehicle_id,date' }
    )
    .select();

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehicleAvailability>(v));
}

export async function checkVehicleAvailability(vehicleId: string, startDate: string, endDate: string): Promise<boolean> {
  const { data, error } = await qb
    .rpc('check_vehicle_availability', {
      p_vehicle_id: vehicleId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

  if (error) throw error;
  return data;
}

export async function getVehiclePricing(vehicleId: string, startDate: string, endDate: string): Promise<VehiclePricingBreakdown[]> {
  const { data, error } = await qb
    .rpc('get_vehicle_pricing', {
      p_vehicle_id: vehicleId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehiclePricingBreakdown>(v));
}

// ─── Vehicle Images Functions ───────────────────────────────────

export async function getVehicleImages(vehicleId: string): Promise<VehicleImage[]> {
  const { data, error } = await qb
    .from('vehicle_images')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehicleImage>(v));
}

export async function uploadVehicleImage(
  vehicleId: string,
  file: File,
  type: VehicleImage['type'],
  isPrimary = false,
  caption?: string
): Promise<VehicleImage> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${vehicleId}/${type}_${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await qb.storage
    .from('vehicle-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = qb.storage
    .from('vehicle-images')
    .getPublicUrl(fileName);

  if (isPrimary) {
    await qb
      .from('vehicle_images')
      .update({ is_primary: false })
      .eq('vehicle_id', vehicleId)
      .eq('type', type);
  }

  const { data: maxOrderData } = await qb
    .from('vehicle_images')
    .select('display_order')
    .eq('vehicle_id', vehicleId)
    .order('display_order', { ascending: false })
    .limit(1);

  const displayOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

  const { data, error } = await qb
    .from('vehicle_images')
    .insert({
      vehicle_id: vehicleId,
      url: publicUrl,
      type,
      is_primary: isPrimary,
      display_order: displayOrder,
      caption,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleImage>(data);
}

export async function deleteVehicleImage(imageId: string): Promise<void> {
  const { data: image, error: fetchError } = await qb
    .from('vehicle_images')
    .select('url')
    .eq('id', imageId)
    .single();

  if (fetchError) throw fetchError;

  const urlParts = image.url.split('/vehicle-images/');
  if (urlParts.length > 1) {
    const filePath = urlParts[1];
    await qb.storage.from('vehicle-images').remove([filePath]);
  }

  const { error } = await qb
    .from('vehicle_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}

export async function reorderVehicleImages(imageIds: string[]): Promise<void> {
  const updates = imageIds.map((id, index) => 
    qb
      .from('vehicle_images')
      .update({ display_order: index })
      .eq('id', id)
  );
  
  await Promise.all(updates);
}

// ─── Vehicle Documents Functions ────────────────────────────────

export async function getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
  const { data, error } = await qb
    .from('vehicle_documents')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehicleDocument>(v));
}

export async function uploadVehicleDocument(
  vehicleId: string,
  file: File,
  documentType: VehicleDocument['documentType'],
  expiryDate?: string
): Promise<VehicleDocument> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${vehicleId}/${documentType}_${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await qb.storage
    .from('vehicle-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = qb.storage
    .from('vehicle-documents')
    .getPublicUrl(fileName);

  const { data, error } = await qb
    .from('vehicle_documents')
    .insert({
      vehicle_id: vehicleId,
      document_type: documentType,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      expiry_date: expiryDate,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleDocument>(data);
}

export async function verifyVehicleDocument(documentId: string, verifiedBy: string): Promise<VehicleDocument> {
  const { data, error } = await qb
    .from('vehicle_documents')
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
    } as any)
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleDocument>(data);
}

export async function deleteVehicleDocument(documentId: string): Promise<void> {
  const { data: doc, error: fetchError } = await qb
    .from('vehicle_documents')
    .select('file_url')
    .eq('id', documentId)
    .single();

  if (fetchError) throw fetchError;

  const urlParts = doc.file_url.split('/vehicle-documents/');
  if (urlParts.length > 1) {
    const filePath = urlParts[1];
    await qb.storage.from('vehicle-documents').remove([filePath]);
  }

  const { error } = await qb
    .from('vehicle_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

// ─── Vehicle Booking Functions ──────────────────────────────────

export async function createVehicleBooking(booking: any): Promise<VehicleBooking> {
  const { data, error } = await qb
    .from('vehicle_bookings')
    .insert({
      ...booking,
      payment_status: 'pending',
      escrow_status: 'held',
      renter_insurance_verified: false,
      renter_license_verified: false,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleBooking>(data);
}

export async function getVehicleBooking(bookingId: string): Promise<VehicleBooking | null> {
  const { data, error } = await qb
    .from('vehicle_bookings')
    .select(`
      *,
      vehicles (
        id,
        title,
        make,
        model,
        year,
        color,
        images,
        location_address,
        location_city,
        location_state,
        daily_rate,
        host_id
      ),
      host_profiles (
        id,
        user_id,
        host_type,
        company_name,
        contact_person_name,
        contact_person_phone,
        contact_person_email,
        stripe_account_id
      ),
      renter:profiles!vehicle_bookings_renter_id_fkey (
        id,
        name,
        email,
        phone,
        avatar_url
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toCamelCase<VehicleBooking>(data);
}

export async function getUserBookings(userId: string, status?: VehicleBookingStatus): Promise<VehicleBooking[]> {
  let query = qb
    .from('vehicle_bookings')
    .select(`
      *,
      vehicles (
        id,
        title,
        make,
        model,
        year,
        color,
        images,
        location_address,
        location_city,
        location_state,
        daily_rate
      ),
      host_profiles (
        id,
        host_type,
        company_name,
        is_verified
      )
    `)
    .eq('renter_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehicleBooking>(v));
}

export async function getHostBookings(hostId: string, status?: VehicleBookingStatus): Promise<VehicleBooking[]> {
  let query = qb
    .from('vehicle_bookings')
    .select(`
      *,
      vehicles (
        id,
        title,
        make,
        model,
        year,
        color,
        images
      ),
      renter:profiles!vehicle_bookings_renter_id_fkey (
        id,
        name,
        email,
        phone,
        avatar_url
      )
    `)
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehicleBooking>(v));
}

export async function updateBookingStatus(
  bookingId: string,
  status: VehicleBookingStatus,
  userId: string
): Promise<VehicleBooking> {
  const updates: any = { status };
  
  if (status === 'confirmed') {
    updates.host_confirmed_at = new Date().toISOString();
  } else if (status === 'active') {
    updates.pickup_confirmed_at = new Date().toISOString();
  } else if (status === 'completed') {
    updates.dropoff_confirmed_at = new Date().toISOString();
  } else if (status === 'cancelled') {
    updates.cancelled_by = userId;
    updates.cancelled_at = new Date().toISOString();
  }

  const { data, error } = await qb
    .from('vehicle_bookings')
    .update(updates)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleBooking>(data);
}

export async function cancelBooking(bookingId: string, userId: string, reason: string): Promise<VehicleBooking> {
  const { data, error } = await qb
    .from('vehicle_bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_by: userId,
      cancelled_at: new Date().toISOString(),
    } as any)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleBooking>(data);
}

// ─── Vehicle Reviews Functions ──────────────────────────────────

export async function getVehicleReviews(vehicleId: string): Promise<VehicleReview[]> {
  const { data, error } = await qb
    .from('vehicle_reviews')
    .select(`
      *,
      reviewer:profiles!vehicle_reviews_reviewer_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<VehicleReview>(v));
}

export async function createVehicleReview(review: any): Promise<VehicleReview> {
  const { data, error } = await qb
    .from('vehicle_reviews')
    .insert(review as any)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleReview>(data);
}

export async function replyToVehicleReview(reviewId: string, hostId: string, reply: string): Promise<VehicleReview> {
  const { data, error } = await qb
    .from('vehicle_reviews')
    .update({
      host_reply: reply,
      host_replied_at: new Date().toISOString(),
    } as any)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleReview>(data);
}

// ─── Host Payouts Functions ─────────────────────────────────────

export async function getHostPayouts(hostId: string): Promise<HostPayout[]> {
  const { data, error } = await qb
    .from('host_payouts')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((v: any) => toCamelCase<HostPayout>(v));
}

export async function getHostEarningsSummary(hostId: string): Promise<{
  totalEarnings: number;
  pendingEarnings: number;
  availableForPayout: number;
  totalBookings: number;
  averageRating: number;
}> {
  const { data: bookings, error: bookingsError } = await qb
    .from('vehicle_bookings')
    .select('host_earnings, status')
    .eq('host_id', hostId)
    .eq('payment_status', 'completed');

  if (bookingsError) throw bookingsError;

  const completedBookings = bookings?.filter((b: any) => b.status === 'completed') || [];
  const totalEarnings = completedBookings.reduce((sum: number, b: any) => sum + (b.host_earnings || 0), 0);
  
  const { data: payouts, error: payoutsError } = await qb
    .from('host_payouts')
    .select('amount, status')
    .eq('host_id', hostId);

  if (payoutsError) throw payoutsError;

  const paidOut = payouts?.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  const pendingPayouts = payouts?.filter((p: any) => p.status === 'pending' || p.status === 'processing').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const { data: profile } = await qb
    .from('host_profiles')
    .select('total_bookings, average_rating')
    .eq('id', hostId)
    .single();

  return {
    totalEarnings,
    pendingEarnings: pendingPayouts,
    availableForPayout: totalEarnings - paidOut - pendingPayouts,
    totalBookings: profile?.total_bookings || 0,
    averageRating: profile?.average_rating || 0,
  };
}

// ─── Vehicle Favorites Functions ────────────────────────────────

export async function getUserFavorites(userId: string): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('vehicle_favorites')
    .select(`
      vehicle_id,
      vehicles (
        *,
        vehicle_images!inner (url, type, is_primary),
        host_profiles (
          id,
          host_type,
          company_name,
          is_verified,
          average_rating,
          review_count
        )
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return (data?.map((f: any) => f.vehicles).filter(Boolean) as Vehicle[] || []).map((v: any) => toCamelCase<Vehicle>(v));
}

export async function addToFavorites(userId: string, vehicleId: string): Promise<VehicleFavorite> {
  const { data, error } = await qb
    .from('vehicle_favorites')
    .insert({ user_id: userId, vehicle_id: vehicleId } as any)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<VehicleFavorite>(data);
}

export async function removeFromFavorites(userId: string, vehicleId: string): Promise<void> {
  const { error } = await qb
    .from('vehicle_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId);

  if (error) throw error;
}

export async function isFavorite(userId: string, vehicleId: string): Promise<boolean> {
  const { data, error } = await qb
    .from('vehicle_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false;
    throw error;
  }
  return !!data;
}

// ─── Helper Functions ───────────────────────────────────────────

export function getVehicleTypeLabel(type: VehicleType): string {
  const labels: Record<VehicleType, string> = {
    sedan: 'Sedan', suv: 'SUV', truck: 'Truck', van: 'Van', coupe: 'Coupe',
    convertible: 'Convertible', hatchback: 'Hatchback', wagon: 'Wagon',
    minivan: 'Minivan', pickup: 'Pickup', luxury: 'Luxury', electric: 'Electric',
    hybrid: 'Hybrid', motorcycle: 'Motorcycle', scooter: 'Scooter', rv: 'RV',
    trailer: 'Trailer', bus: 'Bus',
  };
  return labels[type] || type;
}

export function getHostTypeLabel(type: HostType): string {
  const labels: Record<HostType, string> = {
    individual: 'Individual', company: 'Company', dealership: 'Dealership', rental_company: 'Rental Company',
  };
  return labels[type] || type;
}

export function getVehicleVerificationStatusLabel(status: VehicleVerificationStatus): string {
  const labels: Record<VehicleVerificationStatus, string> = {
    pending: 'Pending Review', approved: 'Approved', rejected: 'Rejected',
    requires_update: 'Requires Update', suspended: 'Suspended',
  };
  return labels[status] || status;
}

export function getVehicleBookingStatusLabel(status: VehicleBookingStatus): string {
  const labels: Record<VehicleBookingStatus, string> = {
    pending: 'Pending', confirmed: 'Confirmed', active: 'Active',
    completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show', disputed: 'Disputed',
  };
  return labels[status] || status;
}

export function getVehicleImageTypeLabel(type: VehicleImage['type']): string {
  const labels: Record<VehicleImage['type'], string> = {
    exterior_front: 'Front Exterior', exterior_rear: 'Rear Exterior', exterior_side: 'Side Exterior',
    interior_front: 'Front Interior', interior_rear: 'Rear Interior', dashboard: 'Dashboard',
    engine: 'Engine', trunk: 'Trunk', wheels: 'Wheels', damage: 'Damage', other: 'Other',
  };
  return labels[type] || type;
}

export function calculateVehiclePricing(
  dailyRate: number,
  numberOfDays: number,
  weeklyDiscountPercent: number,
  monthlyDiscountPercent: number,
  cleaningFee: number,
  securityDeposit: number,
  deliveryFee: number,
  platformFeePercent: number
): VehiclePricingBreakdown {
  let subtotal = dailyRate * numberOfDays;
  let weeklyDiscount = 0;
  let monthlyDiscount = 0;

  if (numberOfDays >= 28 && monthlyDiscountPercent > 0) {
    monthlyDiscount = subtotal * (monthlyDiscountPercent / 100);
  } else if (numberOfDays >= 7 && weeklyDiscountPercent > 0) {
    weeklyDiscount = subtotal * (weeklyDiscountPercent / 100);
  }

  const subtotalAfterDiscounts = subtotal - weeklyDiscount - monthlyDiscount;
  const platformFeeAmount = subtotalAfterDiscounts * (platformFeePercent / 100);
  const hostEarnings = subtotalAfterDiscounts - platformFeeAmount;
  const totalAmount = subtotalAfterDiscounts + cleaningFee + securityDeposit + deliveryFee + platformFeeAmount;

  return {
    dailyRate, numberOfDays, subtotal, weeklyDiscount, monthlyDiscount,
    cleaningFee, securityDeposit, deliveryFee, platformFeePercent, platformFeeAmount,
    hostEarnings, totalAmount, currencyCode: 'USD',
  };
}

export function formatVehiclePrice(price: number, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
}

export function getVehicleSpecs(vehicle: Vehicle): Array<{ label: string; value: string }> {
  return [
    { label: 'Year', value: vehicle.year.toString() },
    { label: 'Make', value: vehicle.make },
    { label: 'Model', value: vehicle.model },
    { label: 'Type', value: getVehicleTypeLabel(vehicle.vehicleType) },
    { label: 'Transmission', value: vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1) },
    { label: 'Fuel Type', value: vehicle.fuelType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    { label: 'Seats', value: vehicle.seats.toString() },
    { label: 'Doors', value: vehicle.doors.toString() },
    { label: 'Mileage', value: vehicle.mileage.toLocaleString() + ' mi' },
    { label: 'Color', value: vehicle.color },
    { label: 'Condition', value: vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1) },
  ].filter(spec => spec.value);
}