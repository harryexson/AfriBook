'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Staff, Weekday } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ScheduleGridProps {
  staff?: Staff[]
}

const WEEKDAYS: { key: Weekday; short: string }[] = [
  { key: 'mon', short: 'Mon' },
  { key: 'tue', short: 'Tue' },
  { key: 'wed', short: 'Wed' },
  { key: 'thu', short: 'Thu' },
  { key: 'fri', short: 'Fri' },
  { key: 'sat', short: 'Sat' },
  { key: 'sun', short: 'Sun' },
]

const MOCK_STAFF: Staff[] = [
  { id: 'st1', businessId: 'b1', userId: 'u1', name: 'Amara Okafor', role: 'stylist', email: 'amara@salon.com', phone: '+234800111222', schedule: WEEKDAYS.map((d) => ({ day: d.key, start: '08:00', end: '18:00', isAvailable: d.key !== 'sun' })), serviceIds: ['s1', 's2'], isActive: true, rating: 4.9, createdAt: '', updatedAt: '' },
  { id: 'st2', businessId: 'b1', userId: 'u2', name: 'Kofi Mensah', role: 'barber', email: 'kofi@salon.com', phone: '+23320111222', schedule: WEEKDAYS.map((d) => ({ day: d.key, start: '09:00', end: '17:00', isAvailable: d.key !== 'sun' })), serviceIds: ['s3'], isActive: true, rating: 4.7, createdAt: '', updatedAt: '' },
]

export default function ScheduleGrid({ staff: staffProp }: ScheduleGridProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const staffList = staffProp ?? MOCK_STAFF

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-surface border border-border p-6 overflow-x-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading">Weekly Schedule</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-sm font-medium text-text-primary min-w-[120px] text-center">
            This Week
          </span>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      <div className="min-w-[700px]">
        <div className="grid grid-cols-[160px_repeat(7,1fr)] gap-px bg-border-light rounded-xl overflow-hidden border border-border">
          <div className="bg-surface-secondary p-3">
            <span className="text-xs font-medium text-text-tertiary">Staff</span>
          </div>
          {WEEKDAYS.map((day) => (
            <div key={day.key} className="bg-surface-secondary p-3 text-center">
              <span className="text-xs font-semibold text-text-secondary">{day.short}</span>
            </div>
          ))}

          {staffList.map((s) => (
            <>
              <div key={`name-${s.id}`} className="bg-surface p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
                  <p className="text-[10px] text-text-tertiary capitalize">{s.role}</p>
                </div>
              </div>
              {WEEKDAYS.map((day) => {
                const sched = s.schedule.find((sc) => sc.day === day.key)
                const isAvailable = sched?.isAvailable ?? false
                return (
                  <div
                    key={`${s.id}-${day.key}`}
                    className={cn(
                      'p-2 flex items-center justify-center text-center',
                      isAvailable ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-surface'
                    )}
                  >
                    {isAvailable ? (
                      <div>
                        <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          {sched!.start} - {sched!.end}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-tertiary">Off</span>
                    )}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
