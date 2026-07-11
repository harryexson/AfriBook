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
    const { id: registrationId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const { data: registration, error: regError } = await supabase
      .from('ticket_purchases')
      .select(`
        *,
        event_ticket_types(name, tier, type, benefits),
        events(id, title, slug, start_date, end_date, venue_name, venue_address, venue_city, cover_image_url, organizer_name, timezone, status)
      `)
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (userId && registration.buyer_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only view your own registrations' },
        { status: 403 }
      );
    }

    const { data: guests } = await supabase
      .from('event_guests')
      .select('*')
      .eq('ticket_purchase_id', registrationId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        ...registration,
        guests: guests ?? [],
        tickets: [{
          id: registration.id,
          ticketCode: registration.ticket_code,
          tierName: (registration.event_ticket_types as Record<string, unknown>)?.name,
          quantity: registration.quantity,
          status: registration.order_status,
          qrCodeUrl: registration.qr_code_url,
          checkedIn: registration.check_in_status === 'checked_in',
          checkedInAt: registration.checked_in_at,
        }],
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
    const { id: registrationId } = await params;
    const body = await req.json();
    const { userId, specialRequests, guests } = body;

    const { data: registration, error: fetchError } = await supabase
      .from('ticket_purchases')
      .select('id, buyer_id, event_id, order_status')
      .eq('id', registrationId)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (userId && registration.buyer_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only update your own registrations' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (specialRequests !== undefined) {
      updateData.special_requests = specialRequests;
    }

    if (Object.keys(updateData).length > 1) {
      const { error: updateError } = await supabase
        .from('ticket_purchases')
        .update(updateData)
        .eq('id', registrationId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update registration' },
          { status: 500 }
        );
      }
    }

    const { data: updated } = await supabase
      .from('ticket_purchases')
      .select('*')
      .eq('id', registrationId)
      .single();

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Registration updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const reason = searchParams.get('reason') ?? 'User requested cancellation';

    const { data: registration, error: fetchError } = await supabase
      .from('ticket_purchases')
      .select('id, buyer_id, event_id, order_status, payment_status, quantity, total, ticket_type_id')
      .eq('id', registrationId)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (userId && registration.buyer_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only cancel your own registrations' },
        { status: 403 }
      );
    }

    if (!['pending', 'confirmed'].includes(registration.order_status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel registration with status "${registration.order_status}"` },
        { status: 400 }
      );
    }

    let refundResult = null;
    if (registration.total > 0 && registration.payment_status === 'completed') {
      const { data: event } = await supabase
        .from('events')
        .select('allow_refunds, refund_deadline_days, start_date')
        .eq('id', registration.event_id)
        .single();

      const allowsRefunds = event?.allow_refunds !== false;
      const deadlineDays = event?.refund_deadline_days ?? 7;
      const eventStart = event?.start_date ? new Date(event.start_date) : null;
      const refundDeadline = eventStart
        ? new Date(eventStart.getTime() - deadlineDays * 24 * 60 * 60 * 1000)
        : new Date();
      const canRefund = allowsRefunds && new Date() < refundDeadline;

      if (canRefund) {
        try {
          const { data: purchase } = await supabase
            .from('ticket_purchases')
            .select('payment_intent_id')
            .eq('id', registrationId)
            .single();

          if (purchase?.payment_intent_id) {
            const refund = await stripe.refunds.create({
              payment_intent: purchase.payment_intent_id,
              reason: 'requested_by_customer',
              metadata: {
                registration_id: registrationId,
                reason,
              },
            });
            refundResult = { refundId: refund.id, amount: refund.amount / 100 };
          }
        } catch (stripeError) {
          refundResult = { error: stripeError instanceof Error ? stripeError.message : 'Refund failed' };
        }
      }
    }

    const { error: cancelError } = await supabase
      .from('ticket_purchases')
      .update({
        order_status: 'cancelled',
        payment_status: refundResult && !('error' in (refundResult ?? {})) ? 'refunded' : registration.payment_status,
        refund_amount: registration.total,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (cancelError) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel registration' },
        { status: 500 }
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('tickets_sold')
      .eq('id', registration.event_id)
      .single();

    if (event) {
      await supabase
        .from('events')
        .update({ tickets_sold: Math.max(0, event.tickets_sold - registration.quantity) })
        .eq('id', registration.event_id);
    }

    const { data: ticketType } = await supabase
      .from('event_ticket_types')
      .select('id, quantity_sold')
      .eq('id', registration.ticket_type_id)
      .single();

    if (ticketType) {
      await supabase
        .from('event_ticket_types')
        .update({ quantity_sold: Math.max(0, (ticketType.quantity_sold ?? 0) - registration.quantity) })
        .eq('id', ticketType.id);
    }

    if (registration.buyer_id) {
      await supabase.from('notifications').insert({
        user_id: registration.buyer_id,
        type: 'registration_cancelled',
        title: 'Registration Cancelled',
        body: refundResult && !('error' in (refundResult ?? {}))
          ? `Your registration has been cancelled. A refund of ${refundResult.amount} has been initiated.`
          : `Your registration has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        data: { registration_id: registrationId, event_id: registration.event_id, refund: refundResult },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        registrationId,
        status: 'cancelled',
        refund: refundResult,
      },
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
