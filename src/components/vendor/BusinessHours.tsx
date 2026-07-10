'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Clock, Copy } from 'lucide-react'
import type { BusinessHours as BusinessHoursType, Weekday } from '@/types'

interface BusinessHoursProps {
  hours?: BusinessHoursType[]
  onChange?: (hours: BusinessHoursType[]) => void
  readOnly?: boolean
}

const DAYS: { key: Weekday; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

const DEFAULT_HOURS: BusinessHoursType[] = DAYS.map((d) => ({
  day: d.key,
  open: '09:00',
  close: '17:00',
  isClosed: d.key === 'sun',
}))

export default function BusinessHours({ hours, onChange, readOnly }: BusinessHoursProps) {
  const [localHours, setLocalHours] = useState<BusinessHoursType[]>(hours ?? DEFAULT_HOURS)
  const [copiedDay, setCopiedDay] = useState<string | null>(null)

  const update = (day: Weekday, field: keyof BusinessHoursType, value: string | boolean) => {
    if (readOnly) return
    const updated = localHours.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    setLocalHours(updated)
    onChange?.(updated)
  }

  const copyToAll = (sourceDay: Weekday) => {
    const source = localHours.find((h) => h.day === sourceDay)
    if (!source) return
    const updated = localHours.map((h) =>
      h.day === sourceDay ? h : { ...h, open: source.open, close: source.close, isClosed: source.isClosed }
    )
    setLocalHours(updated)
    onChange?.(updated)
    setCopiedDay(sourceDay)
    setTimeout(() => setCopiedDay(null), 1500)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-amber-500" />
        <h4 className="text-sm font-semibold text-text-primary">Hours of Operation</h4>
      </div>

      {DAYS.map(({ key, label }) => {
        const dayHours = localHours.find((h) => h.day === key) ?? DEFAULT_HOURS[0]
        return (
          <motion.div
            key={key}
            layout
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
              dayHours.isClosed
                ? 'bg-surface-secondary border-border-light'
                : 'bg-surface border-border'
            )}
          >
            <label className="flex items-center gap-2 min-w-[120px]">
              <input
                type="checkbox"
                checked={!dayHours.isClosed}
                onChange={(e) => update(key, 'isClosed', !e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500"
              />
              <span className={cn(
                'text-sm font-medium',
                dayHours.isClosed ? 'text-text-tertiary line-through' : 'text-text-primary'
              )}>
                {label}
              </span>
            </label>

            <AnimatePresence mode="wait">
              {!dayHours.isClosed ? (
                <motion.div
                  key="times"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2 flex-1"
                >
                  <input
                    type="time"
                    value={dayHours.open}
                    onChange={(e) => update(key, 'open', e.target.value)}
                    disabled={readOnly}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="text-text-tertiary text-sm">to</span>
                  <input
                    type="time"
                    value={dayHours.close}
                    onChange={(e) => update(key, 'close', e.target.value)}
                    disabled={readOnly}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  {!readOnly && (
                    <button
                      onClick={() => copyToAll(key)}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-tertiary hover:text-text-secondary"
                      title="Copy to all days"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.span
                  key="closed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-text-tertiary italic"
                >
                  Closed
                </motion.span>
              )}
            </AnimatePresence>

            {copiedDay === key && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-600 font-medium"
              >
                Copied!
              </motion.span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
