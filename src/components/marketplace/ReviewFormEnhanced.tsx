'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Camera,
  Video,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

export interface EnhancedReviewSubmission {
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
  recommend: boolean
  consentGiven: boolean
}

interface ReviewFormEnhancedProps {
  businessId: string
  businessName: string
  onSubmit: (review: EnhancedReviewSubmission) => Promise<void>
  isSubmitting?: boolean
}

// ─── Constants ───────────────────────────────────────────────

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
const ASPECT_KEYS = [
  { key: 'quality' as const, label: 'Quality', icon: '⭐' },
  { key: 'value' as const, label: 'Value for Money', icon: '💰' },
  { key: 'professionalism' as const, label: 'Professionalism', icon: '🤝' },
  { key: 'punctuality' as const, label: 'Punctuality', icon: '⏱️' },
]
const MAX_PHOTOS = 5
const MAX_VIDEOS = 2
const MAX_BODY_LENGTH = 2000
const MAX_TITLE_LENGTH = 100
const MAX_VIDEO_SIZE_MB = 50
const MAX_VIDEO_DURATION_S = 30

const CONSENT_TEXT =
  'By posting this review, I confirm that: (1) This review reflects my genuine experience. (2) Any photos/videos I upload are of my own experience and I have consent to share them. (3) I accept full legal responsibility for this content. (4) I release AfriBook and its owners from any liability arising from my review. (5) I understand this review is voluntary and I will not hold AfriBook responsible for any consequences.'

// ─── Component ───────────────────────────────────────────────

