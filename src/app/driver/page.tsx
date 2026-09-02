'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { useCountry } from '@/components/shared/CountryProvider'
import { createClient } from '@/lib/supabase/client'
import { subscribeToDriverOffers, type DriverOfferEvent } from '@/lib/realtime/ride-status'
import {
  MapPin, Wallet, Route, Star, Wifi, WifiOff,
  ChevronRight, Car, Loader2,
} from 'lucide-react'
import TripCard from '@/components/shared/TripCard'
import TripRequest from '@/components/shared/TripRequest'
import type { Trip } from '@/types'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

// One accent (amber) throughout — three unrelated gradient hues here
// previously fought the single-accent rule in design-system/afribook/MASTER.md.
const QUICK_ACTIONS = [
  { label: 'View Earnings', icon: Wallet, href: '/driver/earnings' },
  { label: 'My Vehicle', icon: Car, href: '/driver/vehicle' },
  { label: 'Trip History', icon: Route, href: '/driver/trips' },
]

const MOCK_TRIPS: Trip[] = [
  // Still hardcoded — recent trip history should come from the driver's own
  // ride/delivery records (the same tables `driver-payouts.ts` reads for
  // earnings), not a fixed sample list. Left as-is rather than guessing at
  // the right query; flagging as the next real fix, not shipping a fake one.
  {
    id: 't1', driverId: 'd1', type: 'delivery', status: 'delivered',
    pickupAddress: { street: '123 Main St', city: 'Lagos', state: 'LA', postalCode: '100001', countryCode: 'NG', formatted: '123 Main St, Lagos' },
    dropoffAddress: { street: '456 Oak Ave', city: 'Lagos', state: 'LA', postalCode: '100002', countryCode: 'NG', formatted: '456 Oak Ave, Lagos' },
    distanceKm: 5.2, durationMin: 18, earnings: 1200,
  },
  {
    id: 't2', driverId: 'd1', type: 'pickup', status: 'delivered',
    pickupAddress: { street: '789 Pine Rd', city: 'Lagos', state: 'LA', postalCode: '100003', countryCode: 'NG', formatted: '789 Pine Rd, Lagos' },
    dropoffAddress: { street: '321 Elm St', city: 'Lagos', state: 'LA', postalCode: '100004', countryCode: 'NG', formatted: '321 Elm St, Lagos' },
    distanceKm: 3.8, durationMin: 12, earnings: 850,
  },
  {
    id: 't3', driverId: 'd1', type: 'delivery', status: 'delivered',
    pickupAddress: { street: '555 Market St', city: 'Lagos', state: 'LA', postalCode: '100005', countryCode: 'NG', formatted: '555 Market St, Lagos' },
    dropoffAddress: { street: '777 Park Ave', city: 'Lagos', state: 'LA', postalCode: '100006', countryCode: 'NG', formatted: '777 Park Ave, Lagos' },
    distanceKm: 7.1, durationMin: 25, earnings: 2100,
  },
]

type EarningsSummary = { totalEarnings: number; tripCount: number }

// Maps a raw realtime driver_offers row to what the TripRequest card needs.
// customerName/customerRating are intentionally omitted — see the comment
// on TripRequestData in TripRequest.tsx for why that's not faked here.
function toTripRequestData(offer: DriverOfferEvent, currencyCode: string) {
  return {
    id: offer.offerId,
    rideId: offer.rideId,
    pickupAddress: offer.pickupAddress ?? 'Pickup location',
    dropoffAddress: offer.destinationAddress ?? 'Dropoff location',
    distanceKm: offer.distanceKm ?? 0,
    estimatedEarnings: offer.estimatedEarnings ?? 0,
    estimatedDuration: offer.estimatedDurationMin ?? 0,
    type: 'pickup' as const,
    expiresAt: offer.expiresAt,
    currencyCode,
  }
}

