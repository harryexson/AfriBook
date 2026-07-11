'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  ShoppingCart,
  ShieldAlert,
  Flag,
  Store,
  Car,
  MoreHorizontal,
  Upload,
  Send,
  Clock,
  CheckCircle2,
  MessageCircle,
  FileText,
  Mail,
  Phone,
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

const issueTypes = [
  {
    id: 'order',
    title: 'Order Problem',
    description: 'Issues with an order: wrong item, missing items, not delivered',
    icon: ShoppingCart,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'safety',
    title: 'Safety Concern',
    description: 'Report a safety issue with a ride, delivery, or meetup',
    icon: ShieldAlert,
    color: 'bg-red-500/10 text-red-500',
  },
  {
    id: 'fraud',
    title: 'Fraud Report',
    description: 'Suspicious activity, fake listings, or scam attempts',
    icon: Flag,
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    id: 'vendor',
    title: 'Vendor Issue',
    description: 'Report a vendor for policy violations or poor service',
    icon: Store,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    id: 'driver',
    title: 'Driver Issue',
    description: 'Report a driver for unsafe behavior or service issues',
    icon: Car,
    color: 'bg-green-500/10 text-green-500',
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Any other issue not covered by the categories above',
    icon: MoreHorizontal,
    color: 'bg-gray-500/10 text-gray-500',
  },
]

const responseTimes = [
  {
    priority: 'Emergency / Safety',
    time: 'Immediate – 1 hour',
    color: 'text-red-600 bg-red-500/10',
    detail: 'For immediate safety concerns, call our hotline directly.',
  },
  {
    priority: 'Urgent',
    time: 'Within 4 hours',
    color: 'text-orange-600 bg-orange-500/10',
    detail: 'Active orders, fraud reports, and account security issues.',
  },
  {
    priority: 'High',
    time: 'Within 24 hours',
    color: 'text-amber-600 bg-amber-500/10',
    detail: 'Order disputes, vendor complaints, and refund issues.',
  },
  {
    priority: 'Normal',
    time: 'Within 48 hours',
    color: 'text-green-600 bg-green-500/10',
    detail: 'General feedback, feature requests, and non-urgent concerns.',
  },
]

const afterReportSteps = [
  {
    step: 'Confirmation',
    description: 'You\'ll receive a confirmation email with your ticket number and expected response time.',
    icon: CheckCircle2,
  },
  {
    step: 'Review',
    description: 'Our support team reviews your report and gathers any additional information needed.',
    icon: FileText,
  },
  {
    step: 'Investigation',
    description: 'We investigate the issue, which may include contacting the other party involved.',
    icon: ShieldAlert,
  },
  {
    step: 'Resolution',
    description: 'We reach a fair resolution and notify you via email and in-app notification.',
    icon: CheckCircle2,
  },
]

export default function ReportIssuePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

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
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Report an Issue</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-3">
              Report an Issue
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              Help us maintain a safe and reliable marketplace. Report any problems, concerns, or violations you&apos;ve experienced.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Urgent Contact Banner */}
      <section className="bg-red-500/5 border-b border-red-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-red-600">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-semibold">Emergency?</span>
            </div>
            <p className="text-sm text-text-secondary">
              If you&apos;re in immediate danger, call local emergency services first. For urgent safety concerns on AfriBook, call{' '}
              <a href="tel:+254700000000" className="font-semibold text-red-600 hover:underline">
                +254 700 000 000
              </a>{' '}
              (24/7 hotline).
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {submitted ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-text-primary mb-3">
              Report Submitted
            </h2>
            <p className="text-text-secondary mb-2 max-w-md mx-auto">
              Your report has been received. Our team will review it and get back to you within the expected timeframe.
            </p>
            <p className="text-sm text-text-tertiary mb-8">
              Ticket reference: <span className="font-mono font-medium text-text-primary">#AFB-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/help"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inverse font-medium text-sm transition-colors"
              >
                Back to Help Center
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setSelectedType(null)
                  setDescription('')
                  setOrderNumber('')
                  setEmail('')
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 text-text-primary font-medium text-sm transition-all"
              >
                Submit Another Report
              </button>
            </div>
          </motion.div>
        ) : (
          /* Report Form */
          <div className="space-y-12">
            {/* Issue Type Selection */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-2">
                  What type of issue are you reporting?
                </h2>
                <p className="text-text-secondary text-sm">
                  Select the category that best describes your issue
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {issueTypes.map((type) => (
                  <motion.div key={type.id} variants={fadeInUp}>
                    <button
                      onClick={() => setSelectedType(type.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedType === type.id
                          ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
                          : 'bg-surface border-border hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedType === type.id ? 'bg-amber-500/20' : type.color
                          }`}
                        >
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`font-semibold text-sm ${selectedType === type.id ? 'text-amber-600' : 'text-text-primary'}`}>
                            {type.title}
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Description Form */}
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-6">
                  Describe the issue
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Order / Booking Number (if applicable)
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. AFB-123456"
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={6}
                      placeholder="Please provide as much detail as possible about the issue you experienced. Include dates, times, and any relevant context..."
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all resize-none"
                    />
                    <p className="mt-1 text-xs text-text-tertiary">
                      {description.length}/1000 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* File Upload Area */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Attach Evidence (optional)
                    </label>
                    <div className="p-8 rounded-2xl border-2 border-dashed border-border hover:border-amber-500/40 bg-surface-secondary transition-colors cursor-pointer text-center">
                      <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                      <p className="text-sm font-medium text-text-primary mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-text-tertiary">
                        PNG, JPG, PDF up to 10MB each. Max 5 files.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={!description.trim()}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-text-inverse font-medium text-sm transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Submit Report
                    </button>
                    <Link
                      href="/help"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 text-text-primary font-medium text-sm transition-all"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Response Time Expectations */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary">
                    Response Time Expectations
                  </h2>
                </div>
                <p className="text-text-secondary text-sm">
                  Our team prioritizes reports based on severity
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {responseTimes.map((item) => (
                  <motion.div
                    key={item.priority}
                    variants={fadeInUp}
                    className="p-5 rounded-2xl bg-surface border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.color}`}>
                        {item.priority}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">{item.time}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{item.detail}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* What Happens After */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-2">
                  What happens after you report?
                </h2>
                <p className="text-text-secondary text-sm">
                  Here&apos;s our process for handling your report
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {afterReportSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    variants={fadeInUp}
                    className="p-5 rounded-2xl bg-surface border border-border text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-sm font-bold text-amber-600">{index + 1}</span>
                    </div>
                    <h3 className="font-semibold font-heading text-text-primary mb-1">{item.step}</h3>
                    <p className="text-xs text-text-secondary">{item.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Contact for Urgent Issues */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl bg-surface border border-border"
          >
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-4">
              Need immediate assistance?
            </h2>
            <p className="text-text-secondary mb-6">
              For urgent matters, reach out directly to our support team through any of these channels.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="mailto:support@afribook.com"
                className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 transition-all"
              >
                <Mail className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Email</p>
                  <p className="text-xs text-text-secondary">support@afribook.com</p>
                </div>
              </a>
              <a
                href="tel:+254700000000"
                className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 transition-all"
              >
                <Phone className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Phone</p>
                  <p className="text-xs text-text-secondary">+254 700 000 000</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary border border-border">
                <MessageCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Live Chat</p>
                  <p className="text-xs text-text-secondary">Mon–Sat, 8AM–8PM EAT</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
