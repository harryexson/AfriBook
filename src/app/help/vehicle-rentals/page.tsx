'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  KeyRound,
  PhoneOff,
  CarFront,
  AlertOctagon,
  ShieldCheck,
  CreditCard,
  ClipboardCheck,
  Wrench,
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

const pickupIssues = [
  {
    title: 'The host is unreachable',
    icon: PhoneOff,
    color: 'text-red-600 bg-red-500/10',
    whatToDo:
      "Try calling and messaging the host through the app first — most pickups are confirmed through the in-app chat. If you get no response within 15 minutes of your scheduled pickup time, tap \"Report a pickup problem\" on your booking and choose \"Host unreachable.\"",
    outcome:
      "If the host doesn't respond, your booking is automatically cancelled with a full refund, including your security deposit hold. This does not count against you and won't affect your ability to book again.",
  },
  {
    title: 'The vehicle isn’t available',
    icon: CarFront,
    color: 'text-orange-600 bg-orange-500/10',
    whatToDo:
      "If the host tells you the vehicle has already been rented, is in for repairs, or otherwise can't be handed over, report it the same way — \"Report a pickup problem\" → \"Vehicle unavailable.\" Don't accept a different, unlisted vehicle without confirming it through the app first.",
    outcome:
      'You receive a full refund. Where a comparable vehicle is available nearby, support can help you rebook at no extra cost; otherwise your booking is cancelled with no cancellation fee.',
  },
  {
    title: 'The vehicle is unsafe, has a mechanical fault, or is materially dirty',
    icon: AlertOctagon,
    color: 'text-amber-600 bg-amber-500/10',
    whatToDo:
      "Do not drive the vehicle. Photograph the issue — warning lights, damage, mess, anything that doesn't match the listing — and report it through \"Report a pickup problem\" → \"Vehicle condition issue\" before you leave the pickup location. Photos taken at this stage are what any refund decision is based on.",
    outcome:
      'You receive a full refund and are never charged for pre-existing damage or a fault you reported before driving. Hosts who repeatedly list vehicles that fail this standard are reviewed and may be suspended.',
  },
]

const duringRentalIssues = [
  {
    rule: 'Accident or breakdown',
    detail:
      'Get to safety first, then report it through the app immediately — this starts your claim and connects you with roadside assistance where available. Never negotiate repairs directly with the host before reporting.',
  },
  {
    rule: 'Vehicle develops a fault after pickup',
    detail:
      'Stop driving if it’s unsafe to continue, and report it through the app. Depending on severity, you may be offered a replacement vehicle, a partial refund for the affected days, or roadside assistance.',
  },
  {
    rule: 'You need to extend your rental',
    detail:
      'Request an extension through the app before your scheduled return time. Extensions are subject to the host’s availability and are charged at the listing’s daily rate.',
  },
]

const depositFaqs = [
  {
    question: 'How much is the security deposit and when is it charged?',
    answer:
      'The deposit amount is shown at checkout before you book — it varies by vehicle. It’s authorised on your payment method at booking, not charged, and is released automatically after your rental unless the host files a damage claim.',
  },
  {
    question: 'What can the host claim against my deposit?',
    answer:
      'Only damage beyond normal wear and tear, mileage over the listing’s limit, unpaid tolls or fines from your rental, or cleaning beyond normal use — and only with dated photo evidence submitted within 24 hours of drop-off. Ordinary wear and tear can’t be claimed.',
  },
  {
    question: 'What if I disagree with a damage claim?',
    answer:
      'Dispute it in the app. Support reviews both your evidence and the host’s, including any pre-rental condition report, before releasing or withholding the disputed amount. See the Vehicle Renter Agreement for the full deposit and dispute process.',
  },
  {
    question: 'Is the vehicle insured while I’m driving it?',
    answer:
      "Coverage depends on the host's own policy and any protection plan shown at checkout — it's not automatic or uniform across every listing. Always check what's covered before you book; common exclusions include traffic violations, off-road use, and driving under the influence. Full details are in the Vehicle Renter Agreement.",
  },
]

export default function VehicleRentalsHelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-teal-500/5 via-surface to-surface-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-teal-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-medium text-teal-700 dark:text-teal-400">Vehicle Rentals</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-3">
              Vehicle Rentals Help
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              Everything about booking, picking up, and returning a rental vehicle on AfriBook — including what to do if something goes wrong at pickup.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Before you book */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold font-heading text-text-primary">
                Before you book
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Every rental involves a refundable security deposit, and insurance coverage varies by listing and host. Read the{' '}
              <Link href="/legal/vehicle-renter-agreement" className="text-teal-600 hover:text-teal-700 underline">
                Vehicle Renter Agreement
              </Link>{' '}
              before you book — it covers exactly what your deposit can and can’t be used for, and what insurance coverage means for your trip.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pickup Problems */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              Problems at pickup
            </h2>
            <p className="text-text-secondary">
              What to do, and what happens next, for the most common pickup issues
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {pickupIssues.map((issue) => (
              <motion.div
                key={issue.title}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${issue.color}`}>
                    <issue.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary mb-2">{issue.title}</h3>
                    <p className="text-sm text-text-secondary mb-2">
                      <span className="font-medium text-text-primary">What to do: </span>
                      {issue.whatToDo}
                    </p>
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">What happens: </span>
                      {issue.outcome}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* During Your Rental */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                During your rental
              </h2>
            </div>
            <p className="text-text-secondary">
              What to do if something happens after you’ve driven off
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {duringRentalIssues.map((item) => (
              <motion.div
                key={item.rule}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{item.rule}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Deposit & Insurance FAQs */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Deposits &amp; insurance
              </h2>
            </div>
            <p className="text-text-secondary">
              Common questions about the security deposit and coverage
            </p>
          </motion.div>

          <div className="space-y-3">
            {depositFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-5 rounded-2xl bg-surface border border-border hover:border-teal-500/30 transition-all"
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

      {/* Cancelling a rental */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-surface border border-border"
          >
            <div className="flex items-center gap-3 mb-2">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold font-heading text-text-primary">
                Cancelling a vehicle rental
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Open your booking under &quot;My Bookings&quot; and tap &quot;Cancel Rental.&quot; Refund amounts depend on how far ahead of pickup you cancel — see the{' '}
              <Link href="/help/cancellation" className="text-teal-600 hover:text-teal-700 underline">
                Cancellation Policy
              </Link>{' '}
              for the full vehicle rental cancellation tiers.
            </p>
          </motion.div>
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
              Still having a rental issue?
            </h2>
            <p className="text-text-secondary mb-6">
              If a pickup problem isn’t resolving in-app, our support team can step in directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:support@afribook.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Support
              </a>
              <a
                href="tel:+254700000000"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary border border-border hover:border-teal-500/30 text-text-primary font-medium text-sm transition-all"
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
