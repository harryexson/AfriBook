'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Box,
  FileText,
  Truck,
  Navigation,
  Clock,
  CreditCard,
  Banknote,
  Wallet,
  Smartphone,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Shield,
  X,
  Loader2,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

type BookingStep = 'package' | 'addresses' | 'schedule' | 'price' | 'payment' | 'confirmation'

type PackageType = 'documents' | 'small' | 'medium' | 'large'
type DeliveryZone = 'same-city' | 'same-country' | 'cross-border' | 'pan-african'
type DeliverySpeed = 'express' | 'standard' | 'next-day' | 'cross-border'
type PaymentMethod = 'cash' | 'card' | 'mobile-money' | 'wallet'

interface FormData {
  packageType: PackageType | null
  weight: number
  description: string
  fragile: boolean
  specialInstructions: string
  pickupAddress: string
  pickupLat: number | null
  pickupLng: number | null
  deliveryAddress: string
  deliveryLat: number | null
  deliveryLng: number | null
  speed: DeliverySpeed | null
  zone: DeliveryZone | null
  paymentMethod: PaymentMethod | null
}

// ── Constants ──────────────────────────────────────────────────

const STEPS: { id: BookingStep; label: string; number: number }[] = [
  { id: 'package', label: 'Package', number: 1 },
  { id: 'addresses', label: 'Addresses', number: 2 },
  { id: 'schedule', label: 'Schedule', number: 3 },
  { id: 'price', label: 'Price', number: 4 },
  { id: 'payment', label: 'Payment', number: 5 },
  { id: 'confirmation', label: 'Confirm', number: 6 },
]

const PACKAGE_TYPES: {
  id: PackageType
  name: string
  description: string
  icon: typeof Package
  maxWeight: string
  basePrice: number
}[] = [
  {
    id: 'documents',
    name: 'Documents',
    description: 'Letters, contracts, legal docs',
    icon: FileText,
    maxWeight: '1 kg',
    basePrice: 2,
  },
  {
    id: 'small',
    name: 'Small',
    description: 'Electronics, clothes, accessories',
    icon: Package,
    maxWeight: '5 kg',
    basePrice: 4,
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Home goods, gifts, retail items',
    icon: Box,
    maxWeight: '15 kg',
    basePrice: 8,
  },
  {
    id: 'large',
    name: 'Large',
    description: 'Furniture, appliances, bulk orders',
    icon: Truck,
    maxWeight: '50 kg',
    basePrice: 15,
  },
]

const DELIVERY_SPEEDS: {
  id: DeliverySpeed
  name: string
  description: string
  time: string
  zone: DeliveryZone
  multiplier: number
  icon: typeof Clock
}[] = [
  {
    id: 'express',
    name: 'Same City Express',
    description: 'Fastest available',
    time: '1-2 hours',
    zone: 'same-city',
    multiplier: 1.5,
    icon: Clock,
  },
  {
    id: 'standard',
    name: 'Standard Same Day',
    description: 'Delivered today',
    time: '4-8 hours',
    zone: 'same-city',
    multiplier: 1.0,
    icon: Clock,
  },
  {
    id: 'next-day',
    name: 'Next Day',
    description: 'Delivered tomorrow',
    time: '1-2 business days',
    zone: 'same-country',
    multiplier: 1.2,
    icon: Clock,
  },
  {
    id: 'cross-border',
    name: 'Cross-Border',
    description: 'International delivery',
    time: '3-7 business days',
    zone: 'cross-border',
    multiplier: 2.5,
    icon: Truck,
  },
]

const ZONE_RATES: Record<DeliveryZone, { label: string; surcharge: number }> = {
  'same-city': { label: 'Same City', surcharge: 0 },
  'same-country': { label: 'Same Country', surcharge: 5 },
  'cross-border': { label: 'Cross-Border', surcharge: 15 },
  'pan-african': { label: 'Pan-African', surcharge: 30 },
}

const PAYMENT_METHODS: {
  id: PaymentMethod
  name: string
  icon: typeof Banknote
  description: string
}[] = [
  { id: 'cash', name: 'Cash', icon: Banknote, description: 'Pay on delivery' },
  { id: 'card', name: 'Card', icon: CreditCard, description: 'Visa, Mastercard' },
  { id: 'mobile-money', name: 'Mobile Money', icon: Smartphone, description: 'M-Pesa, MTN MoMo' },
  { id: 'wallet', name: 'Wallet', icon: Wallet, description: 'AfriBook balance' },
]

