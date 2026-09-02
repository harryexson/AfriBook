'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import {
  Wallet, ArrowUpRight, Clock,
  Loader2, X, TrendingUp,
} from 'lucide-react'
import PayoutHistory from '@/components/vendor/PayoutHistory'
import StatCard from '@/components/vendor/StatCard'
import type { Payout } from '@/types'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

interface WalletState {
  balance: number
  pendingBalance: number
  availableBalance: number
  currencyCode: string
}

export default function PayoutsPage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)

  const [wallet, setWallet] = useState<WalletState | null>(null)
  const [history, setHistory] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Real bank-account fields, submitted fresh with each request — see the
  // comment in src/lib/vendor/payouts.ts for why there's no saved-account
  // picker: no such table exists in the schema yet.
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [bankName, setBankName] = useState('')

  const loadData = () => {
    setLoading(true)
    setLoadError(null)
    fetch('/api/vendor/payouts')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setLoadError(data.error || 'Failed to load payout info')
          return
        }
        setWallet(data.wallet)
        setHistory(
          data.history.map((h: any) => ({
            id: h.id,
            vendorId: '',
            amount: h.amount,
            currencyCode: h.currencyCode,
            status: h.status,
            paymentMethod: 'bank_transfer',
            periodStart: h.createdAt,
            periodEnd: h.createdAt,
            fee: h.fee,
            netAmount: h.netAmount,
            createdAt: h.createdAt,
            updatedAt: h.paidAt ?? h.createdAt,
          })),
        )
      })
      .catch(() => setLoadError('Failed to load payout info'))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const currencyCode = wallet?.currencyCode ?? 'USD'
  const availableBalance = wallet?.availableBalance ?? 0

  const handlePayout = async () => {
    setProcessing(true)
    setPayoutError(null)
    try {
      const res = await fetch('/api/vendor/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payoutAmount),
          destination: { accountName, accountNumber, bankCode, bankName },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to request payout')
      setShowPayoutModal(false)
      setPayoutAmount('')
      setAccountName('')
      setAccountNumber('')
      setBankCode('')
      setBankName('')
      loadData()
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Failed to request payout')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Payouts & Earnings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your earnings and withdrawal preferences</p>
        {loadError && <p className="text-xs text-red-600 mt-2">{loadError}</p>}
      </motion.div>

      {/* Balance cards — real wallet data */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Available Balance</span>
          </div>
          <p className="text-3xl font-bold font-mono tabular-nums">
            {loading ? '—' : formatCurrency(availableBalance, currencyCode)}
          </p>
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={loading || availableBalance <= 0}
            className="mt-4 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            Request Payout
          </button>
        </div>
        <StatCard
          label="Pending"
          value={loading ? '—' : formatCurrency(wallet?.pendingBalance ?? 0, currencyCode)}
          icon={Clock}
          loading={loading}
        />
        <StatCard
          label="Total Balance"
          value={loading ? '—' : formatCurrency(wallet?.balance ?? 0, currencyCode)}
          icon={TrendingUp}
          loading={loading}
        />
      </motion.div>

      {/* Payout History — real data now */}
      <motion.div variants={ITEM}>
        <PayoutHistory payouts={history} loading={loading} />
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
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
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
                <p className="text-2xl font-bold font-mono tabular-nums text-text-primary mt-1">
                  {formatCurrency(availableBalance, currencyCode)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Amount</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={availableBalance}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                />
                <button
                  onClick={() => setPayoutAmount(String(availableBalance))}
                  className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                  Withdraw all
                </button>
              </div>

              {/* No saved payout methods yet — entered fresh each time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Name on account"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account number"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank name"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Bank Code</label>
                  <input
                    type="text"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="Sort/bank code"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                  />
                </div>
              </div>

              {payoutError && (
                <p className="text-xs text-red-600">{payoutError}</p>
              )}

              <button
                onClick={handlePayout}
                disabled={
                  !payoutAmount ||
                  Number(payoutAmount) <= 0 ||
                  Number(payoutAmount) > availableBalance ||
                  !accountName.trim() ||
                  !accountNumber.trim() ||
                  !bankCode.trim() ||
                  processing
                }
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
