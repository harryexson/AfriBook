'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, MapPin, Clock, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CheckInType } from '@/types/pickup-security'

interface CheckInModalProps {
  isOpen: boolean
  onClose: () => void
  driverId: string
  checkInType: CheckInType
  scheduledAt?: string
  onCompleted?: () => void
}

export default function CheckInModal({ isOpen, onClose, driverId, checkInType, scheduledAt, onCompleted }: CheckInModalProps) {
  const [step, setStep] = useState<'location' | 'photo' | 'confirming' | 'done'>('location')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not available')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStep('photo')
      },
      () => setError('Could not get location'),
    )
  }

  const handleSubmit = async () => {
    if (!location) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/safety/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInType,
          lat: location.lat,
          lng: location.lng,
          scheduledAt,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Check-in failed')
      }
      setStep('done')
      onCompleted?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeLabels: Record<CheckInType, string> = {
    shift_start: 'Shift Start',
    pre_delivery: 'Pre-Delivery',
    post_delivery: 'Post-Delivery',
    scheduled_check: 'Scheduled Check',
    geofence_entry: 'Zone Entry',
    geofence_exit: 'Zone Exit',
    shift_end: 'Shift End',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-4 z-50 max-w-md mx-auto"
          >
            <div className="rounded-2xl bg-surface border border-border p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-text-primary">{typeLabels[checkInType]} Check-In</h3>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary">
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {step === 'location' && (
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">Share your current location to complete this check-in.</p>
                  <button
                    onClick={getCurrentLocation}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Share My Location
                  </button>
                </div>
              )}

              {step === 'photo' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    Location captured
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <Camera className="w-4 h-4 text-text-secondary" />
                    <p className="text-xs text-text-secondary">Photo is optional. Skip to confirm check-in.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Confirming...' : 'Confirm Check-In'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'done' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-bold text-text-primary">Check-In Complete</h4>
                  <p className="text-sm text-text-secondary mt-1">Stay safe out there!</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-surface-secondary text-text-primary font-medium text-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
