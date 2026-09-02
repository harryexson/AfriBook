'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag,
  Download,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { TooltipValueType as ValueType } from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

const DAYS_BY_RANGE: Record<'7d' | '30d' | '90d' | '1y', number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }

interface PlatformData {
  revenueTrend: { date: string; revenueUSD: number }[]
  topVendors: { businessId: string; name: string; countryCode: string; revenueUSD: number; bookingCount: number }[]
  topCategories: { categoryId: string | null; name: string; revenueUSD: number; bookingCount: number }[]
}

interface OverviewData {
  byCountry: { code: string; name: string; volumeUSD: number }[]
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [platform, setPlatform] = useState<PlatformData | null>(null)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/analytics/platform?days=${DAYS_BY_RANGE[dateRange]}`).then((r) => r.json()),
      fetch('/api/admin/analytics/overview').then((r) => r.json()),
    ])
      .then(([platformData, overviewData]) => {
        if (!platformData.success) { setError(platformData.error || 'Failed to load analytics'); return }
        setPlatform(platformData)
        if (overviewData.success) setOverview(overviewData)
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [dateRange])

  const totalRevenueUSD = platform?.revenueTrend.reduce((s, d) => s + d.revenueUSD, 0) ?? 0
  const totalBookings = platform?.topVendors.reduce((s, v) => s + v.bookingCount, 0) ?? 0
  const avgOrderValue = totalBookings > 0 ? totalRevenueUSD / totalBookings : 0

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Platform Analytics</h1>
            <p className="text-sm text-text-secondary mt-1">Deep dive into platform performance and trends.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-secondary rounded-lg p-0.5 border border-border">
              {(['7d', '30d', '90d', '1y'] as const).map((d) => (
                <button key={d} onClick={() => setDateRange(d)}
                  className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', dateRange === d ? 'bg-amber-500 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary')}>
                  {d}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Global KPIs — real now, except Conversion Rate, which needs
          visitor/funnel tracking that doesn't exist anywhere in the
          schema (checked) — shown as unavailable rather than invented. */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label={`Total Revenue (${dateRange})`} value={loading ? '—' : formatCurrency(totalRevenueUSD, 'USD')} icon={DollarSign} accent="bg-emerald-500" />
        <AdminStatCard label="Total Bookings" value={loading ? '—' : totalBookings.toLocaleString()} icon={ShoppingBag} accent="bg-amber-500" />
        <AdminStatCard label="Avg Order Value" value={loading ? '—' : formatCurrency(avgOrderValue, 'USD')} icon={TrendingUp} accent="bg-blue-500" />
        <AdminStatCard label="Conversion Rate" value="Not tracked" icon={BarChart3} accent="bg-purple-500" />
      </motion.div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Revenue trend — real, "Profit" removed: no platform-cost tracking
          exists anywhere in the schema, so a profit line would just be
          revenue minus an invented cost. */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Global Revenue Trend</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={platform?.revenueTrend ?? []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), 'USD'), 'Revenue'] as [string, string]} />
              <Legend />
              <Area type="monotone" dataKey="revenueUSD" stroke="#F59E0B" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Country comparison — real, from the same platform overview
          endpoint the main dashboard uses. */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Country Comparison</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview?.byCountry ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), 'USD'), 'Volume'] as [string, string]} />
              <Legend />
              <Bar dataKey="volumeUSD" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Volume (USD)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top categories + Top vendors — both real now */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Top Categories</h3>
          <div className="space-y-3">
            {(platform?.topCategories ?? []).map((c, i) => (
              <div key={c.categoryId ?? 'uncategorized'} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-tertiary">{c.bookingCount.toLocaleString()} bookings</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(c.revenueUSD, 'USD')}</p>
              </div>
            ))}
            {!loading && (platform?.topCategories ?? []).length === 0 && (
              <p className="text-sm text-text-tertiary">No category revenue yet.</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Top Vendors</h3>
          <div className="space-y-3">
            {(platform?.topVendors ?? []).map((v) => (
              <div key={v.businessId} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {v.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{v.name}</p>
                    <p className="text-xs text-text-tertiary">{v.countryCode} &middot; {v.bookingCount} bookings</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(v.revenueUSD, 'USD')}</p>
              </div>
            ))}
            {!loading && (platform?.topVendors ?? []).length === 0 && (
              <p className="text-sm text-text-tertiary">No vendor revenue yet.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* User Acquisition Channels + Conversion Funnel removed — neither
          has any backing data. No page-view, session, or funnel-event
          tracking exists anywhere in the schema (checked). Faking a pie
          chart and a funnel here would be pure invention, not a wiring
          gap, so they're gone rather than left mock next to real charts. */}
    </motion.div>
  )
}
