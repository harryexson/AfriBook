'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  Truck,
  Tag,
  CreditCard,
  Settings,
  Trash2,
  ShoppingBag,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const notifications = [
  {
    id: 1,
    type: 'delivery',
    icon: Truck,
    title: 'Your order is on the way!',
    message: 'Your delivery from Mama Nkechi\'s Kitchen is arriving in 15 minutes.',
    time: '10 minutes ago',
    read: false,
  },
  {
    id: 2,
    type: 'order',
    icon: Package,
    title: 'Order confirmed',
    message: 'Your appointment with Glamour Salon has been confirmed for tomorrow at 2 PM.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    type: 'promo',
    icon: Tag,
    title: 'New deal available!',
    message: 'Get 20% off your next food order. Use code AFRI20 at checkout.',
    time: '3 hours ago',
    read: false,
  },
  {
    id: 4,
    type: 'payment',
    icon: CreditCard,
    title: 'Payment successful',
    message: 'Your payment of $45.00 to TechFix Hub was processed successfully.',
    time: '5 hours ago',
    read: true,
  },
  {
    id: 5,
    type: 'delivery',
    icon: Package,
    title: 'Delivery completed',
    message: 'Your order from Nairobi Fresh Market has been delivered. Rate your experience!',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 6,
    type: 'promo',
    icon: Tag,
    title: 'Weekend special',
    message: 'Free delivery on all rides this weekend. No minimum fare required.',
    time: '2 days ago',
    read: true,
  },
  {
    id: 7,
    type: 'order',
    icon: ShoppingBag,
    title: 'Order delivered',
    message: 'Your package from Adunni Fashion House has been delivered successfully.',
    time: '3 days ago',
    read: true,
  },
];

const typeColors: Record<string, string> = {
  delivery: 'bg-blue-500/10 text-blue-500',
  order: 'bg-green-500/10 text-green-500',
  promo: 'bg-amber-500/10 text-amber-500',
  payment: 'bg-purple-500/10 text-purple-500',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);

  const markAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
            Notifications
          </h1>
          <p className="text-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-600 text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <Link
            href="/account/settings"
            className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {notifs.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-2"
        >
          {notifs.map((notif) => (
            <motion.div
              key={notif.id}
              variants={fadeIn}
              className={`bg-surface-secondary rounded-xl p-4 border transition-colors ${
                notif.read ? 'border-border' : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    typeColors[notif.type]
                  }`}
                >
                  <notif.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-bold text-text-primary text-sm">
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-text-secondary text-xs mt-1">{notif.message}</p>
                  <p className="text-text-tertiary text-xs mt-2">{notif.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center py-20 bg-surface-secondary rounded-2xl border border-border"
        >
          <Bell className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
            No notifications
          </h3>
          <p className="text-text-secondary text-sm">
            You&apos;re all caught up! Notifications will appear here.
          </p>
        </motion.div>
      )}
    </div>
  );
}
