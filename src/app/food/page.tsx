'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  MapPin,
  Star,
  Clock,
  Truck,
  ChevronDown,
  Navigation,
  Sparkles,
} from 'lucide-react'
import FeaturedRestaurants from '@/components/food/FeaturedRestaurants'
import PhoneMockup from '@/components/showcase/PhoneMockup'
import { FoodAppScreen } from '@/components/showcase/AppScreens'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const categories = [
  'All',
  'Fast Food',
  'Nigerian',
  'Ethiopian',
  'Moroccan',
  'Seafood',
  'Vegetarian',
  'Chinese',
]

const sortOptions = ['Recommended', 'Rating', 'Delivery Time', 'Price'] as const
type SortOption = (typeof sortOptions)[number]

interface Restaurant {
  id: string
  name: string
  cuisine: string
  category: string[]
  rating: number
  deliveryTime: string
  deliveryTimeMinutes: number
  deliveryFee: string
  priceRange: string
  location: string
  initials: string
  featured: boolean
  gradient: string
}

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: "Mama Nkechi's Kitchen",
    cuisine: 'Nigerian',
    category: ['Nigerian'],
    rating: 4.9,
    deliveryTime: '25-35 min',
    deliveryTimeMinutes: 30,
    deliveryFee: '$1.50',
    priceRange: '$$',
    location: 'Lekki, Lagos',
    initials: 'MN',
    featured: true,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: '2',
    name: 'Carnivore Nairobi',
    cuisine: 'Kenyan / BBQ',
    category: ['Seafood'],
    rating: 4.8,
    deliveryTime: '30-40 min',
    deliveryTimeMinutes: 35,
    deliveryFee: '$2.00',
    priceRange: '$$$',
    location: 'Westlands, Nairobi',
    initials: 'CN',
    featured: true,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: '3',
    name: 'Addis in Cape',
    cuisine: 'Ethiopian',
    category: ['Ethiopian'],
    rating: 4.7,
    deliveryTime: '30-45 min',
    deliveryTimeMinutes: 37,
    deliveryFee: '$1.80',
    priceRange: '$$',
    location: 'Woodstock, Cape Town',
    initials: 'AC',
    featured: false,
    gradient: 'from-yellow-500 to-amber-600',
  },
  {
    id: '4',
    name: 'Medina Grill',
    cuisine: 'Moroccan',
    category: ['Moroccan'],
    rating: 4.6,
    deliveryTime: '35-50 min',
    deliveryTimeMinutes: 42,
    deliveryFee: '$2.20',
    priceRange: '$$',
    location: 'Guéliz, Marrakech',
    initials: 'MG',
    featured: false,
    gradient: 'from-red-500 to-rose-600',
  },
  {
    id: '5',
    name: 'Lagos Street Bites',
    cuisine: 'Fast Food / Nigerian',
    category: ['Fast Food', 'Nigerian'],
    rating: 4.5,
    deliveryTime: '15-25 min',
    deliveryTimeMinutes: 20,
    deliveryFee: '$0.99',
    priceRange: '$',
    location: 'Victoria Island, Lagos',
    initials: 'LB',
    featured: false,
    gradient: 'from-orange-500 to-red-600',
  },
  {
    id: '6',
    name: 'Zanzibar Spice House',
    cuisine: 'Seafood / Tanzanian',
    category: ['Seafood'],
    rating: 4.8,
    deliveryTime: '30-40 min',
    deliveryTimeMinutes: 35,
    deliveryFee: '$1.70',
    priceRange: '$$',
    location: 'Stone Town, Zanzibar',
    initials: 'ZS',
    featured: true,
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: '7',
    name: 'Green Leaf Vegan',
    cuisine: 'Vegetarian / Pan-African',
    category: ['Vegetarian'],
    rating: 4.4,
    deliveryTime: '25-35 min',
    deliveryTimeMinutes: 30,
    deliveryFee: '$1.40',
    priceRange: '$$',
    location: 'Kigali, Rwanda',
    initials: 'GL',
    featured: false,
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: '8',
    name: 'Dragon Wok Accra',
    cuisine: 'Chinese / West African Fusion',
    category: ['Chinese'],
    rating: 4.3,
    deliveryTime: '20-30 min',
    deliveryTimeMinutes: 25,
    deliveryFee: '$1.30',
    priceRange: '$',
    location: 'Osu, Accra',
    initials: 'DW',
    featured: false,
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    id: '9',
    name: 'Buka Hut',
    cuisine: 'Ghanaian',
    category: ['Nigerian', 'Fast Food'],
    rating: 4.6,
    deliveryTime: '20-30 min',
    deliveryTimeMinutes: 25,
    deliveryFee: '$1.20',
    priceRange: '$',
    location: 'East Legon, Accra',
    initials: 'BH',
    featured: false,
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: '10',
    name: 'Spice Route Kigali',
    cuisine: 'Pan-African',
    category: ['Moroccan', 'Ethiopian'],
    rating: 4.8,
    deliveryTime: '35-45 min',
    deliveryTimeMinutes: 40,
    deliveryFee: '$2.50',
    priceRange: '$$$',
    location: 'Kigali, Rwanda',
    initials: 'SR',
    featured: true,
    gradient: 'from-indigo-500 to-blue-600',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating) ? 'fill-amber-500 text-amber-500' : 'text-text-tertiary'
          }`}
        />
      ))}
    </div>
  )
}

export default function FoodPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<SortOption>('Recommended')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(
          `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        )
        setLocating(false)
      },
      () => {
        setUserLocation('Location unavailable')
        setLocating(false)
      }
    )
  }

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      )
    }

    if (selectedCategory !== 'All') {
      result = result.filter((r) => r.category.includes(selectedCategory))
    }

    switch (sortBy) {
      case 'Rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'Delivery Time':
        result.sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes)
        break
      case 'Price':
        result.sort((a, b) => a.priceRange.length - b.priceRange.length)
        break
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return result
  }, [searchQuery, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_82%_12%,rgba(244,63,94,0.1),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_-8%_100%,rgba(245,158,11,0.14),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AfriBook Food
              </motion.span>
              <motion.h1
                variants={fadeIn}
                className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl"
              >
                Africa&apos;s best kitchens,
                <span className="block text-gradient-gold">delivered.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
                Order from the best African restaurants — Nigerian, Ethiopian, Moroccan,
                and more — and get it delivered to your door.
              </motion.p>

              <motion.div variants={fadeIn} className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-amber-950 shadow-gold-lg transition-colors hover:bg-amber-400 disabled:opacity-60"
                >
                  <Navigation className="h-4 w-4" />
                  {locating ? 'Locating...' : userLocation ? 'Location Set' : 'Use My Location'}
                </button>
                <div className="relative flex-1 sm:max-w-sm">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                  <input
                    type="text"
                    placeholder="Search restaurants or dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-3.5 pl-12 pr-4 text-white placeholder:text-white/35 backdrop-blur-md focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3"
              >
                {[
                  { label: 'Restaurants', value: '5,000+' },
                  { label: 'Avg. delivery', value: '28 min' },
                  { label: 'Rating', value: '4.8★' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-heading text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wider text-white/40">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Phone showcase */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.25 }}
              className="relative flex justify-center"
            >
              <PhoneMockup glow="rose">
                <FoodAppScreen />
              </PhoneMockup>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -left-6 top-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
                    <Clock className="h-5 w-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">25-35 min</p>
                    <p className="text-xs text-white/50">Fastest delivery</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-6 bottom-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <p className="text-xs text-white/50">Order total</p>
                <p className="text-sm font-bold text-white">3 items · $24.50</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <Truck className="h-3 w-3" /> Free delivery
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Category Filters & Sort */}
      <section className="sticky top-0 z-20 border-b border-border bg-surface/80 py-6 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="-mb-1 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-amber-500 text-white shadow-gold'
                      : 'border border-border bg-surface-secondary text-text-secondary hover:border-amber-500/50 hover:text-text-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-amber-500/50"
              >
                {sortBy}
                <ChevronDown className="h-4 w-4 text-text-tertiary" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === option
                          ? 'bg-amber-500/10 font-medium text-amber-500'
                          : 'text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Grid */}
      <section className="py-12 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-8"
          >
            <h2 className="mb-2 font-heading text-2xl font-bold text-text-primary">
              All Restaurants
            </h2>
            <p className="text-text-secondary">
              {filteredRestaurants.length} restaurant
              {filteredRestaurants.length !== 1 ? 's' : ''} found
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredRestaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                variants={fadeIn}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface-secondary transition-colors hover:border-amber-500/50"
              >
                <div
                  className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${restaurant.gradient}`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                    <span className="font-heading text-xl font-bold text-white">
                      {restaurant.initials}
                    </span>
                  </div>
                  {restaurant.featured && (
                    <div className="absolute right-3 top-3 rounded-full bg-dark-900/70 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
                      ★ Featured
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-1 flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-text-primary transition-colors group-hover:text-amber-500">
                        {restaurant.name}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {restaurant.cuisine} · {restaurant.priceRange}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="text-sm font-bold text-text-primary">
                        {restaurant.rating}
                      </span>
                    </div>
                  </div>

                  <StarRating rating={restaurant.rating} />

                  <div className="mt-3 flex items-center gap-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-text-tertiary" />
                      {restaurant.deliveryTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4 text-text-tertiary" />
                      {restaurant.deliveryFee}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-text-tertiary">
                    <MapPin className="h-3 w-3" />
                    {restaurant.location}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredRestaurants.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-lg text-text-secondary">
                No restaurants found. Try a different search or category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Restaurants Section */}
      <FeaturedRestaurants />
    </div>
  )
}
