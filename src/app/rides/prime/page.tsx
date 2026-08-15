'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, Loader2, Crown, Zap, Percent, Star } from 'lucide-react'
import PrimeSubscription from '@/components/driver/PrimeSubscription'
import { useAuthStore } from '@/stores/auth-store'
import { DEFAULT_COUNTRY } from '@/lib/localization/market-context'

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function PrimePage() {
  const router = useRouter()
  const { user, status: authStatus } = useAuthStore()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)

    try {
      // In production, this would create a Stripe checkout session
      // For now, simulate subscription
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSubscribed(true)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }, [user, router])

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_40rem_at_80%_10%,rgba(245,158,11,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(30rem_30rem_at_-5%_110%,rgba(59,130,246,0.1),transparent_60%)]" />

        <div className="relative mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
          <div className="mb-10 flex items-center gap-4">
            <Link
              href="/rides"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white/70 backdrop-blur-md transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">AfriBook Prime</span>
            </div>
          </div>

          {subscribed ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-white">Welcome to Prime!</h1>
              <p className="mx-auto mt-4 max-w-md text-white/60">
                You now have access to exclusive Prime benefits including ride discounts, priority matching, and more.
              </p>
              <Link
                href="/rides/book"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3 font-medium text-white shadow-gold-lg transition-colors hover:bg-amber-600"
              >
                Book a Ride with Prime
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="pb-2 text-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
                <Zap className="h-3.5 w-3.5" />
                Members-only
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
                Ride more,
                <span className="block text-gradient-gold">pay less.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/60">
                Save up to 20% on every ride with priority matching, free
                cancellations, and VIP support — all for one flat monthly fee.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {[
                  { icon: Percent, label: 'Save up to 20%' },
                  { icon: Zap, label: 'Priority matching' },
                  { icon: Star, label: 'VIP support' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-white/70">
                    <item.icon className="h-4 w-4 text-amber-400" />
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {subscribed ? null : (
          <>
            <PrimeSubscription
              currentPlan="none"
              countryCode={user?.countryCode ?? DEFAULT_COUNTRY}
              onSubscribe={handleSubscribe}
            />

            {loading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface p-8 shadow-2xl">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <p className="text-sm text-text-secondary">Processing subscription...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
