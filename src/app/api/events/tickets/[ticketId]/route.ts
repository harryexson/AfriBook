import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { EventGuest } from '@/types/events';

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');

    const { data: ticket, error } = await supabase
      .from('ticket_purchases')
      .select(`
        *,
        event_ticket_types(name, type, benefits),
        events(title, slug, start_date, end_date, venue_name, venue_address, venue_city, cover_image_url, organizer_name, timezone)
      `)
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (buyerId && ticket.buyer_id !== buyerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { data: guests } = await supabase
      .from('event_guests')
      .select('*')
      .eq('ticket_purchase_id', ticketId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        guests: guests ?? [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const body = await req.json();
    const { action, buyerId, transferTo, reason } = body;

    const { data: ticket, error: fetchError } = await supabase
      .from('ticket_purchases')
      .select('id, buyer_id, event_id, order_status, payment_status, quantity, total')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (buyerId && ticket.buyer_id !== buyerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only modify your own tickets' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'cancel': {
        if (!['pending', 'confirmed'].includes(ticket.order_status)) {
          return NextResponse.json(
            { success: false, error: 'Cannot cancel ticket in this status' },
            { status: 400 }
          );
        }

        updateData.order_status = 'cancelled';
        updateData.cancelled_at = new Date().toISOString();
        updateData.payment_status = ticket.total > 0 ? 'refunded' : 'completed';
        updateData.refund_amount = ticket.total;
        updateData.refunded_at = ticket.total > 0 ? new Date().toISOString() : null;

        const { data: event } = await supabase
          .from('events')
          .select('tickets_sold')
          .eq('id', ticket.event_id)
          .single();

        if (event) {
          await supabase
            .from('events')
            .update({ tickets_sold: Math.max(0, event.tickets_sold - ticket.quantity) })
            .eq('id', ticket.event_id);
        }

        const { data: ticketType } = await supabase
          .from('event_ticket_types')
          .select('id, quantity_sold')
          .eq('id', ticket.ticket_type_id)
          .single();

        if (ticketType) {
          await supabase
            .from('event_ticket_types')
            .update({ quantity_sold: Math.max(0, ticketType.quantity_sold - ticket.quantity) })
            .eq('id', ticketType.id);
        }
        break;
      }

      case 'transfer': {
        if (ticket.order_status !== 'confirmed') {
          return NextResponse.json(
            { success: false, error: 'Can only transfer confirmed tickets' },
            { status: 400 }
          );
        }

        if (!transferTo || !transferTo.email) {
          return NextResponse.json(
            { success: false, error: 'transferTo.email is required' },
            { status: 400 }
          );
        }

        updateData.buyer_name = transferTo.name ?? transferTo.email;
        updateData.buyer_email = transferTo.email;
        updateData.buyer_phone = transferTo.phone ?? null;
        updateData.transferred_to = transferTo.email;
        updateData.ticket_code = generateTicketCode();
        updateData.qr_code_url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${ticket.event_id}/ticket/${updateData.ticket_code}`;

        if (buyerId) {
          updateData.buyer_id = transferTo.userId ?? null;
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "cancel" or "transfer"' },
          { status: 400 }
        );
    }

    const { data: updated, error: updateError } = await supabase
      .from('ticket_purchases')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    if (ticket.buyer_id) {
      const notificationTitle = action === 'cancel' ? 'Ticket Cancelled' : 'Ticket Transferred';
      const notificationBody = action === 'cancel'
        ? `Your ticket has been cancelled.${reason ? ` Reason: ${reason}` : ''}`
        : `Your ticket has been transferred to ${transferTo.email}.`;

      await supabase.from('notifications').insert({
        user_id: ticket.buyer_id,
        type: `ticket_${action}`,
        title: notificationTitle,
        body: notificationBody,
        data: { ticket_id: ticketId, event_id: ticket.event_id },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const body = await req.json();
    const { name, email, phone, dietaryRestrictions, specialRequirements } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, email' },
        { status: 400 }
      );
    }

    const { data: ticket, error: fetchError } = await supabase
      .from('ticket_purchases')
      .select('id, event_id, buyer_id, quantity')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const { count } = await supabase
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('ticket_purchase_id', ticketId);

    const { data: ticketType } = await supabase
      .from('event_ticket_types')
      .select('max_guests_per_ticket, includes_guest_registration')
      .eq('id', ticket.ticket_type_id)
      .single();

    if (!ticketType?.includes_guest_registration) {
      return NextResponse.json(
        { success: false, error: 'Guest registration is not enabled for this ticket type' },
        { status: 400 }
      );
    }

    const maxGuests = (ticketType.max_guests_per_ticket ?? 0) * ticket.quantity;
    if ((count ?? 0) >= maxGuests) {
      return NextResponse.json(
        { success: false, error: `Maximum ${maxGuests} guests allowed for this ticket` },
        { status: 400 }
      );
    }

    const guestCode = generateTicketCode();
    const guestData = {
      event_id: ticket.event_id,
      ticket_purchase_id: ticketId,
      host_id: ticket.buyer_id ?? '',
      guest_name: name,
      guest_email: email,
      guest_phone: phone ?? null,
      ticket_code: guestCode,
      qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${ticket.event_id}/guest/${guestCode}`,
      check_in_status: 'not_checked_in',
      dietary_restrictions: dietaryRestrictions ?? null,
      special_requirements: specialRequirements ?? null,
      created_at: new Date().toISOString(),
    };

    const { data: guest, error: guestError } = await supabase
      .from('event_guests')
      .insert(guestData)
      .select()
      .single();

    if (guestError) {
      return NextResponse.json(
        { success: false, error: 'Failed to add guest' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: guest },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get('guestId');
    const buyerId = searchParams.get('buyerId');

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: 'guestId query parameter is required' },
        { status: 400 }
      );
    }

    const { data: guest, error: fetchError } = await supabase
      .from('event_guests')
      .select('id, ticket_purchase_id, host_id, event_id')
      .eq('id', guestId)
      .eq('ticket_purchase_id', ticketId)
      .single();

    if (fetchError || !guest) {
      return NextResponse.json(
        { success: false, error: 'Guest not found' },
        { status: 404 }
      );
    }

    if (buyerId && guest.host_id !== buyerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only remove your own guests' },
        { status: 403 }
      );
    }

    if (guest.check_in_status === 'checked_in') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove a guest who has already checked in' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('event_guests')
      .delete()
      .eq('id', guestId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { message: 'Guest removed successfully' } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
