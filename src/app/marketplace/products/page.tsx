'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { getAllListings, getListingCategories } from '@/lib/marketplace-listings';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// This page used to be a standalone demo with 12 hardcoded, fully
// fabricated products and a non-functional "add to cart" button (no cart
// or checkout ever existed for it). The real data here — a small,
// hand-curated set of cross-border listings — already exists in
// marketplace-listings.ts and already has a real detail page
// (/marketplace/[id], with working "Buy now"/"Message seller" actions).
// This page is now a real browse front-end over that same data instead of
// a disconnected mock, using the same MarketplaceCard the detail page's
// "More from the marketplace" section already uses.
export default function MarketplaceProductsPage() {
  const listings = useMemo(() => getAllListings(), []);
  const categories = useMemo(() => ['All', ...getListingCategories()], []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (category !== 'All' && l.category !== category) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.business.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    });
  }, [listings, query, category]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700 pt-28 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_82%_12%,rgba(245,158,11,0.12),transparent_58%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p variants={fadeIn} className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
              Marketplace
            </motion.p>
            <motion.h1 variants={fadeIn} className="mt-3 text-3xl sm:text-4xl font-bold font-heading text-white">
              Cross-border finds from AfriBook makers
            </motion.h1>
            <motion.p variants={fadeIn} className="mt-3 max-w-xl text-white/60">
              A curated selection of goods and home-studio services from independent
              businesses across Africa.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-16 md:top-20 z-30 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search listings, makers, cities..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  category === cat
                    ? 'border-amber-500 bg-amber-500 text-amber-950'
                    : 'border-border text-text-secondary hover:border-amber-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing, i) => (
              <MarketplaceCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-lg font-bold text-text-primary">No listings found</h2>
            <p className="mt-1 text-sm text-text-secondary">Try a different search or category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
