'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Truck,
  Package,
  BarChart3,
  Globe,
  Headphones,
  Building,
  ArrowRight,
  Check,
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

const features = [
  {
    icon: Package,
    title: 'Bulk Shipping Discounts',
    description: 'Save up to 40% on bulk shipments with our volume-based pricing tiers for businesses of all sizes.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Account Manager',
    description: 'Get a personal account manager to handle your logistics needs and optimize your shipping strategy.',
  },
  {
    icon: Globe,
    title: 'API Integration',
    description: 'Seamlessly integrate AfriBook into your e-commerce platform with our powerful REST API.',
  },
  {
    icon: Building,
    title: 'Custom Packaging',
    description: 'Branded and custom packaging solutions that reinforce your identity at every delivery touchpoint.',
  },
  {
    icon: Zap,
    title: 'Priority Delivery',
    description: 'Guaranteed priority handling and expedited shipping for time-sensitive business deliveries.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into shipping costs, delivery times, and performance metrics across your operations.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for small businesses getting started with shipping.',
    features: [
      'Basic bulk shipping',
      'Email support',
      'Standard tracking',
      'Monthly billing',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$99',
    period: '/mo',
    description: 'For growing businesses that need more power and flexibility.',
    features: [
      '20% bulk shipping discount',
      'API access',
      'Dedicated account manager',
      'Priority support',
      'Analytics dashboard',
      'Custom packaging options',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$499',
    period: '/mo',
    description: 'For large organizations with complex logistics requirements.',
    features: [
      '40% bulk shipping discount',
      'Custom SLA guarantee',
      'White-label tracking',
      '24/7 phone & email support',
      'API integration & webhooks',
      'Dedicated account manager',
      'Advanced analytics & reporting',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const steps = [
  {
    number: '01',
    title: 'Sign Up',
    description: 'Create your business account in minutes with your company details.',
  },
  {
    number: '02',
    title: 'Integrate API',
    description: 'Connect your e-commerce platform with our simple REST API.',
  },
  {
    number: '03',
    title: 'Ship & Track',
    description: 'Start shipping with real-time tracking and automated labeling.',
  },
  {
    number: '04',
    title: 'Analyze & Optimize',
    description: 'Use your dashboard to cut costs and improve delivery performance.',
  },
];

const testimonials = [
  {
    name: 'Amara Okafor',
    role: 'CEO, ShopNaija',
    content: 'AfriBook transformed our delivery operations. We cut shipping costs by 35% and our customers love the real-time tracking. The API integration was seamless.',
    rating: 5,
  },
  {
    name: 'James Mwangi',
    role: 'Operations Director, KenyaMart',
    content: 'The dedicated account manager made all the difference. Our delivery times improved by 60% across East Africa. Enterprise support is truly world-class.',
    rating: 5,
  },
  {
    name: 'Fatima Diallo',
    role: 'Founder, Dakar Designs',
    content: 'From Dakar to Nairobi, AfriBook handles our cross-border logistics flawlessly. The analytics dashboard helps us make data-driven shipping decisions every day.',
    rating: 5,
  },
];

const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees',
];

export default function BusinessPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    companySize: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(48rem_48rem_at_85%_10%,rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(30rem_30rem_at_-5%_110%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.p
                variants={fadeIn}
                className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-4"
              >
                B2B Logistics Platform
              </motion.p>
              <motion.h1
                variants={fadeIn}
                className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
              >
                Scale Your Business{' '}
                <span className="text-amber-500">with AfriBook</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-xl text-white/80 mb-8 max-w-lg">
                Enterprise-grade delivery and logistics solutions built for African
                businesses. Ship smarter, scale faster.
              </motion.p>
              <motion.div variants={fadeIn} className="flex gap-4 flex-wrap">
                <Link
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Contact Sales
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center gap-2 border border-white/30 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  View Plans
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="text-center">
                  <Truck className="w-20 h-20 mx-auto mb-4 text-amber-400" />
                  <p className="font-heading font-bold text-white text-xl mb-2">
                    Enterprise Dashboard
                  </p>
                  <p className="text-white/60">
                    Bulk management, API access, and real-time analytics
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {['12,847', '98.7%', '40%', '24/7'].map((stat, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="font-heading text-2xl font-bold text-amber-400">{stat}</p>
                      <p className="text-white/50 text-sm">
                        {['Deliveries', 'On-Time', 'Cost Saved', 'Support'][i]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
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
              Business Features
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From bulk discounts to real-time analytics, we provide the tools to
              streamline your logistics operations.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeIn}
                className="bg-surface-secondary rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors"
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

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-dark-500 to-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Pricing
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Plans for Every Business
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeIn}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-8 border transition-colors ${
                  plan.highlighted
                    ? 'bg-white/10 backdrop-blur-sm border-amber-500 shadow-lg shadow-amber-500/10 scale-105'
                    : 'bg-white/5 backdrop-blur-sm border-white/10 hover:border-amber-500/50'
                }`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-medium bg-amber-500 text-white px-3 py-1 rounded-full mb-4 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-white/60 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-white/60 text-sm ml-1">{plan.period}</span>
                  )}
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="#"
                  className={`block text-center font-medium px-6 py-3 rounded-xl transition-colors ${
                    plan.highlighted
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
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
              How It Works
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Get Started in 4 Steps
            </h2>
            <p className="text-text-secondary text-lg">
              From signup to shipping optimization in no time.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto"
          >
            {steps.map((step, i) => (
              <motion.div key={step.number} variants={fadeIn} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-amber-500/30" />
                )}
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="font-heading text-2xl font-bold text-amber-500">
                    {step.number}
                  </span>
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
            <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
              Testimonials
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Trusted by African Businesses
            </h2>
            <p className="text-text-secondary text-lg">
              See how AfriBook helps businesses across the continent.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-amber-500 text-lg">&#9733;</span>
                  ))}
                </div>
                <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="font-heading font-bold text-amber-500 text-sm">
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-text-primary text-sm">
                      {t.name}
                    </p>
                    <p className="text-text-tertiary text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA with Form */}
      <section id="contact" className="py-20 bg-gradient-to-br from-dark-500 to-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <p className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-3">
                Get Started
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Logistics?
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Join thousands of businesses across Africa that trust AfriBook for their
                delivery and logistics needs. Fill out the form and our sales team will
                reach out within 24 hours.
              </p>
              <div className="space-y-4 text-white/80">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Free onboarding and setup assistance</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>No long-term contracts required</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Cancel or upgrade anytime</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <h3 className="font-heading text-xl font-bold text-white mb-6">
                  Talk to Our Sales Team
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      placeholder="Enter your business name"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">
                      Company Size
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="" disabled className="bg-dark-500">
                        Select company size
                      </option>
                      {companySizes.map((size) => (
                        <option key={size} value={size} className="bg-dark-500">
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3.5 rounded-xl transition-colors">
                    Submit Inquiry
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
