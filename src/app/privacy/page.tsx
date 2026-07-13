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
  Download,
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
  { id: 'how-used', label: '3. How We Use Information' },
  { id: 'legal-bases', label: '4. Legal Bases for Processing' },
  { id: 'sharing', label: '5. Sharing & Disclosure' },
  { id: 'cookies', label: '6. Cookies & Tracking Technologies' },
  { id: 'security', label: '7. Data Security' },
  { id: 'retention', label: '8. Data Retention' },
  { id: 'rights', label: '9. Your Rights' },
  { id: 'transfers', label: '10. International Data Transfers' },
  { id: 'children', label: '11. Children\'s Privacy' },
  { id: 'third-party', label: '12. Third-Party Links' },
  { id: 'changes', label: '13. Changes to This Policy' },
  { id: 'contact', label: '14. Contact Us' },
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
              AfriBook Technologies Limited (&quot;AfriBook,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) is committed to protecting the privacy and security of your personal
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our platform, including our website (afribook.app), mobile
              applications, APIs, and all related services (collectively, the &quot;Platform&quot;).
            </p>
            <p>
              We operate across 16+ African countries and international markets including the United
              States, the United Kingdom, and the European Union. We comply with applicable data
              protection laws in every jurisdiction where we operate, including the Nigeria Data
              Protection Act (NDPA) 2023, the Kenya Data Protection Act 2019, the South Africa
              Protection of Personal Information Act (POPIA) 2013, the EU General Data Protection
              Regulation (GDPR), the UK GDPR, and applicable US state privacy laws (including the
              California Consumer Privacy Act / CPRA, the Virginia Consumer Data Protection Act, and
              the Colorado Privacy Act).
            </p>
            <p>
              By using the Platform, you consent to the collection and use of information as described
              in this Privacy Policy. If you do not agree with the practices described herein, please
              do not use the Platform. You may withdraw your consent at any time by contacting our
              Data Protection Officer or adjusting your preferences in your account settings.
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
            <p>Information you provide directly when creating an account, completing your profile, or using the Platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full name, email address, phone number</li>
              <li>Profile photo and biography (optional)</li>
              <li>Delivery addresses, home address, work address</li>
              <li>Date of birth (for age verification where required)</li>
              <li>Government-issued identification (passport, national ID, driver&apos;s license — for Vendor and Driver KYC verification)</li>
              <li>Business registration documents, tax identification numbers (for Vendors)</li>
              <li>Vehicle information, driver&apos;s license, insurance documents (for Drivers)</li>
              <li>Biometric data (selfie photos for identity verification, processed via third-party KYC providers)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.2 Payment Information</h3>
            <p>When you make or receive payments through the Platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Credit/debit card numbers (tokenized by our PCI-DSS compliant payment processors — never stored on our servers)</li>
              <li>Bank account details (for Vendor and Driver payouts)</li>
              <li>Mobile money account information (M-Pesa, Airtel Money, MTN Mobile Money)</li>
              <li>Transaction history, purchase records, and payment amounts</li>
              <li>Billing addresses and payment method preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.3 Location Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>GPS location when you request rides, deliveries, or use location-based services (real-time, with your explicit consent)</li>
              <li>Saved locations (home, work, frequently visited places)</li>
              <li>Approximate location derived from IP address (for content personalization)</li>
              <li>Location history for rides and deliveries (retained for 90 days, then anonymized)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.4 Device &amp; Technical Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device type, model, operating system version, and unique device identifiers</li>
              <li>Browser type and version (for web users)</li>
              <li>IP address and network information (carrier, connection type)</li>
              <li>Mobile carrier and network type</li>
              <li>Language preferences and time zone settings</li>
              <li>Screen resolution and device capabilities</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.5 Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pages viewed, features used, search queries, and navigation paths</li>
              <li>Interactions with listings, reviews, messages, and notifications</li>
              <li>Session duration, frequency of use, and engagement patterns</li>
              <li>Referral sources and how you arrived at the Platform</li>
              <li>Error logs, crash reports, and performance data</li>
              <li>Communication metadata (delivery status, open rates for emails)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">2.6 Content You Submit</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reviews, ratings, and written feedback</li>
              <li>Product images and listing descriptions (for Vendors)</li>
              <li>Messages sent through the Platform&apos;s messaging system</li>
              <li>Support tickets and communications with our team</li>
              <li>Photos submitted for identity verification</li>
            </ul>
          </div>
        </motion.section>

        {/* 3. How We Use Information */}
        <motion.section
          custom={2}
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
              3. How We Use Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Service Provision:</strong> To operate, maintain, and improve the Platform and deliver the services you request — including processing transactions, facilitating bookings, coordinating rides and deliveries, and managing your account</li>
              <li><strong className="text-text-primary">Transaction Processing:</strong> To facilitate payments, process refunds, manage payouts to Vendors and Drivers, and maintain accurate financial records</li>
              <li><strong className="text-text-primary">Communication:</strong> To send transaction updates, booking confirmations, ride status notifications, delivery tracking information, receipts, and customer support responses</li>
              <li><strong className="text-text-primary">Marketing &amp; Promotions:</strong> To send promotional communications, personalized offers, and marketing messages (with your consent where required by law). You may opt out at any time through your account settings or by clicking &quot;unsubscribe&quot; in any marketing email</li>
              <li><strong className="text-text-primary">Personalization:</strong> To customize your experience, provide relevant recommendations, remember your preferences, and display content tailored to your interests and location</li>
              <li><strong className="text-text-primary">Analytics &amp; Improvement:</strong> To analyze usage patterns, measure platform performance, conduct A/B testing, and improve our services, features, and user experience</li>
              <li><strong className="text-text-primary">Fraud Prevention &amp; Security:</strong> To detect, prevent, and address fraud, unauthorized access, security breaches, and other potentially harmful activities. This includes using automated systems to analyze transaction patterns and flag anomalies</li>
              <li><strong className="text-text-primary">Legal Compliance:</strong> To comply with applicable laws, regulations, legal processes, tax requirements, and government requests in the jurisdictions where we operate</li>
              <li><strong className="text-text-primary">Dispute Resolution:</strong> To investigate and resolve disputes between Users, enforce our Terms of Service, and protect the rights and safety of AfriBook, our Users, and the public</li>
              <li><strong className="text-text-primary">Research:</strong> To conduct aggregated, anonymized research and analysis to understand our user base and improve the Platform</li>
            </ul>
          </div>
        </motion.section>

        {/* 4. Legal Bases for Processing */}
        <motion.section
          custom={3}
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
              4. Legal Bases for Processing
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Where applicable data protection laws require a legal basis for processing personal
              data, we rely on the following:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Contract Performance (Article 6(1)(b) GDPR):</strong> Processing necessary to fulfill our contractual obligations to you — including processing payments, facilitating deliveries, coordinating rides, and providing customer support</li>
              <li><strong className="text-text-primary">Legitimate Interests (Article 6(1)(f) GDPR):</strong> Processing necessary for our legitimate business interests, such as improving the Platform, preventing fraud, ensuring network security, conducting analytics, and marketing our services — where such interests are not overridden by your fundamental rights and freedoms</li>
              <li><strong className="text-text-primary">Consent (Article 6(1)(a) GDPR):</strong> Where you have given explicit, informed, and unambiguous consent for specific processing activities — including marketing communications, location tracking beyond what is necessary for service delivery, and the use of non-essential cookies. You may withdraw consent at any time without affecting the lawfulness of prior processing</li>
              <li><strong className="text-text-primary">Legal Obligation (Article 6(1)(c) GDPR):</strong> Processing necessary to comply with applicable legal obligations — including tax record-keeping, KYC/AML requirements, responding to lawful government requests, and regulatory reporting</li>
            </ul>
            <p>
              You may withdraw your consent at any time where processing is based on consent, by
              contacting our Data Protection Officer at{' '}
              <a href="mailto:dpo@afribook.app" className="text-amber-600 hover:text-amber-700">
                dpo@afribook.app
              </a>{' '}
              or adjusting your preferences in your account settings. Withdrawal of consent does not
              affect the lawfulness of processing that occurred prior to withdrawal.
            </p>
          </div>
        </motion.section>

        {/* 5. Sharing & Disclosure */}
        <motion.section
          custom={4}
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
              5. Sharing &amp; Disclosure
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>We may share your information with the following categories of recipients:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-text-primary">Vendors, Drivers &amp; Service Providers:</strong> We share information necessary to fulfill your orders, bookings, rides, or deliveries. For example: your name, phone number, and delivery address with the assigned Driver; your booking details with the Vendor; or your restaurant order with the food vendor. Vendors and Drivers are contractually required to use your information only for the specific transaction and not for other purposes.
              </li>
              <li>
                <strong className="text-text-primary">Payment Processors:</strong> Transaction details are shared with our payment processing partners (Stripe, Paystack, Flutterwave, M-Pesa/Daraja, Razorpay) to facilitate payments. Each processor operates under its own privacy policy and PCI-DSS compliance framework.
              </li>
              <li>
                <strong className="text-text-primary">Service Providers:</strong> We engage third-party vendors who assist with cloud hosting (infrastructure providers), analytics (PostHog, Google Analytics), customer support tools, email delivery, fraud detection, identity verification, and marketing. These providers are contractually bound to protect your data and may only process it on our behalf.
              </li>
              <li>
                <strong className="text-text-primary">Law Enforcement &amp; Government Authorities:</strong> When required by law, court order, subpoena, or governmental request, or when we believe disclosure is necessary to protect the rights, property, or safety of AfriBook, our Users, or the public.
              </li>
              <li>
                <strong className="text-text-primary">Business Transfers:</strong> In connection with a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your personal data may be transferred as part of the transaction. We will provide appropriate notice to affected Users before your data is transferred and becomes subject to a different privacy policy.
              </li>
              <li>
                <strong className="text-text-primary">With Your Consent:</strong> When you direct us to share your information with specific third parties, or when you authorize sharing through the Platform.
              </li>
            </ul>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                We do not sell your personal information to third parties for their direct marketing
                purposes. We do not share your personal information with third parties for their own
                marketing purposes without your explicit opt-in consent.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 6. Cookies & Tracking Technologies */}
        <motion.section
          custom={5}
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
              6. Cookies &amp; Tracking Technologies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We use cookies, web beacons, pixel tags, local storage, and similar tracking
              technologies to enhance your experience on the Platform. Our cookies fall into the
              following categories:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Essential Cookies:</strong> Required for the Platform to function — including session management, authentication, security (CSRF protection), and shopping cart preservation. These cannot be disabled.</li>
              <li><strong className="text-text-primary">Functional Cookies:</strong> Remember your preferences such as country, language, theme, and location settings to provide a personalized experience.</li>
              <li><strong className="text-text-primary">Analytics Cookies:</strong> Help us understand how Users interact with the Platform by collecting anonymous usage data (Google Analytics, PostHog).</li>
              <li><strong className="text-text-primary">Marketing Cookies:</strong> Used to track visitors and display relevant advertisements, measure campaign effectiveness, and build interest profiles (Meta/Facebook Pixel).</li>
            </ul>
            <p>
              For comprehensive details about the specific cookies we use, their durations, and how to
              manage your preferences, please refer to our dedicated{' '}
              <Link href="/cookies" className="text-amber-600 hover:text-amber-700">
                Cookie Policy
              </Link>.
            </p>
          </div>
        </motion.section>

        {/* 7. Data Security */}
        <motion.section
          custom={6}
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
              7. Data Security
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We implement robust technical and organizational measures designed to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. Our security measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Transport Layer Security (TLS 1.3) for all data in transit</li>
              <li>Advanced Encryption Standard (AES-256) for data at rest</li>
              <li>PCI-DSS Level 1 compliant payment processing through certified partners (Stripe, Paystack, Flutterwave)</li>
              <li>Regular security audits, vulnerability assessments, and penetration testing by independent firms</li>
              <li>Multi-factor authentication (MFA) for administrative access to sensitive systems</li>
              <li>Automated fraud detection, anomaly monitoring, and real-time threat intelligence</li>
              <li>Role-based access controls ensuring employees access only the data necessary for their role</li>
              <li>Regular employee training on data protection, security practices, and incident response</li>
              <li>Documented incident response procedures and breach notification protocols</li>
              <li>Data Processing Agreements (DPAs) with all third-party processors</li>
            </ul>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                Important: While we implement industry-leading security measures, no method of
                transmission over the Internet or method of electronic storage is 100% secure. We
                cannot guarantee absolute security. We encourage you to use strong, unique passwords,
                enable two-factor authentication, and promptly report any suspicious activity to{' '}
                <a href="mailto:security@afribook.app" className="text-amber-600 hover:text-amber-700">
                  security@afribook.app
                </a>.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 8. Data Retention */}
        <motion.section
          custom={7}
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
              8. Data Retention
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We retain your personal information for as long as your account is active or as needed
              to provide you with services. Specific retention periods include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Account Data:</strong> Retained for the lifetime of your account and for 7 years after account closure, as required by tax, financial, and anti-money laundering regulations in applicable jurisdictions</li>
              <li><strong className="text-text-primary">Transaction Records:</strong> Retained for 7 years from the date of the transaction to comply with tax and financial record-keeping requirements</li>
              <li><strong className="text-text-primary">Location Data:</strong> Ride and delivery GPS location data is retained for 90 days in identifiable form, then anonymized and retained for an additional period for analytics</li>
              <li><strong className="text-text-primary">Support Tickets:</strong> Retained for 3 years after resolution for quality assurance and dispute resolution purposes</li>
              <li><strong className="text-text-primary">Marketing Preferences:</strong> Retained until you unsubscribe or delete your account</li>
              <li><strong className="text-text-primary">KYC Documents:</strong> Retained for 5 years after account closure as required by anti-money laundering regulations</li>
              <li><strong className="text-text-primary">Cookie Data:</strong> Varies by cookie type — see our{' '}
                <Link href="/cookies" className="text-amber-600 hover:text-amber-700">Cookie Policy</Link>
              </li>
            </ul>
            <p>
              When data is no longer needed for the purposes described in this policy, it is securely
              deleted or anonymized so that it can no longer be associated with you. Anonymized data
              may be retained indefinitely for analytical purposes.
            </p>
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
            <p>
              Subject to applicable law, you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Right of Access:</strong> Request a copy of the personal data we hold about you, provided in a structured, commonly used, machine-readable format</li>
              <li><strong className="text-text-primary">Right to Rectification:</strong> Request correction of inaccurate, incomplete, or outdated personal data</li>
              <li><strong className="text-text-primary">Right to Deletion (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data, subject to our legal retention obligations and legitimate business needs</li>
              <li><strong className="text-text-primary">Right to Data Portability:</strong> Receive your personal data in a structured, commonly used, machine-readable format, and have it transmitted to another controller where technically feasible</li>
              <li><strong className="text-text-primary">Right to Restriction of Processing:</strong> Request restriction of processing in certain circumstances (e.g., while accuracy is contested, or where processing is unlawful)</li>
              <li><strong className="text-text-primary">Right to Object:</strong> Object to processing based on legitimate interests, including profiling, and to processing for direct marketing purposes (which we will honor without exception)</li>
              <li><strong className="text-text-primary">Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent, without affecting the lawfulness of prior processing</li>
              <li><strong className="text-text-primary">Right to Opt-Out of Sale/Sharing:</strong> Under applicable US state privacy laws (CCPA/CPRA, VCDPA, CPA), you have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of personal information for cross-context behavioral advertising</li>
              <li><strong className="text-text-primary">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your privacy rights</li>
            </ul>
            <p>
              To exercise any of these rights, please contact our Data Protection Officer at{' '}
              <a href="mailto:dpo@afribook.app" className="text-amber-600 hover:text-amber-700">
                dpo@afribook.app
              </a>{' '}
              or submit a request through your account settings. We will respond to your request
              within 30 days, or within the timeframe required by applicable law (e.g., 45 days
              under CCPA, 30 days under GDPR, 1 month under POPIA). We may need to verify your
              identity before processing your request.
            </p>
            <p>
              You also have the right to lodge a complaint with your local data protection supervisory
              authority if you believe your rights have been violated. Relevant authorities include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Nigeria:</strong> Nigeria Data Protection Commission (NDPC)</li>
              <li><strong className="text-text-primary">Kenya:</strong> Office of the Data Protection Commissioner (ODPC)</li>
              <li><strong className="text-text-primary">South Africa:</strong> Information Regulator</li>
              <li><strong className="text-text-primary">EU/EEA:</strong> Your local Data Protection Authority</li>
              <li><strong className="text-text-primary">United Kingdom:</strong> Information Commissioner&apos;s Office (ICO)</li>
              <li><strong className="text-text-primary">United States:</strong> California Privacy Protection Agency (CPPA) or your state attorney general</li>
            </ul>
          </div>
        </motion.section>

        {/* 10. International Data Transfers */}
        <motion.section
          custom={9}
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
              10. International Data Transfers
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Given our operations across 16+ African countries and international markets, your
              personal data may be transferred to, stored in, and processed in countries other than
              your country of residence. These countries may have data protection laws that differ
              from the laws of your jurisdiction.
            </p>
            <p>
              When we transfer data internationally, we ensure appropriate safeguards are in place,
              including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission for transfers outside the EEA</li>
              <li>UK International Data Transfer Agreement (IDTA) or UK Addendum to SCCs for transfers outside the UK</li>
              <li>Compliance with cross-border transfer requirements under the Nigeria NDPA, Kenya DPA, and South Africa POPIA</li>
              <li>Data Processing Agreements (DPAs) with all third-party processors, regardless of location</li>
              <li>Encryption and pseudonymization of personal data during transit</li>
              <li>Access controls limiting which personnel in which countries can access your data</li>
            </ul>
            <p>
              Our primary data infrastructure is hosted in secure data centers located in Nigeria,
              South Africa, and Europe (AWS / Azure regions). Payment processing may involve data
              transfers to the United States and other countries where our payment partners operate.
              We ensure that all such transfers comply with applicable legal frameworks.
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
              The Platform is not intended for children under the age of 13 (or the applicable age of
              digital consent in your jurisdiction). We do not knowingly collect personal information
              from children under 13. If we become aware that we have inadvertently collected personal
              information from a child under the applicable age of consent, we will take immediate
              steps to delete such information from our systems.
            </p>
            <p>
              Users between the ages of 13 (or the applicable minimum age) and 18 may only use the
              Platform with the involvement, supervision, and consent of a parent or legal guardian
              who agrees to be bound by these Terms and this Privacy Policy on the minor&apos;s behalf.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal
              information without your consent, please contact us immediately at{' '}
              <a href="mailto:privacy@afribook.app" className="text-amber-600 hover:text-amber-700">
                privacy@afribook.app
              </a>{' '}
              and we will promptly investigate and delete the information.
            </p>
          </div>
        </motion.section>

        {/* 12. Third-Party Links */}
        <motion.section
          custom={11}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="third-party"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              12. Third-Party Links
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              The Platform may contain links to third-party websites, applications, or services that
              are not owned or controlled by AfriBook. This Privacy Policy does not apply to those
              third-party services. We are not responsible for the privacy practices, content, or
              policies of any third-party websites or services.
            </p>
            <p>
              We encourage you to review the privacy policies of every website and application you
              visit or use. The inclusion of any link does not imply endorsement or approval by
              AfriBook. When you interact with third-party services, your data is governed by their
              privacy policies, not ours.
            </p>
          </div>
        </motion.section>

        {/* 13. Changes to This Policy */}
        <motion.section
          custom={12}
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
              13. Changes to This Policy
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, legal requirements, or other factors. When we make material changes, we will
              notify you by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Posting the updated policy on the Platform with a revised &quot;Last Updated&quot; date</li>
              <li>Sending an email notification to the address associated with your account at least 30 days before material changes take effect</li>
              <li>Displaying a prominent notice on the Platform</li>
              <li>Where required by law, obtaining your renewed consent before applying material changes</li>
            </ul>
            <p>
              We encourage you to review this Privacy Policy periodically. The &quot;Last Updated&quot;
              date at the top of this page indicates when this policy was last revised. Your
              continued use of the Platform after changes take effect constitutes acceptance of the
              updated policy, unless renewed consent is required by applicable law.
            </p>
          </div>
        </motion.section>

        {/* 14. Contact Us */}
        <motion.section
          custom={13}
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
              14. Contact Us
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              For any questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please contact our Data Protection Officer:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Data Protection Officer</p>
                <p className="text-sm text-text-secondary">AfriBook Technologies Limited</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">DPO / Privacy Inquiries:</p>
                  <a href="mailto:dpo@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    dpo@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Download className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Data Subject Requests:</p>
                  <a href="mailto:privacy@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    privacy@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Security Reports:</p>
                  <a href="mailto:security@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    security@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Registered Office:</p>
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
            href="/terms"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Terms of Service
          </Link>
          <Link
            href="/cookies"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Cookie Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
