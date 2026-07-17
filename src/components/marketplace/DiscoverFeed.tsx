'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Globe2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import MarketplaceCard, { type Listing } from './MarketplaceCard'

const FEED: Listing[] = [
  {
    id: 'm1', title: 'Handwoven Kente throws & decor', business: 'Accra Looms',
    category: 'Fashion', location: 'Accra, Ghana', flag: '🇬🇭',
    rating: 4.9, reviewCount: 312, price: 'GH₵ 480',
    cover: 'from-amber-500/30 to-orange-600/30', verified: true, likes: 1280,
  },
  {
    id: 'm2', title: 'Private dhow sunset cruise', business: 'Zanzibar Sails',
    category: 'Experiences', location: 'Zanzibar, TZ', flag: '🇹🇿',
    rating: 4.8, reviewCount: 204, price: '$62',
    cover: 'from-cyan-500/30 to-teal-500/30', verified: true, likes: 890,
  },
  {
    id: 'm3', title: 'Jollof catering for 50 guests', business: 'Lagos Kitchen',
    category: 'Food', location: 'Lagos, Nigeria', flag: '🇳🇬',
    rating: 4.7, reviewCount: 521, price: '₦ 85,000',
    cover: 'from-rose-500/30 to-pink-600/30', likes: 2103,
  },
  {
    id: 'm4', title: 'Safari & lodge booking concierge', business: 'Savanna Stays',
    category: 'Travel', location: 'Nairobi, Kenya', flag: '🇰🇪',
    rating: 4.9, reviewCount: 178, price: 'KSh 24,000',
    cover: 'from-emerald-500/30 to-green-600/30', verified: true, likes: 1540,
  },
  {
    id: 'm5', title: 'Bespoke Ankara suits', business: 'Dakar Atelier',
    category: 'Fashion', location: 'Dakar, Senegal', flag: '🇸🇳',
    rating: 4.8, reviewCount: 96, price: 'CFA 95,000',
    cover: 'from-violet-500/30 to-purple-600/30', likes: 640,
  },
  {
    id: 'm6', title: 'Smartphone repair & unlocking', business: 'Cairo Fix',
    category: 'Electronics', location: 'Cairo, Egypt', flag: '🇪🇬',
    rating: 4.6, reviewCount: 410, price: 'EGP 450',
    cover: 'from-blue-500/30 to-indigo-600/30', verified: true, likes: 1120,
  },
  {
    id: 'm7', title: 'Organic coffee bean subscription', business: 'Addis Roasters',
    category: 'Food', location: 'Addis Ababa, ET', flag: '🇪🇹',
    rating: 4.9, reviewCount: 264, price: 'Br 1,200',
    cover: 'from-amber-600/30 to-yellow-500/30', likes: 980,
  },
  {
    id: 'm8', title: 'Braids & locs home studio', business: 'Joburg Glow',
    category: 'Beauty', location: 'Johannesburg, SA', flag: '🇿🇦',
    rating: 4.8, reviewCount: 333, price: 'R 650',
    cover: 'from-fuchsia-500/30 to-pink-600/30', verified: true, likes: 1760,
  },
]

const FILTERS = ['All', 'Fashion', 'Food', 'Travel', 'Beauty', 'Electronics', 'Experiences']

export default function DiscoverFeed() {
  const [active, setActive] = useState('All')
  const items = active === 'All' ? FEED : FEED.filter((l) => l.category === active)

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 ambient pointer-events-none" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <span className="chip chip-amber mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Discover
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary flex items-center gap-2">
              The world&apos;s marketplace
              <Globe2 className="w-7 h-7 text-amber-500" />
            </h2>
            <p className="mt-2 text-text-secondary max-w-xl">
              Real sellers, real moments — from Accra to Zanzibar. Tap any card to explore.
            </p>
          </div>
        </motion.div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors ring-focus',
                active === f
                  ? 'bg-amber-500 text-white shadow-gold'
                  : 'bg-surface-secondary border border-border text-text-secondary hover:text-text-primary hover:border-amber-500/40'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((listing, i) => (
            <MarketplaceCard key={listing.id} listing={listing} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
