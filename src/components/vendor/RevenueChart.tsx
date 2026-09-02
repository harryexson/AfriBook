'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend,
} from 'recharts'
import type { TooltipValueType as ValueType } from 'recharts'

type Period = '7d' | '30d' | '90d'
type ChartType = 'area' | 'bar'

// Bookings (services) and orders (products/food) revenue are kept as two
// separate series throughout — a business selling both needs to see which
// side is actually driving revenue, not one blended number.
interface RevenueData {
  date: string
  bookingsRevenue: number
  ordersRevenue: number
}

interface RevenueChartProps {
  data?: RevenueData[]
  currencyCode?: string
  loading?: boolean
}

const MOCK_DATA: Record<Period, RevenueData[]> = {
  '7d': [
    { date: 'Mon', bookingsRevenue: 32000, ordersRevenue: 13000 },
    { date: 'Tue', bookingsRevenue: 44000, ordersRevenue: 18000 },
    { date: 'Wed', bookingsRevenue: 27000, ordersRevenue: 11000 },
    { date: 'Thu', bookingsRevenue: 51000, ordersRevenue: 20000 },
    { date: 'Fri', bookingsRevenue: 63000, ordersRevenue: 26000 },
    { date: 'Sat', bookingsRevenue: 68000, ordersRevenue: 27000 },
    { date: 'Sun', bookingsRevenue: 39000, ordersRevenue: 15000 },
  ],
  '30d': Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}`,
    bookingsRevenue: Math.floor(Math.random() * 55000 + 20000),
    ordersRevenue: Math.floor(Math.random() * 25000 + 10000),
  })),
  '90d': Array.from({ length: 12 }, (_, i) => ({
    date: `W${i + 1}`,
    bookingsRevenue: Math.floor(Math.random() * 350000 + 140000),
    ordersRevenue: Math.floor(Math.random() * 150000 + 60000),
  })),
}

export default function RevenueChart({ data, currencyCode = 'USD', loading }: RevenueChartProps) {
  const [period, setPeriod] = useState<Period>('7d')
  const [chartType, setChartType] = useState<ChartType>('area')

  const chartData = data ?? MOCK_DATA[period]

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-32 h-6 rounded bg-surface-secondary" />
          <div className="flex gap-2">
            <div className="w-10 h-8 rounded-lg bg-surface-secondary" />
            <div className="w-10 h-8 rounded-lg bg-surface-secondary" />
          </div>
        </div>
        <div className="w-full h-64 rounded-xl bg-surface-secondary" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl bg-surface border border-border p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary font-heading">Revenue</h3>
          <p className="text-sm text-text-secondary">Track your earnings over time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-secondary rounded-lg p-0.5">
            {(['area', 'bar'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  chartType === type
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex bg-surface-secondary rounded-lg p-0.5">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
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
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                }}
                formatter={(value?: ValueType, name?: string | number) => [
                  formatCurrency(Number(value ?? 0), currencyCode),
                  String(name) === 'ordersRevenue' ? 'Orders' : 'Bookings',
                ] as [string, string]}
              />
              <Legend
                formatter={(value: string) => (value === 'ordersRevenue' ? 'Orders' : 'Bookings')}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="bookingsRevenue"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#bookingsGrad)"
                stackId="revenue"
              />
              <Area
                type="monotone"
                dataKey="ordersRevenue"
                stroke="#64748B"
                strokeWidth={2}
                fill="url(#ordersGrad)"
                stackId="revenue"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                }}
                formatter={(value?: ValueType, name?: string | number) => [
                  formatCurrency(Number(value ?? 0), currencyCode),
                  String(name) === 'ordersRevenue' ? 'Orders' : 'Bookings',
                ] as [string, string]}
              />
              <Legend
                formatter={(value: string) => (value === 'ordersRevenue' ? 'Orders' : 'Bookings')}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="bookingsRevenue" fill="#F59E0B" radius={[6, 6, 0, 0]} stackId="revenue" />
              <Bar dataKey="ordersRevenue" fill="#64748B" radius={[6, 6, 0, 0]} stackId="revenue" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
