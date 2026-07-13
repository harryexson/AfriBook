'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

interface LightboxItem {
  type: 'image' | 'video'
  url: string
  caption?: string
}

interface ReviewLightboxProps {
  items: LightboxItem[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (index: number) => void
}

// ─── Component ───────────────────────────────────────────────

export default function ReviewLightbox({
  items,
  initialIndex,
  isOpen,
  onClose,
  onNavigate,
}: ReviewLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = items[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1

  // Sync external index changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])

  // Reset video state on index change
  useEffect(() => {
    setIsPlaying(false)
    setProgress(0)
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goPrev()
          break
        case 'ArrowRight':
          goNext()
          break
      }
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, currentIndex])

  const goPrev = useCallback(() => {
    if (hasPrev) {
      const next = currentIndex - 1
      setCurrentIndex(next)
      onNavigate?.(next)
    }
  }, [currentIndex, hasPrev, onNavigate])

  const goNext = useCallback(() => {
    if (hasNext) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      onNavigate?.(next)
    }
  }, [currentIndex, hasNext, onNavigate])

  // Video controls
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    video.currentTime = pct * video.duration
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }

  // Touch / swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
    setTouchDelta(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    setTouchDelta(e.touches[0].clientX - touchStart)
  }

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 60) {
      if (touchDelta > 0) goPrev()
      else goNext()
    }
    setTouchStart(null)
    setTouchDelta(0)
  }

  if (!isOpen || !current) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-4 py-3 z-10">
            <span className="text-white/70 text-sm">
              {currentIndex + 1} / {items.length}
            </span>

            <div className="flex items-center gap-3">
              {current.type === 'video' && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Main content area ── */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
            {/* Prev arrow */}
            {hasPrev && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Media display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                {current.type === 'image' ? (
                  <img
                    src={current.url}
                    alt={current.caption || `Photo ${currentIndex + 1}`}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="relative max-w-full">
                    <video
                      ref={videoRef}
                      src={current.url}
                      className="max-w-full max-h-[70vh] rounded-lg"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      playsInline
                      controls={false}
                    />

                    {/* Play overlay */}
                    {!isPlaying && (
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors rounded-lg"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                          <Play className="w-7 h-7 text-amber-500 ml-1" />
                        </div>
                      </button>
                    )}

                    {/* Video controls bar */}
                    {isPlaying && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={togglePlay}
                            className="text-white"
                          >
                            <Pause className="w-4 h-4" />
                          </button>

                          {/* Progress bar */}
                          <div
                            className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer group"
                            onClick={handleSeek}
                          >
                            <div
                              className="h-full bg-amber-500 rounded-full relative"
                              style={{ width: `${progress}%` }}
                            >
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="text-white"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Next arrow */}
            {hasNext && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* ── Caption ── */}
          {current.caption && (
            <div className="text-center py-2">
              <p className="text-sm text-white/70">{current.caption}</p>
            </div>
          )}

          {/* ── Thumbnail strip ── */}
          {items.length > 1 && (
            <div className="flex justify-center gap-2 px-4 pb-4 pt-2 overflow-x-auto scrollbar-thin">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx)
                    onNavigate?.(idx)
                  }}
                  className={cn(
                    'w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                    idx === currentIndex
                      ? 'border-amber-500 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-white/10">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
