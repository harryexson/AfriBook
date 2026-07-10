'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, formatCurrency, timeAgo } from '@/lib/utils'
import type { Payment, PaymentStatus, PaymentMethod, EscrowStatus } from '@/types'
import {
  Search, ChevronDown, Eye, Download, RotateCcw,
  ExternalLink, Clock, CheckCircle, XCircle, AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react'

type SortField = 'amount' | 'status' | 'method' | 'createdAt'
type SortDir = 'asc' | 'desc'

interface TransactionsTableProps {
  payments?: Payment[]
  loading?: boolean
  onRefund?: (payment: Payment) => void
  onViewDetails?: (payment: Payment) => void
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  partially_refunded: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

const ESCROW_STYLES: Record<EscrowStatus, string> = {
  held: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  released: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  disputed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const MOCK_PAYMENTS: Payment[] = Array.from({ length: 30 }, (_, i) => ({
  id: `pay_${i + 1}`,
  amount: Math.floor(Math.random() * 100000 + 5000),
  currencyCode: 'XAF',
  status: (['completed', 'pending', 'failed', 'processing', 'refunded'] as PaymentStatus[])[i % 5],
  method: (['mobile_money', 'card', 'bank_transfer', 'wallet'] as PaymentMethod[])[i % 4],
  provider: ['Stripe', 'Paystack', 'M-Pesa', 'Flutterwave'][i % 4],
  metadata: {},
  escrowStatus: (['held', 'released', 'refunded', 'disputed'] as EscrowStatus[])[i % 4],
  fee: Math.floor(Math.random() * 5000 + 500),
  netAmount: 0,
  paidAt: i % 3 !== 0 ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() : undefined,
  createdAt: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

export default function TransactionsTable({
  payments, loading, onRefund, onViewDetails,
}: TransactionsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Payment | null>(null)
  const [page, setPage] = useState(0)
  const perPage = 10

  const data = payments ?? MOCK_PAYMENTS

  const filtered = data
    .filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (methodFilter !== 'all' && p.method !== methodFilter) return false
      if (search) return p.id.toLowerCase().includes(search.toLowerCase()) || p.provider.toLowerCase().includes(search.toLowerCase())
      return true
    })
    .sort((a, b) => {
      const cmp = sortField === 'amount' ? a.amount - b.amount : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === 'asc' ? cmp : -cmp
    })

  const paged = filtered.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(f); setSortDir('asc') }
  }

  if (loading) {
    return <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse space-y-4">
      <div className="w-48 h-6 rounded bg-surface-secondary" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-border-light">
          <div className="flex-1"><div className="w-36 h-4 rounded bg-surface-secondary mb-1" /><div className="w-20 h-3 rounded bg-surface-secondary" /></div>
          <div className="w-16 h-6 rounded-full bg-surface-secondary" />
        </div>
      ))}
    </div>
  }

  return (
    <div className="rounded-2xl bg-surface border border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as PaymentStatus | 'all'); setPage(0) }}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value as PaymentMethod | 'all'); setPage(0) }}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">All Methods</option>
            <option value="card">Card</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {(['ID', 'Amount', 'Method', 'Status', 'Escrow', 'Date']).map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">{h}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-text-tertiary">
                <Search className="w-8 h-8 mx-auto mb-2" /><p>No transactions found</p>
              </td></tr>
            ) : (
              paged.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border-light hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary text-xs font-mono">{p.id.slice(0, 12)}...</p>
                    <p className="text-xs text-text-tertiary">{p.provider}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-text-primary">{formatCurrency(p.amount, p.currencyCode)}</p>
                    <p className="text-xs text-text-tertiary">Fee: {formatCurrency(p.fee, p.currencyCode)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-text-secondary">{p.method.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[p.status])}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.escrowStatus && (
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', ESCROW_STYLES[p.escrowStatus])}>
                        {p.escrowStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{timeAgo(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onViewDetails && (
                        <button onClick={(e) => { e.stopPropagation(); onViewDetails(p) }} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      )}
                      {(p.status === 'completed' || p.status === 'pending') && onRefund && (
                        <button onClick={(e) => { e.stopPropagation(); onRefund(p) }} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Refund">
                          <RotateCcw className="w-4 h-4 text-text-tertiary hover:text-amber-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-text-tertiary">{filtered.length} total transactions</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors', page === i ? 'bg-amber-500 text-white' : 'text-text-secondary hover:bg-surface-secondary')}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <motion.div initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
            className="fixed top-0 right-0 bottom-0 w-[380px] z-50 bg-surface border-l border-border overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-text-primary">Transaction Details</h3>
                  <p className="text-xs font-mono text-text-tertiary mt-1">{selected.id}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-surface-secondary">
                  <XCircle className="w-5 h-5 text-text-tertiary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
                  <div>
                    <p className="text-xs text-text-tertiary">Amount</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(selected.amount, selected.currencyCode)}</p>
                  </div>
                  <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize', STATUS_STYLES[selected.status])}>
                    {selected.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">Method</p>
                    <p className="text-sm font-medium text-text-primary capitalize">{selected.method.replace('_', ' ')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">Provider</p>
                    <p className="text-sm font-medium text-text-primary">{selected.provider}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-secondary">
                  <p className="text-xs text-text-tertiary mb-1">Fee Breakdown</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Platform Fee</span>
                    <span className="text-text-primary font-medium">{formatCurrency(selected.fee, selected.currencyCode)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-text-secondary">Net Amount</span>
                    <span className="text-text-primary font-medium">{formatCurrency(selected.amount - selected.fee, selected.currencyCode)}</span>
                  </div>
                </div>

                {selected.escrowStatus && (
                  <div className="p-3 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-tertiary mb-1">Escrow Status</p>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', ESCROW_STYLES[selected.escrowStatus])}>
                      {selected.escrowStatus}
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-surface-secondary">
                  <p className="text-xs text-text-tertiary">Created</p>
                  <p className="text-sm text-text-primary">{formatDate(selected.createdAt, 'PPP p')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                {(selected.status === 'completed' || selected.status === 'pending') && onRefund && (
                  <button onClick={() => { onRefund(selected); setSelected(null) }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Process Refund
                  </button>
                )}
                {onViewDetails && (
                  <button onClick={() => { onViewDetails(selected); setSelected(null) }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary font-medium text-sm hover:bg-surface-tertiary transition-colors">
                    <ExternalLink className="w-4 h-4" /> View in Provider
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
