'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Ticket,
  Calendar,
  MapPin,
  Download,
  Share2,
  XCircle,
  Search,
  QrCode,
  Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatEventDate, formatAmount } from '../utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface MyTicket {
  id: string;
  event_id: string;
  order_status: string;
  payment_status: string;
  quantity: number;
  total?: number;
  ticket_code?: string;
  ticket_type_id?: string;
  check_in_status?: string;
  events: {
    id: string;
    title: string;
    slug?: string;
    start_date: string;
    end_date: string;
    venue_name?: string | null;
    venue_city?: string | null;
    cover_image_url?: string | null;
    currency_code: string;
    status: string;
  };
}

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/my-tickets?status=${activeTab}&limit=50`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load tickets');
        setTickets(json.data ?? []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [activeTab]);

  const filtered = tickets.filter(
    (t) =>
      t.events?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.total ?? '').includes(searchQuery),
  );

  const handleCancel = async (ticket: MyTicket) => {
    if (!ticket.ticket_code && !ticket.id) return;
    setCancelling(ticket.id);
    setError(null);
    try {
      const res = await fetch(`/api/events/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to cancel ticket');
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, order_status: 'cancelled' } : t)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCancelling(null);
    }
  };

  const tabs = [
    { id: 'upcoming' as const, label: 'Upcoming', count: tickets.filter((t) => t.order_status === 'confirmed').length },
    { id: 'past' as const, label: 'Past', count: tickets.filter((t) => t.order_status === 'confirmed').length },
  ];

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/events" className="text-text-secondary hover:text-text-primary transition-colors">
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

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border border-border">
            <Ticket className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="font-heading font-bold text-text-primary text-lg mb-1">No tickets found</h3>
            <p className="text-text-secondary text-sm mb-6">
              {activeTab === 'upcoming'
                ? 'You have no upcoming tickets. Browse events to grab one!'
                : 'No past tickets yet.'}
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filtered.map((ticket) => {
                const event = ticket.events;
                const code = ticket.ticket_code ?? ticket.id;
                const isUpcoming =
                  event?.start_date && new Date(event.start_date).getTime() > Date.now();
                const isConfirmed = ticket.order_status === 'confirmed';
                const isCancelled = ticket.order_status === 'cancelled';

                return (
                  <motion.div
                    key={ticket.id}
                    variants={fadeIn}
                    className="bg-surface rounded-2xl border border-border overflow-hidden hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex">
                      <div className="w-24 sm:w-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shrink-0">
                        {event?.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Ticket className="w-8 h-8 text-amber-500/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/events/${event?.slug || event?.id || ticket.event_id}`}
                              className="font-heading font-bold text-text-primary text-sm sm:text-base line-clamp-1 hover:text-amber-500 transition-colors"
                            >
                              {event?.title ?? 'Event'}
                            </Link>
                            {isCancelled ? (
                              <span className="inline-block bg-red-500/10 text-red-500 text-xs font-medium px-2 py-0.5 rounded-full mt-1">
                                Cancelled
                              </span>
                            ) : isConfirmed ? (
                              <span className="inline-block bg-green-500/10 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-block bg-amber-500/10 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full mt-1">
                                Pending
                              </span>
                            )}
                          </div>
                          {ticket.total != null && (
                            <span className="font-heading font-bold text-amber-500 text-sm">
                              {formatAmount(ticket.total, event?.currency_code ?? 'NGN')}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 mt-2 text-xs text-text-secondary">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            {formatEventDate(event?.start_date)}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {event?.venue_city ? [event?.venue_name, event?.venue_city].filter(Boolean).join(', ') : (event?.venue_name ?? 'Online / TBA')}
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
                      {expandedTicket === ticket.id && isConfirmed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border p-6 text-center">
                            <div className="bg-white rounded-2xl p-4 inline-block mb-3 shadow-sm">
                              <QRCodeSVG
                                value={code}
                                size={160}
                                level="H"
                                includeMargin={true}
                                fgColor="#111827"
                                bgColor="#ffffff"
                              />
                            </div>
                            <p className="font-mono text-sm text-text-secondary">{code}</p>
                            <div className="flex justify-center gap-2 mt-4">
                              <Link
                                href={`/events/${event?.id}/confirmation?registration=${ticket.id}`}
                                className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                View Ticket
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    {isConfirmed && isUpcoming && (
                      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                        <button
                          onClick={() =>
                            setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
                          }
                          className="flex items-center gap-1.5 text-amber-500 text-sm font-medium"
                        >
                          <QrCode className="w-4 h-4" />
                          {expandedTicket === ticket.id ? 'Hide' : 'Show'} Ticket
                        </button>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-amber-500 bg-surface-secondary rounded-lg transition-colors">
                            <Share2 className="w-3 h-3" />
                            Share
                          </button>
                          <button
                            onClick={() => handleCancel(ticket)}
                            disabled={cancelling === ticket.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {cancelling === ticket.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}