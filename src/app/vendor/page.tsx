'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Calendar, DollarSign, Star, Scissors, Plus, CalendarDays,
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

const QUICK_ACTIONS = [
  { label: 'Add Service', icon: Plus, href: '/vendor/services', color: 'from-amber-400 to-amber-600' },
  { label: 'View Calendar', icon: CalendarDays, href: '/vendor/bookings', color: 'from-blue-400 to-blue-600' },
  { label: 'Create QR Code', icon: QrCode, href: '/vendor/qr', color: 'from-purple-400 to-purple-600' },
]

export default function VendorDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')

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
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value="128"
          icon={Calendar}
          change={12}
          changeLabel="vs last week"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(456000, 'XAF')}
          icon={DollarSign}
          change={8.5}
          changeLabel="vs last week"
        />
        <StatCard
          label="Avg Rating"
          value="4.8"
          icon={Star}
          change={2}
          changeLabel="vs last month"
        />
        <StatCard
          label="Active Services"
          value="12"
          icon={Scissors}
          change={0}
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
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg', action.color)}>
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
          <RevenueChart />
        </motion.div>
        <motion.div variants={ITEM}>
          <RecentBookings />
        </motion.div>
      </div>

      {/* Performance metrics */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Performance vs Last Period</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Conversion Rate', value: '34%', change: '+5%' },
            { label: 'Repeat Customers', value: '42%', change: '+8%' },
            { label: 'Avg Booking Value', value: '3,560 XAF', change: '+12%' },
            { label: 'Cancellation Rate', value: '6%', change: '-2%' },
          ].map((metric) => (
            <div key={metric.label} className="p-4 rounded-xl bg-surface-secondary">
              <p className="text-xs text-text-tertiary mb-1">{metric.label}</p>
              <p className="text-xl font-bold text-text-primary">{metric.value}</p>
              <p className={cn(
                'text-xs font-semibold mt-1',
                metric.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
              )}>
                {metric.change}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
