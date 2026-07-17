'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles, Heart, Car, Utensils, Truck, Home, Music,
  GraduationCap, ShoppingBag, Bike, Smile, Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  gradient: `from-${string}-${number} to-${string}-${number}`
}

const CATEGORIES: Category[] = [
  { name: 'Beauty', href: '/marketplace/beauty', icon: Sparkles, gradient: 'from-pink-500 to-rose-500' },
  { name: 'Health', href: '/marketplace/health', icon: Heart, gradient: 'from-green-500 to-emerald-500' },
  { name: 'Automotive', href: '/marketplace/automotive', icon: Car, gradient: 'from-blue-500 to-indigo-500' },
  { name: 'Food', href: '/food', icon: Utensils, gradient: 'from-orange-500 to-red-500' },
  { name: 'Rides', href: '/rides', icon: Truck, gradient: 'from-yellow-500 to-amber-500' },
  { name: 'Home Services', href: '/marketplace/home-services', icon: Home, gradient: 'from-teal-500 to-cyan-500' },
  { name: 'Events', href: '/marketplace/events', icon: Music, gradient: 'from-purple-500 to-violet-500' },
  { name: 'Education', href: '/marketplace/education', icon: GraduationCap, gradient: 'from-sky-500 to-blue-500' },
  { name: 'Shopping', href: '/marketplace/shopping', icon: ShoppingBag, gradient: 'from-amber-500 to-yellow-500' },
  { name: 'Delivery', href: '/deliveries', icon: Bike, gradient: 'from-lime-500 to-green-500' },
  { name: 'Wellness', href: '/marketplace/wellness', icon: Smile, gradient: 'from-cyan-500 to-teal-500' },
  { name: 'Repairs', href: '/marketplace/repairs', icon: Wrench, gradient: 'from-slate-500 to-gray-500' },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
            Explore by category
          </h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            Find exactly what you need across our extensive marketplace
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {CATEGORIES.map((category) => (
            <motion.div key={category.name} variants={itemVariants}>
              <Link
                href={category.href}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface-secondary border border-border hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
              >
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1',
                  category.gradient
                )}>
                  <category.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-text-primary text-center group-hover:text-amber-500 transition-colors">
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
