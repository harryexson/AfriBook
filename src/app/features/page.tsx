'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ShoppingBag,
  Utensils,
  Truck,
  Package,
  Calendar,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import PhoneMockup from '@/components/showcase/PhoneMockup'
import AppStoreBadges from '@/components/showcase/AppStoreBadges'
import {
  MarketAppScreen,
  FoodAppScreen,
  RidesAppScreen,
  DeliveryAppScreen,
  EventsAppScreen,
} from '@/components/showcase/AppScreens'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

interface FeatureRow {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets: { title: string; description: string }[]
  screen: React.ReactNode
  glow: 'amber' | 'rose' | 'blue' | 'emerald' | 'violet'
  icon: LucideIcon
  href: string
}

const featureRows: FeatureRow[] = [
  {
    id: 'marketplace',
    eyebrow: 'Marketplace',
    title: 'Buy from local sellers, across Africa',
    description:
      'Discover authentic products and services from 50,000+ trusted vendors — with secure payments and doorstep delivery.',
    bullets: [
      { title: '50K+ verified vendors', description: 'Every seller is vetted and rated by real customers.' },
      { title: 'Secure escrow payments', description: 'Your money is only released when you receive your order.' },
      { title: 'Local & cross-border delivery', description: 'From same-city express to pan-African shipping.' },
    ],
    screen: <MarketAppScreen />,
    glow: 'amber',
    icon: ShoppingBag,
    href: '/marketplace',
  },
  {
    id: 'food',
    eyebrow: 'Food & Dining',
    title: 'Order your favourite food, fast',
    description:
      'From jollof to injera, get the best African kitchens delivered to your door in under 30 minutes.',
    bullets: [
      { title: '5,000+ restaurants', description: 'Nigerian, Ethiopian, Moroccan, and more.' },
      { title: '28 min average delivery', description: 'Live tracking from kitchen to doorstep.' },
      { title: 'Free delivery on Prime', description: 'Save on every order with AfriBook Prime.' },
    ],
    screen: <FoodAppScreen />,
    glow: 'rose',
    icon: Utensils,
    href: '/food',
  },
  {
    id: 'rides',
    eyebrow: 'Rides',
    title: 'Move around your city, your way',
    description:
      'Book economy, comfort, or premium rides in seconds. Safe, tracked, and priced transparently.',
    bullets: [
      { title: 'Always-on driver network', description: 'Thousands of drivers across 16+ countries.' },
      { title: 'Transparent pricing', description: 'Base + distance + time. No surge surprises.' },
      { title: 'Prime members save 20%', description: 'Priority matching and VIP support, always.' },
    ],
    screen: <RidesAppScreen />,
    glow: 'blue',
    icon: Truck,
    href: '/rides',
  },
  {
    id: 'deliveries',
    eyebrow: 'Deliveries',
    title: 'Send anything, anywhere',
    description:
      'Documents, packages, or large freight — same-city or cross-border, with live tracking and insurance.',
    bullets: [
      { title: 'Same-city in 1-2 hours', description: 'Express couriers ready to pick up.' },
      { title: 'Every parcel insured', description: 'Up to $500 coverage on every delivery.' },
      { title: 'Proof of delivery', description: 'Photo confirmation and digital signature.' },
    ],
    screen: <DeliveryAppScreen />,
    glow: 'emerald',
    icon: Package,
    href: '/deliveries',
  },
  {
    id: 'events',
    eyebrow: 'Events & Tickets',
    title: 'Never miss a moment',
    description:
      'Concerts, conferences, weddings, and festivals across 28 African countries — book instantly, check in with a tap.',
    bullets: [
      { title: '850K+ tickets sold', description: 'From Afrobeats nights to tech summits.' },
      { title: 'Digital tickets', description: 'QR check-in, no queues, no paper.' },
      { title: 'Organizer tools', description: 'Sell tickets and track sales in real time.' },
    ],
    screen: <EventsAppScreen />,
    glow: 'violet',
    icon: Calendar,
    href: '/events',
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(55rem_55rem_at_80%_-10%,rgba(245,158,11,0.14),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_-8%_110%,rgba(168,85,247,0.1),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.span
              variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Everything AfriBook
            </motion.span>
            <motion.h1
              variants={fadeIn}
              className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl"
            >
              One super app.
              <span className="block text-gradient-gold">Every convenience.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              Shop, ride, eat, send, and experience — all in one app built for Africa.
              Download once, and do everything.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-10 flex justify-center">
              <AppStoreBadges onDark showQr />
            </motion.div>
            <motion.div variants={fadeIn} className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { label: 'Verticals', value: '6' },
                { label: 'Countries', value: '16+' },
                { label: 'Users', value: '1M+' },
                { label: 'Rating', value: '4.8★' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wider text-white/40">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Rows */}
      {featureRows.map((row, i) => (
        <section
          key={row.id}
          className={`py-20 sm:py-24 ${i % 2 === 1 ? 'bg-surface-secondary' : 'bg-surface'}`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className={`grid items-center gap-16 lg:grid-cols-2 lg:gap-12 ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <motion.span
                  variants={fadeIn}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-500"
                >
                  <row.icon className="h-3.5 w-3.5" />
                  {row.eyebrow}
                </motion.span>
                <motion.h2
                  variants={fadeIn}
                  className="mt-5 text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-text-primary sm:text-4xl"
                >
                  {row.title}
                </motion.h2>
                <motion.p variants={fadeIn} className="mt-4 max-w-lg text-lg leading-relaxed text-text-secondary">
                  {row.description}
                </motion.p>

                <motion.div variants={fadeIn} className="mt-8 space-y-5">
                  {row.bullets.map((bullet) => (
                    <div key={bullet.title} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                        <Check className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-text-primary">{bullet.title}</p>
                        <p className="text-sm text-text-secondary">{bullet.description}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={fadeIn} className="mt-8">
                  <Link
                    href={row.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 font-medium text-text-primary shadow-sm transition-colors hover:border-amber-500/60 hover:text-amber-500"
                  >
                    Explore {row.eyebrow}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: 0.15 }}
                className="relative flex justify-center"
              >
                <PhoneMockup glow={row.glow}>{row.screen}</PhoneMockup>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="relative overflow-hidden bg-dark-500 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(38rem_38rem_at_50%_120%,rgba(245,158,11,0.16),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.h2
              variants={fadeIn}
              className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl"
            >
              Do everything.
              <span className="block text-gradient-gold">With one download.</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Get the AfriBook app today and join over a million people across Africa
              living on the one app that does it all.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-8 flex justify-center">
              <AppStoreBadges onDark />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
