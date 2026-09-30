import { createClient } from '@/lib/neon/client';
import type {
  Vehicle,
  VehicleAvailability,
  VehicleBooking,
  VehicleBookingStatus,
  VehicleReview,
  VehicleFavorite,
  VehicleSearchFilters,
  VehicleSearchResult,
  VehiclePricingBreakdown,
  VehicleType,
  ApiKey,
  ApiKeyScope,
  ApiKeyUsageLog,
  WebhookEndpoint,
  WebhookDeliveryLog,
  ExternalPlatformConnection,
} from '@/types';

export type {
  Vehicle,
  VehicleAvailability,
  VehicleBooking,
  VehicleBookingStatus,
  VehicleReview,
  VehicleFavorite,
  VehicleSearchFilters,
  VehicleSearchResult,
  VehiclePricingBreakdown,
  VehicleType,
  ApiKey,
  ApiKeyScope,
  ApiKeyUsageLog,
  WebhookEndpoint,
  WebhookDeliveryLog,
  ExternalPlatformConnection,
};

const supabase = createClient();

// Neon's Data API (accessed here via the SupabaseAuthAdapter-backed browser
// client) speaks the same PostgREST-style builder as supabase-js, but its
// TypeScript types aren't generated for this project's schema, hence the
// `as any` at each call site — the same pattern used by every other
// browser-side data module in this app (see src/app/vendor/restaurant/*).
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

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

const qb = supabase as any;

// ─── Vehicle CRUD ─────────────────────────────────────────────────

export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
  const { data, error } = await qb.from('rental_vehicles').select('*').eq('id', vehicleId).single();
  if (error) return null;
  return toCamelCase<Vehicle>(data);
}

export async function getVehiclesByHost(hostId: string): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('rental_vehicles')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return toCamelCase<Vehicle[]>(data);
}

export async function createVehicle(
  hostId: string,
  input: Partial<Omit<Vehicle, 'id' | 'hostId' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>>,
): Promise<Vehicle> {
  const row = toSnakeCase({ ...input, hostId });
  const { data, error } = await qb.from('rental_vehicles').insert(row).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to create vehicle');
  return toCamelCase<Vehicle>(data);
}

export async function updateVehicle(
  vehicleId: string,
  updates: Partial<Omit<Vehicle, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>,
): Promise<Vehicle> {
  const row = toSnakeCase(updates);
  const { data, error } = await qb.from('rental_vehicles').update(row).eq('id', vehicleId).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to update vehicle');
  return toCamelCase<Vehicle>(data);
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const { error } = await qb.from('rental_vehicles').delete().eq('id', vehicleId);
  if (error) throw new Error(error.message ?? 'Failed to delete vehicle');
}

// ─── Search ───────────────────────────────────────────────────────

export async function searchVehicles(
  filters: VehicleSearchFilters,
  page = 1,
  pageSize = 20,
): Promise<VehicleSearchResult> {
  let query = qb.from('rental_vehicles').select('*', { count: 'exact' }).eq('status', 'published');

  if (filters.location) query = query.ilike('city', `%${filters.location}%`);
  if (filters.vehicleTypes?.length) query = query.in('vehicle_type', filters.vehicleTypes);
  if (filters.makes?.length) query = query.in('make', filters.makes);
  if (filters.priceMin !== undefined) query = query.gte('price_per_day', filters.priceMin);
  if (filters.priceMax !== undefined) query = query.lte('price_per_day', filters.priceMax);
  if (filters.transmission?.length) query = query.in('transmission', filters.transmission);
  if (filters.fuelType?.length) query = query.in('fuel_type', filters.fuelType);
  if (filters.seats !== undefined) query = query.gte('seats', filters.seats);
  if (filters.minRating !== undefined) query = query.gte('rating', filters.minRating);

  switch (filters.sortBy) {
    case 'price_asc':
      query = query.order('price_per_day', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_per_day', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'popularity':
      query = query.order('review_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error || !data) {
    return { vehicles: [], totalCount: 0, page, pageSize, hasMore: false };
  }

  const totalCount = count ?? data.length;
  return {
    vehicles: toCamelCase<Vehicle[]>(data),
    totalCount,
    page,
    pageSize,
    hasMore: from + data.length < totalCount,
  };
}

export async function getFeaturedVehicles(limit = 8): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('rental_vehicles')
    .select('*')
    .eq('status', 'published')
    .order('rating', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return toCamelCase<Vehicle[]>(data);
}

export async function getVehiclesByType(vehicleType: VehicleType, limit = 20): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('rental_vehicles')
    .select('*')
    .eq('status', 'published')
    .eq('vehicle_type', vehicleType)
    .limit(limit);
  if (error || !data) return [];
  return toCamelCase<Vehicle[]>(data);
}

// ─── Availability ─────────────────────────────────────────────────

export async function getVehicleAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string,
): Promise<VehicleAvailability[]> {
  const { data, error } = await qb
    .from('rental_vehicle_availability')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  if (error || !data) return [];
  return toCamelCase<VehicleAvailability[]>(data);
}

