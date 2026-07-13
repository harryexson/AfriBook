'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  DollarSign, TrendingUp, RotateCcw, CreditCard, Download,
  Filter, Search, ChevronDown, CheckCircle, Clock, XCircle,
  AlertTriangle, Building2, ArrowUpRight, ArrowDownRight, Eye,
  Check, X, Shield,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type TxStatus = 'completed' | 'pending' | 'refunded' | 'failed'
type PaymentMethod = 'stripe' | 'paystack' | 'flutterwave' | 'mpesa' | 'razorpay'

interface Transaction {
  id: string
  date: string
  customer: string
  customerEmail: string
  business: string
  amount: number
  fee: number
  net: number
  currency: string
  status: TxStatus
  paymentMethod: PaymentMethod
  eventId?: string
  eventName?: string
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

const STATUS_STYLES: Record<TxStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
  completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
  refunded: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: RotateCcw },
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
}

const METHOD_LABELS: Record<PaymentMethod, { label: string; color: string }> = {
  stripe: { label: 'Stripe', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  paystack: { label: 'Paystack', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  flutterwave: { label: 'Flutterwave', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  mpesa: { label: 'M-Pesa', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  razorpay: { label: 'Razorpay', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
}

const TRANSACTIONS: Transaction[] = [
  { id: 'TXN-7842', date: '2026-07-12T16:45:00Z', customer: 'Amara Okafor', customerEmail: 'amara@example.com', business: 'Lagos Fashion Week', amount: 45000, fee: 2250, net: 42750, currency: 'XAF', status: 'completed', paymentMethod: 'paystack', eventId: 'EVT-001', eventName: 'Lagos Fashion Week 2026' },
  { id: 'TXN-7841', date: '2026-07-12T15:20:00Z', customer: 'Kwame Mensah', customerEmail: 'kwame@example.com', business: 'Accra Food Festival', amount: 12500, fee: 625, net: 11875, currency: 'XAF', status: 'completed', paymentMethod: 'flutterwave', eventId: 'EVT-002', eventName: 'Accra Food Festival' },
  { id: 'TXN-7840', date: '2026-07-12T14:10:00Z', customer: 'Fatima Hassan', customerEmail: 'fatima@example.com', business: 'Nairobi Tech Summit', amount: 89000, fee: 4450, net: 84550, currency: 'XAF', status: 'completed', paymentMethod: 'stripe', eventId: 'EVT-003', eventName: 'Nairobi Tech Summit' },
  { id: 'TXN-7839', date: '2026-07-12T12:30:00Z', customer: 'Thabo Molefe', customerEmail: 'thabo@example.com', business: 'Joburg Jazz Night', amount: 6500, fee: 325, net: 6175, currency: 'ZAR', status: 'completed', paymentMethod: 'mpesa', eventId: 'EVT-004', eventName: 'Joburg Jazz Night' },
  { id: 'TXN-7838', date: '2026-07-12T11:05:00Z', customer: 'Ngozi Eze', customerEmail: 'ngozi@example.com', business: 'Abuja Business Expo', amount: 32000, fee: 1600, net: 30400, currency: 'XAF', status: 'pending', paymentMethod: 'paystack', eventId: 'EVT-005', eventName: 'Abuja Business Expo' },
  { id: 'TXN-7837', date: '2026-07-12T09:45:00Z', customer: 'Aisha Juma', customerEmail: 'aisha@example.com', business: 'Dar Art Exhibition', amount: 18000, fee: 900, net: 17100, currency: 'TZS', status: 'completed', paymentMethod: 'mpesa', eventId: 'EVT-006', eventName: 'Dar Art Exhibition' },
  { id: 'TXN-7836', date: '2026-07-11T20:15:00Z', customer: 'Chidi Okonkwo', customerEmail: 'chidi@example.com', business: 'Enugu Music Festival', amount: 25000, fee: 1250, net: 23750, currency: 'NGN', status: 'refunded', paymentMethod: 'flutterwave', eventId: 'EVT-007', eventName: 'Enugu Music Festival' },
  { id: 'TXN-7835', date: '2026-07-11T18:30:00Z', customer: 'Lila Abdi', customerEmail: 'lila@example.com', business: 'Kigali Tech Meetup', amount: 42000, fee: 2100, net: 39900, currency: 'RWF', status: 'completed', paymentMethod: 'stripe', eventId: 'EVT-008', eventName: 'Kigali Tech Meetup' },
  { id: 'TXN-7834', date: '2026-07-11T16:00:00Z', customer: 'Samuel Otieno', customerEmail: 'samuel@example.com', business: 'Mombasa Beach Party', amount: 8500, fee: 425, net: 8075, currency: 'KES', status: 'failed', paymentMethod: 'mpesa', eventId: 'EVT-009', eventName: 'Mombasa Beach Party' },
  { id: 'TXN-7833', date: '2026-07-11T14:20:00Z', customer: 'Grace Nakamoga', customerEmail: 'grace@example.com', business: 'Kampala Craft Fair', amount: 15000, fee: 750, net: 14250, currency: 'UGX', status: 'completed', paymentMethod: 'razorpay', eventId: 'EVT-010', eventName: 'Kampala Craft Fair' },
  { id: 'TXN-7832', date: '2026-07-11T12:00:00Z', customer: 'David Kamau', customerEmail: 'david@example.com', business: 'Nairobi Fashion Week', amount: 55000, fee: 2750, net: 52250, currency: 'KES', status: 'completed', paymentMethod: 'paystack', eventId: 'EVT-011', eventName: 'Nairobi Fashion Week' },
  { id: 'TXN-7831', date: '2026-07-11T10:30:00Z', customer: 'Youssef Benali', customerEmail: 'youssef@example.com', business: 'Casablanca Music Fest', amount: 78000, fee: 3900, net: 74100, currency: 'MAD', status: 'completed', paymentMethod: 'stripe', eventId: 'EVT-012', eventName: 'Casablanca Music Fest' },
  { id: 'TXN-7830', date: '2026-07-11T08:15:00Z', customer: 'Precious Adeyemi', customerEmail: 'precious@example.com', business: 'Lagos Tech Hub', amount: 9500, fee: 475, net: 9025, currency: 'NGN', status: 'pending', paymentMethod: 'flutterwave', eventId: 'EVT-013', eventName: 'Lagos Tech Hub Launch' },
  { id: 'TXN-7829', date: '2026-07-10T21:00:00Z', customer: 'Emmanuel Asante', customerEmail: 'emmanuel@example.com', business: 'Accra Wine Tasting', amount: 3500, fee: 175, net: 3325, currency: 'GHS', status: 'completed', paymentMethod: 'mpesa', eventId: 'EVT-014', eventName: 'Accra Wine Tasting' },
  { id: 'TXN-7828', date: '2026-07-10T18:45:00Z', customer: 'Zainab Mohammed', customerEmail: 'zainab@example.com', business: 'Kano Cultural Gala', amount: 42000, fee: 2100, net: 39900, currency: 'NGN', status: 'completed', paymentMethod: 'paystack', eventId: 'EVT-015', eventName: 'Kano Cultural Gala' },
  { id: 'TXN-7827', date: '2026-07-10T16:30:00Z', customer: 'Lucien Mugisha', customerEmail: 'lucien@example.com', business: 'Kigali Comedy Show', amount: 12000, fee: 600, net: 11400, currency: 'RWF', status: 'refunded', paymentMethod: 'razorpay', eventId: 'EVT-016', eventName: 'Kigali Comedy Show' },
  { id: 'TXN-7826', date: '2026-07-10T14:00:00Z', customer: 'Amina Diallo', customerEmail: 'amina@example.com', business: 'Dakar Afrobeat Night', amount: 65000, fee: 3250, net: 61750, currency: 'XOF', status: 'completed', paymentMethod: 'stripe', eventId: 'EVT-017', eventName: 'Dakar Afrobeat Night' },
  { id: 'TXN-7825', date: '2026-07-10T11:15:00Z', customer: 'Tendai Chirawa', customerEmail: 'tendai@example.com', business: 'Harare Arts Festival', amount: 28000, fee: 1400, net: 26600, currency: 'USD', status: 'completed', paymentMethod: 'flutterwave', eventId: 'EVT-018', eventName: 'Harare Arts Festival' },
  { id: 'TXN-7824', date: '2026-07-10T09:00:00Z', customer: 'Sade Williams', customerEmail: 'sade@example.com', business: 'Lagos Jazz Festival', amount: 95000, fee: 4750, net: 90250, currency: 'NGN', status: 'completed', paymentMethod: 'paystack', eventId: 'EVT-019', eventName: 'Lagos Jazz Festival' },
  { id: 'TXN-7823', date: '2026-07-09T22:30:00Z', customer: 'Ibrahim Traore', customerEmail: 'ibrahim@example.com', business: 'Abidjan Film Premiere', amount: 18500, fee: 925, net: 17575, currency: 'XOF', status: 'failed', paymentMethod: 'mpesa', eventId: 'EVT-020', eventName: 'Abidjan Film Premiere' },
  { id: 'TXN-7822', date: '2026-07-09T19:00:00Z', customer: 'Olivia Njoroge', customerEmail: 'olivia@example.com', business: 'Nairobi Food & Wine', amount: 38000, fee: 1900, net: 36100, currency: 'KES', status: 'completed', paymentMethod: 'razorpay', eventId: 'EVT-021', eventName: 'Nairobi Food & Wine' },
  { id: 'TXN-7821', date: '2026-07-09T15:45:00Z', customer: 'Mohamed El-Sayed', customerEmail: 'mohamed@example.com', business: 'Cairo Startup Week', amount: 72000, fee: 3600, net: 68400, currency: 'EGP', status: 'completed', paymentMethod: 'stripe', eventId: 'EVT-022', eventName: 'Cairo Startup Week' },
  { id: 'TXN-7820', date: '2026-07-09T12:00:00Z', customer: 'Awa Ndiaye', customerEmail: 'awa@example.com', business: 'Dakar Fashion Gala', amount: 22000, fee: 1100, net: 20900, currency: 'XOF', status: 'pending', paymentMethod: 'flutterwave', eventId: 'EVT-023', eventName: 'Dakar Fashion Gala' },
]

const SETTLEMENTS: Settlement[] = [
  { id: 'STL-001', businessName: 'Lagos Fashion Week', businessId: 'BIZ-001', amount: 2450000, currency: 'XAF', payoutMethod: 'Bank Transfer (GTBank)', pendingSince: '2026-07-10T00:00:00Z', txCount: 145, status: 'pending' },
  { id: 'STL-002', businessName: 'Accra Food Festival', businessId: 'BIZ-002', amount: 875000, currency: 'GHS', payoutMethod: 'Mobile Money (MTN)', pendingSince: '2026-07-09T00:00:00Z', txCount: 82, status: 'pending' },
  { id: 'STL-003', businessName: 'Nairobi Tech Summit', businessId: 'BIZ-003', amount: 3120000, currency: 'KES', payoutMethod: 'Bank Transfer (Equity)', pendingSince: '2026-07-08T00:00:00Z', txCount: 210, status: 'pending' },
  { id: 'STL-004', businessName: 'Kigali Tech Meetup', businessId: 'BIZ-004', amount: 1580000, currency: 'RWF', payoutMethod: 'Mobile Money (MTN)', pendingSince: '2026-07-07T00:00:00Z', txCount: 64, status: 'held' },
  { id: 'STL-005', businessName: 'Dakar Afrobeat Night', businessId: 'BIZ-005', amount: 4200000, currency: 'XOF', payoutMethod: 'Bank Transfer (BCEAO)', pendingSince: '2026-07-11T00:00:00Z', txCount: 178, status: 'pending' },
]

export default function AdminBillingPage() {
  const [statusFilter, setStatusFilter] = useState<TxStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filteredTransactions = useMemo(() => {
    return TRANSACTIONS.filter((tx) => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false
      if (methodFilter !== 'all' && tx.paymentMethod !== methodFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          tx.customer.toLowerCase().includes(q) ||
          tx.business.toLowerCase().includes(q) ||
          tx.id.toLowerCase().includes(q) ||
          tx.customerEmail.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [statusFilter, methodFilter, searchQuery])

  const revenueThisMonth = TRANSACTIONS.filter((tx) => tx.status === 'completed').reduce((sum, tx) => sum + tx.fee, 0)
  const pendingSettlements = SETTLEMENTS.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0)
  const refundRequests = TRANSACTIONS.filter((tx) => tx.status === 'refunded').length
  const avgTransaction = TRANSACTIONS.reduce((sum, tx) => sum + tx.amount, 0) / TRANSACTIONS.length

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSettlement = (settlementId: string, action: 'approve' | 'hold' | 'reject') => {
    const settlement = SETTLEMENTS.find((s) => s.id === settlementId)
    if (!settlement) return
    if (action === 'approve') showToast(`Settlement for ${settlement.businessName} approved — payout initiated`)
    else if (action === 'hold') showToast(`Settlement for ${settlement.businessName} placed on hold`, 'error')
    else showToast(`Settlement for ${settlement.businessName} rejected`, 'error')
  }

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Customer', 'Business', 'Amount', 'Fee', 'Net', 'Status', 'Payment Method']
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      new Date(tx.date).toISOString(),
      tx.customer,
      tx.business,
      tx.amount,
      tx.fee,
      tx.net,
      tx.status,
      tx.paymentMethod,
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
        <AdminStatCard label="Revenue This Month" value={formatCurrency(revenueThisMonth, 'XAF')} icon={DollarSign} change={14.2} changeLabel="vs last month" accent="bg-emerald-500" />
        <AdminStatCard label="Pending Settlements" value={formatCurrency(pendingSettlements, 'XAF')} icon={Clock} change={-8.5} changeLabel="vs last month" accent="bg-amber-500" />
        <AdminStatCard label="Refund Requests" value={refundRequests.toString()} icon={RotateCcw} change={-12.3} changeLabel="vs last month" accent="bg-red-500" />
        <AdminStatCard label="Avg Transaction" value={formatCurrency(avgTransaction, 'XAF')} icon={CreditCard} change={6.8} changeLabel="vs last month" accent="bg-purple-500" />
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
                      onChange={(e) => setStatusFilter(e.target.value as TxStatus | 'all')}
                      className="appearance-none px-3 py-2 pr-8 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                  </div>

                  {/* Payment method filter */}
                  <div className="relative">
                    <select
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
                      className="appearance-none px-3 py-2 pr-8 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                    >
                      <option value="all">All Methods</option>
                      <option value="stripe">Stripe</option>
                      <option value="paystack">Paystack</option>
                      <option value="flutterwave">Flutterwave</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="razorpay">Razorpay</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const style = STATUS_STYLES[tx.status]
                const StatusIcon = style.icon
                const methodStyle = METHOD_LABELS[tx.paymentMethod]
                return (
                  <tr key={tx.id} className="border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary font-mono">{tx.id}</span>
                      <br />
                      <span className="text-[11px] text-text-tertiary">
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-text-primary">{tx.customer}</span>
                      <br />
                      <span className="text-[11px] text-text-tertiary">{tx.customerEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-secondary">{tx.business}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(tx.fee, tx.currency)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(tx.net, tx.currency)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', style.bg, style.text)}>
                        <StatusIcon className="w-3 h-3" />
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', methodStyle.color)}>
                        {methodStyle.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
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
