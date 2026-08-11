'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, formatCurrency, timeAgo } from '@/lib/utils'
import type { Dispute, DisputeStatus, Payment } from '@/types'
import {
  Scale, AlertTriangle, CheckCircle, Clock,
  FileText, DollarSign, ChevronDown,
  Send,
} from 'lucide-react'

interface DisputeCardProps {
  dispute: Dispute
  payment?: Payment
  onResolve?: (dispute: Dispute, resolution: 'refund' | 'release' | 'partial', notes: string) => void
}

const STATUS_STYLES: Record<DisputeStatus, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  escalated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'disp_1', paymentId: 'pay_1', raisedBy: 'Alice M.', reason: 'Service not rendered',
    description: 'The vendor charged me but never showed up for the appointment. I waited for 2 hours and they never arrived.',
    evidenceUrls: [], status: 'under_review', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'disp_2', paymentId: 'pay_2', raisedBy: 'Bob K.', reason: 'Product damaged',
    description: 'The item arrived with visible damage to the packaging and the product inside was broken.',
    evidenceUrls: [], status: 'open', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'disp_3', paymentId: 'pay_3', raisedBy: 'Carol D.', reason: 'Incorrect amount charged',
    description: 'I was charged 25,000 XAF but the service was listed at 18,000 XAF.',
    evidenceUrls: [], status: 'escalated', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'disp_4', paymentId: 'pay_4', raisedBy: 'David N.', reason: 'Vendor unresponsive',
    description: 'I paid for the service but the vendor hasnt responded to my messages for 5 days.',
    evidenceUrls: [], status: 'resolved', resolution: 'refund', resolvedBy: 'admin_1',
    resolvedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), updatedAt: new Date().toISOString(),
  },
]

const MOCK_PAYMENTS: Record<string, Payment> = {
  pay_1: { id: 'pay_1', amount: 25000, currencyCode: 'XAF', status: 'completed', method: 'mobile_money', provider: 'M-Pesa', metadata: {}, escrowStatus: 'disputed', fee: 2500, netAmount: 22500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  pay_2: { id: 'pay_2', amount: 45000, currencyCode: 'XAF', status: 'completed', method: 'card', provider: 'Stripe', metadata: {}, escrowStatus: 'disputed', fee: 4500, netAmount: 40500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  pay_3: { id: 'pay_3', amount: 18000, currencyCode: 'XAF', status: 'completed', method: 'mobile_money', provider: 'Paystack', metadata: {}, escrowStatus: 'disputed', fee: 1800, netAmount: 16200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
}

export default function DisputeCard({ dispute: initialDispute, payment: initialPayment, onResolve }: DisputeCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [resolution, setResolution] = useState<'refund' | 'release' | 'partial'>('refund')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const dispute = initialDispute
  const payment = initialPayment ?? MOCK_PAYMENTS[dispute.paymentId]

  const priority = dispute.status === 'escalated' ? 0 : dispute.status === 'open' ? 1 : 2

  const handleResolve = async () => {
    if (!onResolve || !notes.trim()) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    onResolve(dispute, resolution, notes)
    setSubmitting(false)
    setExpanded(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border transition-all duration-200',
        dispute.status === 'escalated'
          ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20'
          : 'bg-surface border-border hover:border-amber-500/20'
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              dispute.status === 'escalated' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            )}>
              <Scale className={cn('w-5 h-5', dispute.status === 'escalated' ? 'text-red-600' : 'text-amber-600 dark:text-amber-400')} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-text-primary text-sm">{dispute.reason}</h4>
                <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[dispute.status])}>
                  {dispute.status.replace('_', ' ')}
                </span>
                {priority === 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle className="w-3 h-3" /> High Priority
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                By <span className="font-medium text-text-secondary">{dispute.raisedBy}</span>
                {' '}&middot; {timeAgo(dispute.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ChevronDown className={cn('w-4 h-4 text-text-tertiary transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>

        {/* Payment info */}
        {payment && (
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="font-medium text-text-primary">{formatCurrency(payment.amount, payment.currencyCode)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-mono">{payment.id.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(dispute.createdAt, 'MMM d')}</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">{dispute.description}</p>

              <div className="p-3 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Timeline</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-text-secondary">Dispute raised {timeAgo(dispute.createdAt)}</span>
                  </div>
                  {dispute.status !== 'open' && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-text-secondary">Under review</span>
                    </div>
                  )}
                  {dispute.resolvedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-text-secondary">Resolved {timeAgo(dispute.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution form */}
              {dispute.status !== 'resolved' && onResolve && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(['refund', 'release', 'partial'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all',
                          resolution === r
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border'
                        )}
                      >
                        {r === 'partial' ? 'Partial Refund' : r === 'release' ? 'Release Funds' : 'Full Refund'}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Resolution notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleResolve}
                    disabled={!notes.trim() || submitting}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Resolution
                  </button>
                </div>
              )}

              {dispute.status === 'resolved' && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Resolved: {dispute.resolution}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function DisputeQueue({ disputes, onResolve }: { disputes?: Dispute[]; onResolve?: DisputeCardProps['onResolve'] }) {
  const items = disputes ?? MOCK_DISPUTES
  const sorted = [...items].sort((a, b) => {
    const order = { escalated: 0, open: 1, under_review: 2, resolved: 3 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className="space-y-3">
      {sorted.map((d, i) => (
        <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <DisputeCard dispute={d} onResolve={onResolve} />
        </motion.div>
      ))}
    </div>
  )
}
