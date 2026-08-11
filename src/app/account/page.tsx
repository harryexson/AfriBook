'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Heart,
  Bell,
  Settings,
  TrendingUp,
  Package,
  ChevronRight,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const quickLinks = [
  {
    href: '/account/orders',
    label: 'My Orders',
    icon: ShoppingBag,
    count: '3 active',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    href: '/account/favorites',
    label: 'Favorites',
    icon: Heart,
    count: '12 saved',
    color: 'bg-red-500/10 text-red-500',
  },
  {
    href: '/account/notifications',
    label: 'Notifications',
    icon: Bell,
    count: '5 new',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    href: '/account/settings',
    label: 'Settings',
    icon: Settings,
    count: 'Profile',
    color: 'bg-purple-500/10 text-purple-500',
  },
];

const recentOrders = [
  {
    id: 'AFB-2025-001',
    vendor: 'Mama Nkechi\'s Kitchen',
    items: 'Jollof Rice, Chicken Wings',
    total: '$15.50',
    status: 'Delivered',
    date: '2 days ago',
  },
  {
    id: 'AFB-2025-002',
    vendor: 'Glamour Salon',
    items: 'Hair Styling Service',
    total: '$25.00',
    status: 'Upcoming',
    date: 'Tomorrow',
  },
  {
    id: 'AFB-2025-003',
    vendor: 'TechFix Hub',
    items: 'Phone Screen Repair',
    total: '$45.00',
    status: 'In Progress',
    date: 'Today',
  },
];

const stats = [
  { label: 'Total Orders', value: '24', change: '+3 this month' },
  { label: 'Total Spent', value: '$342', change: '+$45 this month' },
  { label: 'Favorites', value: '12', change: '+2 this week' },
  { label: 'Reviews Given', value: '18', change: '+1 this week' },
];

export default function AccountPage() {
  return (
    <div>
      {/* Welcome Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="mb-8"
      >
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
          Welcome back! 👋
        </h1>
        <p className="text-text-secondary">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {quickLinks.map((link) => (
          <motion.div key={link.href} variants={fadeIn}>
            <Link
              href={link.href}
              className="block bg-surface-secondary rounded-2xl p-5 border border-border hover:border-amber-500/50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${link.color}`}>
                <link.icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-text-primary text-sm mb-1">
                {link.label}
              </h3>
              <p className="text-text-tertiary text-xs">{link.count}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeIn}
            className="bg-surface-secondary rounded-2xl p-5 border border-border"
          >
            <p className="text-text-tertiary text-sm mb-1">{stat.label}</p>
            <p className="font-heading text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stat.change}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-surface-secondary rounded-2xl border border-border"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-text-primary">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-amber-500 hover:text-amber-600 text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentOrders.map((order) => (
            <div key={order.id} className="p-5 flex items-center gap-4 hover:bg-surface/50 transition-colors">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-text-primary text-sm truncate">
                  {order.vendor}
                </p>
                <p className="text-text-tertiary text-xs truncate">{order.items}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading font-bold text-text-primary text-sm">{order.total}</p>
                <p className={`text-xs font-medium ${
                  order.status === 'Delivered'
                    ? 'text-green-500'
                    : order.status === 'In Progress'
                    ? 'text-blue-500'
                    : 'text-amber-500'
                }`}>
                  {order.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
