import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

async function getAdminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient() as any;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_EVENTS ?? process.env.STRIPE_WEBHOOK_SECRET!;

// Find-or-create the organizer's wallet (event organizers have no business,
// so business_id is NULL) and credit it with the net amount after fees.
async function creditOrganizerWallet(
  supabase: any,
  organizerId: string,
  netAmount: number,
  eventId: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('vendor_wallets')
    .select('id, balance, available_balance, currency')
    .eq('vendor_id', organizerId)
    .is('business_id', null)
    .maybeSingle();

  const { data: evt } = await supabase
    .from('events')
    .select('currency_code')
    .eq('id', eventId)
    .single();

  const currency = evt?.currency_code ?? 'USD';

  if (existing) {
    await supabase
      .from('vendor_wallets')
      .update({
        balance: Number(existing.balance ?? 0) + netAmount,
        available_balance: Number(existing.available_balance ?? 0) + netAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('vendor_wallets').insert({
      vendor_id: organizerId,
      business_id: null,
      balance: netAmount,
      available_balance: netAmount,
      currency,
    });
  }
}

// Debit the organizer's wallet ledger by the net amount (full-refund reverse).
async function debitOrganizerWallet(
  supabase: any,
  organizerId: string,
  netAmount: number,
): Promise<void> {
  const { data: existing } = await supabase
    .from('vendor_wallets')
    .select('id, balance, available_balance')
    .eq('vendor_id', organizerId)
    .is('business_id', null)
    .maybeSingle();

  if (!existing) return;

  const balance = Number(existing.balance ?? 0);
  const available = Number(existing.available_balance ?? 0);

  await supabase
    .from('vendor_wallets')
    .update({
      balance: Math.max(balance - netAmount, 0),
      available_balance: Math.max(available - netAmount, 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
}

async function handlePaymentSucceeded(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent,
) {
  const { type } = paymentIntent.metadata;

  // Celebrations: per-event billing charge paid → flip the event to paid.
  if (type === 'celebration_per_event') {
    const { event_id } = paymentIntent.metadata;
    if (event_id) {
      await supabase
        .from('events')
        .update({
          billing_status: 'paid',
          billing_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', event_id);
    }
    return;
  }

  // Celebrations: donation paid → mark completed and credit the organizer wallet.
  if (type === 'celebration_donation') {
    const { donation_id, event_id, organizer_id, net_amount } = paymentIntent.metadata;

    if (!donation_id) return;

    const { data: donation } = await supabase
      .from('celebration_donations')
      .select('id, event_id, donor_name, status, net_amount')
      .eq('id', donation_id)
      .single();

    if (!donation) return;
    if (donation.status === 'completed') return;

    await supabase
      .from('celebration_donations')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', donation.id);

    const net = Number(net_amount ?? donation.net_amount ?? 0);
    if (organizer_id && net > 0) {
      await creditOrganizerWallet(supabase, organizer_id, net, event_id ?? donation.event_id);
    }

    await supabase.from('notifications').insert({
      user_id: organizer_id,
      type: 'payment',
      title: 'Donation Received',
      body: `${donation.donor_name ?? 'A guest'} donated to your celebration.`,
      data: {
        event_id: event_id ?? donation.event_id,
        donation_id: donation.id,
        net_amount: net,
        payment_intent_id: paymentIntent.id,
      },
    });
    return;
  }

  const { registration_id } = paymentIntent.metadata;
  if (!registration_id) return;

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('id, event_id, user_id, user_name, user_email, quantity, ticket_tier_id, ticket_tier_name, subtotal, platform_fee, processing_fee, total, status, payment_status')
    .eq('id', registration_id)
    .single();

  if (!registration) return;

  // Idempotency guard: never re-confirm an already-confirmed registration.
  if (registration.payment_status === 'completed' || registration.status === 'confirmed') {
    return;
  }

  await supabase
    .from('event_registrations')
    .update({
      payment_status: 'completed',
      status: 'confirmed',
      payment_method: 'card',
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration_id);

  // 003's counter trigger only handles confirmed<->cancelled transitions, so
  // a pending->confirmed flip must increment counters explicitly.
  const { data: tier } = await supabase
    .from('event_ticket_tiers')
    .select('sold')
    .eq('id', registration.ticket_tier_id)
    .single();

  if (tier) {
    await supabase
      .from('event_ticket_tiers')
      .update({ sold: (tier.sold ?? 0) + registration.quantity })
      .eq('id', registration.ticket_tier_id);
  }

  const { data: eventCount } = await supabase
    .from('events')
    .select('tickets_sold')
    .eq('id', registration.event_id)
    .single();

  if (eventCount) {
    await supabase
      .from('events')
      .update({ tickets_sold: (eventCount.tickets_sold ?? 0) + registration.quantity })
      .eq('id', registration.event_id);
  }

  // Create individual tickets (QR codes auto-generated by DB trigger).
  const { data: evt } = await supabase
    .from('events')
    .select('title, start_date, end_date')
    .eq('id', registration.event_id)
    .single();

  const ticketRows = Array.from({ length: registration.quantity }).map(() => ({
    registration_id: registration.id,
    event_id: registration.event_id,
    user_id: registration.user_id,
    tier_name: registration.ticket_tier_name,
    attendee_name: registration.user_name,
    attendee_email: registration.user_email,
    status: 'active',
    qr_code_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${registration.event_id}/ticket/${registration.id}`,
    valid_from: evt?.start_date ?? null,
    valid_until: evt?.end_date ?? null,
  }));

  const { data: createdTickets } = await supabase
    .from('event_tickets')
    .insert(ticketRows)
    .select('ticket_code');

  // Credit the organizer's wallet ledger with the net amount after the
  // platform fee deduction (funds themselves are transferred via Stripe
  // Connect destination charges; this keeps the AfriBook wallet in sync).
  const organizerId = paymentIntent.metadata.afribook_organizer_id;
  const netAmount = Number(paymentIntent.metadata.afribook_net_to_organizer ?? 0);

  if (organizerId && netAmount > 0) {
    await creditOrganizerWallet(supabase, organizerId, netAmount, registration.event_id);
  }

  if (registration.user_id) {
    const ticketCodes = (createdTickets ?? []).map((t: { ticket_code: string }) => t.ticket_code);
    await supabase.from('notifications').insert({
      user_id: registration.user_id,
      type: 'payment',
      title: 'Payment Confirmed',
      body: `Your payment for ${evt?.title ?? 'the event'} has been confirmed.`,
      data: {
        event_id: registration.event_id,
        registration_id: registration.id,
        ticket_codes: ticketCodes,
        payment_intent_id: paymentIntent.id,
      },
    });
  }
}

async function handlePaymentFailed(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent,
) {
  const failureMessage = paymentIntent.last_payment_error?.message ?? 'Payment failed';

  const { type, donation_id } = paymentIntent.metadata;

  if (type === 'celebration_donation' && donation_id) {
    await supabase
      .from('celebration_donations')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', donation_id);
    return;
  }

  const { registration_id } = paymentIntent.metadata;

  if (!registration_id) return;

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('user_id')
    .eq('id', registration_id)
    .single();

  await supabase
    .from('event_registrations')
    .update({
      payment_status: 'failed',
      payment_method: 'card',
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration_id);

  if (registration?.user_id) {
    await supabase.from('notifications').insert({
      user_id: registration.user_id,
      type: 'payment',
      title: 'Payment Failed',
      body: `Your payment could not be processed: ${failureMessage}. Please try again.`,
      data: { registration_id, payment_intent_id: paymentIntent.id, failure_message: failureMessage },
    });
  }
}

async function handleRefund(supabase: any, charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  const { data: donation } = await supabase
    .from('celebration_donations')
    .select('id, event_id, status, net_amount, refund_amount')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (donation) {
    const refundAmount = (charge.amount_refunded ?? 0) / 100;
    await supabase
      .from('celebration_donations')
      .update({
        status: 'refunded',
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', donation.id);

    if (donation.status === 'completed') {
      const { data: evt } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', donation.event_id)
        .single();

      if (evt?.organizer_id) {
        const netRefund = Math.max(Number(donation.net_amount ?? 0), 0);
        await debitOrganizerWallet(supabase, evt.organizer_id, netRefund);
      }
    }
    return;
  }

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('id, event_id, user_id, quantity, total, subtotal, platform_fee, processing_fee, status, payment_status, refund_amount')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (!registration) return;

  const refundAmount = (charge.amount_refunded ?? 0) / 100;
  const isFullRefund = refundAmount >= Number(registration.total ?? 0);

  await supabase
    .from('event_registrations')
    .update({
      payment_status: isFullRefund ? 'refunded' : 'completed',
      status: isFullRefund ? 'cancelled' : registration.status,
      refund_amount: refundAmount,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration.id);

  if (isFullRefund) {
    // status confirmed->cancelled: 003 trigger decrements tier/event counters.
    // Debit the organizer's wallet ledger so balances stay reconciled with the
    // Stripe Connect transfer that will be reversed.
    const { data: evt } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', registration.event_id)
      .single();

    if (evt?.organizer_id) {
      const netRefund = Math.max(
        Number(registration.total ?? 0) - Number(registration.platform_fee ?? 0) - Number(registration.processing_fee ?? 0),
        0,
      );
      await debitOrganizerWallet(supabase, evt.organizer_id, netRefund);
    }

    await supabase
      .from('event_tickets')
      .update({ status: 'cancelled' })
      .eq('registration_id', registration.id);
  }

  if (registration.user_id) {
    await supabase.from('notifications').insert({
      user_id: registration.user_id,
      type: 'payment',
      title: 'Refund Processed',
      body: `A refund of ${refundAmount} has been processed for your ticket.`,
      data: { registration_id: registration.id, event_id: registration.event_id, refund_amount: refundAmount },
    });
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { success: false, error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }

  try {
    const supabase = await getAdminDb();

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(supabase, event.data.object as Stripe.Charge);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`[Events Stripe Webhook] Error handling ${event.type}:`, err);
    return NextResponse.json(
      { success: false, error: 'Webhook handler error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, received: true });
}
