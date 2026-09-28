'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Copy, Check, Users, AlertCircle } from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

interface ReferralData {
  success: boolean
  error?: string
  code?: string
  stats?: { totalReferred: number; qualified: number; paid: number; pendingBonus: number }
  schedule?: { referrerBonus: number; refereeBonus: number; milestone: string; maxPerMonth: number; currencyNote: string }
}

export default function DriverReferPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/referrals?type=driver')
      const payload = (await res.json()) as ReferralData
      setData(payload)
    } catch {
      setData({ success: false, error: 'Failed to load referral info' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const shareLink = data?.code ? `https://afribook.app/rides/apply?ref=${data.code}` : ''

  const handleCopy = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Refer & Earn</h1>
        <p className="text-sm text-text-secondary mt-1">
          Invite another driver. Once they complete 20 trips within 30 days, you both get paid — no cap on
          how many friends you invite, just on how many bonuses pay out per month.
        </p>
      </motion.div>

      {data?.error && !loading && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">{data.error}</p>
        </motion.div>
      )}

      {data?.code && (
        <motion.div variants={ITEM}>
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-amber-100" />
                <span className="text-sm font-medium text-amber-100">Your referral code</span>
              </div>
              <p className="text-3xl font-bold tracking-wide mb-4">{data.code}</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy invite link'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {data?.stats && (
        <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Friends referred', value: data.stats.totalReferred },
            { label: 'Qualified', value: data.stats.qualified },
            { label: 'Paid out', value: data.stats.paid },
            { label: 'Pending bonus', value: data.stats.pendingBonus },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4">
              <Users className="w-4 h-4 text-amber-600 mb-2" />
              <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {data?.schedule && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-3">How it works</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>&bull; Milestone: {data.schedule.milestone}</li>
            <li>&bull; You get: a bonus credited to your weekly payout</li>
            <li>&bull; They get: a welcome bonus of their own once activated</li>
            <li>&bull; Capped at {data.schedule.maxPerMonth} paid referrals per month, per driver</li>
          </ul>
          <p className="text-xs text-text-tertiary mt-4">{data.schedule.currencyNote}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
