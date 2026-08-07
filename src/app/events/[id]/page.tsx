'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Share2,
  Heart,
  Ticket,
  Users,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  Globe,
  Check,
  Plus,
  Minus,
  Tag,
  Copy,
  Send,
  Eye,
  ArrowLeft,
  Star,
  CalendarPlus,
  Download,
  Shield,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Facebook, Twitter, Instagram } from '@/components/icons/SocialIcons';
import {
  generateGoogleCalendarUrl,
  generateAppleCalendarUrl,
  type CalendarEvent,
} from '@/lib/events/calendar';
import { validatePromoCode } from '@/lib/events/pricing';
import MapEmbed from '@/components/shared/MapEmbed';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const mockEvent = {
  id: 'evt-001',
  title: 'Afrobeats Night: The Ultimate Concert Experience',
  description: `Join us for an unforgettable night of Afrobeats featuring the biggest names in African music. From Wizkid to Burna Boy vibes, experience the rhythm of Africa under one roof.\n\nThis spectacular event brings together top-tier artists, state-of-the-art sound and lighting, and thousands of music lovers for a night that celebrates the best of African culture.\n\nExpect world-class performances, stunning visual effects, and an atmosphere that will keep you dancing all night long. This is more than a concert — it's a celebration of African excellence.`,
  category: 'Concert',
  startDate: 'Sat, Aug 15, 2026',
  endDate: 'Sat, Aug 15, 2026',
  startTime: '8:00 PM',
  endTime: '2:00 AM',
  venue: 'Eko Convention Centre',
  address: 'Eko Hotels & Suites, Plot 14, Adetokunbo Ademola Crescent, Victoria Island',
  city: 'Lagos',
  country: 'Nigeria',
  organizer: {
    name: 'AfriBeats Entertainment',
    avatar: 'AB',
    events: 24,
    followers: '12.4K',
    verified: true,
  },
  coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop',
  isVirtual: false,
  viewCount: 14523,
  shareCount: 1847,
  ticketsSold: 876,
  totalCapacity: 1000,
  tiers: [
    {
      id: 'tier-1',
      name: 'General Admission',
      price: 38,
      description: 'Standard entry with access to the main stage area',
      available: 124,
      sold: 376,
      maxPerOrder: 10,
      perks: ['Main stage access', 'Event merchandise bag', '1 free drink token'],
    },
    {
      id: 'tier-2',
      name: 'VIP',
      price: 120,
      description: 'Premium experience with exclusive perks and front-row access',
      available: 45,
      sold: 55,
      maxPerOrder: 6,
      perks: [
        'Front-row standing area',
        'VIP lounge access',
        'Complimentary drinks',
        'Meet & greet opportunity',
        'Exclusive merch bundle',
      ],
    },
    {
      id: 'tier-3',
      name: 'VVIP Table',
      price: 500,
      description: 'Ultimate luxury with a private table for your group',
      available: 8,
      sold: 12,
      maxPerOrder: 1,
      perks: [
        'Private VIP table (seats 8)',
        'Premium bottle service',
        'Backstage pass',
        'Artist meet & greet',
        'Reserved parking',
        'Personal host for the evening',
      ],
    },
  ],
  guestList: [
    { name: 'Adaeze O.', avatar: 'AO' },
    { name: 'Kofi M.', avatar: 'KM' },
    { name: 'Fatima H.', avatar: 'FH' },
    { name: 'Thabo N.', avatar: 'TN' },
    { name: 'Ngozi E.', avatar: 'NE' },
    { name: 'Samuel K.', avatar: 'SK' },
    { name: 'Aisha B.', avatar: 'AB' },
    { name: 'Emeka U.', avatar: 'EU' },
  ],
  relatedEvents: [
    {
      id: 'evt-009',
      title: 'Afro Jazz & Wine Evening',
      date: 'Sat, Jul 19, 2026',
      venue: 'The Wheatbaker, Lagos',
      price: '$65',
      image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop',
    },
    {
      id: 'evt-004',
      title: 'Lagos Food & Music Festival',
      date: 'Sat, Aug 22, 2026',
      venue: 'Muri Okunola Park',
      price: '$20',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
    },
    {
      id: 'evt-006',
      title: 'Nollywood Premiere Night',
      date: 'Fri, Jul 18, 2026',
      venue: 'Genesis Cinemas, Lekki',
      price: '$8',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
    },
  ],
};

const calendarEvent: CalendarEvent = {
  title: mockEvent.title,
  description: mockEvent.description,
  startDate: mockEvent.startDate,
  endDate: mockEvent.endDate,
  startTime: mockEvent.startTime,
  endTime: mockEvent.endTime,
  venue: mockEvent.venue,
  address: mockEvent.address,
  city: mockEvent.city,
  country: mockEvent.country,
};

