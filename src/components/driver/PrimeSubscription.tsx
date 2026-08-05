'use client'

import { motion } from 'framer-motion'
import { Crown, Zap, Clock, Percent, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Prime Subscription Plans ────────────────────────────────

interface PrimePlan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  features: PrimeFeature[]
  highlight?: boolean
}

interface PrimeFeature {
  icon: React.ReactNode
  label: string
  description: string
}

const PRIME_PLANS: PrimePlan[] = [
  {
    id: 'prime_monthly',
    name: 'Prime Monthly',
    monthlyPrice: 9.99,
    yearlyPrice: 0,
    currency: 'USD',
    features: [
      { icon: <Percent className="h-4 w-4" />, label: '15% off all rides', description: 'Save on every trip' },
      { icon: <Zap className="h-4 w-4" />, label: 'Priority matching', description: 'Get matched with drivers faster' },
      { icon: <Clock className="h-4 w-4" />, label: 'Free cancellations', description: 'Cancel up to 3 minutes after matching' },
      { icon: <Star className="h-4 w-4" />, label: 'Priority support', description: 'Skip the queue' },
    ],
  },
  {
    id: 'prime_yearly',
    name: 'Prime Yearly',
    monthlyPrice: 0,
    yearlyPrice: 99.99,
    currency: 'USD',
    highlight: true,
    features: [
      { icon: <Percent className="h-4 w-4" />, label: '20% off all rides', description: 'Maximum savings' },
      { icon: <Zap className="h-4 w-4" />, label: 'Priority matching', description: 'Get matched with drivers faster' },
      { icon: <Clock className="h-4 w-4" />, label: 'Free cancellations', description: 'Cancel up to 5 minutes after matching' },
      { icon: <Star className="h-4 w-4" />, label: 'VIP support', description: '24/7 dedicated line' },
      { icon: <Crown className="h-4 w-4" />, label: 'Free upgrade to Premium', description: 'One free Premium ride per month' },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────

interface PrimeSubscriptionProps {
  currentPlan?: 'none' | 'prime_monthly' | 'prime_yearly'
  countryCode?: string
  onSubscribe?: (planId: string) => void
  className?: string
}

export default function PrimeSubscription({
  currentPlan = 'none',
  onSubscribe,
  className,
}: PrimeSubscriptionProps) {
  const isSubscribed = currentPlan !== 'none'

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-gold">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-text-primary">
          {isSubscribed ? 'Your Prime Membership' : 'Upgrade to Prime'}
        </h2>
        <p className="text-text-secondary">
          {isSubscribed
            ? 'Enjoy your exclusive Prime benefits'
            : 'Save on every ride with priority matching and exclusive perks'}
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PRIME_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const price = plan.monthlyPrice > 0
            ? formatPrice(plan.monthlyPrice, plan.currency) + '/mo'
            : formatPrice(plan.yearlyPrice, plan.currency) + '/yr'
          const savings = plan.yearlyPrice > 0
            ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
            : 0

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -2 }}
              className={cn(
                'relative space-y-4 rounded-2xl border border-border bg-surface-secondary p-5 transition-colors',
                plan.highlight && 'border-2 border-amber-400 shadow-gold',
                isCurrent && 'bg-amber-500/5',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-gold">
                    Best Value — Save {savings}%
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-heading font-semibold text-text-primary">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-bold text-text-primary">{price}</span>
                </div>
                {savings > 0 && (
                  <p className="mt-1 text-xs text-emerald-600">
                    You save {savings}% vs monthly
                  </p>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    <div className="mt-0.5 text-amber-500">{feature.icon}</div>
                    <div>
                      <span className="text-sm font-medium text-text-primary">{feature.label}</span>
                      <p className="text-xs text-text-secondary">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {!isCurrent && (
                <button
                  onClick={() => onSubscribe?.(plan.id)}
                  className={cn(
                    'w-full rounded-xl py-2.5 text-sm font-medium transition-colors',
                    plan.highlight
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90'
                      : 'bg-amber-500 text-white hover:bg-amber-600',
                  )}
                >
                  {isSubscribed ? 'Switch Plan' : 'Subscribe'}
                </button>
              )}

              {isCurrent && (
                <div className="w-full rounded-xl bg-amber-500/10 py-2.5 text-center text-sm font-medium text-amber-500">
                  Current Plan
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Benefits Table */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary">
              <th className="p-3 text-left font-medium text-text-primary">Benefit</th>
              <th className="p-3 text-center font-medium text-text-primary">Free</th>
              <th className="p-3 text-center font-medium text-text-primary">Prime</th>
            </tr>
          </thead>
          <tbody>
            {[
              { benefit: 'Ride discount', free: '0%', prime: '15-20%' },
              { benefit: 'Matching speed', free: 'Standard', prime: 'Priority' },
              { benefit: 'Cancellation window', free: '1 min', prime: '3-5 min' },
              { benefit: 'Support', free: 'Standard', prime: 'Priority/VIP' },
              { benefit: 'Monthly free upgrade', free: '-', prime: '1 ride/mo' },
            ].map((row) => (
              <tr key={row.benefit} className="border-t border-border">
                <td className="p-3 text-text-primary">{row.benefit}</td>
                <td className="p-3 text-center text-text-tertiary">{row.free}</td>
                <td className="p-3 text-center font-medium text-amber-500">{row.prime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-text-tertiary">
        Cancel anytime. Subscription renews automatically.
      </p>
    </div>
  )
}
