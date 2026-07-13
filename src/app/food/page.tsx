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
} from 'lucide-react'
import FeaturedRestaurants from '@/components/food/FeaturedRestaurants'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
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
    name: 'Mama Nkechi\'s Kitchen',
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
    gradient: 'from-amber-500/20 to-orange-500/20',
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
    gradient: 'from-emerald-500/20 to-teal-500/20',
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
    gradient: 'from-yellow-500/20 to-amber-500/20',
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
    gradient: 'from-red-500/20 to-rose-500/20',
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
    gradient: 'from-orange-500/20 to-red-500/20',
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
    gradient: 'from-cyan-500/20 to-blue-500/20',
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
    gradient: 'from-green-500/20 to-emerald-500/20',
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
    gradient: 'from-purple-500/20 to-violet-500/20',
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
    gradient: 'from-pink-500/20 to-rose-500/20',
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
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
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
      <section className="relative bg-gradient-to-br from-amber-600 via-orange-500 to-red-500 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Discover Restaurants{' '}
              <span className="text-dark-300">Near You</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Order from the best African restaurants and get it delivered to your door.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleUseLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 bg-white text-amber-600 font-medium px-6 py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                <Navigation className="w-4 h-4" />
                {locating ? 'Locating...' : userLocation ? 'Location Set' : 'Use My Location'}
              </button>
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search restaurants or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/95 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Filters & Sort */}
      <section className="py-6 bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-amber-500 text-white'
                      : 'bg-surface-secondary border border-border text-text-secondary hover:border-amber-500/50 hover:text-text-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-primary hover:border-amber-500/50 transition-colors"
              >
                {sortBy}
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl border border-border shadow-xl z-30 overflow-hidden">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === option
                          ? 'bg-amber-500/10 text-amber-500 font-medium'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-8"
          >
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
              All Restaurants
            </h2>
            <p className="text-text-secondary">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRestaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl border border-border hover:border-amber-500/50 transition-colors overflow-hidden group cursor-pointer"
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
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-heading font-bold text-text-primary group-hover:text-amber-500 transition-colors">
                        {restaurant.name}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {restaurant.cuisine} · {restaurant.priceRange}
                      </p>
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

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-secondary text-lg">
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
