'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Store,
  Shield,
  CreditCard,
  Package,
  Star,
  AlertTriangle,
  Ban,
  Clock,
  Mail,
  FileText,
  Scale,
  CheckCircle,
  Users,
  MapPin,
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
  { id: 'overview', label: '1. Overview & Purpose' },
  { id: 'eligibility', label: '2. Vendor Eligibility' },
  { id: 'account-setup', label: '3. Account Setup & Verification' },
  { id: 'responsibilities', label: '4. Vendor Responsibilities' },
  { id: 'listings', label: '5. Product/Service Listings' },
  { id: 'payment-terms', label: '6. Payment Terms' },
  { id: 'order-management', label: '7. Order Management & Fulfillment' },
  { id: 'cancellation-refund', label: '8. Cancellation & Refunds' },
  { id: 'reviews-ratings', label: '9. Reviews & Ratings' },
  { id: 'ip', label: '10. Intellectual Property' },
  { id: 'prohibited', label: '11. Prohibited Items & Services' },
  { id: 'suspension', label: '12. Suspension & Termination' },
  { id: 'liability', label: '13. Liability & Indemnification' },
  { id: 'disputes', label: '14. Dispute Resolution' },
  { id: 'modifications', label: '15. Modifications' },
  { id: 'waiver', label: '16. Waiver of Liability, Hold Harmless & Force Majeure' },
  { id: 'governing-law', label: '17. Governing Law' },
  { id: 'contact', label: '18. Contact Information' },
]

