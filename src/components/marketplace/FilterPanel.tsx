'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, Star, ChevronDown, Clock, Truck, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FoodFilterState {
  categories: string[]
  cuisineTypes: string[]
  priceRange: [number, number]
  rating: number
  maxDistance: number
  availableNow: boolean
  openNow: boolean
  deliveryAvailable: boolean
  dietaryFilters: string[]
  sortBy: 'relevance' | 'distance' | 'rating' | 'price_low' | 'price_high' | 'delivery_time'
  promoOnly: boolean
}

interface FilterPanelProps {
  filters: FoodFilterState
  onChange: (filters: FoodFilterState) => void
  className?: string
}

const CUISINE_TYPES = [
  'African', 'American', 'Chinese', 'Ethiopian', 'French',
  'Indian', 'Italian', 'Japanese', 'Kenyan', 'Korean',
  'Mediterranean', 'Mexican', 'Nigerian', 'Thai', 'Turkish',
]

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'gluten_free', label: 'Gluten Free' },
  { id: 'nut_free', label: 'Nut Free' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'distance', label: 'Nearest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'delivery_time', label: 'Fastest Delivery' },
]

export default function FilterPanel({ filters, onChange, className }: FilterPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const update = useCallback(
    (patch: Partial<FoodFilterState>) => {
      onChange({ ...filters, ...patch })
    },
    [filters, onChange],
  )

  const toggleCuisine = useCallback(
    (cuisine: string) => {
      const current = filters.cuisineTypes
      update({
        cuisineTypes: current.includes(cuisine)
          ? current.filter((c) => c !== cuisine)
          : [...current, cuisine],
      })
    },
    [filters.cuisineTypes, update],
  )

  const toggleDietary = useCallback(
    (dietary: string) => {
      const current = filters.dietaryFilters
      update({
        dietaryFilters: current.includes(dietary)
          ? current.filter((d) => d !== dietary)
          : [...current, dietary],
      })
    },
    [filters.dietaryFilters, update],
  )

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.cuisineTypes.length) count += filters.cuisineTypes.length
    if (filters.dietaryFilters.length) count += filters.dietaryFilters.length
    if (filters.rating > 0) count++
    if (filters.maxDistance < 25) count++
    if (filters.promoOnly) count++
    if (filters.sortBy !== 'relevance') count++
    return count
  }, [filters])

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section))
  }, [])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() =>
              onChange({
                ...filters,
                cuisineTypes: [],
                dietaryFilters: [],
                rating: 0,
                maxDistance: 25,
                promoOnly: false,
                sortBy: 'relevance',
              })
            }
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as FoodFilterState['sortBy'] })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Toggles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => update({ availableNow: !filters.availableNow })}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
            filters.availableNow
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary',
          )}
        >
          <Clock className="h-3 w-3" />
          Open Now
        </button>
        <button
          onClick={() => update({ deliveryAvailable: !filters.deliveryAvailable })}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
            filters.deliveryAvailable
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary',
          )}
        >
          <Truck className="h-3 w-3" />
          Delivery
        </button>
        <button
          onClick={() => update({ promoOnly: !filters.promoOnly })}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
            filters.promoOnly
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-background text-muted-foreground border-border hover:border-orange-500',
          )}
        >
          <Flame className="h-3 w-3" />
          Deals
        </button>
      </div>

      {/* Cuisine Types */}
      <div className="space-y-1.5">
        <button
          onClick={() => toggleSection('cuisine')}
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground"
        >
          <span>Cuisine {filters.cuisineTypes.length > 0 && `(${filters.cuisineTypes.length})`}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', expandedSection === 'cuisine' && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {expandedSection === 'cuisine' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 pt-1">
                {CUISINE_TYPES.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => toggleCuisine(cuisine)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs border transition-colors',
                      filters.cuisineTypes.includes(cuisine)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary',
                    )}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating */}
      <div className="space-y-1.5">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground"
        >
          <span>Minimum Rating {filters.rating > 0 && `(${filters.rating}+)`}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', expandedSection === 'rating' && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {expandedSection === 'rating' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pt-1">
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => update({ rating: r })}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border transition-colors',
                      filters.rating === r
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border',
                    )}
                  >
                    {r > 0 && <Star className="h-3 w-3" />}
                    {r > 0 ? `${r}+` : 'Any'}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dietary */}
      <div className="space-y-1.5">
        <button
          onClick={() => toggleSection('dietary')}
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground"
        >
          <span>Dietary {filters.dietaryFilters.length > 0 && `(${filters.dietaryFilters.length})`}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', expandedSection === 'dietary' && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {expandedSection === 'dietary' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 pt-1">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleDietary(opt.id)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs border transition-colors',
                      filters.dietaryFilters.includes(opt.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Distance */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Max Distance: {filters.maxDistance < 1 ? `${Math.round(filters.maxDistance * 1000)}m` : `${filters.maxDistance}km`}
        </label>
        <input
          type="range"
          min={1}
          max={25}
          step={1}
          value={filters.maxDistance}
          onChange={(e) => update({ maxDistance: Number(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1km</span>
          <span>25km</span>
        </div>
      </div>
    </div>
  )
}
