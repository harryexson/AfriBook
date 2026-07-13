'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  RotateCcw,
  Clock,
  CreditCard,
  AlertTriangle,
  MapPin,
  Mail,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  HelpCircle,
} from 'lucide-react'

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const TABLE_OF_CONTENTS = [
  { id: 'overview', label: '1. Overview' },
  { id: 'general', label: '2. General Refund Terms' },
  { id: 'events', label: '3. Event Ticket Refunds' },
  { id: 'services', label: '4. Service Booking Refunds' },
  { id: 'products', label: '5. Product / Marketplace Refunds' },
  { id: 'delivery', label: '6. Delivery Refunds' },
  { id: 'rides', label: '7. Ride Refunds' },
  { id: 'food', label: '8. Food Order Refunds' },
  { id: 'timeline', label: '9. Refund Timelines' },
  { id: 'disputes', label: '10. Dispute Process' },
  { id: 'exceptions', label: '11. Exceptions & Non-Refundable Items' },
  { id: 'contact', label: '12. Contact Information' },
]

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              Refund Policy
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary mt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Last updated: July 1, 2025</span>
          </div>
          <span className="text-text-tertiary">|</span>
          <span>Effective: July 1, 2025</span>
        </div>
      </motion.div>

      {/* Table of Contents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-12 p-6 rounded-2xl bg-surface border border-border"
      >
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
          Table of Contents
        </h2>
        <nav className="grid sm:grid-cols-2 gap-2">
          {TABLE_OF_CONTENTS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-text-secondary hover:text-amber-600 transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </motion.div>

      {/* Content Sections */}
      <div className="space-y-12">
        {/* 1. Overview */}
        <motion.section
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="overview"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              1. Overview
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              At AfriBook, we want you to have a positive experience on our platform. This Refund
              Policy explains when and how you can receive refunds for purchases, bookings, rides,
              and deliveries made through the AfriBook platform (&quot;Platform&quot;), operated by
              AfriBook Technologies Limited.
            </p>
            <p>
              Refund policies may vary by service type, Vendor, event organizer, and country. This
              policy covers the general principles that apply across all services, with specific
              provisions for each service category below. Vendor-specific or event-specific refund
              terms may be displayed at the time of purchase and will take precedence where they
              differ from this general policy, provided they do not reduce your statutory rights.
            </p>
            <p>
              Nothing in this policy affects your statutory rights under the consumer protection
              laws of your country of residence, including the right to a refund for goods that are
              faulty, not as described, or not fit for purpose.
            </p>
          </div>
        </motion.section>

        {/* 2. General Refund Terms */}
        <motion.section
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="general"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. General Refund Terms
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">2.1 Who Can Request a Refund</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>The original purchaser who made the payment through the Platform</li>
              <li>The account holder under which the transaction was made</li>
              <li>Authorized representatives (e.g., a parent for a minor, a business owner for a corporate account)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.2 How to Request a Refund</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Go to your order/booking history in the Platform and select the relevant transaction</li>
              <li>Click &quot;Request Refund&quot; and follow the prompts, selecting the reason for your request</li>
              <li>Provide any supporting evidence (photos, screenshots, descriptions of the issue)</li>
              <li>Alternatively, contact our support team at{' '}
                <a href="mailto:support@afribook.app" className="text-amber-600 hover:text-amber-700">
                  support@afribook.app
                </a>{' '}
                with your order number and reason for the refund request
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.3 Refund Methods</h3>
            <p>
              Refunds are issued to the original payment method used for the transaction:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Credit/Debit Card:</strong> Refunded to the original card</li>
              <li><strong className="text-text-primary">Mobile Money (M-Pesa, Airtel Money, MTN MoMo):</strong> Refunded to the original mobile money account</li>
              <li><strong className="text-text-primary">Bank Transfer:</strong> Refunded to the originating bank account</li>
              <li><strong className="text-text-primary">AfriBook Wallet:</strong> Refunded as wallet credit (can be transferred to bank)</li>
            </ul>
            <p>
              In exceptional circumstances (e.g., the original payment method is no longer available),
              we may offer alternative refund methods at our discretion.
            </p>
          </div>
        </motion.section>

        {/* 3. Event Ticket Refunds */}
        <motion.section
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="events"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              3. Event Ticket Refunds
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">3.1 Cancellation by Event Organizer</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>If an event is cancelled by the organizer, you are entitled to a full refund of the ticket price (excluding service fees and booking fees, which may be refundable at the organizer&apos;s discretion)</li>
              <li>If an event is rescheduled, you may choose between receiving a full refund or transferring your ticket to the new date</li>
              <li>Refunds for cancelled events are processed automatically within 14 business days</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.2 Customer-Initiated Cancellation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">More than 30 days before the event:</strong> Full refund of the ticket price</li>
              <li><strong className="text-text-primary">15–30 days before the event:</strong> 70% refund of the ticket price</li>
              <li><strong className="text-text-primary">7–14 days before the event:</strong> 50% refund of the ticket price</li>
              <li><strong className="text-text-primary">Less than 7 days before the event:</strong> No refund (except where required by applicable consumer protection law)</li>
              <li><strong className="text-text-primary">No-show:</strong> No refund</li>
            </ul>
            <p>
              These timeframes may be modified by the event organizer. Any organizer-specific refund
              policy is displayed at the time of ticket purchase and supersedes this general policy
              where it provides equal or greater consumer protection.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.3 Event-Specific Exceptions</h3>
            <p>
              Some events may have non-refundable tickets or different refund terms due to the nature
              of the event (e.g., limited-capacity events, artist appearances, travel packages). These
              exceptions are clearly disclosed at the time of purchase.
            </p>
          </div>
        </motion.section>

        {/* 4. Service Booking Refunds */}
        <motion.section
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="services"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              4. Service Booking Refunds
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">4.1 Cancellation by Customer</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">More than 24 hours before the appointment:</strong> Full refund</li>
              <li><strong className="text-text-primary">12–24 hours before the appointment:</strong> 50% refund</li>
              <li><strong className="text-text-primary">Less than 12 hours before the appointment:</strong> No refund</li>
              <li><strong className="text-text-primary">No-show:</strong> No refund; the Vendor may be entitled to the full service fee</li>
            </ul>
            <p>
              Vendors may set more generous cancellation policies. Any Vendor-specific cancellation
              terms are displayed at the time of booking.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.2 Service Not Rendered</h3>
            <p>
              If the Vendor fails to deliver the booked service (e.g., did not show up, cancelled
              last minute without valid reason), you are entitled to a full refund including all
              Platform fees. Report the issue within 48 hours through the Platform&apos;s dispute
              resolution process.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.3 Service Not as Described</h3>
            <p>
              If the service materially differs from what was described in the listing (e.g.,
              different quality, different scope, unqualified provider), you may be entitled to a
              full or partial refund. Provide evidence of the discrepancy when submitting your
              refund request.
            </p>
          </div>
        </motion.section>

        {/* 5. Product / Marketplace Refunds */}
        <motion.section
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="products"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              5. Product / Marketplace Refunds
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">5.1 Change of Mind</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Within 24 hours of order confirmation and before dispatch:</strong> Full refund</li>
              <li><strong className="text-text-primary">After dispatch but before delivery:</strong> No automatic refund; contact support for assistance</li>
              <li><strong className="text-text-primary">After delivery:</strong> Change-of-mind refunds are at the Vendor&apos;s discretion (unless required by local consumer protection law). Items must be unused, undamaged, and in original packaging within 14 days of delivery</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.2 Defective or Damaged Products</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>If a product arrives damaged, defective, or faulty, you are entitled to a full refund or replacement at no additional cost</li>
              <li>Report the issue within 48 hours of delivery, providing photos of the damage and the packaging</li>
              <li>The Vendor may arrange for return shipping at their cost, or may request that you dispose of the item and issue a refund without requiring a return</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.3 Not as Described</h3>
            <p>
              If a product materially differs from its listing (wrong item, wrong size, wrong color,
              missing features), you are entitled to a full refund. Return the item within 14 days
              of delivery. The Vendor is responsible for return shipping costs for items not as
              described.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.4 Digital Products</h3>
            <p>
              Refunds for digital products (e-books, software licenses, digital downloads) are
              assessed on a case-by-case basis. If the digital product is defective, inaccessible,
              or significantly not as described, a full refund will be issued. Once a digital
              product has been successfully downloaded or accessed, change-of-mind refunds are
              generally not available unless required by applicable law.
            </p>
          </div>
        </motion.section>

        {/* 6. Delivery Refunds */}
        <motion.section
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="delivery"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              6. Delivery Refunds
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">6.1 Failed Deliveries</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Driver unable to complete delivery:</strong> Full refund of delivery fees, including the delivery charge</li>
              <li><strong className="text-text-primary">Incorrect address provided by customer:</strong> Delivery fee may not be refundable. Contact support for assessment</li>
              <li><strong className="text-text-primary">Customer not available at delivery location:</strong> Driver will attempt to contact you. If unreachable after 15 minutes, the delivery may be cancelled with no refund of the delivery fee</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.2 Lost or Damaged in Transit</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>If an item is lost during delivery, you are entitled to a full refund of both the item cost and delivery fees</li>
              <li>If an item is damaged during delivery, report within 48 hours with photos. You may be entitled to a full refund, partial refund, or replacement depending on the circumstances</li>
              <li>AfriBook will investigate delivery incidents and work with the Driver to resolve issues promptly</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.3 Late Deliveries</h3>
            <p>
              Delivery time estimates are approximate and not guaranteed. Late deliveries do not
              automatically qualify for a refund unless the delay is excessive (more than 2 hours
              beyond the estimated window for same-day deliveries) and the item was time-sensitive.
              Contact support if you believe you are entitled to a refund due to excessive delay.
            </p>
          </div>
        </motion.section>

        {/* 7. Ride Refunds */}
        <motion.section
          custom={6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="rides"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              7. Ride Refunds
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">7.1 Cancelled Rides</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Cancelled by rider within 2 minutes of booking:</strong> Full refund</li>
              <li><strong className="text-text-primary">Cancelled by rider after 2 minutes or if driver has already arrived:</strong> Cancellation fee may apply</li>
              <li><strong className="text-text-primary">Cancelled by driver after accepting:</strong> Full refund, no cancellation fee charged to rider</li>
              <li><strong className="text-text-primary">No-show by driver after 10 minutes:</strong> Full refund, rider may request a new ride at no additional cost</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.2 Route &amp; Fare Issues</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>If the driver takes a significantly longer route than necessary (without traffic or road condition justification), you may request a fare adjustment through the Platform</li>
              <li>If the final fare significantly exceeds the initial estimate (by more than 20%) without prior notification of surge pricing or route changes, you may dispute the fare</li>
              <li>Fare disputes must be submitted within 24 hours of the ride</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.3 Safety-Related Issues</h3>
            <p>
              If you had a safety concern during your ride, you may be entitled to a full refund.
              Report the issue immediately through the Platform or by contacting{' '}
              <a href="mailto:safety@afribook.app" className="text-amber-600 hover:text-amber-700">
                safety@afribook.app
              </a>.
              Safety-related refund requests are prioritized and assessed within 24 hours.
            </p>
          </div>
        </motion.section>

        {/* 8. Food Order Refunds */}
        <motion.section
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="food"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              8. Food Order Refunds
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">8.1 Order Issues</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Missing items:</strong> Partial refund for the missing items, or a full replacement delivery at no charge</li>
              <li><strong className="text-text-primary">Wrong items received:</strong> Full refund for the incorrect items, or replacement with the correct items</li>
              <li><strong className="text-text-primary">Quality issues (cold food, poor preparation):</strong> Partial or full refund at AfriBook&apos;s discretion based on evidence provided</li>
              <li><strong className="text-text-primary">Food safety concerns (allergens, contamination):</strong> Full refund and immediate investigation. Report to safety@afribook.app</li>
              <li><strong className="text-text-primary">Significantly late delivery (beyond estimated window):</strong> Partial or full refund depending on severity of delay</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.2 How to Report Food Issues</h3>
            <p>
              Report food-related issues within 2 hours of delivery through the Platform, providing:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Photos of the issue (wrong items, quality problems, foreign objects)</li>
              <li>Description of what was ordered vs. what was received</li>
              <li>The order number and delivery details</li>
            </ul>
          </div>
        </motion.section>

        {/* 9. Refund Timelines */}
        <motion.section
          custom={8}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="timeline"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              9. Refund Timelines
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Refund processing times vary by payment method and financial institution:
            </p>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Payment Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Refund Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-text-secondary">AfriBook Wallet</td>
                    <td className="py-3 px-4 text-text-secondary">Instant (within minutes)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-text-secondary">M-Pesa / Mobile Money</td>
                    <td className="py-3 px-4 text-text-secondary">1–3 business days</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-text-secondary">Credit / Debit Card</td>
                    <td className="py-3 px-4 text-text-secondary">5–14 business days</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-text-secondary">Bank Transfer</td>
                    <td className="py-3 px-4 text-text-secondary">5–10 business days</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-text-secondary">USSD / Bank Payment</td>
                    <td className="py-3 px-4 text-text-secondary">7–14 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              These timelines are estimates. Your bank or payment provider may take additional time
              to credit the refund to your account. If your refund has not appeared after the
              stated timeline, please contact your bank or payment provider first, then contact
              AfriBook support if the issue persists.
            </p>
          </div>
        </motion.section>

        {/* 10. Dispute Process */}
        <motion.section
          custom={9}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="disputes"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              10. Dispute Process
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">10.1 Initiating a Dispute</h3>
            <p>
              If your refund request is denied or you are unsatisfied with the resolution, you may
              escalate the matter through our formal dispute process:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit a dispute within 14 days of the transaction or the refund decision through the Platform&apos;s resolution center</li>
              <li>Provide all relevant evidence, including correspondence with the Vendor/Driver, photos, receipts, and any other supporting documentation</li>
              <li>AfriBook will assign a dedicated dispute handler to your case</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.2 Dispute Review</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>AfriBook will review evidence from all parties (Customer, Vendor/Driver, and any third parties)</li>
              <li>We aim to resolve standard disputes within 5 business days</li>
              <li>Complex disputes may take up to 14 business days</li>
              <li>You will receive a written determination explaining the outcome and reasoning</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.3 Appeal</h3>
            <p>
              If you disagree with the dispute determination, you may appeal within 7 days by
              contacting{' '}
              <a href="mailto:disputes@afribook.app" className="text-amber-600 hover:text-amber-700">
                disputes@afribook.app
              </a>{' '}
              with additional evidence or arguments. Appeals are reviewed by a senior team member
              who was not involved in the original decision. The appeal decision is final, subject
              to your statutory rights under applicable consumer protection law.
            </p>
          </div>
        </motion.section>

        {/* 11. Exceptions & Non-Refundable Items */}
        <motion.section
          custom={10}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="exceptions"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              11. Exceptions &amp; Non-Refundable Items
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>The following are generally non-refundable (unless required by applicable law):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AfriBook service fees and booking fees (except where the underlying transaction is fully refunded due to AfriBook or Vendor fault)</li>
              <li>Digital products that have been successfully downloaded, accessed, or activated</li>
              <li>Perishable goods that have been delivered in acceptable condition</li>
              <li>Customized or personalized products (unless defective or not as described)</li>
              <li>Gift cards and prepaid credits</li>
              <li>Completed ride fares (except in cases of significant route deviation or safety concerns)</li>
              <li>Service bookings where the service was fully rendered as described</li>
              <li>Processing fees charged by third-party payment providers (these are non-refundable regardless of the underlying transaction outcome)</li>
            </ul>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                Nothing in this policy limits or excludes your statutory consumer rights. If you
                receive goods that are faulty, not as described, or not fit for purpose under
                applicable consumer protection legislation, you are entitled to a remedy regardless
                of any exceptions listed above.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 12. Contact Information */}
        <motion.section
          custom={11}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="contact"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              12. Contact Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              For refund inquiries, disputes, or questions about this policy, please contact us:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary">AfriBook Technologies Limited</p>
                <p className="text-sm text-text-secondary">Customer Support &amp; Disputes</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">General Support:</p>
                  <a href="mailto:support@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    support@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Disputes &amp; Appeals:</p>
                  <a href="mailto:disputes@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    disputes@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Address:</p>
                  <p className="text-sm text-text-primary">
                    14 Adeola Odeku Street, Victoria Island<br />
                    Lagos, Nigeria
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Navigation */}
      <div className="mt-16 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/cookies"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Cookie Policy
          </Link>
          <Link
            href="/seller-terms"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Seller Terms &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
