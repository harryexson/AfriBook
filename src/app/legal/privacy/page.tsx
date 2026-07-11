'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield,
  Eye,
  Lock,
  Database,
  Share2,
  Clock,
  UserCheck,
  Globe,
  Mail,
  FileText,
  AlertTriangle,
  MapPin,
  Cookie,
  Scale,
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
  { id: 'intro', label: '1. Introduction' },
  { id: 'info-collected', label: '2. Information We Collect' },
  { id: 'how-collected', label: '3. How We Collect Information' },
  { id: 'how-used', label: '4. How We Use Information' },
  { id: 'legal-bases', label: '5. Legal Bases for Processing' },
  { id: 'sharing', label: '6. Information Sharing' },
  { id: 'retention', label: '7. Data Retention' },
  { id: 'security', label: '8. Data Security' },
  { id: 'rights', label: '9. Your Rights' },
  { id: 'cookies', label: '10. Cookies & Tracking' },
  { id: 'children', label: '11. Children\'s Privacy' },
  { id: 'transfers', label: '12. International Data Transfers' },
  { id: 'ndpr', label: '13. Nigeria Data Protection (NDPR)' },
  { id: 'kenya', label: '14. Kenya Data Protection Act' },
  { id: 'popia', label: '15. South Africa POPIA' },
  { id: 'changes', label: '16. Changes to This Policy' },
  { id: 'contact', label: '17. Contact Information' },
]

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              Privacy Policy
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
        {/* 1. Introduction */}
        <motion.section
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="intro"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              1. Introduction
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              AfriBook Technologies Limited (&quot;AfriBook,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform, including our website, mobile applications, and related services.
            </p>
            <p>
              We operate across 16+ African countries and comply with applicable data protection laws in each jurisdiction where we operate, including the Nigeria Data Protection Regulation (NDPR), the Kenya Data Protection Act (2019), and the South Africa Protection of Personal Information Act (POPIA).
            </p>
            <p>
              By using the Platform, you consent to the collection and use of information as described in this Privacy Policy. If you do not agree with the practices described herein, please do not use the Platform.
            </p>
          </div>
        </motion.section>

        {/* 2. Information We Collect */}
        <motion.section
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="info-collected"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. Information We Collect
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">2.1 Personal Information</h3>
            <p>Information you provide directly when creating an account or using the Platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full name, email address, phone number</li>
              <li>Profile photo and biography (optional)</li>
              <li>Delivery and home addresses</li>
              <li>Date of birth (for age verification)</li>
              <li>Government-issued identification (for vendor/driver verification)</li>
              <li>Business registration documents (for vendors)</li>
              <li>Vehicle information and driver&apos;s license (for drivers)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.2 Payment Information</h3>
            <p>When you make transactions on the Platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Credit/debit card numbers (tokenized, never stored on our servers)</li>
              <li>Bank account details (for vendor payouts)</li>
              <li>Mobile money account information</li>
              <li>Transaction history and purchase records</li>
              <li>Billing addresses</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.3 Location Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>GPS location when you request rides or deliveries (real-time)</li>
              <li>Saved locations (home, work, frequently visited places)</li>
              <li>Approximate location based on IP address</li>
              <li>Location history for rides and deliveries</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.4 Device &amp; Technical Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device type, model, and operating system</li>
              <li>Browser type and version</li>
              <li>IP address and network information</li>
              <li>Unique device identifiers</li>
              <li>Mobile carrier and network type</li>
              <li>Language preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.5 Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pages viewed, features used, and search queries</li>
              <li>Interaction with listings, reviews, and messages</li>
              <li>Session duration and frequency</li>
              <li>Referral sources and navigation paths</li>
              <li>Error logs and performance data</li>
            </ul>
          </div>
        </motion.section>

        {/* 3. How We Collect */}
        <motion.section
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="how-collected"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              3. How We Collect Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">3.1 Directly From You</h3>
            <p>
              When you register for an account, fill out your profile, make a purchase, book a service, write a review, contact support, or otherwise provide information to us through the Platform.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.2 Automatically</h3>
            <p>
              Through cookies, web beacons, log files, and similar technologies when you interact with our Platform. This includes usage data, device information, and location data. For more details, see our <Link href="/legal/cookies" className="text-amber-600 hover:text-amber-700">Cookie Policy</Link>.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.3 From Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Payment Processors:</strong> Transaction confirmations and fraud signals from Stripe, Paystack, Flutterwave, and M-Pesa</li>
              <li><strong className="text-text-primary">Identity Verification:</strong> KYC verification results from third-party identity verification providers</li>
              <li><strong className="text-text-primary">Social Login:</strong> Profile information if you register via Google or other social login providers</li>
              <li><strong className="text-text-primary">Analytics:</strong> Aggregated usage data from analytics providers</li>
              <li><strong className="text-text-primary">Marketing Partners:</strong> Campaign performance data from advertising partners</li>
            </ul>
          </div>
        </motion.section>

        {/* 4. How We Use */}
        <motion.section
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="how-used"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              4. How We Use Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Service Provision:</strong> To operate, maintain, and improve the Platform and its features</li>
              <li><strong className="text-text-primary">Transaction Processing:</strong> To facilitate payments, bookings, rides, and deliveries</li>
              <li><strong className="text-text-primary">Communication:</strong> To send transaction updates, confirmations, receipts, and customer support responses</li>
              <li><strong className="text-text-primary">Marketing:</strong> To send promotional communications (with your consent where required by law)</li>
              <li><strong className="text-text-primary">Personalization:</strong> To customize your experience, recommendations, and content</li>
              <li><strong className="text-text-primary">Analytics:</strong> To analyze usage patterns, measure performance, and improve our services</li>
              <li><strong className="text-text-primary">Fraud Prevention:</strong> To detect, prevent, and address fraud, security breaches, and technical issues</li>
              <li><strong className="text-text-primary">Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
              <li><strong className="text-text-primary">Dispute Resolution:</strong> To resolve disputes between users and enforce our Terms</li>
              <li><strong className="text-text-primary">Research:</strong> To conduct aggregated, anonymized research to improve the Platform</li>
            </ul>
          </div>
        </motion.section>

        {/* 5. Legal Bases */}
        <motion.section
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="legal-bases"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              5. Legal Bases for Processing
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Where applicable data protection laws require a legal basis for processing personal data, we rely on the following:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Contract Performance:</strong> Processing necessary to fulfill our contractual obligations to you (e.g., processing payments, facilitating deliveries)</li>
              <li><strong className="text-text-primary">Legitimate Interests:</strong> Processing necessary for our legitimate business interests, such as improving the Platform, preventing fraud, and ensuring security, where such interests are not overridden by your fundamental rights</li>
              <li><strong className="text-text-primary">Consent:</strong> Where you have given explicit consent for specific processing activities (e.g., marketing communications, location tracking beyond what is necessary for service)</li>
              <li><strong className="text-text-primary">Legal Obligation:</strong> Processing necessary to comply with applicable legal obligations (e.g., tax records, KYC requirements, law enforcement requests)</li>
            </ul>
            <p>
              You may withdraw your consent at any time where processing is based on consent, without affecting the lawfulness of processing that occurred prior to withdrawal.
            </p>
          </div>
        </motion.section>

        {/* 6. Sharing */}
        <motion.section
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="sharing"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              6. Information Sharing
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>We may share your information with the following categories of recipients:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Vendors &amp; Service Providers:</strong> We share information necessary to fulfill your orders, bookings, or ride requests (e.g., your name, delivery address, and phone number with the assigned driver or vendor)
              </li>
              <li>
                <strong className="text-text-primary">Payment Processers:</strong> Transaction details are shared with payment processors (Stripe, Paystack, Flutterwave, M-Pesa, Razorpay) to facilitate payments. These processors have their own privacy policies governing the use of your financial information
              </li>
              <li>
                <strong className="text-text-primary">Service Providers:</strong> Third-party vendors who assist with hosting, analytics, customer support, marketing, and other business operations. These providers are contractually obligated to protect your data
              </li>
              <li>
                <strong className="text-text-primary">Law Enforcement:</strong> When required by law, court order, or governmental request, or to protect the rights, property, or safety of AfriBook, our users, or the public
              </li>
              <li>
                <strong className="text-text-primary">Business Transfers:</strong> In connection with a merger, acquisition, bankruptcy, or sale of all or a portion of our assets, with appropriate notice to affected users
              </li>
              <li>
                <strong className="text-text-primary">With Your Consent:</strong> When you direct or authorize us to share your information with third parties
              </li>
            </ul>
            <p>
              We do not sell your personal information to third parties for their direct marketing purposes without your explicit consent.
            </p>
          </div>
        </motion.section>

        {/* 7. Retention */}
        <motion.section
          custom={6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="retention"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              7. Data Retention
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you with services. Specific retention periods include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Account Data:</strong> Retained for the lifetime of your account and for 7 years after account closure (as required by tax and financial regulations)</li>
              <li><strong className="text-text-primary">Transaction Records:</strong> Retained for 7 years from the date of the transaction</li>
              <li><strong className="text-text-primary">Location Data:</strong> Ride and delivery location data retained for 90 days, then anonymized</li>
              <li><strong className="text-text-primary">Support Tickets:</strong> Retained for 3 years after resolution</li>
              <li><strong className="text-text-primary">Marketing Preferences:</strong> Retained until you unsubscribe</li>
              <li><strong className="text-text-primary">Cookies:</strong> Vary by type — see our <Link href="/legal/cookies" className="text-amber-600 hover:text-amber-700">Cookie Policy</Link></li>
            </ul>
            <p>
              When data is no longer needed, it is securely deleted or anonymized so that it can no longer be associated with you.
            </p>
          </div>
        </motion.section>

        {/* 8. Security */}
        <motion.section
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="security"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              8. Data Security
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We implement robust technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>End-to-end encryption for sensitive data in transit (TLS 1.3)</li>
              <li>AES-256 encryption for data at rest</li>
              <li>PCI-DSS compliant payment processing through certified partners</li>
              <li>Regular security audits and penetration testing</li>
              <li>Multi-factor authentication for administrative access</li>
              <li>Automated fraud detection and anomaly monitoring</li>
              <li>Employee training on data protection and security practices</li>
              <li>Incident response procedures and breach notification protocols</li>
            </ul>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                Important: While we implement strong security measures, no method of transmission or storage is 100% secure. We encourage you to use strong passwords, enable two-factor authentication, and promptly report any suspicious activity.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 9. Your Rights */}
        <motion.section
          custom={8}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="rights"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              9. Your Rights
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>Subject to applicable law, you have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-text-primary">Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong className="text-text-primary">Deletion:</strong> Request deletion of your personal data, subject to legal retention requirements</li>
              <li><strong className="text-text-primary">Portability:</strong> Request your data in a structured, commonly used, machine-readable format</li>
              <li><strong className="text-text-primary">Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong className="text-text-primary">Objection:</strong> Object to processing based on legitimate interests, including direct marketing</li>
              <li><strong className="text-text-primary">Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
              <li><strong className="text-text-primary">Opt-Out:</strong> Opt out of marketing communications via the unsubscribe link in emails or your account settings</li>
            </ul>
            <p>
              To exercise any of these rights, please contact our Data Protection Officer at <a href="mailto:dpo@afribook.app" className="text-amber-600 hover:text-amber-700">dpo@afribook.app</a>. We will respond to your request within 30 days, or within the timeframe required by applicable law.
            </p>
            <p>
              You also have the right to lodge a complaint with your local data protection supervisory authority if you believe your rights have been violated.
            </p>
          </div>
        </motion.section>

        {/* 10. Cookies */}
        <motion.section
          custom={9}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="cookies"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              10. Cookies &amp; Tracking
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We use cookies and similar tracking technologies to enhance your experience on the Platform. For comprehensive details about the cookies we use, their purposes, and how to manage them, please refer to our dedicated{' '}
              <Link href="/legal/cookies" className="text-amber-600 hover:text-amber-700">
                Cookie Policy
              </Link>.
            </p>
          </div>
        </motion.section>

        {/* 11. Children's Privacy */}
        <motion.section
          custom={10}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="children"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              11. Children&apos;s Privacy
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              The Platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
            </p>
            <p>
              Users between the ages of 13 and 18 may only use the Platform with the involvement and consent of a parent or legal guardian who agrees to be bound by these Terms and this Privacy Policy.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:privacy@afribook.app" className="text-amber-600 hover:text-amber-700">privacy@afribook.app</a>.
            </p>
          </div>
        </motion.section>

        {/* 12. International Transfers */}
        <motion.section
          custom={11}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="transfers"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              12. International Data Transfers
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Given our operations across multiple African countries, your personal data may be transferred to and processed in countries other than your country of residence. When we transfer data internationally, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Standard Contractual Clauses (SCCs) approved by relevant data protection authorities</li>
              <li>Data processing agreements with all third-party processors</li>
              <li>Compliance with cross-border transfer requirements under applicable data protection laws</li>
              <li>Encryption and pseudonymization during transit</li>
            </ul>
            <p>
              Our primary data infrastructure is hosted in secure data centers within Africa (Nigeria and South Africa) and Europe, with appropriate data transfer mechanisms in place.
            </p>
          </div>
        </motion.section>

        {/* 13. NDPR */}
        <motion.section
          custom={12}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="ndpr"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              13. Nigeria Data Protection Regulation (NDPR)
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              As a company incorporated in Nigeria, AfriBook fully complies with the Nigeria Data Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act (NDPA) 2023. Our specific commitments include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Appointed a Data Protection Officer (DPO) registered with the Nigeria Data Protection Commission (NDPC)</li>
              <li>Conducting regular Data Protection Impact Assessments (DPIAs)</li>
              <li>Maintaining a lawful basis register for all processing activities</li>
              <li>Ensuring all data processors within our ecosystem comply with NDPR requirements</li>
              <li>Filing annual data protection audit reports as required by the NDPC</li>
              <li>Providing data subjects with access, rectification, and erasure rights as stipulated by the NDPA</li>
            </ul>
          </div>
        </motion.section>

        {/* 14. Kenya DPA */}
        <motion.section
          custom={13}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="kenya"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              14. Kenya Data Protection Act
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              For users in Kenya, we comply with the Data Protection Act (2019) and regulations issued by the Office of the Data Protection Commissioner (ODPC). Our commitments to Kenyan users include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Registration with the ODPC as a data controller and data processor</li>
              <li>Lawful basis for all processing of personal data of Kenyan citizens and residents</li>
              <li>Right to data portability, erasure, and objection as provided under the Act</li>
              <li>Data Protection Impact Assessments for high-risk processing activities</li>
              <li>Cross-border transfer safeguards meeting ODPC requirements</li>
              <li>Breach notification to the ODPC within 72 hours of becoming aware of a breach</li>
            </ul>
          </div>
        </motion.section>

        {/* 15. POPIA */}
        <motion.section
          custom={14}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="popia"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              15. South Africa POPIA
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              For users in South Africa, we comply with the Protection of Personal Information Act (POPIA) 4 of 2013. Our commitments to South African users include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Processing personal information lawfully, reasonably, and in a non-excessive manner</li>
              <li>Collecting information only for specific, explicitly defined, and lawful purposes</li>
              <li>Informing data subjects of the purpose of collection before or at the time of collection</li>
              <li>Notifying the Information Regulator and affected data subjects of any security compromises</li>
              <li>Maintaining appropriate technical and organizational measures to secure personal information</li>
              <li>Appointed an Information Officer registered with the Information Regulator</li>
              <li>Honoring data subject rights including access, correction, deletion, and objection to processing</li>
            </ul>
          </div>
        </motion.section>

        {/* 16. Changes */}
        <motion.section
          custom={15}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="changes"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              16. Changes to This Policy
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Posting the updated policy on the Platform with a revised &quot;Last Updated&quot; date</li>
              <li>Sending an email notification to the address associated with your account</li>
              <li>Displaying a prominent notice on the Platform</li>
            </ul>
            <p>
              We encourage you to review this Privacy Policy periodically. Your continued use of the Platform after changes take effect constitutes acceptance of the updated policy.
            </p>
          </div>
        </motion.section>

        {/* 17. Contact */}
        <motion.section
          custom={16}
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
              17. Contact Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              For any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Data Protection Officer</p>
                <p className="text-sm text-text-secondary">AfriBook Technologies Limited</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Email:</p>
                  <a href="mailto:dpo@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    dpo@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">General Privacy Inquiries:</p>
                  <a href="mailto:privacy@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    privacy@afribook.app
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
            href="/legal/terms"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Terms of Service
          </Link>
          <Link
            href="/legal/cookies"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Cookie Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