export default function VendorAgreementPage() {
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
            <Store className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              Vendor Agreement
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary mt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Last updated: August 4, 2026</span>
          </div>
          <span className="text-text-tertiary">|</span>
          <span>Effective: August 1, 2026</span>
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
            <Store className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              1. Overview &amp; Purpose
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              This Vendor Agreement (&quot;Agreement&quot;) establishes the terms and conditions governing your participation as a vendor on the AfriBook marketplace platform (&quot;Platform&quot;), operated by AfriBook Technologies Limited (&quot;AfriBook,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <p>
              This Agreement supplements the AfriBook{' '}
              <Link href="/legal/terms" className="text-amber-600 hover:text-amber-700">
                Terms of Service
              </Link>
              {' '}and applies specifically to all vendors listing products and services on the Platform. By creating a vendor account and listing products or services, you agree to be bound by this Agreement.
            </p>
            <p>
              AfriBook provides a marketplace that connects vendors with customers across 16+ African countries. We facilitate transactions, provide payment processing, and offer tools for vendor management, but we are not a party to the sale between vendor and customer except as expressly stated herein.
            </p>
          </div>
        </motion.section>

        {/* 2. Eligibility */}
        <motion.section
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="eligibility"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. Vendor Eligibility
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>To register as a vendor on AfriBook, you must meet the following eligibility requirements:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be at least 18 years of age or the age of legal majority in your jurisdiction</li>
              <li>Be legally able to enter into binding agreements in your jurisdiction</li>
              <li>For individuals: provide a valid government-issued identification</li>
              <li>For businesses: be a legally registered entity with valid business documentation</li>
              <li>Have a valid bank account or mobile money account for receiving payouts in the country of operation</li>
              <li>Provide accurate and verifiable contact information</li>
              <li>Comply with all applicable laws and regulations for the products or services you intend to offer</li>
            </ul>
            <p>
              AfriBook reserves the right to reject vendor applications or revoke vendor status at its discretion if eligibility requirements are not met or if we have reasonable grounds to believe the vendor will not comply with our policies.
            </p>
          </div>
        </motion.section>

        {/* 3. Account Setup & Verification */}
        <motion.section
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="account-setup"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              3. Account Setup &amp; Verification
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">3.1 Registration</h3>
            <p>
              To become a vendor, you must complete the vendor registration process through the Platform. This includes providing personal or business information, agreeing to this Agreement, and completing the verification process.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.2 KYC Requirements</h3>
            <p>
              Know Your Customer (KYC) verification is mandatory for all vendors. The required documents include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Individual Vendors:</strong> Government-issued photo ID (passport, national ID, or driver&apos;s license), proof of address (utility bill or bank statement within the last 3 months), and a selfie for identity verification
              </li>
              <li>
                <strong className="text-text-primary">Business Vendors:</strong> Certificate of incorporation or business registration, tax identification number (TIN), proof of business address, director/owner identification documents, and bank account verification
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.3 Verification Tiers</h3>
            <p>
              AfriBook operates a tiered verification system that unlocks progressively more features:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Basic (Tier 1):</strong> Email and phone verification — limited to 5 listings with a monthly sales cap</li>
              <li><strong className="text-text-primary">Standard (Tier 2):</strong> KYC completed — unlimited listings, standard commission rates, access to promotions</li>
              <li><strong className="text-text-primary">Verified (Tier 3):</strong> Enhanced due diligence — reduced commission rates, priority support, featured listing eligibility</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.4 Business Profile</h3>
            <p>
              Vendors must maintain a complete and accurate business profile including: business name, description, contact information, operating hours, service areas, profile and cover photos, and relevant licenses or permits. All profile information is subject to verification and must be kept current.
            </p>
          </div>
        </motion.section>

        {/* 4. Responsibilities */}
        <motion.section
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="responsibilities"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              4. Vendor Responsibilities
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">4.1 Service Quality</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Deliver products and services that meet or exceed the descriptions in your listings</li>
              <li>Maintain professional and courteous communication with customers</li>
              <li>Respond to inquiries and orders within 2 hours during business hours</li>
              <li>Fulfill orders within the timeframes specified in your listings</li>
              <li>Handle complaints and issues promptly and in good faith</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.2 Pricing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Set fair and transparent prices that accurately reflect the value of your products or services</li>
              <li>Clearly disclose all fees, taxes, and charges in your listings</li>
              <li>Do not engage in price gouging during high-demand periods</li>
              <li>Honor advertised prices once a booking or order is confirmed</li>
              <li>AfriBook reserves the right to flag or remove listings with misleading pricing</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.3 Availability</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain accurate availability in your listings and calendar</li>
              <li>Update availability immediately when changes occur</li>
              <li>Minimize cancellations and last-minute changes</li>
              <li>Mark yourself as temporarily unavailable if unable to fulfill orders</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.4 Compliance</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with all applicable local, national, and international laws</li>
              <li>Obtain and maintain all required licenses, permits, and certifications</li>
              <li>Adhere to health, safety, and quality standards relevant to your products or services</li>
              <li>Collect and remit all applicable taxes in accordance with local tax laws</li>
              <li>Maintain appropriate insurance coverage for your business activities</li>
            </ul>
          </div>
        </motion.section>

        {/* 5. Listings */}
        <motion.section
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="listings"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              5. Product/Service Listings
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">5.1 Listing Standards</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All listings must be accurate, complete, and not misleading</li>
              <li>Titles must be clear, descriptive, and free of keyword stuffing</li>
              <li>Descriptions must provide sufficient detail for customers to make informed decisions</li>
              <li>Images must be original, high-resolution photos of the actual product or representative of the service</li>
              <li>Pricing must be clearly stated and inclusive of all mandatory fees</li>
              <li>Category and sub-category assignments must be accurate</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.2 Listing Content Requirements</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>No copyrighted or trademarked content without authorization</li>
              <li>No false claims, exaggerated descriptions, or misleading comparisons</li>
              <li>No content that is offensive, discriminatory, or violates community guidelines</li>
              <li>No references to competitors&apos; platforms or external transaction methods</li>
              <li>Allergen and safety information must be disclosed for food-related listings</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.3 Listing Management</h3>
            <p>
              Vendors have full control over their listings and may edit, pause, or remove them at any time. However, active orders must be fulfilled before a listing is removed. AfriBook reserves the right to modify, remove, or disable listings that violate this Agreement or our{' '}
              <Link href="/legal/guidelines" className="text-amber-600 hover:text-amber-700">
                Community Guidelines
              </Link>.
            </p>
          </div>
        </motion.section>

        {/* 6. Payment Terms */}
        <motion.section
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="payment-terms"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              6. Payment Terms
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">6.1 Commission Structure</h3>
            <p>
              AfriBook charges a commission on each completed transaction. The standard commission rates are:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Marketplace (Products):</strong> 10-15% of the transaction value (varies by category)</li>
              <li><strong className="text-text-primary">Services:</strong> 15-20% of the service fee (varies by category)</li>
              <li><strong className="text-text-primary">Food &amp; Dining:</strong> 20-25% of the order value</li>
              <li><strong className="text-text-primary">Rides &amp; Delivery:</strong> 15-20% commission from driver earnings</li>
            </ul>
            <p>
              Commission rates may vary based on your verification tier, sales volume, promotional participation, and negotiated agreements. Your specific commission rate is displayed in your vendor dashboard.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.2 Payout Schedule</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Standard Payouts:</strong> Weekly, every Tuesday, for completed transactions from the previous week</li>
              <li><strong className="text-text-primary">Express Payouts:</strong> Available for verified vendors (Tier 3) — daily payouts for a small fee</li>
              <li><strong className="text-text-primary">Holding Period:</strong> New vendors may have a 14-day holding period on initial earnings for fraud protection</li>
              <li><strong className="text-text-primary">Minimum Payout:</strong> Payouts are made when your available balance exceeds the minimum threshold of USD $10 or its local equivalent</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.3 Payment Methods</h3>
            <p>
              Vendor payouts can be received via:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bank transfer (local currency in supported countries)</li>
              <li>Mobile money (M-Pesa, Airtel Money, MTN Mobile Money)</li>
              <li>AfriBook Wallet (with option to transfer to bank)</li>
            </ul>
            <p>
              Payout processing fees may apply depending on the payment method and country. Fee details are displayed before you select your payout method.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.4 Taxes</h3>
            <p>
              Vendors are solely responsible for determining and remitting all applicable taxes on their sales, including income tax, sales tax, VAT, or any other applicable taxes. AfriBook may be required to withhold taxes at source in certain jurisdictions and will clearly communicate any such requirements.
            </p>
          </div>
        </motion.section>

        {/* 7. Order Management */}
        <motion.section
          custom={6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="order-management"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              7. Order Management &amp; Fulfillment
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">7.1 Accepting Orders</h3>
            <p>
              When a customer places an order, you will receive a notification through the Platform. You must confirm or decline the order within 30 minutes during business hours. Failure to respond may result in automatic order cancellation and impact your vendor rating.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.2 Fulfillment</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fulfill orders within the timeframe stated in your listing</li>
              <li>Notify the customer of any delays promptly through the Platform</li>
              <li>For physical products: package items securely and include order documentation</li>
              <li>For services: arrive on time, perform the service as described, and mark the order as complete on the Platform</li>
              <li>For food: prepare orders according to specifications and ensure food safety standards</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.3 Communication</h3>
            <p>
              All order-related communication must occur through the Platform&apos;s messaging system. This ensures a complete record for dispute resolution and quality assurance. Do not share personal contact information or encourage off-Platform transactions.
            </p>
          </div>
        </motion.section>

        {/* 8. Cancellation & Refunds */}
        <motion.section
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="cancellation-refund"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              8. Cancellation &amp; Refunds
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">8.1 Vendor Cancellations</h3>
            <p>
              Vendor-initiated cancellations negatively impact customer experience and your vendor rating. Vendors should only cancel orders in genuine circumstances such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The product is genuinely out of stock despite best efforts to maintain inventory</li>
              <li>A genuine emergency prevents service delivery</li>
              <li>The customer has provided invalid or unreachable delivery information</li>
            </ul>
            <p>
              Excessive cancellations (more than 5% of total orders in any 30-day period) will trigger a review and may result in temporary restrictions, increased commission rates, or account suspension.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.2 Refund Policy</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Vendor Fault:</strong> If the product or service is materially different from the listing, the vendor must offer a full refund or replacement</li>
              <li><strong className="text-text-primary">Customer Fault:</strong> For cancellations made by the customer, the refund amount depends on when the cancellation is made relative to the scheduled delivery or service time</li>
              <li><strong className="text-text-primary">No-Show:</strong> If a customer does not show up for a booked service without canceling in advance, the vendor may be entitled to a partial or full charge</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.3 Disputed Refunds</h3>
            <p>
              If you disagree with a refund decision made by AfriBook, you may appeal through the dispute resolution process outlined in Section 14. Refunds issued through the Platform will be deducted from your pending payouts. AfriBook may issue refunds directly to customers in cases of confirmed fraud or policy violation.
            </p>
          </div>
        </motion.section>

        {/* 9. Reviews & Ratings */}
        <motion.section
          custom={8}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="reviews-ratings"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              9. Reviews &amp; Ratings
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Customers may leave reviews and ratings after completing a transaction</li>
              <li>Vendors may respond to reviews publicly through the Platform</li>
              <li>Fake reviews, review manipulation, or incentivizing positive reviews is strictly prohibited</li>
              <li>Vendors may not retaliate against customers who leave negative reviews</li>
              <li>Reviews that violate our Community Guidelines may be removed upon request</li>
              <li>Your overall rating is calculated based on all ratings received in the last 12 months</li>
              <li>Vendors with consistently low ratings (below 3.5 stars) may be subject to additional review and potential suspension</li>
            </ul>
            <p>
              AfriBook uses automated systems and manual review to detect and remove fraudulent or manipulative reviews. Attempts to game the review system will result in immediate account action.
            </p>
          </div>
        </motion.section>

        {/* 10. Intellectual Property */}
        <motion.section
          custom={9}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="ip"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              10. Intellectual Property
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">10.1 Your Content</h3>
            <p>
              You retain ownership of all content you submit to the Platform, including product images, descriptions, logos, and branding. By listing on AfriBook, you grant us a worldwide, non-exclusive, royalty-free, transferable, and sublicensable license to use, reproduce, modify, adapt, publish, translate, and display your content for the purpose of operating, promoting, and improving the Platform.
            </p>
            <p>
              This license terminates when you remove your content from the Platform or close your vendor account, except for content that has been shared by other users or incorporated into reviews.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.2 AfriBook IP</h3>
            <p>
              You may not use AfriBook&apos;s trademarks, logos, brand name, or other intellectual property without express written permission. You may not register or attempt to register any trademark, domain name, or social media handle that is confusingly similar to AfriBook.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.3 IP Complaints</h3>
            <p>
              If you believe another vendor is infringing your intellectual property on the Platform, please submit a detailed complaint through the Platform or email{' '}
              <a href="mailto:ip@afribook.app" className="text-amber-600 hover:text-amber-700">ip@afribook.app</a>.
              We will investigate all valid claims and take appropriate action.
            </p>
          </div>
        </motion.section>

        {/* 11. Prohibited Items */}
        <motion.section
          custom={10}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="prohibited"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Ban className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              11. Prohibited Items &amp; Services
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>The following items and services may not be listed on AfriBook:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Weapons, ammunition, explosives, and related items</li>
              <li>Drugs, narcotics, and controlled substances (prescription or otherwise)</li>
              <li>Counterfeit or stolen goods</li>
              <li>Adult entertainment and sexual services</li>
              <li>Live animals (except authorized livestock or pet sales in applicable jurisdictions)</li>
              <li>Human body parts or remains</li>
              <li>Recalled or banned products</li>
              <li>Hazardous materials and chemicals</li>
              <li>Items that promote hate speech, violence, or discrimination</li>
              <li>Government-issued documents, currency, or credentials</li>
              <li>Lottery tickets, gambling services, or pyramid schemes</li>
              <li>Products or services that violate applicable local, national, or international law</li>
            </ul>
            <p>
              This list is not exhaustive. AfriBook reserves the right to remove any listing that it determines, in its sole discretion, to be inappropriate, unsafe, or in violation of this Agreement.
            </p>
          </div>
        </motion.section>

        {/* 12. Suspension & Termination */}
        <motion.section
          custom={11}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="suspension"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              12. Suspension &amp; Termination
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">12.1 Suspension</h3>
            <p>
              AfriBook may temporarily suspend your vendor account for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violation of this Agreement or the Terms of Service</li>
              <li>Excessive order cancellations or late fulfillments</li>
              <li>Customer complaints and quality issues</li>
              <li>Suspicious or fraudulent activity</li>
              <li>Pending investigation of reported violations</li>
              <li>Failure to complete required verification or renew expired documents</li>
            </ul>
            <p>
              During suspension, your listings will be hidden from customers, and no new orders can be placed. Existing orders must still be fulfilled. You will be notified of the suspension and the reason via email.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">12.2 Termination</h3>
            <p>
              <strong className="text-text-primary">By You:</strong> You may close your vendor account at any time through your dashboard settings, provided all active orders are fulfilled and all pending obligations are met.
            </p>
            <p>
              <strong className="text-text-primary">By AfriBook:</strong> We may terminate your vendor account for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Material breach of this Agreement after written notice and opportunity to cure</li>
              <li>Fraudulent, illegal, or harmful conduct</li>
              <li>Repeated suspensions for the same or similar violations</li>
              <li>Extended period of account inactivity (12+ months with no listings or transactions)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">12.3 Effect of Termination</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All active orders must be completed before termination takes effect</li>
              <li>Pending payouts will be processed after deduction of any owed fees or refunds</li>
              <li>Your listings and profile will be removed from the Platform</li>
              <li>You must cease using any AfriBook branding or trademarks</li>
              <li>Certain provisions of this Agreement survive termination (including IP licenses for user-shared content, indemnification, and dispute resolution)</li>
            </ul>
          </div>
        </motion.section>

        {/* 13. Liability & Indemnification */}
        <motion.section
          custom={12}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="liability"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              13. Liability &amp; Indemnification
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">13.1 Vendor Liability</h3>
            <p>
              As a vendor, you are solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The quality, safety, and legality of the products and services you offer</li>
              <li>Ensuring your listings accurately represent what you deliver</li>
              <li>Compliance with all applicable laws and regulations</li>
              <li>Any claims, damages, or losses arising from your products or services</li>
              <li>Maintaining appropriate insurance coverage for your business activities</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">13.2 Indemnification</h3>
            <p>
              You agree to indemnify, defend, and hold harmless AfriBook, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your products or services</li>
              <li>Your violation of this Agreement</li>
              <li>Your violation of any applicable law or third-party rights</li>
              <li>Your negligence or willful misconduct</li>
              <li>Any dispute between you and a customer</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">13.3 AfriBook&apos;s Limitation of Liability</h3>
            <p>
              AfriBook is not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The quality, safety, or legality of products or services offered by vendors</li>
              <li>Disputes between vendors and customers</li>
              <li>Loss of revenue, profits, or business opportunities</li>
              <li>Data loss or unauthorized access to your account</li>
            </ul>
            <p>
              AfriBook&apos;s total aggregate liability to any vendor shall not exceed the commissions collected from that vendor in the twelve (12) months preceding the claim.
            </p>
          </div>
        </motion.section>

        {/* 14. Dispute Resolution */}
        <motion.section
          custom={13}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="disputes"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              14. Dispute Resolution
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">14.1 Customer Disputes</h3>
            <p>
              AfriBook provides a dispute resolution mechanism for issues between vendors and customers. Both parties may initiate a dispute within 14 days of a transaction. AfriBook will review all evidence and make a determination. Our dispute resolution decisions are final and binding, subject to applicable law.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">14.2 Disputes with AfriBook</h3>
            <p>
              Disputes between vendors and AfriBook arising from this Agreement shall first be addressed through informal negotiation for at least 30 days. If unresolved, disputes shall be submitted to binding arbitration under the rules of the Lagos Multi-Door Courthouse (LMDC), with the seat of arbitration in Lagos, Nigeria.
            </p>
          </div>
        </motion.section>

        {/* 15. Modifications */}
        <motion.section
          custom={14}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="modifications"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              15. Modifications
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              AfriBook reserves the right to modify this Agreement at any time. We will provide at least 30 days&apos; notice before any material changes take effect, communicated via email and/or notification on the Platform. Your continued use of the Platform after the effective date of any changes constitutes your acceptance of the modified Agreement.
            </p>
            <p>
              If you do not agree to the modified terms, you may close your vendor account before the changes take effect without incurring any penalties.
            </p>
          </div>
        </motion.section>

        {/* 16. Waiver of Liability, Hold Harmless & Force Majeure */}
        <motion.section
          custom={15}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="waiver"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              16. Waiver of Liability, Hold Harmless &amp; Force Majeure
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              To the fullest extent permitted by applicable law, you release, discharge, and hold harmless AfriBook, its owners, shareholders, partners, directors, officers, employees, contractors, and agents from any and all liability, claims, demands, damages, losses, costs, or expenses (including reasonable attorneys&apos; fees) arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Your normal and acceptable use of the Platform as a vendor, including listing products or services, fulfilling orders, and all other platform activities;
              </li>
              <li>
                Any transaction, agreement, or interaction between you and any customer, driver, restaurant, or other third-party user facilitated through the Platform; and
              </li>
              <li>
                The conduct, products, services, quality, safety, or legality of any independent customer, driver, restaurant, or other third party.
              </li>
            </ul>
            <p>
              AfriBook shall not be liable for any failure or delay in performing its obligations, or for any loss, damage, or claim arising out of or in connection with, any event beyond its reasonable control, including but not limited to: acts of God and natural disasters (such as earthquakes, floods, hurricanes, storms, droughts, wildfires, landslides, and epidemics or pandemics); war, terrorism, civil unrest, or riots; strikes, lockouts, or other industrial disputes; power failures, telecommunications or internet outages, or failures of third-party infrastructure; government actions, orders, embargoes, or regulations; and any other unforeseeable event or circumstance. You waive any claim against AfriBook in respect of non-performance or delay caused by such force majeure events.
            </p>
            <p>
              You accept that AfriBook acts solely as an intermediary platform and is not a party to any transaction between users. Where a dispute arises between users, AfriBook shall have no liability for the subject matter of that transaction, and you agree to pursue remedies against the relevant party in accordance with this Agreement and applicable law.
            </p>
            <p>
              Where a court or other competent authority determines that any part of this waiver or hold-harmless provision is invalid or unenforceable, the remainder of this provision shall continue in full force and effect. Nothing in this section limits any rights you may have under mandatory law of your country of residence that cannot be waived by agreement.
            </p>
          </div>
        </motion.section>

        {/* 17. Governing Law */}
        <motion.section
          custom={16}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="governing-law"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              17. Governing Law
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles. Any legal proceedings shall be brought in the courts of competent jurisdiction in Lagos, Nigeria.
            </p>
            <p>
              This Agreement, together with the Terms of Service and any other policies referenced herein, constitutes the entire agreement between you and AfriBook regarding your participation as a vendor on the Platform.
            </p>
          </div>
        </motion.section>

        {/* 18. Contact */}
        <motion.section
          custom={17}
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
              18. Contact Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              For questions about this Vendor Agreement or your vendor account, please contact us:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-text-primary">AfriBook Technologies Limited</p>
                <p className="text-sm text-text-secondary">Vendor Support Team</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Email:</p>
                  <a href="mailto:vendors@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    vendors@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Legal:</p>
                  <a href="mailto:legal@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    legal@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
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
            href="/legal/cookies"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Cookie Policy
          </Link>
          <Link
            href="/legal/guidelines"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Community Guidelines &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
