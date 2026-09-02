'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  DollarSign, RotateCcw, CreditCard, Download,
  Filter, Search, ChevronDown, CheckCircle, Clock, XCircle,
  Building2, Check, X, Shield, Send,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string | null
  customer_email: string | null
  business: { name: string } | null
  currency_code: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: InvoiceStatus
  issued_at: string
  created_at: string
}

interface Settlement {
  id: string
  businessName: string
  businessId: string
  amount: number
  currency: string
  payoutMethod: string
  pendingSince: string
  txCount: number
  status: 'pending' | 'approved' | 'held' | 'rejected'
}

const STATUS_STYLES: Record<InvoiceStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  draft: { bg: 'bg-surface-secondary text-text-secondary', text: 'text-text-secondary', icon: Clock },
  sent: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', text: 'text-blue-700 dark:text-blue-400', icon: Send },
  paid: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  overdue: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', text: 'text-red-700 dark:text-red-400', icon: XCircle },
  void: { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400', text: 'text-slate-600 dark:text-slate-400', icon: X },
}

const SETTLEMENTS: Settlement[] = [
  { id: 'STL-001', businessName: 'Lagos Fashion Week', businessId: 'BIZ-001', amount: 2450000, currency: 'XAF', payoutMethod: 'Bank Transfer (GTBank)', pendingSince: '2026-07-10T00:00:00Z', txCount: 145, status: 'pending' },
  { id: 'STL-002', businessName: 'Accra Food Festival', businessId: 'BIZ-002', amount: 875000, currency: 'GHS', payoutMethod: 'Mobile Money (MTN)', pendingSince: '2026-07-09T00:00:00Z', txCount: 82, status: 'pending' },
  { id: 'STL-003', businessName: 'Nairobi Tech Summit', businessId: 'BIZ-003', amount: 3120000, currency: 'KES', payoutMethod: 'Bank Transfer (Equity)', pendingSince: '2026-07-08T00:00:00Z', txCount: 210, status: 'pending' },
  { id: 'STL-004', businessName: 'Kigali Tech Meetup', businessId: 'BIZ-004', amount: 1580000, currency: 'RWF', payoutMethod: 'Mobile Money (MTN)', pendingSince: '2026-07-07T00:00:00Z', txCount: 64, status: 'held' },
  { id: 'STL-005', businessName: 'Dakar Afrobeat Night', businessId: 'BIZ-005', amount: 4200000, currency: 'XOF', payoutMethod: 'Bank Transfer (BCEAO)', pendingSince: '2026-07-11T00:00:00Z', txCount: 178, status: 'pending' },
]

