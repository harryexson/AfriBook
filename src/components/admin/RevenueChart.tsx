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

type Period = '7d' | '30d' | '90d' | '1y'
type ChartType = 'area' | 'bar'

interface RevenueChartProps {
  data?: { date: string; revenue: number; fees: number; volume: number }[]
  currencyCode?: string
  loading?: boolean
  title?: string
}

const MOCK_DATA: Record<Period, { date: string; revenue: number; fees: number; volume: number }[]> = {
  '7d': [
    { date: 'Mon', revenue: 125000, fees: 12500, volume: 1250000 },
    { date: 'Tue', revenue: 182000, fees: 18200, volume: 1820000 },
    { date: 'Wed', revenue: 98000, fees: 9800, volume: 980000 },
    { date: 'Thu', revenue: 211000, fees: 21100, volume: 2110000 },
    { date: 'Fri', revenue: 289000, fees: 28900, volume: 2890000 },
    { date: 'Sat', revenue: 345000, fees: 34500, volume: 3450000 },
    { date: 'Sun', revenue: 154000, fees: 15400, volume: 1540000 },
  ],
  '30d': Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    revenue: Math.floor(Math.random() * 200000 + 80000),
    fees: Math.floor(Math.random() * 20000 + 8000),
    volume: Math.floor(Math.random() * 2000000 + 800000),
  })),
  '90d': Array.from({ length: 12 }, (_, i) => ({
    date: `W${i + 1}`,
    revenue: Math.floor(Math.random() * 1200000 + 400000),
    fees: Math.floor(Math.random() * 120000 + 40000),
    volume: Math.floor(Math.random() * 12000000 + 4000000),
  })),
  '1y': Array.from({ length: 12 }, (_, i) => ({
    date: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    revenue: Math.floor(Math.random() * 3000000 + 1000000),
    fees: Math.floor(Math.random() * 300000 + 100000),
    volume: Math.floor(Math.random() * 30000000 + 10000000),
  })),
}

export default function RevenueChart({ data, currencyCode = 'XAF', loading, title = 'Platform Revenue' }: RevenueChartProps) {
  const [period, setPeriod] = useState<Period>('30d')
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
        <div className="w-full h-72 rounded-xl bg-surface-secondary" />
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
          <h3 className="text-lg font-semibold text-text-primary font-heading">{title}</h3>
          <p className="text-sm text-text-secondary">Platform fees collected over time</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
            {(['7d', '30d', '90d', '1y'] as Period[]).map((p) => (
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

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="adminRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adminFeesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType, name?: unknown) => [formatCurrency(Number(value ?? 0), currencyCode), String(name) === 'revenue' ? 'Revenue' : 'Volume'] as [string, string]}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} fill="url(#adminRevenueGrad)" name="Revenue" />
              <Area type="monotone" dataKey="volume" stroke="#8B5CF6" strokeWidth={2} fill="url(#adminFeesGrad)" name="Volume" />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                formatter={(value?: ValueType) => [formatCurrency(Number(value ?? 0), currencyCode), 'Revenue'] as [string, string]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Revenue" />
              <Bar dataKey="fees" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Fees" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
