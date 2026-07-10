'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Search, Printer, Clock, CheckCircle2, ChefHat,
  Truck, AlertCircle, X,
} from 'lucide-react'
import OrderCard from '@/components/vendor/OrderCard'
import type { Order, OrderStatus } from '@/types'

const MOCK_ORDERS: Order[] = [
  { id: 'o1', businessId: 'b1', customerId: 'c1', items: [{ id: 'i1', productId: 'p1', name: 'Jollof Rice', quantity: 2, unitPrice: 4500, totalPrice: 9000 }, { id: 'i2', productId: 'p2', name: 'Chapman', quantity: 1, unitPrice: 1500, totalPrice: 1500 }], status: 'pending', subtotal: 10500, tax: 525, deliveryFee: 1000, tip: 0, total: 12025, currencyCode: 'XAF', paymentStatus: 'completed', deliveryAddress: { street: '10 Lekki Phase 1', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '10 Lekki Phase 1, Lagos' }, notes: 'Extra pepper please', createdAt: new Date(Date.now() - 1200000).toISOString(), updatedAt: new Date(Date.now() - 1200000).toISOString() },
  { id: 'o2', businessId: 'b1', customerId: 'c2', items: [{ id: 'i3', productId: 'p3', name: 'Suya Skewers', quantity: 3, unitPrice: 2500, totalPrice: 7500 }], status: 'confirmed', subtotal: 7500, tax: 375, deliveryFee: 1000, tip: 500, total: 9375, currencyCode: 'XAF', paymentStatus: 'completed', deliveryAddress: { street: '25 Victoria Island', city: 'Lagos', state: 'Lagos', postalCode: '100002', countryCode: 'NG', formatted: '25 Victoria Island, Lagos' }, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'o3', businessId: 'b1', customerId: 'c3', items: [{ id: 'i4', productId: 'p4', name: 'Pounded Yam & Egusi', quantity: 1, unitPrice: 5000, totalPrice: 5000 }, { id: 'i5', productId: 'p5', name: 'Suya Skewers', quantity: 2, unitPrice: 2500, totalPrice: 5000 }], status: 'preparing', subtotal: 10000, tax: 500, deliveryFee: 1500, tip: 0, total: 12000, currencyCode: 'XAF', paymentStatus: 'completed', deliveryAddress: { street: '5 Ikeja GRA', city: 'Lagos', state: 'Lagos', postalCode: '100003', countryCode: 'NG', formatted: '5 Ikeja GRA, Lagos' }, createdAt: new Date(Date.now() - 5400000).toISOString(), updatedAt: new Date(Date.now() - 5400000).toISOString() },
  { id: 'o4', businessId: 'b1', customerId: 'c4', items: [{ id: 'i6', productId: 'p6', name: 'Plantain Chips', quantity: 4, unitPrice: 1000, totalPrice: 4000 }], status: 'ready', subtotal: 4000, tax: 200, deliveryFee: 1000, tip: 0, total: 5200, currencyCode: 'XAF', paymentStatus: 'completed', deliveryAddress: { street: '15 Surulere', city: 'Lagos', state: 'Lagos', postalCode: '100004', countryCode: 'NG', formatted: '15 Surulere, Lagos' }, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 7200000).toISOString() },
]

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  ready: CheckCircle2,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  cancelled: AlertCircle,
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
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (search && !o.id.includes(search)) return false
    return true
  })

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  const printOrder = (order: Order) => {
    const ticket = order.items.map((i) => `${i.quantity}x ${i.name}`).join('\n')
    alert(`Kitchen Ticket\n\nOrder #${order.id.slice(-6)}\n\n${ticket}\n\n${order.notes ? `Note: ${order.notes}` : ''}`)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Orders</h1>
        <p className="text-sm text-text-secondary mt-1">Manage incoming orders</p>
      </motion.div>

      {/* Status summary cards */}
      <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { status: 'pending' as const, label: 'Pending', color: 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' },
          { status: 'confirmed' as const, label: 'Confirmed', color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' },
          { status: 'preparing' as const, label: 'Preparing', color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' },
          { status: 'ready' as const, label: 'Ready', color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' },
        ].map((s) => {
          const Icon = STATUS_ICONS[s.status]
          return (
            <button
              key={s.status}
              onClick={() => setFilterStatus(filterStatus === s.status ? 'all' : s.status)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-left',
                filterStatus === s.status ? s.color : 'border-border hover:border-amber-200'
              )}
            >
              <Icon className="w-5 h-5 text-text-secondary mb-2" />
              <p className="text-2xl font-bold text-text-primary">{statusCounts[s.status] || 0}</p>
              <p className="text-xs text-text-secondary">{s.label}</p>
            </button>
          )
        })}
      </motion.div>

      {/* Toolbar */}
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

      {/* Order grid */}
      {filtered.length === 0 ? (
        <motion.div variants={ITEM} className="text-center py-16 rounded-2xl bg-surface border border-border">
          <ChefHat className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No orders found</p>
          <p className="text-sm text-text-tertiary mt-1">Orders will appear here once customers start ordering.</p>
        </motion.div>
      ) : (
        <motion.div variants={ITEM} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <div key={order.id} className="relative">
              <OrderCard order={order} onStatusChange={handleStatusChange} />
              <button
                onClick={() => printOrder(order)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary transition-colors z-10"
                title="Print kitchen ticket"
              >
                <Printer className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Order Timeline Modal */}
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
                <h2 className="text-lg font-semibold text-text-primary font-heading">Order Timeline</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-lg hover:bg-surface-secondary">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="space-y-4">
                {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((step, i) => {
                  const isActive = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].indexOf(selectedOrder.status) >= i
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isActive ? 'bg-amber-500 text-white' : 'bg-surface-secondary text-text-tertiary')}>
                        {i + 1}
                      </div>
                      <div>
                        <p className={cn('text-sm font-medium', isActive ? 'text-text-primary' : 'text-text-tertiary')}>{step.replace('_', ' ')}</p>
                      </div>
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
