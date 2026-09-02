'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import {
  TrendingUp, Download, Star, BarChart3,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RPieChart, Pie, Cell,
} from 'recharts'
import type { TooltipValueType as ValueType } from 'recharts'
import StatCard from '@/components/vendor/StatCard'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const SERVICE_COLORS = ['#F59E0B', '#64748B', '#0EA5E9', '#8B5CF6', '#10B981', '#EF4444']

interface AnalyticsState {
  currencyCode: string
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  repeatCustomerRate: number
  revenueByDay: { date: string; bookingsRevenue: number; ordersRevenue: number }[]
  peakHours: { hour: string; count: number }[]
  topServices: { serviceId: string; name: string; bookingCount: number; revenue: number }[]
  staffPerformance: { staffId: string; name: string; bookingCount: number; revenue: number; avgRating: number | null }[]
}

// Period model unified with the main vendor dashboard (7d/30d) rather than
// this page's own separate daily/weekly/monthly toggle — both now read the
// same endpoint the same way, so "7 days" means the same thing everywhere
// in the vendor product instead of two different windows depending on
// which page you're on.
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/vendor/analytics?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (!data.success) {
          setError(data.error || 'Failed to load analytics')
          return
        }
        setAnalytics(data)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load analytics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  const currencyCode = analytics?.currencyCode ?? 'USD'

  const exportCSV = () => {
    if (!analytics) return
    const headers = ['Date', 'Bookings Revenue', 'Orders Revenue']
    const rows = analytics.revenueByDay.map((d) => [d.date, d.bookingsRevenue, d.ordersRevenue])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Track your business performance</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-secondary rounded-xl p-0.5">
            {(['7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  period === p ? 'bg-amber-500 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {p === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            disabled={!analytics}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* Stats — same underlying data as the dashboard, blended into one
          top-line view here rather than the dashboard's separated cards */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={analytics ? formatCurrency(analytics.totalRevenue, currencyCode) : '—'}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          label="Total Orders"
          value={analytics ? String(analytics.totalOrders) : '—'}
          icon={BarChart3}
          loading={loading}
        />
        <StatCard
          label="Avg Order Value"
          value={analytics ? formatCurrency(analytics.avgOrderValue, currencyCode) : '—'}
          icon={Star}
          loading={loading}
        />
        <StatCard
          label="Repeat Customers"
          value={analytics ? `${analytics.repeatCustomerRate}%` : '—'}
          icon={TrendingUp}
          loading={loading}
        />
      </motion.div>

      {/* Revenue Chart — same series as the dashboard's RevenueChart component */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Revenue Trend</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics?.revenueByDay ?? []}>
              <defs>
                <linearGradient id="bookingsGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType, name?: string | number) => [
                  formatCurrency(Number(value ?? 0), currencyCode),
                  String(name) === 'ordersRevenue' ? 'Orders' : 'Bookings',
                ] as [string, string]}
              />
              <Area type="monotone" dataKey="bookingsRevenue" stroke="#F59E0B" strokeWidth={2.5} fill="url(#bookingsGrad2)" stackId="rev" />
              <Area type="monotone" dataKey="ordersRevenue" stroke="#64748B" strokeWidth={2} fill="url(#ordersGrad2)" stackId="rev" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours — real, from booking/order timestamps. UTC buckets:
            there's no per-business timezone field in the schema yet, so
            this can't be shifted to local time without adding one. */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-1">Peak Hours</h3>
          <p className="text-xs text-text-tertiary mb-4">Hours shown in UTC</p>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.peakHours ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Services — real, grouped from bookings in the period */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Popular Services</h3>
          {analytics && analytics.topServices.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={analytics.topServices} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="bookingCount">
                      {analytics.topServices.map((_, i) => (
                        <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                      ))}
                    </Pie>
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {analytics.topServices.map((s, i) => (
                  <div key={s.serviceId} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                      <span className="text-sm text-text-secondary truncate">{s.name}</span>
                    </div>
                    <span className="text-sm font-semibold font-mono tabular-nums text-text-primary shrink-0">{s.bookingCount}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">{loading ? 'Loading…' : 'No bookings in this period yet.'}</p>
          )}
        </motion.div>
      </div>

      {/* Staff Performance — real, from bookings + reviews in the period.
          A staff member with no reviews yet shows "No ratings yet" rather
          than a fabricated number. */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Staff Performance</h3>
        {analytics && analytics.staffPerformance.length > 0 ? (
          <div className="space-y-3">
            {analytics.staffPerformance.map((staff, i) => (
              <div key={staff.staffId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-secondary transition-colors">
                <span className="text-sm font-semibold text-text-tertiary w-6">#{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {staff.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{staff.name}</p>
                  <p className="text-xs text-text-tertiary font-mono tabular-nums">{staff.bookingCount} bookings</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {staff.avgRating != null ? (
                    <>
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-semibold font-mono tabular-nums text-text-primary">{staff.avgRating}</span>
                    </>
                  ) : (
                    <span className="text-xs text-text-tertiary">No ratings yet</span>
                  )}
                </div>
                <p className="text-sm font-semibold font-mono tabular-nums text-text-primary shrink-0">
                  {formatCurrency(staff.revenue, currencyCode)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">{loading ? 'Loading…' : 'No staff bookings in this period yet.'}</p>
        )}
      </motion.div>
    </motion.div>
  )
}
