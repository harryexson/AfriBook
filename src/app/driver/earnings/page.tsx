'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Wallet, TrendingUp, TrendingDown, Gift, Percent,
  Download, Plus, ChevronDown, ArrowUpRight, Banknote,
} from 'lucide-react'
import EarningsChart from '@/components/shared/EarningsChart'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const as const } },
}

const MOCK_PAYOUTS = [
  { id: 'p1', date: 'Jul 8, 2026', amount: 18200, status: 'completed' as const },
  { id: 'p2', date: 'Jul 1, 2026', amount: 16500, status: 'completed' as const },
  { id: 'p3', date: 'Jun 24, 2026', amount: 19800, status: 'completed' as const },
  { id: 'p4', date: 'Jun 17, 2026', amount: 14300, status: 'processing' as const },
]

export default function EarningsPage() {
  const [payoutLoading, setPayoutLoading] = useState(false)

  const handleRequestPayout = () => {
    setPayoutLoading(true)
    setTimeout(() => setPayoutLoading(false), 2000)
  }

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
          disabled={payoutLoading}
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
            <p className="text-4xl font-bold mb-1">{formatCurrency(45200)}</p>
            <p className="text-sm text-amber-200">
              Next payout: <span className="text-white font-semibold">Jul 15, 2026</span>
            </p>
            <button
              onClick={handleRequestPayout}
              disabled={payoutLoading}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Period stats */}
      <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'This Week', value: formatCurrency(18200), change: '+12%', positive: true },
          { label: 'This Month', value: formatCurrency(68700), change: '+8%', positive: true },
          { label: 'Last Month', value: formatCurrency(63500), change: '-3%', positive: false },
          { label: 'Avg per Trip', value: formatCurrency(1650), change: '+5%', positive: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4">
            <p className="text-xs text-text-secondary mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold mt-1',
              stat.positive ? 'text-emerald-600' : 'text-red-600'
            )}>
              {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.change}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={ITEM}>
        <EarningsChart />
      </motion.div>

      {/* Earnings breakdown */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Fares', value: formatCurrency(54300), percentage: 79, icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Tips', value: formatCurrency(10200), percentage: 15, icon: Gift, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Bonuses', value: formatCurrency(4200), percentage: 6, icon: Percent, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                <p className="text-sm font-bold text-text-primary">{item.value}</p>
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
            { label: 'Total Earned', value: formatCurrency(68700) },
            { label: 'Platform Fee', value: formatCurrency(6870), sub: '10%' },
            { label: 'Estimated Tax', value: formatCurrency(10305), sub: '15%' },
            { label: 'Net Income', value: formatCurrency(51525) },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-surface-secondary">
              <p className="text-xs text-text-secondary">{item.label}</p>
              <p className="text-lg font-bold text-text-primary mt-1">{item.value}</p>
              {item.sub && <p className="text-xs text-text-tertiary">{item.sub}</p>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payout history */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary font-heading">Payout History</h3>
          <button className="text-xs font-medium text-amber-600 hover:text-amber-700">View all</button>
        </div>
        <div className="space-y-2">
          {MOCK_PAYOUTS.map((payout) => (
            <div key={payout.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  payout.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                )}>
                  <Banknote className={cn(
                    'w-4 h-4',
                    payout.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{payout.date}</p>
                  <span className={cn(
                    'text-xs font-medium capitalize',
                    payout.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {payout.status}
                  </span>
                </div>
              </div>
              <p className="text-sm font-bold text-text-primary">{formatCurrency(payout.amount)}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
