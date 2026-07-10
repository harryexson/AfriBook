'use client'

import { motion } from 'framer-motion'
import { cn, formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { MapPin, Star, Clock, DollarSign, ChevronRight } from 'lucide-react'
import type { Trip } from '@/types'

interface TripCardProps {
  trip: Trip
  onClick?: () => void
  index?: number
}

const STATUS_STYLES: Record<Trip['status'], string> = {
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  picked_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  in_transit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function TripCard({ trip, onClick, index = 0 }: TripCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
      onClick={onClick}
      className={cn(
        'group flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border',
        'hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all duration-300',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
        <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize',
              STATUS_STYLES[trip.status]
            )}>
              {trip.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-md capitalize">
              {trip.type}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-start gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span className="text-text-primary truncate">{trip.pickupAddress.formatted}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <span className="text-text-primary truncate">{trip.dropoffAddress.formatted}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(trip.earnings)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {trip.durationMin} min
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {trip.distanceKm.toFixed(1)} km
          </span>
        </div>
      </div>
    </motion.div>
  )
}
