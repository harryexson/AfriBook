'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation, Car, Bike, ArrowRight, ArrowLeft,
  Loader2, CheckCircle, X, Star, Clock, Phone, MessageCircle,
  CreditCard, Banknote, Wallet, ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { RIDE_TYPE_CONFIG, type RideType, type RideStatus } from '@/types/ridely'
import { StripePaymentSection } from '@/components/checkout/StripePaymentSection'
import { cn, formatCurrency } from '@/lib/utils'

// --- Ride Type Definitions -----------------------------------

const RIDE_TYPES: {
  id: RideType
  name: string
  description: string
  icon: typeof Car
  capacity: string
  eta: string
  color: string
}[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Affordable everyday rides',
    icon: Car,
    capacity: '1-4',
    eta: '3-5 min',
    color: 'text-emerald-500',
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Newer cars with extra legroom',
    icon: Car,
    capacity: '1-4',
    eta: '4-7 min',
    color: 'text-blue-500',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Luxury vehicles for special occasions',
    icon: Car,
    capacity: '1-4',
    eta: '5-10 min',
    color: 'text-amber-500',
  },
  {
    id: 'motorcycle',
    name: 'Bike',
    description: 'Quick motorcycle rides',
    icon: Bike,
    capacity: '1',
    eta: '2-3 min',
    color: 'text-orange-500',
  },
]

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'wallet', name: 'Wallet', icon: Wallet },
] as const

// --- Step Type -----------------------------------------------

type BookingStep = 'details' | 'select' | 'payment' | 'matching' | 'riding' | 'complete'

// --- Page ----------------------------------------------------

