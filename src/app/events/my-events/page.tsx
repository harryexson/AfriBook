'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Eye,
  BarChart3,
  Share2,
  Edit3,
  QrCode,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle2,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const tabs = [
  { id: 'hosting', label: 'Hosting', count: 5 },
  { id: 'attending', label: 'Attending', count: 3 },
  { id: 'past', label: 'Past Events', count: 12 },
];

const hostingEvents = [
  {
    id: 'evt-001',
    title: 'Afrobeats Night: The Ultimate Concert',
    date: 'Aug 15, 2026',
    venue: 'Eko Convention Centre, Lagos',
    status: 'published' as const,
    ticketsSold: 876,
    totalCapacity: 1000,
    revenue: 52560,
    views: 14523,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  },
  {
    id: 'evt-013',
    title: 'Afrobeats Night: Chapter 2',
    date: 'Dec 20, 2026',
    venue: 'Eko Convention Centre, Lagos',
    status: 'draft' as const,
    ticketsSold: 0,
    totalCapacity: 1200,
    revenue: 0,
    views: 0,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
  },
  {
    id: 'evt-014',
    title: 'Lagos Tech Meetup 2026',
    date: 'Sep 5, 2026',
    venue: 'Co-Creation Hub, Yaba',
    status: 'published' as const,
    ticketsSold: 234,
    totalCapacity: 300,
    revenue: 11700,
    views: 3200,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
  },
  {
    id: 'evt-015',
    title: 'Jollof Rice Cook-off',
    date: 'Oct 12, 2026',
    venue: 'Federal Palace Hotel, Lagos',
    status: 'published' as const,
    ticketsSold: 150,
    totalCapacity: 200,
    revenue: 7500,
    views: 2100,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    id: 'evt-016',
    title: 'New Year Gala 2027',
    date: 'Dec 31, 2026',
    venue: 'Transcorp Hilton, Abuja',
    status: 'draft' as const,
    ticketsSold: 0,
    totalCapacity: 500,
    revenue: 0,
    views: 0,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
  },
];

const attendingEvents = [
  {
    id: 'evt-009',
    title: 'Afro Jazz & Wine Evening',
    date: 'Jul 19, 2026',
    venue: 'The Wheatbaker, Lagos',
    tier: 'VIP',
    status: 'confirmed' as const,
    ticketCode: 'AFB-AJW-VIP-0234',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop',
  },
  {
    id: 'evt-007',
    title: 'Cape Town Marathon 2026',
    date: 'Jul 20, 2026',
    venue: 'Cape Town Stadium',
    tier: 'General',
    status: 'confirmed' as const,
    ticketCode: 'AFB-CTM-GEN-0891',
    image: 'https://images.unsplash.com/photo-1461896836934-bd45ba648136?w=400&h=300&fit=crop',
  },
  {
    id: 'evt-008',
    title: 'Women in Tech Conference',
    date: 'Jul 23, 2026',
    venue: 'Radisson Blu, Abuja',
    tier: 'VIP',
    status: 'confirmed' as const,
    ticketCode: 'AFB-WIT-VIP-0567',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=300&fit=crop',
  },
];

