'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, ArrowUpRight, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { Payout, PayoutStatus } from '@/types'

interface PayoutHistoryProps {
  payouts?: Payout[]
  loading?: boolean
}

const STATUS_CONFIG: Record<PayoutStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-blue-600' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-red-600' },
}

const MOCK_PAYOUTS: Payout[] = [
  { id: 'p1', vendorId: 'v1', amount: 250000, currencyCode: 'XAF', status: 'completed', paymentMethod: 'bank_transfer', periodStart: '2025-06-01', periodEnd: '2025-06-07', fee: 12500, netAmount: 237500, processedAt: '2025-06-08T10:00:00Z', createdAt: '2025-06-07T23:59:59Z', updatedAt: '2025-06-08T10:00:00Z' },
  { id: 'p2', vendorId: 'v1', amount: 180000, currencyCode: 'XAF', status: 'completed', paymentMethod: 'mobile_money', periodStart: '2025-06-08', periodEnd: '2025-06-14', fee: 9000, netAmount: 171000, processedAt: '2025-06-15T10:00:00Z', createdAt: '2025-06-14T23:59:59Z', updatedAt: '2025-06-15T10:00:00Z' },
  { id: 'p3', vendorId: 'v1', amount: 320000, currencyCode: 'XAF', status: 'processing', paymentMethod: 'bank_transfer', periodStart: '2025-06-15', periodEnd: '2025-06-21', fee: 16000, netAmount: 304000, createdAt: '2025-06-21T23:59:59Z', updatedAt: '2025-06-22T10:00:00Z' },
]

export default function PayoutHistory({ payouts: payoutsProp, loading }: PayoutHistoryProps) {
  const payouts = payoutsProp ?? MOCK_PAYOUTS

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse">
        <div className="w-40 h-6 rounded bg-surface-secondary mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-border-light">
            <div className="w-10 h-10 rounded-full bg-surface-secondary" />
            <div className="flex-1"><div className="w-32 h-4 rounded bg-surface-secondary" /></div>
            <div className="w-20 h-6 rounded bg-surface-secondary" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl bg-surface border border-border overflow-hidden"
    >
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary font-heading">Payout History</h3>
        <button className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {payouts.length === 0 ? (
        <div className="text-center py-12">
          <ArrowUpRight className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No payouts yet</p>
          <p className="text-sm text-text-tertiary mt-1">Your payout history will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border-light">
          {payouts.map((payout, i) => {
            const status = STATUS_CONFIG[payout.status]
            const StatusIcon = status.icon
            return (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 px-6 hover:bg-surface-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <StatusIcon className={cn('w-5 h-5', status.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    Payout #{payout.id.slice(-4)}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {formatDate(payout.periodStart, 'MMM d')} - {formatDate(payout.periodEnd, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(payout.netAmount, payout.currencyCode)}</p>
                  <p className="text-xs text-text-tertiary">Fee: {formatCurrency(payout.fee, payout.currencyCode)}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', status.color.replace('text-', 'text-').replace('bg-', 'bg-'))}>
                  {status.label}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
