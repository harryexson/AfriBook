'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Store,
  TrendingUp,
  Users,
  Shield,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Headphones,
  Wallet,
  Sparkles,
} from 'lucide-react'
import PhoneMockup from '@/components/showcase/PhoneMockup'
import { SellAppScreen } from '@/components/showcase/AppScreens'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const benefits = [
  {
    icon: Users,
    title: 'Access to 1M+ Customers',
    description: 'Reach millions of active buyers across 16+ African countries.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Vendors on AfriBook see an average 3x increase in sales within 6 months.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Get paid on time, every time. We handle all payment processing securely.',
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Track sales, customer behavior, and trends with our powerful dashboard.',
  },
  {
    icon: Globe,
    title: 'Pan-African Reach',
    description: 'Sell across borders. Our logistics network connects you to customers everywhere.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Our vendor success team is here to help you every step of the way.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Register',
    description: 'Create your vendor account in minutes. Just basic info and business details.',
  },
  {
    step: '02',
    title: 'List Products',
    description: 'Upload your products or services with photos, descriptions, and pricing.',
  },
  {
    step: '03',
    title: 'Start Selling',
    description: 'Receive orders, manage inventory, and grow your business with our tools.',
  },
]

const testimonials = [
  {
    name: 'Aisha Mohammed',
    business: 'Aisha\'s Fashion Hub',
    location: 'Lagos, Nigeria',
    quote: 'AfriBook transformed my small tailoring business into a pan-African brand. My revenue has grown 4x in just one year.',
    initials: 'AM',
    rating: 5,
  },
  {
    name: 'Daniel Osei',
    business: 'TechGadgets Ghana',
    location: 'Accra, Ghana',
    quote: 'The platform is incredibly easy to use. I started with 10 products and now have over 200. Customer support is amazing.',
    initials: 'DO',
    rating: 5,
  },
  {
    name: 'Fatima Hassan',
    business: 'Nairobi Organics',
    location: 'Nairobi, Kenya',
    quote: 'The analytics dashboard helps me understand my customers better. I\'ve been able to optimize my inventory and increase sales by 200%.',
    initials: 'FH',
    rating: 5,
  },
]

const pricing = [
  {
    name: 'Starter',
    commission: '5%',
    description: 'For small businesses getting started',
    features: ['Up to 50 products', 'Basic analytics', 'Standard support', 'Local delivery'],
    cta: 'Start Free',
  },
  {
    name: 'Growth',
    commission: '3.5%',
    description: 'For growing businesses',
    features: [
      'Unlimited products',
      'Advanced analytics',
      'Priority support',
      'Cross-border delivery',
      'Featured listings',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise',
    commission: 'Custom',
    description: 'For large-scale operations',
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'Bulk shipping rates',
      'White-label options',
    ],
    cta: 'Contact Sales',
  },
]

export default function SellPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_82%_12%,rgba(245,158,11,0.12),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(36rem_36rem_at_-8%_100%,rgba(16,185,129,0.1),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Sell on AfriBook
              </motion.span>
              <motion.h1
                variants={fadeIn}
                className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl"
              >
                Start selling on
                <span className="block text-gradient-gold">AfriBook today.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
                Join 50,000+ vendors already growing their businesses on Africa&apos;s
                largest marketplace. List your products and reach millions of customers.
              </motion.p>

              <motion.div variants={fadeIn} className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-amber-950 shadow-gold-lg transition-colors hover:bg-amber-400"
                >
                  <Store className="h-5 w-5" />
                  Register as Vendor
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
                >
                  View Pricing
                </Link>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                {[
                  { label: 'Active vendors', value: '50K+' },
                  { label: 'Avg. sales lift', value: '3x' },
                  { label: 'Countries', value: '16+' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-heading text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wider text-white/40">{stat.label}</p>
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
              <PhoneMockup glow="emerald">
                <SellAppScreen />
              </PhoneMockup>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -left-6 top-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Wallet className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">$1,240.50</p>
                    <p className="text-xs text-white/50">This week&apos;s earnings</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-6 bottom-24 hidden rounded-2xl border border-white/10 bg-dark-300/90 p-4 shadow-2xl backdrop-blur-md sm:block"
              >
                <p className="text-xs text-white/50">Order confirmed</p>
                <p className="text-sm font-bold text-white">+$45.00</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> New customer
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
              Why Sell on AfriBook?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
              Everything you need to start, grow, and scale your business
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={fadeIn}
                className="rounded-2xl border border-border bg-surface-secondary p-6 transition-colors hover:border-amber-500/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <benefit.icon className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
              Get Started in 3 Simple Steps
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-gold">
                  <span className="font-heading text-xl font-bold text-white">{step.step}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-text-secondary">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              No monthly fees. Only pay when you make a sale.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3"
          >
            {pricing.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeIn}
                className={`rounded-2xl border bg-surface-secondary p-8 ${
                  plan.popular
                    ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <span className="mb-4 inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-text-primary">{plan.name}</h3>
                <p className="mb-4 mt-1 text-sm text-text-secondary">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold text-text-primary">
                    {plan.commission}
                  </span>
                  <span className="ml-1 text-sm text-text-secondary">commission</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="#"
                  className={`block rounded-xl py-3 text-center font-medium transition-colors ${
                    plan.popular
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'border border-border text-text-primary hover:border-amber-500'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
              Vendor Success Stories
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Hear from vendors who are growing with AfriBook
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={fadeIn}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="mb-6 italic text-text-secondary">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
                    <span className="font-heading text-sm font-bold text-white">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading text-sm font-bold text-text-primary">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {testimonial.business} · {testimonial.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-dark-500 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(38rem_38rem_at_50%_120%,rgba(245,158,11,0.16),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
              Ready to Grow Your Business?
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-2xl text-lg text-white/70">
              Join thousands of vendors who are already succeeding on AfriBook.
              It takes just 5 minutes to get started.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 font-medium text-white shadow-gold-lg transition-colors hover:bg-amber-600"
              >
                <Store className="h-5 w-5" />
                Register as Vendor
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-8 py-3.5 font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                Talk to Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
