'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Store,
  TrendingUp,
  Users,
  Shield,
  CreditCard,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Headphones,
  ChevronRight,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

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
];

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
];

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
];

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
];

export default function SellPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p
              variants={fadeIn}
              className="text-white/80 font-medium tracking-wider uppercase text-sm mb-4"
            >
              Sell on AfriBook
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Start Selling on{' '}
              <span className="text-dark-300">AfriBook Today</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Join 50,000+ vendors already growing their businesses on Africa&apos;s
              largest marketplace. List your products and reach millions of customers.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-600 font-medium px-8 py-3 rounded-xl hover:bg-white/90 transition-colors"
              >
                <Store className="w-5 h-5" />
                Register as Vendor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                View Pricing
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
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
              Why Sell on AfriBook?
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Everything you need to start, grow, and scale your business
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
                  {benefit.title}
                </h3>
                <p className="text-text-secondary text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
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
              Get Started in 3 Simple Steps
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-heading font-bold text-xl">{step.step}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-text-secondary text-lg">
              No monthly fees. Only pay when you make a sale.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {pricing.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeIn}
                className={`bg-surface-secondary rounded-2xl p-8 border ${
                  plan.popular
                    ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <span className="text-xs font-medium bg-amber-500 text-white px-3 py-1 rounded-full mb-4 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
                  {plan.name}
                </h3>
                <p className="text-text-secondary text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold text-text-primary">
                    {plan.commission}
                  </span>
                  <span className="text-text-secondary text-sm ml-1">commission</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="#"
                  className={`block text-center font-medium py-3 rounded-xl transition-colors ${
                    plan.popular
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'border border-border hover:border-amber-500 text-text-primary'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Vendor Success Stories
            </h2>
            <p className="text-text-secondary text-lg">
              Hear from vendors who are growing with AfriBook
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                  ))}
                </div>
                <p className="text-text-secondary mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-sm">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-text-primary text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-text-tertiary text-xs">
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
      <section className="py-20 bg-gradient-to-br from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of vendors who are already succeeding on AfriBook.
              It takes just 5 minutes to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-600 font-medium px-8 py-3 rounded-xl hover:bg-white/90 transition-colors"
              >
                <Store className="w-5 h-5" />
                Register as Vendor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
