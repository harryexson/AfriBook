'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, MapPin, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'

interface Business {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  location: string
}

const FEATURED: Business[] = [
  {
    id: '1', name: 'Lagos Fresh Market', category: 'Food & Grocery',
    rating: 4.8, reviewCount: 234, location: 'Lagos, Nigeria',
  },
  {
    id: '2', name: 'Nairobi Beauty Studio', category: 'Beauty & Wellness',
    rating: 4.9, reviewCount: 189, location: 'Nairobi, Kenya',
  },
  {
    id: '3', name: 'Cape Town Rides', category: 'Transportation',
    rating: 4.7, reviewCount: 567, location: 'Cape Town, SA',
  },
  {
    id: '4', name: 'Accra Fashion House', category: 'Fashion & Tailoring',
    rating: 4.6, reviewCount: 142, location: 'Accra, Ghana',
  },
  {
    id: '5', name: 'Cairo Tech Repair', category: 'Electronics & Repairs',
    rating: 4.5, reviewCount: 98, location: 'Cairo, Egypt',
  },
  {
    id: '6', name: 'Dar Fresh Delivery', category: 'Food Delivery',
    rating: 4.8, reviewCount: 312, location: 'Dar es Salaam, TZ',
  },
]

export default function FeaturedBusinesses() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              Handpicked
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              Featured businesses
            </h2>
          </motion.div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-2.5 rounded-xl border border-border bg-surface transition-colors text-text-secondary hover:border-amber-500/40 hover:text-text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-2.5 rounded-xl border border-border bg-surface transition-colors text-text-secondary hover:border-amber-500/40 hover:text-text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {FEATURED.map((business, i) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="shrink-0 snap-start"
            >
              <Link
                href="/marketplace"
                className="group flex h-full w-[300px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white via-surface to-surface shadow-[0_28px_80px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_36px_90px_rgba(15,23,42,0.14)] sm:w-[340px]"
              >
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-surface-secondary">
                  <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-amber-300/15 blur-3xl" />
                  <div className="absolute -right-12 bottom-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-400 text-4xl font-semibold text-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                    {business.name.charAt(0)}
                  </div>
                  <span className="absolute right-4 top-4 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur-sm">
                    {business.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold tracking-[-0.02em] text-text-primary transition-colors group-hover:text-amber-600">
                        {business.name}
                      </h3>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      {business.rating}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-text-secondary">
                    <div className="inline-flex items-center gap-2 rounded-3xl bg-surface-secondary px-3 py-2">
                      <MapPin className="h-4 w-4 text-text-tertiary" />
                      <span>{business.location}</span>
                    </div>
                    <p className="text-text-tertiary">{business.reviewCount} reviews · High demand</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
