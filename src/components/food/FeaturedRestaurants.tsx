'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, ArrowRight } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

interface Restaurant {
  name: string
  cuisine: string
  rating: number
  deliveryTime: string
  deliveryFee: string
  location: string
  initials: string
  featured: boolean
  gradient: string
}

const featuredRestaurants: Restaurant[] = [
  {
    name: 'Lagos Kitchen',
    cuisine: 'Nigerian',
    rating: 4.9,
    deliveryTime: '25-35 min',
    deliveryFee: '$1.50',
    location: 'Lekki, Lagos',
    initials: 'LK',
    featured: true,
    gradient: 'from-amber-500/30 to-orange-500/25',
  },
  {
    name: 'Nairobi Bites',
    cuisine: 'Kenyan',
    rating: 4.8,
    deliveryTime: '30-40 min',
    deliveryFee: '$2.00',
    location: 'Westlands, Nairobi',
    initials: 'NB',
    featured: true,
    gradient: 'from-emerald-500/30 to-teal-500/25',
  },
  {
    name: 'Accra Flavors',
    cuisine: 'Ghanaian',
    rating: 4.7,
    deliveryTime: '20-30 min',
    deliveryFee: '$1.20',
    location: 'Osu, Accra',
    initials: 'AF',
    featured: false,
    gradient: 'from-yellow-500/30 to-orange-500/25',
  },
  {
    name: 'Cape Town Grill',
    cuisine: 'South African',
    rating: 4.8,
    deliveryTime: '35-45 min',
    deliveryFee: '$2.50',
    location: 'Sandton, Cape Town',
    initials: 'CT',
    featured: true,
    gradient: 'from-blue-500/25 to-indigo-500/30',
  },
  {
    name: 'Cairo Eats',
    cuisine: 'Egyptian',
    rating: 4.6,
    deliveryTime: '25-35 min',
    deliveryFee: '$1.80',
    location: 'Zamalek, Cairo',
    initials: 'CE',
    featured: false,
    gradient: 'from-orange-500/30 to-red-500/25',
  },
  {
    name: 'Dar es Salaam Delights',
    cuisine: 'Tanzanian',
    rating: 4.7,
    deliveryTime: '30-40 min',
    deliveryFee: '$1.60',
    location: 'Masaki, Dar es Salaam',
    initials: 'DD',
    featured: false,
    gradient: 'from-purple-500/30 to-violet-500/25',
  },
]

export default function FeaturedRestaurants() {
  return (
    <section className="py-16 sm:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <p className="text-sm uppercase tracking-[0.28em] text-amber-500">
              Popular picks
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Handpicked restaurants for your next order
            </h2>
          </motion.div>

          <Link
            href="/food"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-500/20"
          >
            Explore restaurants
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {featuredRestaurants.map((restaurant) => (
            <motion.div
              key={restaurant.name}
              variants={fadeIn}
              className="group overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`relative h-52 overflow-hidden bg-gradient-to-br ${restaurant.gradient}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_35%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.18),_transparent_45%)]" />
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
                  {restaurant.deliveryFee}
                </div>
                <div className="absolute right-5 top-5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-amber-950 shadow-sm">
                  {restaurant.deliveryTime}
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary group-hover:text-amber-500 transition-colors">
                      {restaurant.name}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {restaurant.cuisine}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-600">
                    <Star className="h-4 w-4" />
                    {restaurant.rating}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                    <p className="font-semibold text-text-primary">Delivery fee</p>
                    <p>{restaurant.deliveryFee}</p>
                  </div>
                  <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                    <p className="font-semibold text-text-primary">Location</p>
                    <p>{restaurant.location}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {restaurant.featured && (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                      Featured
                    </span>
                  )}
                  <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary">
                    {restaurant.cuisine}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
