import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Event,
  EventTypeTicket,
  EventCategory,
  EventStatus,
  TicketType,
  TicketTierConfig,
} from '@/types/events';
import type { CreateEventParams, EventFilters } from './types';
import { SUBSCRIPTION_PLANS } from '@/types/subscription-plans';
import { getCurrencyForCountry } from '../money';

// ─── Helpers ──────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function generateUniqueSlug(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Create Event ─────────────────────────────────────────────

export async function createEvent(
  sb: SupabaseClient,
  params: CreateEventParams,
): Promise<Event> {
  const now = new Date().toISOString();
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);

  if (end <= start) {
    throw new Error('Event end date must be after start date');
  }

  const baseSlug = slugify(params.title);
  let slug = generateUniqueSlug(baseSlug);

  // Ensure slug uniqueness
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await sb
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!existing) break;
    slug = generateUniqueSlug(baseSlug);
    attempts++;
  }

  const ticketTypes = params.ticketTypes ?? [];
  const prices = ticketTypes.map((t) => t.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const planConfig = SUBSCRIPTION_PLANS.free;
  const event = {
    organizer_id: params.organizerId,
    organizer_name: '',
    title: params.title,
    slug,
    description: params.description,
    short_description: params.shortDescription,
    category: params.category,
    status: 'draft' as EventStatus,
    start_date: params.startDate,
    end_date: params.endDate,
    timezone: params.timezone,
    is_virtual: params.isVirtual,
    venue_name: params.venueName ?? null,
    venue_address: params.venueAddress ?? null,
    venue_city: params.venueCity ?? null,
    venue_country: params.venueCountry ?? null,
    venue_lat: params.venueLat ?? null,
    venue_lng: params.venueLng ?? null,
    virtual_link: params.virtualLink ?? null,
    cover_image_url: null,
    gallery_images: [],
    ticket_types: ticketTypes.map((t) => t.type),
    min_price: minPrice,
    max_price: maxPrice,
    currency_code: params.currencyCode,
    total_capacity: params.totalCapacity,
    tickets_sold: 0,
    is_free: params.isFree,
    platform_fee_percent: planConfig.feePercent,
    platform_fee_fixed: planConfig.feeFixed,
    share_url: '',
    referral_code: Math.random().toString(36).slice(2, 10),
    referral_discount_percent: params.referralDiscountPercent,
    enable_referrals: params.enableReferrals,
    enable_waitlist: false,
    require_approval: false,
    allow_guest_registration: params.allowGuestRegistration,
    max_guests_per_ticket: params.maxGuestsPerTicket,
    tags: params.tags,
    view_count: 0,
    share_count: 0,
    published_at: null,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error } = await sb
    .from('events')
    .insert(event)
    .select()
    .single();

  if (error) throw new Error(`Failed to create event: ${error.message}`);

  // Insert ticket types
  if (ticketTypes.length > 0) {
    const ticketRows = ticketTypes.map((t, idx) => ({
      event_id: created.id,
      name: t.name,
      type: t.type,
      description: t.description,
      price: t.price,
      original_price: t.originalPrice ?? null,
      currency_code: params.currencyCode,
      quantity_available: t.quantityAvailable,
      quantity_sold: 0,
      max_per_order: t.maxPerOrder,
      min_per_order: t.minPerOrder,
      sale_starts_at: t.saleStartsAt,
      sale_ends_at: t.saleEndsAt,
      includes_guest_registration: t.includesGuestRegistration,
      max_guests_per_ticket: t.maxGuestsPerTicket,
      benefits: t.benefits,
      is_active: t.isActive,
      sort_order: idx,
    }));

    const { error: ticketError } = await sb
      .from('event_tickets')
      .insert(ticketRows);

    if (ticketError) {
      throw new Error(`Failed to create ticket types: ${ticketError.message}`);
    }
  }

  // Update share URL
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const shareUrl = `${origin}/events/${slug}`;
  await sb.from('events').update({ share_url: shareUrl }).eq('id', created.id);

  return mapEvent({ ...created, share_url: shareUrl });
}

