'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe,
  Users,
  Store,
  Heart,
  Shield,
  Lightbulb,
  Handshake,
  Accessibility,
  Award,
  ArrowRight,
  ChevronRight,
  MapPin,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const values = [
  {
    icon: Shield,
    title: 'Trust',
    description:
      'Every transaction is secured, every vendor verified. We build trust through transparency and accountability.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We leverage technology to solve Africa\'s unique challenges, creating solutions that work for everyone.',
  },
  {
    icon: Users,
    title: 'Community',
    description:
      'We empower local communities by connecting vendors with customers, creating sustainable economic growth.',
  },
  {
    icon: Accessibility,
    title: 'Accessibility',
    description:
      'Services for everyone, everywhere. We break barriers to ensure no community is left behind.',
  },
  {
    icon: Award,
    title: 'Quality',
    description:
      'We maintain high standards across all services, ensuring every customer experience exceeds expectations.',
  },
];

const stats = [
  { number: '16+', label: 'Countries' },
  { number: '50K+', label: 'Vendors' },
  { number: '1M+', label: 'Customers' },
  { number: '500+', label: 'Cities & Towns' },
  { number: '10M+', label: 'Orders Completed' },
  { number: '24/7', label: 'Support' },
];

const team = [
  { name: 'Amina Okafor', role: 'CEO & Co-Founder', initials: 'AO' },
  { name: 'Kwame Mensah', role: 'CTO & Co-Founder', initials: 'KM' },
  { name: 'Thabo Mokoena', role: 'Head of Operations', initials: 'TM' },
  { name: 'Fatima Al-Rashid', role: 'Head of Product', initials: 'FA' },
  { name: 'Chidi Eze', role: 'Head of Marketing', initials: 'CE' },
  { name: 'Zainab Diallo', role: 'Head of Engineering', initials: 'ZD' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeIn}
              className="text-white/80 font-medium tracking-wider uppercase text-sm mb-4"
            >
              About AfriBook
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Connecting Africa,{' '}
              <span className="text-dark-300">One Service at a Time</span>
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className="text-xl text-white/90 max-w-3xl mx-auto"
            >
              AfriBook is Africa&apos;s leading marketplace platform, connecting vendors,
              customers, drivers, and delivery partners across 16+ countries.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-surface-secondary rounded-2xl p-8 border border-border"
            >
              <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Our Mission
              </h2>
              <p className="text-text-secondary leading-relaxed">
                To empower every African with access to essential services, products,
                and opportunities. We believe that technology should bridge gaps, not
                create them. Our mission is to build an ecosystem where every vendor
                can reach every customer, and every community can thrive.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.1 }}
              className="bg-surface-secondary rounded-2xl p-8 border border-border"
            >
              <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
                Our Vision
              </h2>
              <p className="text-text-secondary leading-relaxed">
                To become Africa&apos;s most trusted and comprehensive marketplace platform,
                connecting 54 countries and over 1.4 billion people. We envision a future
                where every African can access quality services, support local businesses,
                and participate in the digital economy — regardless of location or background.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Our Story
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Born from African Ingenuity
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed">
              AfriBook was founded in 2023 by a team of African entrepreneurs who saw
              an opportunity to unify the continent&apos;s fragmented marketplace landscape.
              What started as a simple idea — connecting local vendors with their communities —
              has grown into a pan-African platform serving millions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                year: '2023',
                title: 'The Beginning',
                description:
                  'Founded in Lagos, Nigeria with a simple marketplace MVP connecting 100 local vendors with customers.',
              },
              {
                year: '2024',
                title: 'Pan-African Expansion',
                description:
                  'Expanded to 8 countries, launched food delivery, rides, and delivery services. Reached 500K customers.',
              },
              {
                year: '2025',
                title: 'The Platform',
                description:
                  'Now serving 16+ countries with 50K+ vendors, 1M+ customers, and a full suite of services.',
              },
            ].map((milestone, i) => (
              <motion.div
                key={milestone.year}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className="bg-surface rounded-2xl p-8 border border-border"
              >
                <span className="text-amber-500 font-heading text-3xl font-bold">
                  {milestone.year}
                </span>
                <h3 className="font-heading text-xl font-bold text-text-primary mt-3 mb-2">
                  {milestone.title}
                </h3>
                <p className="text-text-secondary">{milestone.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Core Values
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
              What Drives Us
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-5 gap-6"
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl p-6 border border-border text-center hover:border-amber-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
                  {value.title}
                </h3>
                <p className="text-text-secondary text-sm">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="py-20 bg-gradient-to-br from-dark-500 via-dark-300 to-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Our Impact
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
              Numbers That Matter
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeIn}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Our Team
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Meet the People Behind AfriBook
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              A diverse team of passionate Africans building the future of the continent&apos;s digital economy.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 gap-6"
          >
            {team.map((member) => (
              <motion.div
                key={member.name}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl p-6 border border-border text-center hover:border-amber-500/50 transition-colors"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-heading font-bold text-xl">
                    {member.initials}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-text-primary">
                  {member.name}
                </h3>
                <p className="text-text-secondary text-sm">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Partners & Investors */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Partners & Investors
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Backed by the Best
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              We&apos;re proud to partner with leading organizations that share our vision
              for Africa&apos;s digital future.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className="bg-surface rounded-2xl border border-border p-8 flex items-center justify-center h-32"
              >
                <span className="text-text-tertiary font-heading font-medium">
                  Partner Logo
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Join the AfriBook Movement
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              Whether you&apos;re a vendor looking to grow your business, a customer
              seeking quality services, or a talent wanting to make an impact — there&apos;s
              a place for you at AfriBook.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sell"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
              >
                Start Selling
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 border border-border hover:border-amber-500 text-text-primary font-medium px-8 py-3 rounded-xl transition-colors"
              >
                Explore Marketplace
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/careers"
                className="inline-flex items-center justify-center gap-2 border border-border hover:border-amber-500 text-text-primary font-medium px-8 py-3 rounded-xl transition-colors"
              >
                View Careers
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
