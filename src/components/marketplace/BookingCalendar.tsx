'use client'

import { useState, useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toTimezoneDate } from '@/lib/time'

import 'react-day-picker/style.css'

interface TimeSlot {
  time: string
  label: string
  available: boolean
}

interface StaffSlot {
  staffId: string
  staffName: string
  slots: TimeSlot[]
}

interface BookingCalendarProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  selectedTime?: string
  onTimeSelect: (time: string) => void
  businessHours?: { open: string; close: string }
  duration?: number
  staffSlots?: StaffSlot[]
  selectedStaffId?: string
  onStaffSelect?: (staffId: string) => void
  timezone?: string
  className?: string
}

function generateTimeSlots(open: string, close: string, duration: number, now: Date, bookedTimes?: string[]): TimeSlot[] {
  const [openH, openM] = open.split(':').map(Number)
  const [closeH, closeM] = close.split(':').map(Number)
  const openMin = openH * 60 + openM
  const closeMin = closeH * 60 + closeM
  const slots: TimeSlot[] = []
  const currentMin = now.getHours() * 60 + now.getMinutes()

  for (let m = openMin; m + duration <= closeMin; m += duration + 15) {
    const h = Math.floor(m / 60)
    const min = m % 60
    const label = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    const slotTime = label
    const isPast = m < currentMin
    const isBooked = bookedTimes?.includes(slotTime) ?? false
    slots.push({
      time: slotTime,
      label: new Date(0, 0, 0, h, min).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      available: !isPast && !isBooked,
    })
  }
  return slots
}

function getDisabledDays(date: Date, today: Date): boolean {
  const check = new Date(date)
  check.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((check.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays < 0 || diffDays > 30
}

export default function BookingCalendar({
  selectedDate,
  onDateSelect,
  selectedTime,
  onTimeSelect,
  businessHours = { open: '08:00', close: '18:00' },
  duration = 60,
  staffSlots,
  selectedStaffId,
  onStaffSelect,
  timezone,
  className,
}: BookingCalendarProps) {
  const localNow = toTimezoneDate(new Date(), timezone)
  const today = new Date(localNow)
  today.setHours(0, 0, 0, 0)
  const [month, setMonth] = useState<Date>(today)

  const timeSlots = useMemo(
    () => generateTimeSlots(businessHours.open, businessHours.close, duration, localNow),
    [businessHours, duration, localNow],
  )

  const handleDateSelect = (date: Date | undefined) => {
    if (date) onDateSelect(date)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Staff selection */}
      {staffSlots && staffSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Select Staff</h4>
          <div className="flex flex-wrap gap-2">
            {staffSlots.map((staff) => (
              <button
                key={staff.staffId}
                onClick={() => onStaffSelect?.(staff.staffId)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                  selectedStaffId === staff.staffId
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-border text-text-secondary hover:border-amber-500/30'
                )}
              >
                {staff.staffName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Select Date</h4>
        <div className="bg-surface-secondary border border-border rounded-xl p-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={(date) => getDisabledDays(date, today)}
            showOutsideDays={false}
            classNames={{
              root: 'w-full',
              months: 'flex flex-col',
              month: 'space-y-3',
              caption_label: 'text-sm font-bold text-text-primary',
              nav: 'flex items-center gap-1',
              nav_button: 'p-1.5 rounded-lg hover:bg-surface-tertiary text-text-secondary transition-colors disabled:opacity-30',
              table: 'w-full border-collapse',
              head_row: 'grid grid-cols-7 mb-1',
              head_cell: 'text-xs font-semibold text-text-tertiary text-center py-1',
              row: 'grid grid-cols-7',
              cell: 'text-center p-0.5',
              day: 'w-9 h-9 rounded-lg text-sm font-medium text-text-secondary hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-colors mx-auto',
              day_selected: '!bg-amber-500 !text-white hover:!bg-amber-600',
              day_disabled: '!text-text-tertiary !opacity-30 !cursor-not-allowed !hover:bg-transparent',
              day_today: 'font-bold text-amber-500',
            } as unknown as React.ComponentProps<typeof DayPicker>['classNames']}
            components={{
              Chevron: ({ orientation }) => (
                orientation === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              ),
            }}
          />
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-primary">Available Times</h4>
            {selectedDate && (
              <span className="text-xs text-text-tertiary">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-0.5">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => slot.available && onTimeSelect(slot.time)}
                disabled={!slot.available}
                className={cn(
                  'relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                  selectedTime === slot.time
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : slot.available
                      ? 'border-border text-text-secondary hover:border-amber-500/30 hover:bg-surface-secondary'
                      : 'border-border bg-surface-tertiary/50 text-text-tertiary cursor-not-allowed'
                )}
              >
                {slot.available ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                {slot.label}
              </button>
            ))}
          </div>
          {timeSlots.filter((s) => s.available).length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-4">No available slots for this date</p>
          )}
        </div>
      )}
    </div>
  )
}

export type { TimeSlot, StaffSlot }
