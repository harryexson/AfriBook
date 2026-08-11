'use client'

import { useState } from 'react'
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
  PieChart, Pie, Cell,
} from 'recharts'
import type { TooltipValueType as ValueType } from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

const REVENUE_TREND = [
  { month: 'Jan', revenue: 8500000, cost: 1200000, profit: 7300000 },
  { month: 'Feb', revenue: 9200000, cost: 1150000, profit: 8050000 },
  { month: 'Mar', revenue: 10800000, cost: 1300000, profit: 9500000 },
  { month: 'Apr', revenue: 10200000, cost: 1250000, profit: 8950000 },
  { month: 'May', revenue: 11500000, cost: 1400000, profit: 10100000 },
  { month: 'Jun', revenue: 12800000, cost: 1350000, profit: 11450000 },
]

const COUNTRY_REVENUE = [
  { country: 'Cameroon', revenue: 28500000, users: 28450, growth: 15 },
  { country: 'Nigeria', revenue: 42000000, users: 52100, growth: 22 },
  { country: 'Kenya', revenue: 15600000, users: 18900, growth: 18 },
  { country: 'S. Africa', revenue: 12400000, users: 15300, growth: 12 },
  { country: 'Ghana', revenue: 8900000, users: 9200, growth: 25 },
  { country: 'Tanzania', revenue: 6700000, users: 6700, growth: 30 },
  { country: 'Rwanda', revenue: 4300000, users: 4800, growth: 35 },
  { country: 'Uganda', revenue: 5200000, users: 5100, growth: 28 },
]

const TOP_CATEGORIES = [
  { name: 'Food & Dining', revenue: 18200000, bookings: 12400, growth: 18 },
  { name: 'Salon & Beauty', revenue: 12400000, bookings: 8900, growth: 22 },
  { name: 'Fitness & Wellness', revenue: 9800000, bookings: 7200, growth: 15 },
  { name: 'Consulting', revenue: 7600000, bookings: 5400, growth: 12 },
  { name: 'Photography', revenue: 5400000, bookings: 3800, growth: 28 },
  { name: 'Cleaning', revenue: 3200000, bookings: 2100, growth: -5 },
]

const TOP_VENDORS = [
  { name: 'Savannah Grille', revenue: 2450000, bookings: 890, country: 'CM' },
  { name: 'Lagos Hair Studio', revenue: 1980000, bookings: 1200, country: 'NG' },
  { name: 'Nairobi Fit Hub', revenue: 1760000, bookings: 650, country: 'KE' },
  { name: 'Cape Creative Co', revenue: 1540000, bookings: 430, country: 'ZA' },
  { name: 'Accra Eats', revenue: 1320000, bookings: 780, country: 'GH' },
]

const ACQUISITION_CHANNELS = [
  { name: 'Organic Search', value: 35 },
  { name: 'Social Media', value: 25 },
  { name: 'Referral', value: 20 },
  { name: 'Direct', value: 12 },
  { name: 'Paid Ads', value: 8 },
]

const FUNNEL_DATA = [
  { stage: 'Visitors', count: 125000 },
  { stage: 'Searched', count: 78000 },
  { stage: 'Viewed Item', count: 45000 },
  { stage: 'Added to Cart', count: 28000 },
  { stage: 'Checked Out', count: 18500 },
  { stage: 'Completed', count: 14200 },
]

const COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444']

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

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

      {/* Global KPIs */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Revenue (YTD)" value={formatCurrency(63000000, 'XAF')} icon={DollarSign} change={22.4} accent="bg-emerald-500" />
        <AdminStatCard label="Total Bookings" value="45,234" icon={ShoppingBag} change={18.7} accent="bg-amber-500" />
        <AdminStatCard label="Avg Order Value" value={formatCurrency(12400, 'XAF')} icon={TrendingUp} change={5.2} accent="bg-blue-500" />
        <AdminStatCard label="Conversion Rate" value="11.4%" icon={BarChart3} change={2.1} accent="bg-purple-500" />
      </motion.div>

      {/* Revenue trends */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Global Revenue Trends</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_TREND}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), 'XAF'), ''] as [string, string]} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2.5} fill="url(#profitGrad)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Country comparison */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Country Comparison</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COUNTRY_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="country" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), 'XAF'), 'Revenue'] as [string, string]} />
              <Legend />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top categories + Top vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Top Categories</h3>
          <div className="space-y-3">
            {TOP_CATEGORIES.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-tertiary">{c.bookings.toLocaleString()} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(c.revenue, 'XAF')}</p>
                  <span className={cn('text-xs font-medium', c.growth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {c.growth >= 0 ? '+' : ''}{c.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Top Vendors</h3>
          <div className="space-y-3">
            {TOP_VENDORS.map((v, _i) => (
              <div key={v.name} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {v.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{v.name}</p>
                    <p className="text-xs text-text-tertiary">{v.country} &middot; {v.bookings} bookings</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(v.revenue, 'XAF')}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Acquisition channels + Conversion funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">User Acquisition Channels</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ACQUISITION_CHANNELS} cx="50%" cy="50%" outerRadius={80} paddingAngle={4} dataKey="value">
                  {ACQUISITION_CHANNELS.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Conversion Funnel</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUNNEL_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-4 p-3 rounded-xl bg-surface-secondary">
            <div>
              <p className="text-xs text-text-tertiary">Overall Conversion</p>
              <p className="text-lg font-bold text-text-primary">11.4%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary">Drop-off Rate</p>
              <p className="text-lg font-bold text-text-primary">88.6%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
