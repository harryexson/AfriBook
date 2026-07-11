'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Heart,
  Shield,
  Ban,
  Star,
  AlertTriangle,
  Flag,
  Gavel,
  Clock,
  Mail,
  FileText,
  MapPin,
  Users,
  Handshake,
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
  { id: 'mission', label: '1. Our Mission & Values' },
  { id: 'respectful', label: '2. Respectful Behavior' },
  { id: 'prohibited', label: '3. Prohibited Content & Activities' },
  { id: 'reviews', label: '4. Fake Reviews & Manipulation' },
  { id: 'safety', label: '5. Safety Guidelines' },
  { id: 'reporting', label: '6. Reporting Violations' },
  { id: 'enforcement', label: '7. Enforcement Actions' },
  { id: 'appeals', label: '8. Appeals Process' },
  { id: 'contact', label: '9. Contact Information' },
]

export default function CommunityGuidelinesPage() {
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
            <Heart className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              Community Guidelines
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary mt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Last updated: January 15, 2025</span>
          </div>
          <span className="text-text-tertiary">|</span>
          <span>Effective: January 1, 2025</span>
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
        {/* 1. Mission & Values */}
        <motion.section
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="mission"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              1. Our Mission &amp; Values
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              AfriBook exists to connect people across Africa and beyond with the products, services, and experiences they need. Our platform thrives when every member of our community feels safe, respected, and valued. These Community Guidelines establish the standards of behavior we expect from all users.
            </p>
            <p>
              Our core values guide everything we do:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-text-primary">Trust &amp; Integrity</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  We build trust through honest interactions, transparent business practices, and consistent accountability across the platform.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-text-primary">Respect &amp; Inclusion</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  We celebrate the diversity of Africa and welcome users of all backgrounds. Discrimination and harassment have no place on AfriBook.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-text-primary">Safety First</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  The safety of our users — customers, vendors, and drivers alike — is our highest priority in every decision we make.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-text-primary">Quality &amp; Excellence</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  We encourage and celebrate high-quality products, services, and customer experiences that reflect the best of African entrepreneurship.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 2. Respectful Behavior */}
        <motion.section
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="respectful"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. Respectful Behavior
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              All users of the AfriBook Platform are expected to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Communicate respectfully:</strong> Use polite, professional language in all interactions — messages, reviews, and support communications</li>
              <li><strong className="text-text-primary">Be honest:</strong> Provide accurate information in your profile, listings, reviews, and communications. Do not misrepresent yourself, your products, or your services</li>
              <li><strong className="text-text-primary">Honor commitments:</strong> Follow through on bookings, orders, and agreed-upon terms. If circumstances change, communicate promptly and fairly</li>
              <li><strong className="text-text-primary">Respect privacy:</strong> Do not share other users&apos; personal information without their consent. Use the Platform&apos;s messaging system for all transaction-related communication</li>
              <li><strong className="text-text-primary">Be patient:</strong> Recognize that vendors, drivers, and customers are all working to provide or receive the best experience possible</li>
              <li><strong className="text-text-primary">Give constructive feedback:</strong> When leaving reviews, be specific, factual, and constructive rather than personal or hostile</li>
              <li><strong className="text-text-primary">Celebrate diversity:</strong> Africa is a continent of incredible cultural, ethnic, linguistic, and religious diversity. Treat all users with dignity regardless of their background</li>
            </ul>
          </div>
        </motion.section>

        {/* 3. Prohibited Content */}
        <motion.section
          custom={2}
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
              3. Prohibited Content &amp; Activities
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">3.1 Prohibited Content</h3>
            <p>You must not post, share, or transmit the following through the Platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Hate speech:</strong> Content that attacks, demeans, or incites hatred or violence against individuals or groups based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, or any other protected characteristic</li>
              <li><strong className="text-text-primary">Harassment and bullying:</strong> Targeted, unwanted behavior that intimidates, degrades, or creates a hostile environment for another user</li>
              <li><strong className="text-text-primary">Threats and intimidation:</strong> Threats of physical harm, property damage, or other harmful actions against any person</li>
              <li><strong className="text-text-primary">Graphic or violent content:</strong> Content depicting extreme violence, gore, or disturbing imagery</li>
              <li><strong className="text-text-primary">Sexual content:</strong> Sexually explicit material, unsolicited sexual advances, or sexual exploitation</li>
              <li><strong className="text-text-primary">Illegal activities:</strong> Content promoting, facilitating, or instructing others in illegal activities</li>
              <li><strong className="text-text-primary">Spam and scams:</strong> Unsolicited commercial messages, phishing attempts, or fraudulent schemes</li>
              <li><strong className="text-text-primary">Misinformation:</strong> Deliberately false or misleading information that may cause harm</li>
              <li><strong className="text-text-primary">Intellectual property infringement:</strong> Content that infringes copyright, trademark, or other intellectual property rights</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.2 Prohibited Activities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Creating multiple accounts to circumvent suspensions or restrictions</li>
              <li>Using automated tools (bots, scrapers) to interact with the Platform</li>
              <li>Attempting to access other users&apos; accounts without authorization</li>
              <li>Circumventing AfriBook&apos;s commission by conducting off-Platform transactions with Platform-sourced customers</li>
              <li>Manipulating ratings, reviews, or search rankings through artificial means</li>
              <li>Engaging in price-fixing, collusion, or anti-competitive behavior with other vendors</li>
              <li>Collecting or harvesting personal information of other users for unauthorized purposes</li>
              <li>Interfering with the proper functioning of the Platform or its infrastructure</li>
              <li>Impersonating another person, business, or AfriBook employee</li>
              <li>Listing products or services that are illegal, counterfeit, stolen, or recalled</li>
              <li>Engaging in money laundering, terrorist financing, or other financial crimes</li>
            </ul>
          </div>
        </motion.section>

        {/* 4. Fake Reviews */}
        <motion.section
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="reviews"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              4. Fake Reviews &amp; Manipulation
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Trustworthy reviews are the backbone of our marketplace. We take review integrity extremely seriously and prohibit:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Fake reviews:</strong> Writing or commissioning reviews that are not based on genuine experience with the product or service</li>
              <li><strong className="text-text-primary">Review manipulation:</strong> Using multiple accounts, bots, or third-party services to inflate or deflate ratings</li>
              <li><strong className="text-text-primary">Incentivized reviews:</strong> Offering payment, discounts, or other incentives in exchange for positive reviews (vendors may not offer incentives for reviews of any kind)</li>
              <li><strong className="text-text-primary">Retaliation:</strong> Taking negative action against a customer who left an honest negative review</li>
              <li><strong className="text-text-primary">Review suppression:</strong> Using legal threats or other means to suppress legitimate negative reviews</li>
              <li><strong className="text-text-primary">Self-review:</strong> Writing reviews of your own products, services, or business, or having employees or family members do so</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.1 Our Detection Systems</h3>
            <p>
              AfriBook employs automated algorithms and manual review processes to identify fraudulent review activity. Our systems analyze patterns including review timing, language patterns, account relationships, IP addresses, and behavioral signals. We also leverage third-party fraud detection services.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.2 Consequences</h3>
            <p>
              Manipulation of reviews will result in immediate and severe consequences, including removal of all fraudulent reviews, permanent ban from the Platform, forfeiture of pending payments, and referral to law enforcement where applicable. We publish transparency reports on review integrity enforcement quarterly.
            </p>
          </div>
        </motion.section>

        {/* 5. Safety Guidelines */}
        <motion.section
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="safety"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              5. Safety Guidelines
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">5.1 Personal Safety</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Meet in public, well-lit locations for in-person transactions when possible</li>
              <li>Share your trip or meeting details with a trusted contact using the Platform&apos;s safety features</li>
              <li>Trust your instincts — if something feels unsafe, leave and report the situation</li>
              <li>Verify the identity of vendors and drivers before engaging in transactions</li>
              <li>Do not share financial information (bank details, PINs, passwords) outside of the Platform&apos;s secure payment system</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.2 Ride &amp; Delivery Safety</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Always verify the driver&apos;s identity, vehicle make, model, and license plate before entering a vehicle</li>
              <li>Wear seatbelts at all times where required by law</li>
              <li>Use the in-app emergency button if you feel unsafe during a ride</li>
              <li>Do not request rides while under the influence of alcohol or drugs</li>
              <li>Report any safety concerns immediately through the Platform</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.3 Food Safety</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Check food packaging upon delivery for signs of tampering or damage</li>
              <li>Report any food safety concerns (allergens, contamination) immediately</li>
              <li>Food vendors must comply with all applicable food safety and hygiene regulations</li>
              <li>Accurately list all allergens and ingredients in food listings</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.4 Prohibited Items</h3>
            <p>
              Do not use the Platform to request transportation or delivery of weapons, drugs, hazardous materials, or any illegal substances. Drivers have the right — and obligation — to refuse transport of prohibited items.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.5 Emergency Contacts</h3>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                If you are in immediate danger, contact your local emergency services (police, ambulance) before contacting AfriBook support. Our in-app emergency feature connects you directly to local emergency services in supported countries.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 6. Reporting Violations */}
        <motion.section
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="reporting"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Flag className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              6. Reporting Violations
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We encourage all users to report violations of these Community Guidelines. You can report issues through:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">In-App Reporting:</strong> Use the &quot;Report&quot; button on any listing, review, profile, or conversation to submit a report with the relevant category and details</li>
              <li><strong className="text-text-primary">Support Center:</strong> Visit our Help Center and submit a safety or policy violation report</li>
              <li><strong className="text-text-primary">Email:</strong> Send a detailed report to{' '}
                <a href="mailto:safety@afribook.app" className="text-amber-600 hover:text-amber-700">
                  safety@afribook.app
                </a>
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.1 What to Include</h3>
            <p>When reporting a violation, please include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A clear description of the violation</li>
              <li>The username or listing URL of the reported user/listing</li>
              <li>Screenshots, photos, or other evidence where applicable</li>
              <li>Dates and times of the incident</li>
              <li>Any previous communication with the reported user</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.2 Confidentiality</h3>
            <p>
              We treat all reports confidentially. The identity of the reporter is not shared with the reported user. We may contact you for additional information during our investigation but will never disclose your identity without your explicit consent, except where required by law.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.3 Our Response</h3>
            <p>
              We aim to acknowledge all reports within 24 hours and complete initial investigations within 48 hours for safety-related reports. Complex investigations may take longer. We will notify you of the outcome of your report, except where doing so would compromise an investigation or where prohibited by law.
            </p>
          </div>
        </motion.section>

        {/* 7. Enforcement Actions */}
        <motion.section
          custom={6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="enforcement"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              7. Enforcement Actions
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Violations of these Community Guidelines may result in a range of enforcement actions, depending on the severity and frequency of the violation:
            </p>

            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-semibold text-text-primary">Warning</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  For minor or first-time violations, you may receive a warning notification explaining the violation and requesting corrective action. This is recorded on your account.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-text-primary">Content Removal</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Violating content (listings, reviews, messages, or profile information) will be removed. Repeated removal of content may escalate to further action.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-text-primary">Feature Restriction</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Access to specific features may be temporarily restricted, such as the ability to leave reviews, send messages, or create new listings.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-text-primary">Account Suspension</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Your account may be temporarily suspended for a specified period. During suspension, you cannot access the Platform. Active orders must still be fulfilled.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="w-4 h-4 text-red-700" />
                  <h3 className="font-semibold text-text-primary">Permanent Ban</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  For severe violations (fraud, safety threats, illegal activity) or repeated violations, your account may be permanently banned. Banned users may not create new accounts. Pending payments may be forfeited, and legal action may be pursued.
                </p>
              </div>
            </div>

            <p className="mt-4">
              AfriBook considers factors such as severity, intent, history of violations, and impact on other users when determining the appropriate enforcement action. We reserve the right to escalate enforcement for repeat offenders and to take immediate permanent action for the most serious violations.
            </p>
          </div>
        </motion.section>

        {/* 8. Appeals */}
        <motion.section
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="appeals"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              8. Appeals Process
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              If you believe an enforcement action was taken in error, you have the right to appeal. Our appeals process is designed to be fair, transparent, and timely.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.1 How to Appeal</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit an appeal within 30 days of the enforcement action through your account dashboard or by emailing{' '}
                <a href="mailto:appeals@afribook.app" className="text-amber-600 hover:text-amber-700">
                  appeals@afribook.app
                </a>
              </li>
              <li>Clearly explain why you believe the action was unwarranted or disproportionate</li>
              <li>Provide any supporting evidence or context that was not considered in the original decision</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.2 Appeals Review</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All appeals are reviewed by a member of our Trust &amp; Safety team who was not involved in the original decision</li>
              <li>We aim to resolve appeals within 7 business days</li>
              <li>You will receive a written decision explaining the outcome and reasoning</li>
              <li>For permanent bans, one appeal is permitted. For suspensions, one appeal per suspension period</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.3 Possible Outcomes</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Action Upheld:</strong> The original enforcement action stands</li>
              <li><strong className="text-text-primary">Action Modified:</strong> The enforcement action is reduced (e.g., suspension shortened, features restored)</li>
              <li><strong className="text-text-primary">Action Reversed:</strong> The enforcement action is fully overturned, and your account is restored to its previous state</li>
            </ul>
          </div>
        </motion.section>

        {/* 9. Contact */}
        <motion.section
          custom={8}
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
              9. Contact Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              For questions about these Community Guidelines, to report violations, or to submit an appeal, please contact us:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-text-primary">AfriBook Technologies Limited</p>
                <p className="text-sm text-text-secondary">Trust &amp; Safety Team</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Safety Reports:</p>
                  <a href="mailto:safety@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    safety@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Appeals:</p>
                  <a href="mailto:appeals@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    appeals@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">General Inquiries:</p>
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
            href="/legal/vendor"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Vendor Agreement
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
