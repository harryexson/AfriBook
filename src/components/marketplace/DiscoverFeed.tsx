'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import MarketplaceCard from './MarketplaceCard'
import { MARKETPLACE_LISTINGS } from '@/lib/marketplace-listings'

const FILTERS = ['All', 'Fashion', 'Food', 'Travel', 'Beauty', 'Electronics', 'Experiences']

export default function DiscoverFeed() {
  const [active, setActive] = useState('All')
  const items = active === 'All' ? MARKETPLACE_LISTINGS : MARKETPLACE_LISTINGS.filter((l) => l.category === active)

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              <Globe2 className="h-4 w-4" />
              Live marketplace
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              Discover &amp; shop
            </h2>
            <p className="mt-3 max-w-xl text-text-secondary">
              Real sellers, real moments — from Accra to Zanzibar.
            </p>
          </div>
        </motion.div>

        {/* Filter chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors ring-focus',
                active === f
                  ? 'bg-amber-500 text-amber-950 shadow-gold'
                  : 'border border-border bg-surface text-text-secondary hover:border-amber-500/40 hover:text-text-primary'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((listing, i) => (
            <MarketplaceCard key={listing.id} listing={listing} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
