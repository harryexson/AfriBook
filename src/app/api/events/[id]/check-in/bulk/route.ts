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
    const { ticketIds, guestIds, scannedBy, method } = body;

    if ((!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) &&
        (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Provide ticketIds or guestIds array' },
        { status: 400 }
      );
    }

    if (!method || !['qr_scan', 'manual'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'method must be "qr_scan" or "manual"' },
        { status: 400 }
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const results: { id: string; type: string; name: string; status: string; error?: string }[] = [];
    const now = new Date().toISOString();

    if (guestIds && guestIds.length > 0) {
      const { data: guests } = await supabase
        .from('event_guests')
        .select('*')
        .eq('event_id', eventId)
        .in('id', guestIds);

      for (const guest of guests ?? []) {
        if (guest.check_in_status === 'checked_in') {
          results.push({
            id: guest.id,
            type: 'guest',
            name: guest.guest_name,
            status: 'already_checked_in',
          });
          continue;
        }

        await supabase
          .from('event_guests')
          .update({
            check_in_status: 'checked_in',
            checked_in_at: now,
            checked_in_by: scannedBy ?? null,
          })
          .eq('id', guest.id);

        await supabase.from('check_in_logs').insert({
          event_id: eventId,
          ticket_purchase_id: guest.ticket_purchase_id,
          guest_id: guest.id,
          scanned_by: scannedBy ?? 'system',
          scanned_at: now,
          method,
        });

        results.push({
          id: guest.id,
          type: 'guest',
          name: guest.guest_name,
          status: 'checked_in',
        });
      }
    }

    if (ticketIds && ticketIds.length > 0) {
      const { data: tickets } = await supabase
        .from('ticket_purchases')
        .select('*')
        .eq('event_id', eventId)
        .in('id', ticketIds);

      for (const ticket of tickets ?? []) {
        if (ticket.check_in_status === 'checked_in') {
          results.push({
            id: ticket.id,
            type: 'ticket',
            name: ticket.buyer_name,
            status: 'already_checked_in',
          });
          continue;
        }

        if (ticket.order_status === 'cancelled') {
          results.push({
            id: ticket.id,
            type: 'ticket',
            name: ticket.buyer_name,
            status: 'cancelled',
            error: 'Ticket is cancelled',
          });
          continue;
        }

        await supabase
          .from('ticket_purchases')
          .update({
            check_in_status: 'checked_in',
            checked_in_at: now,
          })
          .eq('id', ticket.id);

        await supabase.from('check_in_logs').insert({
          event_id: eventId,
          ticket_purchase_id: ticket.id,
          guest_id: null,
          scanned_by: scannedBy ?? 'system',
          scanned_at: now,
          method,
        });

        results.push({
          id: ticket.id,
          type: 'ticket',
          name: ticket.buyer_name,
          status: 'checked_in',
        });
      }
    }

    const summary = {
      total: results.length,
      checkedIn: results.filter(r => r.status === 'checked_in').length,
      alreadyCheckedIn: results.filter(r => r.status === 'already_checked_in').length,
      failed: results.filter(r => r.status === 'cancelled' || r.error).length,
    };

    return NextResponse.json({ success: true, data: { summary, results } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
