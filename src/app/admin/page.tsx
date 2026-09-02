'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Users, Building2, CreditCard, DollarSign, TrendingUp,
  AlertTriangle, Activity, Shield, ArrowRight,
  CheckCircle,
} from 'lucide-react'
import AdminStatCard from '@/components/admin/StatCard'
import RevenueChart from '@/components/admin/RevenueChart'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

// Still mock — these need their own backends (KYC review queue, disputes
// table, a signups-over-time query) that weren't in scope for this pass,
// which focused on the platform totals + country breakdown below. Kept
// separate from the real KPI cards rather than blended together.
const RECENT_SIGNUPS = [
  { name: 'Alice M.', email: 'alice@example.com', country: 'CM', time: '2m ago' },
  { name: 'Bob K.', email: 'bob@example.com', country: 'NG', time: '15m ago' },
  { name: 'Carol D.', email: 'carol@example.com', country: 'KE', time: '1h ago' },
  { name: 'David N.', email: 'david@example.com', country: 'ZA', time: '3h ago' },
  { name: 'Eve T.', email: 'eve@example.com', country: 'GH', time: '6h ago' },
]

const RECENT_DISPUTES = [
  { id: '#DSP-001', reason: 'Service not rendered', user: 'Alice M.', status: 'under_review', priority: 'high' },
  { id: '#DSP-002', reason: 'Product damaged', user: 'Bob K.', status: 'open', priority: 'medium' },
  { id: '#DSP-003', reason: 'Incorrect charge', user: 'Carol D.', status: 'escalated', priority: 'high' },
]

const COUNTRY_FLAGS: Record<string, string> = {
  NG: '🇳🇬', KE: '🇰🇪', GH: '🇬🇭', ZA: '🇿🇦', CM: '🇨🇲', TZ: '🇹🇿', RW: '🇷🇼', UG: '🇺🇬',
  US: '🇺🇸', GB: '🇬🇧', IN: '🇮🇳', EG: '🇪🇬', MW: '🇲🇼',
}

const QUICK_ACTIONS = [
  { label: 'Review KYC Pending', icon: Shield, href: '/admin/kyc', color: 'from-amber-400 to-amber-600', count: '12 pending' },
  { label: 'Open Disputes', icon: AlertTriangle, href: '/admin/disputes', color: 'from-red-400 to-red-600', count: '4 active' },
  { label: 'Pending Businesses', icon: Building2, href: '/admin/businesses', color: 'from-blue-400 to-blue-600', count: '8 pending' },
  { label: 'Platform Settings', icon: Activity, href: '/admin/settings', color: 'from-purple-400 to-purple-600', count: '' },
]

interface Overview {
  totalUsers: number
  totalBusinesses: number
  totalVolumeUSD: number
  byCountry: { code: string; name: string; users: number; businesses: number; volumeLocal: number; currencyCode: string; volumeUSD: number }[]
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/analytics/overview')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (!data.success) { setError(data.error || 'Failed to load overview'); return }
        setOverview(data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load overview') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Global platform overview and key metrics.</p>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </motion.div>

      {/* Global KPIs — real now: total users, total businesses, and total
          volume properly converted to USD per-country before summing
          (previously this table summed raw local-currency numbers across
          countries as if they were the same currency — a real correctness
          bug, not just a labeling one). "Total Transactions" is still
          mock — it needs a combined bookings+orders+rides count query not
          built in this pass. */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Users" value={loading ? '—' : String(overview?.totalUsers ?? 0)} icon={Users} accent="bg-blue-500" />
        <AdminStatCard label="Total Businesses" value={loading ? '—' : String(overview?.totalBusinesses ?? 0)} icon={Building2} accent="bg-purple-500" />
        <AdminStatCard label="Total Transactions" value="89,234" icon={CreditCard} change={15.7} changeLabel="vs last month" accent="bg-emerald-500" />
        <AdminStatCard label="Volume (all-time, USD)" value={loading ? '—' : formatCurrency(overview?.totalVolumeUSD ?? 0, 'USD')} icon={DollarSign} accent="bg-amber-500" />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.label} href={action.href}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all duration-300">
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg', action.color)}>
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">{action.label}</p>
              {action.count && <p className="text-xs text-text-tertiary">{action.count}</p>}
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </motion.div>

      {/* Revenue chart + User growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={ITEM} className="lg:col-span-2">
          <RevenueChart />
        </motion.div>
        <motion.div variants={ITEM}>
          <div className="rounded-2xl bg-surface border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">User Growth</h3>
            <div className="space-y-3">
              {[
                { label: 'New Today', value: '+342', change: 18 },
                { label: 'This Week', value: '+2,145', change: 12 },
                { label: 'This Month', value: '+8,920', change: 15 },
                { label: 'Total Active', value: '98,450', change: 8 },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary">
                  <div>
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                    <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                  </div>
                  <div className={cn(
                    'flex items-center gap-0.5 text-xs font-semibold',
                    stat.change > 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{stat.change}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Country breakdown + Recent signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Country Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Country</th>
                  <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Users</th>
                  <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Businesses</th>
                  <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-text-tertiary">Loading…</td></tr>
                ) : (overview?.byCountry ?? []).map((c) => (
                  <tr key={c.code} className="border-b border-border-light hover:bg-surface-secondary transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{COUNTRY_FLAGS[c.code] ?? '🌍'}</span>
                        <span className="font-medium text-text-primary">{c.name}</span>
                        <span className="text-xs text-text-tertiary">{c.code}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-text-secondary font-mono tabular-nums">{c.users.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-text-secondary font-mono tabular-nums">{c.businesses.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      <div className="font-medium text-text-primary">{formatCurrency(c.volumeLocal, c.currencyCode)}</div>
                      {c.currencyCode !== 'USD' && (
                        <div className="text-xs text-text-tertiary">≈ {formatCurrency(c.volumeUSD, 'USD')}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="space-y-6">
          {/* Recent signups */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary font-heading">Recent Signups</h3>
              <Link href="/admin/users" className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">View all</Link>
            </div>
            <div className="space-y-3">
              {RECENT_SIGNUPS.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                    <p className="text-xs text-text-tertiary">{u.email} &middot; {u.country}</p>
                  </div>
                  <span className="text-xs text-text-tertiary">{u.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent disputes */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary font-heading">Recent Disputes</h3>
              <Link href="/admin/disputes" className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">View all</Link>
            </div>
            <div className="space-y-3">
              {RECENT_DISPUTES.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    d.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                  )}>
                    <AlertTriangle className={cn('w-4 h-4', d.priority === 'high' ? 'text-red-600' : 'text-amber-600')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{d.reason}</p>
                    <p className="text-xs text-text-tertiary">{d.user} &middot; {d.id}</p>
                  </div>
                  <span className={cn(
                    'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                    d.status === 'escalated' ? 'bg-red-100 text-red-700' : d.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {d.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* System health */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">System Health</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'API Latency', value: '142ms', status: 'healthy', icon: Activity },
            { label: 'Payment Gateway', value: 'Online', status: 'healthy', icon: CreditCard },
            { label: 'Database', value: '98.5% uptime', status: 'healthy', icon: Activity },
            { label: 'Email Service', value: 'Operational', status: 'degraded', icon: Activity },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                s.status === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              )}>
                {s.status === 'healthy' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{s.label}</p>
                <p className="text-xs text-text-secondary">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}


