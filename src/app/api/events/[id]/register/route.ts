import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getOrganizerStripeAccountId(organizerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('vendor_wallets')
    .select('metadata')
    .eq('vendor_id', organizerId)
    .maybeSingle();

  if (error || !data) return null;
  const acctId = (data.metadata as Record<string, unknown> | null)?.stripe_account_id as string | undefined;
  return acctId ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      ticketTierId,
      quantity,
      guests,
      promoCode,
      specialRequests,
    } = body;

    if (!userId || !userEmail || !ticketTierId || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, userEmail, ticketTierId, quantity' },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 50) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be between 1 and 50' },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, organizer_id, status, total_capacity, tickets_sold, is_free, currency_code, platform_fee_percent, platform_fee_fixed, enable_waitlist, title, start_date, end_date')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Event is not accepting registrations' },
        { status: 400 }
      );
    }

    const { data: ticketTier, error: tierError } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('id', ticketTierId)
      .eq('event_id', eventId)
      .eq('is_active', true)
      .single();

    if (tierError || !ticketTier) {
      return NextResponse.json(
        { success: false, error: 'Ticket tier not found or inactive' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    if (ticketTier.sale_starts_at && now < ticketTier.sale_starts_at) {
      return NextResponse.json(
        { success: false, error: 'Ticket sales have not started yet' },
        { status: 400 }
      );
    }
    if (ticketTier.sale_ends_at && now > ticketTier.sale_ends_at) {
      return NextResponse.json(
        { success: false, error: 'Ticket sales have ended' },
        { status: 400 }
      );
    }

    if (quantity < (ticketTier.min_per_order ?? 1)) {
      return NextResponse.json(
        { success: false, error: `Minimum order is ${ticketTier.min_per_order} tickets` },
        { status: 400 }
      );
    }

    if (quantity > (ticketTier.max_per_order ?? 10)) {
      return NextResponse.json(
        { success: false, error: `Maximum order is ${ticketTier.max_per_order} tickets` },
        { status: 400 }
      );
    }

    const available = (ticketTier.quantity_available ?? 0) - (ticketTier.quantity_sold ?? 0);
    if (quantity > available) {
      if (event.enable_waitlist) {
        return NextResponse.json(
          { success: false, error: 'Not enough tickets available. Waitlist option available.', waitlistAvailable: true },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Only ${available} tickets remaining` },
        { status: 400 }
      );
    }

    const remainingCapacity = event.total_capacity - event.tickets_sold;
    if (quantity > remainingCapacity && event.total_capacity > 0) {
      return NextResponse.json(
        { success: false, error: 'Event has reached full capacity' },
        { status: 400 }
      );
    }

    let unitPrice = ticketTier.price ?? 0;
    let discountAmount = 0;

    if (promoCode) {
      const { data: promo } = await supabase
        .from('event_promo_codes')
        .select('*')
        .eq('event_id', eventId)
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promo && new Date(promo.valid_until) > new Date() && promo.used_count < promo.max_uses) {
        if (new Date(promo.valid_from) > new Date()) {
          return NextResponse.json(
            { success: false, error: 'Promo code is not yet valid' },
            { status: 400 }
          );
        }
        if (promo.discount_type === 'percent') {
          discountAmount = unitPrice * (promo.discount_value / 100);
        } else {
          discountAmount = Math.min(promo.discount_value, unitPrice);
        }
        unitPrice = Math.max(0, unitPrice - discountAmount);
        await supabase
          .from('event_promo_codes')
          .update({ used_count: promo.used_count + 1 })
          .eq('id', promo.id);
      }
    }

    const subtotal = unitPrice * quantity;
    const platformFee = (subtotal * (event.platform_fee_percent / 100)) + (event.platform_fee_fixed * quantity);
    const processingFee = event.is_free ? 0 : Math.round(Math.max(subtotal * 0.015, 0) * 100) / 100;
    const total = Math.round((subtotal + platformFee + processingFee) * 100) / 100;

    const ticketCode = generateTicketCode();

    const registrationData = {
      event_id: eventId,
      user_id: userId,
      user_name: userName ?? userEmail,
      user_email: userEmail,
      user_phone: userPhone ?? null,
      ticket_tier_id: ticketTierId,
      ticket_tier_name: ticketTier.name,
      quantity,
      ticket_price: unitPrice,
      subtotal,
      platform_fee: platformFee,
      processing_fee: processingFee,
      tax: 0,
      total,
      currency_code: event.currency_code,
      payment_status: event.is_free ? 'completed' : 'pending',
      payment_method: null,
      order_status: event.is_free ? 'confirmed' : 'pending',
      promo_code: promoCode ?? null,
      discount_amount: discountAmount,
      ticket_code: ticketCode,
      special_requests: specialRequests ?? null,
      check_in_status: 'not_checked_in',
      created_at: now,
      updated_at: now,
    };

    const { data: registration, error: regError } = await supabase
      .from('ticket_purchases')
      .insert(registrationData)
      .select()
      .single();

    if (regError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create registration' },
        { status: 500 }
      );
    }

    await supabase
      .from('event_ticket_types')
      .update({ quantity_sold: (ticketTier.quantity_sold ?? 0) + quantity })
      .eq('id', ticketTierId);

    await supabase
      .from('events')
      .update({ tickets_sold: event.tickets_sold + quantity })
      .eq('id', eventId);

    const createdGuests: Record<string, unknown>[] = [];
    if (guests && Array.isArray(guests) && guests.length > 0 && ticketTier.includes_guest_registration) {
      const maxGuests = (ticketTier.max_guests_per_ticket ?? 0) * quantity;
      const guestsToAdd = guests.slice(0, maxGuests);

      const guestRows = guestsToAdd.map((g: { name: string; email: string; phone?: string }) => ({
        event_id: eventId,
        ticket_purchase_id: registration.id,
        host_id: userId,
        guest_name: g.name,
        guest_email: g.email,
        guest_phone: g.phone ?? null,
        ticket_code: generateTicketCode(),
        qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${eventId}/guest/${generateTicketCode()}`,
        check_in_status: 'not_checked_in',
        created_at: now,
      }));

      const { data: insertedGuests } = await supabase
        .from('event_guests')
        .insert(guestRows)
        .select();

      createdGuests.push(...(insertedGuests ?? []));
    }

    let paymentIntent = null;
    if (!event.is_free && total > 0) {
      // Resolve the organizer's connected Stripe account so ticket funds reach
      // the seller: customer pays the platform (total), the platform keeps the
      // application fee (platform fee + processing fee), and the net (subtotal)
      // is transferred to the organizer's connected account via Connect.
      const stripeAccountId = await getOrganizerStripeAccountId(event.organizer_id);
      const appFeeAmount = Math.round((platformFee + processingFee) * 100);

      const stripePaymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: event.currency_code.toLowerCase(),
        metadata: {
          event_id: eventId,
          registration_id: registration.id,
          user_id: userId,
          ticket_code: ticketCode,
          afribook_organizer_id: event.organizer_id,
          afribook_net_to_organizer: String(Math.round((subtotal) * 100) / 100),
        },
        description: `Event registration: ${event.title} (${ticketTier.name} x${quantity})`,
        receipt_email: userEmail,
        ...(stripeAccountId
          ? {
              transfer_data: { destination: stripeAccountId },
              on_behalf_of: stripeAccountId,
              application_fee_amount: appFeeAmount,
            }
          : {}),
      });

      paymentIntent = {
        id: stripePaymentIntent.id,
        clientSecret: stripePaymentIntent.client_secret,
        amount: stripePaymentIntent.amount / 100,
        currency: stripePaymentIntent.currency,
      };

      await supabase
        .from('ticket_purchases')
        .update({ payment_intent_id: stripePaymentIntent.id })
        .eq('id', registration.id);
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'registration_created',
      title: event.is_free ? 'Registration Confirmed' : 'Registration Pending Payment',
      body: event.is_free
        ? `You're registered for "${event.title}". Ticket code: ${ticketCode}`
        : `Complete payment for "${event.title}". Ticket code: ${ticketCode}`,
      data: { event_id: eventId, registration_id: registration.id, ticket_code: ticketCode },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          registration: {
            ...registration,
            guests: createdGuests,
          },
          paymentIntent,
          pricing: {
            unitPrice,
            quantity,
            subtotal,
            platformFee,
            processingFee,
            discountAmount,
            total,
            currency: event.currency_code,
          },
          ticketCode,
        },
        message: event.is_free ? 'Registration confirmed' : 'Registration created, complete payment to confirm',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get('organizerId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    const { data: event } = await supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!organizerId || event.organizer_id !== organizerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: only the organizer can view all registrations' },
        { status: 403 }
      );
    }

    let query = supabase
      .from('ticket_purchases')
      .select('*, event_ticket_types(name, tier, type)', { count: 'exact' })
      .eq('event_id', eventId);

    if (status) {
      query = query.eq('order_status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch registrations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
