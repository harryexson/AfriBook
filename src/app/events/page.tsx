'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  ArrowUpDown,
  Star,
  Flame,
  Tag,
  Users,
  Globe,
  Heart,
  Plus,
  X,
  Sparkles,
  Zap,
  Music,
  Trophy,
  Image,
  Wrench,
  Download,
  TrendingUp,
  ArrowRight,
  TicketCheck,
  MapPinned,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'concerts', label: 'Concerts', icon: Music },
  { id: 'conferences', label: 'Conferences', icon: Users },
  { id: 'workshops', label: 'Workshops', icon: Wrench },
  { id: 'weddings', label: 'Weddings', icon: Heart },
  { id: 'parties', label: 'Parties', icon: Zap },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'virtual', label: 'Virtual', icon: Globe },
  { id: 'charity', label: 'Charity', icon: Heart },
  { id: 'exhibitions', label: 'Exhibitions', icon: Image },
];

const featuredEvents = [
  {
    id: 'evt-001',
    title: 'Afrobeats Night: The Ultimate Concert',
    date: 'Sat, Aug 15, 2026 · 8:00 PM',
    venue: 'Eko Convention Centre, Lagos',
    price: '$38',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
    category: 'Concerts',
    ticketsLeft: 124,
  },
  {
    id: 'evt-002',
    title: 'Africa Tech Summit 2026',
    date: 'Fri–Sat, Sep 5–6, 2026 · 9:00 AM',
    venue: 'Kenyatta International Convention Centre, Nairobi',
    price: '$115',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    category: 'Conferences',
    ticketsLeft: 312,
  },
  {
    id: 'evt-003',
    title: 'Sunset Beach Wedding Expo',
    date: 'Sun, Jul 27, 2026 · 2:00 PM',
    venue: 'Cape Town Convention Centre',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=500&fit=crop',
    category: 'Weddings',
    ticketsLeft: 0,
  },
  {
    id: 'evt-004',
    title: 'Lagos Food & Music Festival',
    date: 'Sat, Aug 22, 2026 · 12:00 PM',
    venue: 'Muri Okunola Park, Victoria Island',
    price: '$20',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
    category: 'Concerts',
    ticketsLeft: 890,
  },
];

const upcomingEvents = [
  {
    id: 'evt-005',
    title: 'Digital Marketing Masterclass',
    date: 'Thu, Jul 17, 2026 · 10:00 AM',
    venue: 'Online',
    price: '$12',
    image: 'https://images.unsplash.com/photo-1558403194-611308249627?w=400&h=300&fit=crop',
    category: 'Workshops',
    ticketsLeft: 45,
    virtual: true,
  },
  {
    id: 'evt-006',
    title: 'Nollywood Premiere Night',
    date: 'Fri, Jul 18, 2026 · 7:00 PM',
    venue: 'Genesis Cinemas, Lekki',
    price: '$8',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
    category: 'Parties',
    ticketsLeft: 30,
  },
  {
    id: 'evt-007',
    title: 'Cape Town Marathon 2026',
    date: 'Sun, Jul 20, 2026 · 6:00 AM',
    venue: 'Cape Town Stadium',
    price: '$30',
    image: 'https://images.unsplash.com/photo-1461896836934-bd45ba648136?w=400&h=300&fit=crop',
    category: 'Sports',
    ticketsLeft: 520,
  },
  {
    id: 'evt-008',
    title: 'Women in Tech Conference',
    date: 'Wed, Jul 23, 2026 · 9:00 AM',
    venue: 'Radisson Blu, Abuja',
    price: '$50',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=300&fit=crop',
    category: 'Conferences',
    ticketsLeft: 78,
  },
  {
    id: 'evt-009',
    title: 'Afro Jazz & Wine Evening',
    date: 'Sat, Jul 19, 2026 · 6:00 PM',
    venue: 'The Wheatbaker, Lagos',
    price: '$65',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop',
    category: 'Concerts',
    ticketsLeft: 15,
  },
  {
    id: 'evt-010',
    title: 'Digital Art Exhibition',
    date: 'Sun, Jul 27, 2026 · 11:00 AM',
    venue: 'Nike Art Gallery, Lagos',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop',
    category: 'Exhibitions',
    ticketsLeft: 0,
  },
  {
    id: 'evt-011',
    title: 'Charity Gala Dinner',
    date: 'Fri, Jul 25, 2026 · 7:00 PM',
    venue: 'Transcorp Hilton, Abuja',
    price: '$125',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    category: 'Charity',
    ticketsLeft: 35,
  },
  {
    id: 'evt-012',
    title: 'Crypto & Blockchain Meetup',
    date: 'Tue, Jul 22, 2026 · 5:00 PM',
    venue: 'Virtual Event',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
    category: 'Virtual',
    ticketsLeft: 0,
    virtual: true,
  },
];

const stats = [
  { label: 'Events Hosted', value: '12,400+', icon: Calendar },
  { label: 'Tickets Sold', value: '850,000+', icon: TicketCheck },
  { label: 'Countries', value: '28', icon: Globe },
];

