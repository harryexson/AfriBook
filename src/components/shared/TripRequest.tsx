'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency, calculateDistance } from '@/lib/utils'
import { MapPin, Clock, DollarSign, Navigation, X } from 'lucide-react'

interface TripRequestData {
  id: string
  customerName: string
  customerRating: number
  pickupAddress: string
  dropoffAddress: string
  distanceKm: number
  estimatedEarnings: number
  estimatedDuration: number
  type: 'delivery' | 'pickup'
}

interface TripRequestProps {
  request: TripRequestData | null
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  loading?: boolean
}

export default function TripRequest({ request, onAccept, onDecline, loading }: TripRequestProps) {
  const [countdown, setCountdown] = useState(30)
  const [declining, setDeclining] = useState(false)

  if (!request) return null

  const handleDecline = () => {
    setDeclining(true)
    setTimeout(() => {
      onDecline(request.id)
      setDeclining(false)
    }, 300)
  }

  return (
    <AnimatePresence>
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[420px] p-4"
      >
        <div className="rounded-2xl bg-white dark:bg-dark-200 border border-border shadow-2xl shadow-amber-500/10 overflow-hidden">
          {/* Timer bar */}
          <div className="h-1 bg-surface-secondary overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 30, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-text-primary">New Trip Request</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-tertiary font-medium">
                {countdown}s
              </span>
              <button
                onClick={handleDecline}
                disabled={declining}
                className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-tertiary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customer info */}
          <div className="px-5 py-3 flex items-center gap-3 bg-amber-50/50 dark:bg-amber-500/5 border-y border-border">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
              {request.customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{request.customerName}</p>
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                <span>⭐</span>
                <span>{request.customerRating.toFixed(1)}</span>
                <span className="text-text-tertiary">&middot;</span>
                <span className="capitalize">{request.type}</span>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-0.5 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900" />
                <div className="w-0.5 h-8 bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-900" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Pickup</p>
                  <p className="text-sm text-text-primary truncate flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {request.pickupAddress}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Dropoff</p>
                  <p className="text-sm text-text-primary truncate flex items-center gap-1.5 mt-0.5">
                    <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {request.dropoffAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-surface-secondary text-center">
                <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-text-primary">{formatCurrency(request.estimatedEarnings)}</p>
                <p className="text-[10px] text-text-tertiary">Est. earnings</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary text-center">
                <Navigation className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-text-primary">{request.distanceKm.toFixed(1)} km</p>
                <p className="text-[10px] text-text-tertiary">Distance</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary text-center">
                <Clock className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-text-primary">{request.estimatedDuration} min</p>
                <p className="text-[10px] text-text-tertiary">Duration</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-5 pb-5">
            <button
              onClick={handleDecline}
              disabled={loading || declining}
              className="flex-1 py-3 rounded-xl border-2 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => onAccept(request.id)}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Accepting...' : 'Accept'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
