'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CreditCard,
  Wallet,
  Clock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Mail,
  Phone,
  FileText,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const eligibilityCriteria = [
  {
    eligible: true,
    title: 'Order not delivered',
    description: 'If your order was never delivered, you qualify for a full refund.',
  },
  {
    eligible: true,
    title: 'Wrong or damaged item',
    description: 'Received a different or damaged item? Request a refund with photos as evidence.',
  },
  {
    eligible: true,
    title: 'Service not rendered',
    description: 'If the booked service was not provided, you\'re eligible for a full refund.',
  },
  {
    eligible: true,
    title: 'Cancelled within policy',
    description: 'Cancelled within the allowed time window per our Cancellation Policy.',
  },
  {
    eligible: false,
    title: 'Late cancellation',
    description: 'Cancellations outside the allowed window may not be eligible for a refund.',
  },
  {
    eligible: false,
    title: 'Change of mind',
    description: 'Changing your mind after a service has been rendered is not grounds for refund.',
  },
]

const paymentProviders = [
  {
    name: 'Stripe',
    logo: '💳',
    refundTime: '3–5 business days',
    method: 'Original card',
    notes: 'Refund appears on your card statement. May take up to one billing cycle to reflect.',
  },
  {
    name: 'Paystack',
    logo: '🏦',
    refundTime: '1–3 business days',
    method: 'Bank account / Card',
    notes: 'Refunded to the bank account or card used for the original transaction.',
  },
  {
    name: 'Flutterwave',
    logo: '🔄',
    refundTime: '1–3 business days',
    method: 'Original payment method',
    notes: 'Supports refunds to cards, bank accounts, and mobile money.',
  },
  {
    name: 'M-Pesa',
    logo: '📱',
    refundTime: 'Instant – 1 hour',
    method: 'M-Pesa wallet',
    notes: 'Fastest refund method. Funds returned directly to your M-Pesa account.',
  },
  {
    name: 'Razorpay',
    logo: '💰',
    refundTime: '3–5 business days',
    method: 'Bank / UPI / Wallet',
    notes: 'Refunded to original payment source. UPI refunds are typically faster.',
  },
]

const refundMethods = [
  {
    icon: CreditCard,
    title: 'Original Payment Method',
    description: 'Refund is sent back to the card, bank account, or mobile money wallet you used to pay. This is the default refund method.',
  },
  {
    icon: Wallet,
    title: 'AfriBook Store Credit',
    description: 'Receive your refund as AfriBook wallet credit, available instantly. You can use it for any future purchase on the platform.',
  },
]

const nonRefundableItems = [
  'Digital products or downloads once accessed',
  'Perishable goods that have been delivered',
  'Custom or personalized items',
  'Service bookings where the service was fully rendered',
  'Promotional or discounted items (unless defective)',
  'Completed ride trips',
]

const howToRequestSteps = [
  'Open the AfriBook app and go to "My Orders"',
  'Select the order you want to request a refund for',
  'Tap "Request Refund" at the bottom of the order details',
  'Choose your refund reason from the list',
  'Upload any supporting evidence (photos, screenshots)',
  'Select your preferred refund method (original payment or store credit)',
  'Submit your request and note your refund reference number',
  'Track your refund status in "My Refunds" section',
]

const faqs = [
  {
    question: 'Can I get a partial refund?',
    answer: 'Yes, partial refunds are available when only part of your order has an issue. For example, if 1 out of 3 items was damaged, you can request a partial refund for just that item.',
  },
  {
    question: 'What if my refund is rejected?',
    answer: 'If your refund request is rejected, you\'ll receive a detailed explanation. You can appeal the decision within 7 days by providing additional evidence. Our dispute resolution team will review your case.',
  },
  {
    question: 'Do I need to return the item for a refund?',
    answer: 'For damaged or wrong items, you may be asked to return the product. AfriBook will arrange and cover return shipping costs. For digital items or services, no return is needed.',
  },
  {
    question: 'Can I request a refund after 30 days?',
    answer: 'Standard refund requests must be made within 30 days of the transaction. For exceptional circumstances, contact our support team who may review your case on a goodwill basis.',
  },
  {
    question: 'What happens if the vendor disputes my refund?',
    answer: 'If a vendor disputes your refund request, it enters our mediation process. Both parties provide evidence, and our team makes a fair decision within 5 business days.',
  },
]

