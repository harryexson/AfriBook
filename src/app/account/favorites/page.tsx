'use client';

import { motion } from 'framer-motion';
import { Heart, Star, MapPin, ShoppingCart } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const favorites = [
  {
    title: 'Handwoven Kente Cloth',
    vendor: 'Adunni Fashion House',
    category: 'Fashion',
    rating: 4.9,
    reviews: 156,
    price: '$45',
    location: 'Accra',
    initials: 'AF',
  },
  {
    title: 'Natural Shea Butter Set',
    vendor: 'NaturaGlow',
    category: 'Beauty',
    rating: 4.8,
    reviews: 312,
    price: '$18',
    location: 'Kigali',
    initials: 'NG',
  },
  {
    title: 'Professional Hair Styling',
    vendor: 'Glamour Salon',
    category: 'Services',
    rating: 4.9,
    reviews: 234,
    price: 'From $15',
    location: 'Lagos',
    initials: 'GS',
  },
  {
    title: 'Wireless Bluetooth Speaker',
    vendor: 'Kwame Tech',
    category: 'Electronics',
    rating: 4.7,
    reviews: 234,
    price: '$35',
    location: 'Lagos',
    initials: 'KT',
  },
  {
    title: 'Carved Wooden Mask',
    vendor: 'AfriArt Crafts',
    category: 'Home & Garden',
    rating: 4.9,
    reviews: 89,
    price: '$55',
    location: 'Nairobi',
    initials: 'AA',
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
  },
  {
    title: 'Leather Crossbody Bag',
    vendor: 'Cape Leather Co.',
    category: 'Fashion',
    rating: 4.8,
    reviews: 234,
    price: '$48',
    location: 'Johannesburg',
    initials: 'CL',
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
  },
];

export default function FavoritesPage() {
  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
          My Favorites
        </h1>
        <p className="text-text-secondary">Items and services you&apos;ve saved for later</p>
      </motion.div>

      {favorites.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {favorites.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeIn}
              className="bg-surface-secondary rounded-xl p-4 border border-border hover:border-amber-500/50 transition-colors"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white font-heading font-bold">
                    {item.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-text-tertiary mb-0.5">{item.category}</p>
                      <h3 className="font-heading font-bold text-text-primary text-sm truncate">
                        {item.title}
                      </h3>
                      <p className="text-text-secondary text-xs">{item.vendor}</p>
                    </div>
                    <button className="text-amber-500 shrink-0">
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        {item.rating}
                      </span>
                      <span className="text-text-tertiary">({item.reviews})</span>
                      <span className="flex items-center gap-1 text-text-tertiary">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-text-primary text-sm">
                        {item.price}
                      </span>
                      <button className="w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center transition-colors">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center py-20 bg-surface-secondary rounded-2xl border border-border"
        >
          <Heart className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
            No favorites yet
          </h3>
          <p className="text-text-secondary text-sm">
            Browse the marketplace and save items you love.
          </p>
        </motion.div>
      )}
    </div>
  );
}
