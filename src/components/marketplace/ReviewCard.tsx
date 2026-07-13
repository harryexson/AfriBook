'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  ThumbsUp,
  Flag,
  ChevronDown,
  ChevronRight,
  Play,
  BadgeCheck,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import ReviewLightbox from './ReviewLightbox'

// ─── Types ───────────────────────────────────────────────────

export interface DisplayReview {
  id: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  body: string
  media: { type: 'image' | 'video'; url: string; caption?: string }[]
  aspectRatings?: {
    quality?: number
    value?: number
    professionalism?: number
    punctuality?: number
  }
  recommend?: boolean
  isVerifiedPurchase: boolean
  hasConsent: boolean
  helpfulCount: number
  createdAt: string
  vendorReply?: { text: string; createdAt: string }
}

interface ReviewCardProps {
  review: DisplayReview
  onHelpful?: (reviewId: string) => void
  onReport?: (reviewId: string) => void
}

// ─── Constants ───────────────────────────────────────────────

const ASPECT_META: Record<
  string,
  { label: string; icon: string }
> = {
  quality: { label: 'Quality', icon: '⭐' },
  value: { label: 'Value', icon: '💰' },
  professionalism: { label: 'Professionalism', icon: '🤝' },
  punctuality: { label: 'Punctuality', icon: '⏱️' },
}

const MAX_VISIBLE_MEDIA = 3
const BODY_TRUNCATE_LENGTH = 200

// ─── Component ───────────────────────────────────────────────

export default function ReviewCard({
  review,
  onHelpful,
  onReport,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [helpfulClicked, setHelpfulClicked] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showReportConfirm, setShowReportConfirm] = useState(false)

  const needsTruncation = review.body.length > BODY_TRUNCATE_LENGTH
  const displayBody =
    expanded || !needsTruncation
      ? review.body
      : review.body.slice(0, BODY_TRUNCATE_LENGTH) + '…'

  const visibleMedia = review.media.slice(0, MAX_VISIBLE_MEDIA)
  const extraCount = review.media.length - MAX_VISIBLE_MEDIA

  const handleHelpful = () => {
    if (helpfulClicked) return
    setHelpfulClicked(true)
    onHelpful?.(review.id)
  }

  const handleReport = () => {
    setShowReportConfirm(true)
  }

  const confirmReport = () => {
    onReport?.(review.id)
    setShowReportConfirm(false)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl border border-border p-5 space-y-4"
    >
      {/* ── Header: Avatar + Name + Date + Badges ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {review.userAvatar ? (
              <img
                src={review.userAvatar}
                alt={review.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-text-secondary">
                {review.userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {review.userName}
              </span>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <span className="text-xs text-text-tertiary">
              {timeAgo(review.createdAt)}
            </span>
          </div>
        </div>

        {review.hasConsent && (
          <span className="inline-flex items-center gap-1 text-[10px] text-text-tertiary">
            <ShieldCheck className="w-3 h-3" />
            Content agreed
          </span>
        )}
      </div>

      {/* ── Star Rating ── */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= review.rating
                ? 'text-amber-500 fill-amber-500'
                : 'text-text-tertiary',
            )}
          />
        ))}
      </div>

      {/* ── Title ── */}
      {review.title && (
        <h3 className="font-bold text-text-primary">{review.title}</h3>
      )}

      {/* ── Body ── */}
      {review.body && (
        <div>
          <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
            {displayBody}
          </p>
          {needsTruncation && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-amber-500 hover:text-amber-600 font-medium mt-1 transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* ── Media Gallery ── */}
      {review.media.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {visibleMedia.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-border group"
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.caption || `Photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="relative w-full h-full bg-surface-secondary">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 text-amber-500 ml-0.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* +N more overlay */}
              {idx === MAX_VISIBLE_MEDIA - 1 && extraCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    +{extraCount} more
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Aspect Ratings ── */}
      {review.aspectRatings && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 rounded-xl bg-surface-secondary">
          {Object.entries(ASPECT_META).map(([key, meta]) => {
            const val = review.aspectRatings?.[key as keyof typeof review.aspectRatings]
            if (!val) return null
            const pct = (val / 5) * 100
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {val}/5
                  </span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Recommend Badge ── */}
      {review.recommend !== undefined && (
        <div className="flex items-center gap-2">
          {review.recommend ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              Recommended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
              <X className="w-3.5 h-3.5" />
              Not recommended
            </span>
          )}
        </div>
      )}

      {/* ── Actions: Helpful + Report ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={helpfulClicked}
          className={cn(
            'flex items-center gap-1.5 text-xs transition-colors',
            helpfulClicked
              ? 'text-amber-500 font-medium'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful ({review.helpfulCount + (helpfulClicked ? 1 : 0)})
        </button>

        <div className="relative">
          {showReportConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Report?</span>
              <button
                type="button"
                onClick={confirmReport}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowReportConfirm(false)}
                className="text-xs text-text-tertiary hover:text-text-secondary"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleReport}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              Report
            </button>
          )}
        </div>
      </div>

      {/* ── Vendor Reply ── */}
      {review.vendorReply && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-secondary rounded-xl p-4 space-y-2 border-l-[3px] border-amber-500"
        >
          <div className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-text-primary">
              Reply from business
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {review.vendorReply.text}
          </p>
          <span className="text-[10px] text-text-tertiary">
            {timeAgo(review.vendorReply.createdAt)}
          </span>
        </motion.div>
      )}

      {/* ── Lightbox ── */}
      <ReviewLightbox
        items={review.media}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </motion.article>
  )
}
