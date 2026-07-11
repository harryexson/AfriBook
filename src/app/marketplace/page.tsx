'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  Utensils,
  Car,
  Package,
  Wrench,
  ArrowRight,
  Star,
  MapPin,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  Download,
  Smartphone,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const categories = [
  {
    icon: Wrench,
    title: 'Services',
    description: 'Beauty, health, education & more',
    href: '/marketplace/services',
    count: '12,000+',
  },
  {
    icon: ShoppingBag,
    title: 'Products',
    description: 'Shop local, support local',
    href: '/marketplace/products',
    count: '25,000+',
  },
  {
    icon: Utensils,
    title: 'Food & Dining',
    description: 'Delicious food, delivered',
    href: '/food',
    count: '5,000+',
  },
  {
    icon: Car,
    title: 'Rides',
    description: 'Safe, affordable rides',
    href: '/rides',
    count: '50,000+',
  },
  {
    icon: Package,
    title: 'Deliveries',
    description: 'Fast package delivery',
    href: '/deliveries',
    count: '10,000+',
  },
];

const featuredBusinesses = [
  {
    name: 'Adunni Fashion House',
    category: 'Fashion & Apparel',
    location: 'Lagos, Nigeria',
    rating: 4.9,
    reviews: 342,
    initials: 'AF',
  },
  {
    name: 'Kwame Tech Solutions',
    category: 'Electronics',
    location: 'Accra, Ghana',
    rating: 4.8,
    reviews: 218,
    initials: 'KT',
  },
  {
    name: 'Nairobi Fresh Market',
    category: 'Groceries',
    location: 'Nairobi, Kenya',
    rating: 4.7,
    reviews: 567,
    initials: 'NF',
  },
  {
    name: 'Johannesburg Artisans',
    category: 'Home & Craft',
    location: 'Johannesburg, SA',
    rating: 4.9,
    reviews: 189,
    initials: 'JA',
  },
  {
    name: 'Kigali Beauty Studio',
    category: 'Beauty & Wellness',
    location: 'Kigali, Rwanda',
    rating: 4.8,
    reviews: 276,
    initials: 'KB',
  },
  {
    name: 'Cairo Spice Traders',
    category: 'Food & Spices',
    location: 'Cairo, Egypt',
    rating: 4.7,
    reviews: 431,
    initials: 'CS',
  },
];

const steps = [
  {
    step: '01',
    title: 'Discover',
    description: 'Browse thousands of vendors, services, and products across your city and beyond.',
  },
  {
    step: '02',
    title: 'Connect',
    description: 'Message vendors, book services, place orders, and schedule deliveries — all in one app.',
  },
  {
    step: '03',
    title: 'Enjoy',
    description: 'Experience seamless service with secure payments, real-time tracking, and 24/7 support.',
  },
];

const stats = [
  { number: '50K+', label: 'Vendors' },
  { number: '1M+', label: 'Customers' },
  { number: '16+', label: 'Countries' },
  { number: '10M+', label: 'Orders' },
];

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Discover Africa&apos;s{' '}
              <span className="text-dark-300">Marketplace</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              From services to products, food to rides — find everything you need
              from trusted vendors across 16+ African countries.
            </motion.p>
            <motion.div variants={fadeIn} className="max-w-2xl mx-auto">
              <div className="relative bg-white rounded-2xl p-2 shadow-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search for services, products, restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-32 py-4 rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none text-lg"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
                  Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Explore by Category
            </h2>
            <p className="text-text-secondary text-lg">
              Everything you need, all in one place
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {categories.map((cat) => (
              <motion.div key={cat.title} variants={fadeIn}>
                <Link
                  href={cat.href}
                  className="block bg-surface-secondary rounded-2xl p-6 border border-border hover:border-amber-500/50 hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/20 transition-colors">
                    <cat.icon className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="font-heading font-bold text-text-primary mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-text-secondary text-sm mb-2">{cat.description}</p>
                  <span className="text-amber-500 text-xs font-medium">{cat.count} listings</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="font-heading text-3xl font-bold text-text-primary mb-2">
                Featured Businesses
              </h2>
              <p className="text-text-secondary">
                Top-rated vendors from across Africa
              </p>
            </div>
            <Link
              href="/marketplace/services"
              className="hidden md:inline-flex items-center gap-2 text-amber-500 hover:text-amber-600 font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {featuredBusinesses.map((biz) => (
              <motion.div
                key={biz.name}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-heading font-bold">
                      {biz.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-text-primary truncate">
                      {biz.name}
                    </h3>
                    <p className="text-text-secondary text-sm">{biz.category}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        {biz.rating}
                      </span>
                      <span className="text-text-tertiary">({biz.reviews} reviews)</span>
                      <span className="flex items-center gap-1 text-text-tertiary">
                        <MapPin className="w-3 h-3" />
                        {biz.location}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              How It Works
            </h2>
            <p className="text-text-secondary text-lg">
              Three simple steps to everything you need
            </p>
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
                  <span className="text-white font-heading font-bold text-xl">
                    {step.step}
                  </span>
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

      {/* Why AfriBook */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Shield,
                title: 'Trusted & Verified',
                description:
                  'Every vendor is verified. Secure payments and buyer protection on every order.',
              },
              {
                icon: Zap,
                title: 'Fast & Reliable',
                description:
                  'Real-time tracking, quick delivery, and responsive customer support when you need it.',
              },
              {
                icon: Clock,
                title: '24/7 Availability',
                description:
                  'Shop, book, and order anytime. Our platform and support team are always available.',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-8 border border-border"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-text-secondary">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-dark-500 to-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeIn} className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Download App CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1 text-white">
              <h2 className="font-heading text-3xl font-bold mb-4">
                Get the AfriBook App
              </h2>
              <p className="text-white/90 text-lg mb-6">
                Shop, order, and book from anywhere. Download the app for the best
                experience.
              </p>
              <div className="flex gap-4">
                <button className="inline-flex items-center gap-2 bg-dark-500 hover:bg-dark-300 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                  <Smartphone className="w-5 h-5" />
                  App Store
                </button>
                <button className="inline-flex items-center gap-2 bg-dark-500 hover:bg-dark-300 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                  <Smartphone className="w-5 h-5" />
                  Google Play
                </button>
              </div>
            </div>
            <div className="w-64 h-48 bg-white/10 rounded-2xl flex items-center justify-center">
              <div className="text-center text-white/50">
                <Smartphone className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">App Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
