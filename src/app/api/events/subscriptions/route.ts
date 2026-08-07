import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/supabase/server";
import Stripe from "stripe";

const supabase = createServiceRoleClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

export async function GET(req: NextRequest) {
  try {
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const userId = user.id;

    const { data: subscription, error } = await supabase
      .from("organizer_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !subscription) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No active subscription found",
      });
    }

    const { count: eventsCreated } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", userId)
      .neq("status", "cancelled");

    const { count: totalTicketsSold } = await supabase
      .from("ticket_purchases")
      .select("id", { count: "exact", head: true })
      .eq("events(organizer_id)", userId)
      .eq("order_status", "confirmed");

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        usage: {
          eventsCreated: eventsCreated ?? 0,
          maxEvents: subscription.max_events ?? -1,
          totalTicketsSold: totalTicketsSold ?? 0,
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
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const userId = user.id;
    const body = await req.json();
    const { plan, billingPeriod, paymentMethodId } = body;

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
      const { data: existing } = await supabase
        .from("organizer_subscriptions")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (existing) {
        await supabase
          .from("organizer_subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      }

      const { data: freeSub, error: freeError } = await supabase
        .from("organizer_subscriptions")
        .insert({
          user_id: userId,
          plan: "free",
          status: "active",
          max_events: 3,
          max_tickets_per_event: 100,
          max_guests_per_registration: 2,
          monthly_price: 0,
          annual_price: 0,
          is_annual: false,
          commission_rate: 5,
          platform_fee_fixed: 1,
          stripe_subscription_id: null,
          stripe_customer_id: null,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (freeError) {
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

    const { data: existing } = await supabase
      .from("organizer_subscriptions")
      .select("id, stripe_subscription_id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .neq("plan", "free")
      .single();

    if (existing?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(existing.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch {
        // Subscription may already be cancelled
      }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    let customerId =
      (existing as { stripe_customer_id?: string } | null)
        ?.stripe_customer_id ?? null;

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

    const { data: newSub, error: subError } = await supabase
      .from("organizer_subscriptions")
      .insert({
        user_id: userId,
        plan,
        status: "active",
        max_events: limits.maxEvents,
        max_tickets_per_event: limits.maxTickets,
        max_guests_per_registration: limits.maxGuests,
        monthly_price: isAnnual ? priceConfig.annual : priceConfig.monthly,
        annual_price: priceConfig.annual,
        is_annual: isAnnual,
        commission_rate: limits.commission,
        platform_fee_fixed: limits.feeFixed,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: customerId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      return NextResponse.json(
        { success: false, error: "Failed to create subscription" },
        { status: 500 },
      );
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "subscription_created",
      title: "Subscription Activated",
      body: `Your ${plan} subscription is now active.`,
      data: { plan, subscription_id: newSub.id, billing_period: billingPeriod },
    });

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
