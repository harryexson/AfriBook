'use client'

import { useState, useRef } from 'react'
import { Camera, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoCaptureProps {
  onPhotoCapture: (photoUrl: string) => void
  label?: string
  description?: string
}

export default function PhotoCapture({ onPhotoCapture, label = 'Take Photo', description }: PhotoCaptureProps) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCapturing(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPhoto(dataUrl)
      onPhotoCapture(dataUrl)
      setIsCapturing(false)
    }
    reader.onerror = () => setIsCapturing(false)
    reader.readAsDataURL(file)
  }

  const handleCapture = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {description && (
        <p className="text-xs text-text-secondary">{description}</p>
      )}

      {photo ? (
        <div className="relative rounded-xl overflow-hidden bg-surface-secondary">
          <img src={photo} alt="Captured" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-2 right-2 flex gap-1">
            <div className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Captured
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className={cn(
            'w-full h-32 rounded-xl border-2 border-dashed border-border',
            'flex flex-col items-center justify-center gap-2',
            'hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10',
            'transition-all cursor-pointer',
            isCapturing && 'opacity-50',
          )}
        >
          {isCapturing ? (
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                <Camera className="w-5 h-5 text-text-secondary" />
              </div>
              <span className="text-sm font-medium text-text-secondary">{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