export default function AdminBillingPage() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invoices?limit=500')
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to load invoices')
      setInvoices(body.data ?? [])
      setLoadError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load invoices'
      setLoadError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const filteredTransactions = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          (inv.customer_name ?? '').toLowerCase().includes(q) ||
          (inv.business?.name ?? '').toLowerCase().includes(q) ||
          inv.invoice_number.toLowerCase().includes(q) ||
          (inv.customer_email ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [invoices, statusFilter, searchQuery])

  const revenueThisMonth = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0)
  const pendingSettlements = SETTLEMENTS.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0)
  const refundRequests = invoices.filter((inv) => inv.status === 'void').length
  const avgTransaction = invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to update invoice')
      showToast(`Invoice marked as ${status}`)
      loadInvoices()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update invoice', 'error')
    }
  }

  const handleSettlement = (settlementId: string, action: 'approve' | 'hold' | 'reject') => {
    const settlement = SETTLEMENTS.find((s) => s.id === settlementId)
    if (!settlement) return
    if (action === 'approve') showToast(`Settlement for ${settlement.businessName} approved — payout initiated`)
    else if (action === 'hold') showToast(`Settlement for ${settlement.businessName} placed on hold`, 'error')
    else showToast(`Settlement for ${settlement.businessName} rejected`, 'error')
  }

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Customer', 'Business', 'Amount', 'Fee', 'Net', 'Status']
    const rows = filteredTransactions.map((inv) => [
      inv.invoice_number,
      new Date(inv.issued_at).toISOString(),
      inv.customer_name,
      inv.business?.name,
      inv.total,
      inv.tax,
      inv.total - inv.tax,
      inv.status,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported successfully')
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Billing & Invoices</h1>
        <p className="text-sm text-text-secondary mt-1">Manage transactions, settlements, and payment processing.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Revenue This Month" value={formatCurrency(Math.round((revenueThisMonth) / 620), 'USD')} icon={DollarSign} change={14.2} changeLabel="vs last month" accent="bg-emerald-500" loading={loading} />
        <AdminStatCard label="Pending Settlements" value={formatCurrency(Math.round((pendingSettlements) / 620), 'USD')} icon={Clock} change={-8.5} changeLabel="vs last month" accent="bg-amber-500" loading={loading} />
        <AdminStatCard label="Refund Requests" value={refundRequests.toString()} icon={RotateCcw} change={-12.3} changeLabel="vs last month" accent="bg-red-500" loading={loading} />
        <AdminStatCard label="Avg Transaction" value={formatCurrency(Math.round((avgTransaction) / 620), 'USD')} icon={CreditCard} change={6.8} changeLabel="vs last month" accent="bg-purple-500" loading={loading} />
      </motion.div>

      {/* Transactions */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary font-heading">Transactions</h3>
              <p className="text-sm text-text-secondary mt-0.5">{filteredTransactions.length} transactions found</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                  showFilters
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
                )}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="Search by customer, business, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Status filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                      className="appearance-none px-3 py-2 pr-8 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="void">Void</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loadError && (
          <div className="px-4 py-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border-b border-border">
            {loadError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Business</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Amount</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Fee</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Net</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Status</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredTransactions.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border-light">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-surface-secondary animate-pulse" />
                      </td>
                    </tr>
                  ))
                : filteredTransactions.map((inv) => {
                    const style = STATUS_STYLES[inv.status]
                    const StatusIcon = style.icon
                    return (
                      <tr key={inv.id} className="border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-secondary font-mono">{inv.invoice_number}</span>
                          <br />
                          <span className="text-[11px] text-text-tertiary">
                            {new Date(inv.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-text-primary">{inv.customer_name ?? '—'}</span>
                          <br />
                          <span className="text-[11px] text-text-tertiary">{inv.customer_email ?? ''}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-text-secondary">{inv.business?.name ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-text-primary">{formatCurrency(inv.total, inv.currency_code)}</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(inv.tax, inv.currency_code)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(inv.total - inv.tax, inv.currency_code)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', style.bg, style.text)}>
                            <StatusIcon className="w-3 h-3" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {(inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue') && (
                              <>
                                <button
                                  onClick={() => updateInvoiceStatus(inv.id, 'paid')}
                                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors"
                                  title="Mark as paid"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                {inv.status === 'draft' && (
                                  <button
                                    onClick={() => updateInvoiceStatus(inv.id, 'sent')}
                                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                                    title="Mark as sent"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => updateInvoiceStatus(inv.id, 'void')}
                                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                                  title="Void invoice"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(inv.status === 'paid' || inv.status === 'void') && (
                              <span className="text-xs text-text-tertiary">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {!loading && filteredTransactions.length === 0 && (
          <div className="p-12 text-center">
            <Search className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No transactions match your filters</p>
          </div>
        )}
      </motion.div>

      {/* Settlement management */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary font-heading">Pending Settlements</h3>
              <p className="text-sm text-text-secondary mt-0.5">{SETTLEMENTS.filter((s) => s.status === 'pending').length} settlements awaiting action</p>
            </div>
            <Shield className="w-5 h-5 text-text-tertiary" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Business</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Amount</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Transactions</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Payout Method</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Pending Since</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Status</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {SETTLEMENTS.map((s) => (
                <tr key={s.id} className="border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-primary">{s.businessName}</span>
                        <br />
                        <span className="text-[11px] text-text-tertiary">{s.businessId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatCurrency(s.amount, s.currency)}</td>
                  <td className="px-4 py-3 text-center text-text-secondary">{s.txCount}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{s.payoutMethod}</td>
                  <td className="px-4 py-3 text-xs text-text-tertiary">
                    {new Date(s.pendingSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                      s.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      s.status === 'held' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      s.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {s.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleSettlement(s.id, 'approve')}
                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSettlement(s.id, 'hold')}
                            className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 transition-colors"
                            title="Hold"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSettlement(s.id, 'reject')}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {s.status !== 'pending' && (
                        <span className="text-xs text-text-tertiary">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
