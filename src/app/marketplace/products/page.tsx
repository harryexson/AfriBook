'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  MapPin,
  Heart,
  ShoppingCart,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowRight,
  Plus,
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
  'Fashion',
  'Electronics',
  'Home & Garden',
  'Beauty',
  'Sports',
  'Books',
  'Jewelry',
  'Kids',
];

const products = [
  {
    title: 'Handwoven Kente Cloth',
    vendor: 'Adunni Fashion House',
    category: 'Fashion',
    rating: 4.9,
    reviews: 156,
    price: '$45',
    originalPrice: '$60',
    location: 'Accra',
    initials: 'AF',
    badge: 'Best Seller',
  },
  {
    title: 'Wireless Bluetooth Speaker',
    vendor: 'Kwame Tech',
    category: 'Electronics',
    rating: 4.7,
    reviews: 234,
    price: '$35',
    originalPrice: null,
    location: 'Lagos',
    initials: 'KT',
    badge: null,
  },
  {
    title: 'Natural Shea Butter Set',
    vendor: 'NaturaGlow',
    category: 'Beauty',
    rating: 4.8,
    reviews: 312,
    price: '$18',
    originalPrice: '$24',
    location: 'Kigali',
    initials: 'NG',
    badge: 'Popular',
  },
  {
    title: 'Carved Wooden Mask',
    vendor: 'AfriArt Crafts',
    category: 'Home & Garden',
    rating: 4.9,
    reviews: 89,
    price: '$55',
    originalPrice: null,
    location: 'Nairobi',
    initials: 'AA',
    badge: 'Handmade',
  },
  {
    title: 'Ankara Print Dress',
    vendor: 'Lagos Threads',
    category: 'Fashion',
    rating: 4.6,
    reviews: 198,
    price: '$32',
    originalPrice: '$42',
    location: 'Lagos',
    initials: 'LT',
    badge: null,
  },
  {
    title: 'Smart Watch Pro',
    vendor: 'TechDeals Africa',
    category: 'Electronics',
    rating: 4.5,
    reviews: 267,
    price: '$89',
    originalPrice: '$120',
    location: 'Johannesburg',
    initials: 'TD',
    badge: 'Sale',
  },
  {
    title: 'Handmade Beaded Necklace',
    vendor: 'Maasai Market',
    category: 'Jewelry',
    rating: 4.8,
    reviews: 145,
    price: '$22',
    originalPrice: null,
    location: 'Nairobi',
    initials: 'MM',
    badge: 'Handmade',
  },
  {
    title: 'Organic Cocoa Powder',
    vendor: 'Ghana Cocoa Co.',
    category: 'Home & Garden',
    rating: 4.7,
    reviews: 378,
    price: '$12',
    originalPrice: null,
    location: 'Accra',
    initials: 'GC',
    badge: 'Best Seller',
  },
  {
    title: 'Running Shoes - Air Sole',
    vendor: 'AfriSport',
    category: 'Sports',
    rating: 4.6,
    reviews: 203,
    price: '$55',
    originalPrice: '$70',
    location: 'Johannesburg',
    initials: 'AS',
    badge: null,
  },
  {
    title: 'Children\'s African Storybook',
    vendor: 'AfriReads',
    category: 'Books',
    rating: 4.9,
    reviews: 167,
    price: '$8',
    originalPrice: null,
    location: 'Nairobi',
    initials: 'AR',
    badge: 'Popular',
  },
  {
    title: 'Bamboo Plant Stand',
    vendor: 'EcoHome Africa',
    category: 'Home & Garden',
    rating: 4.5,
    reviews: 89,
    price: '$28',
    originalPrice: '$35',
    location: 'Kigali',
    initials: 'EH',
    badge: null,
  },
  {
    title: 'Leather Crossbody Bag',
    vendor: 'Cape Leather Co.',
    category: 'Fashion',
    rating: 4.8,
    reviews: 234,
    price: '$48',
    originalPrice: null,
    location: 'Johannesburg',
    initials: 'CL',
    badge: 'Best Seller',
  },
];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchQuery.toLowerCase());
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
              Shop Local, Support Local
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
              Discover unique products from African artisans, brands, and businesses
            </motion.p>
            <motion.div variants={fadeIn} className="max-w-2xl mx-auto">
              <div className="relative bg-white rounded-2xl p-2 shadow-xl flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none"
                  />
                </div>
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                  Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories & Toolbar */}
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
            <div className="flex items-center gap-3 shrink-0">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button className="relative p-2 rounded-lg border border-border text-text-secondary hover:text-amber-500 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <p className="text-text-secondary">
              <span className="font-bold text-text-primary">{filteredProducts.length}</span>{' '}
              products found
            </p>
            <select className="bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-amber-500">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating</option>
              <option>Newest</option>
            </select>
          </div>

          <motion.div
            key={activeCategory}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {filteredProducts.map((product) => (
              <motion.div
                key={product.title}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl border border-border hover:border-amber-500/50 transition-all group"
              >
                <div className="relative p-4">
                  {/* Placeholder image area */}
                  <div className="aspect-square bg-surface rounded-xl mb-4 flex items-center justify-center group-hover:bg-surface-secondary transition-colors">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <span className="text-amber-500 font-heading font-bold text-2xl">
                        {product.initials}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-1">
                    {product.badge && (
                      <span className="text-xs font-medium bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        {product.badge}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="text-xs font-medium bg-red-500 text-white px-2 py-0.5 rounded-full">
                        Sale
                      </span>
                    )}
                  </div>

                  {/* Favorite */}
                  <button className="absolute top-6 right-6 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-text-tertiary hover:text-amber-500 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-4 pb-4">
                  <p className="text-xs text-text-tertiary mb-1">{product.vendor}</p>
                  <h3 className="font-heading font-bold text-text-primary text-sm mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 text-amber-500 text-sm">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {product.rating}
                    </span>
                    <span className="text-text-tertiary text-xs">({product.reviews})</span>
                    <span className="flex items-center gap-1 text-text-tertiary text-xs">
                      <MapPin className="w-3 h-3" />
                      {product.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-text-primary">
                        {product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-text-tertiary text-sm line-through">
                          {product.originalPrice}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setCartCount(cartCount + 1)}
                      className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
                No products found
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
