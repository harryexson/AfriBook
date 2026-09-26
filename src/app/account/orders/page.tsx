'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const statuses = ['All', 'Active', 'Completed', 'Cancelled'];

interface OrderItem {
  name?: string;
  quantity?: number;
}

interface Order {
  id: string;
  businessName: string;
  type: string;
  status: string;
  items: OrderItem[];
  total: number;
  currency: string;
  created_at: string;
}

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']);
const COMPLETED_STATUSES = new Set(['delivered', 'completed']);

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  delivered: { color: 'text-green-500 bg-green-500/10', icon: CheckCircle, label: 'Delivered' },
  completed: { color: 'text-green-500 bg-green-500/10', icon: CheckCircle, label: 'Completed' },
  preparing: { color: 'text-blue-500 bg-blue-500/10', icon: Clock, label: 'Preparing' },
  ready: { color: 'text-blue-500 bg-blue-500/10', icon: Clock, label: 'Ready' },
  out_for_delivery: { color: 'text-blue-500 bg-blue-500/10', icon: Clock, label: 'Out for delivery' },
  pending: { color: 'text-amber-500 bg-amber-500/10', icon: Clock, label: 'Pending' },
  confirmed: { color: 'text-amber-500 bg-amber-500/10', icon: Clock, label: 'Confirmed' },
  cancelled: { color: 'text-red-500 bg-red-500/10', icon: XCircle, label: 'Cancelled' },
  refunded: { color: 'text-red-500 bg-red-500/10', icon: XCircle, label: 'Refunded' },
};

function itemsSummary(items: OrderItem[]): string {
  if (!Array.isArray(items) || items.length === 0) return 'Order items';
  return items.map((i) => i.name ?? 'Item').join(', ');
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/order?limit=50')
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.success) {
          setError(body.error ?? 'Failed to load orders');
          return;
        }
        setOrders(body.orders);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load orders');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus =
      activeStatus === 'All' ||
      (activeStatus === 'Active' && ACTIVE_STATUSES.has(order.status)) ||
      (activeStatus === 'Completed' && COMPLETED_STATUSES.has(order.status)) ||
      (activeStatus === 'Cancelled' && (order.status === 'cancelled' || order.status === 'refunded'));
    const matchesSearch =
      searchQuery === '' ||
      order.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }), [orders, activeStatus, searchQuery]);

  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
          My Orders
        </h1>
        <p className="text-text-secondary">Track and manage your orders</p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeStatus === status
                  ? 'bg-amber-500 text-white'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading orders…
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 text-center py-8">{error}</p>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-3"
        >
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] ?? statusConfig.pending;
            const StatusIcon = statusInfo.icon;
            const initials = order.businessName.slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={order.id}
                variants={fadeIn}
                className="bg-surface-secondary rounded-xl p-4 border border-border hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-heading font-bold text-sm">
                      {initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-text-primary text-sm truncate">
                        {order.businessName}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-text-tertiary text-xs truncate">{itemsSummary(order.items)}</p>
                    <p className="text-text-tertiary text-xs mt-1">
                      {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className="font-heading font-bold text-text-primary">{formatCurrency(order.total, order.currency)}</p>
                      <p className="text-text-tertiary text-xs">#{order.id.slice(-8)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center py-20 bg-surface-secondary rounded-2xl border border-border"
        >
          <ShoppingBag className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
            No orders found
          </h3>
          <p className="text-text-secondary text-sm">
            {searchQuery ? 'Try a different search term' : 'You haven\'t placed any orders yet.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
