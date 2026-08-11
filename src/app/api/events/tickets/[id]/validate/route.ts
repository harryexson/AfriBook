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
    const { id: _ticketId } = await params;
    const body = await req.json();
    const { ticketCode } = body;

    if (!ticketCode) {
      return NextResponse.json(
        { success: false, error: 'ticketCode is required' },
        { status: 400 }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_purchases')
      .select(`
        id, event_id, buyer_name, buyer_email, buyer_phone,
        ticket_code, quantity, order_status, payment_status,
        check_in_status, check_in_at, ticket_tier_name,
        event_ticket_types(name, tier, benefits),
        events(title, start_date, end_date, venue_name, venue_city, status)
      `)
      .eq('ticket_code', ticketCode)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Invalid ticket code',
        },
        { status: 404 }
      );
    }

    if (ticket.order_status === 'cancelled') {
      return NextResponse.json({
        success: true,
        valid: false,
        data: {
          ticketId: ticket.id,
          attendeeName: ticket.buyer_name,
          tierName: (ticket.event_ticket_types as unknown as Record<string, unknown>)?.name ?? ticket.ticket_tier_name,
          status: 'cancelled',
          message: 'This ticket has been cancelled',
        },
      });
    }

    if (ticket.order_status === 'pending') {
      return NextResponse.json({
        success: true,
        valid: false,
        data: {
          ticketId: ticket.id,
          attendeeName: ticket.buyer_name,
          tierName: (ticket.event_ticket_types as unknown as Record<string, unknown>)?.name ?? ticket.ticket_tier_name,
          status: 'pending_payment',
          message: 'This ticket has not been paid for yet',
        },
      });
    }

    const eventStatus = (ticket.events as unknown as Record<string, unknown>)?.status;
    if (eventStatus === 'cancelled') {
      return NextResponse.json({
        success: true,
        valid: false,
        data: {
          ticketId: ticket.id,
          attendeeName: ticket.buyer_name,
          status: 'event_cancelled',
          message: 'This event has been cancelled',
        },
      });
    }

    if (ticket.check_in_status === 'checked_in') {
      return NextResponse.json({
        success: true,
        valid: false,
        data: {
          ticketId: ticket.id,
          attendeeName: ticket.buyer_name,
          attendeeEmail: ticket.buyer_email,
          tierName: (ticket.event_ticket_types as unknown as Record<string, unknown>)?.name ?? ticket.ticket_tier_name,
          quantity: ticket.quantity,
          checkedInAt: ticket.check_in_at,
          status: 'already_checked_in',
          message: 'This ticket has already been used',
        },
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        ticketId: ticket.id,
        eventId: ticket.event_id,
        attendeeName: ticket.buyer_name,
        attendeeEmail: ticket.buyer_email,
        attendeePhone: ticket.buyer_phone,
        tierName: (ticket.event_ticket_types as unknown as Record<string, unknown>)?.name ?? ticket.ticket_tier_name,
        tier: (ticket.event_ticket_types as unknown as Record<string, unknown>)?.tier,
        quantity: ticket.quantity,
        benefits: (ticket.event_ticket_types as unknown as Record<string, unknown>)?.benefits ?? [],
        event: {
          title: (ticket.events as unknown as Record<string, unknown>)?.title,
          startDate: (ticket.events as unknown as Record<string, unknown>)?.start_date,
          endDate: (ticket.events as unknown as Record<string, unknown>)?.end_date,
          venue: (ticket.events as unknown as Record<string, unknown>)?.venue_name,
          city: (ticket.events as unknown as Record<string, unknown>)?.venue_city,
        },
        status: 'valid',
        message: 'Ticket is valid and ready for check-in',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
