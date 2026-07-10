'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency, formatTime } from '@/lib/utils'
import { Clock, User, ChefHat, CheckCircle2, Truck, AlertCircle } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'

interface OrderCardProps {
  order: Order
  onStatusChange?: (orderId: string, status: OrderStatus) => void
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: AlertCircle },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const status = STATUS_CONFIG[order.status]
  const StatusIcon = status.icon
  const nextStatus = NEXT_STATUS[order.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-surface border border-border p-5 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">#{order.id.slice(-6)}</p>
        </div>
        <p className="text-lg font-bold text-text-primary">{formatCurrency(order.total, order.currencyCode)}</p>
      </div>

      <div className="space-y-1.5 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              {item.quantity}x {item.name}
              {item.variant && <span className="text-text-tertiary ml-1">({item.variant})</span>}
            </span>
            <span className="font-medium text-text-primary">{formatCurrency(item.totalPrice, order.currencyCode)}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="p-3 rounded-xl bg-surface-secondary mb-4">
          <p className="text-xs text-text-secondary">{order.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(order.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {order.customerId.slice(-4)}
        </span>
      </div>

      {nextStatus && (
        <div className="mt-4 pt-3 border-t border-border-light">
          <button
            onClick={() => onStatusChange?.(order.id, nextStatus)}
            className="w-full py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            Mark as {STATUS_CONFIG[nextStatus].label}
          </button>
        </div>
      )}
    </motion.div>
  )
}
