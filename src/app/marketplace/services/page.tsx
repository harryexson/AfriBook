'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  MapPin,
  Heart,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowRight,
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
  'All',
  'Beauty & Wellness',
  'Health & Fitness',
  'Education',
  'Home Services',
  'Technology',
  'Events',
  'Professional',
  'Auto',
];

const services = [
  {
    title: 'Professional Hair Styling',
    vendor: 'Glamour Salon',
    category: 'Beauty & Wellness',
    rating: 4.9,
    reviews: 234,
    price: 'From $15',
    location: 'Lagos',
    initials: 'GS',
    featured: true,
  },
  {
    title: 'House Cleaning Service',
    vendor: 'SparkleClean Pro',
    category: 'Home Services',
    rating: 4.8,
    reviews: 189,
    price: 'From $20',
    location: 'Nairobi',
    initials: 'SC',
    featured: false,
  },
  {
    title: 'Math Tutoring (Online)',
    vendor: 'EduConnect',
    category: 'Education',
    rating: 4.9,
    reviews: 312,
    price: 'From $10/hr',
    location: 'Accra',
    initials: 'EC',
    featured: true,
  },
  {
    title: 'Mobile Phone Repair',
    vendor: 'TechFix Hub',
    category: 'Technology',
    rating: 4.7,
    reviews: 156,
    price: 'From $25',
    location: 'Johannesburg',
    initials: 'TF',
    featured: false,
  },
  {
    title: 'Personal Training',
    vendor: 'FitLife Gym',
    category: 'Health & Fitness',
    rating: 4.8,
    reviews: 98,
    price: 'From $30/session',
    location: 'Kigali',
    initials: 'FL',
    featured: false,
  },
  {
    title: 'Event Photography',
    vendor: 'SnapShot Studios',
    category: 'Events',
    rating: 4.9,
    reviews: 267,
    price: 'From $50',
    location: 'Lagos',
    initials: 'SS',
    featured: true,
  },
  {
    title: 'Plumbing Services',
    vendor: 'AquaFix Pro',
    category: 'Home Services',
    rating: 4.6,
    reviews: 143,
    price: 'From $18',
    location: 'Nairobi',
    initials: 'AF',
    featured: false,
  },
  {
    title: 'Graphic Design',
    vendor: 'Creative Minds',
    category: 'Professional',
    rating: 4.8,
    reviews: 201,
    price: 'From $40',
    location: 'Accra',
    initials: 'CM',
    featured: true,
  },
  {
    title: 'Car Detailing',
    vendor: 'AutoSpa Premium',
    category: 'Auto',
    rating: 4.7,
    reviews: 178,
    price: 'From $35',
    location: 'Johannesburg',
    initials: 'AS',
    featured: false,
  },
  {
    title: 'Yoga Classes',
    vendor: 'Zen Studio',
    category: 'Health & Fitness',
    rating: 4.9,
    reviews: 89,
    price: 'From $12/class',
    location: 'Kigali',
    initials: 'ZS',
    featured: false,
  },
  {
    title: 'Web Development',
    vendor: 'CodeCraft Africa',
    category: 'Technology',
    rating: 4.8,
    reviews: 167,
    price: 'From $200',
    location: 'Lagos',
    initials: 'CC',
    featured: true,
  },
  {
    title: 'Interior Design Consultation',
    vendor: 'SpaceCraft Design',
    category: 'Professional',
    rating: 4.9,
    reviews: 134,
    price: 'From $60',
    location: 'Nairobi',
    initials: 'SD',
    featured: false,
  },
];

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredServices = services.filter((s) => {
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-3xl md:text-5xl font-bold text-white mb-4"
            >
              Find Services Near You
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
              Browse thousands of verified service providers across Africa
            </motion.p>
            <motion.div variants={fadeIn} className="max-w-2xl mx-auto">
              <div className="relative bg-white rounded-2xl p-2 shadow-xl flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none"
                  />
                </div>
                <button className="inline-flex items-center gap-2 bg-surface-secondary border border-border px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary transition-colors">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Location</span>
                </button>
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                  Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories & Filters */}
      <section className="py-6 bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-amber-500 text-white'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <div className="flex bg-surface-secondary rounded-lg border border-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-text-secondary'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg transition-colors ${
                    viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-text-secondary'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <p className="text-text-secondary">
              <span className="font-bold text-text-primary">{filteredServices.length}</span>{' '}
              services found
            </p>
          </div>

          <motion.div
            key={activeCategory}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className={
              viewMode === 'grid'
                ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredServices.map((service) => (
              <motion.div
                key={service.title}
                variants={fadeIn}
                className={`bg-surface-secondary rounded-2xl border border-border hover:border-amber-500/50 transition-colors ${
                  viewMode === 'list' ? 'flex items-center gap-6 p-4' : 'p-6'
                }`}
              >
                <div
                  className={`${
                    viewMode === 'list' ? 'shrink-0' : 'flex items-start justify-between mb-4'
                  }`}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-heading font-bold">
                      {service.initials}
                    </span>
                  </div>
                  <button className="text-text-tertiary hover:text-amber-500 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                <div className={`flex-1 ${viewMode === 'list' ? 'min-w-0' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {service.featured && (
                      <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-medium">
                        Featured
                      </span>
                    )}
                    <span className="text-xs text-text-tertiary">{service.category}</span>
                  </div>
                  <h3 className="font-heading font-bold text-text-primary mb-1">
                    {service.title}
                  </h3>
                  <p className="text-text-secondary text-sm mb-2">{service.vendor}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      {service.rating}
                    </span>
                    <span className="text-text-tertiary">({service.reviews})</span>
                    <span className="flex items-center gap-1 text-text-tertiary">
                      <MapPin className="w-3 h-3" />
                      {service.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-heading font-bold text-text-primary">
                      {service.price}
                    </span>
                    <button className="text-amber-500 hover:text-amber-600 text-sm font-medium flex items-center gap-1">
                      Book Now
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredServices.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
                No services found
              </h3>
              <p className="text-text-secondary mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                className="text-amber-500 hover:text-amber-600 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