export default function ReviewFormEnhanced({
  businessId: _businessId,
  businessName,
  onSubmit,
  isSubmitting = false,
}: ReviewFormEnhancedProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [media, setMedia] = useState<
    { type: 'image' | 'video'; url: string; caption?: string }[]
  >([])
  const [aspectRatings, setAspectRatings] = useState<{
    quality?: number
    value?: number
    professionalism?: number
    punctuality?: number
  }>({})
  const [recommend, setRecommend] = useState(true)
  const [consentGiven, setConsentGiven] = useState(false)
  const [showAspects, setShowAspects] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [videoError, setVideoError] = useState('')

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const photoCount = media.filter((m) => m.type === 'image').length
  const videoCount = media.filter((m) => m.type === 'video').length
  const canAddPhoto = photoCount < MAX_PHOTOS
  const canAddVideo = videoCount < MAX_VIDEOS

  const isValid =
    rating > 0 &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    body.length <= MAX_BODY_LENGTH &&
    consentGiven

  // ── Media handlers ──────────────────────────────────────

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (isImage && canAddPhoto) {
          const reader = new FileReader()
          reader.onload = (ev) => {
            const result = ev.target?.result
            if (typeof result === 'string') {
              setMedia((prev) => {
                const images = prev.filter((m) => m.type === 'image')
                if (images.length >= MAX_PHOTOS) return prev
                return [...prev, { type: 'image' as const, url: result }]
              })
            }
          }
          reader.readAsDataURL(file)
        }

        if (isVideo && canAddVideo) {
          if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setVideoError(`Video exceeds ${MAX_VIDEO_SIZE_MB}MB limit`)
            return
          }

          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src)
            if (video.duration > MAX_VIDEO_DURATION_S) {
              setVideoError(`Video exceeds ${MAX_VIDEO_DURATION_S}s limit`)
              return
            }
            setVideoError('')
            const reader = new FileReader()
            reader.onload = (ev) => {
              const result = ev.target?.result
              if (typeof result === 'string') {
                setMedia((prev) => {
                  const videos = prev.filter((m) => m.type === 'video')
                  if (videos.length >= MAX_VIDEOS) return prev
                  return [...prev, { type: 'video' as const, url: result }]
                })
              }
            }
            reader.readAsDataURL(file)
          }
          video.src = URL.createObjectURL(file)
        }
      })
    },
    [canAddPhoto, canAddVideo],
  )

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files)
    e.target.value = ''
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files)
    e.target.value = ''
  }

  const removeMedia = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files)
  }

  // ── Aspect rating handler ───────────────────────────────

  const setAspect = (key: keyof typeof aspectRatings, value: number) => {
    setAspectRatings((prev) => ({ ...prev, [key]: value }))
  }

  // ── Submit ──────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    await onSubmit({
      rating,
      title,
      body,
      media,
      aspectRatings:
        Object.values(aspectRatings).some((v) => v !== undefined)
          ? aspectRatings
          : undefined,
      recommend,
      consentGiven,
    })
    setIsSuccess(true)
  }

  // ── Success state ───────────────────────────────────────

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 space-y-4"
      >
        <ConfettiAnimation />
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h3 className="text-xl font-bold text-text-primary">
            Thank you for your review!
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Your feedback helps the community make better choices.
          </p>
        </motion.div>
      </motion.div>
    )
  }

  // ── Main form ───────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Business name */}
      <div>
        <p className="text-sm text-text-secondary">Reviewing</p>
        <p className="font-semibold text-text-primary">{businessName}</p>
      </div>

      {/* Heading */}
      <h2 className="text-lg font-bold text-text-primary">
        Share your experience
      </h2>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">
          Overall Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'w-9 h-9 transition-colors duration-150',
                  (hoveredRating || rating) >= star
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-text-tertiary',
                )}
              />
            </button>
          ))}
          {(hoveredRating || rating) > 0 && (
            <span className="ml-2 text-sm font-medium text-text-secondary">
              {RATING_LABELS[hoveredRating || rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="enhanced-review-title"
          className="block text-sm font-semibold text-text-primary mb-2"
        >
          Title
        </label>
        <input
          id="enhanced-review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={MAX_TITLE_LENGTH}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
        />
        <p className="text-xs text-text-tertiary mt-1 text-right">
          {title.length}/{MAX_TITLE_LENGTH}
        </p>
      </div>

      {/* Body */}
      <div>
        <label
          htmlFor="enhanced-review-body"
          className="block text-sm font-semibold text-text-primary mb-2"
        >
          Your Review
        </label>
        <textarea
          id="enhanced-review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell others about your experience — what did you enjoy? What could be improved?"
          rows={5}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
        />
        <div className="flex justify-end mt-1">
          <span
            className={cn(
              'text-xs',
              body.length > MAX_BODY_LENGTH
                ? 'text-red-500 font-medium'
                : 'text-text-tertiary',
            )}
          >
            {body.length}/{MAX_BODY_LENGTH}
          </span>
        </div>
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-3">
          Photos & Videos{' '}
          <span className="font-normal text-text-tertiary">(optional)</span>
        </label>

        {/* Drop zone */}
        <div
          className={cn(
            'rounded-xl border-2 border-dashed transition-colors duration-200 p-4',
            dragOver
              ? 'border-amber-500 bg-amber-500/5'
              : 'border-border bg-surface-secondary',
          )}
        >
          {/* Media items */}
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {media.map((item, idx) => (
                <motion.div
                  key={`${item.type}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex-shrink-0"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-secondary border border-border">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-amber-500 ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Upload buttons */}
          <div className="flex gap-2">
            {canAddPhoto && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:border-amber-500 hover:text-amber-500 transition-colors text-sm"
              >
                <Camera className="w-4 h-4" />
                Photo ({photoCount}/{MAX_PHOTOS})
              </button>
            )}
            {canAddVideo && (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:border-amber-500 hover:text-amber-500 transition-colors text-sm"
              >
                <Video className="w-4 h-4" />
                Video ({videoCount}/{MAX_VIDEOS})
              </button>
            )}
            {!canAddPhoto && !canAddVideo && (
              <p className="text-xs text-text-tertiary py-2">
                Maximum media uploads reached
              </p>
            )}
          </div>

          {videoError && (
            <p className="text-xs text-red-500 mt-2">{videoError}</p>
          )}
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          multiple
          onChange={handleVideoUpload}
          className="hidden"
        />
      </div>

      {/* Aspect Ratings (expandable) */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAspects(!showAspects)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-primary hover:bg-surface-secondary transition-colors"
        >
          <span>Rate specific aspects</span>
          {showAspects ? (
            <ChevronUp className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          )}
        </button>

        <AnimatePresence>
          {showAspects && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {ASPECT_KEYS.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                      {icon} {label}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setAspect(key, star)}
                          className="p-0.5 transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'w-5 h-5 transition-colors',
                              (aspectRatings[key] || 0) >= star
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-text-tertiary',
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recommend toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text-primary">
          Recommend this provider?
        </label>
        <button
          type="button"
          onClick={() => setRecommend(!recommend)}
          className={cn(
            'relative w-12 h-7 rounded-full transition-colors duration-200',
            recommend ? 'bg-amber-500' : 'bg-surface-secondary border border-border',
          )}
        >
          <motion.div
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm"
            animate={{ left: recommend ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Consent Section */}
      <div className="border-2 border-amber-500/40 rounded-xl p-4 bg-amber-500/[0.03] space-y-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-text-secondary">
            {CONSENT_TEXT}
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30 accent-amber-500"
          />
          <span className="text-sm text-text-primary group-hover:text-amber-500 transition-colors">
            I agree to the Content Posting Agreement
          </span>
        </label>

        <a
          href="/content-agreement"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-amber-500 hover:text-amber-600 underline underline-offset-2 transition-colors"
        >
          Read full agreement
        </a>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={!isValid || isSubmitting}
        whileTap={isValid ? { scale: 0.98 } : undefined}
        className={cn(
          'w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
          isValid && !isSubmitting
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
            : 'bg-surface-secondary text-text-tertiary cursor-not-allowed border border-border',
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Submit Review
          </>
        )}
      </motion.button>
    </form>
  )
}

// ─── Confetti animation (pure CSS/React, no dependencies) ───

function ConfettiAnimation() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color:
      ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'][
        i % 6
      ],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="relative w-full h-20 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: 100,
            x: (Math.random() - 0.5) * 120,
            opacity: [1, 1, 0],
            rotate: p.rotation + 360,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
