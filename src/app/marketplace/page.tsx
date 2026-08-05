'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Shield,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import PhoneMockup from '@/components/showcase/PhoneMockup';
import { MarketAppScreen } from '@/components/showcase/AppScreens';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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
    tint: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Kwame Tech Solutions',
    category: 'Electronics',
    location: 'Accra, Ghana',
    rating: 4.8,
    reviews: 218,
    initials: 'KT',
    tint: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Nairobi Fresh Market',
    category: 'Groceries',
    location: 'Nairobi, Kenya',
    rating: 4.7,
    reviews: 567,
    initials: 'NF',
    tint: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Johannesburg Artisans',
    category: 'Home & Craft',
    location: 'Johannesburg, SA',
    rating: 4.9,
    reviews: 189,
    initials: 'JA',
    tint: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Kigali Beauty Studio',
    category: 'Beauty & Wellness',
    location: 'Kigali, Rwanda',
    rating: 4.8,
    reviews: 276,
    initials: 'KB',
    tint: 'from-rose-500 to-pink-600',
  },
  {
    name: 'Cairo Spice Traders',
    category: 'Food & Spices',
    location: 'Cairo, Egypt',
    rating: 4.7,
    reviews: 431,
    initials: 'CS',
    tint: 'from-cyan-500 to-sky-600',
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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_82%_12%,rgba(245,158,11,0.12),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_-8%_100%,rgba(14,12,18,0.6),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Marketplace
              </motion.span>
              <motion.h1
                variants={fadeIn}
                className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl"
              >
                Africa&apos;s market,
                <span className="block text-gradient-gold">open to everyone.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
                From services to products, food to rides — find everything you need from
                trusted vendors across 16+ African countries.
              </motion.p>

              <motion.form variants={fadeIn} onSubmit={handleSearch} className="mt-8">
                <div className="group relative flex items-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition-colors focus-within:border-amber-500/50 focus-within:bg-white/[0.06]">
                  <Search className="absolute left-5 h-5 w-5 text-white/35" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services, products, restaurants..."
                    className="w-full bg-transparent py-4 pr-4 text-white placeholder:text-white/35 focus:outline-none"
                    style={{ paddingLeft: '3.25rem' }}
                  />
                  <button
                    type="submit"
                    className="mr-2 hidden items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-400 sm:inline-flex"
                  >
                    Search
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.form>

              <motion.div variants={fadeIn} className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-heading text-2xl font-bold text-white">{stat.number}</p>
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
              <PhoneMockup glow="amber">
                <MarketAppScreen />
              </PhoneMockup>

              {/* Floating rating card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -left-4 top-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                    <Star className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">4.8 / 5</p>
                    <p className="text-xs text-white/50">1M+ happy customers</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating order card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-4 bottom-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <p className="text-xs text-white/50">Order placed</p>
                <p className="text-sm font-bold text-white">Jollof Special · $8</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <Zap className="h-3 w-3" /> 30 min delivery
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-12 max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
              Explore by category
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              Everything you need, all in one place
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 gap-4 md:grid-cols-5"
          >
            {categories.map((cat) => (
              <motion.div key={cat.title} variants={fadeIn}>
                <Link
                  href={cat.href}
                  className="premium-card group block h-full p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
                    <cat.icon className="h-7 w-7 text-amber-500" />
                  </div>
                  <h3 className="font-heading font-bold text-text-primary">{cat.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{cat.description}</p>
                  <span className="mt-3 inline-block text-xs font-medium text-amber-600">
                    {cat.count} listings
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-20 bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-12 flex items-end justify-between gap-6"
          >
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                Featured businesses
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
                Top-rated vendors from across Africa
              </h2>
            </div>
            <Link
              href="/marketplace/services"
              className="hidden items-center gap-2 font-medium text-amber-600 transition-colors hover:text-amber-500 md:inline-flex"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {featuredBusinesses.map((biz) => (
              <motion.div
                key={biz.name}
                variants={fadeIn}
                className="premium-card flex items-start gap-4 p-6"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${biz.tint}`}
                >
                  <span className="font-heading text-base font-bold text-white">{biz.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-heading font-bold text-text-primary">{biz.name}</h3>
                  <p className="text-sm text-text-secondary">{biz.category}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-4 w-4 fill-current" />
                      {biz.rating}
                    </span>
                    <span className="text-text-tertiary">({biz.reviews} reviews)</span>
                    <span className="flex items-center gap-1 text-text-tertiary">
                      <MapPin className="h-3 w-3" />
                      {biz.location}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              Three simple steps to everything you need
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {steps.map((step, i) => (
              <motion.div key={step.step} variants={fadeIn} className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold">
                  <span className="font-heading text-xl font-bold text-white">{step.step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute left-16 top-8 hidden h-px w-[calc(100%-4rem)] bg-border md:block" />
                )}
                <h3 className="font-heading text-xl font-bold text-text-primary">{step.title}</h3>
                <p className="mt-2 max-w-xs text-text-secondary">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why AfriBook */}
      <section className="py-20 bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
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
              <motion.div key={item.title} variants={fadeIn} className="premium-card p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <item.icon className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-text-secondary">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden bg-dark-600 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_50%_-20%,rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeIn} className="text-center">
                <div className="font-heading text-3xl font-bold text-white md:text-4xl">
                  {stat.number}
                </div>
                <div className="text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
