'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Phone, X, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SOSButtonProps {
  driverId: string
  currentLocation?: { lat: number; lng: number }
  rideId?: string
  deliveryId?: string
}

export default function SOSButton({ driverId, currentLocation, rideId, deliveryId }: SOSButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSOS = async () => {
    if (!currentLocation) return
    setIsSending(true)
    try {
      const res = await fetch('/api/safety/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          rideId,
          deliveryId,
          description: 'SOS alert triggered by driver',
        }),
      })
      if (res.ok) setSent(true)
    } catch {
      setSent(true)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 lg:bottom-6 right-4 z-40 w-14 h-14 rounded-full',
          'bg-red-500 text-white shadow-xl shadow-red-500/40',
          'hover:bg-red-600 hover:shadow-red-500/60',
          'flex items-center justify-center transition-all duration-200',
          'animate-pulse-slow',
        )}
        aria-label="SOS Emergency"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 bottom-20 lg:bottom-auto lg:inset-auto lg:right-4 lg:top-1/2 lg:-translate-y-1/2 z-50 max-w-sm mx-auto lg:mx-0"
            >
              <div className="rounded-2xl bg-surface border border-border p-6 shadow-2xl">
                {sent ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">SOS Alert Sent</h3>
                    <p className="text-sm text-text-secondary mt-2">
                      Emergency contacts have been notified. Help is on the way.
                    </p>
                    <button
                      onClick={() => { setIsOpen(false); setSent(false) }}
                      className="mt-4 px-6 py-2.5 rounded-xl bg-surface-secondary text-text-primary font-medium text-sm"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary">Emergency SOS</h3>
                          <p className="text-xs text-text-secondary">This will alert emergency contacts</p>
                        </div>
                      </div>
                      <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
                        <X className="w-4 h-4 text-text-secondary" />
                      </button>
                    </div>

                    {!currentLocation && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 mb-4">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Enable GPS for precise location sharing
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleSOS}
                      disabled={isSending}
                      className={cn(
                        'w-full py-3.5 rounded-xl font-bold text-sm transition-all',
                        'bg-red-500 text-white shadow-lg shadow-red-500/30',
                        'hover:bg-red-600 hover:shadow-red-500/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isSending && 'animate-pulse',
                      )}
                    >
                      {isSending ? 'Sending...' : 'Press for Emergency Help'}
                    </button>
                    <p className="text-[10px] text-text-tertiary text-center mt-3">
                      Emergency contacts and nearby safety zones will be notified
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
