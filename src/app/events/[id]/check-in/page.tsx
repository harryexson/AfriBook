'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  TrendingUp,
  QrCode,
  Keyboard,
  UserCheck,
  BarChart3,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { formatEventDate } from '../../utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

interface CheckInStats {
  ticketsSold: number;
  ticketsConfirmed: number;
  ticketsCheckedIn: number;
  guestsTotal: number;
  guestsCheckedIn: number;
  totalAttendees: number;
  attendanceRate: number;
  capacity: number | null;
}

interface Attendee {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  ticket_code?: string | null;
  quantity: number;
  check_in_status: string;
  check_in_at?: string | null;
  event_ticket_types?: { name?: string; tier?: string } | null;
}

interface CheckInResult {
  type: string;
  id: string;
  name: string;
  email?: string;
  ticketCode?: string;
  quantity?: number;
  tierName?: string | null;
  checkedInAt: string;
  method: string;
}

export default function CheckInPage() {
  const params = useParams<{ id: string }>();
  const [manualCode, setManualCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError(null);
      try {
        const [evtRes, checkinRes] = await Promise.all([
          fetch(`/api/events/${params.id}`),
          fetch(`/api/events/${params.id}/check-in?page=${pageNum}&limit=50`),
        ]);
        const evtJson = await evtRes.json();
        if (!evtRes.ok) throw new Error(evtJson.error ?? 'Failed to load event');
        setEventTitle(evtJson.data?.title ?? '');
        setEventStartDate(evtJson.data?.start_date ?? '');
        setEventSlug(evtJson.data?.slug ?? params.id);

        const checkinJson = await checkinRes.json();
        if (!checkinRes.ok) throw new Error(checkinJson.error ?? 'Failed to load check-in data');
        setStats(checkinJson.data?.stats ?? null);
        setAttendees(checkinJson.data?.attendees ?? []);
        setPage(checkinJson.data?.pagination?.page ?? 1);
        setTotalPages(checkinJson.data?.pagination?.totalPages ?? 1);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [params.id],
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleManualCheckIn = async () => {
    if (!manualCode) return;
    setCheckingIn(true);
    setResult(null);
    setResultError(null);
    try {
      const res = await fetch(`/api/events/${params.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: manualCode, method: 'manual' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Check-in failed');
      setResult(json.data);
      setManualCode('');
      loadData(page);
    } catch (err) {
      setResultError((err as Error).message);
    } finally {
      setCheckingIn(false);
    }
  };

  const filteredAttendees = attendees.filter(
    (a) =>
      a.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ticket_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.event_ticket_types?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const remaining =
    stats && stats.ticketsConfirmed != null ? Math.max(0, stats.ticketsConfirmed - stats.ticketsCheckedIn) : 0;

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/events/${eventSlug}`}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-text-primary">Check-in Scanner</h1>
              <p className="text-text-secondary text-sm">
                {eventTitle || 'Loading event...'}
                {eventStartDate ? ` · ${formatEventDate(eventStartDate)}` : ''}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && !loading && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => loadData(page)} className="flex items-center gap-1.5 text-red-500 font-medium shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {loading && !stats ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Dashboard */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              {[
                {
                  label: 'Confirmed Tickets',
                  value: (stats?.ticketsConfirmed ?? 0).toLocaleString(),
                  icon: Users,
                  color: 'bg-blue-500/10 text-blue-500',
                },
                {
                  label: 'Checked In',
                  value: (stats?.totalAttendees ?? 0).toLocaleString(),
                  icon: UserCheck,
                  color: 'bg-green-500/10 text-green-500',
                },
                {
                  label: 'Remaining',
                  value: remaining.toLocaleString(),
                  icon: Clock,
                  color: 'bg-amber-500/10 text-amber-500',
                },
                {
                  label: 'Attendance Rate',
                  value: `${stats?.attendanceRate ?? 0}%`,
                  icon: TrendingUp,
                  color: 'bg-purple-500/10 text-purple-500',
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeIn}
                  className="bg-surface rounded-xl border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">{stat.label}</p>
                      <p className="font-heading font-bold text-text-primary text-lg">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scanner Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* QR Scanner */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-heading font-bold text-text-primary flex items-center gap-2">
                      <Camera className="w-5 h-5 text-amber-500" />
                      QR Scanner
                    </h2>
                    <span className="text-xs text-text-tertiary">
                      Camera scanning is not available in this browser. Use Manual Check-in below.
                    </span>
                  </div>
                  <div className="relative bg-dark-500 aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/50 text-sm">
                        Use the manual entry field or scan with a connected QR reader
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Manual Entry */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="bg-surface rounded-2xl border border-border p-6"
                >
                  <h2 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-amber-500" />
                    Manual Check-in
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleManualCheckIn();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Enter ticket code (e.g. AB3KLM2X)"
                      className="flex-1 px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!manualCode || checkingIn}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                    >
                      {checkingIn ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Check In
                    </button>
                  </form>

                  {/* Result Feedback */}
                  <AnimatePresence>
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 flex items-start gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-green-700 dark:text-green-400">
                            {result.name} checked in successfully
                          </p>
                          <p className="text-green-600/80 dark:text-green-500/80 text-xs mt-0.5">
                            {result.tierName || 'Ticket'} · {result.ticketCode} ·{' '}
                            {new Date(result.checkedInAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {resultError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 flex items-start gap-3"
                      >
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-red-700 dark:text-red-400">Check-in failed</p>
                          <p className="text-red-600/80 dark:text-red-500/80 text-xs mt-0.5">{resultError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Attendee List */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-heading font-bold text-text-primary flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      Confirmed Attendees
                    </h2>
                    <span className="text-xs text-text-tertiary">{attendees.length} loaded</span>
                  </div>
                  <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                    {filteredAttendees.length === 0 ? (
                      <p className="px-4 py-8 text-center text-text-tertiary text-sm">
                        No confirmed attendees yet
                      </p>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <div key={attendee.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                              {(attendee.buyer_name ?? '?')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary text-sm">{attendee.buyer_name}</p>
                              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                <span>{attendee.event_ticket_types?.name ?? 'Ticket'}</span>
                                <span>·</span>
                                <span>qty {attendee.quantity}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {attendee.check_in_status === 'checked_in' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {attendee.check_in_at
                                  ? new Date(attendee.check_in_at).toLocaleTimeString()
                                  : 'Checked in'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                                <Clock className="w-3.5 h-3.5" />
                                Not checked in
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="p-3 border-t border-border flex items-center justify-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => loadData(page - 1)}
                        className="px-3 py-1.5 rounded-lg bg-surface-secondary text-xs font-medium text-text-secondary hover:text-amber-500 disabled:opacity-40 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-text-tertiary">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => loadData(page + 1)}
                        className="px-3 py-1.5 rounded-lg bg-surface-secondary text-xs font-medium text-text-secondary hover:text-amber-500 disabled:opacity-40 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Search */}
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search attendees..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <h3 className="font-heading font-semibold text-text-primary text-sm mb-3">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Tickets confirmed</span>
                      <span className="font-medium text-text-primary">{stats?.ticketsConfirmed ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Tickets checked in</span>
                      <span className="font-medium text-text-primary">{stats?.ticketsCheckedIn ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Guests checked in</span>
                      <span className="font-medium text-text-primary">{stats?.guestsCheckedIn ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Capacity</span>
                      <span className="font-medium text-text-primary">
                        {stats?.capacity ? stats.capacity.toLocaleString() : 'Unlimited'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-text-secondary">
                      Duplicate check-ins will be flagged. Each ticket can only be used once.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}