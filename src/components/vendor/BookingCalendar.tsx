'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking, BookingStatus } from '@/types'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, isSameDay, isSameMonth, addDays, addWeeks, addMonths,
  subWeeks, subMonths, isToday, parseISO,
} from 'date-fns'

type View = 'month' | 'week' | 'day'

interface BookingCalendarProps {
  bookings?: Booking[]
  view?: View
  onViewChange?: (view: View) => void
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-blue-500',
  in_progress: 'bg-purple-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-gray-500',
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', businessId: 'b1', serviceId: 's1', customerId: 'c1', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), status: 'confirmed', amount: 15000, currencyCode: 'XAF', paymentStatus: 'completed', reminders: [], createdAt: '', updatedAt: '' },
  { id: 'b2', businessId: 'b1', serviceId: 's2', customerId: 'c2', startTime: new Date(Date.now() + 7200000).toISOString(), endTime: new Date(Date.now() + 10800000).toISOString(), status: 'pending', amount: 8000, currencyCode: 'XAF', paymentStatus: 'pending', reminders: [], createdAt: '', updatedAt: '' },
]

export default function BookingCalendar({ bookings: bookingsProp, view: externalView, onViewChange }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>(externalView ?? 'month')
  const bookings = bookingsProp ?? MOCK_BOOKINGS

  const handleViewChange = (v: View) => {
    setView(v)
    onViewChange?.(v)
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: addDays(start, 6) })
  }, [currentDate])

  const getBookingsForDay = (day: Date) =>
    bookings.filter((b) => isSameDay(parseISO(b.startTime), day))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-surface border border-border p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary font-heading">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-secondary rounded-lg p-0.5">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  view === v
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-surface-secondary transition-colors">
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {view === 'month' && (
        <div className="grid grid-cols-7 gap-px bg-border-light rounded-xl overflow-hidden border border-border">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="bg-surface-secondary p-2 text-center">
              <span className="text-xs font-semibold text-text-tertiary">{d}</span>
            </div>
          ))}
          {monthDays.map((day) => {
            const dayBookings = getBookingsForDay(day)
            const inMonth = isSameMonth(day, currentDate)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[80px] p-1.5 bg-surface',
                  !inMonth && 'opacity-40',
                  isToday(day) && 'bg-amber-50/50 dark:bg-amber-900/5'
                )}
              >
                <span className={cn(
                  'text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full',
                  isToday(day) ? 'bg-amber-500 text-white' : 'text-text-secondary'
                )}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className={cn('w-full h-1.5 rounded-full', STATUS_COLORS[b.status])}
                      title={`Booking #${b.id.slice(-4)}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-7 gap-px bg-border-light rounded-xl overflow-hidden border border-border min-h-[400px]">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="bg-surface p-2">
              <div className={cn('text-center mb-2', isToday(day) && 'bg-amber-500 text-white rounded-lg py-1')}>
                <p className="text-[10px] font-medium text-text-tertiary">{format(day, 'EEE')}</p>
                <p className="text-sm font-semibold">{format(day, 'd')}</p>
              </div>
              <div className="space-y-1">
                {getBookingsForDay(day).map((b) => (
                  <div
                    key={b.id}
                    className={cn('p-1.5 rounded-lg text-[10px] text-white font-medium', STATUS_COLORS[b.status])}
                  >
                    {format(parseISO(b.startTime), 'HH:mm')}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'day' && (
        <div className="space-y-px">
          {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
            <div key={hour} className="flex items-stretch min-h-[48px]">
              <div className="w-16 shrink-0 pr-3 text-right pt-1">
                <span className="text-xs font-medium text-text-tertiary">{hour}:00</span>
              </div>
              <div className="flex-1 border-t border-border-light pl-4 relative">
                {bookings
                  .filter((b) => {
                    const h = parseISO(b.startTime).getHours()
                    return h === hour
                  })
                  .map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        'absolute inset-x-0 top-0.5 bottom-0.5 rounded-lg p-2 text-white text-xs font-medium',
                        STATUS_COLORS[b.status]
                      )}
                    >
                      <span>{format(parseISO(b.startTime), 'HH:mm')}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
