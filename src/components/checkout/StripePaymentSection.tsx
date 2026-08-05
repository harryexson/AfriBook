'use client'

import { useState } from 'react'
import { StripeCheckout } from '@/components/checkout/StripeCheckout'

// ─── Types ────────────────────────────────────────────────────

export interface CreateIntentParams {
  amount: number
  countryCode: string
  method?: string
  currency?: string
  description?: string
  bookingId?: string
  orderId?: string
  rideId?: string
  deliveryId?: string
  vendorId?: string
  businessId?: string
  metadata?: Record<string, unknown>
}

export interface StripePaymentSectionProps {
  amount: number
  countryCode: string
  method?: string
  currency?: string
  description?: string
  bookingId?: string
  orderId?: string
  rideId?: string
  deliveryId?: string
  vendorId?: string
  businessId?: string
  metadata?: Record<string, unknown>
  buttonLabel?: string
  onSuccess?: () => void
  onError?: (message: string) => void
  className?: string
}

interface IntentState {
  clientSecret: string
  publishableKey: string
}

// ─── Helper: create the PaymentIntent via the API route ───────

export async function createStripePaymentIntent(
  params: CreateIntentParams,
): Promise<IntentState> {
  const res = await fetch('/api/payment/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: params.amount,
      countryCode: params.countryCode,
      method: params.method ?? 'card',
      currency: params.currency,
      description: params.description,
      bookingId: params.bookingId,
      orderId: params.orderId,
      rideId: params.rideId,
      deliveryId: params.deliveryId,
      vendorId: params.vendorId,
      businessId: params.businessId,
      metadata: params.metadata,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to initialize payment')
  }

  if (!data.clientSecret) {
    throw new Error('Payment could not be initialized. Please try again.')
  }

  return {
    clientSecret: data.clientSecret as string,
    publishableKey: data.publishableKey as string,
  }
}

// ─── Public component ─────────────────────────────────────────

/**
 * Drop-in Stripe payment section. Creates the PaymentIntent server-side
 * (including Connect destination charges when the vendor has a connected
 * account), renders Stripe's PaymentElement, and confirms the payment.
 * Call onSuccess when the payment is confirmed so the parent can finalize
 * the order / booking / ride / delivery.
 */
export function StripePaymentSection({
  amount,
  countryCode,
  method,
  currency,
  description,
  bookingId,
  orderId,
  rideId,
  deliveryId,
  vendorId,
  businessId,
  metadata,
  buttonLabel,
  onSuccess,
  onError,
  className = '',
}: StripePaymentSectionProps) {
  const [intent, setIntent] = useState<IntentState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await createStripePaymentIntent({
        amount,
        countryCode,
        method,
        currency,
        description,
        bookingId,
        orderId,
        rideId,
        deliveryId,
        vendorId,
        businessId,
        metadata,
      })
      setIntent(next)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to initialize payment'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  if (intent) {
    return (
      <div className={className}>
        <StripeCheckout
          clientSecret={intent.clientSecret}
          publishableKey={intent.publishableKey}
          buttonLabel={buttonLabel}
          onSuccess={() => onSuccess?.()}
          onError={onError}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || amount <= 0}
        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Initializing...
          </>
        ) : (
          buttonLabel ?? 'Pay with Card'
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
