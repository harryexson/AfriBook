'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import MarketplaceCard, { type Listing } from './MarketplaceCard'

const FEED: Listing[] = [
  {
    id: 'm1', title: 'Handwoven Kente throws & decor', business: 'Accra Looms',
    category: 'Fashion', location: 'Accra, Ghana', flag: '🇬🇭',
    rating: 4.9, reviewCount: 312, price: 'GH₵ 480',
    cover: 'cover-amber', verified: true, likes: 1280,
  },
  {
    id: 'm2', title: 'Private dhow sunset cruise', business: 'Zanzibar Sails',
    category: 'Experiences', location: 'Zanzibar, TZ', flag: '🇹🇿',
    rating: 4.8, reviewCount: 204, price: '$62',
    cover: 'cover-gold', verified: true, likes: 890,
  },
  {
    id: 'm3', title: 'Jollof catering for 50 guests', business: 'Lagos Kitchen',
    category: 'Food', location: 'Lagos, Nigeria', flag: '🇳🇬',
    rating: 4.7, reviewCount: 521, price: '₦ 85,000',
    cover: 'cover-amber', likes: 2103,
  },
  {
    id: 'm4', title: 'Safari & lodge booking concierge', business: 'Savanna Stays',
    category: 'Travel', location: 'Nairobi, Kenya', flag: '🇰🇪',
    rating: 4.9, reviewCount: 178, price: 'KSh 24,000',
    cover: 'cover-gold', verified: true, likes: 1540,
  },
  {
    id: 'm5', title: 'Bespoke Ankara suits', business: 'Dakar Atelier',
    category: 'Fashion', location: 'Dakar, Senegal', flag: '🇸🇳',
    rating: 4.8, reviewCount: 96, price: 'CFA 95,000',
    cover: 'cover-amber', likes: 640,
  },
  {
    id: 'm6', title: 'Smartphone repair & unlocking', business: 'Cairo Fix',
    category: 'Electronics', location: 'Cairo, Egypt', flag: '🇪🇬',
    rating: 4.6, reviewCount: 410, price: 'EGP 450',
    cover: 'cover-gold', verified: true, likes: 1120,
  },
  {
    id: 'm7', title: 'Organic coffee bean subscription', business: 'Addis Roasters',
    category: 'Food', location: 'Addis Ababa, ET', flag: '🇪🇹',
    rating: 4.9, reviewCount: 264, price: 'Br 1,200',
    cover: 'cover-amber', likes: 980,
  },
  {
    id: 'm8', title: 'Braids & locs home studio', business: 'Joburg Glow',
    category: 'Beauty', location: 'Johannesburg, SA', flag: '🇿🇦',
    rating: 4.8, reviewCount: 333, price: 'R 650',
    cover: 'cover-gold', verified: true, likes: 1760,
  },
]

const FILTERS = ['All', 'Fashion', 'Food', 'Travel', 'Beauty', 'Electronics', 'Experiences']

export default function DiscoverFeed() {
  const [active, setActive] = useState('All')
  const items = active === 'All' ? FEED : FEED.filter((l) => l.category === active)

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
