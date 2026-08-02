'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Search, Sparkles } from 'lucide-react'

const InteractiveGlobe = dynamic(
  () => import('./InteractiveGlobe'),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────

interface GlobeSectionProps {
  onCountrySelect?: (countryCode: string) => void
  className?: string
}

// ─── Animation Variants ───────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1] as const as [number, number, number, number],
    },
  },
}

// ─── Main Component ───────────────────────────────────────────

export default function GlobeSection({
  onCountrySelect,
  className,
}: GlobeSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isGlobeReady, setIsGlobeReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsGlobeReady(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleCountrySelect = useCallback(
    (countryCode: string) => onCountrySelect?.(countryCode),
    [onCountrySelect]
  )

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/marketplace?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }, [searchQuery])

  return (
    <section
      className={`relative min-h-[92svh] overflow-hidden bg-dark-700 ${className ?? ''}`}
    >
      {/* Base texture */}
      <div className="absolute inset-0 bg-[radial-gradient(60rem_60rem_at_75%_30%,rgba(245,158,11,0.09),transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(44rem_44rem_at_15%_85%,rgba(14,12,18,0.5),transparent_60%)]" />

      {/* Globe */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-3/5">
        {isGlobeReady && (
          <InteractiveGlobe
            onCountrySelect={handleCountrySelect}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Content overlay */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[92svh] flex-col justify-center lg:min-h-0 lg:py-32">
          <motion.div
            className="max-w-xl lg:max-w-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Kicker */}
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Africa&apos;s global marketplace
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              variants={itemVariants}
              className="text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.4rem]"
            >
              The world, open for
              <span className="block text-gradient-gold">
                African business.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-lg text-lg leading-relaxed text-white/60"
            >
              Book services, order products, request rides, and get deliveries —
              across borders, currencies, and languages. One account for all of
              it.
            </motion.p>

            {/* Search */}
            <motion.form
              variants={itemVariants}
              onSubmit={handleSearchSubmit}
              className="mt-10"
            >
              <div className="group relative flex items-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition-colors focus-within:border-amber-500/50 focus-within:bg-white/[0.06]">
                <Search className="absolute left-5 h-5 w-5 text-white/35" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services, products, or rides..."
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

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <motion.a
                href="/marketplace"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-amber-950 shadow-gold transition-colors hover:bg-amber-400"
              >
                Start exploring
                <ArrowRight className="h-4.5 w-4.5" />
              </motion.a>
              <motion.a
                href="/register"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                Open a shop
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
