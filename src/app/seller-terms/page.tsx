'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Store,
  ClipboardCheck,
  DollarSign,
  Package,
  AlertTriangle,
  Shield,
  Scale,
  Users,
  Clock,
  Mail,
  FileText,
  Ban,
  RefreshCw,
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
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'definitions', label: '2. Definitions' },
  { id: 'eligibility', label: '3. Seller Eligibility & Onboarding' },
  { id: 'listing', label: '4. Product & Service Listings' },
  { id: 'pricing', label: '5. Pricing & Fees' },
  { id: 'orders', label: '6. Order Management & Fulfilment' },
  { id: 'payments', label: '7. Payments & Payouts' },
  { id: 'quality', label: '8. Quality Standards & Compliance' },
  { id: 'ip', label: '9. Intellectual Property' },
  { id: 'reviews', label: '10. Reviews & Ratings' },
  { id: 'termination', label: '11. Suspension & Termination' },
  { id: 'liability', label: '12. Limitation of Liability' },
  { id: 'disputes', label: '13. Disputes & Governing Law' },
  { id: 'changes', label: '14. Changes to These Terms' },
  { id: 'contact', label: '15. Contact Information' },
]

export default function SellerTermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 px-4 sm:px-6 pt-12 sm:pt-16"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              Seller Terms &amp; Conditions
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
        <p className="text-sm text-text-secondary mt-4 max-w-2xl">
          These Seller Terms (&quot;Terms&quot;) govern your use of the AfriBook platform as a seller or service provider.
          By registering as a seller, you agree to be bound by these Terms.
        </p>
      </motion.div>

      {/* Table of Contents */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-12 mx-4 sm:mx-6 p-6 rounded-2xl bg-surface border border-border"
      >
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
          Table of Contents
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {TABLE_OF_CONTENTS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-amber-600 hover:text-amber-700 hover:underline transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </div>
      </motion.nav>

      {/* Content */}
      <div className="px-4 sm:px-6 pb-16 space-y-16">
        {/* 1. Acceptance */}
        <motion.section
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="acceptance"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-amber-500" />
            1. Acceptance of Terms
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              By creating a seller account on the AfriBook platform (&quot;Platform&quot;), operated by AfriBook Technologies
              Limited (&quot;AfriBook&quot;, &quot;we&quot;, &quot;us&quot;), you (&quot;Seller&quot;, &quot;you&quot;) agree to
              these Seller Terms and Conditions. If you do not agree, you must not register or use the Platform as a seller.
            </p>
            <p>
              These Terms supplement and incorporate by reference the{' '}
              <Link href="/terms" className="text-amber-600 hover:underline">Terms of Service</Link>,{' '}
              <Link href="/privacy" className="text-amber-600 hover:underline">Privacy Policy</Link>, and{' '}
              <Link href="/cookies" className="text-amber-600 hover:underline">Cookie Policy</Link>.
              In the event of a conflict between these Seller Terms and the general Terms of Service, these Seller Terms shall
              prevail with respect to seller-specific matters.
            </p>
            <p>
              AfriBook reserves the right to modify these Terms at any time. Material changes will be communicated via email
              or in-platform notification at least 14 days before taking effect. Continued use of the Platform after the
              effective date constitutes acceptance of the updated Terms.
            </p>
          </div>
        </motion.section>

        {/* 2. Definitions */}
        <motion.section
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="definitions"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            2. Definitions
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>In addition to the definitions in the general Terms of Service:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>&quot;Seller Account&quot;</strong> means the registered account through which a Seller lists and sells products or services on the Platform.</li>
              <li><strong>&quot;Listing&quot;</strong> means a product or service offered for sale by a Seller on the Platform.</li>
              <li><strong>&quot;Order&quot;</strong> means a confirmed purchase by a Buyer of a Seller&apos;s Listing.</li>
              <li><strong>&quot;Payout&quot;</strong> means the disbursement of funds to a Seller after deduction of applicable fees.</li>
              <li><strong>&quot;Service Fee&quot;</strong> means the commission charged by AfriBook on each transaction, as described in Section 5.</li>
              <li><strong>&quot;Buyer&quot;</strong> means any registered user who purchases or attempts to purchase a Seller&apos;s Listing.</li>
              <li><strong>&quot;Fulfilment&quot;</strong> means the delivery or provision of a purchased product or service to a Buyer.</li>
              <li><strong>&quot;African Markets&quot;</strong> means the 16+ African countries where the Platform currently operates.</li>
            </ul>
          </div>
        </motion.section>

        {/* 3. Eligibility */}
        <motion.section
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="eligibility"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            3. Seller Eligibility &amp; Onboarding
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>To register as a Seller on AfriBook, you must:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Be at least 18 years of age (or the age of majority in your jurisdiction).</li>
              <li>Provide accurate, complete, and current registration information.</li>
              <li>Complete identity verification (KYC) as required by applicable law and Platform policy.</li>
              <li>For businesses: provide a valid business registration certificate, tax identification number, and proof of address.</li>
              <li>For individuals: provide a valid government-issued photo ID and proof of address.</li>
              <li>Comply with all applicable local, national, and international laws governing the sale of your products or services.</li>
            </ul>
            <p>
              AfriBook reserves the right to reject or revoke seller registration at its discretion, including where verification
              documents are found to be fraudulent, incomplete, or where the Seller&apos;s products or services fall outside the
              Platform&apos;s permitted categories.
            </p>
            <p>
              Sellers operating in specific African Markets may be subject to additional licensing, registration, or regulatory
              requirements in their jurisdiction. It is the Seller&apos;s sole responsibility to identify and comply with such requirements.
            </p>
          </div>
        </motion.section>

        {/* 4. Listings */}
        <motion.section
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="listing"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            4. Product &amp; Service Listings
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>Sellers are solely responsible for all Listings they publish on the Platform. Each Listing must:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Accurately describe the product or service, including specifications, condition, quantity, and any limitations.</li>
              <li>Display clear, authentic photographs or visual representations that match the actual product or service.</li>
              <li>State the full price, including all applicable taxes, delivery fees, and surcharges.</li>
              <li>Specify delivery timelines, return policies, and any warranty information.</li>
              <li>Comply with all applicable laws regarding prohibited or restricted items in each jurisdiction where the Listing is visible.</li>
            </ul>
            <p>Prohibited Listings include, but are not limited to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Products or services that are illegal in the jurisdiction of sale.</li>
              <li>Counterfeit, stolen, or unauthorized replica goods.</li>
              <li>Weapons, narcotics, controlled substances, or drug paraphernalia.</li>
              <li>Products that infringe third-party intellectual property rights.</li>
              <li>Hazardous materials without proper licensing.</li>
              <li>Listings that are discriminatory or promote hate speech.</li>
            </ul>
            <p>
              AfriBook may remove, edit, or disable Listings that violate these standards. Repeat violations may result in
              account suspension or permanent ban.
            </p>
          </div>
        </motion.section>

        {/* 5. Pricing & Fees */}
        <motion.section
          custom={4}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="pricing"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-500" />
            5. Pricing &amp; Fees
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              Sellers set their own prices for Listings. All prices must include applicable taxes unless clearly
              stated as exclusive of tax. AfriBook charges the following fees:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Service Fee (Commission):</strong> A percentage of each completed transaction, as displayed
                in the Seller Dashboard at the time of listing. The standard rate ranges from 5% to 15% depending
                on the product category and the Seller&apos;s sales volume tier.
              </li>
              <li>
                <strong>Payment Processing Fee:</strong> A fixed fee or percentage applied to each transaction to cover
                payment gateway costs. This varies by payment method and country.
              </li>
              <li>
                <strong>Featured Listing Fee:</strong> Optional promotional fees to boost Listing visibility. Fees are
                charged upfront and are non-refundable.
              </li>
            </ul>
            <p>
              AfriBook reserves the right to modify fee structures with 30 days&apos; advance notice. Fee changes do not
              apply retroactively to completed transactions.
            </p>
            <p>
              Sellers must not circumvent Platform fees by completing transactions outside the Platform. Attempts to
              do so may result in immediate account termination.
            </p>
          </div>
        </motion.section>

        {/* 6. Order Management */}
        <motion.section
          custom={5}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="orders"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-amber-500" />
            6. Order Management &amp; Fulfilment
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>Upon receiving an Order, the Seller must:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Confirm the Order within the timeframe specified in the Listing (default: 24 hours).</li>
              <li>Fulfil the Order in accordance with the product/service description, quantity, and quality promised.</li>
              <li>Update the Order status in real time (confirmed, in progress, shipped, delivered).</li>
              <li>Provide tracking information where applicable.</li>
            </ul>
            <p>
              Orders not confirmed within the specified timeframe may be automatically cancelled and the Buyer
              refunded in full.
            </p>
            <p>
              Sellers must maintain a minimum order fulfilment rate of 90%. Sellers whose fulfilment rate falls
              below this threshold for two consecutive calendar months may be subject to account review, reduced
              visibility, or suspension.
            </p>
            <p>
              For service-based Listings (e.g., repairs, tutoring, rides, food delivery), the Seller must perform
              the service with reasonable skill and care, consistent with applicable professional standards.
            </p>
          </div>
        </motion.section>

        {/* 7. Payments & Payouts */}
        <motion.section
          custom={6}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="payments"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-500" />
            7. Payments &amp; Payouts
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              Buyer payments are held in escrow by AfriBook until the Order is confirmed as delivered or the
              service is confirmed as completed. After confirmation:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Payouts are processed within 3–5 business days, subject to the Seller&apos;s payout schedule.</li>
              <li>Payouts are made to the Seller&apos;s registered bank account or mobile money wallet.</li>
              <li>Currency conversion fees may apply for cross-border payouts and will be clearly displayed before confirmation.</li>
            </ul>
            <p>AfriBook may withhold payouts in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Pending dispute resolution related to the relevant Order(s).</li>
              <li>Regulatory compliance requirements (e.g., anti-money laundering checks).</li>
              <li>Court orders, tax liens, or legal obligations.</li>
              <li>Suspected fraudulent activity on the Seller Account.</li>
            </ul>
            <p>
              Sellers are responsible for all bank charges, transfer fees, and currency conversion costs associated
              with receiving payouts.
            </p>
          </div>
        </motion.section>

        {/* 8. Quality Standards */}
        <motion.section
          custom={7}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="quality"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            8. Quality Standards &amp; Compliance
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>Sellers must adhere to the following quality standards:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>All products must meet the safety and quality standards applicable in the jurisdiction of sale.</li>
              <li>Food and beverage sellers must comply with local food safety regulations and maintain valid health permits.</li>
              <li>Service providers must hold any licenses or certifications required by local law.</li>
              <li>Sellers must respond to Buyer inquiries within 24 hours.</li>
              <li>Sellers must honour their stated return and refund policies.</li>
            </ul>
            <p>
              AfriBook conducts periodic quality audits and may request documentation (licenses, permits, certifications)
              at any time. Failure to provide requested documentation within 7 days may result in Listing removal
              or account suspension.
            </p>
            <p>
              Sellers are liable for any harm, injury, or loss caused by defective products or negligent services.
              AfriBook may share Seller information with regulatory authorities where required by law.
            </p>
          </div>
        </motion.section>

        {/* 9. Intellectual Property */}
        <motion.section
          custom={8}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="ip"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            9. Intellectual Property
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              Sellers grant AfriBook a non-exclusive, worldwide, royalty-free licence to use, reproduce, modify,
              and display Listing content (including photographs, descriptions, and brand marks) for the purpose
              of operating and promoting the Platform.
            </p>
            <p>
              Sellers represent and warrant that all content in their Listings is original, does not infringe
              any third-party intellectual property rights, and that they have all necessary rights and
              permissions to grant this licence.
            </p>
            <p>
              AfriBook respects intellectual property rights and operates a notice-and-takedown procedure for
              rights holders. If you believe a Listing infringes your IP rights, please contact{' '}
              <a href="mailto:ip@afribook.com" className="text-amber-600 hover:underline">ip@afribook.com</a>.
            </p>
          </div>
        </motion.section>

        {/* 10. Reviews */}
        <motion.section
          custom={9}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="reviews"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            10. Reviews &amp; Ratings
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              Buyers may leave reviews and ratings after a completed transaction. Sellers must not:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Offer incentives in exchange for positive reviews.</li>
              <li>Threaten, harass, or retaliate against Buyers who leave negative reviews.</li>
              <li>Post fake reviews or solicit reviews from non-buyers.</li>
            </ul>
            <p>
              Sellers may respond publicly to reviews in a professional and constructive manner. AfriBook
              may remove reviews that violate our content standards (e.g., hate speech, personal attacks,
              irrelevant content).
            </p>
            <p>
              A Seller&apos;s aggregate rating is displayed on their profile and may affect their visibility
              in search results and eligibility for promotional programmes.
            </p>
          </div>
        </motion.section>

        {/* 11. Suspension & Termination */}
        <motion.section
          custom={10}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="termination"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Ban className="w-6 h-6 text-amber-500" />
            11. Suspension &amp; Termination
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>AfriBook may suspend or terminate a Seller Account for any of the following reasons:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Breach of these Seller Terms or the general Terms of Service.</li>
              <li>Fraudulent activity, misrepresentation, or identity fraud.</li>
              <li>Consistent failure to meet quality standards or fulfilment requirements.</li>
              <li>Receipt of multiple valid complaints from Buyers.</li>
              <li>Violation of applicable laws or regulations.</li>
              <li>Non-payment of fees owed to AfriBook.</li>
              <li>
                Engaging in, soliciting, facilitating, or condoning{' '}
                <strong>SHARFT</strong> — sexual harassment, assault, rape, fraud or trafficking, or any
                other form of sexual exploitation, abuse or financial crime — against any Buyer, user,
                or member of the public.
              </li>
            </ul>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Ban className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-text-primary leading-relaxed">
                  <strong className="font-semibold">Zero tolerance.</strong> AfriBook has a strict and absolute
                  policy that SHARFT is completely prohibited. Any Seller found to have engaged in, facilitated,
                  solicited, or failed to report SHARFT or any criminal conduct will be terminated immediately,
                  without notice, may forfeit outstanding payouts, will be reported to law enforcement, and may be
                  personally liable for their own conduct.
                </p>
              </div>
            </div>
            <p>
              <strong>Suspension:</strong> The Seller will be notified of suspension via email. During suspension,
              the Seller&apos;s Listings are hidden, and no new Orders can be placed. Pending Orders must still
              be fulfilled unless AfriBook instructs otherwise.
            </p>
            <p>
              <strong>Termination:</strong> The Seller may terminate their account at any time by contacting
              <a href="mailto:sellers@afribook.com" className="text-amber-600 hover:underline"> sellers@afribook.com</a>,
              provided all pending Orders are fulfilled and no disputes are open. AfriBook may terminate a Seller
              Account with 30 days&apos; notice (or immediately for cause).
            </p>
            <p>
              Upon termination, any outstanding payouts will be processed after deduction of fees owed, subject to
              applicable holdback periods. Sellers lose access to their Seller Dashboard upon termination.
            </p>
          </div>
        </motion.section>

        {/* 12. Limitation of Liability */}
        <motion.section
          custom={11}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="liability"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            12. Limitation of Liability
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              AfriBook acts as an intermediary marketplace connecting Sellers with Buyers. AfriBook is not a party
              to the contract between Seller and Buyer and is not responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The quality, safety, legality, or availability of products or services offered by Sellers.</li>
              <li>The accuracy of Seller Listings.</li>
              <li>The ability of Buyers to complete purchases.</li>
              <li>Any loss, damage, or injury arising from transactions between Sellers and Buyers.</li>
            </ul>
            <p>
              To the maximum extent permitted by applicable law, AfriBook&apos;s total aggregate liability to any
              Seller shall not exceed the Service Fees paid by that Seller in the 12 months preceding the claim.
              AfriBook shall not be liable for indirect, incidental, special, consequential, or punitive damages.
            </p>
            <p>
              <strong>No joint or several liability.</strong> AfriBook shall not be jointly or severally liable with
              any Seller for loss, injury, damage, or claims arising out of the Seller&apos;s products, services,
              acts, omissions, or the conduct of the Seller&apos;s staff or Buyers, except where caused by the gross
              negligence or wilful misconduct of AfriBook.
            </p>
            <p>
              <strong>Release and hold harmless.</strong> To the fullest extent permitted by law, the Seller releases
              and holds harmless AfriBook and its affiliates, officers, directors, employees, and agents from all
              claims, damages, losses, and expenses (including reasonable legal fees) arising out of: (a) the
              Seller&apos;s products or services; (b) any injury, accident, loss, or damage caused by the Seller&apos;s
              products or services; (c) the conduct of any Buyer or third party; (d) the Seller&apos;s failure to comply
              with local law, licences, or regulations; and (e) force majeure events that prevent or disrupt fulfilment.
            </p>
            <p>
              <strong>Personal liability.</strong> The Seller acknowledges that it may be personally and/or
              entity-liable for claims arising from its own actions, errors, omissions, or negligence, and that
              AfriBook is not the Seller&apos;s insurer or guarantor. The Seller is responsible for conducting its
              own due diligence on the licences, permits, insurance, tax, and safety obligations that apply to its
              business and agrees to comply with all applicable local law.
            </p>
            <p>
              <strong>Force majeure.</strong> Neither party shall be liable for failure or delay caused by an event
              beyond its reasonable control, including acts of God and natural disasters, war, terrorism, civil
              unrest, strikes, power or network failures, government actions, and other unforeseeable events. Where
              an Order cannot be fulfilled due to such an event, the parties will cooperate to refund or rebook the
              Buyer in accordance with the Refund Policy.
            </p>
          </div>
        </motion.section>

        {/* 13. Disputes & Governing Law */}
        <motion.section
          custom={12}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="disputes"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-500" />
            13. Disputes &amp; Governing Law
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              Disputes between Sellers and Buyers should first be attempted to be resolved directly through
              the Platform&apos;s messaging system. If unresolved, either party may escalate the dispute to
              AfriBook&apos;s Dispute Resolution team.
            </p>
            <p>
              Disputes between Sellers and AfriBook arising out of these Terms shall be governed by the laws
              of the Federal Republic of Nigeria, without regard to conflict of law principles. The courts
              of Lagos State, Nigeria shall have exclusive jurisdiction.
            </p>
            <p>
              Notwithstanding the above, Sellers operating in specific African Markets may be entitled to
              mandatory consumer protection remedies in their local jurisdiction. Nothing in these Terms
              excludes or limits such statutory rights.
            </p>
          </div>
        </motion.section>

        {/* 14. Changes */}
        <motion.section
          custom={13}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="changes"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-amber-500" />
            14. Changes to These Terms
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>
              AfriBook may update these Seller Terms from time to time. Material changes will be notified
              to Sellers via email and/or in-platform notification at least 14 days before the changes take
              effect. Non-material changes may be updated without prior notice.
            </p>
            <p>
              If a Seller does not agree to the updated Terms, they may terminate their account before the
              changes take effect. Continued use of the Platform after the effective date constitutes
              acceptance of the revised Terms.
            </p>
          </div>
        </motion.section>

        {/* 15. Contact */}
        <motion.section
          custom={14}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          id="contact"
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Mail className="w-6 h-6 text-amber-500" />
            15. Contact Information
          </h2>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-3">
            <p>For questions about these Seller Terms, please contact:</p>
            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-1">
              <p className="font-medium text-text-primary">AfriBook Technologies Limited</p>
              <p>14 Adeola Odeku Street, Victoria Island, Lagos, Nigeria</p>
              <p>
                Email:{' '}
                <a href="mailto:sellers@afribook.com" className="text-amber-600 hover:underline">
                  sellers@afribook.com
                </a>
              </p>
              <p>
                General:{' '}
                <a href="mailto:legal@afribook.com" className="text-amber-600 hover:underline">
                  legal@afribook.com
                </a>
              </p>
            </div>
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          custom={15}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="pt-8 border-t border-border"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <Link href="/terms" className="text-amber-600 hover:underline">
              ← Terms of Service
            </Link>
            <Link href="/privacy" className="text-amber-600 hover:underline">
              Privacy Policy →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
