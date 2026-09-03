'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, X, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import type { CountryConfig } from '@/lib/localization/countries'
import BusinessCard from '@/components/marketplace/BusinessCard'
import SearchHeader from '@/components/marketplace/SearchHeader'
import FilterSidebar from '@/components/marketplace/FilterSidebar'
import type { FilterState } from '@/components/marketplace/FilterSidebar'
import { getCountryBusinesses, getCountryServices } from '@/lib/countries-data'
import CategoryIcon from '@/components/marketplace/CategoryIcon'

const ITEMS_PER_PAGE = 6
const PRICE_RANGE: [number, number] = [0, 200000]
const SUGGESTIONS = ['Hair stylist', 'Plumber near me', 'Food delivery', 'Computer repair', 'Cleaning service', 'Fashion designer', 'Doctor appointment', 'Massage therapy']

export default function SearchPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const country = getCountryConfig(countryCode) as CountryConfig | undefined

  const MOCK_BUSINESSES = useMemo(() => getCountryBusinesses(countryCode), [countryCode])
  const MOCK_SERVICES = useMemo(() => getCountryServices(countryCode), [countryCode])

  const initialQuery = searchParams?.get('q') ?? ''
  const initialCategory = searchParams?.get('category') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMap, setShowMap] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const priceRange = PRICE_RANGE
  const [filters, setFilters] = useState<FilterState>({
    categories: initialCategory ? [initialCategory] : [],
    priceMin: priceRange[0],
    priceMax: priceRange[1],
    rating: 0,
    maxDistance: 0,
    availableNow: false,
    openNow: false,
    deliveryAvailable: false,
  })

  const activeFilterCount = useMemo(() => {
    let count = filters.categories.length
    if (filters.rating > 0) count++
    if (filters.maxDistance > 0) count++
    if (filters.availableNow) count++
    if (filters.openNow) count++
    if (filters.deliveryAvailable) count++
    return count
  }, [filters])

  // `useSearchParams()` can return a new object identity on every render
  // (a known Next.js App Router gotcha) even when the URL hasn't changed —
  // depending on the object itself here turned this into an effect that
  // fires on every render, silently resetting `filters.categories` back to
  // the URL's value in an infinite loop and fighting any local category
  // click (both this page's own pill bar and FilterSidebar's checkboxes)
  // before the click could ever take visible effect. Depend on the
  // stringified params instead — a primitive that's only unequal when the
  // query actually changes.
  const searchParamsKey = searchParams?.toString() ?? ''
  useEffect(() => {
    setQuery(searchParams?.get('q') ?? '')
    setFilters((f) => ({
      ...f,
      categories: searchParams?.get('category') ? [searchParams.get('category') as string] : [],
    }))
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey])

  const filteredBusinesses = useMemo(() => {
    let results = MOCK_BUSINESSES

    if (query) {
      const q = query.toLowerCase()
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (filters.categories.length > 0) {
      // Match on the business's own category field OR its tags. Curated
      // and generated businesses only ever set `category` to a broad
      // parent (e.g. "Beauty & Wellness") — the granular gig subcategories
      // (Barber, Spa, Photographer, ...) only show up as free-text tags
      // ("barber", "haircut"). Matching category-only meant picking any of
      // those granular filters always returned zero results even for a
      // business that's exactly that kind of provider.
      const wanted = filters.categories.map((c) => c.toLowerCase())
      results = results.filter((b) =>
        wanted.includes(b.category.toLowerCase()) ||
        b.tags.some((t) => wanted.includes(t.toLowerCase())),
      )
    }

    if (filters.priceMin > 0 || filters.priceMax < priceRange[1]) {
      results = results.filter((b) => {
        const services = MOCK_SERVICES.filter((s) => s.businessId === b.id)
        if (services.length === 0) return true
        const avgPrice = services.reduce((a, s) => a + s.price, 0) / services.length
        return avgPrice >= filters.priceMin && avgPrice <= filters.priceMax
      })
    }

    if (filters.rating > 0) {
      results = results.filter((b) => b.rating >= filters.rating)
    }

    if (filters.deliveryAvailable) {
      results = results.filter((b) => b.deliveryAvailable)
    }

    switch (sort) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'price_asc':
      case 'price_desc':
        break
      case 'newest':
        break
    }

    return results
  }, [query, sort, filters, MOCK_BUSINESSES, MOCK_SERVICES, priceRange])

  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE)
  const paginatedResults = filteredBusinesses.slice(0, page * ITEMS_PER_PAGE)

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    setPage(1)
    const sp = new URLSearchParams(searchParams?.toString())
    if (q) sp.set('q', q)
    else sp.delete('q')
    router.replace(`/${params?.country}/search?${sp.toString()}`, { scroll: false })
  }, [router, searchParams, params?.country])

  const handleSortChange = useCallback((s: string) => {
    setSort(s)
    setPage(1)
  }, [])

  const categories = country?.categories ?? ['Home Services', 'Healthcare', 'Education', 'Technology', 'Food & Dining', 'Beauty & Wellness']

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <SearchHeader
          query={query}
          onQueryChange={handleQueryChange}
          totalResults={filteredBusinesses.length}
          sort={sort}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setShowFilters(!showFilters)}
          suggestions={SUGGESTIONS}
        />

        {/* Category pill bar — adapted from Sarwisi's horizontal category
            browsing strip; icons come from the same CATEGORY_ICON_MAP the
            homepage uses, so a category reads the same icon everywhere. */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-6 scrollbar-none">
          <button
            onClick={() => { setFilters((f) => ({ ...f, categories: [] })); setPage(1) }}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              filters.categories.length === 0
                ? 'border-amber-500 bg-amber-500 text-amber-950'
                : 'border-border text-text-secondary hover:border-amber-500/40',
            )}
          >
            All
          </button>
          {categories.map((cat) => {
            const active = filters.categories.includes(cat)
            return (
              <button
                key={cat}
                onClick={() => {
                  setFilters((f) => ({ ...f, categories: active ? [] : [cat] }))
                  setPage(1)
                }}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-amber-500 bg-amber-500 text-amber-950'
                    : 'border-border text-text-secondary hover:border-amber-500/40',
                )}
              >
                <CategoryIcon name={cat} className="w-4 h-4" />
                {cat}
              </button>
            )
          })}
        </div>

        <div className="flex gap-8 mt-4">
          {/* Filter Sidebar - Desktop */}
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={(f) => { setFilters(f); setPage(1) }}
            priceRange={priceRange}
            className="hidden lg:block"
          />

          {/* Overlay on mobile */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setShowFilters(false)}
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  className="absolute left-0 top-0 bottom-0 w-80 bg-surface p-6 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-text-primary">Filters</h3>
                    <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <FilterSidebar
                    categories={categories}
                    filters={filters}
                    onChange={(f) => { setFilters(f); setPage(1) }}
                    priceRange={priceRange}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Map toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowMap(!showMap)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  showMap ? 'border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-border text-text-secondary hover:border-amber-500/30'
                )}
              >
                <Map className="w-4 h-4" />
                Map view
              </button>
            </div>

            {/* Map placeholder */}
            <AnimatePresence>
              {showMap && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 240, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden rounded-xl mb-6"
                >
                  <div className="h-60 bg-surface-secondary border border-border rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-10 h-10 text-text-tertiary mx-auto" />
                      <p className="mt-2 text-sm text-text-secondary">Map view loading...</p>
                      <p className="text-xs text-text-tertiary mt-1">{filteredBusinesses.length} businesses in this area</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results grid/list */}
            {paginatedResults.length > 0 ? (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'flex flex-col gap-4'
              )}>
                {paginatedResults.map((business, i) => (
                  viewMode === 'grid' ? (
                    <BusinessCard key={business.id} business={business} countryCode={countryCode} index={i} />
                  ) : (
                    <motion.div
                      key={business.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-5 bg-surface border border-border rounded-xl p-4 hover:shadow-md hover:border-amber-500/30 transition-all"
                    >
                      <div className="w-24 h-24 rounded-xl bg-surface-secondary shrink-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-amber-500">{business.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-amber-500 uppercase">{business.category}</span>
                        <h3 className="text-lg font-bold text-text-primary">{business.name}</h3>
                        <p className="text-sm text-text-secondary line-clamp-1">{business.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary">
                          <span>★ {business.rating.toFixed(1)} ({business.reviewCount})</span>
                          <span>{business.address?.city}</span>
                          {business.deliveryAvailable && <span className="text-emerald-500">Delivery</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <span className="text-xs text-text-tertiary">{((i * 7) % 10) + 1} km away</span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                          Book
                        </span>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
                  <Map className="w-8 h-8 text-text-tertiary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">No results found</h3>
                <p className="text-text-secondary mt-1">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setFilters({ categories: [], priceMin: 0, priceMax: 200000, rating: 0, maxDistance: 0, availableNow: false, openNow: false, deliveryAvailable: false }); setQuery('') }}
                  className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && paginatedResults.length < filteredBusinesses.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Load more ({filteredBusinesses.length - paginatedResults.length} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
