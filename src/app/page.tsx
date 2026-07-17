'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { ArrowRight, Truck, ShoppingBag, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import CategoryGrid from '@/components/marketplace/CategoryGrid'
import FeaturedBusinesses from '@/components/marketplace/FeaturedBusinesses'
import DiscoverFeed from '@/components/marketplace/DiscoverFeed'
import HowItWorks from '@/components/marketplace/HowItWorks'
import StatsSection from '@/components/marketplace/StatsSection'
import DownloadApp from '@/components/marketplace/DownloadApp'
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
      <section className="py-16 sm:py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
              Trusted across 16+ countries
            </h2>
            <p className="mt-2 text-text-secondary">
              Connecting buyers and sellers worldwide
            </p>
          </motion.div>

          <motion.div
            variants={trustedVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {TRUSTED_FLAGS.map((country) => (
              <motion.div
                key={country.code}
                variants={flagItemVariants}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border hover:bg-surface-tertiary hover:border-amber-500/30 transition-colors cursor-default"
              >
                <span className="text-xl">{country.flag}</span>
                <span className="text-sm font-medium text-text-secondary">{country.name}</span>
              </motion.div>
            ))}
            <motion.div
              variants={flagItemVariants}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
            >
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">+4 more</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-dark-500 via-dark-300 to-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
              Join millions across Africa. Shop, ride, eat, and deliver — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg shadow-amber-500/30"
              >
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/rides/book"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-colors backdrop-blur-sm border border-white/20"
              >
                <Truck className="w-5 h-5" />
                Book a Ride
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-colors backdrop-blur-sm border border-white/20"
              >
                <Calendar className="w-5 h-5" />
                Browse Events
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Download App */}
      <DownloadApp />
    </div>
  )
}
