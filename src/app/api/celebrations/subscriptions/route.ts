import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';
import {
  getActiveCelebrationSubscription,
  getCelebrationPlan,
  resolvePlannerMarket,
  toMinorUnits,
} from '@/lib/celebrations/service';
import { usdToLocal } from '@/lib/localization/ppp';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

function nowIso(): string {
  return new Date().toISOString();
}

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();

    const subscription = await getActiveCelebrationSubscription(user.id);
    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active celebration subscription found',
      });
    }

    const [celebrationsRows, guestsRows] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM events WHERE organizer_id = $1 AND celebration_type IS NOT NULL`,
        [user.id],
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM event_guests WHERE host_id = $1 AND rsvp_status != 'declined'`,
        [user.id],
      ),
    ]);
    const celebrations = Number(celebrationsRows[0]?.count ?? 0);
    const guests = Number(guestsRows[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        usage: {
          celebrations,
          guests,
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

    const plan = await getCelebrationPlan(planCode);
    if (!plan || !plan.is_active) {
      return NextResponse.json(
        { success: false, error: 'Unknown or inactive plan' },
        { status: 400 },
      );
    }

    const market = await resolvePlannerMarket(user.id);
    const priceMonthly = usdToLocal(plan.price_monthly_usd, market.countryCode, market.exchangeRate);
    const pricePerEvent = usdToLocal(plan.price_per_event_usd, market.countryCode, market.exchangeRate);

    const profileRows = await query<{ email: string | null; full_name: string | null }>(
      `SELECT email, full_name FROM profiles WHERE id = $1 LIMIT 1`,
      [user.id],
    );
    const profile = profileRows[0] ?? null;

    // ── Per-event mode: one-off PaymentIntent charged against an event. ──
    if (billingMode === 'per_event') {
      if (!eventId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: eventId for per-event billing' },
          { status: 400 },
        );
      }

      const evtRows = await query<{
        id: string;
        organizer_id: string;
        title: string;
        currency_code: string | null;
      }>(
        `SELECT id, organizer_id, title, currency_code FROM events WHERE id = $1 LIMIT 1`,
        [eventId],
      );
      const evt = evtRows[0] ?? null;

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

      await query(
        `UPDATE events
         SET billing_mode = 'per_event', billing_status = 'unpaid', per_event_fee = $1,
             billing_payment_intent_id = $2, billing_paid_at = NULL, updated_at = $3
         WHERE id = $4`,
        [pricePerEvent, paymentIntent.id, nowIso(), eventId],
      );

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
    const existing = await getActiveCelebrationSubscription(user.id);
    if (existing?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(existing.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch {
        // Subscription may already be cancelled.
      }
      await query(
        `UPDATE celebration_subscriptions SET status = 'cancelled', cancelled_at = $1, updated_at = $2 WHERE id = $3`,
        [nowIso(), nowIso(), existing.id],
      );
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

    let newSub: Record<string, unknown> | null = null;
    try {
      const inserted = await query(
        `INSERT INTO celebration_subscriptions
           (user_id, plan_code, billing_mode, status, currency_code, price_monthly_local,
            price_per_event_local, stripe_subscription_id, stripe_customer_id,
            current_period_start, current_period_end, created_at, updated_at)
         VALUES ($1, $2, 'subscription', 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          user.id,
          plan.code,
          market.currencyCode,
          priceMonthly,
          pricePerEvent,
          stripeSubscription.id,
          customerId,
          nowIso(),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          nowIso(),
          nowIso(),
        ],
      );
      newSub = inserted[0] ?? null;
    } catch {
      newSub = null;
    }

    if (!newSub) {
      return NextResponse.json(
        { success: false, error: 'Failed to create celebration subscription' },
        { status: 500 },
      );
    }

    // Subscribed celebrations are covered by the recurring plan.
    await query(
      `UPDATE events SET billing_mode = 'subscription', billing_status = 'paid', updated_at = $1
       WHERE organizer_id = $2 AND celebration_type IS NOT NULL`,
      [nowIso(), user.id],
    );

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
