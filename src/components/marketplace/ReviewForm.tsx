'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Star, ImageUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  onSubmit: (data: { rating: number; title: string; body: string; images: string[] }) => void
  isSubmitting?: boolean
  maxLength?: number
  className?: string
  businessName?: string
}

export default function ReviewForm({
  onSubmit,
  isSubmitting = false,
  maxLength = 1000,
  className,
  businessName,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const charCount = body.length
  const isValid = rating > 0 && title.trim().length > 0 && body.trim().length > 0 && charCount <= maxLength

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result
        if (typeof result === 'string') {
          setImages((prev) => [...prev, result].slice(0, 5))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSubmit({ rating, title, body, images })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      {businessName && (
        <div>
          <p className="text-sm text-text-secondary">Reviewing</p>
          <p className="font-semibold text-text-primary">{businessName}</p>
        </div>
      )}

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Rating</label>
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
                  'w-8 h-8 transition-colors',
                  (hoveredRating || rating) >= star
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-text-tertiary'
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-text-secondary">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-semibold text-text-primary mb-2">
          Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Body */}
      <div>
        <label htmlFor="review-body" className="block text-sm font-semibold text-text-primary mb-2">
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your experience..."
          rows={4}
          maxLength={maxLength + 100}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className={cn(
            'text-xs',
            charCount > maxLength ? 'text-red-500 font-medium' : 'text-text-tertiary'
          )}>
            {charCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Photos (optional)</label>
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-secondary">
              <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-text-tertiary hover:border-amber-500/50 hover:text-amber-500 transition-colors"
            >
              <ImageUp className="w-5 h-5" />
              <span className="text-xs">{images.length}/5</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={!isValid || isSubmitting}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-all',
          isValid && !isSubmitting
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
            : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
        )}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </motion.button>
    </form>
  )
}
