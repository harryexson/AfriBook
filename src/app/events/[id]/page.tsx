'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Share2,
  Heart,
  Ticket,
  Users,
  ChevronRight,
  ExternalLink,
  Check,
  Plus,
  Minus,
  Tag,
  Copy,
  Send,
  Eye,
  ArrowLeft,
  CalendarPlus,
  Shield,
  Loader2,
} from 'lucide-react';
import { Facebook, Twitter, Instagram } from '@/components/icons/SocialIcons';
import {
  generateGoogleCalendarUrl,
  generateAppleCalendarUrl,
  type CalendarEvent,
} from '@/lib/events/calendar';
import { validatePromoCode } from '@/lib/events/pricing';
import MapEmbed from '@/components/shared/MapEmbed';
import { formatEventDate, formatEventDateRange, formatAmount } from '../utils';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

interface EventTicketType {
  id: string;
  name: string;
  tier: string;
  type: string;
  description: string;
  price: number;
  original_price?: number | null;
  currency_code: string;
  quantity_available: number;
  quantity_sold: number;
  max_per_order: number;
  min_per_order: number;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  includes_guest_registration: boolean;
  max_guests_per_ticket: number;
  benefits: string[];
  is_active: boolean;
  sort_order: number;
}

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  category: string;
  start_date: string;
  end_date: string;
  timezone?: string;
  venue_name?: string | null;
  venue_address?: string | null;
  venue_city?: string | null;
  venue_country?: string | null;
  venue_lat?: number | null;
  venue_lng?: number | null;
  is_virtual: boolean;
  virtual_link?: string | null;
  cover_image_url?: string | null;
  gallery_images?: string[];
  min_price: number;
  max_price: number;
  currency_code: string;
  total_capacity: number;
  tickets_sold: number;
  is_free: boolean;
  organizer_name?: string;
  organizer_id?: string;
  tags?: string[];
  view_count: number;
  share_count?: number;
  favorite_count: number;
  enable_referrals: boolean;
  allow_guest_registration?: boolean;
  max_guests_per_registration?: number;
  event_ticket_types?: EventTicketType[];
  totalRegistrations?: number;
  totalCheckedIn?: number;
  organizerEvents?: EventDetail[];
  relatedEvents?: { id: string; title: string; slug: string; cover_image_url?: string | null; start_date: string; venue_city?: string | null; currency_code?: string; min_price?: number; is_virtual?: boolean }[];
}

