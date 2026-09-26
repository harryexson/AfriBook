'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Car, ShieldCheck, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrackData {
  success: boolean
  error?: string
  status?: string
  pickup?: string | null
  dropoff?: string | null
  driver?: { firstName: string; vehicle: string; plate: string | null } | null
  location?: { lat: number; lng: number } | null
}

const POLL_MS = 8000

const STATUS_LABEL: Record<string, string> = {
  requested: 'Finding a driver…',
  accepted: 'Driver assigned',
  arrived: 'Driver has arrived at pickup',
  in_progress: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Trip was cancelled',
}

/**
 * No-login live-tracking page for a shared ride link — built for guardians,
 * caregivers, and organizations monitoring someone else's trip (a minor, a
 * dependent, a vulnerable rider) without needing an AfriBook account.
 */
export default function TrackRidePage() {
  const params = useParams<{ token: string }>()
  const [data, setData] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchOnce = () => {
      fetch(`/api/track/${params.token}`)
        .then((res) => res.json())
        .then((body) => {
          if (!cancelled) setData(body)
        })
        .catch(() => {
          if (!cancelled) setData({ success: false, error: 'Unable to load this trip' })
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }
    fetchOnce()
    const interval = setInterval(fetchOnce, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [params.token])

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-semibold">AfriBook Safety Tracking</span>
          </div>
          <p className="text-xs text-amber-100 mt-1">Shared live trip view — no account needed</p>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading trip…
            </div>
          )}

          {!loading && (!data || !data.success) && (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">{data?.error ?? 'This tracking link is invalid'}</p>
            </div>
          )}

          {!loading && data?.success && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex px-3 py-1 rounded-full text-xs font-semibold',
                    data.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : data.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {STATUS_LABEL[data.status ?? ''] ?? data.status}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-tertiary">
                  <RefreshCw className="w-3 h-3" /> live
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="text-text-primary">{data.pickup ?? 'Pickup location'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className="text-text-primary">{data.dropoff ?? 'Destination'}</span>
                </div>
              </div>

              {data.driver && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">Driver: {data.driver.firstName}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {data.driver.vehicle}{data.driver.plate ? ` · ${data.driver.plate}` : ''}
                    </p>
                  </div>
                </div>
              )}

              {data.location && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <MapPin className="w-3.5 h-3.5" />
                  Live position updates every {POLL_MS / 1000}s
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
