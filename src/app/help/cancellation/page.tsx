'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  Car,
  Utensils,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Phone,
  Mail,
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

const customerCancellationRules = [
  {
    timeframe: 'Within 1 hour',
    refund: 'Full refund',
    detail: 'Cancel within 1 hour of placing your order or booking for a full refund with no questions asked.',
    color: 'text-green-600 bg-green-500/10',
    icon: CheckCircle2,
  },
  {
    timeframe: '1–24 hours',
    refund: '75% refund',
    detail: 'Cancel within 24 hours and receive 75% of your payment back. A 25% cancellation fee applies to cover processing costs.',
    color: 'text-amber-600 bg-amber-500/10',
    icon: AlertTriangle,
  },
  {
    timeframe: '24–72 hours',
    refund: '50% refund',
    detail: 'Cancellations made between 24 and 72 hours after booking will receive a 50% refund.',
    color: 'text-orange-600 bg-orange-500/10',
    icon: AlertTriangle,
  },
  {
    timeframe: 'After 72 hours',
    refund: 'No refund',
    detail: 'Cancellations made after 72 hours are not eligible for a refund. The vendor has already committed resources.',
    color: 'text-red-600 bg-red-500/10',
    icon: XCircle,
  },
]

const vendorCancellationRules = [
  {
    rule: 'Vendor-initiated cancellations',
    detail: 'Vendors may cancel an order if the item is unavailable or the service cannot be fulfilled. In this case, the customer receives a full automatic refund.',
  },
  {
    rule: 'Late cancellation penalty',
    detail: 'Vendors who cancel within 2 hours of the scheduled service time may face a penalty fee and temporary account restriction.',
  },
  {
    rule: 'Repeated cancellations',
    detail: 'Vendors with a cancellation rate above 10% will be reviewed and may have their listings deprioritized or suspended.',
  },
]

const rideCancellationRules = [
  {
    rule: 'Free cancellation within 2 minutes',
    detail: 'Cancel your ride within 2 minutes of booking for free. The driver has not yet started moving towards you.',
  },
  {
    rule: 'Cancellation after 2 minutes',
    detail: 'A small cancellation fee applies after 2 minutes to compensate the driver for the time and distance traveled.',
  },
  {
    rule: 'Driver no-show',
    detail: 'If your driver doesn\'t arrive within the estimated time, you can cancel for free and report the issue.',
  },
  {
    rule: 'Peak hours',
    detail: 'During peak hours, cancellation fees may be slightly higher to account for increased demand.',
  },
]

const foodOrderCancellationRules = [
  {
    rule: 'Before restaurant acceptance',
    detail: 'Cancel anytime before the restaurant confirms your order for a full refund.',
  },
  {
    rule: 'After restaurant acceptance',
    detail: 'Once the restaurant starts preparing your food, a partial cancellation fee applies as ingredients may have been used.',
  },
  {
    rule: 'During delivery',
    detail: 'Orders already out for delivery cannot be cancelled. You can refuse delivery and request a refund through support.',
  },
]

const serviceBookingCancellationRules = [
  {
    rule: 'Free cancellation 24+ hours before',
    detail: 'Cancel any service booking more than 24 hours before the scheduled time for a full refund.',
  },
  {
    rule: '12–24 hours before',
    detail: 'Cancel 12–24 hours before for a 75% refund. The service provider has reserved time for you.',
  },
  {
    rule: 'Less than 12 hours',
    detail: 'Cancel less than 12 hours before for a 50% refund. Same-day cancellations receive 25% refund.',
  },
]

const howToCancelSteps = [
  'Open the AfriBook app and go to "My Orders" or "My Bookings"',
  'Select the order or booking you want to cancel',
  'Tap "Cancel Order" or "Cancel Booking"',
  'Select your cancellation reason',
  'Review the refund amount and confirm cancellation',
  'Receive a confirmation notification with refund details',
]

const faqs = [
  {
    question: 'Can I cancel a partially delivered order?',
    answer: 'Yes, you can cancel the undelivered portion. You will receive a refund for items that haven\'t been delivered yet, minus any applicable cancellation fees.',
  },
  {
    question: 'What if the vendor cancels my order?',
    answer: 'If a vendor cancels your order, you\'ll receive an automatic full refund to your original payment method. You\'ll also receive a notification and can leave feedback about the experience.',
  },
  {
    question: 'How long does the refund take?',
    answer: 'Refunds are processed within 1-5 business days depending on your payment method. Mobile money refunds are typically instant, while card refunds may take 3-5 business days.',
  },
  {
    question: 'Can I cancel a recurring subscription?',
    answer: 'Yes, you can cancel recurring subscriptions at any time from your account settings. The cancellation takes effect at the end of the current billing period.',
  },
]

