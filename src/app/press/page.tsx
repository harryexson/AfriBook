'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Download,
  Mail,
  ExternalLink,
  Calendar,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Video,
  Share2,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const pressReleases = [
  {
    date: 'January 15, 2025',
    title: 'AfriBook Raises $25M Series B to Expand Pan-African Marketplace',
    summary:
      'Funding round led by Sequoia Africa will fuel expansion into 10 additional countries and launch of new financial services.',
    category: 'Funding',
  },
  {
    date: 'November 3, 2024',
    title: 'AfriBook Launches Food Delivery Service Across 5 Major African Cities',
    summary:
      'New food delivery vertical connects local restaurants with millions of customers in Lagos, Nairobi, Accra, Johannesburg, and Cairo.',
    category: 'Product Launch',
  },
  {
    date: 'August 20, 2024',
    title: 'AfriBook Surpasses 1 Million Customers Milestone',
    summary:
      'Platform reaches major growth milestone, connecting over 50,000 vendors with customers across 16 African countries.',
    category: 'Milestone',
  },
  {
    date: 'May 10, 2024',
    title: 'AfriBook Partners with Mastercard for Digital Payments Integration',
    summary:
      'Strategic partnership enables seamless digital payments for millions of users across the continent.',
    category: 'Partnership',
  },
  {
    date: 'February 28, 2024',
    title: 'AfriBook Named Among Africa\'s Top 10 Tech Startups to Watch',
    summary:
      'Forbes Africa recognizes AfriBook for its innovative approach to connecting African communities through technology.',
    category: 'Award',
  },
  {
    date: 'December 5, 2023',
    title: 'AfriBook Secures $8M Seed Round to Build Africa\'s Marketplace',
    summary:
      'Seed funding from prominent African and international investors validates the vision for a unified African marketplace.',
    category: 'Funding',
  },
];

const mediaKit = [
  {
    icon: ImageIcon,
    title: 'Brand Logo Pack',
    description: 'High-resolution logos in SVG, PNG, and EPS formats.',
    format: 'ZIP — 12 MB',
  },
  {
    icon: FileText,
    title: 'Brand Guidelines',
    description: 'Complete brand identity guide including colors, typography, and usage rules.',
    format: 'PDF — 5 MB',
  },
  {
    icon: ImageIcon,
    title: 'Product Screenshots',
    description: 'App and web screenshots for editorial use.',
    format: 'ZIP — 25 MB',
  },
  {
    icon: Video,
    title: 'Brand Video',
    description: 'Official AfriBook brand video for media coverage.',
    format: 'MP4 — 150 MB',
  },
];

const newsItems = [
  {
    outlet: 'TechCrunch',
    title: 'AfriBook is building the Amazon of Africa',
    date: 'Jan 2025',
  },
  {
    outlet: 'Forbes Africa',
    title: 'Top 10 African startups to watch in 2025',
    date: 'Dec 2024',
  },
  {
    outlet: 'Bloomberg',
    title: 'How AfriBook is transforming commerce across Africa',
    date: 'Nov 2024',
  },
  {
    outlet: 'CNN Africa',
    title: 'The African marketplace app connecting millions',
    date: 'Oct 2024',
  },
  {
    outlet: 'Reuters',
    title: 'African tech startups raise record funding in 2024',
    date: 'Sep 2024',
  },
];

export default function PressPage() {
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
              Press & Media
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
            >
              AfriBook in the News
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/80 max-w-3xl mx-auto">
              Stay updated with the latest news, press releases, and media coverage
              about AfriBook.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-2">
              Press Releases
            </h2>
            <p className="text-text-secondary">
              Official announcements and updates from AfriBook.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-6"
          >
            {pressReleases.map((pr, i) => (
              <motion.article
                key={pr.title}
                variants={fadeIn}
                transition={{ delay: i * 0.05 }}
                className="bg-surface-secondary rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-text-tertiary flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {pr.date}
                      </span>
                      <span className="text-xs font-medium bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full">
                        {pr.category}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-text-primary mb-1">
                      {pr.title}
                    </h3>
                    <p className="text-text-secondary text-sm">{pr.summary}</p>
                  </div>
                  <Link
                    href="#"
                    className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-600 font-medium text-sm shrink-0"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-2">
              Media Kit
            </h2>
            <p className="text-text-secondary">
              Download official AfriBook brand assets for media coverage.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {mediaKit.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary text-sm mb-2">{item.description}</p>
                  <span className="text-text-tertiary text-xs">{item.format}</span>
                </div>
                <button className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-600 text-sm font-medium shrink-0">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Brand Guidelines */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-3xl mx-auto"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-8">
              Brand Assets Guidelines
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: 'Logo Usage',
                  content:
                    'Always use the official AfriBook logo from our media kit. Maintain clear space around the logo equal to the height of the "A" in the wordmark. Do not modify, stretch, or recolor the logo.',
                },
                {
                  title: 'Colors',
                  content:
                    'Our primary brand color is Amber (#F59E0B). Secondary colors include Dark (#1A1A2E) and Surface (#FAFAFA). Always ensure sufficient contrast when placing text over brand colors.',
                },
                {
                  title: 'Typography',
                  content:
                    'We use Poppins for headings and Inter for body text. When these fonts are unavailable, use system fonts with similar characteristics.',
                },
                {
                  title: 'Tone & Voice',
                  content:
                    'AfriBook\'s brand voice is confident, warm, and empowering. We speak as a partner, not a corporation. Use active voice and keep language accessible.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-surface-secondary rounded-xl p-6 border border-border"
                >
                  <h3 className="font-heading font-bold text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary text-sm">{item.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* In the News */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-2">
              In the News
            </h2>
            <p className="text-text-secondary">
              See what leading media outlets are saying about AfriBook.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {newsItems.map((item) => (
              <motion.a
                key={item.title}
                href="#"
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors group"
              >
                <span className="text-amber-500 font-medium text-sm">{item.outlet}</span>
                <h3 className="font-heading text-lg font-bold text-text-primary mt-2 mb-3 group-hover:text-amber-500 transition-colors">
                  {item.title}
                </h3>
                <span className="text-text-tertiary text-sm">{item.date}</span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Press Contact */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-4">
              Press Inquiries
            </h2>
            <p className="text-text-secondary text-lg mb-8">
              For press inquiries, interview requests, and media partnerships, reach out
              to our communications team.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:press@afribook.com"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
              >
                <Mail className="w-4 h-4" />
                press@afribook.com
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-border hover:border-amber-500 text-text-primary font-medium px-8 py-3 rounded-xl transition-colors"
              >
                General Contact
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
