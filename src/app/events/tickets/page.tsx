'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Download,
  Share2,
  RefreshCw,
  XCircle,
  Smartphone,
  ChevronRight,
  Search,
  QrCode,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const tabs = [
  { id: 'upcoming', label: 'Upcoming', count: 3 },
  { id: 'past', label: 'Past', count: 8 },
];

const upcomingTickets = [
  {
    id: 'tkt-001',
    eventId: 'evt-001',
    eventTitle: 'Afrobeats Night: The Ultimate Concert',
    date: 'Sat, Aug 15, 2026 · 8:00 PM',
    venue: 'Eko Convention Centre, Lagos',
    tier: 'VIP',
    ticketCode: 'AFB-EVT001-VIP-0847',
    quantity: 2,
    status: 'active' as const,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  },
  {
    id: 'tkt-002',
    eventId: 'evt-009',
    eventTitle: 'Afro Jazz & Wine Evening',
    date: 'Sat, Jul 19, 2026 · 6:00 PM',
    venue: 'The Wheatbaker, Lagos',
    tier: 'VIP',
    ticketCode: 'AFB-AJW-VIP-0234',
    quantity: 1,
    status: 'active' as const,
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop',
  },
  {
    id: 'tkt-003',
    eventId: 'evt-007',
    eventTitle: 'Cape Town Marathon 2026',
    date: 'Sun, Jul 20, 2026 · 6:00 AM',
    venue: 'Cape Town Stadium',
    tier: 'General',
    ticketCode: 'AFB-CTM-GEN-0891',
    quantity: 1,
    status: 'active' as const,
    image: 'https://images.unsplash.com/photo-1461896836934-bd45ba648136?w=400&h=300&fit=crop',
  },
];

const pastTickets = [
  {
    id: 'tkt-004',
    eventTitle: 'Afrobeats Night Chapter 1',
    date: 'Feb 14, 2026',
    venue: 'Eko Convention Centre, Lagos',
    tier: 'General',
    quantity: 2,
    status: 'used' as const,
  },
  {
    id: 'tkt-005',
    eventTitle: 'Lagos Food Festival 2025',
    date: 'Dec 20, 2025',
    venue: 'Muri Okunola Park',
    tier: 'VIP',
    quantity: 1,
    status: 'used' as const,
  },
  {
    id: 'tkt-006',
    eventTitle: 'Tech Summit 2025',
    date: 'Nov 8, 2025',
    venue: 'Kenyatta ICC, Nairobi',
    tier: 'General',
    quantity: 1,
    status: 'cancelled' as const,
  },
];

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/events"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold text-text-primary">My Tickets</h1>
              <p className="text-text-secondary text-sm">All your event tickets in one place</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-amber-500/10 text-amber-500' : 'bg-surface-secondary text-text-tertiary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Search */}
        {activeTab === 'upcoming' && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Upcoming Tickets */}
            {activeTab === 'upcoming' && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-4"
              >
                {upcomingTickets
                  .filter(
                    (t) =>
                      t.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.tier.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      variants={fadeIn}
                      className="bg-surface rounded-2xl border border-border overflow-hidden hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex">
                        <div className="w-24 sm:w-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shrink-0">
                          <img
                            src={ticket.image}
                            alt={ticket.eventTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-heading font-bold text-text-primary text-sm sm:text-base line-clamp-1">
                                {ticket.eventTitle}
                              </h3>
                              <span className="inline-block bg-amber-500/10 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full mt-1">
                                {ticket.tier}
                              </span>
                            </div>
                            <span className="bg-green-500/10 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              Active
                            </span>
                          </div>
                          <div className="space-y-1 mt-2 text-xs text-text-secondary">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-amber-500" />
                              {ticket.date}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {ticket.venue}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Ticket className="w-3 h-3 text-amber-500" />
                              {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expanded QR Code */}
                      <AnimatePresence>
                        {expandedTicket === ticket.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border p-6 text-center">
                              <div className="bg-white rounded-2xl p-4 inline-block mb-3 shadow-sm">
                                <QRCodeSVG
                                  value={ticket.ticketCode}
                                  size={160}
                                  level="H"
                                  includeMargin={true}
                                  fgColor="#111827"
                                  bgColor="#ffffff"
                                />
                              </div>
                              <p className="font-mono text-sm text-text-secondary">
                                {ticket.ticketCode}
                              </p>
                              <div className="flex justify-center gap-2 mt-4">
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors">
                                  <Download className="w-3.5 h-3.5" />
                                  Download
                                </button>
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors">
                                  <Share2 className="w-3.5 h-3.5" />
                                  Share
                                </button>
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors">
                                  <Smartphone className="w-3.5 h-3.5" />
                                  Add to Wallet
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                        <button
                          onClick={() =>
                            setExpandedTicket(
                              expandedTicket === ticket.id ? null : ticket.id,
                            )
                          }
                          className="flex items-center gap-1.5 text-amber-500 text-sm font-medium"
                        >
                          <QrCode className="w-4 h-4" />
                          {expandedTicket === ticket.id ? 'Hide' : 'Show'} Ticket
                        </button>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-amber-500 bg-surface-secondary rounded-lg transition-colors">
                            <RefreshCw className="w-3 h-3" />
                            Transfer
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <XCircle className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </motion.div>
            )}

            {/* Past Tickets */}
            {activeTab === 'past' && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-3"
              >
                {pastTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    variants={fadeIn}
                    className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-secondary rounded-xl flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-text-tertiary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary text-sm">
                          {ticket.eventTitle}
                        </h3>
                        <p className="text-xs text-text-secondary">
                          {ticket.date} · {ticket.tier}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        ticket.status === 'used'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {ticket.status === 'used' ? 'Used' : 'Cancelled'}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
