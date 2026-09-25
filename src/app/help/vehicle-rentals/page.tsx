'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  Car,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Truck,
  Globe,
  MessageCircle,
  Wrench,
  KeyRound,
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

const topics = [
  {
    id: 'deposit',
    icon: CreditCard,
    question: 'What is the security deposit, and how do I pay it?',
    answer:
      'Most bookings include a refundable security deposit set by the vehicle Host and shown on the listing before you book — it varies by vehicle and Host, so check the listing’s deposit amount and accepted payment method before confirming. Some Hosts only accept a credit card (not debit) for the deposit; the listing states which cards are accepted. The deposit is authorised at pickup and released within 5 business days of a clean return, with no damage, missing fuel, or unpaid tolls/fines.',
  },
  {
    id: 'documents',
    icon: FileText,
    question: 'What documents do I need to rent a vehicle?',
    answer:
      'You’ll generally need: a valid driver’s licence in your name that meets the Host’s stated requirements, the payment method used for your booking, a valid photo ID, and — if the deposit requires it — a physical credit card in the main driver’s name. Requirements can vary by Host and country, so review the listing before you travel to pick up the vehicle.',
  },
  {
    id: 'host-unreachable',
    icon: KeyRound,
    question: 'I’m at pickup and the Host isn’t responding — what do I do?',
    answer:
      'First, message or call the Host through the app — most respond within minutes. If there’s no response after a reasonable wait, take a timestamped photo of the pickup location, and contact AfriBook support with your booking reference, a screenshot showing your contact attempt, and any proof you arrived on time (map location, a ride receipt, a flight itinerary, etc). You’re entitled to a full refund if the booking can’t be fulfilled.',
  },
  {
    id: 'no-vehicle',
    icon: Truck,
    question: 'The Host didn’t have a vehicle available for my booking',
    answer:
      'Ask the Host for written confirmation in the app that they can’t fulfil the booking, then contact AfriBook support with your booking reference. You’ll receive a full refund, and where one is available, we’ll help you find a comparable replacement vehicle. Hosts who repeatedly fail to fulfil bookings are reviewed and may be suspended.',
  },
  {
    id: 'unsafe-vehicle',
    icon: Wrench,
    question: 'The vehicle I received is unsafe, has mechanical issues, or is unclean',
    answer:
      'Raise it with the Host directly first — many issues (a quick clean, a swap, a partial refund) are resolved on the spot. If there’s a major safety concern, don’t drive the vehicle. If the issue persists or the Host is unresponsive, contact AfriBook support through the chat below and we’ll step in.',
  },
  {
    id: 'insurance',
    icon: ShieldCheck,
    question: 'Is insurance included in my rental?',
    answer:
      'Base coverage is provided by the vehicle Host and disclosed on the listing before you book — coverage, exclusions and any excess (deductible) vary by Host, since this is a peer-to-peer marketplace rather than a single insurer. Some Hosts offer optional additional protection at pickup, priced and provided by the Host directly, not by AfriBook. Always review the listing’s insurance section before booking.',
  },
  {
    id: 'delivery',
    icon: Truck,
    question: 'Can a vehicle be delivered to me instead of picking it up?',
    answer:
      'Some Hosts offer vehicle delivery to your location for an additional fee, shown in the listing and included in your total price during booking. Not every Host or vehicle offers delivery — check the listing’s pickup options before booking if this matters to you.',
  },
  {
    id: 'drive-to-earn',
    icon: Car,
    question: 'Can I rent a vehicle specifically to drive for AfriBook Rides?',
    answer:
      'Yes — hosts on the Vehicle Rental marketplace can opt to cross-list eligible vehicles for driver rental, letting you rent a vehicle that already meets AfriBook Rides requirements. Look for the "Eligible to drive for AfriBook Rides" badge on a listing, or start from the Apply to Drive page and choose "I need a vehicle" to see eligible listings near you.',
  },
  {
    id: 'other-countries',
    icon: Globe,
    question: 'How do rentals work if I’m booking in a different country?',
    answer:
      'Vehicle listings, pricing, deposits and accepted payment methods are shown in the local currency and payment options available in that market — these vary by country. The options available to you are always shown during checkout for that specific listing.',
  },
]

export default function VehicleRentalsHelpPage() {
  const [openTopic, setOpenTopic] = useState<string | null>('deposit')

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-amber-500/5 via-surface to-surface-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-amber-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Car className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Vehicle Rentals</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-3">
              Vehicle Rental Help
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              Security deposits, documents, insurance, and what to do if something goes wrong at pickup —
              everything you need to know about renting a vehicle on AfriBook.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {topics.map((topic) => (
              <motion.div key={topic.id} variants={fadeInUp}>
                <button
                  onClick={() => setOpenTopic(openTopic === topic.id ? null : topic.id)}
                  className="w-full text-left p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <topic.icon className="w-4 h-4 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-text-primary pr-4">{topic.question}</h3>
                    </div>
                    <ChevronDown
                      className={`flex-shrink-0 w-5 h-5 text-text-tertiary transition-transform duration-200 ${
                        openTopic === topic.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {openTopic === topic.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 pl-12 text-text-secondary leading-relaxed">{topic.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20"
          >
            <div>
              <h3 className="font-semibold text-text-primary mb-1">Still stuck?</h3>
              <p className="text-sm text-text-secondary">
                Chat with support for anything not covered here, including deposit disputes.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inverse font-medium text-sm transition-colors shrink-0">
              <MessageCircle className="w-4 h-4" />
              Chat with us
            </button>
          </motion.div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/legal/vehicle-renter-agreement" className="text-amber-600 hover:underline">
              Read the Vehicle Renter Agreement
            </Link>
            <Link href="/legal/vehicle-host-agreement" className="text-amber-600 hover:underline">
              Read the Vehicle Host Agreement
            </Link>
            <Link href="/help/cancellation" className="text-amber-600 hover:underline">
              Cancellation & deposit policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
