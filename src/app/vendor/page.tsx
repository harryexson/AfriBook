'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Calendar, DollarSign, ShoppingBag, Star, Scissors, Plus, CalendarDays,
  QrCode, ArrowRight,
} from 'lucide-react'
import StatCard from '@/components/vendor/StatCard'
import RevenueChart from '@/components/vendor/RevenueChart'
import RecentBookings from '@/components/vendor/RecentBookings'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

// One accent throughout, per design-system/afribook/MASTER.md — three
// unrelated gradient hues previously competed with the amber brand color.
const QUICK_ACTIONS = [
  { label: 'Add Service', icon: Plus, href: '/vendor/services' },
  { label: 'View Calendar', icon: CalendarDays, href: '/vendor/bookings' },
  { label: 'Create QR Code', icon: QrCode, href: '/vendor/qr' },
]

interface AnalyticsState {
  currencyCode: string
  bookings: { count: number; revenue: number; changePercent: number }
  orders: { count: number; revenue: number; changePercent: number }
  avgRating: number
  activeServices: number
  revenueByDay: { date: string; bookingsRevenue: number; ordersRevenue: number }[]
  recentBookings: import('@/types').Booking[]
}

export default function VendorDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real data now — bookings (services) and orders (products/food) revenue
  // are fetched and kept SEPARATE throughout, per product decision, rather
  // than blended into one "Revenue" number. Currency comes from the
  // business's own registered country (via the API), not the viewer's
  // browser cookie — a vendor's dashboard should show their own business's
  // currency regardless of what country segment the page happens to be
  // rendered under.
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
  const changeLabel = period === '7d' ? 'vs last week' : 'vs last period'

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Welcome header */}
      <motion.div variants={ITEM}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">Here&apos;s what&apos;s happening with your business today.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-tertiary">Period:</span>
            <div className="flex bg-surface rounded-lg p-0.5 border border-border">
              {(['7d', '30d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    period === p
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {p === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-3">{error}</p>
        )}
      </motion.div>

      {/* Stats grid — bookings and orders revenue shown separately */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Bookings"
          value={analytics ? String(analytics.bookings.count) : '—'}
          icon={Calendar}
          change={analytics?.bookings.changePercent}
          changeLabel={changeLabel}
          loading={loading}
        />
        <StatCard
          label="Bookings Revenue"
          value={analytics ? formatCurrency(analytics.bookings.revenue, currencyCode) : '—'}
          icon={DollarSign}
          change={analytics?.bookings.changePercent}
          changeLabel={changeLabel}
          loading={loading}
        />
        <StatCard
          label="Orders Revenue"
          value={analytics ? formatCurrency(analytics.orders.revenue, currencyCode) : '—'}
          icon={ShoppingBag}
          change={analytics?.orders.changePercent}
          changeLabel={changeLabel}
          loading={loading}
        />
        <StatCard
          label="Avg Rating"
          value={analytics ? analytics.avgRating.toFixed(1) : '—'}
          icon={Star}
          loading={loading}
        />
        <StatCard
          label="Active Services"
          value={analytics ? String(analytics.activeServices) : '—'}
          icon={Scissors}
          loading={loading}
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all duration-300"
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-amber-500 to-amber-600')}>
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">{action.label}</p>
              <p className="text-xs text-text-tertiary">Quick action</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </motion.div>

      {/* Revenue chart + Recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={ITEM} className="lg:col-span-2">
          <RevenueChart data={analytics?.revenueByDay} currencyCode={currencyCode} loading={loading} />
        </motion.div>
        <motion.div variants={ITEM}>
          <RecentBookings bookings={analytics?.recentBookings} loading={loading} />
        </motion.div>
      </div>
    </motion.div>
  )
}
