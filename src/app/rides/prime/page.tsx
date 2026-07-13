'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Loader2, Crown } from 'lucide-react'
import PrimeSubscription from '@/components/driver/PrimeSubscription'
import { useAuthStore } from '@/stores/auth-store'

export default function PrimePage() {
  const router = useRouter()
  const { user, status: authStatus } = useAuthStore()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = useCallback(async (planId: string) => {
    if (!user) {
      router.push('/auth/login')
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/rides"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-text-primary">AfriBook Prime</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {subscribed ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
              Welcome to Prime!
            </h1>
            <p className="text-text-secondary mb-8">
              You now have access to exclusive Prime benefits including ride discounts, priority matching, and more.
            </p>
            <Link
              href="/rides/book"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
            >
              Book a Ride with Prime
            </Link>
          </div>
        ) : (
          <>
            <PrimeSubscription
              currentPlan="none"
              countryCode={user?.countryCode ?? 'US'}
              onSubscribe={handleSubscribe}
            />

            {loading && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-surface rounded-2xl p-8 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
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
