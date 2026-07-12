'use client'

import { useMemo } from 'react'
import { Lock, Crown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Subscription Plans ──────────────────────────────────────

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Basic marketplace access',
      'Up to 5 bookings/month',
      'Standard support',
      'Basic analytics',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Unlimited bookings',
      'Priority listing',
      'Email support',
      'Basic analytics',
      'Food delivery access',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 99,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Everything in Starter',
      'Featured listings',
      'Priority support',
      'Advanced analytics',
      'Group ordering',
      'Loyalty program access',
      'Custom branding',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'API access',
      'White-label options',
      'Multi-location support',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
}

// ─── Feature Gate Component ──────────────────────────────────

interface FeatureGateProps {
  /** The feature being gated. */
  feature: string
  /** User's current plan ID. */
  currentPlan: string
  /** The minimum plan required for this feature. */
  requiredPlan: string
  /** Content to show when feature is available. */
  children: React.ReactNode
  /** Content to show when feature is locked. */
  fallback?: React.ReactNode
  /** Callback when user clicks upgrade. */
  onUpgrade?: (planId: string) => void
  className?: string
}

const PLAN_ORDER = ['free', 'starter', 'professional', 'enterprise']

function hasAccess(currentPlan: string, requiredPlan: string): boolean {
  const currentIdx = PLAN_ORDER.indexOf(currentPlan)
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan)
  return currentIdx >= requiredIdx
}

export default function FeatureGate({
  feature,
  currentPlan,
  requiredPlan,
  children,
  fallback,
  onUpgrade,
  className,
}: FeatureGateProps) {
  const hasFeatureAccess = useMemo(
    () => hasAccess(currentPlan, requiredPlan),
    [currentPlan, requiredPlan],
  )

  if (hasFeatureAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const requiredPlanConfig = SUBSCRIPTION_PLANS[requiredPlan]

  return (
    <div className={cn('relative', className)}>
      {/* Blurred/dimmed content */}
      <div className="blur-[2px] opacity-40 pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-2">
          {requiredPlan === 'enterprise' ? (
            <Crown className="h-5 w-5 text-amber-500" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Premium Feature</span>
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[200px] mb-3">
          Upgrade to <span className="font-semibold">{requiredPlanConfig?.name}</span> to unlock {feature}
        </p>
        {onUpgrade && (
          <button
            onClick={() => onUpgrade(requiredPlan)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Crown className="h-3 w-3" />
            Upgrade to {requiredPlanConfig?.name}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Plan Comparison Component ───────────────────────────────

interface PlanComparisonProps {
  currentPlan: string
  onUpgrade: (planId: string) => void
  className?: string
  currency?: string
}

export function PlanComparison({ currentPlan, onUpgrade, className, currency = 'USD' }: PlanComparisonProps) {
  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount) + '/mo'
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-4 gap-4', className)}>
      {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
        const isCurrent = plan.id === currentPlan
        const isUpgrade = PLAN_ORDER.indexOf(plan.id) > PLAN_ORDER.indexOf(currentPlan)

        return (
          <div
            key={plan.id}
            className={cn(
              'rounded-xl border p-4 space-y-3',
              isCurrent && 'border-primary bg-primary/5',
              plan.id === 'professional' && 'border-2 border-amber-400 shadow-lg',
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{plan.name}</h3>
                {isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Current
                  </span>
                )}
                {plan.id === 'professional' && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold mt-1">{formatPrice(plan.price)}</p>
            </div>

            <ul className="space-y-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-xs">
                  <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {!isCurrent && isUpgrade && (
              <button
                onClick={() => onUpgrade(plan.id)}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
