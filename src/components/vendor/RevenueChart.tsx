'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar,
} from 'recharts'
import type { TooltipValueType as ValueType } from 'recharts'

type Period = '7d' | '30d' | '90d'
type ChartType = 'area' | 'bar'

interface RevenueData {
  date: string
  revenue: number
  bookings?: number
  orders?: number
}

interface RevenueChartProps {
  data?: RevenueData[]
  currencyCode?: string
  loading?: boolean
}

const MOCK_DATA: Record<Period, RevenueData[]> = {
  '7d': [
    { date: 'Mon', revenue: 45000, bookings: 12, orders: 8 },
    { date: 'Tue', revenue: 62000, bookings: 18, orders: 11 },
    { date: 'Wed', revenue: 38000, bookings: 9, orders: 7 },
    { date: 'Thu', revenue: 71000, bookings: 22, orders: 14 },
    { date: 'Fri', revenue: 89000, bookings: 28, orders: 19 },
    { date: 'Sat', revenue: 95000, bookings: 32, orders: 24 },
    { date: 'Sun', revenue: 54000, bookings: 15, orders: 10 },
  ],
  '30d': Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}`,
    revenue: Math.floor(Math.random() * 80000 + 30000),
    bookings: Math.floor(Math.random() * 25 + 5),
    orders: Math.floor(Math.random() * 18 + 3),
  })),
  '90d': Array.from({ length: 12 }, (_, i) => ({
    date: `W${i + 1}`,
    revenue: Math.floor(Math.random() * 500000 + 200000),
    bookings: Math.floor(Math.random() * 150 + 40),
    orders: Math.floor(Math.random() * 100 + 20),
  })),
}

export default function RevenueChart({ data, currencyCode = 'XAF', loading }: RevenueChartProps) {
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
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
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
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), currencyCode), 'Revenue'] as [string, string]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
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
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), currencyCode), 'Revenue'] as [string, string]}
              />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