export async function setVehicleAvailability(
  vehicleId: string,
  date: string,
  isAvailable: boolean,
  options?: { priceOverride?: number; minimumDays?: number; note?: string },
): Promise<VehicleAvailability> {
  const row = {
    vehicle_id: vehicleId,
    date,
    is_available: isAvailable,
    price_override: options?.priceOverride ?? null,
    minimum_days: options?.minimumDays ?? null,
    note: options?.note ?? null,
  };
  const { data, error } = await qb
    .from('rental_vehicle_availability')
    .upsert(row, { onConflict: 'vehicle_id,date' })
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? 'Failed to set availability');
  return toCamelCase<VehicleAvailability>(data);
}

export async function checkVehicleAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string,
): Promise<boolean> {
  const [blockedDays, overlappingBookings] = await Promise.all([
    qb
      .from('rental_vehicle_availability')
      .select('date')
      .eq('vehicle_id', vehicleId)
      .eq('is_available', false)
      .gte('date', startDate)
      .lt('date', endDate),
    qb
      .from('rental_bookings')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .in('status', ['pending', 'confirmed', 'active'])
      .lt('start_date', endDate)
      .gt('end_date', startDate),
  ]);

  if (blockedDays.error || overlappingBookings.error) return false;
  return (blockedDays.data?.length ?? 0) === 0 && (overlappingBookings.data?.length ?? 0) === 0;
}

export function getVehiclePricing(
  pricePerDay: number,
  days: number,
  currencyCode: string,
  options?: { platformFeePercent?: number; securityDeposit?: number; taxRate?: number },
): VehiclePricingBreakdown {
  const subtotal = pricePerDay * days;
  const platformFeePercent = options?.platformFeePercent ?? 20;
  const platformFee = Math.round(subtotal * (platformFeePercent / 100) * 100) / 100;
  const tax = options?.taxRate ? Math.round(subtotal * options.taxRate * 100) / 100 : 0;
  const securityDeposit = options?.securityDeposit ?? 0;
  const total = subtotal + platformFee + tax + securityDeposit;

  return { pricePerDay, days, subtotal, platformFee, tax, securityDeposit, total, currencyCode };
}

// ─── Vehicle Images ───────────────────────────────────────────────
// Images live directly on the vehicle row (coverImageUrl + galleryImages),
// not in a separate table. Files themselves are uploaded via the shared
// /api/upload route (backed by Cloudflare R2), which returns a public URL
// this module then stores on the vehicle.

export async function uploadVehicleImage(vehicleId: string, file: File, makeCover = false): Promise<Vehicle> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', 'vehicles');
  formData.append('folder', `vehicles/${vehicleId}`);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to upload image');
  }
  const { url } = (await res.json()) as { url: string };

  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) throw new Error('Vehicle not found');

  const galleryImages = [...vehicle.galleryImages, url];
  const updates: Partial<Vehicle> = { galleryImages };
  if (makeCover || !vehicle.coverImageUrl) updates.coverImageUrl = url;

  return updateVehicle(vehicleId, updates);
}

export async function deleteVehicleImage(vehicleId: string, imageUrl: string): Promise<Vehicle> {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) throw new Error('Vehicle not found');

  const galleryImages = vehicle.galleryImages.filter((url) => url !== imageUrl);
  const updates: Partial<Vehicle> = { galleryImages };
  if (vehicle.coverImageUrl === imageUrl) {
    updates.coverImageUrl = galleryImages[0];
  }

  return updateVehicle(vehicleId, updates);
}

export async function setCoverImage(vehicleId: string, imageUrl: string): Promise<Vehicle> {
  return updateVehicle(vehicleId, { coverImageUrl: imageUrl });
}

// ─── Bookings ─────────────────────────────────────────────────────

