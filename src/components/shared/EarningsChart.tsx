'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

type Period = 'daily' | 'weekly' | 'monthly'

interface EarningsData {
  label: string
  fares: number
  tips: number
  bonuses: number
}

interface EarningsChartProps {
  data?: EarningsData[]
  currencyCode?: string
  loading?: boolean
}

const MOCK_DATA: Record<Period, EarningsData[]> = {
  daily: [
    { label: 'Mon', fares: 12000, tips: 1500, bonuses: 500 },
    { label: 'Tue', fares: 8500, tips: 2000, bonuses: 0 },
    { label: 'Wed', fares: 15000, tips: 3000, bonuses: 1000 },
    { label: 'Thu', fares: 10000, tips: 2500, bonuses: 0 },
    { label: 'Fri', fares: 18000, tips: 4000, bonuses: 2000 },
    { label: 'Sat', fares: 22000, tips: 5000, bonuses: 1500 },
    { label: 'Sun', fares: 14000, tips: 3000, bonuses: 500 },
  ],
  weekly: Array.from({ length: 4 }, (_, i) => ({
    label: `W${i + 1}`,
    fares: Math.floor(Math.random() * 80000 + 50000),
    tips: Math.floor(Math.random() * 20000 + 5000),
    bonuses: Math.floor(Math.random() * 10000 + 1000),
  })),
  monthly: Array.from({ length: 6 }, (_, i) => ({
    label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
    fares: Math.floor(Math.random() * 350000 + 200000),
    tips: Math.floor(Math.random() * 80000 + 20000),
    bonuses: Math.floor(Math.random() * 40000 + 5000),
  })),
}

export default function EarningsChart({ data, currencyCode = 'XAF', loading }: EarningsChartProps) {
  const [period, setPeriod] = useState<Period>('daily')
  const [stacked, setStacked] = useState(true)

  const chartData = data ?? MOCK_DATA[period]

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-36 h-6 rounded bg-surface-secondary" />
          <div className="flex gap-2">
            <div className="w-14 h-8 rounded-lg bg-surface-secondary" />
            <div className="w-14 h-8 rounded-lg bg-surface-secondary" />
          </div>
        </div>
        <div className="w-full h-72 rounded-xl bg-surface-secondary" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl bg-surface border border-border p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary font-heading">Earnings</h3>
          <p className="text-sm text-text-secondary">Fares, tips & bonuses breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStacked(!stacked)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              stacked ? 'bg-amber-500 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            )}
          >
            Stacked
          </button>
          <div className="flex bg-surface-secondary rounded-lg p-0.5">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  period === p
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {stacked ? (
            <BarChart data={chartData} barGap={0} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={((value: number, name: string) => [formatCurrency(value, currencyCode), name.charAt(0).toUpperCase() + name.slice(1)]) as any}
              />
              <Bar dataKey="fares" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
              <Bar dataKey="tips" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="bonuses" stackId="a" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="faresGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tipsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bonusesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={((value: number, name: string) => [formatCurrency(value, currencyCode), name.charAt(0).toUpperCase() + name.slice(1)]) as any}
              />
              <Area type="monotone" dataKey="fares" stroke="#F59E0B" strokeWidth={2} fill="url(#faresGrad)" />
              <Area type="monotone" dataKey="tips" stroke="#10B981" strokeWidth={2} fill="url(#tipsGrad)" />
              <Area type="monotone" dataKey="bonuses" stroke="#8B5CF6" strokeWidth={2} fill="url(#bonusesGrad)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        {[
          { label: 'Fares', color: 'bg-amber-500' },
          { label: 'Tips', color: 'bg-emerald-500' },
          { label: 'Bonuses', color: 'bg-purple-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', item.color)} />
            <span className="text-xs text-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
