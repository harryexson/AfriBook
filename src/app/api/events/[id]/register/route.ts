import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

async function getDb() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient() as any;
}

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function getOrganizerStripeAccountId(organizerId: string): Promise<string | null> {
  const adminDb = await getAdminDb();
  const { data } = await adminDb
    .from('vendor_wallets')
    .select('metadata')
    .eq('vendor_id', organizerId)
    .maybeSingle();

  if (!data) return null;
  const acctId = (data.metadata as Record<string, unknown> | null)?.stripe_account_id as string | undefined;
  return acctId ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await getDb();
    const adminDb = await getAdminDb();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      ticketTierId,
      quantity,
      guests,
      promoCode,
      specialRequests,
    } = body;

    if (!ticketTierId || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: ticketTierId, quantity' },
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
      .select('id, organizer_id, organizer_name, title, status, total_capacity, tickets_sold, ticket_type, currency_code, platform_fee_percent, platform_fee_fixed, tax_rate, waitlist_enabled, max_guests_per_registration, start_date, end_date')
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

    const isFree = event.ticket_type === 'free';

    const { data: ticketTier, error: tierError } = await supabase
      .from('event_ticket_tiers')
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

    if (quantity > ticketTier.max_per_order) {
      return NextResponse.json(
        { success: false, error: `Maximum order is ${ticketTier.max_per_order} tickets` },
        { status: 400 }
      );
    }

    const available = (ticketTier.available ?? 0) - (ticketTier.sold ?? 0);
    if (quantity > available) {
      if (event.waitlist_enabled) {
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
    if (event.total_capacity > 0 && quantity > remainingCapacity) {
      return NextResponse.json(
        { success: false, error: 'Event has reached full capacity' },
        { status: 400 }
      );
    }

    let unitPrice = Number(ticketTier.price ?? 0);
    let discountAmount = 0;

    if (promoCode) {
      const { data: promo } = await adminDb
        .from('event_promo_codes')
        .select('*')
        .eq('event_id', eventId)
        .eq('code', String(promoCode).toUpperCase())
        .eq('is_active', true)
        .single();

      if (
        promo &&
        new Date(promo.valid_until) > new Date() &&
        new Date(promo.valid_from) <= new Date() &&
        (promo.used_count ?? 0) < promo.max_uses
      ) {
        if (promo.discount_type === 'percentage') {
          discountAmount = unitPrice * (Number(promo.discount_value) / 100);
        } else {
          discountAmount = Math.min(Number(promo.discount_value), unitPrice);
        }
        unitPrice = Math.max(0, unitPrice - discountAmount);
        await adminDb
          .from('event_promo_codes')
          .update({ used_count: (promo.used_count ?? 0) + 1 })
          .eq('id', promo.id);
      }
    }

    const subtotal = Math.round(unitPrice * quantity * 100) / 100;
    const platformFee = Math.round(((subtotal * (Number(event.platform_fee_percent) / 100)) + (Number(event.platform_fee_fixed) * quantity)) * 100) / 100;
    const processingFee = isFree ? 0 : Math.round(Math.max(subtotal * 0.015, 0) * 100) / 100;
    const tax = isFree ? 0 : Math.round(subtotal * (Number(event.tax_rate ?? 0) / 100) * 100) / 100;
    const total = Math.round((subtotal + platformFee + processingFee + tax) * 100) / 100;

    const registrationStatus = isFree ? 'confirmed' : 'pending';
    const paymentStatus = isFree ? 'completed' : 'pending';

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile?.full_name ?? user.email ?? 'Attendee';
    const userPhone = profile?.phone ?? null;
    const userEmail = user.email ?? '';

    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone ?? '',
        status: registrationStatus,
        ticket_tier_id: ticketTierId,
        ticket_tier_name: ticketTier.name,
        quantity,
        ticket_price: unitPrice,
        subtotal,
        platform_fee: platformFee,
        processing_fee: processingFee,
        tax,
        total,
        currency_code: event.currency_code,
        promo_code: promoCode ? String(promoCode).toUpperCase() : null,
        discount_amount: discountAmount,
        payment_status: paymentStatus,
        special_requests: specialRequests ?? null,
      })
      .select()
      .single();

    if (regError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create registration' },
        { status: 500 }
      );
    }

    // Free events get their tickets immediately (registration is confirmed).
    // Paid events get their tickets when the Stripe webhook confirms payment.
    let createdTickets: { id: string; ticket_code: string }[] = [];
    if (isFree) {
      const ticketRows = Array.from({ length: quantity }).map(() => ({
        registration_id: registration.id,
        event_id: eventId,
        user_id: user.id,
        tier_name: ticketTier.name,
        attendee_name: userName,
        attendee_email: userEmail,
        status: 'active',
        qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${eventId}/ticket/${registration.id}`,
        valid_from: event.start_date,
        valid_until: event.end_date,
      }));

      const { data } = await adminDb
        .from('event_tickets')
        .insert(ticketRows)
        .select('id, ticket_code');

      createdTickets = data ?? [];
    }

    const createdGuests: Record<string, unknown>[] = [];
    if (guests && Array.isArray(guests) && guests.length > 0) {
      const maxGuests = Number(event.max_guests_per_registration ?? 0) * quantity;
      const guestsToAdd = guests.slice(0, maxGuests);

      const guestRows = guestsToAdd.map((g: { name: string; email: string; phone?: string }) => ({
        registration_id: registration.id,
        name: g.name,
        email: g.email,
        phone: g.phone ?? null,
        relationship: 'other',
      }));

      const { data: insertedGuests } = await supabase
        .from('event_guests')
        .insert(guestRows)
        .select();

      createdGuests.push(...(insertedGuests ?? []));
    }

    let paymentIntent = null;
    if (!isFree && total > 0) {
      // Resolve the organizer's connected Stripe account so ticket funds reach
      // the seller: customer pays the platform (total), the platform keeps the
      // application fee (platform fee + processing fee + tax), and the net
      // (subtotal) is transferred to the organizer's connected account.
      const stripeAccountId = await getOrganizerStripeAccountId(event.organizer_id);
      const appFeeAmount = Math.round((platformFee + processingFee + tax) * 100);

      const stripePaymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: event.currency_code.toLowerCase(),
        metadata: {
          event_id: eventId,
          registration_id: registration.id,
          user_id: user.id,
          afribook_organizer_id: event.organizer_id,
          afribook_net_to_organizer: String(Math.round(subtotal * 100) / 100),
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
        .from('event_registrations')
        .update({ payment_intent_id: stripePaymentIntent.id })
        .eq('id', registration.id);
    }

    await adminDb.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: isFree ? 'Registration Confirmed' : 'Registration Pending Payment',
      body: isFree
        ? `You're registered for "${event.title}".`
        : `Complete payment for "${event.title}".`,
      data: {
        event_id: eventId,
        registration_id: registration.id,
        ticket_codes: createdTickets.map((t) => t.ticket_code),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          registration: {
            ...registration,
            guests: createdGuests,
          },
          tickets: createdTickets ?? [],
          paymentIntent,
          pricing: {
            unitPrice,
            quantity,
            subtotal,
            platformFee,
            processingFee,
            discountAmount,
            tax,
            total,
            currency: event.currency_code,
          },
        },
        message: isFree ? 'Registration confirmed' : 'Registration created, complete payment to confirm',
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
    const supabase = await getDb();
    const adminDb = await getAdminDb();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    const { data: event } = await adminDb
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

    const isOrganizer = event.organizer_id === user.id;

    let query = supabase
      .from('event_registrations')
      .select('*, event_ticket_tiers(name, tier)', { count: 'exact' })
      .eq('event_id', eventId);

    if (!isOrganizer) {
      query = query.eq('user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
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
