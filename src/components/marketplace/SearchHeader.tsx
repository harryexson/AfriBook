'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X, SlidersHorizontal, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchHeaderProps {
  query: string
  onQueryChange: (q: string) => void
  totalResults: number
  sort: string
  onSortChange: (sort: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  activeFilterCount: number
  onToggleFilters: () => void
  className?: string
  suggestions?: string[]
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'distance', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
]

export default function SearchHeader({
  query,
  onQueryChange,
  totalResults,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeFilterCount,
  onToggleFilters,
  className,
  suggestions = [],
}: SearchHeaderProps) {
  const [localQuery, setLocalQuery] = useState(query)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const debouncedQuery = useDebounce(localQuery, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onQueryChange(debouncedQuery)
  }, [debouncedQuery, onQueryChange])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const currentSort = SORT_OPTIONS.find((o) => o.value === sort)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search businesses, services, products..."
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
          {localQuery && (
            <button onClick={() => { setLocalQuery(''); inputRef.current?.focus() }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface-tertiary transition-colors">
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-20"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => { setLocalQuery(s); setShowSuggestions(false) }}
                  className="w-full px-4 py-2.5 text-sm text-left text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Sort */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:border-amber-500/30 transition-all whitespace-nowrap"
          >
            {currentSort?.label ?? 'Sort'}
            <ChevronDown className={cn('w-4 h-4 transition-transform', sortOpen && 'rotate-180')} />
          </button>
          {sortOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-20"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSortChange(opt.value); setSortOpen(false) }}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm text-left transition-colors',
                    sort === opt.value
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* View Toggle */}
        <div className="hidden sm:flex items-center bg-surface-secondary border border-border rounded-xl p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-surface shadow-sm text-amber-500' : 'text-text-tertiary hover:text-text-secondary')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-surface shadow-sm text-amber-500' : 'text-text-tertiary hover:text-text-secondary')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Filter toggle (mobile) */}
        <button
          onClick={onToggleFilters}
          className="lg:hidden relative p-3 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:border-amber-500/30 transition-all"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Results count + active filters */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-text-secondary">
          <span className="font-semibold text-text-primary">{totalResults}</span> results found
        </p>
        {activeFilterCount > 0 && (
          <button
            onClick={onToggleFilters}
            className="hidden lg:flex items-center gap-1.5 text-amber-500 hover:text-amber-600 font-medium transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount} active filters
          </button>
        )}
      </div>
    </div>
  )
}
