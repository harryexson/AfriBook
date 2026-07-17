'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, Download, Users, Star,
  BarChart3,
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

const REVENUE_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}`,
  revenue: Math.floor(Math.random() * 80000 + 30000),
  orders: Math.floor(Math.random() * 20 + 5),
  bookings: Math.floor(Math.random() * 15 + 3),
}))

const TOP_SERVICES = [
  { name: 'Haircut & Styling', value: 45, color: '#F59E0B' },
  { name: 'Braiding', value: 28, color: '#3B82F6' },
  { name: 'Manicure & Pedicure', value: 18, color: '#10B981' },
  { name: 'Facial Treatment', value: 9, color: '#8B5CF6' },
]

const PEAK_HOURS = [
  { hour: '8am', orders: 2 }, { hour: '9am', orders: 5 }, { hour: '10am', orders: 8 },
  { hour: '11am', orders: 12 }, { hour: '12pm', orders: 15 }, { hour: '1pm', orders: 11 },
  { hour: '2pm', orders: 9 }, { hour: '3pm', orders: 7 }, { hour: '4pm', orders: 6 },
  { hour: '5pm', orders: 10 }, { hour: '6pm', orders: 14 }, { hour: '7pm', orders: 8 },
]

const DEMOGRAPHICS = [
  { label: 'Female', value: 62, color: '#F59E0B' },
  { label: 'Male', value: 35, color: '#3B82F6' },
  { label: 'Other', value: 3, color: '#10B981' },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const exportCSV = () => {
    const headers = ['Date', 'Revenue', 'Orders', 'Bookings']
    const rows = REVENUE_DATA.map((d) => [d.date, d.revenue, d.orders, d.bookings])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Track your business performance</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(1250000, 'XAF')} icon={TrendingUp} change={12} changeLabel="vs last month" />
        <StatCard label="Total Orders" value="186" icon={BarChart3} change={8} changeLabel="vs last month" />
        <StatCard label="Avg Order Value" value={formatCurrency(6720, 'XAF')} icon={Star} change={5} changeLabel="vs last month" />
        <StatCard label="Repeat Customers" value="42%" icon={Users} change={3} changeLabel="vs last month" />
      </motion.div>

      {/* Period selector */}
      <motion.div variants={ITEM}>
        <div className="flex bg-surface-secondary rounded-xl p-0.5 w-fit">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                period === p
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Revenue Trend</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), 'XAF'), 'Revenue'] as [string, string]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Peak Hours</h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PEAK_HOURS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
                <Bar dataKey="orders" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Services */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Popular Services</h3>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={TOP_SERVICES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {TOP_SERVICES.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {TOP_SERVICES.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-text-secondary">{s.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Demographics */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Customer Demographics</h3>
        <div className="flex items-center gap-6">
          {DEMOGRAPHICS.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: d.color, opacity: 0.2 }} />
              <div>
                <p className="text-2xl font-bold text-text-primary">{d.value}%</p>
                <p className="text-xs text-text-secondary">{d.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Staff Performance */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Staff Performance</h3>
        <div className="space-y-3">
          {[
            { name: 'Amara Okafor', rating: 4.9, bookings: 45, revenue: 450000 },
            { name: 'Kofi Mensah', rating: 4.7, bookings: 32, revenue: 320000 },
            { name: 'Fatima Bello', rating: 4.8, bookings: 28, revenue: 180000 },
          ].map((staff, i) => (
            <div key={staff.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-secondary transition-colors">
              <span className="text-sm font-semibold text-text-tertiary w-6">#{i + 1}</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                {staff.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{staff.name}</p>
                <p className="text-xs text-text-tertiary">{staff.bookings} bookings</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-text-primary">{staff.rating}</span>
              </div>
              <p className="text-sm font-semibold text-text-primary shrink-0">{formatCurrency(staff.revenue, 'XAF')}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
