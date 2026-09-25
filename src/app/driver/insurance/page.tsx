'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { ShieldCheck, Check, AlertCircle } from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

interface Plan {
  code: string
  name: string
  weeklyPremiumRate: number
  coverage: string[]
  rewardsDiscountEligible: boolean
}

interface Subscription {
  id: string
  planCode: string
  status: string
  weeklyPremium: number
  currencyCode: string
}

export default function DriverInsurancePage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyCode, setBusyCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/driver/insurance')
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        setError(payload.error ?? 'Failed to load insurance')
        return
      }
      setError(null)
      setPlans(payload.plans ?? [])
      setSubscription(payload.subscription ?? null)
    } catch {
      setError('Failed to load insurance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubscribe = async (planCode: string) => {
    setBusyCode(planCode)
    try {
      const res = await fetch('/api/driver/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode }),
      })
      const payload = await res.json()
      if (res.ok && payload.success) await load()
    } finally {
      setBusyCode(null)
    }
  }

  const handleCancel = async () => {
    setBusyCode('cancel')
    try {
      const res = await fetch('/api/driver/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const payload = await res.json()
      if (res.ok && payload.success) await load()
    } finally {
      setBusyCode(null)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Insurance</h1>
        <p className="text-sm text-text-secondary mt-1">
          RideShield Basic is included free on every trip. Add more coverage any time — the premium is
          a small percentage of your own earnings, so it always scales with what you actually make.
        </p>
      </motion.div>

      {error && !loading && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">{error}</p>
        </motion.div>
      )}

      <motion.div variants={ITEM} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const active = subscription?.planCode === plan.code && subscription.status === 'active'
          return (
            <div
              key={plan.code}
              className={cn(
                'rounded-2xl border p-5 flex flex-col',
                active ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'border-border bg-surface'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className={cn('w-5 h-5', active ? 'text-amber-600' : 'text-text-secondary')} />
                <h3 className="text-base font-semibold text-text-primary">{plan.name}</h3>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                {plan.weeklyPremiumRate === 0
                  ? 'Included free'
                  : `${Math.round(plan.weeklyPremiumRate * 100)}% of weekly earnings`}
              </p>
              <ul className="space-y-2 mb-5 flex-1">
                {plan.coverage.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-xs text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
              {plan.weeklyPremiumRate === 0 ? (
                <span className="text-xs font-semibold text-emerald-600 text-center py-2">Always active</span>
              ) : active ? (
                <button
                  onClick={handleCancel}
                  disabled={busyCode !== null}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-surface-secondary text-text-primary hover:bg-border transition-colors disabled:opacity-50"
                >
                  {busyCode === 'cancel' ? 'Cancelling…' : 'Cancel add-on'}
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.code)}
                  disabled={busyCode !== null}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
                >
                  {busyCode === plan.code ? 'Subscribing…' : 'Subscribe'}
                </button>
              )}
            </div>
          )
        })}
      </motion.div>

      {subscription && subscription.status === 'active' && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
          <p className="text-sm text-text-secondary">
            Current weekly premium:{' '}
            <span className="font-semibold text-text-primary">
              {formatCurrency(subscription.weeklyPremium, subscription.currencyCode)}
            </span>{' '}
            — deducted from your earnings automatically. Gold and Platinum Road Rewards tiers get a discount on this rate.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
