'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight, Car, UtensilsCrossed, BedDouble, Wrench, MapPin, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'rides' | 'food' | 'stays' | 'services'

const TABS: { key: TabKey; label: string; icon: typeof Car }[] = [
  { key: 'rides', label: 'Rides', icon: Car },
  { key: 'food', label: 'Food', icon: UtensilsCrossed },
  { key: 'stays', label: 'Stays', icon: BedDouble },
  { key: 'services', label: 'Services', icon: Wrench },
]

interface Field {
  name: string
  label: string
  placeholder: string
  icon: typeof MapPin
}

function fieldsFor(tab: TabKey, city: string): [Field, Field] {
  switch (tab) {
    case 'rides':
      return [
        { name: 'pickup', label: 'Pickup location', placeholder: `e.g. ${city} city centre`, icon: MapPin },
        { name: 'dropoff', label: 'Drop-off location', placeholder: 'Where to?', icon: MapPin },
      ]
    case 'food':
      return [
        { name: 'q', label: 'Craving', placeholder: 'Restaurant or dish', icon: Search },
        { name: 'near', label: 'Deliver to', placeholder: `Your address in ${city}`, icon: MapPin },
      ]
    case 'stays':
      return [
        { name: 'destination', label: 'Destination', placeholder: `e.g. ${city}`, icon: MapPin },
        { name: 'guests', label: 'Guests', placeholder: '2 adults', icon: Search },
      ]
    case 'services':
      return [
        { name: 'q', label: 'Service', placeholder: 'Barber, cleaner, photographer…', icon: Search },
        { name: 'near', label: 'Near', placeholder: `Area in ${city}`, icon: MapPin },
      ]
  }
}

/**
 * Tabbed search card from the reference hero. Each tab routes to the real
 * module for that vertical and passes what was typed as query params; it does
 * not pretend to quote a fare or check availability itself.
 */
export default function HeroSearch({ city }: { code: string; city: string }) {
  const [tab, setTab] = useState<TabKey>('rides')
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const fields = fieldsFor(tab, city)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    for (const [k, v] of data.entries()) {
      if (typeof v === 'string' && v.trim()) params.set(k, v.trim())
    }
    const qs = params.toString() ? `?${params.toString()}` : ''
    const base =
      tab === 'rides' ? '/rides/book' : tab === 'food' ? '/food' : tab === 'stays' ? '/stays' : '/marketplace/services'
    router.push(`${base}${qs}`)
  }

  return (
    <div className="rounded-[1.75rem] border border-border bg-surface p-3 shadow-lg sm:p-4">
      <div aria-label="What are you looking for?" className="flex gap-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = key === tab
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(key)}
              className={cn(
                'relative inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors',
                active ? 'text-amber-700' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {active && (
                <motion.span
                  layoutId="hero-search-tab"
                  className="absolute inset-0 rounded-2xl bg-amber-50"
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{label}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={onSubmit} className="mt-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid gap-2 sm:grid-cols-2"
          >
            {fields.map(({ name, label, placeholder, icon: Icon }) => (
              <label
                key={name}
                className="flex items-center gap-3 rounded-[10px] border border-border bg-surface-secondary/60 px-4 py-3 focus-within:border-amber-400"
              >
                <Icon className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium text-text-tertiary">{label}</span>
                  <input
                    name={name}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  />
                </span>
              </label>
            ))}
          </motion.div>
        </AnimatePresence>

        <button
          type="submit"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-amber-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          Explore AfriBook
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
