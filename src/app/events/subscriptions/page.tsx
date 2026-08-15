'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  X,
  Crown,
  Zap,
  Building2,
  Star,
  TrendingUp,
  Calendar,
  Ticket,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { StripeCheckout } from '@/components/checkout/StripeCheckout';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

interface Plan {
  id: string;
  name: string;
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  commissionRate: number;
  platformFeeFixed: number;
  maxEventsPerMonth: number;
  maxTicketsPerEvent: number;
  maxGuestsPerRegistration: number;
  isPopular: boolean;
  description: string;
  features: {
    name: string;
    included: boolean;
    limit?: number;
    description: string;
  }[];
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  max_events?: number;
  max_tickets_per_event?: number;
  is_annual?: boolean;
  monthly_price?: number;
  annual_price?: number;
  current_period_end?: string;
  usage?: {
    eventsCreated: number;
    maxEvents: number;
    totalTicketsSold: number;
  };
}

export default function SubscriptionsPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ clientSecret: string; plan: string } | null>(null);

  const currentPlan = subscription?.plan ?? 'free';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch('/api/events/subscriptions/plans'),
          fetch('/api/events/subscriptions'),
        ]);
        const plansJson = await plansRes.json();
        if (!plansRes.ok) throw new Error(plansJson.error ?? 'Failed to load plans');
        setPlans(plansJson.data ?? []);

        const subJson = await subRes.json();
        if (subRes.ok && subJson.data) {
          setSubscription(subJson.data);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (!plan || subscribing) return;
    setSubscribing(plan.plan);
    setSubscribeError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/events/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.plan, billingPeriod: billingCycle }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? 'Failed to subscribe');

      if (json.data?.payment?.clientSecret) {
        setCheckout({
          clientSecret: json.data.payment.clientSecret,
          plan: plan.plan,
        });
        return;
      }

      setSubscription(json.data?.subscription ?? json.data);
      setSuccessMessage(json.message ?? `${plan.name} plan activated`);
    } catch (err) {
      setSubscribeError((err as Error).message);
    } finally {
      setSubscribing(null);
    }
  };

  const handleCheckoutSuccess = async () => {
    setCheckout(null);
    setSuccessMessage(`Your ${checkout?.plan} subscription is being activated. You'll be notified once payment confirms.`);
    try {
      const res = await fetch('/api/events/subscriptions');
      const json = await res.json();
      if (json.success && json.data) setSubscription(json.data);
    } catch {
      // Refresh failure is non-fatal
    }
  };

  const usageStats = [
    {
      label: 'Events Created',
      value: subscription?.usage?.eventsCreated ?? 0,
      limit: (subscription?.usage?.maxEvents ?? -1) === -1 ? 'Unlimited' : (subscription?.usage?.maxEvents ?? 0),
      icon: Calendar,
    },
    {
      label: 'Tickets Sold',
      value: subscription?.usage?.totalTicketsSold ?? 0,
      limit: (subscription?.max_tickets_per_event ?? -1) === -1 ? 'Unlimited' : `Max ${subscription?.max_tickets_per_event ?? 0}/event`,
      icon: Ticket,
    },
    {
      label: 'Current Plan',
      value: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
      limit: subscription?.is_annual ? 'Annual billing' : 'Monthly billing',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(42rem_42rem_at_80%_0%,rgba(245,158,11,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(30rem_30rem_at_-5%_110%,rgba(168,85,247,0.1),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mb-8 flex items-center gap-3 sm:gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white/70 backdrop-blur-md transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} · {subscription?.status ?? 'Active'}
            </span>
          </div>
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1
              variants={fadeIn}
              className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl"
            >
              Pricing that scales
              <span className="block text-gradient-gold">with your events.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="mt-5 max-w-lg text-lg leading-relaxed text-white/60">
              Host more, pay less. Pick a plan for your organizing needs — switch
              or cancel anytime.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-8 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {subscribeError && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
            {subscribeError}
          </div>
        )}

        {/* Current Usage */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          {usageStats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeIn}
              className="bg-surface rounded-xl border border-border p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">{stat.label}</p>
                  <p className="font-heading font-bold text-text-primary text-lg">
                    {loading ? '…' : stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-tertiary">Limit: {stat.limit}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span
            className={`text-sm font-medium ${
              billingCycle === 'monthly' ? 'text-text-primary' : 'text-text-tertiary'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')
            }
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billingCycle === 'annual' ? 'bg-amber-500' : 'bg-border'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              billingCycle === 'annual' ? 'text-text-primary' : 'text-text-tertiary'
            }`}
          >
            Annual
          </span>
          {billingCycle === 'annual' && (
            <span className="bg-green-500/10 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
              Save 17%
            </span>
          )}
        </div>

        {/* Plans */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {(plans.length > 0 ? plans : []).map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const isCurrent = currentPlan === plan.plan;
            const Icon = plan.plan === 'enterprise' ? Building2 : plan.plan === 'professional' ? Crown : plan.plan === 'starter' ? Zap : Star;
            return (
              <motion.div
                key={plan.id}
                variants={fadeIn}
                className={`bg-surface rounded-2xl border-2 p-6 relative ${
                  plan.isPopular
                    ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'border-border'
                } ${isCurrent ? 'ring-2 ring-amber-500/30' : ''}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-text-primary">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="font-heading text-3xl font-bold text-text-primary">
                      {plan.currency === 'NGN' ? '₦' : '$'}
                      {price.toLocaleString()}
                    </span>
                    <span className="text-text-tertiary text-sm">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs mt-2">
                    {plan.commissionRate}% commission · {plan.platformFeeFixed} per ticket
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-text-tertiary shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-text-primary' : 'text-text-tertiary'
                        }`}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || subscribing === plan.plan}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                    isCurrent
                      ? 'bg-surface-secondary text-text-secondary cursor-default'
                      : plan.isPopular
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary border border-border'
                  }`}
                >
                  {subscribing === plan.plan ? (
                    <>
                      <Loader2 className="w-4 h-4 inline animate-spin mr-1" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.monthlyPrice === 0 ? (
                    'Get Started Free'
                  ) : (
                    'Upgrade'
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Cancel Subscription */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="bg-surface rounded-2xl border border-border p-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-heading font-bold text-text-primary mb-1">
                Cancel Subscription
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                If you cancel, you will lose access to {currentPlan} features at the end of your
                current billing period. You can re-subscribe at any time.
              </p>
              <button
                onClick={() => handleSubscribe({ ...plans.find((p) => p.plan === 'free')! })}
                disabled={currentPlan === 'free'}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Switch to Free Plan
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stripe Checkout Modal */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Complete Payment
              </h3>
              <button
                onClick={() => setCheckout(null)}
                className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Complete payment to activate your {checkout.plan} subscription.
            </p>
            <StripeCheckout
              clientSecret={checkout.clientSecret}
              publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
              buttonLabel={`Subscribe to ${checkout.plan}`}
              onSuccess={handleCheckoutSuccess}
              onError={(message) => setSubscribeError(message)}
            />
          </div>
        </div>
      )}
    </div>
  );
}