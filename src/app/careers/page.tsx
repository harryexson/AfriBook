'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  Zap,
  Globe,
  Users,
  Coffee,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  MapPin,
  Clock,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const perks = [
  {
    icon: Globe,
    title: 'Remote-First',
    description: 'Work from anywhere across Africa or the world. We believe talent knows no borders.',
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health insurance, mental wellness support, and gym stipends.',
  },
  {
    icon: GraduationCap,
    title: 'Learning Budget',
    description: '$2,000 annual learning budget for courses, conferences, and certifications.',
  },
  {
    icon: Coffee,
    title: 'Flexible Hours',
    description: 'Work when you\'re most productive. We focus on output, not hours.',
  },
  {
    icon: TrendingUp,
    title: 'Equity Options',
    description: 'All full-time employees receive stock options. Your growth is our growth.',
  },
  {
    icon: Globe,
    title: 'Travel Opportunities',
    description: 'Visit our offices across Africa and attend international conferences.',
  },
];

const departments = {
  Engineering: [
    { title: 'Senior Full-Stack Engineer', location: 'Remote / Lagos', type: 'Full-time' },
    { title: 'Mobile Developer (React Native)', location: 'Remote / Nairobi', type: 'Full-time' },
    { title: 'DevOps Engineer', location: 'Remote', type: 'Full-time' },
    { title: 'Backend Engineer (Node.js)', location: 'Remote / Accra', type: 'Full-time' },
    { title: 'Data Engineer', location: 'Remote', type: 'Full-time' },
  ],
  Product: [
    { title: 'Senior Product Manager', location: 'Lagos / Remote', type: 'Full-time' },
    { title: 'Product Analyst', location: 'Remote', type: 'Full-time' },
    { title: 'UX Researcher', location: 'Remote / Nairobi', type: 'Full-time' },
  ],
  Design: [
    { title: 'Senior UI/UX Designer', location: 'Remote', type: 'Full-time' },
    { title: 'Brand Designer', location: 'Remote / Johannesburg', type: 'Full-time' },
  ],
  Marketing: [
    { title: 'Head of Growth Marketing', location: 'Lagos', type: 'Full-time' },
    { title: 'Content Strategist', location: 'Remote', type: 'Full-time' },
    { title: 'Social Media Manager', location: 'Remote / Nairobi', type: 'Full-time' },
  ],
  Operations: [
    { title: 'Operations Manager', location: 'Lagos', type: 'Full-time' },
    { title: 'City Operations Lead', location: 'Nairobi', type: 'Full-time' },
    { title: 'Logistics Coordinator', location: 'Accra', type: 'Full-time' },
  ],
  Support: [
    { title: 'Customer Support Lead', location: 'Remote', type: 'Full-time' },
    { title: 'Technical Support Engineer', location: 'Remote', type: 'Full-time' },
  ],
};

const culture = [
  {
    title: 'Ubuntu Spirit',
    description: 'We believe in "I am because we are." Our success is measured by the impact we create for communities.',
  },
  {
    title: 'Bias for Action',
    description: 'We move fast, ship often, and learn from our mistakes. Perfection is the enemy of progress.',
  },
  {
    title: 'Radical Transparency',
    description: 'Open salaries, open roadmaps, open books. Trust is built through transparency.',
  },
  {
    title: 'Celebrate Diversity',
    description: 'Africa is 54 countries, 2,000+ languages, and countless cultures. We celebrate it all.',
  },
];

const process = [
  {
    step: '01',
    title: 'Apply Online',
    description: 'Submit your application with your resume and a brief cover letter. We review every application.',
  },
  {
    step: '02',
    title: 'Initial Chat',
    description: 'A 30-minute conversation with our recruiting team to understand your goals and experience.',
  },
  {
    step: '03',
    title: 'Technical Assessment',
    description: 'A practical assessment relevant to the role. No trick questions — we want to see how you think.',
  },
  {
    step: '04',
    title: 'Team Interview',
    description: 'Meet your potential team members. We value culture fit as much as technical skills.',
  },
  {
    step: '05',
    title: 'Offer & Onboarding',
    description: 'Receive your offer and join our world-class onboarding program.',
  },
];

export default function CareersPage() {
  const [activeDept, setActiveDept] = useState<string>('Engineering');

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-dark-500 via-dark-300 to-amber-600 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p
              variants={fadeIn}
              className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-4"
            >
              Careers at AfriBook
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Join the AfriBook Team
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/80 max-w-3xl mx-auto">
              Help us build the future of Africa&apos;s digital economy. We&apos;re looking
              for passionate people who want to make a real difference.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-8">
              <Link
                href="#positions"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
              >
                View Open Positions
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Work at AfriBook */}
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
              Why AfriBook
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
              More Than a Job
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Zap,
                title: 'Impact at Scale',
                description:
                  'Your work directly impacts millions of Africans. Every feature you build, every service you optimize, changes real lives.',
              },
              {
                icon: Users,
                title: 'World-Class Team',
                description:
                  'Work alongside talented engineers, designers, and operators from across the continent and the diaspora.',
              },
              {
                icon: TrendingUp,
                title: 'Grow Your Career',
                description:
                  'Rapid growth opportunities in a company that\'s scaling across 16+ countries. Your career trajectory accelerates here.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-secondary rounded-2xl p-8 border border-border"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-text-secondary">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits & Perks */}
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
              Benefits & Perks
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
              We Take Care of Our People
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {perks.map((perk) => (
              <motion.div
                key={perk.title}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                  <perk.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
                  {perk.title}
                </h3>
                <p className="text-text-secondary text-sm">{perk.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Open Positions
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Find Your Role
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              We&apos;re growing fast and need talented people across every department.
            </p>
          </motion.div>

          {/* Department Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {Object.keys(departments).map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeDept === dept
                    ? 'bg-amber-500 text-white'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <motion.div
            key={activeDept}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-4"
          >
            {departments[activeDept as keyof typeof departments].map((job) => (
              <motion.div
                key={job.title}
                variants={fadeIn}
                className="bg-surface-secondary rounded-xl p-6 border border-border hover:border-amber-500/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-primary">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.type}
                    </span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm shrink-0"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Culture */}
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
              Our Culture
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
              How We Work
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {culture.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-8 border border-border"
              >
                <h3 className="font-heading text-xl font-bold text-text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-text-secondary">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Application Process */}
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
              Application Process
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
              How to Join Us
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-5 gap-6"
          >
            {process.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-heading font-bold">{step.step}</span>
                </div>
                <h3 className="font-heading font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-text-secondary text-sm">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Make an Impact?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Don&apos;t see a role that fits? Send us your resume anyway. We&apos;re always
              looking for exceptional talent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#positions"
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-600 font-medium px-8 py-3 rounded-xl hover:bg-white/90 transition-colors"
              >
                Browse Positions
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
