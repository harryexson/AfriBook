'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  MapPin,
  Ticket,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  ArrowUpDown,
  Flame,
  Users,
  Globe,
  Heart,
  Plus,
  Sparkles,
  Zap,
  Music,
  Trophy,
  Image,
  Wrench,
  TicketCheck,
  MapPinned,
  Loader2,
  X,
} from 'lucide-react';
import { formatEventDate, formatPrice } from './utils';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const categoryOptions = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'music', label: 'Concerts', icon: Music },
  { id: 'conference', label: 'Conferences', icon: Users },
  { id: 'workshop', label: 'Workshops', icon: Wrench },
  { id: 'wedding', label: 'Weddings', icon: Heart },
  { id: 'party', label: 'Parties', icon: Zap },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'charity', label: 'Charity', icon: Heart },
  { id: 'arts', label: 'Exhibitions', icon: Image },
];

interface EventSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  category: string;
  start_date: string;
  end_date: string;
  venue_name?: string | null;
  venue_city?: string | null;
  venue_country?: string | null;
  is_virtual: boolean;
  cover_image_url?: string | null;
  is_free: boolean;
  min_price: number;
  max_price: number;
  currency_code: string;
  organizer_name?: string;
  status: string;
  view_count: number;
  favorite_count: number;
  tickets_sold: number;
  total_capacity: number;
  event_ticket_types?: EventTicketType[];
}

interface EventTicketType {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function EventCard({ event }: { event: EventSummary }) {
  const ticketsLeft =
    (event.event_ticket_types ?? []).reduce(
      (sum, t) => sum + Math.max(0, (t.quantity_available ?? 0) - (t.quantity_sold ?? 0)),
      0,
    );
  const soldOut = ticketsLeft === 0 && (event.total_capacity ?? 0) > 0;

