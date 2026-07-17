'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Dispute } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import { DisputeQueue } from '@/components/admin/DisputeCard'
import {
  Scale, AlertTriangle, CheckCircle, Clock,
  BarChart3, TrendingUp, ArrowUpDown,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import type { TooltipValueType as ValueType } from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

const DISPUTE_STATS = [
  { reason: 'Service not rendered', count: 28, trend: '+12%' },
  { reason: 'Product damaged', count: 15, trend: '+5%' },
  { reason: 'Incorrect charge', count: 12, trend: '-3%' },
  { reason: 'Vendor unresponsive', count: 9, trend: '+8%' },
  { reason: 'Quality dispute', count: 7, trend: '-2%' },
]

const RESOLUTION_TIME = [
  { month: 'Jan', avgHours: 48 },
  { month: 'Feb', avgHours: 42 },
  { month: 'Mar', avgHours: 36 },
  { month: 'Apr', avgHours: 31 },
  { month: 'May', avgHours: 28 },
  { month: 'Jun', avgHours: 24 },
]

export default function AdminDisputesPage() {
  const [toast, setToast] = useState<{ type: 'success'; message: string } | null>(null)

  const handleResolve = async (dispute: Dispute, resolution: 'refund' | 'release' | 'partial', notes: string) => {
    setToast({ type: 'success', message: `Dispute ${dispute.id} resolved: ${resolution}` })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Dispute Resolution</h1>
        <p className="text-sm text-text-secondary mt-1">Review and resolve platform disputes between customers and vendors.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Open Disputes" value="18" icon={AlertTriangle} change={8.5} accent="bg-red-500" />
        <AdminStatCard label="Under Review" value="12" icon={Clock} change={-3.2} accent="bg-amber-500" />
        <AdminStatCard label="Escalated" value="4" icon={ArrowUpDown} change={50} accent="bg-purple-500" />
        <AdminStatCard label="Resolved This Month" value="42" icon={CheckCircle} change={15.3} accent="bg-emerald-500" />
      </motion.div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Dispute Categories</h3>
          <div className="space-y-3">
            {DISPUTE_STATS.map((s) => (
              <div key={s.reason} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-3">
                  <Scale className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-primary">{s.reason}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text-primary">{s.count}</span>
                  <span className={cn(
                    'text-xs font-medium',
                    s.trend.startsWith('+') ? 'text-red-500' : 'text-emerald-500'
                  )}>
                    {s.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Avg Resolution Time</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RESOLUTION_TIME}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                  formatter={(value?: ValueType) => [`${Number(value ?? 0)}h`, 'Avg Time'] as [string, string]}
                />
                <Bar dataKey="avgHours" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Dispute queue */}
      <motion.div variants={ITEM}>
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Dispute Queue</h3>
        <DisputeQueue onResolve={handleResolve} />
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-emerald-500 text-white"
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
