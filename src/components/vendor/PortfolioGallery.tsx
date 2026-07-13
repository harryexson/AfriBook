'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, X, ChevronLeft, ChevronRight, Upload, Grid3X3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PortfolioGalleryItem {
  id: string
  url: string
  type: 'image' | 'video'
  title?: string
  category?: string
  caption?: string
  createdAt?: string
}

interface PortfolioGalleryProps {
  items: PortfolioGalleryItem[]
  showFilters?: boolean
  itemsPerPage?: number
}

const FILTER_TABS = ['All', 'Haircuts', 'Coloring', 'Styling', 'Nails', 'Before/After', 'Videos']

const CATEGORY_MAP: Record<string, string> = {
  All: '',
  Haircuts: 'Haircut',
  Coloring: 'Coloring',
  Styling: 'Styling',
  Nails: 'Nails',
  'Before/After': 'Before/After',
  Videos: 'video',
}

export default function PortfolioGallery({
  items,
  showFilters = true,
  itemsPerPage = 12,
}: PortfolioGalleryProps) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [visibleCount, setVisibleCount] = useState(itemsPerPage)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return items
    const match = CATEGORY_MAP[activeFilter]
    if (!match) return items
    if (activeFilter === 'Videos') return items.filter((i) => i.type === 'video')
    return items.filter((i) => i.category === match)
  }, [items, activeFilter])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const lightboxPrev = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length)
  }

  const lightboxNext = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % filtered.length)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-2xl bg-surface-secondary mb-4">
          <Grid3X3 className="w-8 h-8 text-text-tertiary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-1">
          No portfolio items yet
        </h3>
        <p className="text-sm text-text-secondary mb-4 max-w-xs">
          Showcase your best work to attract more customers.
        </p>
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Work
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveFilter(tab)
                setVisibleCount(itemsPerPage)
              }}
              className={cn(
                'shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeFilter === tab
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary border border-border',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
              className="break-inside-avoid"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => openLightbox(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openLightbox(idx)
                }}
                className="group relative rounded-2xl overflow-hidden bg-surface-secondary border border-border hover:border-amber-500/30 transition-all cursor-pointer"
              >
                <div className="relative">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.title ?? item.caption ?? 'Portfolio item'}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="relative">
                      <video
                        src={item.url}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="p-3 rounded-full bg-black/40 backdrop-blur-sm"
                        >
                          <Play className="w-5 h-5 text-white fill-white" />
                        </motion.div>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {item.category && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-xs font-medium text-white">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                {(item.title || item.caption) && (
                  <div className="p-3">
                    {item.title && (
                      <p className="text-sm font-medium text-text-primary truncate">
                        {item.title}
                      </p>
                    )}
                    {item.caption && (
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {item.caption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setVisibleCount((c) => c + itemsPerPage)}
            className="px-6 py-2.5 rounded-xl border border-border bg-surface-secondary text-sm font-medium text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
          >
            Load more ({filtered.length - visibleCount} remaining)
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={closeLightbox}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                lightboxPrev()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                lightboxNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <motion.div
              key={filtered[lightboxIndex].id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {filtered[lightboxIndex].type === 'image' ? (
                <img
                  src={filtered[lightboxIndex].url}
                  alt={filtered[lightboxIndex].title ?? ''}
                  className="max-h-[85vh] w-auto rounded-2xl object-contain"
                />
              ) : (
                <video
                  src={filtered[lightboxIndex].url}
                  controls
                  autoPlay
                  className="max-h-[85vh] w-auto rounded-2xl"
                />
              )}

              {(filtered[lightboxIndex].title || filtered[lightboxIndex].caption) && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl">
                  {filtered[lightboxIndex].title && (
                    <p className="text-white font-semibold text-lg">
                      {filtered[lightboxIndex].title}
                    </p>
                  )}
                  {filtered[lightboxIndex].caption && (
                    <p className="text-white/80 text-sm mt-1">
                      {filtered[lightboxIndex].caption}
                    </p>
                  )}
                </div>
              )}

              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                {lightboxIndex + 1} / {filtered.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
