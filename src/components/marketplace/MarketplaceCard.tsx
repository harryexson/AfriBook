'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Bookmark, Star, MapPin, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Listing {
  id: string
  title: string
  business: string
  category: string
  location: string
  flag: string
  rating: number
  reviewCount: number
  price: string
  cover: 'cover-amber' | 'cover-gold'
  verified?: boolean
  likes: number
}

export default function MarketplaceCard({
  listing,
  index = 0,
}: {
  listing: Listing
  index?: number
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  const likeCount = listing.likes + (liked ? 1 : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link
        href="/marketplace"
        className="premium-card block overflow-hidden ring-focus focus:outline-none"
      >
        {/* Cover */}
        <div className={cn('relative h-52 overflow-hidden', listing.cover)}>
          <div className="img-zoom absolute inset-0 bg-gradient-to-br opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* Category pill */}
          <span className="chip chip-amber absolute left-3 top-3 z-10 backdrop-blur-sm">
            {listing.category}
          </span>

          {/* Save / bookmark */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setSaved((s) => !s)
            }}
            aria-label={saved ? 'Remove bookmark' : 'Save'}
            className={cn(
              'absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm transition-colors',
              saved
                ? 'bg-amber-500 text-white'
                : 'bg-black/30 text-white hover:bg-black/50'
            )}
          >
            <Bookmark className={cn('h-4 w-4', saved && 'fill-white')} />
          </button>

          {/* Business identity overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-sm font-bold text-gray-900 shadow-sm">
              {listing.business.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                {listing.business}
                {listing.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-white/75">
                <MapPin className="h-3 w-3" />
                {listing.flag} {listing.location}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold leading-snug text-text-primary transition-colors group-hover:text-amber-600">
              {listing.title}
            </h3>
            <span className="shrink-0 text-sm font-bold text-amber-600 dark:text-amber-400">
              {listing.price}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-medium text-text-primary">{listing.rating}</span>
              <span className="text-text-tertiary">({listing.reviewCount})</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setLiked((l) => !l)
              }}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm transition-colors',
                liked ? 'text-rose-500' : 'text-text-tertiary hover:text-rose-500'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-rose-500')} />
              {likeCount}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
