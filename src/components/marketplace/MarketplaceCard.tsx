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
  cover: string
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
        href={`/marketplace/${listing.id}`}
        className="premium-card block overflow-hidden focus:outline-none ring-focus"
      >
        {/* Cover */}
        <div className={cn('relative h-52 overflow-hidden', listing.cover)}>
          <div className="img-zoom absolute inset-0 bg-gradient-to-br opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* Category pill */}
          <span className="chip chip-amber absolute top-3 left-3 z-10 backdrop-blur-sm">
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
              'absolute top-3 right-3 z-10 grid place-items-center w-9 h-9 rounded-full backdrop-blur-sm transition-colors',
              saved
                ? 'bg-amber-500 text-white'
                : 'bg-black/30 text-white hover:bg-black/50'
            )}
          >
            <Bookmark className={cn('w-4 h-4', saved && 'fill-white')} />
          </button>

          {/* Business identity overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/90 grid place-items-center text-sm font-bold text-gray-900 shadow-sm">
              {listing.business.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate flex items-center gap-1">
                {listing.business}
                {listing.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                )}
              </p>
              <p className="text-white/75 text-xs truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.flag} {listing.location}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-text-primary leading-snug group-hover:text-amber-500 transition-colors">
              {listing.title}
            </h3>
            <span className="shrink-0 text-sm font-bold text-amber-600 dark:text-amber-400">
              {listing.price}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
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
              <Heart className={cn('w-4 h-4', liked && 'fill-rose-500')} />
              {likeCount}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
