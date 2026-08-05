'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { ArrowRight, Truck, Calendar } from 'lucide-react'
import CategoryGrid from '@/components/marketplace/CategoryGrid'
import FeaturedBusinesses from '@/components/marketplace/FeaturedBusinesses'
import DiscoverFeed from '@/components/marketplace/DiscoverFeed'
import HowItWorks from '@/components/marketplace/HowItWorks'
import StatsSection from '@/components/marketplace/StatsSection'
import DownloadApp from '@/components/marketplace/DownloadApp'
import SuperAppShowcase from '@/components/showcase/SuperAppShowcase'
import {
  MarketAppScreen,
  RidesAppScreen,
  FoodAppScreen,
  DeliveryAppScreen,
  EventsAppScreen,
  SellAppScreen,
} from '@/components/showcase/AppScreens'
import { COUNTRIES } from '@/lib/localization/countries'

const GlobeSection = dynamic(
  () => import('@/components/globe/GlobeSection'),
  { ssr: false }
)

const TRUSTED_FLAGS = Object.values(COUNTRIES)
  .filter((_, i) => i < 12)
  .map((c) => ({ code: c.code, name: c.name, flag: c.flag }))

const trustedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.2 },
  },
}

const flagItemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export default function HomePage() {
  useEffect(() => {
    if (!navigator.geolocation) return
    const timeoutId = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3`
            )
            const data = await res.json()
            const countryCode = data.address?.country_code?.toUpperCase()
            if (countryCode && COUNTRIES[countryCode]) {
              document.cookie = `country=${countryCode};path=/;max-age=31536000`
            }
          } catch {}
        },
        () => {},
        { timeout: 5000, maximumAge: 600000 }
      )
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero / Globe Section */}
      <GlobeSection />

      {/* One app for everything */}
      <SuperAppShowcase
        eyebrow="One app. Every vertical."
        title={
          <>
            Download once.
            <br />
            <span className="text-gradient-gold">One for everything.</span>
          </>
        }
        subtitle="Marketplace, rides, food, deliveries, events, and your seller dashboard — six services, one account, every African city."
        bullets={['Rides', 'Food', 'Marketplace', 'Deliveries', 'Events', 'Selling']}
        screens={[
          { label: 'Marketplace', node: <MarketAppScreen />, glow: 'amber' },
          { label: 'Rides', node: <RidesAppScreen />, glow: 'blue' },
          { label: 'Food', node: <FoodAppScreen />, glow: 'rose' },
          { label: 'Deliveries', node: <DeliveryAppScreen />, glow: 'emerald' },
          { label: 'Events', node: <EventsAppScreen />, glow: 'violet' },
          { label: 'Sell', node: <SellAppScreen />, glow: 'amber' },
        ]}
      />

      {/* Category Grid */}
      <CategoryGrid />

      {/* How It Works */}
      <HowItWorks />

      {/* Stats Section */}
      <StatsSection />

      {/* Featured Businesses */}
      <FeaturedBusinesses />

      {/* Social discovery feed */}
      <DiscoverFeed />

      {/* Trusted by countries */}
      <section className="relative overflow-hidden bg-dark-600 py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_40rem_at_50%_-20%,rgba(245,158,11,0.1),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
              Global reach
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Built for Africa&apos;s cities.
              <span className="block text-white/50">Loved across 16+ countries.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={trustedVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {TRUSTED_FLAGS.map((country) => (
              <motion.div
                key={country.code}
                variants={flagItemVariants}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md transition-colors hover:border-amber-500/40 hover:bg-white/10"
              >
                <span className="text-lg">{country.flag}</span>
                <span className="text-sm font-medium text-white/70">{country.name}</span>
              </motion.div>
            ))}
            <motion.div
              variants={flagItemVariants}
              className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2"
            >
              <span className="text-sm font-bold text-amber-400">+4 more</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative overflow-hidden bg-dark-500 py-20 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(44rem_44rem_at_50%_-20%,rgba(245,158,11,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(32rem_32rem_at_100%_120%,rgba(180,83,9,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
              Join the marketplace
            </p>
            <h2 className="mb-4 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
              Your business, open to the world.
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60">
              Shop, ride, eat, and deliver — all in one place. Start free, no
              setup fees.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-4 text-lg font-semibold text-amber-950 shadow-gold-lg transition-colors hover:bg-amber-400"
              >
                Start free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/rides/book"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                <Truck className="h-5 w-5" />
                Book a ride
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                <Calendar className="h-5 w-5" />
                Browse events
              </Link>
            </div>
            <p className="mt-8 text-xs text-white/40">
              Free forever for buyers · No setup fees for sellers · Available on iOS &amp; Android
            </p>
          </motion.div>
        </div>
      </section>

      {/* Download App */}
      <DownloadApp />
    </div>
  )
}
