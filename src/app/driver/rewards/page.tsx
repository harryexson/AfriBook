'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Award, CheckCircle2, TrendingUp, Percent, Clock, XCircle, Star, AlertCircle } from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const TIER_STYLE: Record<string, { gradient: string; ring: string }> = {
  blue: { gradient: 'from-slate-500 to-slate-700', ring: 'ring-slate-400' },
  silver: { gradient: 'from-zinc-400 to-zinc-600', ring: 'ring-zinc-300' },
  gold: { gradient: 'from-amber-400 to-amber-600', ring: 'ring-amber-400' },
  platinum: { gradient: 'from-fuchsia-500 to-purple-700', ring: 'ring-fuchsia-400' },
}

interface Tier {
  id: string
  name: string
  minTrips: number
  minAcceptanceRate: number
  maxCancellationRate: number
  minOnTimePickupRate: number
  minRating: number
  platformMarginRebate: number
  perks: string[]
}

interface RewardsData {
  success: boolean
  error?: string
  metrics?: {
    tripsLast30Days: number
    acceptanceRate: number
    cancellationRate: number
    onTimePickupRate: number
    averageRating: number
  }
  tier?: Tier
  next?: Tier | null
  progressToNext?: Record<string, number> | null
}

export default function DriverRewardsPage() {
  const [data, setData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/driver/rewards')
        const payload = (await res.json()) as RewardsData
        if (!cancelled) setData(payload)
      } catch {
        if (!cancelled) setData({ success: false, error: 'Failed to load rewards' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const tier = data?.tier
  const next = data?.next
  const metrics = data?.metrics
  const style = TIER_STYLE[tier?.id ?? 'blue']

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Road Rewards</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your tier is based on real performance — not tenure — and unlocks a bigger rebate of AfriBook’s own margin, not just perks.
        </p>
      </motion.div>

      {data?.error && !loading && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">{data.error}</p>
        </motion.div>
      )}

      {tier && (
        <motion.div variants={ITEM}>
          <div className={cn('rounded-2xl p-6 text-white relative overflow-hidden bg-gradient-to-br', style.gradient)}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">Current Tier</p>
                <p className="text-2xl font-bold">{tier.name}</p>
                <p className="text-sm opacity-90 mt-1">
                  {Math.round(tier.platformMarginRebate * 100)}% rebate of AfriBook&apos;s own margin, credited weekly
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {metrics && (
        <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Trips (30d)', value: metrics.tripsLast30Days, icon: TrendingUp },
            { label: 'Acceptance rate', value: `${metrics.acceptanceRate}%`, icon: CheckCircle2 },
            { label: 'Cancellation rate', value: `${metrics.cancellationRate}%`, icon: XCircle },
            { label: 'On-time pickup', value: `${metrics.onTimePickupRate}%`, icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4">
              <stat.icon className="w-4 h-4 text-amber-600 mb-2" />
              <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {next && data?.progressToNext && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-text-primary font-heading">Path to {next.name}</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: 'trips', label: `Trips in the last 30 days (need ${next.minTrips})` },
              { key: 'acceptanceRate', label: `Acceptance rate (need ${next.minAcceptanceRate}%+)` },
              { key: 'onTimePickupRate', label: `On-time pickup rate (need ${next.minOnTimePickupRate}%+)` },
              { key: 'rating', label: `Rating (need ${next.minRating}+)` },
            ].map((row) => {
              const p = Math.round((data.progressToNext?.[row.key] ?? 0) * 100)
              return (
                <div key={row.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-secondary">{row.label}</span>
                    <span className="text-xs font-semibold text-text-primary">{p}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {tier && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Your {tier.name} perks</h3>
          <ul className="space-y-2.5">
            {tier.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="whitespace-pre-line">{perk}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  )
}
