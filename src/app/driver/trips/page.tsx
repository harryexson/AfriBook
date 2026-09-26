'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Route, Download, MapPin, Clock, DollarSign, Star,
  Search, ChevronDown, Calendar, Loader2,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

interface DriverTrip {
  id: string
  kind: 'ride' | 'delivery'
  status: string
  pickup: string
  dropoff: string
  distanceKm: number
  durationMin: number
  earnings: number
  rating: number | null
  tip: number
  requestedAt: string | null
  completedAt: string | null
}

const COMPLETED_STATUSES = new Set(['completed', 'delivered'])
const STATUS_FILTERS = ['all', 'completed', 'cancelled'] as const

export default function TripsPage() {
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)
  const [showDateFilter, setShowDateFilter] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetch('/api/driver/trips')
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return
        if (!body.success) {
          setError(body.error ?? 'Failed to load trips')
          return
        }
        setTrips(body.trips as DriverTrip[])
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load trips')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => trips.filter((t) => {
    if (statusFilter === 'completed' && !COMPLETED_STATUSES.has(t.status)) return false
    if (statusFilter === 'cancelled' && t.status !== 'cancelled') return false
    if (search) {
      const q = search.toLowerCase()
      return (
        t.pickup.toLowerCase().includes(q) ||
        t.dropoff.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    }
    return true
  }), [trips, statusFilter, search])

  const totalEarnings = filtered.reduce((s, t) => s + t.earnings, 0)
  const totalDistance = filtered.reduce((s, t) => s + t.distanceKm, 0)
  const ratedTrips = filtered.filter((t) => t.rating)
  const avgRating = ratedTrips.length
    ? ratedTrips.reduce((s, t) => s + (t.rating ?? 0), 0) / ratedTrips.length
    : 0

  const handleExport = () => {
    const csv = [
      ['ID', 'Type', 'Status', 'Pickup', 'Dropoff', 'Distance (km)', 'Duration (min)', 'Earnings', 'Rating'].join(','),
      ...filtered.map((t) =>
        [t.id, t.kind, t.status, `"${t.pickup}"`, `"${t.dropoff}"`, t.distanceKm, t.durationMin, t.earnings, t.rating ?? '-'].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trips-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Trip History</h1>
          <p className="text-sm text-text-secondary mt-1">View and manage your completed trips</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all"
          >
            <Calendar className="w-4 h-4" />
            Date Range
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading trips…
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && (
      <>
      {/* Stats summary */}
      <motion.div variants={ITEM} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Earnings', value: formatCurrency(totalEarnings), icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Total Distance', value: `${totalDistance.toFixed(1)} km`, icon: MapPin, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex bg-surface-secondary rounded-xl p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                statusFilter === f
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trips..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>
      </motion.div>

      {/* Trip list */}
      <motion.div variants={ITEM} className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Route className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary font-medium">No trips found</p>
            <p className="text-sm text-text-tertiary mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filtered.map((trip, _i) => {
            const isSelected = selectedTrip === trip.id
            return (
              <motion.div
                key={trip.id}
                variants={ITEM}
                initial={false}
              >
                <div
                  onClick={() => setSelectedTrip(isSelected ? null : trip.id)}
                  className={cn(
                    'rounded-2xl bg-surface border transition-all duration-200 cursor-pointer overflow-hidden',
                    isSelected ? 'border-amber-500/40 shadow-md shadow-amber-500/10' : 'border-border hover:shadow-md hover:border-amber-500/20'
                  )}
                >
                  {/* Trip header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize',
                          COMPLETED_STATUSES.has(trip.status)
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : trip.status === 'cancelled'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        )}>
                          {trip.status}
                        </span>
                        <span className="text-xs text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-md capitalize">
                          {trip.kind}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-text-primary">{formatCurrency(trip.earnings)}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        <span className="text-text-primary">{trip.pickup}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                        <span className="text-text-primary">{trip.dropoff}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{trip.durationMin} min</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{trip.distanceKm.toFixed(1)} km</span>
                      {trip.rating ? (
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" />{trip.rating}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-border bg-surface-secondary"
                    >
                      <div className="p-4 space-y-4">
                        {/* Fare breakdown */}
                        <div>
                          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Fare</h4>
                          <div className="space-y-1.5">
                            {trip.tip > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Tip</span>
                                <span className="text-text-primary font-medium">{formatCurrency(trip.tip)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-semibold border-t border-border pt-1.5 mt-1.5">
                              <span className="text-text-primary">Total</span>
                              <span className="text-text-primary">{formatCurrency(trip.earnings)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div>
                          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Timeline</h4>
                          <div className="space-y-3">
                            {[
                              {
                                label: 'Requested',
                                time: trip.requestedAt ? new Date(trip.requestedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null,
                                completed: Boolean(trip.requestedAt),
                              },
                              {
                                label: trip.status === 'cancelled' ? 'Cancelled' : trip.kind === 'delivery' ? 'Delivered' : 'Completed',
                                time: trip.completedAt ? new Date(trip.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null,
                                completed: Boolean(trip.completedAt),
                              },
                            ].map((step, si) => (
                              <div key={si} className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    'w-2.5 h-2.5 rounded-full ring-2',
                                    step.completed
                                      ? 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900'
                                      : 'bg-text-tertiary ring-border'
                                  )} />
                                  {si < 1 && <div className="w-0.5 h-6 bg-border" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-sm', step.completed ? 'text-text-primary' : 'text-text-tertiary')}>{step.label}</p>
                                  {step.completed && (
                                    <p className="text-xs text-text-tertiary">{step.time}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </motion.div>
      </>
      )}
    </motion.div>
  )
}
