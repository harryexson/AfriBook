'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Wallet, CreditCard, ArrowUpRight, Clock,
  Plus, Loader2, Building2, Smartphone, X,
} from 'lucide-react'
import PayoutHistory from '@/components/vendor/PayoutHistory'
import StatCard from '@/components/vendor/StatCard'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const MOCK_TRANSACTIONS = [
  { id: 't1', type: 'booking' as const, description: 'Haircut & Styling - Amara O.', amount: 5000, fee: 250, net: 4750, status: 'completed' as const, date: new Date().toISOString() },
  { id: 't2', type: 'order' as const, description: 'Order #ORD-8472', amount: 12025, fee: 601, net: 11424, status: 'completed' as const, date: new Date(Date.now() - 3600000).toISOString() },
  { id: 't3', type: 'booking' as const, description: 'Braiding - Chidera N.', amount: 15000, fee: 750, net: 14250, status: 'completed' as const, date: new Date(Date.now() - 7200000).toISOString() },
  { id: 't4', type: 'order' as const, description: 'Order #ORD-8468', amount: 8500, fee: 425, net: 8075, status: 'pending' as const, date: new Date(Date.now() - 14400000).toISOString() },
]

export default function PayoutsPage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const balance = 156750
  const pendingBalance = 23500
  const totalEarned = 2450000
  const platformFee = 5

  const handlePayout = async () => {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 1500))
    setProcessing(false)
    setShowPayoutModal(false)
    setPayoutAmount('')
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Payouts & Earnings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your earnings and withdrawal preferences</p>
      </motion.div>

      {/* Balance cards */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Available Balance</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(balance, 'XAF')}</p>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/30 transition-colors"
          >
            Request Payout
          </button>
        </div>
        <StatCard label="Pending" value={formatCurrency(pendingBalance, 'XAF')} icon={Clock} />
        <StatCard label="Total Earned" value={formatCurrency(totalEarned, 'XAF')} icon={TrendingUp} />
      </motion.div>

      {/* Connected accounts */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary font-heading">Payment Accounts</h2>
          <button className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-amber-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">First Bank of Nigeria</p>
              <p className="text-xs text-text-tertiary">Account ending in ****4821</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Default</span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-amber-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">M-Pesa</p>
              <p className="text-xs text-text-tertiary">+254 712 ***456</p>
            </div>
            <span className="text-xs text-text-tertiary">Connected</span>
          </div>
        </div>
      </motion.div>

      {/* Fee breakdown */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary font-heading mb-4">Fee Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs text-text-tertiary mb-1">Platform Commission</p>
            <p className="text-xl font-bold text-text-primary">{platformFee}%</p>
            <p className="text-xs text-text-secondary mt-1">Applied to all transactions</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs text-text-tertiary mb-1">Payout Fee</p>
            <p className="text-xl font-bold text-text-primary">Free</p>
            <p className="text-xs text-text-secondary mt-1">No fees on payouts</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs text-text-tertiary mb-1">Processing Fee</p>
            <p className="text-xl font-bold text-text-primary">1.5%</p>
            <p className="text-xs text-text-secondary mt-1">Payment processing</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary font-heading">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-border-light">
          {MOCK_TRANSACTIONS.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 px-6 hover:bg-surface-secondary transition-colors"
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                tx.type === 'booking' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
              )}>
                {tx.type === 'booking' ? <Clock className="w-5 h-5 text-amber-600" /> : <CreditCard className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{tx.description}</p>
                <p className="text-xs text-text-tertiary">{formatDate(tx.date, 'MMM d, HH:mm')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(tx.net, 'XAF')}</p>
                <p className="text-[11px] text-text-tertiary">Fee: {formatCurrency(tx.fee, 'XAF')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Payout History */}
      <motion.div variants={ITEM}>
        <PayoutHistory />
      </motion.div>

      {/* Request Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowPayoutModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary font-heading">Request Payout</h2>
                <button onClick={() => setShowPayoutModal(false)} className="p-2 rounded-lg hover:bg-surface-secondary">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-500/20">
                <p className="text-sm text-text-secondary">Available balance</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(balance, 'XAF')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Amount</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={balance}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                />
                <button
                  onClick={() => setPayoutAmount(String(balance))}
                  className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                  Withdraw all
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Payout to</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                  <option>First Bank ****4821 (Default)</option>
                  <option>M-Pesa +254 712 ***456</option>
                </select>
              </div>

              <button
                onClick={handlePayout}
                disabled={!payoutAmount || Number(payoutAmount) <= 0 || Number(payoutAmount) > balance || processing}
                className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                {processing ? 'Processing...' : 'Request Payout'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TrendingUp(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