  return (
    <motion.div
      variants={fadeIn}
      className="group bg-surface rounded-2xl overflow-hidden border border-border hover:border-amber-500/40 hover:shadow-lg transition-all duration-300"
    >
      <Link href={`/events/${event.slug || event.id}`}>
        <div className="relative overflow-hidden">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-violet-500/20 flex items-center justify-center">
              <Ticket className="w-12 h-12 text-amber-500/50" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
              {event.category.replace('_', ' ')}
            </span>
            {event.is_virtual && (
              <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3" /> Virtual
              </span>
            )}
          </div>
          {event.is_free && (
            <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              FREE
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-semibold text-text-primary text-lg mb-2 line-clamp-2">
            {event.title}
          </h3>
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{formatEventDate(event.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">
                {event.is_virtual
                  ? 'Online event'
                  : [event.venue_name, event.venue_city].filter(Boolean).join(', ') || 'TBA'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="font-heading font-bold text-amber-500 text-lg">
              {formatPrice(event.min_price, event.max_price, event.currency_code, event.is_free)}
            </span>
            {soldOut ? (
              <span className="text-xs text-red-500 font-medium">Sold Out</span>
            ) : (
              <span className="text-xs text-text-tertiary">
                {ticketsLeft.toLocaleString()} tickets left
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 9, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [virtualOnly, setVirtualOnly] = useState(false);

  const categoryMap: Record<string, string> = {
    music: 'music',
    conference: 'conference',
    workshop: 'workshop',
    wedding: 'wedding',
    party: 'party',
    sports: 'sports',
    charity: 'charity',
    arts: 'arts',
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ status: 'published', sort: sortBy, page: String(page), limit: '9' });
        if (activeCategory !== 'all') params.set('category', categoryMap[activeCategory]);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (locationFilter.trim()) params.set('city', locationFilter.trim());
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (virtualOnly) params.set('isVirtual', 'true');

        const res = await fetch(`/api/events?${params.toString()}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load events');
        setEvents(json.data ?? []);
        if (json.pagination) setPagination(json.pagination);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [activeCategory, searchQuery, locationFilter, sortBy, page, startDate, endDate, virtualOnly]);

  const featuredEvents = useMemo(
    () => events.filter((e) => e.favorite_count > 0 || e.view_count > 50).slice(0, 4),
    [events],
  );

  const resetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setLocationFilter('');
    setStartDate('');
    setEndDate('');
    setVirtualOnly(false);
    setPage(1);
  };

  const applySearch = () => setPage(1);

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_82%_12%,rgba(245,158,11,0.12),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_-8%_100%,rgba(168,85,247,0.12),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300"
              >
                <Flame className="h-3.5 w-3.5" />
                Discover events across Africa
              </motion.div>
              <motion.h1
                variants={fadeIn}
                className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl"
              >
                The best events in
                <span className="block text-gradient-gold">Africa, ticketed.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
                Concerts, conferences, weddings, and festivals — book instantly and keep
                your tickets in one place.
              </motion.p>
              <motion.div variants={fadeIn} className="mt-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applySearch();
                  }}
                  className="relative max-w-xl"
                >
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                  <input
                    type="text"
                    placeholder="Search events, venues, or cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-4 pl-12 pr-28 text-white placeholder:text-white/35 backdrop-blur-md focus:border-amber-500/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                  >
                    Search
                  </button>
                </form>
              </motion.div>
              <motion.div variants={fadeIn} className="mt-4 flex flex-wrap gap-2">
                {['Lagos', 'Nairobi', 'Cape Town', 'Accra', 'Kigali'].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setLocationFilter(city);
                      setPage(1);
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-white/60 transition-colors hover:border-amber-500/50 hover:text-white"
                  >
                    {city}
                  </button>
                ))}
              </motion.div>
              <motion.div variants={fadeIn} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                {pagination.total > 0 && (
                  <div>
                    <p className="font-heading text-xl font-bold text-white">
                      {pagination.total.toLocaleString()}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-white/40">Events live</p>
                  </div>
                )}
                <div>
                  <p className="font-heading text-xl font-bold text-white">28</p>
                  <p className="text-xs uppercase tracking-wider text-white/40">Countries</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.25 }}
              className="hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4">
                {events.slice(0, 4).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug || event.id}`}
                    className="relative overflow-hidden rounded-2xl border border-white/10 group"
                  >
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-amber-500/30 to-violet-500/20 flex items-center justify-center">
                        <Ticket className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-xs text-amber-400 font-semibold capitalize">
                        {event.category.replace('_', ' ')}
                      </p>
                      <p className="font-heading font-bold text-white text-sm line-clamp-2 mt-0.5">
                        {event.title}
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        {formatPrice(event.min_price, event.max_price, event.currency_code, event.is_free)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {categoryOptions.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-72 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-24 space-y-6">
              <div className="bg-surface rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-text-primary">Filters</h3>
                  <button onClick={resetFilters} className="text-amber-500 text-sm font-medium hover:underline">
                    Reset
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Event Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={virtualOnly}
                          onChange={(e) => {
                            setVirtualOnly(e.target.checked);
                            setPage(1);
                          }}
                          className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-text-primary">Virtual events only</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Location
                    </label>
                    <div className="relative">
                      <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type="text"
                        placeholder="City or venue"
                        value={locationFilter}
                        onChange={(e) => {
                          setLocationFilter(e.target.value);
                          setPage(1);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setPage(1)}
                  className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Sort & Filter Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
                <p className="text-text-secondary text-sm">
                  <span className="font-semibold text-text-primary">{pagination.total}</span> events found
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-text-tertiary" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="start_date">Sort by Date</option>
                  <option value="view_count">Sort by Popularity</option>
                  <option value="min_price">Price: Low to High</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Featured Events Carousel */}
            {featuredEvents.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-heading font-bold text-text-primary text-2xl flex items-center gap-2">
                      <Flame className="w-6 h-6 text-amber-500" /> Featured Events
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                      Handpicked events you don&apos;t want to miss
                    </p>
                  </div>
                </div>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                >
                  {featuredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </motion.div>
              </section>
            )}

            {/* Events Grid */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-text-primary text-2xl flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-amber-500" /> Events
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-2xl border border-border">
                  <Ticket className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                  <h3 className="font-heading font-bold text-text-primary text-lg mb-1">
                    No events found
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Try adjusting your search or filters.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 inline-flex items-center gap-2 text-amber-500 font-medium text-sm hover:underline"
                  >
                    <X className="w-4 h-4" /> Clear filters
                  </button>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </motion.div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-secondary transition-colors text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const base = Math.max(1, Math.min(pagination.totalPages - 4, page - 2));
                    const p = base + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? 'bg-amber-500 text-white'
                            : 'border border-border text-text-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="px-3 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-secondary transition-colors text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Host Your Event CTA */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading font-bold text-white text-3xl md:text-4xl mb-4">
              Host Your Event
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Create, promote, and manage your events with AfriBook. Reach thousands of attendees
              across Africa.
            </p>
            <Link
              href="/events/create"
              className="inline-flex items-center gap-2 bg-white text-amber-600 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/90 transition-colors shadow-xl"
            >
              <Plus className="w-5 h-5" /> Create Event
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}