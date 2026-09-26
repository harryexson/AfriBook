import { query } from '@/lib/neon/admin';
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

// The confirmed `events` table has no columns for venue_lat/venue_lng,
// min_price/max_price, is_free, referral_code/referral_discount_percent,
// requires_approval, show_guest_list, allow_refunds, refund_deadline_days,
// meta_title/meta_description/share_image_url, promo_video_url/flyer_url,
// published_at, or is_featured. Those are kept in the `metadata` jsonb bag
// instead of being dropped outright, so callers still see them round-trip.
interface EventMetadataExtras {
  venueLat?: number;
  venueLng?: number;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  referralCode?: string;
  referralDiscountPercent?: number;
  requiresApproval?: boolean;
  showGuestList?: boolean;
  allowRefunds?: boolean;
  refundDeadlineDays?: number;
  metaTitle?: string;
  metaDescription?: string;
  shareImageUrl?: string;
  promoVideoUrl?: string;
  flyerUrl?: string;
  publishedAt?: string;
  isFeatured?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  [key: string]: unknown;
}

interface EventRow {
  id: string;
  organizer_id: string;
  organizer_name: string | null;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: EventCategory;
  status: EventStatus;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_country: string | null;
  is_virtual: boolean | null;
  virtual_link: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  doors_open_at: string | null;
  cover_image_url: string | null;
  gallery_images: unknown;
  ticket_type: TicketType;
  total_capacity: number | null;
  tickets_sold: number | null;
  currency_code: string | null;
  platform_fee_percent: number | null;
  platform_fee_fixed: number | null;
  tax_rate: number | null;
  share_count: string | number | null;
  view_count: string | number | null;
  favorite_count: string | number | null;
  tags: unknown;
  metadata: EventMetadataExtras | null;
  created_at: string;
  updated_at: string;
  share_url: string | null;
  enable_referrals: boolean | null;
  enable_waitlist: boolean | null;
  allow_guest_registration: boolean | null;
  max_guests_per_registration: number | null;
}

interface EventTicketTypeRow {
  id: string;
  event_id: string;
  name: string;
  tier: string;
  type: string;
  description: string | null;
  price: number;
  original_price: number | null;
  currency_code: string | null;
  quantity_available: number | null;
  quantity_sold: number | null;
  max_per_order: number | null;
  min_per_order: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  includes_guest_registration: boolean | null;
  max_guests_per_ticket: number | null;
  benefits: unknown;
  is_active: boolean | null;
  sort_order: number | null;
}

// ─── Create Event ─────────────────────────────────────────────

