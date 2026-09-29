import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';

interface TicketRow {
  id: string;
  event_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  quantity: number;
  order_status: string;
  payment_status: string;
  check_in_status: string;
  checked_in_at: string | null;
  ticket_tier_name: string | null;
  tier_name: string;
  tier: string;
  benefits: unknown;
  event_title: string;
  event_start_date: string;
  event_end_date: string;
  event_venue_name: string | null;
  event_venue_city: string | null;
  event_status: string;
}

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

    const rows = await query<TicketRow>(
      `SELECT
         tp.id, tp.event_id, tp.buyer_name, tp.buyer_email, tp.buyer_phone,
         tp.quantity, tp.order_status, tp.payment_status, tp.check_in_status,
         tp.checked_in_at, tp.ticket_tier_name,
         ett.name AS tier_name, ett.tier, ett.benefits,
         ev.title AS event_title, ev.start_date AS event_start_date, ev.end_date AS event_end_date,
         ev.venue_name AS event_venue_name, ev.venue_city AS event_venue_city, ev.status AS event_status
       FROM ticket_purchases tp
       JOIN event_ticket_types ett ON ett.id = tp.ticket_type_id
       JOIN events ev ON ev.id = tp.event_id
       WHERE tp.ticket_code = $1
       LIMIT 1`,
      [ticketCode],
    );
    const ticket = rows[0];

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Invalid ticket code',
        },
        { status: 404 }
      );
    }

    const tierName = ticket.tier_name ?? ticket.ticket_tier_name;

    if (ticket.order_status === 'cancelled') {
      return NextResponse.json({
        success: true,
        valid: false,
        data: {
          ticketId: ticket.id,
          attendeeName: ticket.buyer_name,
          tierName,
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
          tierName,
          status: 'pending_payment',
          message: 'This ticket has not been paid for yet',
        },
      });
    }

    if (ticket.event_status === 'cancelled') {
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
          tierName,
          quantity: ticket.quantity,
          checkedInAt: ticket.checked_in_at,
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
        tierName,
        tier: ticket.tier,
        quantity: ticket.quantity,
        benefits: ticket.benefits ?? [],
        event: {
          title: ticket.event_title,
          startDate: ticket.event_start_date,
          endDate: ticket.event_end_date,
          venue: ticket.event_venue_name,
          city: ticket.event_venue_city,
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
