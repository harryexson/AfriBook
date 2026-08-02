'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles, Heart, Car, Utensils, Truck, Home, Music,
  GraduationCap, ShoppingBag, Bike, Smile, Wrench, ArrowUpRight,
} from 'lucide-react'

interface Category {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const CATEGORIES: Category[] = [
  { name: 'Beauty', href: '/marketplace/beauty', icon: Sparkles },
  { name: 'Health', href: '/marketplace/health', icon: Heart },
  { name: 'Automotive', href: '/marketplace/automotive', icon: Car },
  { name: 'Food', href: '/food', icon: Utensils },
  { name: 'Rides', href: '/rides', icon: Truck },
  { name: 'Home Services', href: '/marketplace/home-services', icon: Home },
  { name: 'Events', href: '/marketplace/events', icon: Music },
  { name: 'Education', href: '/marketplace/education', icon: GraduationCap },
  { name: 'Shopping', href: '/marketplace/shopping', icon: ShoppingBag },
  { name: 'Delivery', href: '/deliveries', icon: Bike },
  { name: 'Wellness', href: '/marketplace/wellness', icon: Smile },
  { name: 'Repairs', href: '/marketplace/repairs', icon: Wrench },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export default function CategoryGrid() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              Marketplace
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              Explore by category
            </h2>
            <p className="mt-3 max-w-xl text-text-secondary">
              From food to freight — every corner of the market, one tap away.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary transition-colors hover:text-amber-600"
          >
            Browse everything
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4"
        >
          {CATEGORIES.map((category) => (
            <motion.div key={category.name} variants={itemVariants}>
              <Link
                href={category.href}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-amber-950 dark:text-amber-400">
                  <category.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold leading-tight text-text-primary transition-colors group-hover:text-amber-600">
                  {category.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
