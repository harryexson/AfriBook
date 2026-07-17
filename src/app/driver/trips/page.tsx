'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency, formatDate, formatTime } from '@/lib/utils'
import {
  Route, Download, Filter, MapPin, Clock, DollarSign, Star,
  Search, ChevronDown, X, Calendar,
} from 'lucide-react'
import type { Trip } from '@/types'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const MOCK_TRIPS: (Trip & { rating?: number })[] = [
  { id: 't1', driverId: 'd1', type: 'delivery', status: 'delivered', pickupAddress: { street: '123 Main St', city: 'Lagos', state: 'LA', postalCode: '100001', countryCode: 'NG', formatted: '123 Main St, Lagos' }, dropoffAddress: { street: '456 Oak Ave', city: 'Lagos', state: 'LA', postalCode: '100002', countryCode: 'NG', formatted: '456 Oak Ave, Lagos' }, distanceKm: 5.2, durationMin: 18, earnings: 1200, rating: 5 },
  { id: 't2', driverId: 'd1', type: 'pickup', status: 'delivered', pickupAddress: { street: '789 Pine Rd', city: 'Lagos', state: 'LA', postalCode: '100003', countryCode: 'NG', formatted: '789 Pine Rd, Lagos' }, dropoffAddress: { street: '321 Elm St', city: 'Lagos', state: 'LA', postalCode: '100004', countryCode: 'NG', formatted: '321 Elm St, Lagos' }, distanceKm: 3.8, durationMin: 12, earnings: 850, rating: 4 },
  { id: 't3', driverId: 'd1', type: 'delivery', status: 'delivered', pickupAddress: { street: '555 Market St', city: 'Lagos', state: 'LA', postalCode: '100005', countryCode: 'NG', formatted: '555 Market St, Lagos' }, dropoffAddress: { street: '777 Park Ave', city: 'Lagos', state: 'LA', postalCode: '100006', countryCode: 'NG', formatted: '777 Park Ave, Lagos' }, distanceKm: 7.1, durationMin: 25, earnings: 2100, rating: 5 },
  { id: 't4', driverId: 'd1', type: 'delivery', status: 'cancelled', pickupAddress: { street: '999 Broad St', city: 'Lagos', state: 'LA', postalCode: '100007', countryCode: 'NG', formatted: '999 Broad St, Lagos' }, dropoffAddress: { street: '111 High St', city: 'Lagos', state: 'LA', postalCode: '100008', countryCode: 'NG', formatted: '111 High St, Lagos' }, distanceKm: 2.1, durationMin: 8, earnings: 0, rating: 0 },
  { id: 't5', driverId: 'd1', type: 'pickup', status: 'delivered', pickupAddress: { street: '222 River Rd', city: 'Lagos', state: 'LA', postalCode: '100009', countryCode: 'NG', formatted: '222 River Rd, Lagos' }, dropoffAddress: { street: '444 Lake Dr', city: 'Lagos', state: 'LA', postalCode: '100010', countryCode: 'NG', formatted: '444 Lake Dr, Lagos' }, distanceKm: 6.5, durationMin: 20, earnings: 1800, rating: 5 },
]

const STATUS_FILTERS = ['all', 'delivered', 'cancelled'] as const

export default function TripsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)
  const [showDateFilter, setShowDateFilter] = useState(false)

  const filtered = MOCK_TRIPS.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        t.pickupAddress.formatted.toLowerCase().includes(q) ||
        t.dropoffAddress.formatted.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalEarnings = filtered.reduce((s, t) => s + t.earnings, 0)
  const totalDistance = filtered.reduce((s, t) => s + t.distanceKm, 0)
  const avgRating = filtered.filter((t) => t.rating).reduce((s, t, _, a) => s + (t.rating ?? 0) / a.length, 0)

  const handleExport = () => {
    const csv = [
      ['ID', 'Type', 'Status', 'Pickup', 'Dropoff', 'Distance (km)', 'Duration (min)', 'Earnings', 'Rating'].join(','),
      ...filtered.map((t) =>
        [t.id, t.type, t.status, `"${t.pickupAddress.formatted}"`, `"${t.dropoffAddress.formatted}"`, t.distanceKm, t.durationMin, t.earnings, t.rating ?? '-'].join(',')
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
          filtered.map((trip, i) => {
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
                          trip.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {trip.status}
                        </span>
                        <span className="text-xs text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-md capitalize">
                          {trip.type}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-text-primary">{formatCurrency(trip.earnings)}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        <span className="text-text-primary">{trip.pickupAddress.formatted}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                        <span className="text-text-primary">{trip.dropoffAddress.formatted}</span>
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
                        {/* Route map placeholder */}
                        <div className="h-32 rounded-xl bg-gradient-to-br from-dark-400 to-dark-500 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                            <p className="text-white/60 text-xs">Route map</p>
                          </div>
                        </div>

                        {/* Fare breakdown */}
                        <div>
                          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Fare Breakdown</h4>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Base fare</span>
                              <span className="text-text-primary font-medium">{formatCurrency(trip.earnings * 0.7)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Distance</span>
                              <span className="text-text-primary font-medium">{formatCurrency(trip.earnings * 0.2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Time</span>
                              <span className="text-text-primary font-medium">{formatCurrency(trip.earnings * 0.1)}</span>
                            </div>
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
                              { label: 'Assigned', time: '10:15 AM', completed: true },
                              { label: 'Picked up', time: '10:22 AM', completed: true },
                              { label: 'In transit', time: '10:25 AM', completed: true },
                              { label: 'Delivered', time: '10:40 AM', completed: trip.status === 'delivered' },
                            ].map((step, si) => (
                              <div key={si} className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    'w-2.5 h-2.5 rounded-full ring-2',
                                    step.completed
                                      ? 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900'
                                      : 'bg-text-tertiary ring-border'
                                  )} />
                                  {si < 3 && <div className="w-0.5 h-6 bg-border" />}
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
    </motion.div>
  )
}
