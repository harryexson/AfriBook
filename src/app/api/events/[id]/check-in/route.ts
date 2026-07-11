import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { ticketCode, guestId, ticketPurchaseId, method, scannedBy } = body;

    if (!ticketCode && !guestId && !ticketPurchaseId) {
      return NextResponse.json(
        { success: false, error: 'Provide ticketCode, guestId, or ticketPurchaseId' },
        { status: 400 }
      );
    }

    const checkInMethod = method ?? 'qr_scan';
    if (!['qr_scan', 'manual', 'nfc'].includes(checkInMethod)) {
      return NextResponse.json(
        { success: false, error: 'method must be "qr_scan", "manual", or "nfc"' },
        { status: 400 }
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, organizer_id, title, start_date, end_date, status')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (guestId) {
      const { data: guest, error: guestError } = await supabase
        .from('event_guests')
        .select('*')
        .eq('id', guestId)
        .eq('event_id', eventId)
        .single();

      if (guestError || !guest) {
        return NextResponse.json(
          { success: false, error: 'Guest not found for this event' },
          { status: 404 }
        );
      }

      if (guest.check_in_status === 'checked_in') {
        return NextResponse.json(
          { success: false, error: 'Guest already checked in', checkedInAt: guest.checked_in_at },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('event_guests')
        .update({
          check_in_status: 'checked_in',
          checked_in_at: now,
          checked_in_by: scannedBy ?? null,
        })
        .eq('id', guestId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to check in guest' },
          { status: 500 }
        );
      }

      await supabase.from('check_in_logs').insert({
        event_id: eventId,
        ticket_purchase_id: guest.ticket_purchase_id,
        guest_id: guestId,
        scanned_by: scannedBy ?? 'system',
        scanned_at: now,
        method: checkInMethod,
      });

      return NextResponse.json({
        success: true,
        data: {
          type: 'guest',
          id: guest.id,
          name: guest.guest_name,
          email: guest.guest_email,
          ticketCode: guest.ticket_code,
          checkedInAt: now,
          method: checkInMethod,
        },
        message: 'Guest checked in successfully',
      });
    }

    let ticket;
    if (ticketCode) {
      const { data } = await supabase
        .from('ticket_purchases')
        .select('*')
        .eq('ticket_code', ticketCode)
        .eq('event_id', eventId)
        .single();
      ticket = data;
    } else if (ticketPurchaseId) {
      const { data } = await supabase
        .from('ticket_purchases')
        .select('*')
        .eq('id', ticketPurchaseId)
        .eq('event_id', eventId)
        .single();
      ticket = data;
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found for this event' },
        { status: 404 }
      );
    }

    if (ticket.order_status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'This ticket has been cancelled' },
        { status: 400 }
      );
    }

    if (ticket.order_status === 'pending') {
      return NextResponse.json(
        { success: false, error: 'This ticket has not been paid for yet' },
        { status: 400 }
      );
    }

    if (ticket.check_in_status === 'checked_in') {
      return NextResponse.json(
        { success: false, error: 'Ticket already checked in', checkedInAt: ticket.checked_in_at },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('ticket_purchases')
      .update({
        check_in_status: 'checked_in',
        checked_in_at: now,
      })
      .eq('id', ticket.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to check in ticket' },
        { status: 500 }
      );
    }

    await supabase.from('check_in_logs').insert({
      event_id: eventId,
      ticket_purchase_id: ticket.id,
      guest_id: null,
      scanned_by: scannedBy ?? 'system',
      scanned_at: now,
      method: checkInMethod,
    });

    return NextResponse.json({
      success: true,
      data: {
        type: 'ticket',
        id: ticket.id,
        name: ticket.buyer_name,
        email: ticket.buyer_email,
        ticketCode: ticket.ticket_code,
        quantity: ticket.quantity,
        tierName: ticket.ticket_tier_name ?? null,
        checkedInAt: now,
        method: checkInMethod,
      },
      message: 'Attendee checked in successfully',
    });
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

    if (!organizerId) {
      return NextResponse.json(
        { success: false, error: 'organizerId query parameter is required' },
        { status: 400 }
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, organizer_id, tickets_sold, total_capacity')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== organizerId) {
      return NextResponse.json(
        { success: false, error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    const { count: totalCheckedIn } = await supabase
      .from('ticket_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('check_in_status', 'checked_in')
      .eq('order_status', 'confirmed');

    const { count: guestsCheckedIn } = await supabase
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('check_in_status', 'checked_in');

    const { count: totalGuests } = await supabase
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const { count: totalConfirmed } = await supabase
      .from('ticket_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('order_status', 'confirmed');

    const { data: attendees, count: attendeeCount } = await supabase
      .from('ticket_purchases')
      .select('id, buyer_name, buyer_email, buyer_phone, ticket_code, quantity, check_in_status, check_in_at, event_ticket_types(name, tier)', { count: 'exact' })
      .eq('event_id', eventId)
      .eq('order_status', 'confirmed')
      .order('check_in_status', { ascending: true })
      .order('buyer_name', { ascending: true })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          ticketsSold: event.tickets_sold,
          ticketsConfirmed: totalConfirmed ?? 0,
          ticketsCheckedIn: totalCheckedIn ?? 0,
          guestsTotal: totalGuests ?? 0,
          guestsCheckedIn: guestsCheckedIn ?? 0,
          totalAttendees: (totalCheckedIn ?? 0) + (guestsCheckedIn ?? 0),
          attendanceRate: (totalConfirmed ?? 0) > 0
            ? Math.round(((totalCheckedIn ?? 0) / (totalConfirmed ?? 1)) * 100)
            : 0,
          capacity: event.total_capacity,
        },
        attendees: attendees ?? [],
        pagination: {
          page,
          limit,
          total: attendeeCount ?? 0,
          totalPages: Math.ceil((attendeeCount ?? 0) / limit),
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
