import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { registrationId, guests, userId } = body;

    if (!registrationId || !guests || !Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: registrationId, guests[]' },
        { status: 400 }
      );
    }

    const { data: registration, error: regError } = await supabase
      .from('ticket_purchases')
      .select('id, event_id, buyer_id, quantity, ticket_type_id')
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found for this event' },
        { status: 404 }
      );
    }

    if (userId && registration.buyer_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only add guests to your own registration' },
        { status: 403 }
      );
    }

    const { data: ticketType } = await supabase
      .from('event_ticket_types')
      .select('max_guests_per_ticket, includes_guest_registration')
      .eq('id', registration.ticket_type_id)
      .single();

    if (!ticketType?.includes_guest_registration) {
      return NextResponse.json(
        { success: false, error: 'Guest registration is not enabled for this ticket type' },
        { status: 400 }
      );
    }

    const { count: existingGuests } = await supabase
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('ticket_purchase_id', registrationId);

    const maxGuests = (ticketType.max_guests_per_ticket ?? 0) * registration.quantity;
    const remainingSlots = maxGuests - (existingGuests ?? 0);

    if (guests.length > remainingSlots) {
      return NextResponse.json(
        { success: false, error: `Maximum ${maxGuests} guests allowed. ${remainingSlots} slots remaining.` },
        { status: 400 }
      );
    }

    const guestRows = guests.map((g: { name: string; email: string; phone?: string; relationship?: string }) => {
      const guestCode = generateTicketCode();
      return {
        event_id: eventId,
        ticket_purchase_id: registrationId,
        host_id: registration.buyer_id ?? '',
        guest_name: g.name,
        guest_email: g.email,
        guest_phone: g.phone ?? null,
        relationship: g.relationship ?? 'other',
        ticket_code: guestCode,
        qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${eventId}/guest/${guestCode}`,
        check_in_status: 'not_checked_in',
        created_at: new Date().toISOString(),
      };
    });

    const { data: insertedGuests, error: insertError } = await supabase
      .from('event_guests')
      .insert(guestRows)
      .select();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Failed to add guests' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          guests: insertedGuests ?? [],
          totalGuests: (existingGuests ?? 0) + guests.length,
          maxGuests,
        },
        message: `${guests.length} guest(s) added successfully`,
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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
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
        { success: false, error: 'Unauthorized: only the organizer can view the guest list' },
        { status: 403 }
      );
    }

    const { data: guests, count, error } = await supabase
      .from('event_guests')
      .select('*, ticket_purchases(buyer_name, buyer_email, event_ticket_types(name))', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch guests' },
        { status: 500 }
      );
    }

    const { count: totalGuests } = await supabase
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const { count: checkedInGuests } = await supabase
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('check_in_status', 'checked_in');

    return NextResponse.json({
      success: true,
      data: {
        guests: guests ?? [],
        stats: {
          totalGuests: totalGuests ?? 0,
          checkedIn: checkedInGuests ?? 0,
          pending: (totalGuests ?? 0) - (checkedInGuests ?? 0),
        },
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