const pastEvents = [
  {
    id: 'evt-017',
    title: 'Afrobeats Night Chapter 1',
    date: 'Feb 14, 2026',
    venue: 'Eko Convention Centre',
    ticketsSold: 980,
    totalCapacity: 1000,
    revenue: 58800,
    attended: true,
  },
  {
    id: 'evt-018',
    title: 'Lagos Food Festival 2025',
    date: 'Dec 20, 2025',
    venue: 'Muri Okunola Park',
    ticketsSold: 1200,
    totalCapacity: 1500,
    revenue: 36000,
    attended: true,
  },
];

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState('hosting');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-text-primary">My Events</h1>
              <p className="text-text-secondary text-sm mt-1">
                Manage your events and track performance
              </p>
            </div>
            <Link
              href="/events/create"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-4 h-4 text-text-tertiary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="date">Date</option>
              <option value="revenue">Revenue</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Hosting Tab */}
            {activeTab === 'hosting' && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-4"
              >
                {hostingEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    variants={fadeIn}
                    className="bg-surface rounded-2xl border border-border overflow-hidden hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-amber-500/10 to-orange-500/10 shrink-0">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-heading font-bold text-text-primary">
                                {event.title}
                              </h3>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  event.status === 'published'
                                    ? 'bg-green-500/10 text-green-600'
                                    : 'bg-amber-500/10 text-amber-600'
                                }`}
                              >
                                {event.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <p className="text-text-secondary text-sm flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" />
                              {event.date} · {event.venue}
                            </p>
                          </div>
                          <button className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-text-tertiary" />
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-text-tertiary">Tickets Sold</p>
                            <p className="font-bold text-text-primary text-sm">
                              {event.ticketsSold}{' '}
                              <span className="font-normal text-text-tertiary">
                                / {event.totalCapacity}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-tertiary">Revenue</p>
                            <p className="font-bold text-text-primary text-sm">
                              ${event.revenue.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-tertiary">Views</p>
                            <p className="font-bold text-text-primary text-sm">
                              {event.views.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-tertiary">Capacity</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-surface-tertiary rounded-full h-1.5">
                                <div
                                  className="bg-amber-500 h-1.5 rounded-full"
                                  style={{
                                    width: `${(event.ticketsSold / event.totalCapacity) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium text-text-secondary">
                                {Math.round((event.ticketsSold / event.totalCapacity) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                          <Link
                            href={`/events/${event.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Link>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors">
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                          </button>
                          <Link
                            href={`/events/${event.id}/check-in`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Check-in
                          </Link>
                          <Link
                            href={`/events/${event.id}/photos`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Analytics
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Attending Tab */}
            {activeTab === 'attending' && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {attendingEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    variants={fadeIn}
                    className="bg-surface rounded-2xl border border-border overflow-hidden hover:border-amber-500/40 transition-colors"
                  >
                    <div className="h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-bold text-text-primary text-sm line-clamp-1">
                          {event.title}
                        </h3>
                        <span className="bg-green-500/10 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                          Confirmed
                        </span>
                      </div>
                      <p className="text-text-secondary text-xs mb-2">{event.tier} Ticket</p>
                      <p className="text-text-secondary text-xs flex items-center gap-1 mb-3">
                        <Calendar className="w-3 h-3" />
                        {event.date} · {event.venue}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href={`/events/${event.id}/confirmation`}
                          className="flex-1 py-2 bg-surface-secondary rounded-lg text-center text-xs font-medium text-text-secondary hover:text-amber-500 transition-colors"
                        >
                          View Ticket
                        </Link>
                        <Link
                          href={`/events/${event.id}`}
                          className="flex-1 py-2 bg-amber-500/10 text-amber-500 rounded-lg text-center text-xs font-medium hover:bg-amber-500/20 transition-colors"
                        >
                          Event Page
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Past Events Tab */}
            {activeTab === 'past' && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-4"
              >
                {pastEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    variants={fadeIn}
                    className="bg-surface rounded-2xl border border-border p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-bold text-text-primary">{event.title}</h3>
                        <p className="text-text-secondary text-sm flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.date} · {event.venue}
                        </p>
                      </div>
                      <span className="bg-surface-secondary text-text-tertiary text-xs px-2.5 py-1 rounded-full">
                        Completed
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border text-sm">
                      <div>
                        <p className="text-xs text-text-tertiary">Tickets Sold</p>
                        <p className="font-bold text-text-primary">{event.ticketsSold}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary">Revenue</p>
                        <p className="font-bold text-text-primary">${event.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary">Attendance Rate</p>
                        <p className="font-bold text-text-primary">
                          {Math.round((event.ticketsSold / event.totalCapacity) * 100)}%
                        </p>
                      </div>
                    </div>
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
