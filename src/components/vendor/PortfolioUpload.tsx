'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, X, ChevronUp, ChevronDown, Trash2, CheckSquare,
  Square, Eye, Film, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PortfolioItem {
  id: string
  file?: File
  previewUrl: string
  type: 'image' | 'video'
  name: string
  size: number
  category?: string
  caption?: string
  hasConsent: boolean
  isBeforeAfter?: boolean
  beforeAfterPairId?: string
  uploading?: boolean
  progress?: number
}

interface PortfolioUploadProps {
  onFilesChange?: (files: PortfolioItem[]) => void
  maxFiles?: number
  maxFileSizeMB?: number
  existingItems?: PortfolioItem[]
  showCategories?: boolean
  showConsent?: boolean
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm'

const CATEGORIES = ['Haircut', 'Coloring', 'Styling', 'Nails', 'Before/After']

function generateId() {
  return `pf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function PortfolioUpload({
  onFilesChange,
  maxFiles = 20,
  maxFileSizeMB = 50,
  existingItems = [],
  showCategories = true,
  showConsent = true,
}: PortfolioUploadProps) {
  const [items, setItems] = useState<PortfolioItem[]>(existingItems)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [beforeAfterMode, setBeforeAfterMode] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const notifyChange = useCallback(
    (next: PortfolioItem[]) => {
      onFilesChange?.(next)
    },
    [onFilesChange],
  )

  const validateFile = (file: File): string | null => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type)
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type)
    if (!isImage && !isVideo) {
      return `"${file.name}" is not a supported file type.`
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return `"${file.name}" exceeds the ${maxFileSizeMB} MB limit.`
    }
    return null
  }

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      const newErrors: string[] = []
      const remaining = maxFiles - items.length
      const toProcess = files.slice(0, remaining)

      if (files.length > remaining) {
        newErrors.push(`You can only add ${remaining} more file(s). Maximum is ${maxFiles}.`)
      }

      const validItems: PortfolioItem[] = []

      for (const file of toProcess) {
        const error = validateFile(file)
        if (error) {
          newErrors.push(error)
          continue
        }

        const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type)
        const item: PortfolioItem = {
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(file),
          type: isVideo ? 'video' : 'image',
          name: file.name,
          size: file.size,
          hasConsent: false,
          uploading: true,
          progress: 0,
        }
        validItems.push(item)
      }

      if (validItems.length > 0) {
        const next = [...items, ...validItems]
        setItems(next)
        notifyChange(next)

        validItems.forEach((item) => {
          simulateProgress(item.id)
        })
      }

      if (newErrors.length > 0) {
        setErrors(newErrors)
        setTimeout(() => setErrors([]), 5000)
      }
    },
    [items, maxFiles, maxFileSizeMB, notifyChange],
  )

  const simulateProgress = (id: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setItems((prev) => {
          const next = prev.map((item) =>
            item.id === id ? { ...item, uploading: false, progress: 100 } : item,
          )
          notifyChange(next)
          return next
        })
      } else {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, progress } : item)))
      }
    }, 300 + Math.random() * 400)
  }

  const removeItem = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    const next = items.filter((i) => i.id !== id)
    setItems(next)
    setSelectedIds((prev) => {
      const next2 = new Set(prev)
      next2.delete(id)
      return next2
    })
    notifyChange(next)
  }

  const updateItem = (id: string, patch: Partial<PortfolioItem>) => {
    const next = items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    setItems(next)
    notifyChange(next)
  }

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= items.length) return
    const next = [...items]
    ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
    setItems(next)
    notifyChange(next)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }

  const deleteSelected = () => {
    selectedIds.forEach((id) => {
      const item = items.find((i) => i.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    const next = items.filter((i) => !selectedIds.has(i.id))
    setItems(next)
    setSelectedIds(new Set())
    notifyChange(next)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary font-heading">
          Portfolio Upload
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBeforeAfterMode(!beforeAfterMode)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              beforeAfterMode
                ? 'bg-amber-500 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary border border-border',
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            Before &amp; After
          </button>
          <span className="text-xs text-text-secondary">
            {items.length}/{maxFiles} files
          </span>
        </div>
      </div>

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

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
          isDragging
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-border hover:border-amber-500/50 hover:bg-surface-secondary',
        )}
      >
        <motion.div
          animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="p-4 rounded-2xl bg-surface-secondary">
            <Camera className="w-8 h-8 text-amber-500" />
          </div>
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            Drag &amp; drop your work here
          </p>
          <p className="text-xs text-text-secondary mt-1">
            or{' '}
            <span className="text-amber-500 font-medium underline underline-offset-2">
              click to browse
            </span>
          </p>
        </div>
        <p className="text-xs text-text-tertiary">
          JPG, PNG, WEBP, GIF, MP4, MOV, WEBM &middot; Max {maxFileSizeMB} MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
          className="hidden"
        />
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select all
            </button>
            {selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={deleteSelected}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete selected ({selectedIds.size})
              </motion.button>
            )}
          </div>
        </div>
      )}

      {beforeAfterMode && items.length >= 2 && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Before &amp; After mode: Pair images by assigning them the same pair ID below. Each
            pair shows images side by side in the gallery.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'rounded-2xl border bg-surface overflow-hidden transition-all',
                selectedIds.has(item.id) ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border',
              )}
            >
              <div className="relative aspect-square bg-surface-secondary">
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
                      <div className="p-3 rounded-full bg-black/50 backdrop-blur-sm">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {item.uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-3/4">
                      <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-amber-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress ?? 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-white text-center mt-2">
                        {Math.round(item.progress ?? 0)}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(item.id)
                    }}
                    className={cn(
                      'p-1 rounded-lg backdrop-blur-sm transition-colors',
                      selectedIds.has(item.id)
                        ? 'bg-amber-500 text-white'
                        : 'bg-black/30 text-white hover:bg-black/50',
                    )}
                  >
                    {selectedIds.has(item.id) ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded-lg bg-black/30 text-white hover:bg-black/50 disabled:opacity-30 backdrop-blur-sm transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={idx === items.length - 1}
                    className="p-1 rounded-lg bg-black/30 text-white hover:bg-black/50 disabled:opacity-30 backdrop-blur-sm transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-lg bg-black/30 text-white hover:bg-red-500 backdrop-blur-sm transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                    <p className="text-xs text-text-tertiary">{formatFileSize(item.size)}</p>
                  </div>
                </div>

                {showCategories && (
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          updateItem(item.id, {
                            category: item.category === cat ? undefined : cat,
                          })
                        }
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                          item.category === cat
                            ? 'bg-amber-500 text-white'
                            : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary border border-border',
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {beforeAfterMode && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Pair ID
                    </label>
                    <input
                      type="text"
                      value={item.beforeAfterPairId ?? ''}
                      onChange={(e) =>
                        updateItem(item.id, {
                          beforeAfterPairId: e.target.value || undefined,
                          isBeforeAfter: !!e.target.value,
                        })
                      }
                      placeholder="e.g. pair-1"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={item.caption ?? ''}
                    onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                    placeholder="Add a caption..."
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>

                {showConsent && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.hasConsent}
                      onChange={(e) => updateItem(item.id, { hasConsent: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30"
                    />
                    <span className="text-xs text-text-secondary leading-relaxed">
                      I confirm I have customer consent to post this image
                    </span>
                  </label>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