const WEIGHT_SURCHARGE_PER_KG = 0.5

// ── Animations ─────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 40 : -40, opacity: 0 }),
}

// ── Helpers ────────────────────────────────────────────────────

function generateTrackingNumber(): string {
  const prefix = 'AFR'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6)
  const random = Math.random().toString(36).toUpperCase().slice(2, 6)
  return `${prefix}-${timestamp}-${random}`
}

// ── Page ───────────────────────────────────────────────────────

export default function NewDeliveryPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('package')
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  const [form, setForm] = useState<FormData>({
    packageType: null,
    weight: 1,
    description: '',
    fragile: false,
    specialInstructions: '',
    pickupAddress: '',
    pickupLat: null,
    pickupLng: null,
    deliveryAddress: '',
    deliveryLat: null,
    deliveryLng: null,
    speed: null,
    zone: null,
    paymentMethod: null,
  })

  const updateForm = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ── Navigation ─────────────────────────────────────────────

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const goNext = useCallback(() => {
    const idx = STEPS.findIndex((s) => s.id === currentStep)
    if (idx < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep(STEPS[idx + 1].id)
    }
  }, [currentStep])

  const goBack = useCallback(() => {
    const idx = STEPS.findIndex((s) => s.id === currentStep)
    if (idx > 0) {
      setDirection(-1)
      setCurrentStep(STEPS[idx - 1].id)
    }
  }, [currentStep])

  // ── Price Calculation ──────────────────────────────────────

  const calcPrice = useCallback(() => {
    const pkg = PACKAGE_TYPES.find((p) => p.id === form.packageType)
    const speed = DELIVERY_SPEEDS.find((s) => s.id === form.speed)
    if (!pkg || !speed) return null

    const base = pkg.basePrice
    const weightSurcharge = Math.max(0, form.weight - 1) * WEIGHT_SURCHARGE_PER_KG
    const zone = ZONE_RATES[speed.zone]
    const distanceFee = zone.surcharge
    const subtotal = base + weightSurcharge + distanceFee
    const total = subtotal * speed.multiplier

    return { base, weightSurcharge, distanceFee, speedMultiplier: speed.multiplier, subtotal, total }
  }, [form.packageType, form.weight, form.speed])

  const price = calcPrice()

  // ── Geolocation ────────────────────────────────────────────

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        updateForm('pickupLat', latitude)
        updateForm('pickupLng', longitude)
        updateForm('pickupAddress', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setGeoLoading(false)
      },
      () => {
        setGeoLoading(false)
        setError('Unable to retrieve your location. Please enter it manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [updateForm])

  // ── Submit ─────────────────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setTrackingNumber(generateTrackingNumber())
      setDirection(1)
      setCurrentStep('confirmation')
    } catch {
      setError('Failed to create delivery. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Step Validation ────────────────────────────────────────

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'package':
        return form.packageType !== null
      case 'addresses':
        return form.pickupAddress.trim() !== '' && form.deliveryAddress.trim() !== ''
      case 'schedule':
        return form.speed !== null
      case 'price':
        return true
      case 'payment':
        return form.paymentMethod !== null
      default:
        return true
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/deliveries"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-semibold text-text-primary">Send a Package</span>
        </div>
      </div>

      {/* Progress Stepper */}
      {currentStep !== 'confirmation' && (
        <div className="border-b border-border bg-surface-secondary">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => {
                const isActive = step.id === currentStep
                const isCompleted = i < stepIndex
                return (
                  <div key={step.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                          isCompleted
                            ? 'bg-amber-500 text-white'
                            : isActive
                              ? 'bg-amber-500/10 text-amber-600 ring-2 ring-amber-500'
                              : 'bg-surface border border-border text-text-tertiary',
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] mt-1.5 font-medium hidden sm:block',
                          isActive ? 'text-amber-600' : isCompleted ? 'text-text-primary' : 'text-text-tertiary',
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 mx-2">
                        <div
                          className={cn(
                            'h-0.5 rounded-full transition-colors',
                            isCompleted ? 'bg-amber-500' : 'bg-border',
                          )}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-w-2xl mx-auto px-4 pt-4">
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <X className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── Step 1: Package Details ────────────────────── */}
          {currentStep === 'package' && (
            <motion.div
              key="package"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
                Package Details
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                Tell us about what you&apos;re sending
              </p>

              {/* Package Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {PACKAGE_TYPES.map((pkg) => {
                  const isSelected = form.packageType === pkg.id
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => updateForm('packageType', pkg.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center',
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                          : 'border-border hover:border-amber-500/30 bg-surface-secondary',
                      )}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          isSelected ? 'bg-amber-500/10' : 'bg-surface',
                        )}
                      >
                        <pkg.icon
                          className={cn('w-6 h-6', isSelected ? 'text-amber-500' : 'text-text-secondary')}
                        />
                      </div>
                      <div>
                        <p className={cn('font-semibold text-sm', isSelected ? 'text-amber-600' : 'text-text-primary')}>
                          {pkg.name}
                        </p>
                        <p className="text-[11px] text-text-tertiary mt-0.5">{pkg.description}</p>
                        <p className="text-[10px] text-text-tertiary mt-1">
                          Max {pkg.maxWeight}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Weight */}
              {form.packageType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Estimated Weight
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateForm('weight', Math.max(0.5, form.weight - 0.5))}
                      className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary hover:border-amber-500/50 transition-colors"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <span className="font-heading text-2xl font-bold text-text-primary">
                        {form.weight}
                      </span>
                      <span className="text-sm text-text-secondary ml-1">kg</span>
                    </div>
                    <button
                      onClick={() => updateForm('weight', Math.min(50, form.weight + 0.5))}
                      className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary hover:border-amber-500/50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Package Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Business contract, birthday gift"
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              {/* Fragile Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-secondary border border-border mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Fragile Package</p>
                    <p className="text-xs text-text-tertiary">Handle with extra care</p>
                  </div>
                </div>
                <button
                  onClick={() => updateForm('fragile', !form.fragile)}
                  className={cn(
                    'w-12 h-7 rounded-full transition-colors relative',
                    form.fragile ? 'bg-amber-500' : 'bg-border',
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white absolute top-1 transition-transform',
                      form.fragile ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>

              {/* Special Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Special Instructions
                </label>
                <textarea
                  placeholder="e.g. Leave at reception, call before arrival"
                  value={form.specialInstructions}
                  onChange={(e) => updateForm('specialInstructions', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                />
              </div>

              <button
                onClick={goNext}
                disabled={!isStepValid()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Addresses ─────────────────────────── */}
          {currentStep === 'addresses' && (
            <motion.div
              key="addresses"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
                Pickup & Delivery
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                Where should we pick up and deliver?
              </p>

              <div className="space-y-4 mb-6">
                {/* Pickup */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Pickup Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full" />
                    <input
                      type="text"
                      placeholder="Enter pickup location"
                      value={form.pickupAddress}
                      onChange={(e) => {
                        updateForm('pickupAddress', e.target.value)
                        updateForm('pickupLat', null)
                        updateForm('pickupLng', null)
                      }}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={useCurrentLocation}
                    disabled={geoLoading}
                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-secondary border border-border text-sm text-text-secondary hover:text-text-primary hover:border-amber-500/50 transition-colors disabled:opacity-50"
                  >
                    {geoLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    {geoLoading ? 'Getting location...' : 'Use Current Location'}
                  </button>
                </div>

                {/* Delivery */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Delivery Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
                    <input
                      type="text"
                      placeholder="Enter delivery location"
                      value={form.deliveryAddress}
                      onChange={(e) => updateForm('deliveryAddress', e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Zones */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-primary mb-3">Delivery Zones</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ZONE_RATES).filter(([k]) => k !== 'pan-african').map(([key, zone]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-surface-secondary border border-border text-center"
                    >
                      <p className="text-xs font-medium text-text-primary">{zone.label}</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {zone.surcharge === 0 ? 'Included' : `+${formatCurrency(zone.surcharge, 'USD')}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!isStepValid()}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Choose Speed
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Schedule ──────────────────────────── */}
          {currentStep === 'schedule' && (
            <motion.div
              key="schedule"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
                Delivery Speed
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                How fast do you need it delivered?
              </p>

              <div className="space-y-3 mb-6">
                {DELIVERY_SPEEDS.map((speed) => {
                  const isSelected = form.speed === speed.id
                  const zoneData = ZONE_RATES[speed.zone]
                  return (
                    <button
                      key={speed.id}
                      onClick={() => {
                        updateForm('speed', speed.id)
                        updateForm('zone', speed.zone)
                      }}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                          : 'border-border hover:border-amber-500/30',
                      )}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                          isSelected ? 'bg-amber-500/10' : 'bg-surface-secondary',
                        )}
                      >
                        <speed.icon
                          className={cn('w-6 h-6', isSelected ? 'text-amber-500' : 'text-text-secondary')}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-semibold text-sm', isSelected ? 'text-amber-600' : 'text-text-primary')}>
                            {speed.name}
                          </span>
                          {speed.id === 'express' && (
                            <span className="text-[10px] font-medium bg-amber-500 text-white px-2 py-0.5 rounded-full">
                              Fastest
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">{speed.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-text-tertiary" />
                          <span className="text-xs text-text-tertiary">{speed.time}</span>
                          <span className="text-xs text-text-tertiary">·</span>
                          <span className="text-xs text-text-tertiary">{zoneData.label}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-medium text-text-tertiary">
                          {speed.multiplier > 1 ? `${speed.multiplier}x` : 'Base'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!isStepValid()}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  View Price
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Price Estimate ────────────────────── */}
          {currentStep === 'price' && price && (
            <motion.div
              key="price"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
                Price Estimate
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                Here&apos;s your delivery cost breakdown
              </p>

              {/* Package Summary */}
              <div className="bg-surface-secondary rounded-2xl p-4 border border-border mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    {(() => {
                      const pkg = PACKAGE_TYPES.find((p) => p.id === form.packageType)
                      const Icon = pkg?.icon ?? Package
                      return <Icon className="w-5 h-5 text-amber-500" />
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {PACKAGE_TYPES.find((p) => p.id === form.packageType)?.name} Package
                    </p>
                    <p className="text-xs text-text-tertiary">{form.weight} kg</p>
                  </div>
                  {form.fragile && (
                    <span className="ml-auto text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Fragile
                    </span>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-surface rounded-2xl p-5 border border-border mb-4">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Price Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Base fare</span>
                    <span className="text-sm text-text-primary">{formatCurrency(price.base, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Weight surcharge ({form.weight} kg)</span>
                    <span className="text-sm text-text-primary">
                      {price.weightSurcharge > 0 ? `+${formatCurrency(price.weightSurcharge, 'USD')}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      Distance fee ({ZONE_RATES[form.speed ? DELIVERY_SPEEDS.find((s) => s.id === form.speed)!.zone : 'same-city'].label})
                    </span>
                    <span className="text-sm text-text-primary">
                      {price.distanceFee > 0 ? `+${formatCurrency(price.distanceFee, 'USD')}` : 'Included'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      Speed multiplier ({price.speedMultiplier}x)
                    </span>
                    <span className="text-sm text-text-primary">
                      {price.speedMultiplier > 1 ? 'Applied' : '—'}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-text-primary">Total Estimate</span>
                    <span className="font-heading text-xl font-bold text-amber-500">
                      {formatCurrency(price.total, 'USD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Insurance Note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-6">
                <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Insured Delivery</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Your package is covered up to $500 for loss or damage during transit.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Choose Payment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 5: Payment ───────────────────────────── */}
          {currentStep === 'payment' && (
            <motion.div
              key="payment"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
                Payment Method
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                How would you like to pay?
              </p>

              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = form.paymentMethod === method.id
                  return (
                    <button
                      key={method.id}
                      onClick={() => updateForm('paymentMethod', method.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                          : 'border-border hover:border-amber-500/30',
                      )}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                          isSelected ? 'bg-amber-500/10' : 'bg-surface-secondary',
                        )}
                      >
                        <method.icon
                          className={cn('w-6 h-6', isSelected ? 'text-amber-500' : 'text-text-secondary')}
                        />
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-semibold text-sm', isSelected ? 'text-amber-600' : 'text-text-primary')}>
                          {method.name}
                        </p>
                        <p className="text-xs text-text-tertiary">{method.description}</p>
                      </div>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                          isSelected ? 'border-amber-500' : 'border-border',
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Price Summary */}
              {price && (
                <div className="bg-surface-secondary rounded-xl p-4 border border-border mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Total to pay</span>
                    <span className="font-heading text-lg font-bold text-text-primary">
                      {formatCurrency(price.total, 'USD')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!isStepValid()}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Review Order
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 6: Confirmation / Review ─────────────── */}
          {currentStep === 'confirmation' && (
            <motion.div
              key="confirmation"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {!trackingNumber ? (
                <>
                  <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
                    Review & Confirm
                  </h1>
                  <p className="text-text-secondary text-sm mb-6">
                    Double-check your delivery details
                  </p>

                  {/* Package Summary */}
                  <div className="bg-surface-secondary rounded-2xl p-4 border border-border mb-3">
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Package
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">Type</span>
                        <span className="text-sm font-medium text-text-primary">
                          {PACKAGE_TYPES.find((p) => p.id === form.packageType)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">Weight</span>
                        <span className="text-sm font-medium text-text-primary">{form.weight} kg</span>
                      </div>
                      {form.description && (
                        <div className="flex justify-between">
                          <span className="text-sm text-text-secondary">Description</span>
                          <span className="text-sm font-medium text-text-primary text-right max-w-[60%] truncate">
                            {form.description}
                          </span>
                        </div>
                      )}
                      {form.fragile && (
                        <div className="flex justify-between">
                          <span className="text-sm text-text-secondary">Handling</span>
                          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Fragile
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="bg-surface-secondary rounded-2xl p-4 border border-border mb-3">
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Addresses
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-text-tertiary">Pickup</p>
                          <p className="text-sm text-text-primary">{form.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-text-tertiary">Delivery</p>
                          <p className="text-sm text-text-primary">{form.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="bg-surface-secondary rounded-2xl p-4 border border-border mb-3">
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Delivery Speed
                    </h3>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {DELIVERY_SPEEDS.find((s) => s.id === form.speed)?.name}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {DELIVERY_SPEEDS.find((s) => s.id === form.speed)?.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Total */}
                  <div className="bg-surface-secondary rounded-2xl p-4 border border-border mb-3">
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Payment
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const method = PAYMENT_METHODS.find((m) => m.id === form.paymentMethod)
                          if (!method) return null
                          return (
                            <>
                              <method.icon className="w-5 h-5 text-amber-500" />
                              <span className="text-sm font-medium text-text-primary">{method.name}</span>
                            </>
                          )
                        })()}
                      </div>
                      {price && (
                        <span className="font-heading text-lg font-bold text-amber-500">
                          {formatCurrency(price.total, 'USD')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {form.specialInstructions && (
                    <div className="bg-surface-secondary rounded-2xl p-4 border border-border mb-6">
                      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                        Instructions
                      </h3>
                      <p className="text-sm text-text-primary">{form.specialInstructions}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={goBack}
                      className="px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Delivery...
                        </>
                      ) : (
                        <>
                          Confirm & Send
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* ── Success State ──────────────────────────── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                    Delivery Booked!
                  </h2>
                  <p className="text-text-secondary mb-6 text-sm">
                    Your package is being prepared for pickup
                  </p>

                  {/* Tracking Number */}
                  <div className="bg-surface-secondary rounded-2xl p-5 border border-border mb-6">
                    <p className="text-xs text-text-tertiary mb-1">Tracking Number</p>
                    <p className="font-heading text-xl font-bold text-amber-500 font-mono">
                      {trackingNumber}
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-2">
                      Save this to track your delivery in real-time
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="bg-surface-secondary rounded-2xl p-4 border border-border mb-6 text-left">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">Package</span>
                        <span className="text-sm font-medium text-text-primary">
                          {PACKAGE_TYPES.find((p) => p.id === form.packageType)?.name} ({form.weight} kg)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">Speed</span>
                        <span className="text-sm font-medium text-text-primary">
                          {DELIVERY_SPEEDS.find((s) => s.id === form.speed)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">Payment</span>
                        <span className="text-sm font-medium text-text-primary">
                          {PAYMENT_METHODS.find((m) => m.id === form.paymentMethod)?.name}
                        </span>
                      </div>
                      {price && (
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="text-sm font-bold text-text-primary">Total Paid</span>
                          <span className="text-sm font-bold text-amber-500">
                            {formatCurrency(price.total, 'USD')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href="/deliveries"
                      className="flex-1 px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors text-center text-sm font-medium"
                    >
                      View My Deliveries
                    </Link>
                    <Link
                      href="/"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors text-center text-sm"
                    >
                      Back to Home
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
