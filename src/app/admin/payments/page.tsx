'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import type { Payment } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import TransactionsTable from '@/components/admin/TransactionsTable'
import {
  CreditCard, DollarSign, TrendingUp, RotateCcw,
  Download, BarChart3, Wallet,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

const FEE_CONFIG = [
  { method: 'Mobile Money', percentage: 2.5, fixed: 100, active: true },
  { method: 'Card', percentage: 3.5, fixed: 200, active: true },
  { method: 'Bank Transfer', percentage: 1.5, fixed: 300, active: true },
  { method: 'Wallet', percentage: 1.0, fixed: 0, active: false },
]

const SETTLEMENT_DATA = [
  { month: 'Jan', settled: 12500000, pending: 2400000 },
  { month: 'Feb', settled: 14200000, pending: 2100000 },
  { month: 'Mar', settled: 16800000, pending: 2800000 },
  { month: 'Apr', settled: 15400000, pending: 2200000 },
  { month: 'May', settled: 18900000, pending: 3100000 },
  { month: 'Jun', settled: 20300000, pending: 2600000 },
]

const PAYMENT_METHOD_DATA = [
  { name: 'Mobile Money', value: 45 },
  { name: 'Card', value: 30 },
  { name: 'Bank Transfer', value: 15 },
  { name: 'Wallet', value: 10 },
]

const COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6']

export default function AdminPaymentsPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleRefund = (payment: Payment) => {
    setToast({ type: 'success', message: `Refund initiated for ${formatCurrency(payment.amount, payment.currencyCode)}` })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Payment Operations</h1>
        <p className="text-sm text-text-secondary mt-1">Manage transactions, refunds, payouts, and fee configuration.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Volume (30d)" value={formatCurrency(732450000, 'XAF')} icon={DollarSign} change={22.4} accent="bg-emerald-500" />
        <AdminStatCard label="Platform Fees" value={formatCurrency(18312000, 'XAF')} icon={TrendingUp} change={18.7} accent="bg-amber-500" />
        <AdminStatCard label="Pending Payouts" value={formatCurrency(8450000, 'XAF')} icon={Wallet} change={-5.2} accent="bg-blue-500" />
        <AdminStatCard label="Refunded (30d)" value={formatCurrency(342000, 'XAF')} icon={RotateCcw} change={12.3} accent="bg-red-500" />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Settlement Reports</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SETTLEMENT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }}
                  formatter={(value: number) => [formatCurrency(value, 'XAF'), '']} />
                <Legend />
                <Bar dataKey="settled" fill="#10B981" radius={[6, 6, 0, 0]} name="Settled" />
                <Bar dataKey="pending" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Payment Methods Split</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PAYMENT_METHOD_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {PAYMENT_METHOD_DATA.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Fee configuration */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary font-heading">Fee Configuration</h3>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEE_CONFIG.map((fee) => (
            <div key={fee.method} className={cn('p-4 rounded-xl border transition-all', fee.active ? 'bg-surface-secondary border-border' : 'bg-surface-secondary/50 border-border/50 opacity-60')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">{fee.method}</span>
                <span className={cn('w-2 h-2 rounded-full', fee.active ? 'bg-emerald-500' : 'bg-text-tertiary')} />
              </div>
              <p className="text-2xl font-bold text-text-primary">{fee.percentage}%</p>
              <p className="text-xs text-text-tertiary mt-1">+ {formatCurrency(fee.fixed, 'XAF')} fixed fee</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Transaction table */}
      <motion.div variants={ITEM}>
        <TransactionsTable onRefund={handleRefund} />
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
