'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, type Variants } from 'framer-motion'
import { ChevronDown, Globe, ShoppingBag, Store } from 'lucide-react'

const InteractiveGlobe = dynamic(
  () => import('./InteractiveGlobe'),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────

interface GlobeSectionProps {
  onCountrySelect?: (countryCode: string) => void
  className?: string
}

// ─── Country Options ──────────────────────────────────────────

const COUNTRY_OPTIONS = [
  { code: '', name: 'All Countries', flag: '🌍' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
]

// ─── Animation Variants ───────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const as [number, number, number, number],
    },
  },
}

const glowVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

// ─── Scroll Indicator ─────────────────────────────────────────

function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
        Scroll to explore
      </span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-5 h-5 text-slate-400" />
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function GlobeSection({
  onCountrySelect,
  className,
}: GlobeSectionProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGlobeReady, setIsGlobeReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsGlobeReady(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleCountrySelect = useCallback(
    (countryCode: string) => {
      setSelectedCountry(countryCode)
      setFocusedCountry(countryCode)
      onCountrySelect?.(countryCode)
    },
    [onCountrySelect]
  )

  const handleCountryDropdownChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const code = e.target.value
      setSelectedCountry(code || null)
      setFocusedCountry(code || null)
      onCountrySelect?.(code)
    },
    [onCountrySelect]
  )

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      // Search functionality placeholder
    },
    []
  )

  return (
    <section
      className={`relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${className ?? ''}`}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)]" />

      {/* Globe container */}
      <div className="absolute inset-0">
        {isGlobeReady && (
          <InteractiveGlobe
            onCountrySelect={handleCountrySelect}
            selectedCountry={selectedCountry}
            focusedCountry={focusedCountry}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-sm font-medium text-slate-300 backdrop-blur-sm">
              <Globe className="w-4 h-4 text-cyan-400" />
              Available in 16+ countries
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
          >
            Book. Order. Ride.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Delivered.
            </span>{' '}
            <br className="hidden sm:block" />
            <motion.span
              variants={glowVariants}
              animate="animate"
              className="inline-block"
            >
              Globally.
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed"
          >
            Africa&apos;s global marketplace connecting you to services, products,
            food, rides, and delivery across 16+ countries.
          </motion.p>

          {/* Search bar */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto mb-6"
          >
            <div className="relative flex items-center">
              <Globe className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries, services, or products..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all duration-200"
              />
            </div>
          </motion.form>

          {/* Country selector */}
          <motion.div variants={itemVariants} className="mb-10">
            <div className="relative inline-block">
              <select
                value={selectedCountry ?? ''}
                onChange={handleCountryDropdownChange}
                className="appearance-none px-6 py-3 pr-12 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:bg-slate-700/60"
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-slate-800 text-white">
                    {opt.flag} {opt.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              href="/vendor/signup"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow duration-300"
            >
              <Store className="w-5 h-5" />
              Start Selling
            </motion.a>
            <motion.a
              href="/marketplace"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-white font-semibold text-lg backdrop-blur-sm hover:bg-slate-700/60 transition-colors duration-300"
            >
              <ShoppingBag className="w-5 h-5" />
              Start Shopping
            </motion.a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={itemVariants}
            className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            {[
              { value: '16+', label: 'Countries' },
              { value: '10K+', label: 'Businesses' },
              { value: '1M+', label: 'Deliveries' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <ScrollIndicator />
      </div>
    </section>
  )
}