function GuestAvatar({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="relative group">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold border-2 border-surface -ml-2 first:ml-0">
        {initials}
      </div>
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-500 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {name}
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/${params.id}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load event');
        setEvent(json.data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [params.id]);

  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.6]);

  const tiers = useMemo(
    () =>
      (event?.event_ticket_types ?? []).filter((t) => t.is_active !== false).sort((a, b) => a.sort_order - b.sort_order),
    [event],
  );

  const ticketsLeft = tiers.reduce((sum, t) => sum + Math.max(0, t.quantity_available - t.quantity_sold), 0);
  const ticketsSold = event?.tickets_sold ?? tiers.reduce((sum, t) => sum + (t.quantity_sold ?? 0), 0);
  const totalCapacity = event?.total_capacity ?? Math.max(ticketsSold + ticketsLeft, 0);

  const selectedTierData = tiers.find((t) => t.id === selectedTier);
  const currency = event?.currency_code ?? 'NGN';
  const subtotal = selectedTierData ? selectedTierData.price * quantity : 0;
  const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
  const processingFee = 1.5;
  const tax = Math.round(subtotal * 0.075 * 100) / 100;
  const discount = promoApplied ? promoDiscount : 0;
  const total = subtotal + platformFee + processingFee + tax - discount;

  const calendarEvent: CalendarEvent | null = event
    ? {
        title: event.title,
        description: event.description,
        startDate: event.start_date,
        endDate: event.end_date,
        startTime: '',
        endTime: '',
        venue: event.venue_name ?? '',
        address: event.venue_address ?? '',
        city: event.venue_city ?? '',
        country: event.venue_country ?? '',
      }
    : null;

  const guestAvatars = useMemo(() => {
    const initials = (name: string) =>
      name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    return Array.from({ length: Math.min(ticketsSold, 8) }, (_, i) => ({
      name: `Guest ${i + 1}`,
      initials: initials(`Guest ${i + 1}`) || 'G',
    }));
  }, [ticketsSold]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Ticket className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
            Event not found
          </h1>
          <p className="text-text-secondary mb-6">{error ?? 'This event may have been removed.'}</p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const eventLink = `/events/${event.slug || event.id}`;

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div ref={heroRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="absolute inset-0">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-600 via-orange-600 to-violet-700" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-4 pb-8 w-full">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All Events
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
              <div className="flex-1">
                <span className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase">
                  {event.category.replace('_', ' ')}
                </span>
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-3">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    {formatEventDate(event.start_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {event.is_virtual ? 'Online' : (event.timezone ?? 'Africa/Lagos')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    {event.is_virtual
                      ? 'Virtual event'
                      : [event.venue_name, event.venue_city].filter(Boolean).join(', ') || 'TBA'}
                  </span>
                </div>
                {event.organizer_name && (
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                      {event.organizer_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{event.organizer_name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="relative p-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors text-white"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors text-white">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white dark:bg-dark-200 rounded-xl shadow-xl border border-border p-3 flex gap-2"
                    >
                      {[Facebook, Twitter, Instagram, Send].map((Icon, i) => (
                        <button key={i} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                          <Icon className="w-5 h-5 text-text-secondary" />
                        </button>
                      ))}
                      <button
                        onClick={() => navigator.clipboard?.writeText(shareUrl)}
                        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                      >
                        <Copy className="w-5 h-5 text-text-secondary" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {totalCapacity > 0 && (
                  <div className="text-right">
                    <p className="text-white/60 text-xs mb-1">
                      {Math.max(0, totalCapacity - ticketsSold)} tickets left
                    </p>
                    <div className="w-32 bg-white/20 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (ticketsSold / totalCapacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  href={`${eventLink}/register`}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl transition-colors text-lg shadow-lg shadow-amber-500/30"
                >
                  Get Tickets
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                About This Event
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {(event.description ?? '').split('\n').map((paragraph, i) => (
                  <p key={i} className="text-text-secondary leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.section>

            {/* Date & Time */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-surface-secondary rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Date & Time
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{formatEventDateRange(event.start_date, event.end_date)}</p>
                    <p className="text-sm text-text-secondary">Timezone: {event.timezone ?? 'Africa/Lagos'}</p>
                  </div>
                </div>
                {calendarEvent && (
                  <div className="flex gap-2">
                    <a
                      href={generateGoogleCalendarUrl(calendarEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg border border-border text-sm text-text-secondary hover:border-amber-500/50 transition-colors"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Add to Google Calendar
                    </a>
                    <a
                      href={generateAppleCalendarUrl(calendarEvent)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg border border-border text-sm text-text-secondary hover:border-amber-500/50 transition-colors"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Apple Calendar
                    </a>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Location */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-surface-secondary rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Location
              </h2>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-text-primary">{event.is_virtual ? 'Online event' : event.venue_name ?? 'TBA'}</p>
                  <p className="text-sm text-text-secondary mt-1">{event.venue_address}</p>
                  <p className="text-sm text-text-secondary">
                    {[event.venue_city, event.venue_country].filter(Boolean).join(', ')}
                  </p>
                  {event.is_virtual && event.virtual_link && (
                    <a
                      href={event.virtual_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-500 text-sm font-medium hover:text-amber-600 transition-colors mt-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join virtually
                    </a>
                  )}
                </div>
                {!event.is_virtual && event.venue_lat != null && event.venue_lng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${event.venue_lat},${event.venue_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-amber-500 text-sm font-medium hover:text-amber-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Maps
                  </a>
                )}
              </div>
              {!event.is_virtual && event.venue_lat != null && event.venue_lng != null && (
                <div className="mt-4">
                  <MapEmbed
                    center={{ latitude: event.venue_lat, longitude: event.venue_lng }}
                    heightClass="h-48"
                    title="Event location map"
                  />
                </div>
              )}
            </motion.section>

            {/* Ticket Tiers */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-amber-500" />
                Select Tickets
              </h2>
              {tiers.length === 0 ? (
                <div className="bg-surface-secondary rounded-2xl border border-border p-6 text-center">
                  <p className="text-text-secondary">Tickets are not yet available for this event.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tiers.map((tier) => (
                    <motion.div
                      key={tier.id}
                      variants={fadeIn}
                      className={`bg-surface rounded-2xl border-2 p-6 transition-all cursor-pointer ${
                        selectedTier === tier.id
                          ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'border-border hover:border-amber-500/40'
                      }`}
                      onClick={() => {
                        setSelectedTier(tier.id);
                        setQuantity(1);
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-heading font-bold text-text-primary text-lg">
                              {tier.name}
                            </h3>
                            {tier.price === 0 && (
                              <span className="bg-green-500/10 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">{tier.description}</p>
                        </div>
                        <p className="font-heading text-2xl font-bold text-amber-500 ml-4">
                          {formatAmount(tier.price, tier.currency_code || currency)}
                        </p>
                      </div>
                      {(tier.benefits ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tier.benefits.map((perk, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-xs text-text-secondary bg-surface-secondary px-2.5 py-1 rounded-full"
                            >
                              <Check className="w-3 h-3 text-green-500" />
                              {perk}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${
                            tier.quantity_available - tier.quantity_sold < 20 ? 'text-red-500' : 'text-text-tertiary'
                          }`}
                        >
                          {Math.max(0, tier.quantity_available - tier.quantity_sold)} left · {tier.quantity_sold} sold
                        </span>
                        {selectedTier === tier.id ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-border rounded-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuantity(Math.max(1, quantity - 1));
                                }}
                                className="p-2 hover:bg-surface-secondary transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 font-medium text-text-primary">{quantity}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuantity(Math.min(tier.max_per_order || 10, quantity + 1));
                                }}
                                className="p-2 hover:bg-surface-secondary transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
                              Selected
                            </span>
                          </div>
                        ) : (
                          <span className="bg-surface-secondary text-text-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
                            Select
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Promo Code */}
              {tiers.some((t) => t.price > 0) && (
                <div className="mt-6 bg-surface-secondary rounded-xl border border-border p-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!promoCode) return;
                        setPromoError('');
                        const result = validatePromoCode('percent', 10, subtotal);
                        if (result.valid) {
                          setPromoApplied(true);
                          setPromoDiscount(result.discount);
                        } else {
                          setPromoError(result.error || 'Invalid promo code');
                          setPromoApplied(false);
                          setPromoDiscount(0);
                        }
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {formatAmount(promoDiscount, currency)} discount applied!
                    </p>
                  )}
                  {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                </div>
              )}

              {/* Summary & Checkout */}
              {selectedTier && selectedTierData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-surface rounded-2xl border border-border p-6"
                >
                  <h3 className="font-heading font-bold text-text-primary mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        {quantity}x {selectedTierData.name}
                      </span>
                      <span className="text-text-primary">{formatAmount(subtotal, currency)}</span>
                    </div>
                    {subtotal > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Platform fee (5%)</span>
                          <span className="text-text-primary">{formatAmount(platformFee, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Processing fee</span>
                          <span className="text-text-primary">{formatAmount(processingFee, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Tax (7.5%)</span>
                          <span className="text-text-primary">{formatAmount(tax, currency)}</span>
                        </div>
                      </>
                    )}
                    {promoApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatAmount(discount, currency)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-text-primary text-base">
                      <span>Total</span>
                      <span>{formatAmount(total, currency)}</span>
                    </div>
                  </div>
                  <Link
                    href={`${eventLink}/register?tier=${selectedTier}&qty=${quantity}`}
                    className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-center mt-4 transition-colors"
                  >
                    Continue to Checkout
                  </Link>
                </motion.div>
              )}
            </motion.section>

            {/* Guest List */}
            {guestAvatars.length > 0 && (
              <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-amber-500" />
                  Guest List
                </h2>
                <div className="bg-surface-secondary rounded-2xl border border-border p-6">
                  <p className="text-text-secondary mb-4">
                    <span className="font-bold text-text-primary">{ticketsSold.toLocaleString()}</span> people are going
                  </p>
                  <div className="flex items-center mb-4">
                    {guestAvatars.map((guest, i) => (
                      <GuestAvatar key={i} name={guest.name} initials={guest.initials} />
                    ))}
                    <div className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center text-text-secondary text-xs font-bold -ml-2 border-2 border-surface">
                      +{Math.max(0, ticketsSold - guestAvatars.length)}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Organizer */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Organizer
              </h2>
              <div className="bg-surface-secondary rounded-2xl border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl">
                    {(event.organizer_name ?? 'AB').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-text-primary text-lg">
                      {event.organizer_name ?? 'AfriBook Organizer'}
                    </h3>
                    {event.relatedEvents && (
                      <p className="text-text-secondary text-sm">
                        {event.relatedEvents.length} events hosted
                      </p>
                    )}
                  </div>
                  <Link
                    href={`${eventLink}/register`}
                    className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-secondary hover:border-amber-500 hover:text-amber-500 transition-colors"
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Social Proof */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-surface-secondary rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary mb-4">
                Share With Friends
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Eye className="w-4 h-4" />
                  {(event.view_count ?? 0).toLocaleString()} views
                </div>
                {event.favorite_count > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <Heart className="w-4 h-4" />
                      {event.favorite_count.toLocaleString()} favorites
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: 'WhatsApp',
                    icon: Send,
                    url: `https://wa.me/?text=${encodeURIComponent(`${event.title} — ${shareUrl}`)}`,
                  },
                  {
                    label: 'Twitter',
                    icon: Twitter,
                    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(shareUrl)}`,
                  },
                  {
                    label: 'Facebook',
                    icon: Facebook,
                    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                  },
                  { label: 'Copy Link', icon: Copy, url: '' },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      if (s.label === 'Copy Link') {
                        navigator.clipboard?.writeText(shareUrl);
                      } else if (s.url) {
                        window.open(s.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-surface rounded-xl border border-border text-text-secondary hover:border-amber-500/50 hover:text-amber-500 transition-colors text-sm font-medium"
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Quick Ticket Card */}
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-heading font-bold text-text-primary mb-3">Quick Register</h3>
                <div className="space-y-2 mb-4">
                  {tiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedTier === tier.id
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-border hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">{tier.name}</span>
                        <span className="text-sm font-bold text-amber-500">
                          {formatAmount(tier.price, tier.currency_code || currency)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <Link
                  href={`${eventLink}/register${selectedTier ? `?tier=${selectedTier}` : ''}`}
                  className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-center transition-colors"
                >
                  Get Tickets
                </Link>
              </div>

              {/* Tags */}
              {(event.tags ?? []).length > 0 && (
                <div className="bg-surface rounded-2xl border border-border p-5">
                  <h3 className="font-heading font-bold text-text-primary mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {(event.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-surface-secondary text-text-secondary text-xs px-3 py-1.5 rounded-full hover:text-amber-500 cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-surface-secondary rounded-2xl border border-border p-5">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                  <p className="text-xs text-text-tertiary leading-relaxed">
                    AfriBook acts as a platform for event organizers and attendees. Event organizers
                    are solely responsible for event accuracy and compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Events */}
        {(event.relatedEvents ?? []).length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-16"
          >
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
              More from this organizer
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {event.relatedEvents!.slice(0, 3).map((related) => (
                <motion.div key={related.id} variants={fadeIn}>
                  <Link
                    href={`/events/${related.slug || related.id}`}
                    className="group bg-surface rounded-2xl border border-border overflow-hidden hover:border-amber-500/40 hover:shadow-lg transition-all block"
                  >
                    {related.cover_image_url ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={related.cover_image_url}
                          alt={related.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-amber-500/25 to-orange-500/15 flex items-center justify-center">
                        <Ticket className="w-8 h-8 text-amber-500/50" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-text-primary mb-2 line-clamp-1">
                        {related.title}
                      </h3>
                      <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        {formatEventDate(related.start_date)}
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        {related.is_virtual
                          ? 'Online'
                          : related.venue_city || 'TBA'}
                      </div>
                      <p className="font-heading font-bold text-amber-500 mt-3">
                        {related.min_price != null && related.min_price > 0
                          ? formatAmount(related.min_price, related.currency_code || currency)
                          : 'Free'}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}