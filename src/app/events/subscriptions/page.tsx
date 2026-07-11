'use client';

import { useState } from 'react';
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
  Download,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const plans = [
  {
    name: 'Free',
    icon: Star,
    monthlyPrice: 0,
    annualPrice: 0,
    commission: '7%',
    platformFee: '$1.50',
    popular: false,
    color: 'border-border',
    features: [
      { name: '3 events per month', included: true },
      { name: 'Up to 500 tickets per event', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'QR code check-in', included: true },
      { name: 'Custom event pages', included: false },
      { name: 'Promo codes', included: false },
      { name: 'Referral system', included: false },
      { name: 'Priority support', included: false },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Starter',
    icon: Zap,
    monthlyPrice: 15,
    annualPrice: 150,
    commission: '5%',
    platformFee: '$1.00',
    popular: false,
    color: 'border-border',
    features: [
      { name: '10 events per month', included: true },
      { name: 'Up to 2,000 tickets per event', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'QR code check-in', included: true },
      { name: 'Custom event pages', included: true },
      { name: 'Promo codes', included: true },
      { name: 'Referral system', included: false },
      { name: 'Priority support', included: false },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Professional',
    icon: Crown,
    monthlyPrice: 49,
    annualPrice: 490,
    commission: '3%',
    platformFee: '$0.50',
    popular: true,
    color: 'border-amber-500',
    features: [
      { name: 'Unlimited events', included: true },
      { name: 'Up to 10,000 tickets per event', included: true },
      { name: 'Full analytics dashboard', included: true },
      { name: 'QR code check-in', included: true },
      { name: 'Custom event pages', included: true },
      { name: 'Promo codes', included: true },
      { name: 'Referral system', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Enterprise',
    icon: Building2,
    monthlyPrice: 199,
    annualPrice: 1990,
    commission: '1.5%',
    platformFee: '$0.25',
    popular: false,
    color: 'border-border',
    features: [
      { name: 'Unlimited events', included: true },
      { name: 'Unlimited tickets', included: true },
      { name: 'Full analytics dashboard', included: true },
      { name: 'QR code check-in', included: true },
      { name: 'Custom event pages', included: true },
      { name: 'Promo codes', included: true },
      { name: 'Referral system', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
    ],
  },
];

const billingHistory = [
  { date: 'Jul 1, 2026', description: 'Professional Plan - Monthly', amount: '$49.00', status: 'Paid' },
  { date: 'Jun 1, 2026', description: 'Professional Plan - Monthly', amount: '$49.00', status: 'Paid' },
  { date: 'May 1, 2026', description: 'Starter Plan - Monthly', amount: '$15.00', status: 'Paid' },
  { date: 'Apr 1, 2026', description: 'Free Plan', amount: '$0.00', status: 'Free' },
];

const usageStats = [
  { label: 'Events Created', value: '12', limit: 'Unlimited', icon: Calendar },
  { label: 'Tickets Sold', value: '2,847', limit: 'Unlimited', icon: Ticket },
  { label: 'Revenue Generated', value: '$67,320', limit: '-', icon: TrendingUp },
];

export default function SubscriptionsPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const currentPlan = 'Professional';

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/events"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Organizer Subscriptions
            </h1>
          </div>
          <p className="text-text-secondary text-sm ml-9">
            Choose the plan that fits your event hosting needs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
                  <p className="font-heading font-bold text-text-primary text-lg">{stat.value}</p>
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
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeIn}
              className={`bg-surface rounded-2xl border-2 p-6 relative ${
                plan.popular
                  ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'border-border'
              } ${currentPlan === plan.name ? 'ring-2 ring-amber-500/30' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              {currentPlan === plan.name && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <plan.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary">{plan.name}</h3>
                <div className="mt-3">
                  <span className="font-heading text-3xl font-bold text-text-primary">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                  </span>
                  <span className="text-text-tertiary text-sm">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                <p className="text-text-secondary text-xs mt-2">
                  {plan.commission} commission · {plan.platformFee} per ticket
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
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  currentPlan === plan.name
                    ? 'bg-surface-secondary text-text-secondary cursor-default'
                    : plan.popular
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary border border-border'
                }`}
              >
                {currentPlan === plan.name
                  ? 'Current Plan'
                  : plan.monthlyPrice === 0
                    ? 'Get Started Free'
                    : 'Upgrade'}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Billing History */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="bg-surface rounded-2xl border border-border overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              Billing History
            </h2>
            <button className="flex items-center gap-1.5 text-amber-500 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary">
                  <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-6 py-3">
                    Description
                  </th>
                  <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {billingHistory.map((item, i) => (
                  <tr key={i} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-text-primary">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{item.description}</td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{item.amount}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-500/10 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                If you cancel, you will lose access to Professional features at the end of your
                current billing period. You can re-subscribe at any time.
              </p>
              <button className="px-4 py-2 border border-red-500 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                Cancel Subscription
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
