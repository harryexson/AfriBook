'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock, User, ChevronRight } from 'lucide-react'
import type { Booking, BookingStatus } from '@/types'

interface RecentBookingsProps {
  bookings?: Booking[]
  loading?: boolean
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', businessId: 'biz1', serviceId: 's1', customerId: 'c1', staffId: 'st1', startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 7200000).toISOString(), status: 'confirmed', amount: 15000, currencyCode: 'XAF', paymentStatus: 'completed', reminders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b2', businessId: 'biz1', serviceId: 's2', customerId: 'c2', startTime: new Date(Date.now() + 14400000).toISOString(), endTime: new Date(Date.now() + 18000000).toISOString(), status: 'pending', amount: 8000, currencyCode: 'XAF', paymentStatus: 'pending', reminders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b3', businessId: 'biz1', serviceId: 's3', customerId: 'c3', staffId: 'st2', startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date(Date.now() - 1800000).toISOString(), status: 'completed', amount: 25000, currencyCode: 'XAF', paymentStatus: 'completed', reminders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[status])}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function RecentBookings({ bookings, loading }: RecentBookingsProps) {
  const items = bookings ?? MOCK_BOOKINGS

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-40 h-6 rounded bg-surface-secondary" />
          <div className="w-20 h-4 rounded bg-surface-secondary" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-border-light last:border-0">
            <div className="w-10 h-10 rounded-full bg-surface-secondary" />
            <div className="flex-1">
              <div className="w-32 h-4 rounded bg-surface-secondary mb-2" />
              <div className="w-48 h-3 rounded bg-surface-secondary" />
            </div>
            <div className="w-16 h-6 rounded-full bg-surface-secondary" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl bg-surface border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading">Recent Bookings</h3>
        <button className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No bookings yet</p>
          <p className="text-sm text-text-tertiary mt-1">Bookings will appear here once customers start booking.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 py-3.5 px-2 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">Booking #{booking.id.slice(-4)}</p>
                <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(booking.startTime, 'MMM d')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(booking.startTime)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <StatusBadge status={booking.status} />
                <p className="text-xs font-semibold text-text-primary mt-1">{formatCurrency(booking.amount, booking.currencyCode)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
