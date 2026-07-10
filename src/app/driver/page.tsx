'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import {
  MapPin, DollarSign, Route, Star, Wifi, WifiOff,
  ChevronRight, Car, TrendingUp, Clock,
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const as const } },
}

const QUICK_ACTIONS = [
  { label: 'View Earnings', icon: DollarSign, href: '/driver/earnings', color: 'from-emerald-400 to-emerald-600' },
  { label: 'My Vehicle', icon: Car, href: '/driver/vehicle', color: 'from-blue-400 to-blue-600' },
  { label: 'Trip History', icon: Route, href: '/driver/trips', color: 'from-purple-400 to-purple-600' },
]

const MOCK_TRIPS: Trip[] = [
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

export default function DriverDashboardPage() {
  const [isOnline, setIsOnline] = useState(false)
  const [tripRequest, setTripRequest] = useState<any>({
    id: 'req-1',
    customerName: 'Chioma Okafor',
    customerRating: 4.8,
    pickupAddress: '15B Admiralty Way, Lekki Phase 1',
    dropoffAddress: '42 Awolowo Road, Ikoyi',
    distanceKm: 8.3,
    estimatedEarnings: 2500,
    estimatedDuration: 22,
    type: 'delivery',
  })

  const handleAccept = (id: string) => {
    setTripRequest(null)
  }

  const handleDecline = (id: string) => {
    setTripRequest(null)
  }

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
                onClick={() => setIsOnline(!isOnline)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
                  isOnline
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700'
                )}
              >
                {isOnline ? (
                  <><WifiOff className="w-4 h-4" /> Go Offline</>
                ) : (
                  <><Wifi className="w-4 h-4" /> Go Online</>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div variants={ITEM} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Today\'s Earnings', value: formatCurrency(2450), icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'Trips Today', value: '8', icon: Route, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Rating', value: '4.92', icon: Star, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4 hover:shadow-md hover:border-amber-500/20 transition-all">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-text-primary">{stat.value}</p>
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
              { label: 'Today', value: formatCurrency(2450) },
              { label: 'This Week', value: formatCurrency(18200) },
              { label: 'This Month', value: formatCurrency(68700) },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-surface-secondary">
                <p className="text-lg font-bold text-text-primary">{item.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all"
            >
              <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg', action.color)}>
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
      />
    </>
  )
}