const EVENT_LAT = 6.4281;
const EVENT_LNG = 3.4219;

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
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [referralCode] = useState('AFRI-2026-NIGHT');
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.6]);

  const selectedTierData = mockEvent.tiers.find((t) => t.id === selectedTier);
  const subtotal = selectedTierData ? selectedTierData.price * quantity : 0;
  const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
  const processingFee = 1.5;
  const tax = Math.round(subtotal * 0.075 * 100) / 100;
  const discount = promoApplied ? promoDiscount : 0;
  const total = subtotal + platformFee + processingFee + tax - discount;

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div ref={heroRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <img
            src={mockEvent.coverImage}
            alt={mockEvent.title}
            className="w-full h-full object-cover"
          />
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
                <span className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                  {mockEvent.category}
                </span>
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-3">
                  {mockEvent.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    {mockEvent.startDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {mockEvent.startTime} — {mockEvent.endTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    {mockEvent.venue}, {mockEvent.city}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {mockEvent.organizer.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {mockEvent.organizer.name}
                      {mockEvent.organizer.verified && (
                        <Check className="w-4 h-4 text-amber-400 inline ml-1" />
                      )}
                    </p>
                    <p className="text-white/60 text-xs">
                      {mockEvent.organizer.events} events · {mockEvent.organizer.followers} followers
                    </p>
                  </div>
                </div>
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
                        <button
                          key={i}
                          className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                        >
                          <Icon className="w-5 h-5 text-text-secondary" />
                        </button>
                      ))}
                      <button className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                        <Copy className="w-5 h-5 text-text-secondary" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-right">
                  <p className="text-white/60 text-xs mb-1">
                    {mockEvent.totalCapacity - mockEvent.ticketsSold} tickets left
                  </p>
                  <div className="w-32 bg-white/20 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{
                        width: `${(mockEvent.ticketsSold / mockEvent.totalCapacity) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Link
                  href={`/events/${mockEvent.id}/register`}
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
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                About This Event
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {mockEvent.description.split('\n').map((paragraph, i) => (
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
                    <p className="font-medium text-text-primary">{mockEvent.startDate}</p>
                    <p className="text-sm text-text-secondary">
                      {mockEvent.startTime} — {mockEvent.endTime} (WAT)
                    </p>
                  </div>
                </div>
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
                  <p className="font-medium text-text-primary">{mockEvent.venue}</p>
                  <p className="text-sm text-text-secondary mt-1">{mockEvent.address}</p>
                  <p className="text-sm text-text-secondary">
                    {mockEvent.city}, {mockEvent.country}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${EVENT_LAT},${EVENT_LNG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-amber-500 text-sm font-medium hover:text-amber-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Maps
                </a>
              </div>
              <div className="mt-4">
                <MapEmbed center={{ latitude: EVENT_LAT, longitude: EVENT_LNG }} heightClass="h-48" title="Event location map" />
              </div>
            </motion.section>

            {/* Ticket Tiers */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-amber-500" />
                Select Tickets
              </h2>
              <div className="space-y-4">
                {mockEvent.tiers.map((tier) => (
                  <motion.div
                    key={tier.id}
                    variants={fadeIn}
                    className={`bg-surface rounded-2xl border-2 p-6 transition-all cursor-pointer ${
                      selectedTier === tier.id
                        ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'border-border hover:border-amber-500/40'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
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
                        ${tier.price}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tier.perks.map((perk) => (
                        <span
                          key={perk}
                          className="flex items-center gap-1 text-xs text-text-secondary bg-surface-secondary px-2.5 py-1 rounded-full"
                        >
                          <Check className="w-3 h-3 text-green-500" />
                          {perk}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          tier.available < 20 ? 'text-red-500' : 'text-text-tertiary'
                        }`}
                      >
                        {tier.available} left · {tier.sold} sold
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
                            <span className="px-4 py-2 font-medium text-text-primary">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuantity(Math.min(tier.maxPerOrder, quantity + 1));
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

              {/* Promo Code */}
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
                    ${promoDiscount.toFixed(2)} discount applied!
                  </p>
                )}
                {promoError && (
                  <p className="text-red-500 text-sm mt-2">{promoError}</p>
                )}
              </div>

              {/* Summary & Checkout */}
              {selectedTier && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-surface rounded-2xl border border-border p-6"
                >
                  <h3 className="font-heading font-bold text-text-primary mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        {quantity}x {selectedTierData?.name}
                      </span>
                      <span className="text-text-primary">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Platform fee (5%)</span>
                      <span className="text-text-primary">${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Processing fee</span>
                      <span className="text-text-primary">${processingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Tax (7.5%)</span>
                      <span className="text-text-primary">${tax.toFixed(2)}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-text-primary text-base">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/events/${mockEvent.id}/register?tier=${selectedTier}&qty=${quantity}`}
                    className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-center mt-4 transition-colors"
                  >
                    Continue to Checkout
                  </Link>
                </motion.div>
              )}
            </motion.section>

            {/* Photo Gallery */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-2xl font-bold text-text-primary">
                  Photo Gallery
                </h2>
                <Link
                  href={`/events/${mockEvent.id}/photos`}
                  className="text-amber-500 text-sm font-medium hover:text-amber-600 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl overflow-hidden"
                  >
                    <img
                      src={`https://images.unsplash.com/photo-${1500000000000 + i * 11111}?w=300&h=300&fit=crop`}
                      alt={`Gallery photo ${i}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Guest List */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-500" />
                Guest List
              </h2>
              <div className="bg-surface-secondary rounded-2xl border border-border p-6">
                <p className="text-text-secondary mb-4">
                  <span className="font-bold text-text-primary">{mockEvent.guestList.length * 127}</span>{' '}
                  people are going
                </p>
                <div className="flex items-center mb-4">
                  {mockEvent.guestList.map((guest) => (
                    <GuestAvatar
                      key={guest.name}
                      name={guest.name}
                      initials={guest.avatar}
                    />
                  ))}
                  <div className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center text-text-secondary text-xs font-bold -ml-2 border-2 border-surface">
                    +{mockEvent.guestList.length * 127 - mockEvent.guestList.length}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Organizer */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Organizer
              </h2>
              <div className="bg-surface-secondary rounded-2xl border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl">
                    {mockEvent.organizer.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-text-primary text-lg flex items-center gap-2">
                      {mockEvent.organizer.name}
                      {mockEvent.organizer.verified && (
                        <Check className="w-5 h-5 text-amber-500 bg-amber-500 rounded-full p-0.5 text-white" />
                      )}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {mockEvent.organizer.events} events hosted · {mockEvent.organizer.followers}{' '}
                      followers
                    </p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-secondary hover:border-amber-500 hover:text-amber-500 transition-colors">
                    Contact
                  </button>
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
                  {mockEvent.viewCount.toLocaleString()} views
                </div>
                <span className="text-border">·</span>
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Share2 className="w-4 h-4" />
                  {mockEvent.shareCount.toLocaleString()} shares
                </div>
              </div>
              <div className="bg-surface rounded-xl border border-border p-3 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">Referral code:</span>
                  <span className="font-mono font-bold text-amber-500 text-sm">{referralCode}</span>
                </div>
                <button className="text-amber-500 hover:text-amber-600 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'WhatsApp', icon: Send },
                  { label: 'Twitter', icon: Twitter },
                  { label: 'Facebook', icon: Facebook },
                  { label: 'Copy Link', icon: Copy },
                ].map((s) => (
                  <button
                    key={s.label}
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
                  {mockEvent.tiers.map((tier) => (
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
                        <span className="text-sm font-bold text-amber-500">${tier.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedTier && (
                  <Link
                    href={`/events/${mockEvent.id}/register?tier=${selectedTier}`}
                    className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-center transition-colors"
                  >
                    Get Tickets
                  </Link>
                )}
              </div>

              {/* Tags */}
              <div className="bg-surface rounded-2xl border border-border p-5">
                <h3 className="font-heading font-bold text-text-primary mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['Afrobeats', 'Concert', 'Live Music', 'Lagos', 'Nigeria', 'Night Out'].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="bg-surface-secondary text-text-secondary text-xs px-3 py-1.5 rounded-full hover:text-amber-500 cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-surface-secondary rounded-2xl border border-border p-5">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                  <p className="text-xs text-text-tertiary leading-relaxed">
                    AfriBook acts as a platform for event organizers and attendees. Event organizers
                    are solely responsible for event accuracy and compliance.{' '}
                    <span className="text-amber-500 cursor-pointer">Terms & Conditions</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Events */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mt-16"
        >
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
            Similar Events
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mockEvent.relatedEvents.map((event) => (
              <motion.div key={event.id} variants={fadeIn}>
                <Link
                  href={`/events/${event.id}`}
                  className="group bg-surface rounded-2xl border border-border overflow-hidden hover:border-amber-500/40 hover:shadow-lg transition-all block"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-text-primary mb-2 line-clamp-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      {event.venue}
                    </div>
                    <p className="font-heading font-bold text-amber-500 mt-3">{event.price}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
