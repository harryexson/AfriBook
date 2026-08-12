'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { getCurrencyForCountry } from '@/lib/money'
import { useCountry } from '@/components/shared/CountryProvider'
import {
  Wallet, TrendingUp, Gift, Percent,
  Download, Plus, ArrowUpRight, Banknote, AlertCircle,
} from 'lucide-react'
import EarningsChart from '@/components/shared/EarningsChart'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

interface Summary {
  totalEarnings: number
  tripCount: number
  avgPerTrip: number
  tips: number
  surgeEarnings: number
  platformFees: number
  promotionEarnings: number
  byDay: Array<{ date: string; earnings: number; trips: number; tips: number; surge: number }>
}

interface Payout {
  id: string
  amount: number
  fee: number
  netAmount: number
  payoutType: string
  status: string
  currencyCode: string
  createdAt: string
  completedAt?: string | null
}

interface EarningsData {
  success: boolean
  error?: string
  balance?: { available: number; pending: number; totalEarned: number; currencyCode: string }
  summaries?: { week: Summary; month: Summary; all: Summary }
  payouts?: Payout[]
}

const PAYOUT_STATUS_STYLE: Record<string, { icon: string; text: string }> = {
  completed: { icon: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' },
  processing: { icon: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600' },
  pending: { icon: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600' },
  failed: { icon: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600' },
  on_hold: { icon: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600' },
}

export default function EarningsPage() {
  const { countryCode } = useCountry()
  const fallbackCurrency = getCurrencyForCountry(countryCode)

  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/ridely/earnings')
      const payload = (await res.json()) as EarningsData
      if (!res.ok || !payload.success) {
        setError(payload.error ?? 'Failed to load earnings')
        setData(null)
        return
      }
      setError(null)
      setData(payload)
    } catch {
      setError('Failed to load earnings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!cancelled) await loadData()
    })()
    return () => {
      cancelled = true
    }
  }, [loadData])

  const handleRequestPayout = async () => {
    if (!data?.balance) return
    setPayoutLoading(true)
    setNotice(null)
    try {
      const res = await fetch('/api/ridely/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: data.balance.available }),
      })
      const result = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !result.success) {
        setNotice({ type: 'error', text: result.error ?? 'Failed to request payout' })
      } else {
        setNotice({ type: 'success', text: 'Payout requested — processing' })
        await loadData()
      }
    } catch {
      setNotice({ type: 'error', text: 'Failed to request payout' })
    } finally {
      setPayoutLoading(false)
    }
  }

  const balance = data?.balance
  const summaries = data?.summaries
  const payouts = data?.payouts ?? []
  const currencyCode = balance?.currencyCode ?? fallbackCurrency

  const allSummary = summaries?.all
  const weekSummary = summaries?.week
  const monthSummary = summaries?.month

  const faresTotal = allSummary
    ? Math.max(0, allSummary.totalEarnings - allSummary.tips - allSummary.surgeEarnings)
    : 0
  const breakdownTotal = Math.max(1, allSummary?.totalEarnings ?? 1)
  const breakdown = allSummary
    ? [
        { label: 'Fares', value: faresTotal, percentage: Math.round((faresTotal / breakdownTotal) * 100), icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
        { label: 'Tips', value: allSummary.tips, percentage: Math.round((allSummary.tips / breakdownTotal) * 100), icon: Gift, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
        { label: 'Bonuses', value: allSummary.surgeEarnings, percentage: Math.round((allSummary.surgeEarnings / breakdownTotal) * 100), icon: Percent, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
      ]
    : []

  const chartData = (monthSummary?.byDay ?? []).map((day) => ({
    label: day.date.slice(5),
    fares: Math.max(0, day.earnings - day.tips - day.surge),
    tips: day.tips,
    bonuses: day.surge,
  }))

  const totalEarned = allSummary?.totalEarnings ?? 0
  const platformFees = allSummary?.platformFees ?? 0
  const estimatedTax = Math.round((totalEarned - platformFees) * 0.15)
  const netIncome = totalEarned - platformFees - estimatedTax

  const canWithdraw = balance != null && balance.available >= 100

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Earnings</h1>
          <p className="text-sm text-text-secondary mt-1">Track your income and request payouts</p>
        </div>
        <button
          onClick={handleRequestPayout}
          disabled={payoutLoading || loading || !canWithdraw}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
            'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
            'hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25',
            'disabled:opacity-50 active:scale-[0.98]'
          )}
        >
          {payoutLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <><Plus className="w-4 h-4" /> Request Payout</>
          )}
        </button>
      </motion.div>

      {/* Notice */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium',
            notice.type === 'success'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          )}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {notice.text}
        </motion.div>
      )}

      {/* Error / empty state */}
      {error && !loading && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">{error}</p>
          <p className="text-xs text-text-tertiary mt-1">
            Make sure you&apos;re signed in with a verified driver account.
          </p>
        </motion.div>
      )}

      {/* Balance card */}
      <motion.div variants={ITEM}>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-amber-200" />
              <span className="text-sm font-medium text-amber-200">Available Balance</span>
            </div>
            {loading ? (
              <div className="w-48 h-10 rounded-lg bg-white/20 animate-pulse mb-1" />
            ) : (
              <p className="text-4xl font-bold mb-1">{formatCurrency(balance?.available ?? 0, currencyCode)}</p>
            )}
            <p className="text-sm text-amber-200">
              {loading
                ? 'Loading balance...'
                : `Pending: ${formatCurrency(balance?.pending ?? 0, currencyCode)}`}
            </p>
            <button
              onClick={handleRequestPayout}
              disabled={payoutLoading || loading || !canWithdraw}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              {canWithdraw ? 'Withdraw now' : 'Min payout is 100'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Period stats */}
      <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'This Week', value: weekSummary?.totalEarnings ?? 0, sub: `${weekSummary?.tripCount ?? 0} trips` },
          { label: 'This Month', value: monthSummary?.totalEarnings ?? 0, sub: `${monthSummary?.tripCount ?? 0} trips` },
          { label: 'Total Earned', value: allSummary?.totalEarnings ?? 0, sub: 'all time' },
          { label: 'Avg per Trip', value: allSummary?.avgPerTrip ?? 0, sub: 'average' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4">
            <p className="text-xs text-text-secondary mb-1">{stat.label}</p>
            {loading ? (
              <div className="w-20 h-6 rounded bg-surface-secondary animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-text-primary">{formatCurrency(stat.value, currencyCode)}</p>
            )}
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold mt-1 text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              {stat.sub}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={ITEM}>
        <EarningsChart data={chartData} currencyCode={currencyCode} loading={loading} />
      </motion.div>

      {/* Earnings breakdown */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {breakdown.map((item) => (
          <div key={item.label} className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                <p className="text-sm font-bold text-text-primary">{formatCurrency(item.value, currencyCode)}</p>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <p className="text-xs text-text-tertiary mt-1">{item.percentage}% of total</p>
          </div>
        ))}
      </motion.div>

      {/* Tax summary */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary font-heading">Tax Summary</h3>
          <button className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
            Download <Download className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Earned', value: totalEarned },
            { label: 'Platform Fee', value: platformFees, sub: 'actual fees' },
            { label: 'Estimated Tax', value: estimatedTax, sub: '15% est.' },
            { label: 'Net Income', value: netIncome },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-surface-secondary">
              <p className="text-xs text-text-secondary">{item.label}</p>
              <p className="text-lg font-bold text-text-primary mt-1">{formatCurrency(item.value, currencyCode)}</p>
              {item.sub && <p className="text-xs text-text-tertiary">{item.sub}</p>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payout history */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary font-heading">Payout History</h3>
        </div>
        {payouts.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4 text-center">
            {loading ? 'Loading payouts...' : 'No payouts yet'}
          </p>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout) => {
              const style = PAYOUT_STATUS_STYLE[payout.status] ?? PAYOUT_STATUS_STYLE.pending
              return (
                <div key={payout.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', style.icon)}>
                      <Banknote className={cn('w-4 h-4', style.text)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </p>
                      <span className={cn('text-xs font-medium capitalize', style.text)}>
                        {payout.status.replace('_', ' ')} · {payout.payoutType}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-text-primary">
                    {formatCurrency(payout.amount, payout.currencyCode)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