function generateBookingCode(): string {
  return `RB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function createVehicleBooking(
  input: Omit<
    VehicleBooking,
    'id' | 'bookingCode' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt' | 'renterLicenseVerified'
  > & { renterLicenseVerified?: boolean },
): Promise<VehicleBooking> {
  const isAvailable = await checkVehicleAvailability(input.vehicleId, input.startDate, input.endDate);
  if (!isAvailable) throw new Error('Vehicle is not available for the selected dates');

  const row = toSnakeCase({
    ...input,
    bookingCode: generateBookingCode(),
    status: 'pending' as VehicleBookingStatus,
    paymentStatus: 'pending',
    renterLicenseVerified: input.renterLicenseVerified ?? false,
  });

  const { data, error } = await qb.from('rental_bookings').insert(row).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to create booking');
  return toCamelCase<VehicleBooking>(data);
}

export async function getVehicleBooking(bookingId: string): Promise<VehicleBooking | null> {
  const { data, error } = await qb.from('rental_bookings').select('*').eq('id', bookingId).single();
  if (error) return null;
  return toCamelCase<VehicleBooking>(data);
}

export async function getUserBookings(renterId: string): Promise<VehicleBooking[]> {
  const { data, error } = await qb
    .from('rental_bookings')
    .select('*')
    .eq('renter_id', renterId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return toCamelCase<VehicleBooking[]>(data);
}

export async function getHostBookings(hostId: string): Promise<VehicleBooking[]> {
  const { data, error } = await qb
    .from('rental_bookings')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return toCamelCase<VehicleBooking[]>(data);
}

export async function updateBookingStatus(bookingId: string, status: VehicleBookingStatus): Promise<VehicleBooking> {
  const updates: Record<string, unknown> = { status };
  if (status === 'active') updates.picked_up_at = new Date().toISOString();
  if (status === 'completed') updates.returned_at = new Date().toISOString();

  const { data, error } = await qb.from('rental_bookings').update(updates).eq('id', bookingId).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to update booking');
  return toCamelCase<VehicleBooking>(data);
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<VehicleBooking> {
  const { data, error } = await qb
    .from('rental_bookings')
    .update({ status: 'cancelled', cancellation_reason: reason ?? null, cancelled_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? 'Failed to cancel booking');
  return toCamelCase<VehicleBooking>(data);
}

// ─── Reviews ──────────────────────────────────────────────────────

export async function getVehicleReviews(vehicleId: string): Promise<VehicleReview[]> {
  const { data, error } = await qb
    .from('rental_vehicle_reviews')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return toCamelCase<VehicleReview[]>(data);
}

export async function createVehicleReview(
  input: Omit<VehicleReview, 'id' | 'createdAt' | 'updatedAt' | 'hostReply' | 'hostRepliedAt'>,
): Promise<VehicleReview> {
  const row = toSnakeCase(input);
  const { data, error } = await qb.from('rental_vehicle_reviews').insert(row).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to create review');

  // Refresh the vehicle's aggregate rating/review_count.
  const { data: allReviews } = await qb.from('rental_vehicle_reviews').select('rating').eq('vehicle_id', input.vehicleId);
  if (allReviews?.length) {
    const avgRating = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;
    await updateVehicle(input.vehicleId, { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length });
  }

  return toCamelCase<VehicleReview>(data);
}

export async function replyToVehicleReview(reviewId: string, reply: string): Promise<VehicleReview> {
  const { data, error } = await qb
    .from('rental_vehicle_reviews')
    .update({ host_reply: reply, host_replied_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? 'Failed to reply to review');
  return toCamelCase<VehicleReview>(data);
}

// ─── Favorites ────────────────────────────────────────────────────

export async function getUserFavorites(userId: string): Promise<Vehicle[]> {
  const { data, error } = await qb
    .from('rental_vehicle_favorites')
    .select('vehicle_id, rental_vehicles(*)')
    .eq('user_id', userId);
  if (error || !data) return [];
  return toCamelCase<Vehicle[]>(data.map((row: any) => row.rental_vehicles).filter(Boolean));
}

export async function addToFavorites(userId: string, vehicleId: string): Promise<VehicleFavorite> {
  const { data, error } = await qb
    .from('rental_vehicle_favorites')
    .insert({ user_id: userId, vehicle_id: vehicleId })
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? 'Failed to add favorite');
  return toCamelCase<VehicleFavorite>(data);
}

export async function removeFromFavorites(userId: string, vehicleId: string): Promise<void> {
  const { error } = await qb.from('rental_vehicle_favorites').delete().eq('user_id', userId).eq('vehicle_id', vehicleId);
  if (error) throw new Error(error.message ?? 'Failed to remove favorite');
}

export async function isFavorite(userId: string, vehicleId: string): Promise<boolean> {
  const { data } = await qb
    .from('rental_vehicle_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .maybeSingle();
  return Boolean(data);
}

// ─── Labels & formatting ──────────────────────────────────────────

export function getVehicleTypeLabel(type: VehicleType): string {
  const labels: Record<VehicleType, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    truck: 'Truck',
    van: 'Van',
    coupe: 'Coupe',
    convertible: 'Convertible',
    hatchback: 'Hatchback',
    wagon: 'Wagon',
    minivan: 'Minivan',
    pickup: 'Pickup Truck',
    luxury: 'Luxury',
    electric: 'Electric',
    hybrid: 'Hybrid',
    motorcycle: 'Motorcycle',
    scooter: 'Scooter',
    rv: 'RV',
    trailer: 'Trailer',
    bus: 'Bus',
  };
  return labels[type] ?? type;
}

export function getVehicleBookingStatusLabel(status: VehicleBookingStatus): string {
  const labels: Record<VehicleBookingStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    active: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return labels[status] ?? status;
}

export function calculateVehiclePricing(
  pricePerDay: number,
  days: number,
  currencyCode: string,
  options?: { platformFeePercent?: number; securityDeposit?: number; taxRate?: number },
): VehiclePricingBreakdown {
  return getVehiclePricing(pricePerDay, days, currencyCode, options);
}

export function formatVehiclePrice(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function getVehicleSpecs(vehicle: Vehicle): { label: string; value: string }[] {
  const specs = [
    { label: 'Type', value: getVehicleTypeLabel(vehicle.vehicleType) },
    { label: 'Seats', value: String(vehicle.seats) },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'Fuel Type', value: vehicle.fuelType.replace('_', ' ') },
  ];
  if (vehicle.color) specs.push({ label: 'Color', value: vehicle.color });
  if (vehicle.mileageLimitPerDay) specs.push({ label: 'Mileage Limit', value: `${vehicle.mileageLimitPerDay} mi/day` });
  return specs;
}

// ─── API Key Management ────────────────────────────────────────────

export async function createApiKey(
  hostId: string,
  name: string,
  scopes: ApiKeyScope[],
  options?: { rateLimitPerMinute?: number; rateLimitPerDay?: number; expiresAt?: string; createdBy?: string },
): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
  const rawKey = `ab_${crypto.randomUUID().replace(/-/g, '')}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = await sha256Hex(rawKey);

  const row = {
    host_id: hostId,
    name,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    scopes,
    rate_limit_per_minute: options?.rateLimitPerMinute ?? 60,
    rate_limit_per_day: options?.rateLimitPerDay ?? 10000,
    expires_at: options?.expiresAt ?? null,
    created_by: options?.createdBy ?? null,
  };

  const { data, error } = await qb.from('rental_api_keys').insert(row).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to create API key');
  return { apiKey: toCamelCase<ApiKey>(data), plaintextKey: rawKey };
}

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getApiKeys(hostId: string): Promise<ApiKey[]> {
  const { data, error } = await qb
    .from('rental_api_keys')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return toCamelCase<ApiKey[]>(data);
}

