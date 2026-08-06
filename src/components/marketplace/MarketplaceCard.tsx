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
        className="block overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white via-surface to-surface shadow-[0_32px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-1.5 hover:shadow-[0_40px_110px_rgba(15,23,42,0.16)] ring-focus focus:outline-none"
      >
        <div className={cn('relative h-56 overflow-hidden', listing.cover)}>
          <div className="absolute inset-0 bg-gradient-to-br from-black/15 via-transparent to-black/40" />
          <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute -right-10 bottom-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />

          <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 shadow-sm">
            {listing.category}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setSaved((s) => !s)
            }}
            aria-label={saved ? 'Remove bookmark' : 'Save'}
            className={cn(
              'absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/85 text-text-primary shadow-sm transition-colors',
              saved ? 'bg-amber-500 text-white border-transparent' : 'hover:bg-white'
            )}
          >
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </button>

          <div className="absolute bottom-4 left-4 right-4 z-10 rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur-sm text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-sm font-bold text-gray-900 shadow-sm">
                {listing.business.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate text-sm font-semibold">
                  {listing.business}
                  {listing.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  )}
                </p>
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/80">
                  <MapPin className="h-3 w-3" />
                  {listing.flag} {listing.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">Experience</p>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-text-primary transition-colors group-hover:text-amber-600">
                {listing.title}
              </h3>
            </div>
            <div className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-700">
              {listing.price}
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] items-center gap-3 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-2 text-text-primary shadow-sm">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-medium">{listing.rating}</span>
              <span className="text-text-tertiary">({listing.reviewCount})</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setLiked((l) => !l)
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm transition-colors',
                liked ? 'bg-rose-500/10 text-rose-500' : 'bg-white text-text-secondary hover:border-rose-300 hover:text-rose-500'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
              {likeCount}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
