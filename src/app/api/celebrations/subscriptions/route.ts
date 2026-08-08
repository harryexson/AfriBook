import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getActiveCelebrationSubscription,
  getCelebrationPlan,
  resolvePlannerMarket,
  toMinorUnits,
} from '@/lib/celebrations/service';
import { usdToLocal } from '@/lib/localization/ppp';

const admin = createAdminClient() as any;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

function nowIso(): string {
  return new Date().toISOString();
}

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();

    const subscription = await getActiveCelebrationSubscription(admin, user.id);
    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active celebration subscription found',
      });
    }

    const { count: celebrations } = await admin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', user.id)
      .not('celebration_type', 'is', null);

    const { count: guests } = await admin
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .neq('rsvp_status', 'declined');

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        usage: {
          celebrations: celebrations ?? 0,
          guests: guests ?? 0,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { planCode, billingMode, eventId } = body;

    if (!planCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: planCode' },
        { status: 400 },
      );
    }

    const validModes = ['subscription', 'per_event'];
    if (!validModes.includes(billingMode)) {
      return NextResponse.json(
        { success: false, error: `Invalid billingMode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 },
      );
    }

    const plan = await getCelebrationPlan(admin, planCode);
    if (!plan || !plan.is_active) {
      return NextResponse.json(
        { success: false, error: 'Unknown or inactive plan' },
        { status: 400 },
      );
    }

    const market = await resolvePlannerMarket(admin, user.id);
    const priceMonthly = usdToLocal(plan.price_monthly_usd, market.countryCode, market.exchangeRate);
    const pricePerEvent = usdToLocal(plan.price_per_event_usd, market.countryCode, market.exchangeRate);

    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // ── Per-event mode: one-off PaymentIntent charged against an event. ──
    if (billingMode === 'per_event') {
      if (!eventId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: eventId for per-event billing' },
          { status: 400 },
        );
      }

      const { data: evt } = await admin
        .from('events')
        .select('id, organizer_id, title, currency_code')
        .eq('id', eventId)
        .single();

      if (!evt) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }
      if (evt.organizer_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: only the organizer can bill this celebration' },
          { status: 403 },
        );
      }

      const currency = market.currencyCode;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: toMinorUnits(pricePerEvent, currency),
        currency: currency.toLowerCase(),
        metadata: {
          type: 'celebration_per_event',
          user_id: user.id,
          event_id: eventId,
          plan_code: planCode,
        },
        receipt_email: profile?.email ?? undefined,
      });

      await admin
        .from('events')
        .update({
          billing_mode: 'per_event',
          billing_status: 'unpaid',
          per_event_fee: pricePerEvent,
          billing_payment_intent_id: paymentIntent.id,
          billing_paid_at: null,
          updated_at: nowIso(),
        })
        .eq('id', eventId);

      return NextResponse.json(
        {
          success: true,
          data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: pricePerEvent,
            currencyCode: currency,
            plan: { code: plan.code, name: plan.name, guestCapacity: plan.guest_capacity },
          },
          message: 'Per-event payment initiated. Complete payment to publish the celebration.',
        },
        { status: 201 },
      );
    }

    // ── Subscription mode: recurring Stripe subscription for the plan. ──
    const existing = await getActiveCelebrationSubscription(admin, user.id);
    if (existing?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(existing.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch {
        // Subscription may already be cancelled.
      }
      await admin
        .from('celebration_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq('id', existing.id);
    }

    let customerId = existing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? undefined,
        name: profile?.full_name ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    // Create a plan-specific recurring price (one per plan+currency).
    const price = await stripe.prices.create({
      currency: market.currencyCode.toLowerCase(),
      unit_amount: toMinorUnits(priceMonthly, market.currencyCode),
      recurring: { interval: 'month' },
      product_data: {
        name: `AfriBook Celebrations — ${plan.name}`,
        metadata: { celebration_plan: plan.code },
      },
      metadata: { celebration_plan: plan.code },
    });

    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata: { user_id: user.id, plan: plan.code, type: 'celebration' },
      expand: ['latest_invoice.payment_intent'],
    });

    const { data: newSub, error: subError } = await admin
      .from('celebration_subscriptions')
      .insert({
        user_id: user.id,
        plan_code: plan.code,
        billing_mode: 'subscription',
        status: 'active',
        currency_code: market.currencyCode,
        price_monthly_local: priceMonthly,
        price_per_event_local: pricePerEvent,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: customerId,
        current_period_start: nowIso(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: nowIso(),
        updated_at: nowIso(),
      })
      .select()
      .single();

    if (subError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create celebration subscription' },
        { status: 500 },
      );
    }

    // Subscribed celebrations are covered by the recurring plan.
    await admin
      .from('events')
      .update({ billing_mode: 'subscription', billing_status: 'paid', updated_at: nowIso() })
      .eq('organizer_id', user.id)
      .not('celebration_type', 'is', null);

    const latestInvoice = stripeSubscription.latest_invoice as unknown as {
      payment_intent?: { client_secret?: string } | string | null;
    } | null;
    const paymentIntent = latestInvoice?.payment_intent as { client_secret?: string } | null;

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: newSub,
          payment: {
            clientSecret: paymentIntent?.client_secret ?? null,
            subscriptionId: stripeSubscription.id,
          },
        },
        message: `${plan.name} subscription created. Complete payment to activate.`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
