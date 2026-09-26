import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

export async function GET(_req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const userId = user.id;

    // organizer_subscriptions is keyed by organizer_id (see src/app/api/events/route.ts,
    // which reads the same column) — using user_id here would silently desync from the
    // subscription events/route.ts looks up when checking event-creation limits.
    const subRows = await query<Record<string, unknown>>(
      `SELECT * FROM organizer_subscriptions WHERE organizer_id = $1 AND status = 'active' LIMIT 1`,
      [userId],
    );
    const subscription = subRows[0];

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No active subscription found",
      });
    }

    const eventsCreatedRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM events WHERE organizer_id = $1 AND status <> 'cancelled'`,
      [userId],
    );
    const eventsCreated = Number(eventsCreatedRows[0]?.count ?? 0);

    const totalTicketsSoldRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases tp
       JOIN events ev ON ev.id = tp.event_id
       WHERE ev.organizer_id = $1 AND tp.order_status = 'confirmed'`,
      [userId],
    );
    const totalTicketsSold = Number(totalTicketsSoldRows[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        usage: {
          eventsCreated,
          maxEvents: subscription.max_events ?? -1,
          totalTicketsSold,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const userId = user.id;
    const body = await req.json();
    const { plan, billingPeriod } = body;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Missing required field: plan" },
        { status: 400 },
      );
    }

    const validPlans = ["free", "starter", "professional", "enterprise"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid plan. Must be one of: ${validPlans.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (plan === "free") {
      const existingRows = await query<{ id: string; status: string }>(
        `SELECT id, status FROM organizer_subscriptions WHERE organizer_id = $1 AND status = 'active' LIMIT 1`,
        [userId],
      );
      const existing = existingRows[0];

      if (existing) {
        await query(
          `UPDATE organizer_subscriptions SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = $1`,
          [existing.id],
        );
      }

      const freeSubRows = await query<Record<string, unknown>>(
        `INSERT INTO organizer_subscriptions
           (organizer_id, plan, status, max_events, max_tickets_per_event, max_guests_per_registration,
            monthly_price, annual_price, is_annual, commission_rate, platform_fee_fixed,
            stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end,
            created_at, updated_at)
         VALUES ($1, 'free', 'active', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now())
         RETURNING *`,
        [
          userId,
          3,
          100,
          2,
          0,
          0,
          false,
          5,
          1,
          null,
          null,
          new Date().toISOString(),
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        ],
      );
      const freeSub = freeSubRows[0];

      if (!freeSub) {
        return NextResponse.json(
          { success: false, error: "Failed to create free subscription" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: freeSub,
        message: "Free plan activated",
      });
    }

    const planPrices: Record<
      string,
      {
        monthly: number;
        annual: number;
        monthlyStripe: string;
        annualStripe: string;
      }
    > = {
      starter: {
        monthly: 5000,
        annual: 50000,
        monthlyStripe: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
        annualStripe: process.env.STRIPE_PRICE_STARTER_ANNUAL!,
      },
      professional: {
        monthly: 15000,
        annual: 150000,
        monthlyStripe: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
        annualStripe: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL!,
      },
      enterprise: {
        monthly: 50000,
        annual: 500000,
        monthlyStripe: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
        annualStripe: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL!,
      },
    };

    const isAnnual = billingPeriod === "annual";
    const priceConfig = planPrices[plan];

    const existingRows = await query<{
      id: string;
      stripe_subscription_id: string | null;
      stripe_customer_id: string | null;
      status: string;
    }>(
      `SELECT id, stripe_subscription_id, stripe_customer_id, status FROM organizer_subscriptions
       WHERE organizer_id = $1 AND status = 'active' AND plan <> 'free' LIMIT 1`,
      [userId],
    );
    const existing = existingRows[0];

    if (existing?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(existing.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch {
        // Subscription may already be cancelled
      }
    }

    const userRows = await query<{ email: string | null; full_name: string | null }>(
      `SELECT email, full_name FROM profiles WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const userData = userRows[0];

    let customerId = existing?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email ?? undefined,
        name: userData?.full_name ?? undefined,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
    }

    const priceId = isAnnual
      ? priceConfig.annualStripe
      : priceConfig.monthlyStripe;

    if (!priceId) {
      return NextResponse.json(
        { success: false, error: "Stripe price not configured for this plan" },
        { status: 500 },
      );
    }

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: { user_id: userId, plan },
      expand: ["latest_invoice.payment_intent"],
    };

    if (existing?.stripe_subscription_id) {
      subscriptionParams.metadata = {
        ...subscriptionParams.metadata,
        replaced_subscription: existing.stripe_subscription_id,
      };
    }

    const stripeSubscription =
      await stripe.subscriptions.create(subscriptionParams);

    const planLimits: Record<
      string,
      {
        maxEvents: number;
        maxTickets: number;
        maxGuests: number;
        commission: number;
        feeFixed: number;
      }
    > = {
      starter: {
        maxEvents: 10,
        maxTickets: 500,
        maxGuests: 5,
        commission: 4,
        feeFixed: 0.75,
      },
      professional: {
        maxEvents: 50,
        maxTickets: 5000,
        maxGuests: 10,
        commission: 3,
        feeFixed: 0.5,
      },
      enterprise: {
        maxEvents: -1,
        maxTickets: -1,
        maxGuests: 20,
        commission: 2,
        feeFixed: 0.25,
      },
    };

    const limits = planLimits[plan];

    const newSubRows = await query<Record<string, unknown>>(
      `INSERT INTO organizer_subscriptions
         (organizer_id, plan, status, max_events, max_tickets_per_event, max_guests_per_registration,
          monthly_price, annual_price, is_annual, commission_rate, platform_fee_fixed,
          stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end,
          created_at, updated_at)
       VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now(), now())
       RETURNING *`,
      [
        userId,
        plan,
        limits.maxEvents,
        limits.maxTickets,
        limits.maxGuests,
        isAnnual ? priceConfig.annual : priceConfig.monthly,
        priceConfig.annual,
        isAnnual,
        limits.commission,
        limits.feeFixed,
        stripeSubscription.id,
        customerId,
        new Date().toISOString(),
        new Date(
          Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      ],
    );
    const newSub = newSubRows[0];

    if (!newSub) {
      return NextResponse.json(
        { success: false, error: "Failed to create subscription" },
        { status: 500 },
      );
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'subscription_created', 'Subscription Activated', $2, $3)`,
      [
        userId,
        `Your ${plan} subscription is now active.`,
        JSON.stringify({ plan, subscription_id: newSub.id, billing_period: billingPeriod }),
      ],
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription: newSub,
          payment: {
            clientSecret: (
              stripeSubscription.latest_invoice as unknown as Record<
                string,
                unknown
              >
            )?.payment_intent
              ? (
                  (
                    stripeSubscription.latest_invoice as unknown as Record<
                      string,
                      unknown
                    >
                  ).payment_intent as unknown as Record<string, unknown>
                )?.client_secret
              : null,
            subscriptionId: stripeSubscription.id,
          },
        },
        message: `${plan} subscription created. Complete payment to activate.`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