// ─── Update Event ─────────────────────────────────────────────

export async function updateEvent(
  sb: SupabaseClient,
  eventId: string,
  data: Partial<CreateEventParams>,
  userId: string,
): Promise<Event> {
  const { data: existing, error: fetchError } = await sb
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !existing) {
    throw new Error('Event not found');
  }

  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can update this event');
  }

  if (existing.status === 'completed') {
    throw new Error('Cannot update a completed event');
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title) {
    updates.title = data.title;
    updates.slug = generateUniqueSlug(slugify(data.title));
  }
  if (data.description) updates.description = data.description;
  if (data.shortDescription) updates.short_description = data.shortDescription;
  if (data.category) updates.category = data.category;
  if (data.startDate) updates.start_date = data.startDate;
  if (data.endDate) updates.end_date = data.endDate;
  if (data.timezone) updates.timezone = data.timezone;
  if (data.isVirtual !== undefined) updates.is_virtual = data.isVirtual;
  if (data.venueName !== undefined) updates.venue_name = data.venueName;
  if (data.venueAddress !== undefined) updates.venue_address = data.venueAddress;
  if (data.venueCity !== undefined) updates.venue_city = data.venueCity;
  if (data.venueCountry !== undefined) updates.venue_country = data.venueCountry;
  if (data.venueLat !== undefined) updates.venue_lat = data.venueLat;
  if (data.venueLng !== undefined) updates.venue_lng = data.venueLng;
  if (data.virtualLink !== undefined) updates.virtual_link = data.virtualLink;
  if (data.tags) updates.tags = data.tags;
  if (data.totalCapacity !== undefined) updates.total_capacity = data.totalCapacity;
  if (data.enableReferrals !== undefined) updates.enable_referrals = data.enableReferrals;
  if (data.referralDiscountPercent !== undefined) {
    updates.referral_discount_percent = data.referralDiscountPercent;
  }
  if (data.allowGuestRegistration !== undefined) {
    updates.allow_guest_registration = data.allowGuestRegistration;
  }
  if (data.maxGuestsPerTicket !== undefined) {
    updates.max_guests_per_ticket = data.maxGuestsPerTicket;
  }

  const { data: updated, error } = await sb
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update event: ${error.message}`);
  return mapEvent(updated);
}

// ─── Publish Event ────────────────────────────────────────────

export async function publishEvent(
  sb: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<Event> {
  const { data: existing, error: fetchError } = await sb
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !existing) throw new Error('Event not found');
  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can publish this event');
  }
  if (existing.status !== 'draft') {
    throw new Error('Only draft events can be published');
  }
  if (new Date(existing.end_date) <= new Date()) {
    throw new Error('Cannot publish an event that has already ended');
  }

  const { data: updated, error } = await sb
    .from('events')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw new Error(`Failed to publish event: ${error.message}`);
  return mapEvent(updated);
}

// ─── Cancel Event ─────────────────────────────────────────────

export async function cancelEvent(
  sb: SupabaseClient,
  eventId: string,
  userId: string,
  reason: string,
): Promise<Event> {
  const { data: existing, error: fetchError } = await sb
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !existing) throw new Error('Event not found');
  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can cancel this event');
  }
  if (existing.status === 'completed') {
    throw new Error('Cannot cancel a completed event');
  }
  if (existing.status === 'cancelled') {
    throw new Error('Event is already cancelled');
  }

  const { data: updated, error } = await sb
    .from('events')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      metadata: { cancellation_reason: reason, cancelled_at: new Date().toISOString() },
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw new Error(`Failed to cancel event: ${error.message}`);

  // Trigger refund process for paid registrations
  const { data: registrations } = await sb
    .from('ticket_purchases')
    .select('id')
    .eq('event_id', eventId)
    .eq('order_status', 'confirmed');

  if (registrations && registrations.length > 0) {
    await sb.from('event_cancellation_refunds').insert(
      registrations.map((r) => ({
        event_id: eventId,
        registration_id: r.id,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      })),
    );
  }

  return mapEvent(updated);
}

// ─── Complete Event ───────────────────────────────────────────

export async function completeEvent(
  sb: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<Event> {
  const { data: existing, error: fetchError } = await sb
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !existing) throw new Error('Event not found');
  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can complete this event');
  }
  if (existing.status !== 'published') {
    throw new Error('Only published events can be marked as completed');
  }

  const { data: updated, error } = await sb
    .from('events')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw new Error(`Failed to complete event: ${error.message}`);
  return mapEvent(updated);
}

// ─── Get Event By ID ──────────────────────────────────────────

export async function getEventById(
  sb: SupabaseClient,
  eventId: string,
): Promise<(Event & { ticketTypes: EventTypeTicket[] }) | null> {
  const { data: event, error } = await sb
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) return null;

  const { data: tickets } = await sb
    .from('event_tickets')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  const { count: registrationCount } = await sb
    .from('ticket_purchases')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('order_status', 'confirmed');

  const { count: attendeeCount } = await sb
    .from('ticket_purchases')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('check_in_status', 'checked_in');

  return {
    ...mapEvent(event),
    ticketTypes: (tickets ?? []).map(mapTicket),
    stats: {
      registrations: registrationCount ?? 0,
      attendees: attendeeCount ?? 0,
    },
  } as Event & { ticketTypes: EventTypeTicket[]; stats: { registrations: number; attendees: number } };
}

// ─── Get Event By Slug ────────────────────────────────────────

export async function getEventBySlug(
  sb: SupabaseClient,
  slug: string,
): Promise<(Event & { ticketTypes: EventTypeTicket[] }) | null> {
  const { data: event, error } = await sb
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !event) return null;

  // Increment view count
  await sb
    .from('events')
    .update({ view_count: (event.view_count ?? 0) + 1 })
    .eq('id', event.id);

  const { data: tickets } = await sb
    .from('event_tickets')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  return {
    ...mapEvent(event),
    ticketTypes: (tickets ?? []).map(mapTicket),
  } as Event & { ticketTypes: EventTypeTicket[] };
}

// ─── List Events ──────────────────────────────────────────────

export async function listEvents(
  sb: SupabaseClient,
  filters: EventFilters & { page?: number; limit?: number },
): Promise<PaginatedResult<Event>> {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 50);
  const offset = (page - 1) * limit;

  let query = sb.from('events').select('*', { count: 'exact' });

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.city) query = query.ilike('venue_city', `%${filters.city}%`);
  if (filters.country) query = query.eq('venue_country', filters.country);
  if (filters.isFree !== undefined) query = query.eq('is_free', filters.isFree);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.startDate) query = query.gte('start_date', filters.startDate);
  if (filters.endDate) query = query.lte('end_date', filters.endDate);
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  query = query
    .eq('status', filters.status ?? 'published')
    .order('start_date', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list events: ${error.message}`);

  return {
    data: (data ?? []).map(mapEvent),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─── Organizer Events ─────────────────────────────────────────

export async function getOrganizerEvents(
  sb: SupabaseClient,
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResult<Event>> {
  const offset = (page - 1) * limit;

  const { data, error, count } = await sb
    .from('events')
    .select('*', { count: 'exact' })
    .eq('organizer_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to get organizer events: ${error.message}`);

  return {
    data: (data ?? []).map(mapEvent),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─── Featured Events ──────────────────────────────────────────

export async function getFeaturedEvents(
  sb: SupabaseClient,
  countryCode?: string,
  limit: number = 10,
): Promise<Event[]> {
  let query = sb
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);

  if (countryCode) {
    query = query.eq('venue_country', countryCode);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get featured events: ${error.message}`);
  return (data ?? []).map(mapEvent);
}

// ─── Upcoming Events ──────────────────────────────────────────

export async function getUpcomingEvents(
  sb: SupabaseClient,
  countryCode?: string,
  limit: number = 20,
): Promise<Event[]> {
  let query = sb
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);

  if (countryCode) {
    query = query.eq('venue_country', countryCode);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get upcoming events: ${error.message}`);
  return (data ?? []).map(mapEvent);
}

// ─── Past Events ──────────────────────────────────────────────

export async function getPastEvents(
  sb: SupabaseClient,
  userId: string,
  limit: number = 20,
): Promise<Event[]> {
  const { data: registrations, error: regError } = await sb
    .from('ticket_purchases')
    .select('event_id')
    .eq('buyer_id', userId)
    .eq('order_status', 'confirmed');

  if (regError) throw new Error(`Failed to get past events: ${regError.message}`);

  const eventIds = [...new Set((registrations ?? []).map((r) => r.event_id))];
  if (eventIds.length === 0) return [];

  const { data, error } = await sb
    .from('events')
    .select('*')
    .in('id', eventIds)
    .lt('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get past events: ${error.message}`);
  return (data ?? []).map(mapEvent);
}

// ─── Mappers ──────────────────────────────────────────────────

function mapEvent(row: Record<string, unknown>): Event {
  // The `events` table stores venue/location under two conventions depending
  // on which schema revision created the row. Read both so existing rows map.
  const venue =
    (row.venue_name as string) ?? (row.venue as string) ?? '';
  const address =
    (row.venue_address as string) ?? (row.address as string) ?? '';
  const city = (row.venue_city as string) ?? (row.city as string) ?? '';
  const country = (row.venue_country as string) ?? (row.country as string) ?? '';
  const countryCode = (row.country_code as string) ?? (row.venue_country as string) ?? '';

  // location may be a PostGIS string ("SRID=4326;POINT(lng lat)"),
  // a GeoJSON Point, or absent entirely.
  let location: { lat: number; lng: number };
  const rawLocation = row.location as unknown;
  if (
    rawLocation &&
    typeof rawLocation === 'object' &&
    'lat' in rawLocation &&
    'lng' in rawLocation
  ) {
    location = { lat: Number(rawLocation.lat), lng: Number(rawLocation.lng) };
  } else if (typeof rawLocation === 'string' && rawLocation.includes('POINT(')) {
    const coords = rawLocation.match(/POINT\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/);
    location = coords
      ? { lat: Number(coords[2]), lng: Number(coords[1]) }
      : { lat: 0, lng: 0 };
  } else if (
    rawLocation &&
    typeof rawLocation === 'object' &&
    'coordinates' in rawLocation
  ) {
    const [lng, lat] = (rawLocation as { coordinates: [number, number] }).coordinates ?? [0, 0];
    location = { lat, lng };
  } else {
    location = {
      lat: (row.venue_lat as number) ?? 0,
      lng: (row.venue_lng as number) ?? 0,
    };
  }

  const isFree = (row.is_free as boolean) ?? row.ticket_type === 'free';
  const ticketType = (row.ticket_type as TicketType) ?? (isFree ? 'free' : 'paid');
  const rawTiers = row.ticket_tiers as unknown;
  const ticketTiers: TicketTierConfig[] = Array.isArray(rawTiers)
    ? (rawTiers as TicketTierConfig[])
    : [];

  return {
    id: row.id as string,
    organizerId: row.organizer_id as string,
    organizerName: (row.organizer_name as string) ?? '',
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    shortDescription: (row.short_description as string) ?? '',
    category: row.category as EventCategory,
    status: row.status as EventStatus,

    venue,
    venueName: venue || undefined,
    venueAddress: address || undefined,
    venueCity: city || undefined,
    venueCountry: country || undefined,
    venueLat: location.lat || undefined,
    venueLng: location.lng || undefined,
    address,
    city,
    country,
    countryCode,
    location,
    isVirtual: (row.is_virtual as boolean) ?? false,
    virtualLink: (row.virtual_link as string) ?? undefined,

    startDate: row.start_date as string,
    endDate: row.end_date as string,
    timezone: row.timezone as string,
    doorsOpenAt: (row.doors_open as string) ?? (row.doors_open_at as string) ?? undefined,

    coverImageUrl: (row.cover_image_url as string) ?? '',
    galleryImages: (row.gallery_images as string[]) ?? [],
    promoVideoUrl: (row.promo_video_url as string) ?? undefined,
    flyerUrl: (row.flyer_url as string) ?? undefined,

    ticketType,
    ticketTypes: (row.ticket_types as EventCategory[]) ?? [],
    ticketTiers,
    totalCapacity: (row.total_capacity as number) ?? 0,
    ticketsSold: (row.tickets_sold as number) ?? 0,
    waitlistEnabled: (row.enable_waitlist as boolean) ?? (row.waitlist_enabled as boolean) ?? false,

    currencyCode: (row.currency_code as string) ?? getCurrencyForCountry((row.country_code as string) ?? (row.venue_country as string) ?? 'NG'),
    minPrice: (row.min_price as number) ?? undefined,
    maxPrice: (row.max_price as number) ?? undefined,
    isFree,
    platformFeePercent: (row.platform_fee_percent as number) ?? 5,
    platformFeeFixed: (row.platform_fee_fixed as number) ?? 1,
    taxRate: (row.tax_rate as number) ?? 0,

    requiresApproval: (row.require_approval as boolean) ?? (row.requires_approval as boolean) ?? false,
    showGuestList: (row.show_guest_list as boolean) ?? false,
    allowRefunds: (row.allow_refunds as boolean) ?? true,
    refundDeadlineDays: (row.refund_deadline_days as number) ?? 7,
    maxGuestsPerRegistration: (row.max_guests_per_registration as number) ?? (row.max_guests_per_ticket as number) ?? 0,
    allowGuestRegistration: (row.allow_guest_registration as boolean) ?? undefined,
    maxGuestsPerTicket: (row.max_guests_per_ticket as number) ?? undefined,

    metaTitle: (row.meta_title as string) ?? undefined,
    metaDescription: (row.meta_description as string) ?? undefined,
    shareImageUrl: (row.share_image_url as string) ?? undefined,
    shareUrl: (row.share_url as string) ?? '',
    tags: (row.tags as string[]) ?? [],
    referralCode: (row.referral_code as string) ?? '',
    referralDiscountPercent: (row.referral_discount_percent as number) ?? 0,
    enableReferrals: (row.enable_referrals as boolean) ?? false,

    viewCount: (row.view_count as number) ?? 0,
    shareCount: (row.share_count as number) ?? 0,
    favoriteCount: (row.favorite_count as number) ?? 0,
    publishedAt: (row.published_at as string) ?? undefined,

    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTicket(row: Record<string, unknown>): EventTypeTicket {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    name: row.name as string,
    type: row.type as EventTypeTicket['type'],
    description: (row.description as string) ?? '',
    price: (row.price as number) ?? 0,
    originalPrice: (row.original_price as number) ?? undefined,
    currencyCode: (row.currency_code as string) ?? getCurrencyForCountry((row.country_code as string) ?? 'NG'),
    quantityAvailable: (row.quantity_available as number) ?? 0,
    quantitySold: (row.quantity_sold as number) ?? 0,
    maxPerOrder: (row.max_per_order as number) ?? 10,
    minPerOrder: (row.min_per_order as number) ?? 1,
    saleStartsAt: row.sale_starts_at as string,
    saleEndsAt: row.sale_ends_at as string,
    includesGuestRegistration: (row.includes_guest_registration as boolean) ?? false,
    maxGuestsPerTicket: (row.max_guests_per_ticket as number) ?? 0,
    benefits: (row.benefits as string[]) ?? [],
    isActive: (row.is_active as boolean) ?? true,
    sortOrder: (row.sort_order as number) ?? 0,
  };
}
