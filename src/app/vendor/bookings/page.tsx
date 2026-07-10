'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import {
  Calendar, List, Search, Download,
  Check, X as XIcon,
  RotateCcw, AlertTriangle, UserPlus, Clock,
} from 'lucide-react'
import BookingCalendar from '@/components/vendor/BookingCalendar'
import type { Booking, BookingStatus } from '@/types'

const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', businessId: 'b1', serviceId: 's1', customerId: 'c1', staffId: 'st1', startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 7200000).toISOString(), status: 'confirmed', amount: 15000, currencyCode: 'XAF', paymentStatus: 'completed', notes: 'First-time customer', reminders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b2', businessId: 'b1', serviceId: 's2', customerId: 'c2', startTime: new Date(Date.now() + 14400000).toISOString(), endTime: new Date(Date.now() + 18000000).toISOString(), status: 'pending', amount: 8000, currencyCode: 'XAF', paymentStatus: 'pending', reminders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b3', businessId: 'b1', serviceId: 's3', customerId: 'c3', staffId: 'st2', startTime: new Date(Date.now() + 28800000).toISOString(), endTime: new Date(Date.now() + 32400000).toISOString(), status: 'confirmed', amount: 25000, currencyCode: 'XAF', paymentStatus: 'completed', reminders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b4', businessId: 'b1', serviceId: 's1', customerId: 'c4', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 82800000).toISOString(), status: 'completed', amount: 12000, currencyCode: 'XAF', paymentStatus: 'completed', reminders: [], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
]

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function BookingsPage() {
  const [bookings] = useState<Booking[]>(MOCK_BOOKINGS)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const filtered = bookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (search && !b.id.includes(search) && !b.customerId.includes(search)) return false
    return true
  })

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Bookings</h1>
          <p className="text-sm text-text-secondary mt-1">{bookings.length} bookings total</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
            <UserPlus className="w-4 h-4" /> Walk-in
          </button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-secondary rounded-lg p-0.5">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  filterStatus === s
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex bg-surface-secondary rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn('p-2 rounded-md transition-colors', viewMode === 'calendar' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary')}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <motion.div variants={ITEM}>
          <BookingCalendar />
        </motion.div>
      ) : (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No bookings found</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {filtered.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedBooking(booking)}
                  className="flex items-center gap-4 p-4 px-5 hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">Booking #{booking.id.slice(-4)}</p>
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[booking.status])}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
                      <span>{formatDate(booking.startTime, 'MMM d, yyyy')}</span>
                      <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      {booking.notes && <span className="truncate max-w-[150px] italic">&quot;{booking.notes}&quot;</span>}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-text-primary shrink-0">
                    {formatCurrency(booking.amount, booking.currencyCode)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary font-heading">Booking Details</h2>
                <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                  <XIcon className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn('inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize', STATUS_STYLES[selectedBooking.status])}>
                    {selectedBooking.status.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-bold text-text-primary">{formatCurrency(selectedBooking.amount, selectedBooking.currencyCode)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-text-tertiary text-xs">Date</p><p className="text-text-primary">{formatDate(selectedBooking.startTime, 'MMM d, yyyy')}</p></div>
                  <div><p className="text-text-tertiary text-xs">Time</p><p className="text-text-primary">{formatTime(selectedBooking.startTime)}</p></div>
                  <div><p className="text-text-tertiary text-xs">Customer</p><p className="text-text-primary">{selectedBooking.customerId}</p></div>
                  <div><p className="text-text-tertiary text-xs">Payment</p><p className="text-text-primary capitalize">{selectedBooking.paymentStatus.replace('_', ' ')}</p></div>
                </div>
                {selectedBooking.notes && (
                  <div className="p-3 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-tertiary mb-0.5">Notes</p>
                    <p className="text-sm text-text-secondary">{selectedBooking.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                        <Check className="w-4 h-4" /> Confirm
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                        <XIcon className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
                        <RotateCcw className="w-4 h-4" /> Reschedule
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
                        <AlertTriangle className="w-4 h-4" /> No Show
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
