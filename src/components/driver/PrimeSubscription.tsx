'use client'

import { motion } from 'framer-motion'
import { Crown, Check, Zap, Clock, Percent, Star } from 'lucide-react'
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
  countryCode = 'US',
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
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mx-auto">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">
          {isSubscribed ? 'Your Prime Membership' : 'Upgrade to Prime'}
        </h2>
        <p className="text-muted-foreground">
          {isSubscribed
            ? 'Enjoy your exclusive Prime benefits'
            : 'Save on every ride with priority matching and exclusive perks'}
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                'relative rounded-xl border p-5 space-y-4',
                plan.highlight && 'border-2 border-amber-400 shadow-lg',
                isCurrent && 'bg-primary/5',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white">
                    Best Value — Save {savings}%
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-semibold">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold">{price}</span>
                </div>
                {savings > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    You save {savings}% vs monthly
                  </p>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    <div className="mt-0.5 text-primary">{feature.icon}</div>
                    <div>
                      <span className="text-sm font-medium">{feature.label}</span>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {!isCurrent && (
                <button
                  onClick={() => onSubscribe?.(plan.id)}
                  className={cn(
                    'w-full rounded-lg py-2.5 text-sm font-medium transition-colors',
                    plan.highlight
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {isSubscribed ? 'Switch Plan' : 'Subscribe'}
                </button>
              )}

              {isCurrent && (
                <div className="w-full rounded-lg py-2.5 text-sm font-medium text-center bg-primary/10 text-primary">
                  Current Plan
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Benefits Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="text-left p-3 font-medium">Benefit</th>
              <th className="text-center p-3 font-medium">Free</th>
              <th className="text-center p-3 font-medium">Prime</th>
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
              <tr key={row.benefit} className="border-t">
                <td className="p-3">{row.benefit}</td>
                <td className="p-3 text-center text-muted-foreground">{row.free}</td>
                <td className="p-3 text-center font-medium text-primary">{row.prime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Cancel anytime. Subscription renews automatically.
      </p>
    </div>
  )
}
