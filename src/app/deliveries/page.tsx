'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Package,
  MapPin,
  Clock,
  Shield,
  Truck,
  ArrowRight,
  Box,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import PhoneMockup from '@/components/showcase/PhoneMockup'
import { DeliveryAppScreen } from '@/components/showcase/AppScreens'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const packageTypes = [
  {
    icon: Package,
    name: 'Documents',
    description: 'Letters, contracts, legal documents',
    maxSize: 'Up to 1 kg',
  },
  {
    icon: Box,
    name: 'Small Packages',
    description: 'Electronics, clothes, small items',
    maxSize: 'Up to 5 kg',
  },
  {
    icon: Package,
    name: 'Medium Packages',
    description: 'Home goods, gifts, retail items',
    maxSize: 'Up to 15 kg',
  },
  {
    icon: Truck,
    name: 'Large Packages',
    description: 'Furniture, appliances, bulk orders',
    maxSize: 'Up to 50 kg',
  },
]

const deliveryZones = [
  { zone: 'Same City', time: '1-2 hours', price: 'From $2' },
  { zone: 'Same Country', time: '1-3 days', price: 'From $5' },
  { zone: 'Cross-Border', time: '3-7 days', price: 'From $15' },
  { zone: 'Pan-African', time: '5-14 days', price: 'Custom' },
]

const features = [
  {
    icon: Box,
    title: 'Real-Time Tracking',
    description: 'Track your package every step of the way with live GPS updates.',
  },
  {
    icon: Shield,
    title: 'Insured Deliveries',
    description: 'Every delivery is insured up to $500 for your peace of mind.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Schedule pickups and deliveries at your convenience, including weekends.',
  },
  {
    icon: CheckCircle,
    title: 'Proof of Delivery',
    description: 'Photo confirmation and digital signature upon delivery.',
  },
]

const businessFeatures = [
  'Bulk shipping discounts up to 40%',
  'Dedicated account manager',
  'API integration for your e-commerce store',
  'Custom packaging solutions',
  'Priority delivery options',
  'Analytics dashboard',
]

export default function DeliveriesPage() {
  const router = useRouter()
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_80%_10%,rgba(16,185,129,0.1),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_-8%_100%,rgba(245,158,11,0.14),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AfriBook Deliveries
              </motion.span>
              <motion.h1
                variants={fadeIn}
                className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl"
              >
                Any package.
                <span className="block text-gradient-gold">Anywhere in Africa.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
                Send packages across the city or across borders with live tracking,
                insured deliveries, and transparent pricing.
              </motion.p>

              <motion.div variants={fadeIn} className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/deliveries/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-amber-950 shadow-gold-lg transition-colors hover:bg-amber-400"
                >
                  Send a Package
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/business"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
                >
                  Business Solutions
                </Link>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                {[
                  { label: 'Packages delivered', value: '2M+' },
                  { label: 'On-time rate', value: '98.6%' },
                  { label: 'Countries', value: '16' },
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
              <PhoneMockup glow="emerald">
                <DeliveryAppScreen />
              </PhoneMockup>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -left-6 top-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Box className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Package #AB-4821</p>
                    <p className="text-xs text-white/50">Pickup confirmed</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-6 bottom-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <p className="text-xs text-white/50">Estimated arrival</p>
                <p className="text-sm font-bold text-white">25 min</p>
                <p className="mt-1 text-xs text-emerald-400">● Courier 12 min away</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Booking Card */}
      <section className="relative z-10 -mt-10 pb-4">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Truck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Request a Delivery
                </h3>
                <p className="text-sm text-text-secondary">Instant price estimate</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Pickup Address
                </label>
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Enter delivery location"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Package Type
                </label>
                <select className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-text-primary focus:border-amber-500 focus:outline-none">
                  <option>Select package type</option>
                  <option>Documents</option>
                  <option>Small Package (up to 5 kg)</option>
                  <option>Medium Package (up to 15 kg)</option>
                  <option>Large Package (up to 50 kg)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => router.push('/deliveries/new')}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3.5 font-medium text-white transition-colors hover:bg-amber-600"
            >
              Get Price Estimate
            </button>
          </motion.div>
        </div>
      </section>

      {/* Package Types */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
              What Are You Sending?
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              We handle packages of all shapes and sizes
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {packageTypes.map((type) => (
              <motion.div
                key={type.name}
                variants={fadeIn}
                className="rounded-2xl border border-border bg-surface-secondary p-6 text-center transition-colors hover:border-amber-500/50"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10">
                  <type.icon className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-text-primary">{type.name}</h3>
                <p className="mb-2 text-sm text-text-secondary">{type.description}</p>
                <span className="text-sm font-medium text-amber-500">{type.maxSize}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Delivery Zones */}
      <section className="py-20 bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
              Delivery Zones &amp; Pricing
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Transparent pricing for every delivery
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {deliveryZones.map((zone, i) => (
              <motion.div
                key={zone.zone}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-6 text-center transition-colors ${
                  i === 0
                    ? 'border-amber-500 bg-surface shadow-lg shadow-amber-500/10'
                    : 'border-border bg-surface hover:border-amber-500/50'
                }`}
              >
                {i === 0 && (
                  <span className="mb-3 inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">
                    Fastest
                  </span>
                )}
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {zone.zone}
                </h3>
                <p className="mb-3 text-sm text-text-secondary">
                  <Clock className="mr-1 inline h-4 w-4" />
                  {zone.time}
                </p>
                <p className="font-heading text-2xl font-bold text-amber-500">{zone.price}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tracking Feature */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
              Track Every Package
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
              Real-time tracking from pickup to delivery. Know exactly where your package is, anytime.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeIn}
                className="rounded-2xl border border-border bg-surface-secondary p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <feature.icon className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Business Solutions */}
      <section className="relative overflow-hidden bg-dark-500 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_40rem_at_90%_50%,rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <p className="mb-3 text-sm font-medium uppercase tracking-wider text-amber-500">
                For Business
              </p>
              <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
                Business Delivery Solutions
              </h2>
              <p className="mb-8 mt-4 text-lg text-white/70">
                Scale your delivery operations with our enterprise-grade logistics
                platform. From small businesses to large enterprises.
              </p>
              <div className="mb-8 space-y-3">
                {businessFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-amber-500" />
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3 font-medium text-white transition-colors hover:bg-amber-600"
              >
                Contact Sales
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15">
                  <MapPin className="h-8 w-8 text-amber-400" />
                </div>
                <p className="font-heading text-lg font-bold text-white">
                  Enterprise Dashboard
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Analytics, bulk management, and API access
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
