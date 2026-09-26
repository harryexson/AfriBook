'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/neon/client'
import {
  Search, Printer, Clock, CheckCircle2, ChefHat,
  Truck, AlertCircle, X, Loader2,
} from 'lucide-react'
import type { RestaurantOrder, RestaurantOrderStatus } from '@/lib/retrobuddy/types'

// Real orders, backed by `ridely_food_deliveries` via /api/retrobuddy/orders.
// This table models the whole delivery lifecycle (dispatch + driver states
// included), not just the restaurant's own prep flow — a restaurant can
// only ever move an order through: accept -> mark ready. Everything past
// "ready for pickup" (picked_up/in_transit/at_dropoff/delivered) is the
// driver's doing, shown here read-only.

type BoardStage = 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'

const STAGE_OF: Record<RestaurantOrderStatus, BoardStage> = {
  requesting: 'new', searching: 'new', matched: 'new',
  accepted: 'preparing',
  en_route_to_pickup: 'ready', at_pickup: 'ready',
  picked_up: 'out_for_delivery', in_transit: 'out_for_delivery', at_dropoff: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
}

const STAGE_LABEL: Record<BoardStage, string> = {
  new: 'New', preparing: 'Preparing', ready: 'Ready for pickup',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
}

const STAGE_ICON: Record<BoardStage, React.ComponentType<{ className?: string }>> = {
  new: Clock, preparing: ChefHat, ready: CheckCircle2,
  out_for_delivery: Truck, delivered: CheckCircle2, cancelled: AlertCircle,
}

const STAGE_COLOR: Record<BoardStage, string> = {
  new: 'border-amber-500 bg-amber-50 dark:bg-amber-900/10',
  preparing: 'border-purple-500 bg-purple-50 dark:bg-purple-900/10',
  ready: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
  out_for_delivery: 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
  delivered: 'border-green-500 bg-green-50 dark:bg-green-900/10',
  cancelled: 'border-red-500 bg-red-50 dark:bg-red-900/10',
}

/** The one action a restaurant can take from a given status, if any. */
const NEXT_ACTION: Partial<Record<RestaurantOrderStatus, { label: string; next: RestaurantOrderStatus }>> = {
  requesting: { label: 'Accept order', next: 'accepted' },
  searching: { label: 'Accept order', next: 'accepted' },
  matched: { label: 'Accept order', next: 'accepted' },
  accepted: { label: 'Mark ready for pickup', next: 'at_pickup' },
}

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function OrdersPage() {
  const [supabase] = useState(() => createClient())
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<BoardStage | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const { data: business } = await (supabase.from('businesses') as any)
        .select('id').eq('owner_id', user.id).limit(1).maybeSingle()
      if (!business) throw new Error('No business found for this account')
      const { data: restaurant } = await (supabase.from('restaurants') as any)
        .select('id').eq('business_id', business.id).maybeSingle()
      if (!restaurant) throw new Error('No restaurant found for this business')
      setRestaurantId(restaurant.id)

      const res = await fetch(`/api/retrobuddy/orders?restaurantId=${restaurant.id}&limit=100`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to load orders')
      setOrders(body.orders)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Poll for new/updated orders — no realtime channel available on the
  // Neon clients (see the migration notes), so this is the honest substitute.
  useEffect(() => {
    if (!restaurantId) return
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [restaurantId, load])

  const filtered = orders.filter((o) => {
    if (stageFilter !== 'all' && STAGE_OF[o.status] !== stageFilter) return false
    if (search && !o.id.includes(search)) return false
    return true
  })

  const stageCounts = orders.reduce((acc, o) => {
    const s = STAGE_OF[o.status]
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {} as Record<BoardStage, number>)

  const advanceStatus = async (order: RestaurantOrder) => {
    const action = NEXT_ACTION[order.status]
    if (!action) return
    setBusyOrderId(order.id)
    try {
      const res = await fetch(`/api/retrobuddy/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.next }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error ?? 'Failed to update order')
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
    } catch {
      // Best-effort UI update — a full reload will correct any drift.
      load()
    } finally {
      setBusyOrderId(null)
    }
  }

  const printOrder = (order: RestaurantOrder) => {
    const ticket = order.items.map((i) => `${i.quantity}x ${i.name}`).join('\n')
    alert(`Kitchen Ticket\n\nOrder #${order.id.slice(-6)}\n\n${ticket}\n\n${order.specialInstructions ? `Note: ${order.specialInstructions}` : ''}`)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Orders</h1>
        <p className="text-sm text-text-secondary mt-1">Manage incoming orders</p>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading orders…
        </div>
      )}

      {!loading && loadError && (
        <motion.div variants={ITEM} className="text-center py-16 rounded-2xl bg-surface border border-border">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{loadError}</p>
        </motion.div>
      )}

      {!loading && !loadError && (
        <>
          {/* Status summary cards */}
          <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['new', 'preparing', 'ready', 'out_for_delivery'] as BoardStage[]).map((stage) => {
              const Icon = STAGE_ICON[stage]
              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    stageFilter === stage ? STAGE_COLOR[stage] : 'border-border hover:border-amber-200',
                  )}
                >
                  <Icon className="w-5 h-5 text-text-secondary mb-2" />
                  <p className="text-2xl font-bold text-text-primary">{stageCounts[stage] || 0}</p>
                  <p className="text-xs text-text-secondary">{STAGE_LABEL[stage]}</p>
                </button>
              )
            })}
          </motion.div>

          <motion.div variants={ITEM} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            </div>
          </motion.div>

          {filtered.length === 0 ? (
            <motion.div variants={ITEM} className="text-center py-16 rounded-2xl bg-surface border border-border">
              <ChefHat className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No orders found</p>
              <p className="text-sm text-text-tertiary mt-1">Orders will appear here once customers start ordering.</p>
            </motion.div>
          ) : (
            <motion.div variants={ITEM} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((order) => {
                const stage = STAGE_OF[order.status]
                const Icon = STAGE_ICON[stage]
                const action = NEXT_ACTION[order.status]
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="relative rounded-2xl bg-surface border border-border p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); printOrder(order) }}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary transition-colors z-10"
                      title="Print kitchen ticket"
                    >
                      <Printer className="w-4 h-4 text-text-secondary" />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', STAGE_COLOR[stage])}>
                        <Icon className="w-3 h-3" />
                        {STAGE_LABEL[stage]}
                      </span>
                      <span className="text-xs text-text-tertiary">#{order.id.slice(-6)}</span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items.slice(0, 3).map((item) => (
                        <p key={item.id} className="text-sm text-text-primary">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-text-tertiary">+{order.items.length - 3} more</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-primary">{formatCurrency(order.total, order.currencyCode)}</span>
                      {action && (
                        <button
                          onClick={(e) => { e.stopPropagation(); advanceStatus(order) }}
                          disabled={busyOrderId === order.id}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                          {busyOrderId === order.id ? '…' : action.label}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary font-heading">Order #{selectedOrder.id.slice(-6)}</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-lg hover:bg-surface-secondary">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="space-y-4">
                {(['new', 'preparing', 'ready', 'out_for_delivery', 'delivered'] as BoardStage[]).map((stage, i, all) => {
                  const currentIdx = all.indexOf(STAGE_OF[selectedOrder.status])
                  const isActive = currentIdx >= i
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', isActive ? 'bg-amber-500 text-white' : 'bg-surface-secondary text-text-tertiary')}>
                        {i + 1}
                      </div>
                      <p className={cn('text-sm font-medium', isActive ? 'text-text-primary' : 'text-text-tertiary')}>{STAGE_LABEL[stage]}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