function EventCard({ event, index }: { event: (typeof upcomingEvents)[0]; index: number }) {
  return (
    <motion.div
      variants={fadeIn}
      className="group bg-surface rounded-2xl overflow-hidden border border-border hover:border-amber-500/40 hover:shadow-lg transition-all duration-300"
    >
      <Link href={`/events/${event.id}`}>
        <div className="relative overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {event.category}
            </span>
            {event.virtual && (
              <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3" /> Virtual
              </span>
            )}
          </div>
          {event.price === 'Free' && (
            <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              FREE
            </span>
          )}
          {event.price !== 'Free' && (
            <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors">
              <Heart className="w-4 h-4 text-text-primary" />
            </button>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-semibold text-text-primary text-lg mb-2 line-clamp-2">
            {event.title}
          </h3>
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="font-heading font-bold text-amber-500 text-lg">{event.price}</span>
            {event.ticketsLeft > 0 ? (
              <span className="text-xs text-text-tertiary">{event.ticketsLeft} tickets left</span>
            ) : (
              <span className="text-xs text-red-500 font-medium">Sold Out</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FeaturedCard({ event, index }: { event: (typeof featuredEvents)[0]; index: number }) {
  return (
    <motion.div
      variants={fadeIn}
      className="min-w-[85vw] md:min-w-[500px] snap-center"
    >
      <Link href={`/events/${event.id}`}>
        <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              ★ Featured
            </span>
            <h2 className="font-heading font-bold text-white text-2xl mb-2">{event.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {event.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {event.venue}
              </span>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="font-heading font-bold text-amber-400 text-xl">{event.price}</span>
              <span className="bg-amber-500 text-white font-semibold px-6 py-2 rounded-full text-sm">
                Get Tickets
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [locationFilter, setLocationFilter] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 520;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div
              variants={fadeIn}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Flame className="w-4 h-4" />
              Discover events across 28 African countries
            </motion.div>
            <motion.h1
              variants={fadeIn}
              className="font-heading font-bold text-white text-4xl md:text-6xl mb-4"
            >
              Discover Amazing Events
              <br />
              <span className="text-dark-300">Near You</span>
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto"
            >
              Find concerts, conferences, workshops, and more happening across Africa
            </motion.p>
            <motion.div variants={fadeIn} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search events, venues, or cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-text-primary text-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-text-tertiary"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  Search
                </button>
              </div>
            </motion.div>
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-3 mt-6">
              {['Lagos', 'Nairobi', 'Cape Town', 'Accra', 'Kigali'].map((city) => (
                <button
                  key={city}
                  className="text-white/70 hover:text-white text-sm bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-colors"
                >
                  {city}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
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
                  <button className="text-amber-500 text-sm font-medium hover:underline">
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
                        className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-1/2 px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-1/2 px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Event Type
                    </label>
                    <div className="space-y-2">
                      {['Free Events', 'Paid Events', 'Virtual Events', 'In-Person Events'].map(
                        (type) => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-text-primary">{type}</span>
                          </label>
                        ),
                      )}
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
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Availability
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm text-text-primary">Only show available</span>
                    </label>
                  </div>
                </div>

                <button className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors">
                  Apply Filters
                </button>
              </div>

              <div className="bg-surface rounded-2xl border border-border p-5">
                <h3 className="font-heading font-semibold text-text-primary mb-3">
                  Popular Venues
                </h3>
                <div className="space-y-2">
                  {['Eko Convention Centre', 'Transcorp Hilton', 'Kenyatta ICC', 'The Wheatbaker'].map(
                    (v) => (
                      <button
                        key={v}
                        className="block w-full text-left text-sm text-text-secondary hover:text-amber-500 transition-colors py-1"
                      >
                        {v}
                      </button>
                    ),
                  )}
                </div>
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
                  <span className="font-semibold text-text-primary">{upcomingEvents.length}</span>{' '}
                  events found
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-text-tertiary" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="date">Sort by Date</option>
                  <option value="popularity">Sort by Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Featured Events Carousel */}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    className="p-2 rounded-full bg-surface border border-border hover:bg-surface-secondary transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-text-primary" />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    className="p-2 rounded-full bg-surface border border-border hover:bg-surface-secondary transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-text-primary" />
                  </button>
                </div>
              </div>
              <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
              >
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                  className="flex gap-5"
                >
                  {featuredEvents.map((event, i) => (
                    <FeaturedCard key={event.id} event={event} index={i} />
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Upcoming Events Grid */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-text-primary text-2xl flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-amber-500" /> Upcoming Events
                </h2>
              </div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {upcomingEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </motion.div>
              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-8">
                <button className="px-3 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-secondary transition-colors text-sm">
                  Previous
                </button>
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      p === 1
                        ? 'bg-amber-500 text-white'
                        : 'border border-border text-text-secondary hover:bg-surface-secondary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button className="px-3 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-secondary transition-colors text-sm">
                  Next
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Stats Section */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeIn}
                className="text-center"
              >
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7 text-amber-500" />
                </div>
                <p className="font-heading text-3xl font-bold text-text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-text-secondary">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Download App CTA */}
      <section className="bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-dark-500 to-dark-700 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1">
              <h2 className="font-heading text-3xl font-bold text-white mb-3">
                Get the AfriBook App
              </h2>
              <p className="text-white/70 text-lg mb-6">
                Never miss an event. Get personalized recommendations, instant ticket purchases, and
                real-time updates on your phone.
              </p>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 bg-white text-dark-500 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors">
                  <Download className="w-5 h-5" />
                  App Store
                </button>
                <button className="flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                  <Download className="w-5 h-5" />
                  Google Play
                </button>
              </div>
            </div>
            <div className="w-48 h-48 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center">
              <Calendar className="w-20 h-20 text-amber-400" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Host Your Event CTA */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
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