export async function getApiKey(apiKeyId: string): Promise<ApiKey | null> {
  const { data, error } = await qb.from('rental_api_keys').select('*').eq('id', apiKeyId).single();
  if (error) return null;
  return toCamelCase<ApiKey>(data);
}

export async function updateApiKey(
  apiKeyId: string,
  updates: Partial<Pick<ApiKey, 'name' | 'scopes' | 'isActive' | 'rateLimitPerMinute' | 'rateLimitPerDay' | 'expiresAt'>>,
): Promise<ApiKey> {
  const row = toSnakeCase(updates);
  const { data, error } = await qb.from('rental_api_keys').update(row).eq('id', apiKeyId).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to update API key');
  return toCamelCase<ApiKey>(data);
}

export async function deleteApiKey(apiKeyId: string): Promise<void> {
  const { error } = await qb.from('rental_api_keys').delete().eq('id', apiKeyId);
  if (error) throw new Error(error.message ?? 'Failed to delete API key');
}

export async function regenerateApiKey(apiKeyId: string): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
  const rawKey = `ab_${crypto.randomUUID().replace(/-/g, '')}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = await sha256Hex(rawKey);

  const { data, error } = await qb
    .from('rental_api_keys')
    .update({ key_prefix: keyPrefix, key_hash: keyHash })
    .eq('id', apiKeyId)
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? 'Failed to regenerate API key');
  return { apiKey: toCamelCase<ApiKey>(data), plaintextKey: rawKey };
}

export async function getApiKeyUsageLogs(apiKeyId: string, limit = 100): Promise<ApiKeyUsageLog[]> {
  const { data, error } = await qb
    .from('rental_api_key_usage_logs')
    .select('*')
    .eq('api_key_id', apiKeyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return toCamelCase<ApiKeyUsageLog[]>(data);
}

// ─── Webhook Management ─────────────────────────────────────────────

export async function createWebhookEndpoint(
  hostId: string,
  url: string,
  events: string[],
  apiKeyId?: string,
): Promise<WebhookEndpoint> {
  const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
  const row = { host_id: hostId, api_key_id: apiKeyId ?? null, url, secret, events };
  const { data, error } = await qb.from('rental_webhook_endpoints').insert(row).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to create webhook endpoint');
  return toCamelCase<WebhookEndpoint>(data);
}

export async function getWebhookEndpoints(hostId: string): Promise<WebhookEndpoint[]> {
  const { data, error } = await qb
    .from('rental_webhook_endpoints')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return toCamelCase<WebhookEndpoint[]>(data);
}

export async function getWebhookEndpoint(webhookEndpointId: string): Promise<WebhookEndpoint | null> {
  const { data, error } = await qb.from('rental_webhook_endpoints').select('*').eq('id', webhookEndpointId).single();
  if (error) return null;
  return toCamelCase<WebhookEndpoint>(data);
}

export async function updateWebhookEndpoint(
  webhookEndpointId: string,
  updates: Partial<Pick<WebhookEndpoint, 'url' | 'events' | 'isActive'>>,
): Promise<WebhookEndpoint> {
  const row = toSnakeCase(updates);
  const { data, error } = await qb
    .from('rental_webhook_endpoints')
    .update(row)
    .eq('id', webhookEndpointId)
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? 'Failed to update webhook endpoint');
  return toCamelCase<WebhookEndpoint>(data);
}

export async function deleteWebhookEndpoint(webhookEndpointId: string): Promise<void> {
  const { error } = await qb.from('rental_webhook_endpoints').delete().eq('id', webhookEndpointId);
  if (error) throw new Error(error.message ?? 'Failed to delete webhook endpoint');
}

export async function getWebhookDeliveryLogs(webhookEndpointId: string, limit = 50): Promise<WebhookDeliveryLog[]> {
  const { data, error } = await qb
    .from('rental_webhook_delivery_logs')
    .select('*')
    .eq('webhook_endpoint_id', webhookEndpointId)
    .order('delivered_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return toCamelCase<WebhookDeliveryLog[]>(data);
}

// ─── External Platform Connections ──────────────────────────────────

export async function getExternalPlatformConnections(hostId: string): Promise<ExternalPlatformConnection[]> {
  const { data, error } = await qb
    .from('rental_external_platform_connections')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return toCamelCase<ExternalPlatformConnection[]>(data);
}

export async function createExternalPlatformConnection(
  hostId: string,
  platformName: string,
  options?: { externalAccountId?: string; accessToken?: string; refreshToken?: string; autoSync?: boolean },
): Promise<ExternalPlatformConnection> {
  const row = {
    host_id: hostId,
    platform_name: platformName,
    external_account_id: options?.externalAccountId ?? null,
    access_token: options?.accessToken ?? null,
    refresh_token: options?.refreshToken ?? null,
    auto_sync: options?.autoSync ?? false,
    sync_status: 'connected',
  };
  const { data, error } = await qb.from('rental_external_platform_connections').insert(row).select('*').single();
  if (error) throw new Error(error.message ?? 'Failed to create external platform connection');
  return toCamelCase<ExternalPlatformConnection>(data);
}

export async function updateExternalPlatformConnection(
  connectionId: string,
  updates: Partial<Pick<ExternalPlatformConnection, 'autoSync' | 'syncStatus' | 'syncErrorMessage' | 'lastSyncedAt'>>,
): Promise<ExternalPlatformConnection> {
  const row = toSnakeCase(updates);
  const { data, error } = await qb
    .from('rental_external_platform_connections')
    .update(row)
    .eq('id', connectionId)
    .select('*')
    .single();
  if (error) throw new Error(error.message ?? 'Failed to update external platform connection');
  return toCamelCase<ExternalPlatformConnection>(data);
}

export async function deleteExternalPlatformConnection(connectionId: string): Promise<void> {
  const { error } = await qb.from('rental_external_platform_connections').delete().eq('id', connectionId);
  if (error) throw new Error(error.message ?? 'Failed to delete external platform connection');
}
