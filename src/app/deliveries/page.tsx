'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  MapPin,
  Clock,
  Shield,
  Truck,
  ArrowRight,
  Box,
  Zap,
  Globe,
  Building,
  CheckCircle,
  Smartphone,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const packageTypes = [
  {
    icon: Package,
    name: 'Documents',
    description: 'Letters, contracts, legal documents',
    maxSize: 'Up to 1 kg',
  },
  {
    icon: Box,
    name: 'Small Packages',
    description: 'Electronics, clothes, small items',
    maxSize: 'Up to 5 kg',
  },
  {
    icon: Package,
    name: 'Medium Packages',
    description: 'Home goods, gifts, retail items',
    maxSize: 'Up to 15 kg',
  },
  {
    icon: Truck,
    name: 'Large Packages',
    description: 'Furniture, appliances, bulk orders',
    maxSize: 'Up to 50 kg',
  },
];

const deliveryZones = [
  { zone: 'Same City', time: '1-2 hours', price: 'From $2' },
  { zone: 'Same Country', time: '1-3 days', price: 'From $5' },
  { zone: 'Cross-Border', time: '3-7 days', price: 'From $15' },
  { zone: 'Pan-African', time: '5-14 days', price: 'Custom' },
];

const features = [
  {
    icon: Smartphone,
    title: 'Real-Time Tracking',
    description: 'Track your package every step of the way with live GPS updates.',
  },
  {
    icon: Shield,
    title: 'Insured Deliveries',
    description: 'Every delivery is insured up to $500 for your peace of mind.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Schedule pickups and deliveries at your convenience, including weekends.',
  },
  {
    icon: CheckCircle,
    title: 'Proof of Delivery',
    description: 'Photo confirmation and digital signature upon delivery.',
  },
];

const businessFeatures = [
  'Bulk shipping discounts up to 40%',
  'Dedicated account manager',
  'API integration for your e-commerce store',
  'Custom packaging solutions',
  'Priority delivery options',
  'Analytics dashboard',
];

export default function DeliveriesPage() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.h1
                variants={fadeIn}
                className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
              >
                Fast, Reliable{' '}
                <span className="text-dark-300">Deliveries</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-xl text-white/90 mb-8 max-w-lg">
                Send packages anywhere in Africa with confidence. From same-city
                express to cross-border shipping.
              </motion.p>
              <motion.div variants={fadeIn} className="flex gap-4">
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 bg-white text-amber-600 font-medium px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
                >
                  Send a Package
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 border border-white/30 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Business Solutions
                </Link>
              </motion.div>
            </motion.div>

            {/* Booking Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <h3 className="font-heading text-xl font-bold text-text-primary mb-6">
                  Request a Delivery
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Pickup Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter delivery location"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Package Type
                    </label>
                    <select className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary focus:outline-none focus:border-amber-500">
                      <option>Select package type</option>
                      <option>Documents</option>
                      <option>Small Package (up to 5 kg)</option>
                      <option>Medium Package (up to 15 kg)</option>
                      <option>Large Package (up to 50 kg)</option>
                    </select>
                  </div>
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors">
                    Get Price Estimate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Package Types */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              What Are You Sending?
            </h2>
            <p className="text-text-secondary text-lg">
              We handle packages of all shapes and sizes
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {packageTypes.map((type) => (
              <motion.div
                key={type.name}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors text-center"
              >
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <type.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-text-primary mb-1">
                  {type.name}
                </h3>
                <p className="text-text-secondary text-sm mb-2">{type.description}</p>
                <span className="text-amber-500 text-sm font-medium">{type.maxSize}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Delivery Zones */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Delivery Zones & Pricing
            </h2>
            <p className="text-text-secondary text-lg">
              Transparent pricing for every delivery
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {deliveryZones.map((zone, i) => (
              <motion.div
                key={zone.zone}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className={`bg-surface rounded-2xl p-6 border text-center ${
                  i === 0
                    ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'border-border hover:border-amber-500/50'
                } transition-colors`}
              >
                {i === 0 && (
                  <span className="text-xs font-medium bg-amber-500 text-white px-3 py-1 rounded-full mb-3 inline-block">
                    Fastest
                  </span>
                )}
                <h3 className="font-heading text-lg font-bold text-text-primary mb-1">
                  {zone.zone}
                </h3>
                <p className="text-text-secondary text-sm mb-3">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {zone.time}
                </p>
                <p className="font-heading text-2xl font-bold text-amber-500">{zone.price}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tracking Feature */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Track Every Package
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Real-time tracking from pickup to delivery. Know exactly where your package is, anytime.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl p-6 border border-border"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Business Solutions */}
      <section className="py-20 bg-gradient-to-br from-dark-500 to-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
                For Business
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
                Business Delivery Solutions
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Scale your delivery operations with our enterprise-grade logistics
                platform. From small businesses to large enterprises.
              </p>
              <div className="space-y-3 mb-8">
                {businessFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
            >
              <div className="text-center text-white/50">
                <Truck className="w-16 h-16 mx-auto mb-4" />
                <p className="font-heading font-bold text-white text-lg">
                  Enterprise Dashboard
                </p>
                <p className="text-white/60 text-sm mt-2">
                  Analytics, bulk management, and API access
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
