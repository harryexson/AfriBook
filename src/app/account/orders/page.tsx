'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
  ShoppingBag,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const statuses = ['All', 'Active', 'Completed', 'Cancelled'];

const orders = [
  {
    id: 'AFB-2025-001',
    vendor: 'Mama Nkechi\'s Kitchen',
    items: 'Jollof Rice, Chicken Wings, Plantain',
    total: '$15.50',
    status: 'Delivered',
    date: 'January 10, 2025',
    image: 'MN',
  },
  {
    id: 'AFB-2025-002',
    vendor: 'Glamour Salon',
    items: 'Hair Styling Service',
    total: '$25.00',
    status: 'Confirmed',
    date: 'January 15, 2025',
    image: 'GS',
  },
  {
    id: 'AFB-2025-003',
    vendor: 'TechFix Hub',
    items: 'iPhone Screen Repair',
    total: '$45.00',
    status: 'In Progress',
    date: 'January 11, 2025',
    image: 'TF',
  },
  {
    id: 'AFB-2025-004',
    vendor: 'Adunni Fashion House',
    items: 'Ankara Print Dress',
    total: '$32.00',
    status: 'Delivered',
    date: 'January 8, 2025',
    image: 'AF',
  },
  {
    id: 'AFB-2025-005',
    vendor: 'Kwame Tech',
    items: 'Wireless Bluetooth Speaker',
    total: '$35.00',
    status: 'Delivered',
    date: 'January 5, 2025',
    image: 'KT',
  },
  {
    id: 'AFB-2025-006',
    vendor: 'QuickBite Lagos',
    items: 'Suya & Fries, Coke',
    total: '$9.50',
    status: 'Cancelled',
    date: 'January 3, 2025',
    image: 'QB',
  },
  {
    id: 'AFB-2025-007',
    vendor: 'Nairobi Fresh Market',
    items: 'Fresh Vegetables Bundle',
    total: '$18.00',
    status: 'Delivered',
    date: 'December 28, 2024',
    image: 'NF',
  },
  {
    id: 'AFB-2025-008',
    vendor: 'EduConnect',
    items: 'Math Tutoring (5 sessions)',
    total: '$50.00',
    status: 'Delivered',
    date: 'December 20, 2024',
    image: 'EC',
  },
];

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  Delivered: { color: 'text-green-500 bg-green-500/10', icon: CheckCircle },
  'In Progress': { color: 'text-blue-500 bg-blue-500/10', icon: Clock },
  Confirmed: { color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  Cancelled: { color: 'text-red-500 bg-red-500/10', icon: XCircle },
};

export default function OrdersPage() {
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      activeStatus === 'All' ||
      (activeStatus === 'Active' && ['Confirmed', 'In Progress'].includes(order.status)) ||
      (activeStatus === 'Completed' && order.status === 'Delivered') ||
      (activeStatus === 'Cancelled' && order.status === 'Cancelled');
    const matchesSearch =
      searchQuery === '' ||
      order.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
          My Orders
        </h1>
        <p className="text-text-secondary">Track and manage your orders</p>
      </motion.div>

      {/* Search & Filters */}
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

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-3"
        >
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const StatusIcon = statusInfo.icon;
            return (
              <motion.div
                key={order.id}
                variants={fadeIn}
                className="bg-surface-secondary rounded-xl p-4 border border-border hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-heading font-bold text-sm">
                      {order.image}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-text-primary text-sm truncate">
                        {order.vendor}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {order.status}
                      </span>
                    </div>
                    <p className="text-text-tertiary text-xs truncate">{order.items}</p>
                    <p className="text-text-tertiary text-xs mt-1">{order.date}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className="font-heading font-bold text-text-primary">{order.total}</p>
                      <p className="text-text-tertiary text-xs">{order.id}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
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
