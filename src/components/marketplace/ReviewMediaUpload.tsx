'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, X, Film, ChevronUp, ChevronDown, AlertTriangle,
} from 'lucide-react'

export interface ReviewMedia {
  id: string
  file: File
  previewUrl: string
  type: 'image' | 'video'
  name: string
  size: number
}

interface ReviewMediaUploadProps {
  onMediaChange: (media: ReviewMedia[]) => void
  maxItems?: number
  maxVideoDurationSec?: number
  maxFileSizeMB?: number
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.mp4,.mov'

function generateId() {
  return `rm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function ReviewMediaUpload({
  onMediaChange,
  maxItems = 5,
  maxVideoDurationSec = 30,
  maxFileSizeMB = 50,
}: ReviewMediaUploadProps) {
  const [media, setMedia] = useState<ReviewMedia[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const notifyChange = useCallback(
    (next: ReviewMedia[]) => {
      onMediaChange(next)
    },
    [onMediaChange],
  )

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      const newErrors: string[] = []
      const remaining = maxItems - media.length
      const toProcess = files.slice(0, remaining)

      if (files.length > remaining) {
        newErrors.push(`You can only add ${remaining} more item(s). Maximum is ${maxItems}.`)
      }

      const validMedia: ReviewMedia[] = []

      for (const file of toProcess) {
        const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type)
        const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type)

        if (!isImage && !isVideo) {
          newErrors.push(`"${file.name}" is not a supported file type.`)
          continue
        }

        if (file.size > maxFileSizeMB * 1024 * 1024) {
          newErrors.push(`"${file.name}" exceeds the ${maxFileSizeMB} MB limit.`)
          continue
        }

        if (isVideo) {
          const item: ReviewMedia = {
            id: generateId(),
            file,
            previewUrl: URL.createObjectURL(file),
            type: 'video',
            name: file.name,
            size: file.size,
          }
          validMedia.push(item)
        } else {
          const item: ReviewMedia = {
            id: generateId(),
            file,
            previewUrl: URL.createObjectURL(file),
            type: 'image',
            name: file.name,
            size: file.size,
          }
          validMedia.push(item)
        }
      }

      if (validMedia.length > 0) {
        const next = [...media, ...validMedia]
        setMedia(next)
        notifyChange(next)
      }

      if (newErrors.length > 0) {
        setErrors(newErrors)
        setTimeout(() => setErrors([]), 5000)
      }
    },
    [media, maxItems, maxFileSizeMB, notifyChange],
  )

  const removeItem = (id: string) => {
    const item = media.find((m) => m.id === id)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    const next = media.filter((m) => m.id !== id)
    setMedia(next)
    notifyChange(next)
  }

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const idx = media.findIndex((m) => m.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= media.length) return
    const next = [...media]
    ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
    setMedia(next)
    notifyChange(next)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3"
          >
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {media.length < maxItems && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-amber-500/50 hover:bg-surface-secondary cursor-pointer transition-all"
        >
          <div className="p-2.5 rounded-xl bg-surface-secondary">
            <Camera className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              Add photos or video
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              JPG, PNG, WEBP, MP4, MOV &middot; Max {maxVideoDurationSec}s video &middot;{' '}
              {media.length}/{maxItems}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
          />
        </div>
      )}

      {media.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          <AnimatePresence mode="popLayout">
            {media.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-surface-secondary border border-border group"
              >
                {item.type === 'image' ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={item.previewUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                        <Film className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={idx === media.length - 1}
                    className="p-1 rounded bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="absolute bottom-1 left-1">
                  <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium">
                    {formatFileSize(item.size)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
