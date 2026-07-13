'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Car, Shield, Clock } from 'lucide-react'
import OnboardingWizard from '@/components/driver/OnboardingWizard'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

// --- Application Status Types --------------------------------
type ApplicationStatus = 'none' | 'pending_review' | 'approved' | 'rejected'

// --- Page ----------------------------------------------------

export default function DriverApplyPage() {
  const router = useRouter()
  const { user, status: authStatus } = useAuthStore()
  const [step, setStep] = useState<'wizard' | 'success' | 'error' | 'existing'>('wizard')
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('none')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // -- Check if user already has an application --------------
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) return

    const checkApplication = async () => {
      try {
        const res = await fetch(`/api/driver/apply?userId=${user.id}`)
        const data = await res.json()
        if (data.success && data.data.hasApplication) {
          setApplicationStatus(data.data.status)
          setStep('existing')
        }
      } catch {
        // Ignore errors — let user try to apply
      } finally {
        setCheckingStatus(false)
      }
    }

    checkApplication()
  }, [user, authStatus])

  // -- Handle onboarding completion --------------------------
  const handleComplete = useCallback(async (formData: Record<string, unknown>) => {
    if (!user) {
      setSubmitError('You must be logged in to apply')
      setStep('error')
      return
    }

    setSubmitError(null)

    try {
      const res = await fetch('/api/driver/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setStep('success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('error')
    }
  }, [user])

  // -- Loading state -----------------------------------------
  if (authStatus === 'idle' || authStatus === 'loading' || checkingStatus) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">Af</span>
          </div>
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      </div>
    )
  }

  // -- Unauthenticated state ---------------------------------
  if (authStatus === 'unauthenticated' || !user) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Car className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
            Drive with AfriBook
          </h1>
          <p className="text-text-secondary mb-8">
            Sign in to start your driver application and begin earning.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            Sign In to Apply
          </Link>
          <p className="mt-6 text-sm text-text-tertiary">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-amber-500 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // -- Success state -----------------------------------------
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
            Application Submitted!
          </h1>
          <p className="text-text-secondary mb-4">
            Thank you for applying to drive with AfriBook. We&apos;ll review your
            documents and get back to you within 24-48 hours.
          </p>
          <div className="bg-surface-secondary rounded-2xl p-6 border border-border mb-8 text-left">
            <h3 className="font-semibold text-text-primary mb-3">What happens next?</h3>
            <div className="space-y-3">
              {[
                { icon: Shield, text: 'Document verification (24-48 hours)' },
                { icon: Car, text: 'Vehicle inspection review' },
                { icon: Clock, text: 'Account activation notification via email' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm text-text-secondary">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/rides"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Back to Rides
          </Link>
        </div>
      </div>
    )
  }

  // -- Existing application state ----------------------------
  if (step === 'existing') {
    const statusConfig = {
      pending_review: {
        title: 'Application Under Review',
        description: 'Your driver application is currently being reviewed. We\'ll notify you once it\'s approved.',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
      },
      approved: {
        title: 'Application Approved!',
        description: 'Congratulations! You can now access the driver dashboard.',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      },
      rejected: {
        title: 'Application Not Approved',
        description: 'Unfortunately, your application was not approved. Please contact support for more information.',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
      },
    }

    const config = statusConfig[applicationStatus as keyof typeof statusConfig] ?? statusConfig.pending_review

    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6', config.bg)}>
            <AlertCircle className={cn('w-10 h-10', config.color)} />
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
            {config.title}
          </h1>
          <p className="text-text-secondary mb-8">{config.description}</p>
          <div className="flex gap-4 justify-center">
            {applicationStatus === 'approved' && (
              <Link
                href="/driver"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Go to Driver Dashboard
              </Link>
            )}
            <Link
              href="/rides"
              className="inline-flex items-center gap-2 border border-border text-text-secondary hover:text-text-primary font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Back to Rides
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // -- Error state -------------------------------------------
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
            Something Went Wrong
          </h1>
          <p className="text-text-secondary mb-8">{submitError}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep('wizard')}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/rides"
              className="inline-flex items-center gap-2 border border-border text-text-secondary hover:text-text-primary font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Back to Rides
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // -- Main wizard -------------------------------------------
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">Af</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">Driver Application</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
            Become an AfriBook Driver
          </h1>
          <p className="text-text-secondary text-sm">
            Complete the form below to start earning with AfriBook Rides.
          </p>
        </div>

        <OnboardingWizard
          countryCode={user.countryCode ?? 'US'}
          onComplete={handleComplete}
        />

        <p className="mt-8 text-xs text-text-tertiary text-center">
          By submitting, you agree to our{' '}
          <Link href="/legal/terms" className="text-amber-500 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/legal/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
