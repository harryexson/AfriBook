'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, CheckCircle, Clock, MapPin, Phone, MessageCircle,
  XCircle, AlertTriangle, Truck, Package, ChefHat, ShoppingBag,
  Loader2,
} from 'lucide-react'
import MapEmbed from '@/components/shared/MapEmbed'
import Button from '@/components/ui/Button'
import { cn, formatCurrency, timeAgo } from '@/lib/utils'
import type { Order, OrderStatus, Driver, Delivery } from '@/types'

const MOCK_ORDER: Order = {
  id: 'ORD-ABC123', businessId: 'b1', customerId: 'u1',
  items: [
    { id: 'oi1', productId: 'p1', name: 'Fresh Produce Box', quantity: 1, unitPrice: 3500, totalPrice: 3500 },
    { id: 'oi2', productId: 'p2', name: 'Express Delivery', quantity: 1, unitPrice: 1500, totalPrice: 1500 },
  ],
  status: 'confirmed', subtotal: 5000, tax: 375, deliveryFee: 0, tip: 0, total: 5875,
  currencyCode: 'NGN', paymentStatus: 'completed',
  deliveryAddress: { street: '12 Admiralty Way', city: 'Lekki', state: 'Lagos', postalCode: '100005', countryCode: 'NG', formatted: '12 Admiralty Way, Lekki, Lagos', geoPoint: { latitude: 6.4281, longitude: 3.4219 } },
  estimatedDeliveryAt: new Date(Date.now() + 45 * 60000).toISOString(),
  notes: 'Please deliver to the side gate', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

const MOCK_DRIVER: Driver = {
  id: 'd1', userId: 'ud1', name: 'Chidi Okonkwo', phone: '+234 800 555 9999', email: 'chidi@afribook.com',
  avatarUrl: '', vehicle: { id: 'v1', type: 'motorcycle', make: 'Honda', model: 'CBR 250', year: 2023, color: 'Red', licensePlate: 'LAG 123 XY', insuranceVerified: true },
  status: 'available', location: { latitude: 6.4512, longitude: 3.4223 }, earnings: 0, rating: 4.7,
  totalTrips: 342, isVerified: true, documentsVerified: true, createdAt: '', updatedAt: '',
}

const MOCK_DELIVERY: Delivery = {
  id: 'del1', orderId: 'ORD-ABC123', driverId: 'd1',
  status: 'picked_up',
  pickupAddress: { street: '12 Ahmadu Bello Way', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '12 Ahmadu Bello Way, Victoria Island, Lagos' },
  dropoffAddress: { street: '12 Admiralty Way', city: 'Lekki', state: 'Lagos', postalCode: '100005', countryCode: 'NG', formatted: '12 Admiralty Way, Lekki, Lagos' },
  estimatedPickupAt: new Date(Date.now() - 10 * 60000).toISOString(),
  estimatedDropoffAt: new Date(Date.now() + 35 * 60000).toISOString(),
  actualPickupAt: new Date(Date.now() - 5 * 60000).toISOString(),
}

const STATUS_FLOW: { status: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { status: 'pending', label: 'Order placed', icon: ShoppingBag, description: 'Your order has been received' },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Business has accepted your order' },
  { status: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Your order is being prepared' },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: Truck, description: 'Driver is on the way' },
  { status: 'delivered', label: 'Delivered', icon: Package, description: 'Order delivered successfully' },
]

const CANCELABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed']

function getCurrentStep(status: OrderStatus): number {
  const idx = STATUS_FLOW.findIndex((s) => s.status === status)
  return idx >= 0 ? idx : 0
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()

  const order = MOCK_ORDER
  const driver = MOCK_DRIVER
  const delivery = MOCK_DELIVERY

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [eta] = useState('35 min')

  const currentStep = getCurrentStep(order.status)
  const canCancel = CANCELABLE_STATUSES.includes(order.status)
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'
  const isLive = order.status === 'out_for_delivery' || order.status === 'preparing'
  const dropoffGeo = order.deliveryAddress.geoPoint

  const handleCancelOrder = () => {
    setCancelling(true)
    setTimeout(() => {
      setCancelling(false)
      setShowCancelModal(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">Order tracking</h1>
            <p className="text-sm text-text-secondary mt-1">Order #{order.id}</p>
          </div>
          <span className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold',
            isDelivered ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
            isCancelled ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
          )}>
            {isDelivered ? 'Delivered' : isCancelled ? 'Cancelled' : order.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Live tracking map */}
        {isLive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <div className="h-48 rounded-2xl bg-surface-secondary border border-border relative overflow-hidden">
              <MapEmbed
                bare
                center={{
                  latitude: dropoffGeo?.latitude ?? 6.4281,
                  longitude: dropoffGeo?.longitude ?? 3.4219,
                }}
                marker={{ latitude: driver.location.latitude, longitude: driver.location.longitude }}
                title="Order delivery map"
              />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-medium text-emerald-600 shadow-sm">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Live</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ETA card */}
        {isLive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-2xl border border-border p-5 mb-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Estimated arrival</p>
              <p className="text-xl font-bold text-text-primary">{eta}</p>
              {delivery?.estimatedDropoffAt && (
                <p className="text-xs text-text-tertiary">
                  {new Date(delivery.estimatedDropoffAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
            <Button size="sm" className="ml-auto">
              Contact driver
            </Button>
          </motion.div>
        )}

        {/* Driver info */}
        {isLive && driver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-2xl border border-border p-5 mb-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
              {driver.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-text-primary">{driver.name}</p>
              <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                <span>★ {driver.rating.toFixed(1)}</span>
                <span>{driver.vehicle.make} {driver.vehicle.model} &middot; {driver.vehicle.color}</span>
              </div>
              <p className="text-xs text-text-tertiary">{driver.vehicle.licensePlate}</p>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${driver.phone}`} className="p-2.5 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-amber-500 hover:border-amber-500/30 transition-all">
                <Phone className="w-4 h-4" />
              </a>
              <a href={`sms:${driver.phone}`} className="p-2.5 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-amber-500 hover:border-amber-500/30 transition-all">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}

        {/* Status timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-2xl border border-border p-6 mb-6"
        >
          <h2 className="font-bold font-heading text-text-primary mb-6">Order status</h2>

          <div className="relative">
            {STATUS_FLOW.map((step, i) => {
              const isActive = i <= currentStep
              const isCurrent = i === currentStep
              return (
                <div key={step.status} className="flex items-start gap-4 pb-8 last:pb-0 relative">
                  {/* Connector line */}
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={cn(
                      'absolute left-[15px] top-8 w-0.5 h-8',
                      i < currentStep ? 'bg-amber-500' : 'bg-border'
                    )} />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all',
                    isActive ? 'bg-amber-500 text-white' : 'bg-surface-tertiary text-text-tertiary',
                    isCurrent && 'ring-4 ring-amber-500/20'
                  )}>
                    <step.icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className={cn(
                      'font-semibold text-sm',
                      isActive ? 'text-text-primary' : 'text-text-tertiary'
                    )}>
                      {step.label}
                    </p>
                    <p className={cn(
                      'text-xs mt-0.5',
                      isActive ? 'text-text-secondary' : 'text-text-tertiary'
                    )}>
                      {step.description}
                    </p>
                    {isCurrent && (
                      <div className="flex items-center gap-1 mt-1">
                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                        <span className="text-xs text-amber-500 font-medium">In progress</span>
                      </div>
                    )}
                  </div>

                  {isCurrent && (
                    <span className="text-xs text-text-tertiary mt-1.5 shrink-0">
                      {timeAgo(order.updatedAt)}
                    </span>
                  )}
                </div>
              )
            })}

            {/* Cancelled step */}
            {isCancelled && (
              <div className="flex items-start gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 z-10">
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-semibold text-sm text-red-500">Cancelled</p>
                  <p className="text-xs text-text-secondary mt-0.5">Order was cancelled</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Order details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface rounded-2xl border border-border p-6 mb-6"
        >
          <h2 className="font-bold font-heading text-text-primary mb-4">Order details</h2>

          <div className="space-y-3 mb-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-text-primary">{formatCurrency(item.totalPrice, order.currencyCode)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatCurrency(order.subtotal, order.currencyCode)}</span></div>
            <div className="flex justify-between text-text-secondary"><span>Tax</span><span>{formatCurrency(order.tax, order.currencyCode)}</span></div>
            <div className="flex justify-between text-lg font-bold text-text-primary pt-2 border-t border-border mt-2"><span>Total</span><span>{formatCurrency(order.total, order.currencyCode)}</span></div>
          </div>
        </motion.div>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface rounded-2xl border border-border p-6 mb-6"
          >
            <h3 className="font-semibold text-text-primary mb-2">Delivery address</h3>
            <div className="flex items-start gap-2 text-sm text-text-secondary">
              <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>{order.deliveryAddress.formatted}</span>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 sm:flex-none">
            <Button onClick={() => router.push(`/${params?.country}/search`)} className="w-full">
              Order again
            </Button>
          </div>
          <div className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full">
              Contact support
            </Button>
          </div>
          {canCancel && !isCancelled && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-red-200 dark:border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              Cancel order
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !cancelling && setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-center text-text-primary">Cancel order?</h3>
              <p className="text-sm text-text-secondary text-center mt-2">
                This action cannot be undone. A cancellation fee may apply.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-medium text-sm hover:bg-surface-secondary transition-colors"
                >
                  Keep order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" />Cancelling...</> : 'Yes, cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
