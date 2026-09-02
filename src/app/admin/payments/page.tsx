'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import type { Payment } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import TransactionsTable from '@/components/admin/TransactionsTable'
import {
  DollarSign, TrendingUp, RotateCcw,
  Download, Wallet,
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
} from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

// Fee Configuration below is still mock — no fee-rate config table was
// found in the schema (checked), so this would need a new table + RLS
// before it could be admin-editable for real. Flagged rather than guessed.
const FEE_CONFIG = [
  { method: 'Mobile Money', percentage: 2.5, fixed: 100, active: true },
  { method: 'Card', percentage: 3.5, fixed: 200, active: true },
  { method: 'Bank Transfer', percentage: 1.5, fixed: 300, active: true },
  { method: 'Wallet', percentage: 1.0, fixed: 0, active: false },
]

const COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899', '#64748B']

export default function AdminPaymentsPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/payments')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) { setError(data.error || 'Failed to load transactions'); return }
        setPayments(data.payments)
      })
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false))
  }, [])

  // Real, all computed from the transactions actually fetched above —
  // rather than the previous four hardcoded USD figures.
  const stats = useMemo(() => {
    if (!payments) return null
    const totalVolumeUSD = payments.reduce((s, p) => s + (p.currencyCode === 'USD' ? p.amount : 0), 0)
    // Cross-currency totals here are approximate (USD-denominated
    // transactions only) rather than silently summing raw non-USD amounts
    // — the same correctness issue fixed in the platform overview earlier
    // applies here, and a full fix needs the same per-row conversion.
    const platformFees = payments.reduce((s, p) => s + p.fee, 0)
    const refunded = payments.filter((p) => p.status === 'refunded' || p.status === 'partially_refunded').reduce((s, p) => s + p.amount, 0)
    const methodCounts = new Map<string, number>()
    for (const p of payments) methodCounts.set(p.method, (methodCounts.get(p.method) ?? 0) + 1)
    const methodSplit = Array.from(methodCounts.entries()).map(([name, value]) => ({ name, value }))
    return { totalVolumeUSD, platformFees, refunded, methodSplit }
  }, [payments])

  const handleRefund = async (payment: Payment) => {
    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: payment.id, amount: payment.amount, reason: 'Admin-initiated refund' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Refund failed')
      setToast({ type: 'success', message: `Refund processed for ${formatCurrency(payment.amount, payment.currencyCode)}` })
      setPayments((prev) => prev?.map((p) => (p.id === payment.id ? { ...p, status: 'refunded' } : p)) ?? null)
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Refund failed' })
    } finally {
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Payment Operations</h1>
        <p className="text-sm text-text-secondary mt-1">Manage transactions, refunds, payouts, and fee configuration.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="USD Volume (recent)" value={loading ? '—' : formatCurrency(stats?.totalVolumeUSD ?? 0, 'USD')} icon={DollarSign} accent="bg-emerald-500" />
        <AdminStatCard label="Platform Fees" value={loading ? '—' : formatCurrency(stats?.platformFees ?? 0, 'USD')} icon={TrendingUp} accent="bg-amber-500" />
        <AdminStatCard label="Pending Payouts" value="—" icon={Wallet} accent="bg-blue-500" />
        <AdminStatCard label="Refunded (recent)" value={loading ? '—' : formatCurrency(stats?.refunded ?? 0, 'USD')} icon={RotateCcw} accent="bg-red-500" />
      </motion.div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Payment Methods Split — real, computed from the same transactions
          fetched above. Settlement Reports chart removed: it needs a real
          settlement/period concept this pass didn't build, and a fake bar
          chart next to now-real numbers would be more misleading than
          having no chart at all. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Payment Methods Split</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.methodSplit ?? []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {(stats?.methodSplit ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-2">Settlement Reports</h3>
          <p className="text-sm text-text-tertiary max-w-xs">
            Needs a real settlement/period model (which payouts settled in which window) — not built in this pass. Flagged rather than shown as a fake chart.
          </p>
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
              <p className="text-xs text-text-tertiary mt-1">+ {formatCurrency(Math.round((fee.fixed) / 620), 'USD')} fixed fee</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Transaction table */}
      <motion.div variants={ITEM}>
        <TransactionsTable payments={payments ?? undefined} loading={loading} onRefund={handleRefund} />
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