export default function RefundsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-amber-500/5 via-surface to-surface-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-amber-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Refund Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-3">
              Refund Policy
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              We want every transaction on AfriBook to be fair and transparent. Learn about our refund process, eligibility, and timelines.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20"
          >
            <h2 className="text-lg font-semibold font-heading text-text-primary mb-2">
              Refund Process Overview
            </h2>
            <p className="text-text-secondary leading-relaxed">
              When you request a refund on AfriBook, our team reviews your case within 24 hours. If
              approved, the refund is processed according to your chosen refund method and the timelines
              below. We aim to make the process as smooth and transparent as possible for all parties.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Eligibility Criteria */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              Eligibility Criteria
            </h2>
            <p className="text-text-secondary">
              What qualifies for a refund and what doesn&apos;t
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {eligibilityCriteria.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                className="flex items-start gap-3 p-5 rounded-2xl bg-surface border border-border"
              >
                {item.eligible ? (
                  <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Refund Methods */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              Refund Methods
            </h2>
            <p className="text-text-secondary">
              Choose how you&apos;d like to receive your refund
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {refundMethods.map((method) => (
              <motion.div
                key={method.title}
                variants={fadeInUp}
                className="p-6 rounded-2xl bg-surface border border-border hover:border-amber-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <method.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-semibold font-heading text-text-primary mb-2">{method.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{method.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Processing Times by Payment Provider */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Processing Times by Payment Provider
              </h2>
            </div>
            <p className="text-text-secondary">
              Refund processing times vary by payment method
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {paymentProviders.map((provider) => (
              <motion.div
                key={provider.name}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:w-48">
                    <span className="text-2xl">{provider.logo}</span>
                    <h3 className="font-semibold text-text-primary">{provider.name}</h3>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-0.5">Refund Time</p>
                      <p className="text-sm font-medium text-amber-600">{provider.refundTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-0.5">Refund To</p>
                      <p className="text-sm font-medium text-text-primary">{provider.method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-0.5">Notes</p>
                      <p className="text-xs text-text-secondary">{provider.notes}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Partial & Full Refunds */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <motion.div variants={fadeInUp} className="p-6 rounded-2xl bg-surface border border-border">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold font-heading text-text-primary mb-2">Partial Refunds</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Partial refunds are issued when only part of your order is affected. For example, if you
                ordered 3 items and 1 was damaged, you&apos;ll receive a refund for the damaged item only.
                The refund amount is proportional to the item&apos;s value.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="p-6 rounded-2xl bg-surface border border-border">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold font-heading text-text-primary mb-2">Full Refunds</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Full refunds cover the entire order amount including delivery fees. This applies when the
                order was not delivered, the wrong item was sent, or the service was not rendered.
                Cancellation fees may still apply based on timing.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Non-Refundable Items */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Non-Refundable Items
              </h2>
            </div>
            <p className="text-text-secondary">
              Items and services that are not eligible for refunds
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {nonRefundableItems.map((item) => (
              <motion.div
                key={item}
                variants={fadeInUp}
                className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border"
              >
                <XCircle className="flex-shrink-0 w-5 h-5 text-red-500" />
                <span className="text-sm text-text-secondary">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How to Request a Refund */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              How to Request a Refund
            </h2>
            <p className="text-text-secondary">
              Step-by-step guide to requesting your refund
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {howToRequestSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-600">{index + 1}</span>
                </div>
                <p className="text-text-secondary pt-1">{step}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dispute Resolution */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl bg-surface border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary">
                Dispute Resolution
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              If you and the vendor cannot agree on a refund, AfriBook&apos;s dispute resolution team will
              step in. Both parties submit evidence, and our team makes a fair, impartial decision within
              5 business days. Our goal is to ensure every resolution is just and transparent.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-secondary border border-border">
                <p className="text-sm font-medium text-text-primary mb-1">Step 1</p>
                <p className="text-xs text-text-secondary">Both parties submit evidence and context</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-secondary border border-border">
                <p className="text-sm font-medium text-text-primary mb-1">Step 2</p>
                <p className="text-xs text-text-secondary">AfriBook team reviews and investigates</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-secondary border border-border">
                <p className="text-sm font-medium text-text-primary mb-1">Step 3</p>
                <p className="text-xs text-text-secondary">Decision issued within 5 business days</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Frequently Asked Questions
              </h2>
            </div>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
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
                    <h3 className="font-semibold text-text-primary pr-4">{faq.question}</h3>
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
                        <p className="mt-3 text-text-secondary leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl bg-surface border border-border"
          >
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-4">
              Need help with a refund?
            </h2>
            <p className="text-text-secondary mb-6">
              Our refunds team is available to assist with any refund-related questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:refunds@afribook.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inverse font-medium text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                refunds@afribook.com
              </a>
              <a
                href="tel:+254700000000"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 text-text-primary font-medium text-sm transition-all"
              >
                <Phone className="w-4 h-4" />
                +254 700 000 000
              </a>
              <Link
                href="/help/report"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 text-text-primary font-medium text-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                Report an Issue
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
