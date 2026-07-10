'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, MapPin, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Business {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  location: string
  image: string
  gradient: string
}

const FEATURED: Business[] = [
  {
    id: '1', name: 'Lagos Fresh Market', category: 'Food & Grocery',
    rating: 4.8, reviewCount: 234, location: 'Lagos, Nigeria',
    image: '', gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: '2', name: 'Nairobi Beauty Studio', category: 'Beauty & Wellness',
    rating: 4.9, reviewCount: 189, location: 'Nairobi, Kenya',
    image: '', gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    id: '3', name: 'Cape Town Rides', category: 'Transportation',
    rating: 4.7, reviewCount: 567, location: 'Cape Town, SA',
    image: '', gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    id: '4', name: "Accra Fashion House", category: 'Fashion & Tailoring',
    rating: 4.6, reviewCount: 142, location: 'Accra, Ghana',
    image: '', gradient: 'from-purple-500/20 to-violet-500/20',
  },
  {
    id: '5', name: 'Cairo Tech Repair', category: 'Electronics & Repairs',
    rating: 4.5, reviewCount: 98, location: 'Cairo, Egypt',
    image: '', gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  {
    id: '6', name: 'Dar Fresh Delivery', category: 'Food Delivery',
    rating: 4.8, reviewCount: 312, location: 'Dar es Salaam, TZ',
    image: '', gradient: 'from-green-500/20 to-emerald-500/20',
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
    <section className="py-16 sm:py-24 bg-surface-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
              Featured businesses
            </h2>
            <p className="mt-2 text-text-secondary">
              Top-rated businesses across Africa
            </p>
          </motion.div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-xl bg-white dark:bg-dark-100 border border-border hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-xl bg-white dark:bg-dark-100 border border-border hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text-primary"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-none pb-4 -mx-4 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {FEATURED.map((business, i) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="snap-start shrink-0"
            >
              <Link
                href={`/business/${business.id}`}
                className="group block w-[300px] sm:w-[340px] bg-white dark:bg-dark-100 rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/30 transition-all duration-300"
              >
                {/* Image placeholder */}
                <div className={cn(
                  'h-44 bg-gradient-to-br flex items-center justify-center',
                  business.gradient
                )}>
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{business.name.charAt(0)}</span>
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                    {business.category}
                  </span>
                  <h3 className="text-lg font-bold text-text-primary mt-1 group-hover:text-amber-500 transition-colors">
                    {business.name}
                  </h3>

                  <div className="flex items-center gap-3 mt-3 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {business.rating}
                      <span className="text-text-tertiary">({business.reviewCount})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {business.location}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500 group-hover:gap-2 transition-all">
                      Book Now
                      <ArrowRight className="w-4 h-4" />
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
