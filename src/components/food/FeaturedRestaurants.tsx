'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Clock, Truck, MapPin, ArrowRight } from 'lucide-react'

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
    gradient: 'from-amber-500/20 to-orange-500/20',
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
    gradient: 'from-emerald-500/20 to-teal-500/20',
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
    gradient: 'from-yellow-500/20 to-amber-500/20',
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
    gradient: 'from-blue-500/20 to-indigo-500/20',
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
    gradient: 'from-orange-500/20 to-red-500/20',
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
    gradient: 'from-purple-500/20 to-violet-500/20',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? 'text-amber-500 fill-amber-500'
              : 'text-text-tertiary'
          }`}
        />
      ))}
    </div>
  )
}

export default function FeaturedRestaurants() {
  return (
    <section className="py-16 sm:py-24 bg-surface-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
              Featured Restaurants
            </h2>
            <p className="mt-2 text-text-secondary">
              Top-rated kitchens across Africa
            </p>
          </motion.div>

          <Link
            href="/food"
            className="text-amber-500 hover:text-amber-600 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            View All Restaurants
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuredRestaurants.map((restaurant) => (
            <motion.div
              key={restaurant.name}
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border hover:border-amber-500/50 transition-colors overflow-hidden group"
            >
              <div className={`h-40 bg-gradient-to-br ${restaurant.gradient} flex items-center justify-center relative`}>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-heading font-bold text-xl">
                    {restaurant.initials}
                  </span>
                </div>
                {restaurant.featured && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Featured
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-bold text-text-primary group-hover:text-amber-500 transition-colors">
                      {restaurant.name}
                    </h3>
                    <p className="text-text-secondary text-sm">{restaurant.cuisine}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-text-primary">
                      {restaurant.rating}
                    </span>
                  </div>
                </div>

                <StarRating rating={restaurant.rating} />

                <div className="flex items-center gap-4 text-sm text-text-secondary mt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-text-tertiary" />
                    {restaurant.deliveryTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-text-tertiary" />
                    {restaurant.deliveryFee}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-text-tertiary mt-2">
                  <MapPin className="w-3 h-3" />
                  {restaurant.location}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
