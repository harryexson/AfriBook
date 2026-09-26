'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Navigation, Phone, Store, User, Loader2, AlertCircle } from 'lucide-react'
import DeliveryProgress from '@/components/driver/DeliveryProgress'
import SOSButton from '@/components/driver/SOSButton'
import VoiceNavigation from '@/components/driver/VoiceNavigation'
import type { DeliveryStep } from '@/components/driver/DeliveryProgress'
import { useCountry } from '@/components/shared/CountryProvider'
import { formatMoneySymbol, getCurrencyForCountry } from '@/lib/money'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

interface DeliveryItem {
  name?: string
  quantity?: number
}

interface DeliveryDetail {
  id: string
  orderId: string
  status: string
  items: DeliveryItem[]
  total: number
  vendorName: string
  vendorAddress: string | null
  vendorLocation: { lat: number; lng: number } | null
  vendorPhone: string | null
  customerName: string
  customerAddress: string | null
  customerLocation: { lat: number; lng: number } | null
  customerPhone: string | null
}

/** DB status -> the 5-step UI model DeliveryProgress renders. */
function stepFor(status: string): DeliveryStep {
  if (status === 'delivered') return 'delivered'
  if (status === 'in_transit' || status === 'at_dropoff') return 'in_transit'
  if (status === 'picked_up') return 'picked_up'
  if (status === 'at_pickup') return 'arrived_at_vendor'
  return 'assigned'
}

export default function ActiveDeliveryPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { countryCode } = useCountry()
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [arrivedLocally, setArrivedLocally] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<'vendor' | 'customer' | null>(null)

  const load = () => {
    fetch(`/api/driver/delivery/${params.id}`)
      .then((res) => res.json())
      .then((body) => {
        if (!body.success) {
          setError(body.error ?? 'Failed to load delivery')
          return
        }
        setDelivery(body.data)
      })
      .catch(() => setError('Failed to load delivery'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [params.id])

  const advance = async (status: string) => {
    setBusy(true)
    setActionError('')
    try {
      const res = await fetch(`/api/driver/delivery/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await res.json()
      if (!body.success) throw new Error(body.error ?? 'Failed to update')
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update delivery')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-text-secondary">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading delivery…
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">{error || 'Delivery not found'}</p>
      </div>
    )
  }

  const step = arrivedLocally && delivery.status === 'accepted' ? 'arrived_at_vendor' : stepFor(delivery.status)
  const currency = getCurrencyForCountry(countryCode)

  return (
    <>
      <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-4 pb-24">
        <motion.div variants={ITEM} className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary font-heading">Active Delivery</h1>
            <p className="text-xs text-text-secondary">#{delivery.orderId.slice(-8)}</p>
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white">
          <p className="text-sm text-amber-100 font-medium">Order Total</p>
          <p className="text-2xl font-bold">{formatMoneySymbol(delivery.total, currency)}</p>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Progress</h2>
          <DeliveryProgress
            currentStep={step}
            onStepClick={(s) => {
              if (s === 'arrived_at_vendor') setArrivedLocally(true)
            }}
          />
          {actionError && <p className="text-xs text-red-600 mt-3">{actionError}</p>}
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Store className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{delivery.vendorName}</p>
              <p className="text-xs text-text-secondary truncate">{delivery.vendorAddress ?? 'Pickup location'}</p>
            </div>
            {delivery.vendorPhone && (
              <a href={`tel:${delivery.vendorPhone}`} className="p-2 rounded-lg bg-surface-secondary hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                <Phone className="w-4 h-4 text-amber-600" />
              </a>
            )}
          </div>
          <button
            onClick={() => setNavigatingTo('vendor')}
            disabled={!delivery.vendorLocation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-secondary text-text-primary font-medium text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Navigate to Vendor
          </button>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{delivery.customerName}</p>
              <p className="text-xs text-text-secondary truncate">{delivery.customerAddress ?? 'Dropoff location'}</p>
            </div>
            {delivery.customerPhone && (
              <a href={`tel:${delivery.customerPhone}`} className="p-2 rounded-lg bg-surface-secondary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <Phone className="w-4 h-4 text-blue-600" />
              </a>
            )}
          </div>
          <button
            onClick={() => setNavigatingTo('customer')}
            disabled={!delivery.customerLocation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-secondary text-text-primary font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Navigate to Customer
          </button>
        </motion.div>

        {Array.isArray(delivery.items) && delivery.items.length > 0 && (
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Items ({delivery.items.length})</h2>
            <div className="space-y-2">
              {delivery.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                      {item.quantity ?? 1}
                    </span>
                    <span className="text-sm text-text-primary truncate">{item.name ?? 'Item'}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div variants={ITEM} className="flex gap-3">
          {delivery.status === 'at_pickup' && (
            <button
              onClick={() => advance('picked_up')}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 transition-all"
            >
              {busy ? 'Updating…' : 'Collect Items from Vendor'}
            </button>
          )}
          {(delivery.status === 'accepted' || delivery.status === 'en_route_to_pickup') && (
            <p className="flex-1 text-center text-sm text-text-tertiary py-3">Waiting for the restaurant to mark this order ready…</p>
          )}
          {delivery.status === 'picked_up' && (
            <button
              onClick={() => advance('in_transit')}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 transition-all"
            >
              {busy ? 'Updating…' : 'Start Delivery'}
            </button>
          )}
          {delivery.status === 'in_transit' && (
            <button
              onClick={() => advance('delivered')}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
            >
              {busy ? 'Updating…' : 'Mark as Delivered'}
            </button>
          )}
          {delivery.status === 'delivered' && (
            <p className="flex-1 text-center text-sm font-semibold text-emerald-600 py-3">Delivered — nice work!</p>
          )}
        </motion.div>
      </motion.div>

      <SOSButton
        driverId={delivery.id}
        currentLocation={delivery.vendorLocation ?? delivery.customerLocation ?? undefined}
        deliveryId={delivery.id}
      />

      {navigatingTo && (
        <VoiceNavigation
          destination={(navigatingTo === 'vendor' ? delivery.vendorLocation : delivery.customerLocation)!}
          destinationLabel={navigatingTo === 'vendor' ? delivery.vendorName : delivery.customerName}
          onClose={() => setNavigatingTo(null)}
        />
      )}
    </>
  )
}
