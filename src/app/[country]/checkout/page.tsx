'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Check, CreditCard, Smartphone, Building, Wallet,
  Shield, AlertCircle, Loader2, Lock, Sparkles,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import type { CountryConfig } from '@/lib/localization/countries'
import PriceBreakdown from '@/components/marketplace/PriceBreakdown'
import type { PriceLineItem } from '@/components/marketplace/PriceBreakdown'

const PAYMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'credit-card': CreditCard,
  'smartphone': Smartphone,
  'bank': Building,
  'wallet': Wallet,
  'paypal': CreditCard,
}

const ORDER_ITEMS = [
  { name: 'Fresh Produce Box', qty: 1, price: 3500 },
  { name: 'Express Delivery', qty: 1, price: 1500 },
]

type PaymentState = 'idle' | 'processing' | 'success' | 'error'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const country = getCountryConfig(countryCode) as CountryConfig | undefined

  const [selectedPayment, setSelectedPayment] = useState<string>()
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const subtotal = ORDER_ITEMS.reduce((s, i) => s + i.price * i.qty, 0)
  const platformFee = subtotal * 0.1
  const taxRate = country?.taxRate ?? 0.075
  const tax = subtotal * taxRate
  const discount = promoApplied ? subtotal * 0.1 : 0
  const total = subtotal + platformFee + tax - discount

  const priceItems: PriceLineItem[] = [
    ...ORDER_ITEMS.map((item) => ({ label: `${item.name} x${item.qty}`, amount: item.price * item.qty })),
    { label: 'Platform fee (10%)', amount: platformFee, type: 'fee' },
    { label: country?.taxName ?? 'Tax', amount: tax, type: 'tax' },
    ...(discount > 0 ? [{ label: 'Discount', amount: discount, type: 'discount' as const }] : []),
    { label: 'Total', amount: total, type: 'total' },
  ]

  const handlePromoApply = (code: string) => {
    if (code.toLowerCase() === 'afribook10') {
      setPromoCode(code); setPromoApplied(true); setPromoError(null)
    } else {
      setPromoError('Invalid promo code')
    }
  }

  const handlePay = async () => {
    if (!selectedPayment || !acceptedTerms || paymentState === 'processing') return
    setPaymentState('processing')
    await new Promise((r) => setTimeout(r, 2000))
    setPaymentState('success')
    setTimeout(() => router.push(`/${params?.country}/order/ORD-ABC123`), 1500)
  }

  if (paymentState === 'success') {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">Payment successful!</h1>
          <p className="text-text-secondary mt-2">Your order has been placed. You&apos;ll receive a confirmation shortly.</p>
          <button
            onClick={() => router.push(`/${params?.country}/order/ORD-ABC123`)}
            className="mt-6 px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
          >
            View Order
          </button>
        </motion.div>
      </div>
    )
  }

  if (paymentState === 'error') {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">Payment failed</h1>
          <p className="text-text-secondary mt-2">Something went wrong. Please try again.</p>
          <button onClick={() => setPaymentState('idle')} className="mt-6 px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-border p-6 space-y-4"
            >
              <h2 className="text-lg font-bold font-heading text-text-primary">Customer details</h2>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Full name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder={country?.phoneFormat ?? '+234 XXX XXX XXXX'}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-2xl border border-border p-6 space-y-4"
            >
              <h2 className="text-lg font-bold font-heading text-text-primary">Payment method</h2>
              <div className="space-y-2">
                {(country?.paymentMethods ?? []).map((method) => {
                  const Icon = PAYMENT_ICONS[method.icon] ?? CreditCard
                  return (
                    <label
                      key={method.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                        selectedPayment === method.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                          : 'border-border bg-surface-secondary hover:border-amber-500/30'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="sr-only"
                      />
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        selectedPayment === method.id ? 'bg-amber-500 text-white' : 'bg-surface-tertiary text-text-secondary'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-text-primary">{method.name}</span>
                        {method.id === 'mpesa' && <p className="text-xs text-text-tertiary">Pay with M-Pesa</p>}
                      </div>
                      {selectedPayment === method.id && (
                        <div className="ml-auto">
                          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            </motion.div>

            {/* Promo */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <PriceBreakdown
                items={priceItems}
                currencyCode={country?.currency.code ?? 'NGN'}
                promoCode={promoCode}
                onApplyPromo={handlePromoApply}
                onRemovePromo={() => { setPromoCode(null); setPromoApplied(false); setPromoError(null) }}
                promoError={promoError}
                promoApplied={promoApplied}
                platformFeePercent={10}
                className="[&_.promo-section]:hidden"
              />
            </motion.div>

            {/* Terms + Pay */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface rounded-2xl border border-border p-6 space-y-4"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30"
                />
                <span className="text-sm text-text-secondary">
                  I agree to the <a href={country?.legalTermsUrl} className="text-amber-500 hover:text-amber-600 underline" target="_blank">Terms of Service</a> and{' '}
                  <a href={country?.privacyUrl} className="text-amber-500 hover:text-amber-600 underline" target="_blank">Privacy Policy</a>
                </span>
              </label>

              <button
                onClick={handlePay}
                disabled={!selectedPayment || !acceptedTerms || paymentState === 'processing'}
                className={cn(
                  'w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2',
                  selectedPayment && acceptedTerms && paymentState !== 'processing'
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                    : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
                )}
              >
                {paymentState === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay {formatCurrency(total, country?.currency.code ?? 'NGN')}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
                <Shield className="w-3.5 h-3.5" />
                Secured by AfriBook Payments
              </div>
            </motion.div>
          </div>

          {/* Right: Order Summary */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24 bg-surface rounded-2xl border border-border p-6">
              <h3 className="font-bold font-heading text-text-primary mb-4">Order summary</h3>
              <div className="space-y-3 mb-6">
                {ORDER_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-secondary">Qty: {item.qty}</p>
                    </div>
                    <span className="text-sm font-medium text-text-primary">{formatCurrency(item.price * item.qty, country?.currency.code ?? 'NGN')}</span>
                  </div>
                ))}
              </div>

              <PriceBreakdown
                items={priceItems}
                currencyCode={country?.currency.code ?? 'NGN'}
                platformFeePercent={10}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
