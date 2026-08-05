'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { PaymentIntent, PaymentIntentConfirmParams } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Lock, ShieldCheck } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

export interface StripeCheckoutProps {
  /** client_secret from POST /api/payment/intent */
  clientSecret: string
  /** NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY returned by the intent route */
  publishableKey: string
  /** Human-readable label for the pay button, e.g. "Pay $49.00" */
  buttonLabel?: string
  /** Called after Stripe confirms the payment successfully */
  onSuccess?: (paymentIntent: PaymentIntent) => void
  onError?: (message: string) => void
  /** Extra confirmation params, e.g. return_url when redirect is required */
  confirmParams?: Partial<PaymentIntentConfirmParams>
}

// ─── Inner component (must live under <Elements>) ─────────────

function StripeCheckoutForm({
  buttonLabel = 'Pay',
  onSuccess,
  onError,
  confirmParams,
}: Omit<StripeCheckoutProps, 'clientSecret' | 'publishableKey'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setError('Stripe is still loading. Please try again.')
      return
    }

    setProcessing(true)
    setError(null)

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
        ...confirmParams,
      },
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message ?? 'Payment failed. Please try again.')
      onError?.(result.error.message ?? 'Payment failed')
      setProcessing(false)
      return
    }

    if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      onSuccess?.(result.paymentIntent)
    }

    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {buttonLabel}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-tertiary">
        <ShieldCheck className="w-3 h-3" />
        Payments are encrypted and processed securely by Stripe
      </div>
    </form>
  )
}

// ─── Public component ─────────────────────────────────────────

export function StripeCheckout(props: StripeCheckoutProps) {
  const { clientSecret, publishableKey } = props
  const [stripePromise] = useState(() => loadStripe(publishableKey))

  if (!stripePromise) {
    return (
      <div className="p-4 rounded-xl bg-surface-secondary border border-border">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckoutForm {...props} />
    </Elements>
  )
}
