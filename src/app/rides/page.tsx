'use client';

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
  Heart,
  Phone,
  Sparkles,
} from 'lucide-react';
import PhoneMockup from '@/components/showcase/PhoneMockup';
import { RidesAppScreen } from '@/components/showcase/AppScreens';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const rideTypes = [
  {
    name: 'AfriBook Economy',
    description: 'Affordable rides for everyday travel',
    capacity: '1-4',
    price: 'From $3',
    eta: '3-5 min',
    features: ['GPS tracking', 'Cash or card', 'AC equipped'],
    accent: false,
  },
  {
    name: 'AfriBook Comfort',
    description: 'Newer cars with extra legroom',
    capacity: '1-4',
    price: 'From $5',
    eta: '4-7 min',
    features: ['Premium vehicles', 'Top-rated drivers', 'Water bottles'],
    accent: true,
  },
  {
    name: 'AfriBook Premium',
    description: 'Luxury vehicles for special occasions',
    capacity: '1-4',
    price: 'From $10',
    eta: '5-10 min',
    features: ['Luxury cars', 'Professional drivers', 'Wi-Fi included'],
    accent: false,
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
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_80%_12%,rgba(37,99,235,0.1),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_-8%_100%,rgba(245,158,11,0.14),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AfriBook Rides
              </motion.span>
              <motion.h1
                variants={fadeIn}
                className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl"
              >
                Ride safe,
                <span className="block text-gradient-gold">ride smart.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
                Affordable, reliable rides at your fingertips. Available in 16+ countries
                across Africa.
              </motion.p>

              <motion.div variants={fadeIn} className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/rides/book"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-amber-950 shadow-gold-lg transition-colors hover:bg-amber-400"
                >
                  Book a Ride
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/rides/apply"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
                >
                  Become a Driver
                </Link>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="mt-10 grid max-w-md grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md"
              >
                {[
                  { label: 'Base fare', value: '$1.50' },
                  { label: 'Per km', value: '$0.50' },
                  { label: 'Per min', value: '$0.10' },
                ].map((item) => (
                  <div key={item.label} className="px-4 py-3">
                    <p className="text-xs text-white/45">{item.label}</p>
                    <p className="font-heading text-lg font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Phone showcase */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.25 }}
              className="relative flex justify-center"
            >
              <PhoneMockup glow="blue">
                <RidesAppScreen />
              </PhoneMockup>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -left-6 top-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <p className="text-xs text-white/50">Your driver</p>
                <p className="text-sm font-bold text-white">Tunde K. · 4.92★</p>
                <p className="mt-1 text-xs text-emerald-400">Arriving in 3 min</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-6 bottom-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">$3.20</p>
                    <p className="text-xs text-white/50">Economy · Lagos</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ride Types */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
              Choose your ride
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              From budget-friendly to luxury, a ride for every occasion
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {rideTypes.map((ride, i) => (
              <motion.div
                key={ride.name}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className={`premium-card p-8 ${
                  ride.accent ? 'border-amber-500 shadow-gold-lg' : ''
                }`}
              >
                {ride.accent && (
                  <span className="mb-4 inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10">
                  <Car className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary">{ride.name}</h3>
                <p className="mt-1 text-sm text-text-secondary">{ride.description}</p>
                <ul className="mt-5 space-y-2">
                  {ride.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10">
                        <Navigation className="h-3 w-3 text-amber-500" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                  <div>
                    <span className="font-heading text-2xl font-bold text-text-primary">
                      {ride.price}
                    </span>
                    <span className="ml-2 text-sm text-text-tertiary">· {ride.eta}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-text-tertiary">
                    <Users className="h-4 w-4" />
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
              Your safety, our priority
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              Safety is built into every ride
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {safetyFeatures.map((feature) => (
              <motion.div key={feature.title} variants={fadeIn} className="premium-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <feature.icon className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-heading font-bold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Driver Benefits */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                Drive with AfriBook
              </p>
              <h2 className="mb-6 text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
                Earn on your own schedule
              </h2>
              <p className="mb-8 text-lg text-text-secondary">
                Join thousands of drivers across Africa who are earning a living with
                AfriBook Rides. Set your own hours and earn competitive rates.
              </p>
              <ul className="mb-8 grid gap-3 sm:grid-cols-2">
                {driverBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                      <Heart className="h-3 w-3 text-amber-500" />
                    </span>
                    <span className="text-sm text-text-secondary">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/rides/apply"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 font-semibold text-amber-950 shadow-gold transition-colors hover:bg-amber-400"
              >
                Apply to Drive
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-8"
            >
              <div className="premium-card p-6">
                <h4 className="mb-4 font-heading font-bold text-text-primary">
                  Earnings estimate
                </h4>
                <div className="space-y-4">
                  {[
                    { label: 'Avg. per hour', value: '$12-18', accent: false },
                    { label: 'Avg. per week (20hrs)', value: '$240-360', accent: true },
                    { label: 'Avg. per month', value: '$960-1,440', accent: false },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-text-secondary">{row.label}</span>
                      <span
                        className={`font-heading font-bold ${
                          row.accent ? 'text-amber-500' : 'text-text-primary'
                        }`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-text-tertiary">
                      * Earnings may vary based on location, hours, and demand.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
                <MapPin className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-text-secondary">
                  Currently accepting drivers in <span className="font-semibold text-text-primary">12 cities</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Transparent pricing */}
      <section className="relative overflow-hidden bg-dark-600 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(32rem_32rem_at_50%_-20%,rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-10 max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
              Transparent pricing
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white">
              No hidden fees. Know what you pay before you ride.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {[
              { label: 'Base Fare', value: '$1.50', icon: Car },
              { label: 'Per Kilometer', value: '$0.50', icon: Navigation },
              { label: 'Per Minute', value: '$0.10', icon: Clock },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeIn}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                  <item.icon className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-white/60">{item.label}</p>
                  <p className="font-heading text-2xl font-bold text-white">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
