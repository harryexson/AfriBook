'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Bike,
  TrendingUp,
  ArrowRight,
  Utensils,
  Flame,
  ShoppingBag,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cuisines = [
  { name: 'African', emoji: '🍲', count: 450 },
  { name: 'Nigerian', emoji: '🥘', count: 320 },
  { name: 'Kenyan', emoji: '🍛', count: 280 },
  { name: 'Ethiopian', emoji: '🫓', count: 180 },
  { name: 'South African', emoji: '🥩', count: 220 },
  { name: 'Ghanaian', emoji: '🍚', count: 200 },
  { name: 'Grills & BBQ', emoji: '🔥', count: 350 },
  { name: 'Fast Food', emoji: '🍔', count: 500 },
  { name: 'Healthy', emoji: '🥗', count: 150 },
  { name: 'Bakery', emoji: '🍞', count: 120 },
];

const restaurants = [
  {
    name: 'Mama Nkechi\'s Kitchen',
    cuisine: 'Nigerian',
    rating: 4.9,
    reviews: 567,
    deliveryTime: '25-35 min',
    deliveryFee: '$1.50',
    priceRange: '$$',
    address: 'Lekki, Lagos',
    initials: 'MN',
    featured: true,
    promo: 'Free delivery on first order',
  },
  {
    name: 'Carnivore Nairobi',
    cuisine: 'Kenyan / BBQ',
    rating: 4.8,
    reviews: 432,
    deliveryTime: '30-40 min',
    deliveryFee: '$2.00',
    priceRange: '$$$',
    address: 'Westlands, Nairobi',
    initials: 'CN',
    featured: true,
    promo: null,
  },
  {
    name: 'Yejoka Ethiopian',
    cuisine: 'Ethiopian',
    rating: 4.7,
    reviews: 289,
    deliveryTime: '30-45 min',
    deliveryFee: '$1.80',
    priceRange: '$$',
    address: 'Sandton, Johannesburg',
    initials: 'YE',
    featured: false,
    promo: '20% off orders over $20',
  },
  {
    name: 'Buka Hut',
    cuisine: 'Ghanaian',
    rating: 4.6,
    reviews: 345,
    deliveryTime: '20-30 min',
    deliveryFee: '$1.20',
    priceRange: '$',
    address: 'Osu, Accra',
    initials: 'BH',
    featured: false,
    promo: null,
  },
  {
    name: 'Spice Route',
    cuisine: 'Pan-African',
    rating: 4.8,
    reviews: 198,
    deliveryTime: '35-45 min',
    deliveryFee: '$2.50',
    priceRange: '$$$',
    address: 'Kigali',
    initials: 'SR',
    featured: true,
    promo: 'New: Try our jollof special',
  },
  {
    name: 'QuickBite Lagos',
    cuisine: 'Fast Food',
    rating: 4.5,
    reviews: 678,
    deliveryTime: '15-25 min',
    deliveryFee: '$0.99',
    priceRange: '$',
    address: 'Victoria Island, Lagos',
    initials: 'QB',
    featured: false,
    promo: null,
  },
];

const popularDishes = [
  { name: 'Jollof Rice Special', restaurant: 'Mama Nkechi\'s', price: '$8.50', initials: 'JR' },
  { name: 'Nyama Choma Platter', restaurant: 'Carnivore Nairobi', price: '$15.00', initials: 'NC' },
  { name: 'Injera Combo', restaurant: 'Yejoka Ethiopian', price: '$12.00', initials: 'IC' },
  { name: 'Waakye Bowl', restaurant: 'Buka Hut', price: '$6.50', initials: 'WB' },
  { name: 'Suya & Fries', restaurant: 'QuickBite Lagos', price: '$7.00', initials: 'SF' },
  { name: 'Chapati Wrap', restaurant: 'Spice Route', price: '$9.00', initials: 'CW' },
];

const steps = [
  {
    step: '01',
    title: 'Choose Your Meal',
    description: 'Browse restaurants and menus near you. Filter by cuisine, price, or rating.',
  },
  {
    step: '02',
    title: 'Place Your Order',
    description: 'Customize your meal, add to cart, and checkout securely in seconds.',
  },
  {
    step: '03',
    title: 'Track & Enjoy',
    description: 'Watch your order in real-time as our drivers bring it right to your door.',
  },
];

export default function FoodPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-600 via-orange-500 to-red-500 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div
              variants={fadeIn}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Flame className="w-4 h-4" />
              Free delivery on your first order!
            </motion.div>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Delicious Food,{' '}
              <span className="text-dark-300">Delivered to You</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              From local favorites to gourmet experiences — order from the best
              restaurants across Africa and get it delivered fast.
            </motion.p>
            <motion.div variants={fadeIn} className="max-w-2xl mx-auto">
              <div className="relative bg-white rounded-2xl p-2 shadow-xl flex gap-2">
                <div className="relative flex-1 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500 ml-3" />
                  <input
                    type="text"
                    placeholder="Enter your delivery address"
                    className="w-full py-3 pr-4 text-text-primary placeholder-text-tertiary focus:outline-none"
                  />
                </div>
                <div className="w-px bg-border" />
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search restaurants or dishes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none"
                  />
                </div>
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                  Find Food
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cuisine Filters */}
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
              Explore by Cuisine
            </h2>
            <p className="text-text-secondary">Discover the flavors of Africa</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          >
            {cuisines.map((cuisine) => (
              <motion.button
                key={cuisine.name}
                variants={fadeIn}
                className="flex flex-col items-center gap-2 min-w-[100px] p-4 rounded-2xl bg-surface-secondary border border-border hover:border-amber-500/50 transition-colors"
              >
                <span className="text-3xl">{cuisine.emoji}</span>
                <span className="text-sm font-medium text-text-primary">{cuisine.name}</span>
                <span className="text-xs text-text-tertiary">{cuisine.count}+</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-12 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Featured Restaurants
              </h2>
              <p className="text-text-secondary">Top picks near you</p>
            </div>
            <Link
              href="#"
              className="text-amber-500 hover:text-amber-600 font-medium text-sm flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {restaurants.map((restaurant) => (
              <motion.div
                key={restaurant.name}
                variants={fadeIn}
                className="bg-surface rounded-2xl border border-border hover:border-amber-500/50 transition-colors overflow-hidden"
              >
                {/* Image placeholder */}
                <div className="h-40 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-xl">
                      {restaurant.initials}
                    </span>
                  </div>
                  {restaurant.promo && (
                    <div className="absolute bottom-3 left-3 bg-dark-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      {restaurant.promo}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-heading font-bold text-text-primary">
                        {restaurant.name}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {restaurant.cuisine} · {restaurant.priceRange}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="text-sm font-bold text-text-primary">
                        {restaurant.rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {restaurant.deliveryTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bike className="w-4 h-4" />
                      {restaurant.deliveryFee}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {restaurant.address}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Dishes */}
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
              Popular Dishes
            </h2>
            <p className="text-text-secondary">Most ordered items this week</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {popularDishes.map((dish) => (
              <motion.div
                key={dish.name}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl p-4 border border-border hover:border-amber-500/50 transition-colors text-center cursor-pointer"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Utensils className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-text-primary text-sm mb-1">
                  {dish.name}
                </h3>
                <p className="text-text-tertiary text-xs mb-2">{dish.restaurant}</p>
                <span className="text-amber-500 font-bold text-sm">{dish.price}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-4">
              How Food Delivery Works
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-heading font-bold text-xl">{step.step}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
