import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');

    const { data: ticket, error } = await supabase
      .from('ticket_purchases')
      .select(`
        *,
        event_ticket_types(name, tier, type, benefits),
        events(title, slug, start_date, end_date, venue_name, venue_address, venue_city, venue_country, cover_image_url, organizer_name, timezone, is_virtual, virtual_link)
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
        qrCodeData: ticket.ticket_code,
        barcodeData: `AFRIBOOK-${ticket.ticket_code}`,
        guests: guests ?? [],
        event: ticket.events,
        tier: ticket.event_ticket_types,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await req.json();
    const { action, buyerId, transferTo, reason } = body;

    const { data: ticket, error: fetchError } = await supabase
      .from('ticket_purchases')
      .select('id, buyer_id, buyer_name, buyer_email, event_id, order_status, payment_status, quantity, total, ticket_type_id')
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

    if (action === 'transfer') {
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

      const newCode = generateTicketCode();
      const { data: updated, error: updateError } = await supabase
        .from('ticket_purchases')
        .update({
          buyer_name: transferTo.name ?? transferTo.email,
          buyer_email: transferTo.email,
          buyer_phone: transferTo.phone ?? null,
          buyer_id: transferTo.userId ?? ticket.buyer_id,
          transferred_to: transferTo.email,
          ticket_code: newCode,
          qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${ticket.event_id}/ticket/${newCode}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to transfer ticket' },
          { status: 500 }
        );
      }

      if (ticket.buyer_id) {
        await supabase.from('notifications').insert({
          user_id: ticket.buyer_id,
          type: 'ticket_transferred',
          title: 'Ticket Transferred',
          body: `Your ticket has been transferred to ${transferTo.email}.`,
          data: { ticket_id: ticketId, event_id: ticket.event_id },
        });
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Ticket transferred to ${transferTo.email}`,
      });
    }

    if (action === 'cancel') {
      if (!['pending', 'confirmed'].includes(ticket.order_status)) {
        return NextResponse.json(
          { success: false, error: 'Cannot cancel ticket in this status' },
          { status: 400 }
        );
      }

      let refundResult = null;
      if (ticket.total > 0 && ticket.payment_status === 'completed') {
        const { data: purchase } = await supabase
          .from('ticket_purchases')
          .select('payment_intent_id')
          .eq('id', ticketId)
          .single();

        if (purchase?.payment_intent_id) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: purchase.payment_intent_id,
              reason: 'requested_by_customer',
            });
            refundResult = { refundId: refund.id, amount: refund.amount / 100 };
          } catch (stripeError) {
            refundResult = { error: stripeError instanceof Error ? stripeError.message : 'Refund failed' };
          }
        }
      }

      const { error: cancelError } = await supabase
        .from('ticket_purchases')
        .update({
          order_status: 'cancelled',
          payment_status: refundResult && !('error' in (refundResult ?? {})) ? 'refunded' : ticket.payment_status,
          refund_amount: ticket.total,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (cancelError) {
        return NextResponse.json(
          { success: false, error: 'Failed to cancel ticket' },
          { status: 500 }
        );
      }

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
          .update({ quantity_sold: Math.max(0, (ticketType.quantity_sold ?? 0) - ticket.quantity) })
          .eq('id', ticketType.id);
      }

      if (ticket.buyer_id) {
        await supabase.from('notifications').insert({
          user_id: ticket.buyer_id,
          type: 'ticket_cancelled',
          title: 'Ticket Cancelled',
          body: refundResult && !('error' in (refundResult ?? {}))
            ? `Your ticket has been cancelled. Refund of ${refundResult.amount} initiated.`
            : `Your ticket has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
          data: { ticket_id: ticketId, event_id: ticket.event_id, refund: refundResult },
        });
      }

      return NextResponse.json({
        success: true,
        data: { ticketId, status: 'cancelled', refund: refundResult },
        message: 'Ticket cancelled successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "cancel" or "transfer"' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
