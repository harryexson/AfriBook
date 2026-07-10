'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, Star, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterState {
  categories: string[]
  priceMin: number
  priceMax: number
  rating: number
  maxDistance: number
  availableNow: boolean
  openNow: boolean
  deliveryAvailable: boolean
}

interface FilterSidebarProps {
  categories: string[]
  filters: FilterState
  onChange: (filters: FilterState) => void
  priceRange: [number, number]
  className?: string
}

const RATING_OPTIONS = [0, 3, 3.5, 4, 4.5]
const DISTANCE_OPTIONS = [5, 10, 25, 50, 100]

export default function FilterSidebar({
  categories,
  filters,
  onChange,
  priceRange,
  className,
}: FilterSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const update = useCallback(
    (patch: Partial<FilterState>) => {
      onChange({ ...filters, ...patch })
    },
    [filters, onChange],
  )

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat]
    update({ categories: next })
  }

  const clearAll = () => {
    onChange({
      categories: [],
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      rating: 0,
      maxDistance: 0,
      availableNow: false,
      openNow: false,
      deliveryAvailable: false,
    })
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceMin !== priceRange[0] ||
    filters.priceMax !== priceRange[1] ||
    filters.rating > 0 ||
    filters.maxDistance > 0 ||
    filters.availableNow ||
    filters.openNow ||
    filters.deliveryAvailable

  return (
    <aside className={cn('w-full lg:w-64 shrink-0', className)}>
      <div className="sticky top-24 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 text-sm font-semibold text-text-primary lg:cursor-default"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            <ChevronDown className={cn('w-4 h-4 lg:hidden transition-transform', collapsed && '-rotate-90')} />
          </button>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-xs font-medium text-amber-500 hover:text-amber-600 transition-colors">
              Clear all
            </button>
          )}
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-6 overflow-hidden"
            >
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.categories.map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-xs font-medium text-amber-600 dark:text-amber-400">
                      {cat}
                      <button onClick={() => toggleCategory(cat)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {filters.rating > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-xs font-medium text-amber-600 dark:text-amber-400">
                      {filters.rating}+ stars <button onClick={() => update({ rating: 0 })}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}

              {/* Category */}
              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Category</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30"
                      />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Price Range</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) => update({ priceMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="Min"
                  />
                  <span className="text-text-tertiary">—</span>
                  <input
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) => update({ priceMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Minimum Rating</h4>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => update({ rating: r === filters.rating ? 0 : r })}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-all',
                        r === filters.rating
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-border text-text-secondary hover:border-amber-500/30'
                      )}
                    >
                      {r > 0 ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {r}+
                        </>
                      ) : (
                        'Any'
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Distance</h4>
                <div className="flex flex-wrap gap-2">
                  {DISTANCE_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => update({ maxDistance: d === filters.maxDistance ? 0 : d })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-all',
                        d === filters.maxDistance
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-border text-text-secondary hover:border-amber-500/30'
                      )}
                    >
                      {d === 100 ? 'Any' : `Within ${d} km`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability Toggles */}
              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Availability</h4>
                <div className="space-y-3">
                  {([
                    { key: 'openNow', label: 'Open Now' },
                    { key: 'availableNow', label: 'Available Now' },
                    { key: 'deliveryAvailable', label: 'Delivery Available' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text-secondary">{label}</span>
                      <button
                        onClick={() => update({ [key]: !filters[key] })}
                        className={cn(
                          'relative w-9 h-5 rounded-full transition-colors',
                          filters[key] ? 'bg-amber-500' : 'bg-border'
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                          filters[key] && 'translate-x-4'
                        )} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}

export type { FilterState }