export default function CancellationPolicyPage() {
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
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Cancellation Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-3">
              Cancellation Policy
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              We understand plans change. Here&apos;s everything you need to know about cancelling orders, bookings, and rides on AfriBook.
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
              Overview
            </h2>
            <p className="text-text-secondary leading-relaxed">
              AfriBook aims to be fair to both customers and vendors. Our cancellation policy is designed
              to protect customers while respecting the time and resources of our vendors. Cancellation
              terms vary by service type and timing. Generally, the earlier you cancel, the more you get
              refunded.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Customer Cancellation Rules */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              Customer Cancellation Rules
            </h2>
            <p className="text-text-secondary">
              Time-based refund tiers for orders and general bookings
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {customerCancellationRules.map((rule) => (
              <motion.div
                key={rule.timeframe}
                variants={fadeInUp}
                className="flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${rule.color}`}>
                  <rule.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text-primary">{rule.timeframe}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rule.color}`}>
                      {rule.refund}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{rule.detail}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vendor Cancellation Rules */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              Vendor Cancellation Rules
            </h2>
            <p className="text-text-secondary">
              Policies that apply when vendors cancel orders or bookings
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {vendorCancellationRules.map((rule) => (
              <motion.div
                key={rule.rule}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{rule.rule}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{rule.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Ride Cancellation Rules */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Car className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Ride Cancellation Rules
              </h2>
            </div>
            <p className="text-text-secondary">
              Specific rules for cancelling ride requests
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {rideCancellationRules.map((rule) => (
              <motion.div
                key={rule.rule}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{rule.rule}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{rule.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Food Order Cancellation Rules */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Utensils className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Food Order Cancellation Rules
              </h2>
            </div>
            <p className="text-text-secondary">
              Policies for cancelling food delivery orders
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {foodOrderCancellationRules.map((rule) => (
              <motion.div
                key={rule.rule}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{rule.rule}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{rule.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Service Booking Cancellation Rules */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <CalendarCheck className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Service Booking Cancellation Rules
              </h2>
            </div>
            <p className="text-text-secondary">
              Policies for cancelling booked services (salons, repairs, consultations, etc.)
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {serviceBookingCancellationRules.map((rule) => (
              <motion.div
                key={rule.rule}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{rule.rule}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{rule.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How to Cancel */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              How to Cancel an Order or Booking
            </h2>
            <p className="text-text-secondary">
              Follow these steps to cancel from the AfriBook app
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {howToCancelSteps.map((step, index) => (
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

      {/* Refund Timeline */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Refund Timeline
              </h2>
            </div>
            <p className="text-text-secondary">
              How long it takes to receive your refund after cancellation
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              { method: 'M-Pesa / Mobile Money', time: 'Instant – 1 hour', detail: 'Refunded directly to your mobile money account' },
              { method: 'Paystack', time: '1–3 business days', detail: 'Refunded to your original bank account or card' },
              { method: 'Flutterwave', time: '1–3 business days', detail: 'Refunded to your original payment method' },
              { method: 'Stripe', time: '3–5 business days', detail: 'Refunded to your card, appears on next statement' },
              { method: 'Razorpay', time: '3–5 business days', detail: 'Refunded to your bank account or wallet' },
              { method: 'Store Credit', time: 'Instant', detail: 'Added to your AfriBook wallet immediately' },
            ].map((item) => (
              <motion.div
                key={item.method}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-1">{item.method}</h3>
                <p className="text-sm font-medium text-amber-600 mb-2">{item.time}</p>
                <p className="text-xs text-text-secondary">{item.detail}</p>
              </motion.div>
            ))}
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
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
              Frequently Asked Questions
            </h2>
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

      {/* Contact for Issues */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl bg-surface border border-border"
          >
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-4">
              Having cancellation issues?
            </h2>
            <p className="text-text-secondary mb-6">
              If you&apos;re experiencing problems with a cancellation or refund, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:support@afribook.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inverse font-medium text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Support
              </a>
              <a
                href="tel:+254700000000"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 text-text-primary font-medium text-sm transition-all"
              >
                <Phone className="w-4 h-4" />
                +254 700 000 000
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
