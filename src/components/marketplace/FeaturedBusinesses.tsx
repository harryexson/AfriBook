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
                href={`/business/${business.id}`}
                className="group flex h-full w-[300px] flex-col overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/40 hover:shadow-xl sm:w-[340px]"
              >
                {/* Cover */}
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-surface-tertiary">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-gold text-4xl font-semibold text-white shadow-gold-lg transition-transform duration-300 group-hover:scale-105">
                    {business.name.charAt(0)}
                  </div>
                  <span className="absolute right-4 top-4 rounded-full bg-dark-700/80 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm">
                    {business.category}
                  </span>
                  <ArrowUpRight className="absolute left-4 top-4 h-5 w-5 text-text-tertiary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-[-0.01em] text-text-primary transition-colors group-hover:text-amber-600">
                      {business.name}
                    </h3>
                    <span className="flex items-center gap-1 text-sm font-semibold text-text-primary">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      {business.rating}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                    <MapPin className="h-4 w-4 text-text-tertiary" />
                    {business.location}
                    <span className="text-text-tertiary">
                      · {business.reviewCount} reviews
                    </span>
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
