'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  UserCircle,
  CreditCard,
  ShoppingBag,
  Car,
  Store,
  ShieldCheck,
  ChevronDown,
  Mail,
  MessageCircle,
  Phone,
  ArrowRight,
  HelpCircle,
  BookOpen,
  LifeBuoy,
  ExternalLink,
} from 'lucide-react'

const categories = [
  {
    title: 'Account & Login',
    description: 'Manage your profile, reset passwords, and account settings',
    icon: UserCircle,
    href: '#',
    color: 'bg-amber-500/10 text-amber-500',
  },
  {
    title: 'Payments & Billing',
    description: 'Payment methods, billing issues, and transaction history',
    icon: CreditCard,
    href: '#',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Orders & Bookings',
    description: 'Track orders, modify bookings, and order issues',
    icon: ShoppingBag,
    href: '#',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    title: 'Rides & Delivery',
    description: 'Ride requests, delivery tracking, and driver issues',
    icon: Car,
    href: '#',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    title: 'Vendor Support',
    description: 'Vendor tools, listings, and business management',
    icon: Store,
    href: '#',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    title: 'Safety & Security',
    description: 'Report concerns, safety features, and security tips',
    icon: ShieldCheck,
    href: '/safety',
    color: 'bg-red-500/10 text-red-500',
  },
]

const faqs = [
  {
    question: 'How do I create an AfriBook account?',
    answer:
      'Download the AfriBook app or visit our website, tap "Sign Up", and follow the prompts. You can register with your email address, phone number, or social login (Google/Apple). You\'ll need to verify your phone number via SMS to complete registration.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'AfriBook supports a wide range of payment methods across different countries including M-Pesa, Paystack, Flutterwave, Stripe, Razorpay, bank transfers, and mobile money. Available methods depend on your country of registration.',
  },
  {
    question: 'How do I request a refund?',
    answer:
      'Go to your Order History in the app, select the order, and tap "Request Refund". Choose your reason and submit. You can also visit our Refund Policy page for detailed information on eligibility and timelines.',
  },
  {
    question: 'How do I become a vendor on AfriBook?',
    answer:
      'Tap "Become a Vendor" in the app menu or visit our vendor registration page. You\'ll need to provide business details, verification documents, and banking information. Approval typically takes 2-3 business days.',
  },
  {
    question: 'How do I cancel an order or booking?',
    answer:
      'Open your order details and tap "Cancel Order". Cancellation policies vary by service type. Free cancellation is available within 1 hour for most orders. See our Cancellation Policy for full details.',
  },
  {
    question: 'How do I report a safety concern?',
    answer:
      'Use the "Report Issue" feature in the app, or call our 24/7 safety hotline. For emergencies, always contact local authorities first. You can also visit our Safety page for safety tips and resources.',
  },
  {
    question: 'What happens if a vendor doesn\'t fulfill my order?',
    answer:
      'If a vendor fails to fulfill your order, you\'ll receive a full automatic refund. You can also report the issue through our support channels, and we\'ll investigate and take appropriate action against the vendor.',
  },
  {
    question: 'How do I track my order or delivery?',
    answer:
      'Open the app and go to "My Orders" to see real-time tracking for active orders. You\'ll receive push notifications at key milestones. For rides, you can track your driver on the live map.',
  },
]

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-500/5 via-surface to-surface-secondary border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-amber-500)_0%,_transparent_50%)] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <LifeBuoy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Help Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-text-primary mb-4">
              How can we help you?
            </h1>
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              Search our help topics or browse categories below to find the answers you need.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
              Browse by Category
            </h2>
            <p className="mt-2 text-text-secondary">
              Find answers organized by topic
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {categories.map((category) => (
              <motion.div key={category.title} variants={fadeInUp}>
                <Link
                  href={category.href}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/30 hover:shadow-md transition-all"
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${category.color}`}
                  >
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary group-hover:text-amber-600 transition-colors">
                      {category.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  <ArrowRight className="flex-shrink-0 w-5 h-5 text-text-tertiary group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all mt-1" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 sm:py-20 bg-surface-secondary border-y border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-text-secondary">
              Quick answers to the most common questions
            </p>
          </motion.div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-text-primary pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`flex-shrink-0 w-5 h-5 text-text-tertiary transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-text-secondary leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">
                  No results found for &ldquo;{searchQuery}&rdquo;. Try a different search term.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              Still need help?
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Our support team is ready to assist you. Choose the option that works best for you.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <motion.div variants={fadeInUp}>
              <div className="p-6 rounded-2xl bg-surface border border-border hover:border-amber-500/30 hover:shadow-md transition-all text-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-semibold font-heading text-text-primary mb-2">
                  Email Support
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Send us a detailed message and we&apos;ll respond within 24 hours.
                </p>
                <a
                  href="mailto:support@afribook.com"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inverse font-medium text-sm transition-colors"
                >
                  support@afribook.com
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="p-6 rounded-2xl bg-surface border border-border hover:border-amber-500/30 hover:shadow-md transition-all text-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-semibold font-heading text-text-primary mb-2">
                  Live Chat
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Chat with our support agents in real-time, available 7 days a week.
                </p>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inverse font-medium text-sm transition-colors">
                  Start Chat
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="p-6 rounded-2xl bg-surface border border-border hover:border-amber-500/30 hover:shadow-md transition-all text-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-semibold font-heading text-text-primary mb-2">
                  Phone Support
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Speak with a support agent. Available Mon–Sat, 8AM–8PM (EAT).
                </p>
                <a
                  href="tel:+254700000000"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inverse font-medium text-sm transition-colors"
                >
                  +254 700 000 000
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Community & Additional Resources */}
      <section className="py-16 sm:py-20 bg-surface-secondary border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-surface border border-border text-center"
          >
            <BookOpen className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-2">
              Join the Community
            </h2>
            <p className="text-text-secondary mb-6 max-w-lg mx-auto">
              Connect with other AfriBook users, share tips, and get help from the community in our
              open forum.
            </p>
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 text-text-primary font-medium transition-all"
            >
              Visit Community Forum
              <ExternalLink className="w-4 h-4 text-text-tertiary" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
