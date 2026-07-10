'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import CategoryGrid from '@/components/marketplace/CategoryGrid'
import FeaturedBusinesses from '@/components/marketplace/FeaturedBusinesses'
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

const trustedVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.2 },
  },
}

const flagItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const as const },
  },
}

export default function HomePage() {
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

      {/* Download App */}
      <DownloadApp />
    </div>
  )
}
