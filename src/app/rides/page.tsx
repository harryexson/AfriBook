'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Car,
  Star,
  Shield,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  Zap,
  Heart,
  ChevronDown,
  Phone,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const rideTypes = [
  {
    name: 'AfriBook Economy',
    description: 'Affordable rides for everyday travel',
    icon: Car,
    capacity: '1-4',
    price: 'From $3',
    eta: '3-5 min',
    features: ['GPS tracking', 'Cash or card', 'AC equipped'],
  },
  {
    name: 'AfriBook Comfort',
    description: 'Newer cars with extra legroom',
    icon: Car,
    capacity: '1-4',
    price: 'From $5',
    eta: '4-7 min',
    features: ['Premium vehicles', 'Top-rated drivers', 'Water bottles'],
  },
  {
    name: 'AfriBook Premium',
    description: 'Luxury vehicles for special occasions',
    icon: Car,
    capacity: '1-4',
    price: 'From $10',
    eta: '5-10 min',
    features: ['Luxury cars', 'Professional drivers', 'Wi-Fi included'],
  },
];

const safetyFeatures = [
  {
    icon: Shield,
    title: 'Verified Drivers',
    description: 'Every driver undergoes background checks and vehicle inspections.',
  },
  {
    icon: Navigation,
    title: 'Real-Time Tracking',
    description: 'Share your trip with friends and family for peace of mind.',
  },
  {
    icon: Phone,
    title: 'Emergency SOS',
    description: 'One-tap emergency button connects you to local authorities.',
  },
  {
    icon: Star,
    title: 'Two-Way Ratings',
    description: 'Both riders and drivers rate each other, ensuring quality service.',
  },
];

const driverBenefits = [
  'Earn up to $500/week',
  'Flexible hours — drive when you want',
  'Weekly payouts to your bank',
  'Free insurance coverage while driving',
  '24/7 driver support',
  'Performance bonuses',
];

export default function RidesPage() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-dark-500 via-dark-300 to-amber-600 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.h1
                variants={fadeIn}
                className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
              >
                Ride Safe,{' '}
                <span className="text-amber-500">Ride Smart</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-xl text-white/80 mb-8 max-w-lg">
                Affordable, reliable rides at your fingertips. Available in 16+ countries
                across Africa.
              </motion.p>
              <motion.div variants={fadeIn} className="flex gap-4">
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Book a Ride
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 border border-white/30 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Become a Driver
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
                  Where are you going?
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full" />
                    <input
                      type="text"
                      placeholder="Pick-up location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
                    <input
                      type="text"
                      placeholder="Drop-off location"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors">
                    See Prices
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ride Types */}
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
              Choose Your Ride
            </h2>
            <p className="text-text-secondary text-lg">
              From budget-friendly to luxury, we have a ride for every occasion
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {rideTypes.map((ride, i) => (
              <motion.div
                key={ride.name}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className={`bg-surface-secondary rounded-2xl p-8 border transition-colors ${
                  i === 1
                    ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'border-border hover:border-amber-500/50'
                }`}
              >
                {i === 1 && (
                  <span className="text-xs font-medium bg-amber-500 text-white px-3 py-1 rounded-full mb-4 inline-block">
                    Most Popular
                  </span>
                )}
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                  <ride.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
                  {ride.name}
                </h3>
                <p className="text-text-secondary text-sm mb-4">{ride.description}</p>
                <div className="space-y-2 mb-6">
                  {ride.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <span className="font-heading text-2xl font-bold text-text-primary">
                      {ride.price}
                    </span>
                    <span className="text-text-tertiary text-sm ml-2">· {ride.eta}</span>
                  </div>
                  <span className="text-text-tertiary text-sm flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {ride.capacity}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety Features */}
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
              Your Safety, Our Priority
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              We&apos;ve built safety into every aspect of the AfriBook Rides experience
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {safetyFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border"
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

      {/* Driver Benefits */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
                Drive with AfriBook
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-6">
                Earn on Your Own Schedule
              </h2>
              <p className="text-text-secondary text-lg mb-8">
                Join thousands of drivers across Africa who are earning a living with
                AfriBook Rides. Set your own hours and earn competitive rates.
              </p>
              <div className="space-y-3 mb-8">
                {driverBenefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
                      <Heart className="w-3 h-3 text-amber-500" />
                    </div>
                    <span className="text-text-secondary">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
              >
                Apply to Drive
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-3xl p-8 border border-amber-500/20"
            >
              <div className="bg-surface rounded-2xl p-6 border border-border">
                <h4 className="font-heading font-bold text-text-primary mb-4">
                  Earnings Estimate
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg. per hour</span>
                    <span className="font-heading font-bold text-text-primary">$12-18</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg. per week (20hrs)</span>
                    <span className="font-heading font-bold text-amber-500">$240-360</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg. per month</span>
                    <span className="font-heading font-bold text-text-primary">$960-1,440</span>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-text-tertiary text-sm">
                      * Earnings may vary based on location, hours, and demand.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gradient-to-br from-dark-500 to-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Transparent Pricing
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              No hidden fees. Know exactly what you&apos;ll pay before you ride.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              {
                label: 'Base Fare',
                value: '$1.50',
              },
              {
                label: 'Per Kilometer',
                value: '$0.50',
              },
              {
                label: 'Per Minute',
                value: '$0.10',
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeIn}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10"
              >
                <p className="text-white/60 mb-2">{item.label}</p>
                <p className="font-heading text-3xl font-bold text-white">{item.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
