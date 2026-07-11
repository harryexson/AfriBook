import type { SupabaseClient } from '@supabase/supabase-js';
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

// ─── Create Registration ──────────────────────────────────────

export async function createRegistration(
  sb: SupabaseClient,
  params: PurchaseTicketParams,
): Promise<RegistrationResult> {
  // 1. Validate ticket availability
  const { data: ticketType, error: ticketError } = await sb
    .from('event_tickets')
    .select('*')
    .eq('id', params.ticketTypeId)
    .eq('event_id', params.eventId)
    .single();

  if (ticketError || !ticketType) {
    throw new Error('Ticket type not found');
  }

  if (!ticketType.is_active) {
    throw new Error('This ticket type is no longer available');
  }

  const now = new Date().toISOString();
  if (new Date(ticketType.sale_ends_at) < new Date()) {
    throw new Error('Ticket sales have ended');
  }
  if (new Date(ticketType.sale_starts_at) > new Date()) {
    throw new Error('Ticket sales have not started yet');
  }

  const available = ticketType.quantity_available - ticketType.quantity_sold;
  if (available < params.quantity) {
    throw new Error(`Only ${available} tickets remaining`);
  }

  if (params.quantity > ticketType.max_per_order) {
    throw new Error(`Maximum ${ticketType.max_per_order} tickets per order`);
  }

  if (params.quantity < ticketType.min_per_order) {
    throw new Error(`Minimum ${ticketType.min_per_order} tickets per order`);
  }

  // 2. Get event details
  const { data: event, error: eventError } = await sb
    .from('events')
    .select('*')
    .eq('id', params.eventId)
    .single();

  if (eventError || !event) {
    throw new Error('Event not found');
  }

  // 3. Validate promo code if provided
  let promoDiscount: PromoCodeDiscount | undefined;
  if (params.promoCode) {
    const { data: promo, error: promoError } = await sb
      .from('promo_codes')
      .select('*')
      .eq('event_id', params.eventId)
      .eq('code', params.promoCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (promoError || !promo) {
      throw new Error('Invalid promo code');
    }

    if (new Date(promo.valid_until) < new Date()) {
      throw new Error('Promo code has expired');
    }

    if (promo.used_count >= promo.max_uses) {
      throw new Error('Promo code usage limit reached');
    }

    promoDiscount = {
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
    };
  }

  // 4. Calculate pricing
  const isFreeEvent = event.is_free && ticketType.price === 0;

  let pricing: PricingBreakdown;
  if (isFreeEvent) {
    pricing = calculateFreeEventPricing(params.quantity);
  } else {
    pricing = calculateTotalPricing(
      ticketType.price,
      params.quantity,
      'free', // TODO: get organizer's actual plan
      event.venue_country ?? 'US',
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
    currency: event.currency_code,
    totalPrice: pricing.total,
    eventUrl: event.share_url,
  });

  // 6. Create Stripe PaymentIntent (for paid events)
  let paymentIntentId: string | undefined;
  let clientSecret: string | undefined;

  if (!isFreeEvent && pricing.total > 0) {
    // In production, this would call the Stripe API
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const intent = await stripe.paymentIntents.create({
    //   amount: Math.round(pricing.total * 100),
    //   currency: event.currency_code.toLowerCase(),
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

  const registration = {
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
    currency_code: event.currency_code,
    payment_status: (isFreeEvent ? 'completed' : 'pending') as PaymentStatus,
    payment_method: params.paymentMethod ?? null,
    payment_intent_id: paymentIntentId ?? null,
    order_status: (isFreeEvent ? 'confirmed' : 'pending') as OrderStatus,
    ticket_code: primaryTicketCode,
    qr_code_url: generatedTickets[0]?.qrCodeDataUrl ?? '',
    promo_code: params.promoCode?.toUpperCase() ?? null,
    referral_code: null,
    check_in_status: 'not_checked_in' as CheckInStatus,
    metadata: {},
    created_at: now,
    updated_at: now,
  };

  const { error: insertError } = await sb
    .from('ticket_purchases')
    .insert(registration);

  if (insertError) {
    throw new Error(`Failed to create registration: ${insertError.message}`);
  }

  // 8. Update promo code usage
  if (params.promoCode) {
    await sb
      .from('promo_codes')
      .update({ used_count: sb.rpc ? undefined : undefined }) // will use RPC
      .eq('event_id', params.eventId)
      .eq('code', params.promoCode.toUpperCase());
  }

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
  sb: SupabaseClient,
  registrationId: string,
  paymentIntentId: string,
): Promise<TicketPurchase> {
  const { data: registration, error: fetchError } = await sb
    .from('ticket_purchases')
    .select('*')
    .eq('id', registrationId)
    .single();

  if (fetchError || !registration) {
    throw new Error('Registration not found');
  }

  if (registration.payment_intent_id !== paymentIntentId) {
    throw new Error('Payment intent mismatch');
  }

  if (registration.order_status === 'confirmed') {
    return mapRegistration(registration);
  }

  const now = new Date().toISOString();

  // 1. Update registration status
  const { error: updateError } = await sb
    .from('ticket_purchases')
    .update({
      payment_status: 'completed',
      order_status: 'confirmed',
      updated_at: now,
    })
    .eq('id', registrationId);

  if (updateError) {
    throw new Error(`Failed to confirm registration: ${updateError.message}`);
  }

  // 2. Decrement ticket availability
  await sb
    .from('event_tickets')
    .update({
      quantity_sold: sb.rpc
        ? undefined
        : undefined, // Use RPC for atomic decrement
    })
    .eq('id', registration.ticket_type_id);

  // Atomic decrement via RPC
  await sb.rpc('decrement_ticket_quantity', {
    p_ticket_type_id: registration.ticket_type_id,
    p_quantity: registration.quantity,
  });

  // 3. Update event tickets sold count
  await sb.rpc('increment_event_tickets_sold', {
    p_event_id: registration.event_id,
    p_quantity: registration.quantity,
  });

  // 4. Generate and store individual tickets with QR codes
  const { data: event } = await sb
    .from('events')
    .select('title, start_date, venue_name, share_url, currency_code')
    .eq('id', registration.event_id)
    .single();

  const { data: ticketType } = await sb
    .from('event_tickets')
    .select('name')
    .eq('id', registration.ticket_type_id)
    .single();

  if (event && ticketType) {
    for (let i = 0; i < registration.quantity; i++) {
      const ticketCode = generateTicketCode();
      const qrCodeDataUrl = await generateTicketQR(
        registration.event_id,
        ticketCode,
      );

      await sb.from('event_individual_tickets').insert({
        registration_id: registrationId,
        event_id: registration.event_id,
        ticket_code: ticketCode,
        qr_code_url: qrCodeDataUrl,
        ticket_type: ticketType.name,
        attendee_name: registration.buyer_name,
        attendee_email: registration.buyer_email,
        check_in_status: 'not_checked_in',
        created_at: now,
      });
    }
  }

  return mapRegistration({ ...registration, payment_status: 'completed', order_status: 'confirmed', updated_at: now });
}

// ─── Cancel Registration ──────────────────────────────────────

export async function cancelRegistration(
  sb: SupabaseClient,
  registrationId: string,
  userId: string,
): Promise<{ refundAmount: number; refundEligible: boolean }> {
  const { data: registration, error: fetchError } = await sb
    .from('ticket_purchases')
    .select('*, events!inner(*)')
    .eq('id', registrationId)
    .single();

  if (fetchError || !registration) {
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

  // Check refund policy (full refund if 7+ days before event, 50% if 3-7 days, no refund if <3 days)
  const eventDate = new Date(registration.events.start_date);
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

  const now_iso = new Date().toISOString();

  // Update registration
  await sb
    .from('ticket_purchases')
    .update({
      order_status: 'cancelled',
      payment_status: refundEligible ? 'refunded' : 'completed',
      cancelled_at: now_iso,
      refund_amount: refundAmount,
      refunded_at: refundEligible ? now_iso : null,
      updated_at: now_iso,
    })
    .eq('id', registrationId);

  // Restore ticket availability
  await sb.rpc('increment_ticket_quantity', {
    p_ticket_type_id: registration.ticket_type_id,
    p_quantity: registration.quantity,
  });

  await sb.rpc('decrement_event_tickets_sold', {
    p_event_id: registration.event_id,
    p_quantity: registration.quantity,
  });

  // Cancel individual tickets
  await sb
    .from('event_individual_tickets')
    .update({ check_in_status: 'cancelled' })
    .eq('registration_id', registrationId);

  return { refundAmount, refundEligible };
}

// ─── Get Registration By ID ───────────────────────────────────

export async function getRegistrationById(
  sb: SupabaseClient,
  id: string,
): Promise<TicketPurchase | null> {
  const { data, error } = await sb
    .from('ticket_purchases')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapRegistration(data);
}

// ─── User Registrations ───────────────────────────────────────

export async function getUserRegistrations(
  sb: SupabaseClient,
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResult<TicketPurchase>> {
  const offset = (page - 1) * limit;

  const { data, error, count } = await sb
    .from('ticket_purchases')
    .select('*', { count: 'exact' })
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to get registrations: ${error.message}`);

  return {
    data: (data ?? []).map(mapRegistration),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─── Event Registrations (Organizer View) ─────────────────────

export async function getEventRegistrations(
  sb: SupabaseClient,
  eventId: string,
  page: number = 1,
  limit: number = 50,
): Promise<PaginatedResult<TicketPurchase>> {
  const offset = (page - 1) * limit;

  const { data, error, count } = await sb
    .from('ticket_purchases')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to get event registrations: ${error.message}`);

  return {
    data: (data ?? []).map(mapRegistration),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─── Add Guests ───────────────────────────────────────────────

export async function addGuests(
  sb: SupabaseClient,
  registrationId: string,
  guests: { name: string; email: string; phone?: string }[],
): Promise<EventGuest[]> {
  const { data: registration, error: fetchError } = await sb
    .from('ticket_purchases')
    .select('*, event_tickets!inner(max_guests_per_ticket, includes_guest_registration)')
    .eq('id', registrationId)
    .single();

  if (fetchError || !registration) {
    throw new Error('Registration not found');
  }

  if (!registration.event_tickets.includes_guest_registration) {
    throw new Error('Guest registration is not included with this ticket type');
  }

  const { count: existingGuests } = await sb
    .from('event_guests')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_purchase_id', registrationId);

  const maxGuests = registration.quantity * registration.event_tickets.max_guests_per_ticket;
  if ((existingGuests ?? 0) + guests.length > maxGuests) {
    throw new Error(`Maximum ${maxGuests} guests allowed for this registration`);
  }

  const now = new Date().toISOString();
  const guestRows = guests.map((g) => ({
    event_id: registration.event_id,
    ticket_purchase_id: registrationId,
    host_id: registration.buyer_id,
    guest_name: g.name,
    guest_email: g.email,
    guest_phone: g.phone ?? null,
    ticket_code: generateTicketCode(),
    qr_code_url: '',
    check_in_status: 'not_checked_in' as CheckInStatus,
    created_at: now,
  }));

  // Generate QR codes for each guest
  for (const guest of guestRows) {
    guest.qr_code_url = await generateTicketQR(
      registration.event_id,
      guest.ticket_code,
    );
  }

  const { data, error } = await sb
    .from('event_guests')
    .insert(guestRows)
    .select();

  if (error) throw new Error(`Failed to add guests: ${error.message}`);

  return (data ?? []).map((g) => ({
    id: g.id,
    eventId: g.event_id,
    ticketPurchaseId: g.ticket_purchase_id,
    hostId: g.host_id,
    guestName: g.guest_name,
    guestEmail: g.guest_email,
    guestPhone: g.guest_phone,
    ticketCode: g.ticket_code,
    qrCodeUrl: g.qr_code_url,
    checkInStatus: g.check_in_status,
    checkedInAt: g.checked_in_at,
    checkedInBy: g.checked_in_by,
    photoUrl: g.photo_url,
    photoPageUrl: g.photo_page_url,
    dietaryRestrictions: g.dietary_restrictions,
    specialRequirements: g.special_requirements,
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

export async function getEventAttendeeList(
  sb: SupabaseClient,
  eventId: string,
): Promise<AttendeeEntry[]> {
  const { data: registrations, error } = await sb
    .from('ticket_purchases')
    .select('*')
    .eq('event_id', eventId)
    .eq('order_status', 'confirmed')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to get attendee list: ${error.message}`);

  const results: AttendeeEntry[] = [];

  for (const reg of registrations ?? []) {
    const { data: guests } = await sb
      .from('event_guests')
      .select('*')
      .eq('ticket_purchase_id', reg.id);

    const guestList = (guests ?? []).map((g) => ({
      id: g.id,
      eventId: g.event_id,
      ticketPurchaseId: g.ticket_purchase_id,
      hostId: g.host_id,
      guestName: g.guest_name,
      guestEmail: g.guest_email,
      guestPhone: g.guest_phone,
      ticketCode: g.ticket_code,
      qrCodeUrl: g.qr_code_url,
      checkInStatus: g.check_in_status,
      checkedInAt: g.checked_in_at,
      checkedInBy: g.checked_in_by,
      photoUrl: g.photo_url,
      photoPageUrl: g.photo_page_url,
      dietaryRestrictions: g.dietary_restrictions,
      specialRequirements: g.special_requirements,
      createdAt: g.created_at,
    }));

    const checkedInGuests = guestList.filter(
      (g) => g.checkInStatus === 'checked_in',
    ).length;

    results.push({
      registration: mapRegistration(reg),
      guests: guestList,
      checkedInCount:
        (reg.check_in_status === 'checked_in' ? 1 : 0) + checkedInGuests,
      totalCount: 1 + guestList.length,
    });
  }

  return results;
}

// ─── Mappers ──────────────────────────────────────────────────

function mapRegistration(row: Record<string, unknown>): TicketPurchase {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    ticketTypeId: (row.ticket_type_id as string) ?? '',
    buyerId: row.buyer_id as string,
    buyerName: row.buyer_name as string,
    buyerEmail: row.buyer_email as string,
    buyerPhone: (row.buyer_phone as string) ?? undefined,
    quantity: row.quantity as number,
    unitPrice: row.unit_price as number,
    subtotal: row.subtotal as number,
    platformFee: row.platform_fee as number,
    processingFee: row.processing_fee as number,
    total: row.total as number,
    currencyCode: row.currency_code as string,
    paymentStatus: row.payment_status as PaymentStatus,
    paymentMethod: (row.payment_method as string) ?? undefined,
    paymentIntentId: (row.payment_intent_id as string) ?? undefined,
    orderStatus: row.order_status as OrderStatus,
    ticketCode: row.ticket_code as string,
    qrCodeUrl: (row.qr_code_url as string) ?? '',
    promoCode: (row.promo_code as string) ?? undefined,
    referralCode: (row.referral_code as string) ?? undefined,
    checkedInAt: (row.checked_in_at as string) ?? undefined,
    checkInStatus: row.check_in_status as CheckInStatus,
    transferredTo: (row.transferred_to as string) ?? undefined,
    cancelledAt: (row.cancelled_at as string) ?? undefined,
    refundAmount: (row.refund_amount as number) ?? undefined,
    refundedAt: (row.refunded_at as string) ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