export default function BookRidePage() {
  const router = useRouter()
  const { user, status: authStatus } = useAuthStore()

  // Booking state
  const [step, setStep] = useState<BookingStep>('details')
  const [pickupAddress, setPickupAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [selectedRideType, setSelectedRideType] = useState<RideType>('economy')
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'wallet'>('cash')
  const [rideId, setRideId] = useState<string | null>(null)
  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null)
  const [driverInfo, setDriverInfo] = useState<{
    name: string
    rating: number
    vehicle: string
    etaMinutes: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Price estimate (computed from distance)
  const estimatedDistance = 5.2 // Placeholder — in production, use geocoding + route API
  const estimatedDuration = Math.round(estimatedDistance * 2.5)
  const config = RIDE_TYPE_CONFIG[selectedRideType]
  const estimatedFare = Math.max(
    config.minimumFare,
    Math.round(config.baseFare + estimatedDistance * config.perKmRate + estimatedDuration * config.perMinRate),
  )

  // -- Request ride ------------------------------------------
  const handleRequestRide = useCallback(async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      setError('Please enter both pickup and destination')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // Simulated coordinates — in production, use geocoding
      const pickup = { lat: 6.5244, lng: 3.3792 } // Lagos default
      const destination = { lat: 6.5244 + 0.03, lng: 3.3792 + 0.02 }

      const res = await fetch('/api/ridely/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: user.id,
          rideType: selectedRideType,
          pickup,
          pickupAddress,
          destination,
          destinationAddress,
          paymentType,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create ride request')
      }

      setRideId(data.data.id)
      setRideStatus(data.data.status)

      // Card payments confirm the ride up-front; cash/wallet proceed to matching.
      if (paymentType === 'card') {
        setStep('payment')
        setLoading(false)
        return
      }

      beginMatching(data.data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request ride')
      setStep('details')
      setLoading(false)
    }
  }, [user, pickupAddress, destinationAddress, selectedRideType, paymentType, router])

  const beginMatching = useCallback((id: string) => {
    setRideId(id)
    setStep('matching')
    setLoading(true)

    // Simulate driver matching after a delay (in production, use Supabase Realtime)
    setTimeout(() => {
      setDriverInfo({
        name: 'Adebayo O.',
        rating: 4.8,
        vehicle: '2022 White Toyota Corolla',
        etaMinutes: 4,
      })
      setRideStatus('accepted')
      setLoading(false)
      setStep('riding')
    }, 3000)
  }, [])

  const handlePaymentSuccess = useCallback(() => {
    if (rideId) beginMatching(rideId)
  }, [rideId, beginMatching])

  // -- Cancel ride -------------------------------------------
  const handleCancelRide = useCallback(async () => {
    if (!rideId) return

    try {
      await fetch(`/api/ridely/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
    } catch {
      // Ignore errors on cancel
    }

    setRideId(null)
    setRideStatus(null)
    setDriverInfo(null)
    setStep('details')
  }, [rideId])

  // -- Loading state -----------------------------------------
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
          <span className="text-sm font-semibold text-text-primary">Book a Ride</span>
        </div>
      </div>

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
        <AnimatePresence mode="wait">
          {/* -- Step: Details -------------------------------- */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
                Where are you going?
              </h1>

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full" />
                  <input
                    type="text"
                    placeholder="Pick-up location"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
                  <input
                    type="text"
                    placeholder="Drop-off location"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => {
                    setPickupAddress('Current Location')
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-secondary border border-border text-sm text-text-secondary hover:text-text-primary hover:border-amber-500/50 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Current Location
                </button>
              </div>

              <button
                onClick={() => {
                  if (!pickupAddress.trim() || !destinationAddress.trim()) {
                    setError('Please enter both pickup and destination')
                    return
                  }
                  setError(null)
                  setStep('select')
                }}
                disabled={!pickupAddress.trim() || !destinationAddress.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Choose Ride
              </button>
            </motion.div>
          )}

          {/* -- Step: Select Ride Type ---------------------- */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
                Select your ride
              </h1>

              {/* Ride type cards */}
              <div className="space-y-3 mb-6">
                {RIDE_TYPES.map((type) => {
                  const typeConfig = RIDE_TYPE_CONFIG[type.id]
                  const fare = Math.max(
                    typeConfig.minimumFare,
                    Math.round(
                      typeConfig.baseFare +
                        estimatedDistance * typeConfig.perKmRate +
                        estimatedDuration * typeConfig.perMinRate,
                    ),
                  )
                  const isSelected = selectedRideType === type.id

                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedRideType(type.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                          : 'border-border hover:border-amber-500/30',
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        isSelected ? 'bg-amber-500/10' : 'bg-surface-secondary',
                      )}>
                        <type.icon className={cn('w-6 h-6', isSelected ? 'text-amber-500' : type.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary">{type.name}</span>
                          <span className="text-xs text-text-tertiary">{type.capacity} seats</span>
                        </div>
                        <p className="text-xs text-text-secondary">{type.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading font-bold text-text-primary">
                          {formatCurrency(fare, 'XAF')}
                        </p>
                        <p className="text-xs text-text-tertiary">{type.eta}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Payment method */}
              <div className="mb-6">
                <p className="text-sm font-medium text-text-primary mb-3">Payment</p>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentType(method.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all',
                        paymentType === method.id
                          ? 'border-amber-500 bg-amber-500/5 text-amber-600 font-medium'
                          : 'border-border text-text-secondary hover:border-amber-500/30',
                      )}
                    >
                      <method.icon className="w-4 h-4" />
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-surface-secondary rounded-xl p-4 border border-border mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Estimated fare</span>
                  <span className="font-heading text-xl font-bold text-text-primary">
                    {formatCurrency(estimatedFare, 'XAF')}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  ~{estimatedDistance} km · ~{estimatedDuration} min
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleRequestRide}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors"
                >
                  Confirm {RIDE_TYPES.find((t) => t.id === selectedRideType)?.name}
                </button>
              </div>
            </motion.div>
          )}

          {/* -- Step: Payment ------------------------------- */}
          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Confirm payment
              </h1>
              <p className="text-sm text-text-secondary mb-6">
                Pay for your {selectedRideType} ride before we find your driver.
              </p>

              <div className="bg-surface-secondary rounded-xl p-4 border border-border mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Estimated fare</span>
                  <span className="font-heading text-xl font-bold text-text-primary">
                    {formatCurrency(estimatedFare, 'XAF')}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  {pickupAddress} → {destinationAddress}
                </p>
              </div>

              <StripePaymentSection
                amount={estimatedFare}
                countryCode="US"
                method="card"
                rideId={rideId ?? undefined}
                description={`AfriBook ${selectedRideType} ride`}
                buttonLabel={`Pay ${formatCurrency(estimatedFare, 'XAF')}`}
                onSuccess={handlePaymentSuccess}
                onError={setError}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep('select')}
                  className="px-6 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* -- Step: Matching ------------------------------ */}
          {step === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Finding your driver...
              </h2>
              <p className="text-text-secondary mb-8">
                Looking for nearby {RIDE_TYPES.find((t) => t.id === selectedRideType)?.name.toLowerCase()} drivers
              </p>
              <button
                onClick={handleCancelRide}
                className="px-6 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* -- Step: Riding -------------------------------- */}
          {step === 'riding' && (
            <motion.div
              key="riding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-emerald-600">
                    {rideStatus === 'accepted' ? 'Driver on the way' : 'Ride in progress'}
                  </span>
                </div>
                <h1 className="font-heading text-2xl font-bold text-text-primary">
                  {rideStatus === 'accepted' ? 'Your driver is coming' : 'Enjoy your ride!'}
                </h1>
              </div>

              {/* Driver card */}
              {driverInfo && (
                <div className="bg-surface-secondary rounded-2xl p-5 border border-border mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center">
                      <Car className="w-7 h-7 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{driverInfo.name}</p>
                      <p className="text-sm text-text-secondary">{driverInfo.vehicle}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-text-primary">{driverInfo.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-500">{driverInfo.etaMinutes}</p>
                      <p className="text-xs text-text-tertiary">min ETA</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <Phone className="w-4 h-4" />
                      Call
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  </div>
                </div>
              )}

              {/* Trip details */}
              <div className="bg-surface-secondary rounded-xl p-4 border border-border mb-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-tertiary">Pickup</p>
                      <p className="text-sm text-text-primary">{pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-tertiary">Destination</p>
                      <p className="text-sm text-text-primary">{destinationAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {rideStatus !== 'completed' && (
                  <button
                    onClick={handleCancelRide}
                    className="px-6 py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/5 transition-colors text-sm font-medium"
                  >
                    Cancel Ride
                  </button>
                )}
                {rideStatus === 'completed' && (
                  <button
                    onClick={() => setStep('complete')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Rate & Complete
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* -- Step: Complete ------------------------------ */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Ride Complete!
              </h2>
              <p className="text-text-secondary mb-8">
                You paid {formatCurrency(estimatedFare, 'XAF')} via {paymentType}
              </p>

              {/* Rating */}
              <div className="mb-8">
                <p className="text-sm font-medium text-text-primary mb-3">Rate your driver</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="p-1">
                      <Star className="w-8 h-8 text-amber-400 hover:fill-amber-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <Link
                href="/rides"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
              >
                Done
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