export async function createEvent(params: CreateEventParams): Promise<Event> {
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
    const existing = await query<{ id: string }>(
      `SELECT id FROM events WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    if (existing.length === 0) break;
    slug = generateUniqueSlug(baseSlug);
    attempts++;
  }

  const ticketTypes = params.ticketTypes ?? [];
  const prices = ticketTypes.map((t) => t.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const planConfig = SUBSCRIPTION_PLANS.free;
  const ticketType: TicketType = params.isFree ? 'free' : 'paid';

  const metadataExtras: EventMetadataExtras = {
    venueLat: params.venueLat,
    venueLng: params.venueLng,
    minPrice,
    maxPrice,
    isFree: params.isFree,
    referralCode: Math.random().toString(36).slice(2, 10),
    referralDiscountPercent: params.referralDiscountPercent,
    requiresApproval: false,
    showGuestList: false,
    allowRefunds: true,
    refundDeadlineDays: 7,
  };

  const created = await query<EventRow>(
    `INSERT INTO events (
       organizer_id, organizer_name, title, slug, description, short_description,
       category, status, venue_name, venue_address, venue_city, venue_country,
       is_virtual, virtual_link, start_date, end_date, timezone,
       cover_image_url, gallery_images, ticket_type, total_capacity, tickets_sold,
       currency_code, platform_fee_percent, platform_fee_fixed, tax_rate,
       share_count, view_count, favorite_count, tags, metadata, created_at, updated_at,
       share_url, enable_referrals, enable_waitlist, allow_guest_registration,
       max_guests_per_registration
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11, $12,
       $13, $14, $15, $16, $17,
       $18, $19, $20, $21, $22,
       $23, $24, $25, $26,
       $27, $28, $29, $30, $31, $32, $33,
       $34, $35, $36, $37,
       $38
     )
     RETURNING *`,
    [
      params.organizerId,
      '',
      params.title,
      slug,
      params.description,
      params.shortDescription,
      params.category,
      'draft',
      params.venueName ?? null,
      params.venueAddress ?? null,
      params.venueCity ?? null,
      params.venueCountry ?? null,
      params.isVirtual,
      params.virtualLink ?? null,
      params.startDate,
      params.endDate,
      params.timezone,
      null,
      JSON.stringify([]),
      ticketType,
      params.totalCapacity,
      0,
      params.currencyCode,
      planConfig.feePercent,
      planConfig.feeFixed,
      0,
      0,
      0,
      0,
      JSON.stringify(params.tags ?? []),
      JSON.stringify(metadataExtras),
      now,
      now,
      '',
      params.enableReferrals,
      false,
      params.allowGuestRegistration,
      params.maxGuestsPerTicket ?? 0,
    ],
  );

  const event = created[0];
  if (!event) throw new Error('Failed to create event');

  // Insert ticket types (real table for tier/pricing config is
  // `event_ticket_types`; `event_tickets` is for individual attendee
  // tickets, see ticket-manager.ts)
  if (ticketTypes.length > 0) {
    const columns = [
      'event_id', 'name', 'tier', 'type', 'description', 'price', 'original_price',
      'currency_code', 'quantity_available', 'quantity_sold', 'max_per_order',
      'min_per_order', 'sale_starts_at', 'sale_ends_at', 'includes_guest_registration',
      'max_guests_per_ticket', 'benefits', 'is_active', 'sort_order', 'created_at', 'updated_at',
    ];
    const values: unknown[] = [];
    const placeholders = ticketTypes.map((t, idx) => {
      const row = [
        event.id,
        t.name,
        t.type, // TicketTierConfig-derived type here is actually a TicketTier value
        t.price > 0 ? 'paid' : 'free',
        t.description ?? null,
        t.price,
        t.originalPrice ?? null,
        params.currencyCode,
        t.quantityAvailable,
        0,
        t.maxPerOrder,
        t.minPerOrder,
        t.saleStartsAt,
        t.saleEndsAt,
        t.includesGuestRegistration,
        t.maxGuestsPerTicket,
        JSON.stringify(t.benefits ?? []),
        t.isActive,
        idx,
        now,
        now,
      ];
      const placeholderRow = columns.map((_, colIdx) => {
        values.push(row[colIdx]);
        return `$${idx * columns.length + colIdx + 1}`;
      });
      return `(${placeholderRow.join(', ')})`;
    });

    await query(
      `INSERT INTO event_ticket_types (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  // Update share URL
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const shareUrl = `${origin}/events/${slug}`;
  await query(`UPDATE events SET share_url = $1 WHERE id = $2`, [shareUrl, event.id]);

  return mapEvent({ ...event, share_url: shareUrl });
}

// ─── Update Event ─────────────────────────────────────────────

export async function updateEvent(
  eventId: string,
  data: Partial<CreateEventParams>,
  userId: string,
): Promise<Event> {
  const existingRows = await query<EventRow>(`SELECT * FROM events WHERE id = $1 LIMIT 1`, [eventId]);
  const existing = existingRows[0];

  if (!existing) {
    throw new Error('Event not found');
  }

  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can update this event');
  }

  if (existing.status === 'completed') {
    throw new Error('Cannot update a completed event');
  }

  const setClauses: string[] = ['updated_at = $1'];
  const values: unknown[] = [new Date().toISOString()];
  let idx = 2;

  const addSet = (column: string, value: unknown) => {
    setClauses.push(`${column} = $${idx}`);
    values.push(value);
    idx++;
  };

  if (data.title) {
    addSet('title', data.title);
    addSet('slug', generateUniqueSlug(slugify(data.title)));
  }
  if (data.description) addSet('description', data.description);
  if (data.shortDescription) addSet('short_description', data.shortDescription);
  if (data.category) addSet('category', data.category);
  if (data.startDate) addSet('start_date', data.startDate);
  if (data.endDate) addSet('end_date', data.endDate);
  if (data.timezone) addSet('timezone', data.timezone);
  if (data.isVirtual !== undefined) addSet('is_virtual', data.isVirtual);
  if (data.venueName !== undefined) addSet('venue_name', data.venueName);
  if (data.venueAddress !== undefined) addSet('venue_address', data.venueAddress);
  if (data.venueCity !== undefined) addSet('venue_city', data.venueCity);
  if (data.venueCountry !== undefined) addSet('venue_country', data.venueCountry);
  if (data.virtualLink !== undefined) addSet('virtual_link', data.virtualLink);
  if (data.tags) addSet('tags', JSON.stringify(data.tags));
  if (data.totalCapacity !== undefined) addSet('total_capacity', data.totalCapacity);
  if (data.enableReferrals !== undefined) addSet('enable_referrals', data.enableReferrals);
  if (data.allowGuestRegistration !== undefined) {
    addSet('allow_guest_registration', data.allowGuestRegistration);
  }
  if (data.maxGuestsPerTicket !== undefined) {
    addSet('max_guests_per_registration', data.maxGuestsPerTicket);
  }

  // venueLat/venueLng and referralDiscountPercent are not real columns —
  // merge them into the metadata jsonb bag instead.
  if (data.venueLat !== undefined || data.venueLng !== undefined || data.referralDiscountPercent !== undefined) {
    const mergedMetadata: EventMetadataExtras = {
      ...(existing.metadata ?? {}),
      ...(data.venueLat !== undefined ? { venueLat: data.venueLat } : {}),
      ...(data.venueLng !== undefined ? { venueLng: data.venueLng } : {}),
      ...(data.referralDiscountPercent !== undefined
        ? { referralDiscountPercent: data.referralDiscountPercent }
        : {}),
    };
    addSet('metadata', JSON.stringify(mergedMetadata));
  }

  values.push(eventId);
  const updated = await query<EventRow>(
    `UPDATE events SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );

  const updatedEvent = updated[0];
  if (!updatedEvent) throw new Error('Failed to update event');
  return mapEvent(updatedEvent);
}

// ─── Publish Event ────────────────────────────────────────────

export async function publishEvent(eventId: string, userId: string): Promise<Event> {
  const existingRows = await query<EventRow>(`SELECT * FROM events WHERE id = $1 LIMIT 1`, [eventId]);
  const existing = existingRows[0];

  if (!existing) throw new Error('Event not found');
  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can publish this event');
  }
  if (existing.status !== 'draft') {
    throw new Error('Only draft events can be published');
  }
  if (new Date(existing.end_date) <= new Date()) {
    throw new Error('Cannot publish an event that has already ended');
  }

  const now = new Date().toISOString();
  const mergedMetadata: EventMetadataExtras = { ...(existing.metadata ?? {}), publishedAt: now };

  const updated = await query<EventRow>(
    `UPDATE events SET status = $1, metadata = $2, updated_at = $3 WHERE id = $4 RETURNING *`,
    ['published', JSON.stringify(mergedMetadata), now, eventId],
  );

  const updatedEvent = updated[0];
  if (!updatedEvent) throw new Error('Failed to publish event');
  return mapEvent(updatedEvent);
}

// ─── Cancel Event ─────────────────────────────────────────────

export async function cancelEvent(
  eventId: string,
  userId: string,
  reason: string,
): Promise<Event> {
  const existingRows = await query<EventRow>(`SELECT * FROM events WHERE id = $1 LIMIT 1`, [eventId]);
  const existing = existingRows[0];

  if (!existing) throw new Error('Event not found');
  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can cancel this event');
  }
  if (existing.status === 'completed') {
    throw new Error('Cannot cancel a completed event');
  }
  if (existing.status === 'cancelled') {
    throw new Error('Event is already cancelled');
  }

  const now = new Date().toISOString();
  const mergedMetadata: EventMetadataExtras = {
    ...(existing.metadata ?? {}),
    cancellationReason: reason,
    cancelledAt: now,
  };

  const updated = await query<EventRow>(
    `UPDATE events SET status = $1, updated_at = $2, metadata = $3 WHERE id = $4 RETURNING *`,
    ['cancelled', now, JSON.stringify(mergedMetadata), eventId],
  );

  const updatedEvent = updated[0];
  if (!updatedEvent) throw new Error('Failed to cancel event');

  // Trigger refund process for paid registrations. `event_cancellation_refunds`
  // does not exist — the closest real equivalent is `refunds`, which has no
  // event_id column, so the event/registration linkage is stored in its
  // metadata jsonb instead.
  const registrations = await query<{ id: string; total: number }>(
    `SELECT id, total FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed'`,
    [eventId],
  );

  if (registrations.length > 0) {
    const columns = ['transaction_id', 'amount', 'reason', 'status', 'metadata', 'created_at'];
    const values: unknown[] = [];
    const placeholders = registrations.map((r, idx) => {
      const row = [
        r.id,
        r.total,
        reason,
        'pending',
        JSON.stringify({ event_id: eventId, registration_id: r.id }),
        now,
      ];
      const placeholderRow = columns.map((_, colIdx) => {
        values.push(row[colIdx]);
        return `$${idx * columns.length + colIdx + 1}`;
      });
      return `(${placeholderRow.join(', ')})`;
    });

    await query(
      `INSERT INTO refunds (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  return mapEvent(updatedEvent);
}

// ─── Complete Event ───────────────────────────────────────────

export async function completeEvent(eventId: string, userId: string): Promise<Event> {
  const existingRows = await query<EventRow>(`SELECT * FROM events WHERE id = $1 LIMIT 1`, [eventId]);
  const existing = existingRows[0];

  if (!existing) throw new Error('Event not found');
  if (existing.organizer_id !== userId) {
    throw new Error('Only the organizer can complete this event');
  }
  if (existing.status !== 'published') {
    throw new Error('Only published events can be marked as completed');
  }

  const updated = await query<EventRow>(
    `UPDATE events SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
    ['completed', new Date().toISOString(), eventId],
  );

  const updatedEvent = updated[0];
  if (!updatedEvent) throw new Error('Failed to complete event');
  return mapEvent(updatedEvent);
}

// ─── Get Event By ID ──────────────────────────────────────────

export async function getEventById(
  eventId: string,
): Promise<(Event & { ticketTypes: EventTypeTicket[] }) | null> {
  const events = await query<EventRow>(`SELECT * FROM events WHERE id = $1 LIMIT 1`, [eventId]);
  const event = events[0];
  if (!event) return null;

  const tickets = await query<EventTicketTypeRow>(
    `SELECT * FROM event_ticket_types WHERE event_id = $1 ORDER BY sort_order ASC`,
    [eventId],
  );

  const registrationCountRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed'`,
    [eventId],
  );

  const attendeeCountRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND check_in_status = 'checked_in'`,
    [eventId],
  );

  return {
    ...mapEvent(event),
    ticketTypes: tickets.map(mapTicket),
    stats: {
      registrations: Number(registrationCountRows[0]?.count ?? 0),
      attendees: Number(attendeeCountRows[0]?.count ?? 0),
    },
  } as Event & { ticketTypes: EventTypeTicket[]; stats: { registrations: number; attendees: number } };
}

// ─── Get Event By Slug ────────────────────────────────────────

export async function getEventBySlug(
  slug: string,
): Promise<(Event & { ticketTypes: EventTypeTicket[] }) | null> {
  const events = await query<EventRow>(`SELECT * FROM events WHERE slug = $1 LIMIT 1`, [slug]);
  const event = events[0];
  if (!event) return null;

  // Increment view count
  await query(`UPDATE events SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1`, [event.id]);

  const tickets = await query<EventTicketTypeRow>(
    `SELECT * FROM event_ticket_types WHERE event_id = $1 ORDER BY sort_order ASC`,
    [event.id],
  );

  return {
    ...mapEvent({ ...event, view_count: Number(event.view_count ?? 0) + 1 }),
    ticketTypes: tickets.map(mapTicket),
  } as Event & { ticketTypes: EventTypeTicket[] };
}

// ─── List Events ──────────────────────────────────────────────

export async function listEvents(
  filters: EventFilters & { page?: number; limit?: number },
): Promise<PaginatedResult<Event>> {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 50);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const addCondition = (clause: string, value: unknown) => {
    conditions.push(clause.replace('?', `$${idx}`));
    values.push(value);
    idx++;
  };

  if (filters.category) addCondition('category = ?', filters.category);
  if (filters.city) addCondition('venue_city ILIKE ?', `%${filters.city}%`);
  if (filters.country) addCondition('venue_country = ?', filters.country);
  if (filters.isFree !== undefined) addCondition('ticket_type = ?', filters.isFree ? 'free' : 'paid');
  if (filters.startDate) addCondition('start_date >= ?', filters.startDate);
  if (filters.endDate) addCondition('end_date <= ?', filters.endDate);
  if (filters.search) {
    conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${filters.search}%`);
    idx++;
  }

  addCondition('status = ?', filters.status ?? 'published');

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM events ${whereClause}`,
    values,
  );
  const total = Number(countRows[0]?.count ?? 0);

  const dataRows = await query<EventRow>(
    `SELECT * FROM events ${whereClause} ORDER BY start_date ASC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );

  return {
    data: dataRows.map(mapEvent),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Organizer Events ─────────────────────────────────────────

export async function getOrganizerEvents(
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResult<Event>> {
  const offset = (page - 1) * limit;

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM events WHERE organizer_id = $1`,
    [userId],
  );
  const total = Number(countRows[0]?.count ?? 0);

  const dataRows = await query<EventRow>(
    `SELECT * FROM events WHERE organizer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  return {
    data: dataRows.map(mapEvent),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Featured Events ──────────────────────────────────────────

export async function getFeaturedEvents(
  countryCode?: string,
  limit: number = 10,
): Promise<Event[]> {
  // `is_featured` is not a real column on `events` — approximate "featured"
  // by ordering published, upcoming events by view_count instead.
  const conditions = [`status = 'published'`, `end_date >= $1`];
  const values: unknown[] = [new Date().toISOString()];
  let idx = 2;

  if (countryCode) {
    conditions.push(`venue_country = $${idx}`);
    values.push(countryCode);
    idx++;
  }

  values.push(limit);

  const rows = await query<EventRow>(
    `SELECT * FROM events WHERE ${conditions.join(' AND ')} ORDER BY view_count DESC, start_date ASC LIMIT $${idx}`,
    values,
  );

  return rows.map(mapEvent);
}

// ─── Upcoming Events ──────────────────────────────────────────

export async function getUpcomingEvents(
  countryCode?: string,
  limit: number = 20,
): Promise<Event[]> {
  const conditions = [`status = 'published'`, `start_date >= $1`];
  const values: unknown[] = [new Date().toISOString()];
  let idx = 2;

  if (countryCode) {
    conditions.push(`venue_country = $${idx}`);
    values.push(countryCode);
    idx++;
  }

  values.push(limit);

  const rows = await query<EventRow>(
    `SELECT * FROM events WHERE ${conditions.join(' AND ')} ORDER BY start_date ASC LIMIT $${idx}`,
    values,
  );

  return rows.map(mapEvent);
}

// ─── Past Events ──────────────────────────────────────────────

export async function getPastEvents(userId: string, limit: number = 20): Promise<Event[]> {
  const registrations = await query<{ event_id: string }>(
    `SELECT event_id FROM ticket_purchases WHERE buyer_id = $1 AND order_status = 'confirmed'`,
    [userId],
  );

  const eventIds = [...new Set(registrations.map((r) => r.event_id))];
  if (eventIds.length === 0) return [];

  const rows = await query<EventRow>(
    `SELECT * FROM events WHERE id = ANY($1::uuid[]) AND end_date < $2 ORDER BY end_date DESC LIMIT $3`,
    [eventIds, new Date().toISOString(), limit],
  );

  return rows.map(mapEvent);
}

// ─── Mappers ──────────────────────────────────────────────────

function mapEvent(row: EventRow): Event {
  const metadata = row.metadata ?? {};

  const location = {
    lat: metadata.venueLat ?? 0,
    lng: metadata.venueLng ?? 0,
  };

  const isFree = metadata.isFree ?? row.ticket_type === 'free';
  const ticketType = row.ticket_type ?? (isFree ? 'free' : 'paid');
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const galleryImages = Array.isArray(row.gallery_images) ? (row.gallery_images as string[]) : [];

  return {
    id: row.id,
    organizerId: row.organizer_id,
    organizerName: row.organizer_name ?? '',
    title: row.title,
    slug: row.slug,
    description: row.description ?? '',
    shortDescription: row.short_description ?? '',
    category: row.category,
    status: row.status,

    venue: row.venue_name ?? '',
    venueName: row.venue_name ?? undefined,
    venueAddress: row.venue_address ?? undefined,
    venueCity: row.venue_city ?? undefined,
    venueCountry: row.venue_country ?? undefined,
    venueLat: location.lat || undefined,
    venueLng: location.lng || undefined,
    address: row.venue_address ?? '',
    city: row.venue_city ?? '',
    country: row.venue_country ?? '',
    countryCode: row.venue_country ?? '',
    location,
    isVirtual: row.is_virtual ?? false,
    virtualLink: row.virtual_link ?? undefined,

    startDate: row.start_date,
    endDate: row.end_date,
    timezone: row.timezone,
    doorsOpenAt: row.doors_open_at ?? undefined,

    coverImageUrl: row.cover_image_url ?? '',
    galleryImages,
    promoVideoUrl: metadata.promoVideoUrl,
    flyerUrl: metadata.flyerUrl,

    ticketType,
    ticketTiers: [] as TicketTierConfig[],
    totalCapacity: row.total_capacity ?? 0,
    ticketsSold: row.tickets_sold ?? 0,
    waitlistEnabled: row.enable_waitlist ?? false,

    currencyCode: row.currency_code ?? getCurrencyForCountry(row.venue_country ?? 'NG'),
    minPrice: metadata.minPrice,
    maxPrice: metadata.maxPrice,
    isFree,
    platformFeePercent: row.platform_fee_percent ?? 5,
    platformFeeFixed: row.platform_fee_fixed ?? 1,
    taxRate: row.tax_rate ?? 0,

    requiresApproval: metadata.requiresApproval ?? false,
    showGuestList: metadata.showGuestList ?? false,
    allowRefunds: metadata.allowRefunds ?? true,
    refundDeadlineDays: metadata.refundDeadlineDays ?? 7,
    maxGuestsPerRegistration: row.max_guests_per_registration ?? 0,
    allowGuestRegistration: row.allow_guest_registration ?? undefined,
    maxGuestsPerTicket: row.max_guests_per_registration ?? undefined,

    metaTitle: metadata.metaTitle,
    metaDescription: metadata.metaDescription,
    shareImageUrl: metadata.shareImageUrl,
    shareUrl: row.share_url ?? '',
    tags,
    referralCode: metadata.referralCode ?? '',
    referralDiscountPercent: metadata.referralDiscountPercent ?? 0,
    enableReferrals: row.enable_referrals ?? false,

    viewCount: Number(row.view_count ?? 0),
    shareCount: Number(row.share_count ?? 0),
    favoriteCount: Number(row.favorite_count ?? 0),
    publishedAt: metadata.publishedAt,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTicket(row: EventTicketTypeRow): EventTypeTicket {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    type: row.tier as EventTypeTicket['type'],
    description: row.description ?? '',
    price: Number(row.price) ?? 0,
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    currencyCode: row.currency_code ?? getCurrencyForCountry('NG'),
    quantityAvailable: row.quantity_available ?? 0,
    quantitySold: row.quantity_sold ?? 0,
    maxPerOrder: row.max_per_order ?? 10,
    minPerOrder: row.min_per_order ?? 1,
    saleStartsAt: row.sale_starts_at ?? '',
    saleEndsAt: row.sale_ends_at ?? '',
    includesGuestRegistration: row.includes_guest_registration ?? false,
    maxGuestsPerTicket: row.max_guests_per_ticket ?? 0,
    benefits: Array.isArray(row.benefits) ? (row.benefits as string[]) : [],
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}