export default function DriverDashboardPage() {
  const { country } = useCountry()
  const currencyCode = country.currency.code

  // Online status now round-trips to the database via /api/driver/status,
  // which calls the existing start_driver_session/end_driver_session RPCs.
  // Previously "Go Online" only flipped local state, so the dispatch
  // engine's driver-matching query (which requires status = 'online' in
  // the database) could never actually see this driver as available —
  // no amount of frontend polish would have made real offers arrive.
  const [isOnline, setIsOnline] = useState(false)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [tripRequest, setTripRequest] = useState<ReturnType<typeof toTripRequestData> | null>(null)
  const [acceptingOffer, setAcceptingOffer] = useState(false)
  const [dispatchError, setDispatchError] = useState<string | null>(null)

  // Load real persisted status on mount, so a page refresh doesn't
  // silently reset an actually-online driver back to "Offline".
  useEffect(() => {
    let cancelled = false
    fetch('/api/driver/status')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return
        setDriverId(data.driverId)
        setIsOnline(data.isOnline)
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleOnline = useCallback(async () => {
    setToggling(true)
    setDispatchError(null)
    try {
      const res = await fetch('/api/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: !isOnline }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status')
      setIsOnline(data.isOnline)
      setDriverId(data.driverId)
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setToggling(false)
    }
  }, [isOnline])

  // Live dispatch subscription — replaces the hardcoded incoming request.
  // Only subscribes while actually online, matching how a real driver app
  // should behave (no point listening for offers you can't be sent).
  useEffect(() => {
    if (!isOnline || !driverId) return
    const unsubscribe = subscribeToDriverOffers(driverId, (offer) => {
      setTripRequest(toTripRequestData(offer, currencyCode))
    })
    return unsubscribe
  }, [isOnline, driverId, currencyCode])

  const handleAccept = useCallback(async (offerId: string) => {
    if (!tripRequest || !driverId) return
    setAcceptingOffer(true)
    setDispatchError(null)
    try {
      const res = await fetch(`/api/ridely/rides/${tripRequest.rideId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to accept ride')
      setTripRequest(null)
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : 'Failed to accept ride')
    } finally {
      setAcceptingOffer(false)
    }
  }, [tripRequest, driverId])

  const handleDecline = useCallback(async (offerId: string) => {
    setTripRequest(null)
    // driver_offers_update RLS policy already scopes this to the driver's
    // own offers, so a direct client-side update is safe here — no need
    // for a dedicated API route for a single-column status change.
    const supabase = createClient()
    await supabase.from('driver_offers').update({ status: 'declined' }).eq('id', offerId)
  }, [])

  // Real earnings, fetched from the driver's own account. Previously this
  // whole dashboard (earnings, trip count, rating, today's/week's/month's
  // totals) was hardcoded, so every driver in every country saw the same
  // fake numbers in fake USD regardless of their real balance or currency.
  const [today, setToday] = useState<EarningsSummary | null>(null)
  const [week, setWeek] = useState<EarningsSummary | null>(null)
  const [month, setMonth] = useState<EarningsSummary | null>(null)
  const [earningsError, setEarningsError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/ridely/earnings')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return
        const weekSummary = data.summaries?.week
        const monthSummary = data.summaries?.month
        const todayEntry = weekSummary?.byDay?.[weekSummary.byDay.length - 1]
        setToday(
          todayEntry?.date === new Date().toISOString().slice(0, 10)
            ? { totalEarnings: todayEntry.earnings, tripCount: todayEntry.trips }
            : { totalEarnings: 0, tripCount: 0 },
        )
        setWeek(weekSummary ? { totalEarnings: weekSummary.totalEarnings, tripCount: weekSummary.tripCount } : null)
        setMonth(monthSummary ? { totalEarnings: monthSummary.totalEarnings, tripCount: monthSummary.tripCount } : null)
        // Note: rating isn't in this endpoint's response — it lives on the
        // driver's profile record, not the earnings summary. Left as mock
        // below rather than guessing at a field this API doesn't return.
      })
      .catch(() => {
        if (!cancelled) setEarningsError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6 pb-20 lg:pb-0">
        {/* Status banner */}
        <motion.div variants={ITEM}>
          <div className={cn(
            'rounded-2xl p-5 transition-all duration-500',
            isOnline
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
              : 'bg-surface border border-border'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm font-medium', isOnline ? 'text-emerald-100' : 'text-text-secondary')}>
                  Status
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'w-3 h-3 rounded-full',
                    isOnline ? 'bg-white animate-pulse' : 'bg-text-tertiary'
                  )} />
                  <span className={cn('text-xl font-bold', isOnline ? 'text-white' : 'text-text-primary')}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {isOnline && (
                  <p className="text-sm text-emerald-100 mt-1">You&apos;re receiving trip requests</p>
                )}
              </div>
              <button
                onClick={handleToggleOnline}
                disabled={toggling || statusLoading}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60',
                  isOnline
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700'
                )}
              >
                {toggling || statusLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isOnline ? (
                  <><WifiOff className="w-4 h-4" /> Go Offline</>
                ) : (
                  <><Wifi className="w-4 h-4" /> Go Online</>
                )}
              </button>
            </div>
            {dispatchError && (
              <p className={cn('text-xs mt-3', isOnline ? 'text-white/90' : 'text-red-600')}>{dispatchError}</p>
            )}
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div variants={ITEM} className="grid grid-cols-3 gap-3">
          {[
            { label: "Today's Earnings", value: today ? formatCurrency(today.totalEarnings, currencyCode) : '—', icon: Wallet },
            { label: 'Trips Today', value: today ? String(today.tripCount) : '—', icon: Route },
            { label: 'Rating', value: '4.92', icon: Star }, // still mock — see note below on driver profile rating
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4 hover:shadow-md hover:border-amber-500/20 transition-all">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-amber-600 bg-amber-100 dark:bg-amber-900/30">
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold font-mono tabular-nums text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Map placeholder */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-dark-400 to-dark-500 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.1),transparent_60%)]" />
            <div className="relative text-center">
              <MapPin className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-float" />
              <p className="text-white/80 text-sm font-medium">Your live location will appear here</p>
              <p className="text-white/40 text-xs mt-1">GPS-enabled map with nearby requests</p>
            </div>
            {/* Decorative grid lines */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
          </div>
        </motion.div>

        {/* Earnings summary */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Earnings Summary</h3>
            <Link href="/driver/earnings" className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Today', value: today ? formatCurrency(today.totalEarnings, currencyCode) : '—' },
              { label: 'This Week', value: week ? formatCurrency(week.totalEarnings, currencyCode) : '—' },
              { label: 'This Month', value: month ? formatCurrency(month.totalEarnings, currencyCode) : '—' },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-surface-secondary">
                <p className="text-lg font-bold font-mono tabular-nums text-text-primary">{item.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          {earningsError && (
            <p className="text-xs text-text-tertiary mt-3">Couldn&apos;t load your latest earnings. Pull to refresh.</p>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{action.label}</p>
                <p className="text-xs text-text-tertiary">Quick action</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </motion.div>

        {/* Recent trips */}
        <motion.div variants={ITEM}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Recent Trips</h3>
            <Link href="/driver/trips" className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {MOCK_TRIPS.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Trip request modal */}
      <TripRequest
        request={tripRequest}
        onAccept={handleAccept}
        onDecline={handleDecline}
        loading={acceptingOffer}
      />
    </>
  )
}
