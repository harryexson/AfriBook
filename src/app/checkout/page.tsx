'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart-store'
import {
  ShoppingBag, MapPin, Store, Truck, Package,
  ChevronLeft, CheckCircle, ArrowRight, Clock,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function CheckoutPage() {
  const router = useRouter()
  const store = useCartStore()
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePlaceOrder = async () => {
    setSubmitting(true)
    setError(null)

    try {
      if (store.items.length === 0 || store.items[0]?.type !== 'product') {
        throw new Error('No products in cart')
      }

      const orderItems = store.items.map((item) => {
        if (item.type !== 'product') throw new Error('Only product orders supported')
        return {
          productId: item.product.id,
          quantity: item.quantity,
          variant: item.variantId,
          notes: item.notes,
        }
      })

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: store.businessId,
          items: orderItems,
          deliveryAddress: store.fulfillmentMethod === 'delivery' ? 'Customer address' : undefined,
          notes: store.notes,
        }),
      })

      const orderData = await res.json()
      if (!res.ok) throw new Error(orderData.error ?? 'Order failed')

      if (store.fulfillmentMethod === 'pickup') {
        const pickupRes = await fetch('/api/orders/pickup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.id,
            businessId: store.businessId,
            pickupNotes: store.pickupNotes || undefined,
          }),
        })

        if (!pickupRes.ok) {
          const pickupErr = await pickupRes.json()
          throw new Error(pickupErr.error ?? 'Pickup creation failed')
        }

        const pickupData = await pickupRes.json()
        setOrderResult({ ...orderData, pickupCode: pickupData.pickupCode })
      } else {
        setOrderResult(orderData)
      }

      store.clearCart()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = store.subtotal()
  const total = store.total()

  if (orderResult) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-surface rounded-2xl border border-border p-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-text-primary font-heading">Order Placed!</h1>
          <p className="text-sm text-text-secondary mt-2">
            {store.fulfillmentMethod === 'pickup'
              ? 'Your order is being prepared for pickup.'
              : 'Your order is on its way!'}
          </p>
          <div className="mt-4 p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs text-text-tertiary">Order ID</p>
            <p className="text-sm font-mono font-bold text-text-primary">{orderResult.id.slice(0, 12)}</p>
          </div>
          {orderResult.pickupCode && (
            <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 font-medium">Pickup Code</p>
              <p className="text-2xl font-bold tracking-widest text-amber-700 dark:text-amber-400 font-mono mt-1">
                {orderResult.pickupCode}
              </p>
              <p className="text-[10px] text-amber-600 mt-1">
                Show this code when collecting your order
              </p>
            </div>
          )}
          <button
            onClick={() => router.push('/orders')}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25"
          >
            View My Orders
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <motion.div variants={CONTAINER} initial="hidden" animate="visible">
          {/* Header */}
          <motion.div variants={ITEM} className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface transition-colors">
              <ChevronLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <h1 className="text-lg font-bold text-text-primary font-heading">Checkout</h1>
          </motion.div>

          {/* Delivery vs Pickup toggle */}
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Fulfillment Method</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => store.setFulfillmentMethod('delivery')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  store.fulfillmentMethod === 'delivery'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                    : 'border-border bg-surface-secondary hover:border-amber-200',
                )}
              >
                <Truck className={cn('w-6 h-6', store.fulfillmentMethod === 'delivery' ? 'text-amber-600' : 'text-text-tertiary')} />
                <span className={cn('text-sm font-medium', store.fulfillmentMethod === 'delivery' ? 'text-amber-700' : 'text-text-secondary')}>
                  Delivery
                </span>
                <span className="text-[10px] text-text-tertiary">Get it delivered</span>
              </button>
              <button
                onClick={() => store.setFulfillmentMethod('pickup')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  store.fulfillmentMethod === 'pickup'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                    : 'border-border bg-surface-secondary hover:border-amber-200',
                )}
              >
                <Package className={cn('w-6 h-6', store.fulfillmentMethod === 'pickup' ? 'text-amber-600' : 'text-text-tertiary')} />
                <span className={cn('text-sm font-medium', store.fulfillmentMethod === 'pickup' ? 'text-amber-700' : 'text-text-secondary')}>
                  Pickup
                </span>
                <span className="text-[10px] text-text-tertiary">Collect in person</span>
              </button>
            </div>
          </motion.div>

          {/* Pickup notes */}
          {store.fulfillmentMethod === 'pickup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-2xl bg-surface border border-border p-4"
            >
              <h2 className="text-sm font-semibold text-text-primary mb-2">Pickup Notes</h2>
              <textarea
                value={store.pickupNotes}
                onChange={(e) => store.setPickupNotes(e.target.value)}
                placeholder="Any special instructions for pickup..."
                className="w-full p-3 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-amber-500 resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                A pickup code will be generated after placing the order
              </div>
            </motion.div>
          )}

          {/* Order summary */}
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Order Summary</h2>
            <div className="space-y-2">
              {store.items.map((item, i) => {
                if (item.type !== 'product') return null
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                        {item.quantity}
                      </span>
                      <span className="text-sm text-text-primary truncate">{item.product.name}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      ₦{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {store.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>-₦{store.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-text-primary pt-1">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-2">Order Notes</h2>
            <textarea
              value={store.notes}
              onChange={(e) => store.setNotes(e.target.value)}
              placeholder="Any special requests..."
              className="w-full p-3 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-amber-500 resize-none"
              rows={2}
            />
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div variants={ITEM} className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Place order button */}
          <motion.div variants={ITEM}>
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || store.items.length === 0}
              className={cn(
                'w-full py-3.5 rounded-xl font-bold text-sm transition-all',
                'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
                'shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
              )}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {store.fulfillmentMethod === 'pickup' ? 'Place Pickup Order' : 'Place Order'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
