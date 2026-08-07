'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, MapPin, Star, BadgeCheck, Heart, Bookmark, Check, Share2, ShoppingBag, MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMarketplaceListing, MARKETPLACE_LISTINGS } from '@/lib/marketplace-listings'
import MarketplaceCard from '@/components/marketplace/MarketplaceCard'

export default function MarketplaceListingPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) ?? ''
  const listing = getMarketplaceListing(id)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showShare, setShowShare] = useState(false)

  if (!listing) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-text-tertiary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Listing not found</h1>
          <p className="text-text-secondary mt-1">This listing may have been removed or the link is incorrect.</p>
          <Link
            href="/marketplace"
            className="mt-5 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Browse the marketplace
          </Link>
        </div>
      </div>
    )
  }

  const related = MARKETPLACE_LISTINGS.filter((l) => l.id !== listing.id).slice(0, 4)

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: listing.title, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      setShowShare(true)
      setTimeout(() => setShowShare(false), 2000)
    }
  }

  return (
    <div className="min-h-screen pt-16 md:pt-20 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn('relative h-80 sm:h-96 rounded-3xl overflow-hidden', listing.cover)}
          >
            <div className="img-zoom absolute inset-0 bg-gradient-to-br" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

            <span className="chip chip-amber absolute left-4 top-4 z-10 backdrop-blur-sm">
              {listing.category}
            </span>

            <div className="absolute right-4 top-4 flex gap-2 z-10">
              <button
                onClick={() => setLiked((l) => !l)}
                aria-label="Like listing"
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-full backdrop-blur-sm transition-colors',
                  liked ? 'bg-rose-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'
                )}
              >
                <Heart className={cn('h-5 w-5', liked && 'fill-white')} />
              </button>
              <button
                onClick={() => setSaved((s) => !s)}
                aria-label="Save listing"
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-full backdrop-blur-sm transition-colors',
                  saved ? 'bg-amber-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'
                )}
              >
                <Bookmark className={cn('h-5 w-5', saved && 'fill-white')} />
              </button>
              <button
                onClick={handleShare}
                aria-label="Share listing"
                className="grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-base font-bold text-gray-900 shadow-sm">
                {listing.business.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-base font-semibold text-white">
                  {listing.business}
                  {listing.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                  )}
                </p>
                <p className="flex items-center gap-1 truncate text-sm text-white/75">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.flag} {listing.location}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-text-primary">
              {listing.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-text-primary">{listing.rating}</span>
                <span>({listing.reviewCount} reviews)</span>
              </span>
              {listing.verified && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-4 w-4" />
                  Verified seller
                </span>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium uppercase tracking-wider text-text-tertiary">Price</p>
              <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">{listing.price}</p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium uppercase tracking-wider text-text-tertiary">Description</p>
              <p className="mt-2 text-text-secondary leading-relaxed">{listing.description}</p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium uppercase tracking-wider text-text-tertiary">Highlights</p>
              <ul className="mt-3 space-y-2.5">
                {listing.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-text-primary">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-semibold text-white shadow-gold transition-colors hover:bg-amber-600">
                <ShoppingBag className="h-5 w-5" />
                Buy now
              </button>
              <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 font-semibold text-text-primary transition-colors hover:border-amber-500/40">
                <MessageCircle className="h-5 w-5" />
                Message seller
              </button>
            </div>
          </motion.div>
        </div>

        {/* Related listings */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">More from the marketplace</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((listingItem, i) => (
              <MarketplaceCard key={listingItem.id} listing={listingItem} index={i} />
            ))}
          </div>
        </section>
      </div>

      {/* Share toast */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-text-primary text-text-inverse text-sm font-medium shadow-lg z-50"
          >
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
