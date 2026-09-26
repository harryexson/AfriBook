import { query } from '@/lib/neon/admin';
import type {
  TicketPurchase,
  EventGuest,
  CheckInStatus,
  PaymentStatus,
  OrderStatus,
} from '@/types/events';
import type { PurchaseTicketParams } from './types';
import {
  calculateTotalPricing,
  calculateFreeEventPricing,
  type PricingBreakdown,
  type PromoCodeDiscount,
} from './pricing';
import {
  generateTicketCode,
  generateTicketQR,
  generateTicketsForRegistration,
} from './qr-generator';

// ─── Types ────────────────────────────────────────────────────

interface RegistrationResult {
  registration: TicketPurchase;
  pricing: PricingBreakdown;
  tickets: { ticketCode: string; qrCodeDataUrl: string }[];
  paymentIntentId?: string;
  clientSecret?: string;
  isFreeEvent: boolean;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// `ticket_purchases` has no payment_intent_id or referral_code column —
// both are kept in its `metadata` jsonb bag instead.
interface RegistrationMetadata {
  paymentIntentId?: string;
  referralCode?: string | null;
  cancelledAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  [key: string]: unknown;
}

interface TicketTypeRow {
  id: string;
  event_id: string;
  name: string;
  price: number;
  is_active: boolean | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  quantity_available: number | null;
  quantity_sold: number | null;
  max_per_order: number | null;
  min_per_order: number | null;
  max_guests_per_ticket: number | null;
  includes_guest_registration: boolean | null;
}

interface EventRow {
  id: string;
  title: string;
  start_date: string;
  venue_name: string | null;
  venue_country: string | null;
  share_url: string | null;
  currency_code: string | null;
  ticket_type: string;
}

interface PromoCodeRow {
  id: string;
  event_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number | null;
  valid_until: string | null;
  is_active: boolean | null;
}

interface TicketPurchaseRow {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  platform_fee: number;
  processing_fee: number;
  total: number;
  currency_code: string;
  payment_status: PaymentStatus;
  payment_method: string | null;
  order_status: OrderStatus;
  ticket_code: string;
  qr_code_url: string | null;
  promo_code: string | null;
  ticket_tier_name: string | null;
  check_in_status: CheckInStatus;
  checked_in_at: string | null;
  metadata: RegistrationMetadata | null;
  created_at: string;
  updated_at: string;
}

// ─── Create Registration ──────────────────────────────────────

export async function createRegistration(
  params: PurchaseTicketParams,
): Promise<RegistrationResult> {
  // 1. Validate ticket availability. Ticket tier/pricing config lives in
  // `event_ticket_types` (not `event_tickets`, which holds individual
  // attendee tickets — see confirmRegistration below).
  const ticketTypeRows = await query<TicketTypeRow>(
    `SELECT * FROM event_ticket_types WHERE id = $1 AND event_id = $2 LIMIT 1`,
    [params.ticketTypeId, params.eventId],
  );
  const ticketType = ticketTypeRows[0];

  if (!ticketType) {
    throw new Error('Ticket type not found');
  }

  if (!ticketType.is_active) {
    throw new Error('This ticket type is no longer available');
  }

  if (ticketType.sale_ends_at && new Date(ticketType.sale_ends_at) < new Date()) {
    throw new Error('Ticket sales have ended');
  }
  if (ticketType.sale_starts_at && new Date(ticketType.sale_starts_at) > new Date()) {
    throw new Error('Ticket sales have not started yet');
  }

  const available = (ticketType.quantity_available ?? 0) - (ticketType.quantity_sold ?? 0);
  if (available < params.quantity) {
    throw new Error(`Only ${available} tickets remaining`);
  }

  if (ticketType.max_per_order && params.quantity > ticketType.max_per_order) {
    throw new Error(`Maximum ${ticketType.max_per_order} tickets per order`);
  }

  if (ticketType.min_per_order && params.quantity < ticketType.min_per_order) {
    throw new Error(`Minimum ${ticketType.min_per_order} tickets per order`);
  }

  // 2. Get event details
  const eventRows = await query<EventRow>(`SELECT * FROM events WHERE id = $1 LIMIT 1`, [params.eventId]);
  const event = eventRows[0];

  if (!event) {
    throw new Error('Event not found');
  }

  // 3. Validate promo code if provided. `promo_codes` has no event_id —
  // the event-scoped equivalent is `event_promo_codes`.
  let promoDiscount: PromoCodeDiscount | undefined;
  let promoRow: PromoCodeRow | undefined;
  if (params.promoCode) {
    const promoRows = await query<PromoCodeRow>(
      `SELECT * FROM event_promo_codes WHERE event_id = $1 AND code = $2 AND is_active = true LIMIT 1`,
      [params.eventId, params.promoCode.toUpperCase()],
    );
    promoRow = promoRows[0];

    if (!promoRow) {
      throw new Error('Invalid promo code');
    }

    if (promoRow.valid_until && new Date(promoRow.valid_until) < new Date()) {
      throw new Error('Promo code has expired');
    }

    if (promoRow.max_uses != null && (promoRow.used_count ?? 0) >= promoRow.max_uses) {
      throw new Error('Promo code usage limit reached');
    }

    promoDiscount = {
      discountType: promoRow.discount_type as PromoCodeDiscount['discountType'],
      discountValue: promoRow.discount_value,
    };
  }

  // 4. Calculate pricing
  const isFreeEvent = event.ticket_type === 'free' && Number(ticketType.price) === 0;

  let pricing: PricingBreakdown;
  const countryCode = event.venue_country ?? 'NG';
  if (isFreeEvent) {
    pricing = calculateFreeEventPricing(params.quantity, countryCode);
  } else {
    pricing = calculateTotalPricing(
      Number(ticketType.price),
      params.quantity,
      'free', // TODO: get organizer's actual plan
      countryCode,
      params.paymentMethod ?? 'card',
      promoDiscount,
    );
  }

  // 5. Generate tickets
  const generatedTickets = await generateTicketsForRegistration({
    id: crypto.randomUUID(),
    eventId: params.eventId,
    buyerId: params.buyerId,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    quantity: params.quantity,
    ticketType: ticketType.name,
    eventName: event.title,
    eventDate: new Date(event.start_date).toLocaleDateString(),
    eventTime: new Date(event.start_date).toLocaleTimeString(),
    venue: event.venue_name ?? 'Virtual Event',
    currency: pricing.currencyCode,
    totalPrice: pricing.total,
    eventUrl: event.share_url ?? '',
  });

  // 6. Create Stripe PaymentIntent (for paid events)
  let paymentIntentId: string | undefined;
  let clientSecret: string | undefined;

  if (!isFreeEvent && pricing.total > 0) {
    // In production, this would call the Stripe API
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const intent = await stripe.paymentIntents.create({
    //   amount: Math.round(pricing.total * 100),
    //   currency: pricing.currencyCode.toLowerCase(),
    //   metadata: { eventId: params.eventId, buyerId: params.buyerId },
    // });
    // paymentIntentId = intent.id;
    // clientSecret = intent.client_secret;

    paymentIntentId = `pi_${crypto.randomUUID().slice(0, 24)}`;
    clientSecret = `${paymentIntentId}_secret_${crypto.randomUUID().slice(0, 16)}`;
  }

  // 7. Save registration as pending
  const registrationId = crypto.randomUUID();
  const primaryTicketCode = generatedTickets[0]?.ticketCode ?? generateTicketCode();
  const now = new Date().toISOString();

  const metadata: RegistrationMetadata = {
    paymentIntentId: paymentIntentId ?? undefined,
    referralCode: null,
  };

  const paymentStatus: PaymentStatus = isFreeEvent ? 'completed' : 'pending';
  const orderStatus: OrderStatus = isFreeEvent ? 'confirmed' : 'pending';

  await query(
    `INSERT INTO ticket_purchases (
       id, event_id, ticket_type_id, buyer_id, buyer_name, buyer_email, buyer_phone,
       quantity, unit_price, subtotal, platform_fee, processing_fee, total, currency_code,
       payment_status, payment_method, order_status, ticket_code, qr_code_url, promo_code,
       ticket_tier_name, check_in_status, metadata, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10, $11, $12, $13, $14,
       $15, $16, $17, $18, $19, $20,
       $21, $22, $23, $24, $25
     )`,
    [
      registrationId,
      params.eventId,
      params.ticketTypeId,
      params.buyerId,
      params.buyerName,
      params.buyerEmail,
      params.buyerPhone ?? null,
      params.quantity,
      ticketType.price,
      pricing.subtotal,
      pricing.platformFee.amount,
      pricing.processingFee.amount,
      pricing.total,
      pricing.currencyCode,
      paymentStatus,
      params.paymentMethod ?? null,
      orderStatus,
      primaryTicketCode,
      generatedTickets[0]?.qrCodeDataUrl ?? '',
      params.promoCode?.toUpperCase() ?? null,
      ticketType.name,
      'not_checked_in',
      JSON.stringify(metadata),
      now,
      now,
    ],
  );

  // 8. Update promo code usage (atomic increment — no RPC available)
  if (promoRow) {
    await query(
      `UPDATE event_promo_codes SET used_count = COALESCE(used_count, 0) + 1 WHERE id = $1`,
      [promoRow.id],
    );
  }

  const registration: TicketPurchaseRow = {
    id: registrationId,
    event_id: params.eventId,
    ticket_type_id: params.ticketTypeId,
    buyer_id: params.buyerId,
    buyer_name: params.buyerName,
    buyer_email: params.buyerEmail,
    buyer_phone: params.buyerPhone ?? null,
    quantity: params.quantity,
    unit_price: ticketType.price,
    subtotal: pricing.subtotal,
    platform_fee: pricing.platformFee.amount,
    processing_fee: pricing.processingFee.amount,
    total: pricing.total,
    currency_code: pricing.currencyCode,
    payment_status: paymentStatus,
    payment_method: params.paymentMethod ?? null,
    order_status: orderStatus,
    ticket_code: primaryTicketCode,
    qr_code_url: generatedTickets[0]?.qrCodeDataUrl ?? '',
    promo_code: params.promoCode?.toUpperCase() ?? null,
    ticket_tier_name: ticketType.name,
    check_in_status: 'not_checked_in',
    checked_in_at: null,
    metadata,
    created_at: now,
    updated_at: now,
  };

  return {
    registration: mapRegistration(registration),
    pricing,
    tickets: generatedTickets.map((t) => ({
      ticketCode: t.ticketCode,
      qrCodeDataUrl: t.qrCodeDataUrl,
    })),
    paymentIntentId,
    clientSecret,
    isFreeEvent,
  };
}

// ─── Confirm Registration ─────────────────────────────────────

export async function confirmRegistration(
  registrationId: string,
  paymentIntentId: string,
): Promise<TicketPurchase> {
  const rows = await query<TicketPurchaseRow>(
    `SELECT * FROM ticket_purchases WHERE id = $1 LIMIT 1`,
    [registrationId],
  );
  const registration = rows[0];

  if (!registration) {
    throw new Error('Registration not found');
  }

  if ((registration.metadata?.paymentIntentId ?? null) !== paymentIntentId) {
    throw new Error('Payment intent mismatch');
  }

  if (registration.order_status === 'confirmed') {
    return mapRegistration(registration);
  }

  const now = new Date().toISOString();

  // 1. Update registration status
  await query(
    `UPDATE ticket_purchases SET payment_status = $1, order_status = $2, updated_at = $3 WHERE id = $4`,
    ['completed', 'confirmed', now, registrationId],
  );

  // 2. Atomic increment of quantity_sold on the ticket type (replaces the
  // non-existent decrement_ticket_quantity RPC)
  if (registration.ticket_type_id) {
    await query(
      `UPDATE event_ticket_types SET quantity_sold = COALESCE(quantity_sold, 0) + $1 WHERE id = $2`,
      [registration.quantity, registration.ticket_type_id],
    );
  }

  // 3. Update event tickets sold count (replaces increment_event_tickets_sold RPC)
  await query(
    `UPDATE events SET tickets_sold = COALESCE(tickets_sold, 0) + $1 WHERE id = $2`,
    [registration.quantity, registration.event_id],
  );

  // 4. Generate and store individual tickets with QR codes. The real table
  // for these is `event_tickets` (event_individual_tickets does not exist).
  const eventRows = await query<{ title: string; start_date: string; venue_name: string | null; share_url: string | null; currency_code: string | null }>(
    `SELECT title, start_date, venue_name, share_url, currency_code FROM events WHERE id = $1 LIMIT 1`,
    [registration.event_id],
  );
  const event = eventRows[0];

  const ticketTypeRows = registration.ticket_type_id
    ? await query<{ name: string }>(`SELECT name FROM event_ticket_types WHERE id = $1 LIMIT 1`, [registration.ticket_type_id])
    : [];
  const ticketTypeName = ticketTypeRows[0]?.name ?? registration.ticket_tier_name ?? '';

  if (event) {
    for (let i = 0; i < registration.quantity; i++) {
      const ticketCode = generateTicketCode();
      const qrCodeDataUrl = await generateTicketQR(registration.event_id, ticketCode);

      await query(
        `INSERT INTO event_tickets (
           id, registration_id, event_id, user_id, ticket_code, tier_name,
           attendee_name, attendee_email, status, qr_code_url, checked_in, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          crypto.randomUUID(),
          registrationId,
          registration.event_id,
          registration.buyer_id,
          ticketCode,
          ticketTypeName,
          registration.buyer_name,
          registration.buyer_email,
          'active',
          qrCodeDataUrl,
          false,
          new Date().toISOString(),
        ],
      );
    }
  }

  return mapRegistration({
    ...registration,
    payment_status: 'completed',
    order_status: 'confirmed',
    updated_at: now,
  });
}

// ─── Cancel Registration ──────────────────────────────────────

export async function cancelRegistration(
  registrationId: string,
  userId: string,
): Promise<{ refundAmount: number; refundEligible: boolean }> {
  const rows = await query<TicketPurchaseRow>(
    `SELECT * FROM ticket_purchases WHERE id = $1 LIMIT 1`,
    [registrationId],
  );
  const registration = rows[0];

  if (!registration) {
    throw new Error('Registration not found');
  }

  if (registration.buyer_id !== userId) {
    throw new Error('Only the buyer can cancel this registration');
  }

  if (registration.order_status === 'cancelled') {
    throw new Error('Registration is already cancelled');
  }

  if (registration.order_status !== 'confirmed') {
    throw new Error('Only confirmed registrations can be cancelled');
  }

  const eventRows = await query<{ start_date: string }>(
    `SELECT start_date FROM events WHERE id = $1 LIMIT 1`,
    [registration.event_id],
  );
  const eventDate = new Date(eventRows[0]?.start_date ?? Date.now());
  const now = new Date();
  const daysUntilEvent = Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  let refundAmount = 0;
  let refundEligible = false;

  if (daysUntilEvent >= 7) {
    refundAmount = registration.total;
    refundEligible = true;
  } else if (daysUntilEvent >= 3) {
    refundAmount = registration.total * 0.5;
    refundEligible = true;
  }

  const nowIso = new Date().toISOString();

  // cancelled_at/refund_amount/refunded_at are not real columns on
  // ticket_purchases — stored in metadata jsonb instead.
  const mergedMetadata: RegistrationMetadata = {
    ...(registration.metadata ?? {}),
    cancelledAt: nowIso,
    refundAmount,
    refundedAt: refundEligible ? nowIso : undefined,
  };

  await query(
    `UPDATE ticket_purchases
     SET order_status = $1, payment_status = $2, metadata = $3, updated_at = $4
     WHERE id = $5`,
    [
      'cancelled',
      refundEligible ? 'refunded' : 'completed',
      JSON.stringify(mergedMetadata),
      nowIso,
      registrationId,
    ],
  );

  // Restore ticket availability (replaces increment_ticket_quantity /
  // decrement_event_tickets_sold RPCs)
  if (registration.ticket_type_id) {
    await query(
      `UPDATE event_ticket_types SET quantity_sold = GREATEST(COALESCE(quantity_sold, 0) - $1, 0) WHERE id = $2`,
      [registration.quantity, registration.ticket_type_id],
    );
  }

  await query(
    `UPDATE events SET tickets_sold = GREATEST(COALESCE(tickets_sold, 0) - $1, 0) WHERE id = $2`,
    [registration.quantity, registration.event_id],
  );

  // Cancel individual tickets (event_tickets, not event_individual_tickets)
  await query(`UPDATE event_tickets SET status = 'cancelled' WHERE registration_id = $1`, [registrationId]);

  return { refundAmount, refundEligible };
}

// ─── Get Registration By ID ───────────────────────────────────

export async function getRegistrationById(id: string): Promise<TicketPurchase | null> {
  const rows = await query<TicketPurchaseRow>(`SELECT * FROM ticket_purchases WHERE id = $1 LIMIT 1`, [id]);
  const data = rows[0];
  if (!data) return null;
  return mapRegistration(data);
}

// ─── User Registrations ───────────────────────────────────────

export async function getUserRegistrations(
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResult<TicketPurchase>> {
  const offset = (page - 1) * limit;

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ticket_purchases WHERE buyer_id = $1`,
    [userId],
  );
  const total = Number(countRows[0]?.count ?? 0);

  const dataRows = await query<TicketPurchaseRow>(
    `SELECT * FROM ticket_purchases WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  return {
    data: dataRows.map(mapRegistration),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Event Registrations (Organizer View) ─────────────────────

export async function getEventRegistrations(
  eventId: string,
  page: number = 1,
  limit: number = 50,
): Promise<PaginatedResult<TicketPurchase>> {
  const offset = (page - 1) * limit;

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1`,
    [eventId],
  );
  const total = Number(countRows[0]?.count ?? 0);

  const dataRows = await query<TicketPurchaseRow>(
    `SELECT * FROM ticket_purchases WHERE event_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [eventId, limit, offset],
  );

  return {
    data: dataRows.map(mapRegistration),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Add Guests ───────────────────────────────────────────────

export async function addGuests(
  registrationId: string,
  guests: { name: string; email: string; phone?: string }[],
): Promise<EventGuest[]> {
  const regRows = await query<TicketPurchaseRow>(
    `SELECT * FROM ticket_purchases WHERE id = $1 LIMIT 1`,
    [registrationId],
  );
  const registration = regRows[0];

  if (!registration) {
    throw new Error('Registration not found');
  }

  const ticketTypeRows = registration.ticket_type_id
    ? await query<{ max_guests_per_ticket: number | null; includes_guest_registration: boolean | null }>(
        `SELECT max_guests_per_ticket, includes_guest_registration FROM event_ticket_types WHERE id = $1 LIMIT 1`,
        [registration.ticket_type_id],
      )
    : [];
  const ticketType = ticketTypeRows[0];

  if (!ticketType?.includes_guest_registration) {
    throw new Error('Guest registration is not included with this ticket type');
  }

  const existingGuestRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM event_guests WHERE ticket_purchase_id = $1`,
    [registrationId],
  );
  const existingGuests = Number(existingGuestRows[0]?.count ?? 0);

  const maxGuests = registration.quantity * (ticketType.max_guests_per_ticket ?? 0);
  if (existingGuests + guests.length > maxGuests) {
    throw new Error(`Maximum ${maxGuests} guests allowed for this registration`);
  }

  const now = new Date().toISOString();
  const guestRows = await Promise.all(
    guests.map(async (g) => {
      const ticketCode = generateTicketCode();
      const qrCodeUrl = await generateTicketQR(registration.event_id, ticketCode);
      return {
        id: crypto.randomUUID(),
        event_id: registration.event_id,
        ticket_purchase_id: registrationId,
        host_id: registration.buyer_id,
        guest_name: g.name,
        guest_email: g.email,
        guest_phone: g.phone ?? null,
        ticket_code: ticketCode,
        qr_code_url: qrCodeUrl,
        check_in_status: 'not_checked_in' as CheckInStatus,
        created_at: now,
      };
    }),
  );

  const columns = [
    'id', 'event_id', 'ticket_purchase_id', 'host_id', 'guest_name', 'guest_email',
    'guest_phone', 'ticket_code', 'qr_code_url', 'check_in_status', 'created_at',
  ];
  const values: unknown[] = [];
  const placeholders = guestRows.map((row, rowIdx) => {
    const placeholderRow = columns.map((col, colIdx) => {
      values.push((row as Record<string, unknown>)[col]);
      return `$${rowIdx * columns.length + colIdx + 1}`;
    });
    return `(${placeholderRow.join(', ')})`;
  });

  const inserted = await query<{
    id: string;
    event_id: string;
    ticket_purchase_id: string;
    host_id: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string | null;
    ticket_code: string;
    qr_code_url: string | null;
    check_in_status: CheckInStatus;
    checked_in_at: string | null;
    checked_in_by: string | null;
    created_at: string;
  }>(
    `INSERT INTO event_guests (${columns.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`,
    values,
  );

  return inserted.map((g) => ({
    id: g.id,
    eventId: g.event_id,
    ticketPurchaseId: g.ticket_purchase_id,
    hostId: g.host_id,
    guestName: g.guest_name,
    guestEmail: g.guest_email,
    guestPhone: g.guest_phone ?? undefined,
    ticketCode: g.ticket_code,
    qrCodeUrl: g.qr_code_url ?? '',
    checkInStatus: g.check_in_status,
    checkedInAt: g.checked_in_at ?? undefined,
    checkedInBy: g.checked_in_by ?? undefined,
    createdAt: g.created_at,
  }));
}

// ─── Event Attendee List ──────────────────────────────────────

export interface AttendeeEntry {
  registration: TicketPurchase;
  guests: EventGuest[];
  checkedInCount: number;
  totalCount: number;
}

export async function getEventAttendeeList(eventId: string): Promise<AttendeeEntry[]> {
  const registrations = await query<TicketPurchaseRow>(
    `SELECT * FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed' ORDER BY created_at ASC`,
    [eventId],
  );

  const results: AttendeeEntry[] = [];

  for (const reg of registrations) {
    const guests = await query<{
      id: string;
      event_id: string;
      ticket_purchase_id: string;
      host_id: string;
      guest_name: string;
      guest_email: string;
      guest_phone: string | null;
      ticket_code: string;
      qr_code_url: string | null;
      check_in_status: CheckInStatus;
      checked_in_at: string | null;
      checked_in_by: string | null;
      created_at: string;
    }>(`SELECT * FROM event_guests WHERE ticket_purchase_id = $1`, [reg.id]);

    const guestList: EventGuest[] = guests.map((g) => ({
      id: g.id,
      eventId: g.event_id,
      ticketPurchaseId: g.ticket_purchase_id,
      hostId: g.host_id,
      guestName: g.guest_name,
      guestEmail: g.guest_email,
      guestPhone: g.guest_phone ?? undefined,
      ticketCode: g.ticket_code,
      qrCodeUrl: g.qr_code_url ?? '',
      checkInStatus: g.check_in_status,
      checkedInAt: g.checked_in_at ?? undefined,
      checkedInBy: g.checked_in_by ?? undefined,
      createdAt: g.created_at,
    }));

    const checkedInGuests = guestList.filter((g) => g.checkInStatus === 'checked_in').length;

    results.push({
      registration: mapRegistration(reg),
      guests: guestList,
      checkedInCount: (reg.check_in_status === 'checked_in' ? 1 : 0) + checkedInGuests,
      totalCount: 1 + guestList.length,
    });
  }

  return results;
}

// ─── Mappers ──────────────────────────────────────────────────

function mapRegistration(row: TicketPurchaseRow): TicketPurchase {
  const metadata = row.metadata ?? {};
  return {
    id: row.id,
    eventId: row.event_id,
    ticketTypeId: row.ticket_type_id ?? '',
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone ?? undefined,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    subtotal: row.subtotal,
    platformFee: row.platform_fee,
    processingFee: row.processing_fee,
    total: row.total,
    currencyCode: row.currency_code,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method ?? undefined,
    paymentIntentId: metadata.paymentIntentId ?? undefined,
    orderStatus: row.order_status,
    ticketCode: row.ticket_code,
    qrCodeUrl: row.qr_code_url ?? '',
    promoCode: row.promo_code ?? undefined,
    referralCode: metadata.referralCode ?? undefined,
    checkedInAt: row.checked_in_at ?? undefined,
    checkInStatus: row.check_in_status,
    transferredTo: undefined,
    cancelledAt: metadata.cancelledAt,
    refundAmount: metadata.refundAmount,
    refundedAt: metadata.refundedAt,
    metadata: metadata as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
