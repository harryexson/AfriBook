'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  Shield,
  Scale,
  CreditCard,
  MapPin,
  Users,
  Ban,
  AlertTriangle,
  Globe,
  Mail,
  Clock,
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
  { id: 'service', label: '2. Description of Service' },
  { id: 'accounts', label: '3. User Accounts & Eligibility' },
  { id: 'vendor-terms', label: '4. Vendor Obligations' },
  { id: 'customer-terms', label: '5. Customer Obligations' },
  { id: 'rides-delivery', label: '6. Rides & Delivery Services' },
  { id: 'payment', label: '7. Payment Terms' },
  { id: 'intellectual-property', label: '8. Intellectual Property' },
  { id: 'prohibited', label: '9. Prohibited Conduct' },
  { id: 'disputes', label: '10. Dispute Resolution' },
  { id: 'liability', label: '11. Limitation of Liability' },
  { id: 'indemnification', label: '12. Indemnification' },
  { id: 'modifications', label: '13. Modifications to Terms' },
  { id: 'governing-law', label: '14. Governing Law' },
  { id: 'waiver', label: '15. Waiver of Liability, Hold Harmless & Force Majeure' },
  { id: 'contact', label: '16. Contact Information' },
]

export default function TermsOfServicePage() {
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
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              Terms of Service
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
        {/* 1. Acceptance of Terms */}
        <motion.section
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="acceptance"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              1. Acceptance of Terms
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Welcome to AfriBook. These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and AfriBook Technologies Limited (&quot;AfriBook,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the AfriBook platform, including our website, mobile applications, and all related services (collectively, the &quot;Platform&quot;).
            </p>
            <p>
              By accessing, browsing, or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Platform.
            </p>
            <p>
              We may update these Terms from time to time. Material changes will be communicated via email or prominent notice on the Platform. Your continued use of the Platform after such changes constitutes your acceptance of the revised Terms.
            </p>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                Important: These Terms include provisions that limit our liability and require you to resolve disputes through arbitration rather than in court. Please review these provisions carefully.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 2. Description of Service */}
        <motion.section
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="service"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. Description of Service
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              AfriBook is a multi-service digital marketplace that connects vendors, customers, and independent service providers across 16+ African countries and beyond. Our Platform enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Book Services:</strong> Discover and book local services including beauty, wellness, home maintenance, professional services, events, and more.
              </li>
              <li>
                <strong className="text-text-primary">Order Products:</strong> Purchase physical and digital products from verified vendors and businesses.
              </li>
              <li>
                <strong className="text-text-primary">Request Rides:</strong> Access ride-hailing services through our network of verified drivers.
              </li>
              <li>
                <strong className="text-text-primary">Get Deliveries:</strong> Arrange local and inter-city delivery of goods through our logistics network.
              </li>
              <li>
                <strong className="text-text-primary">Food &amp; Dining:</strong> Order food from restaurants and food vendors for delivery or pickup.
              </li>
            </ul>
            <p>
              AfriBook acts as an intermediary platform connecting users with independent vendors and service providers. We are not a party to transactions between users and vendors, except where explicitly stated. We do not control the quality, safety, or legality of services offered through the Platform.
            </p>
            <p>
              Our services are available in multiple African countries, and we continuously expand to new markets. Service availability may vary by location, and specific features may be subject to local regulations and requirements.
            </p>
          </div>
        </motion.section>

        {/* 3. User Accounts */}
        <motion.section
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="accounts"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              3. User Accounts &amp; Eligibility
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">3.1 Eligibility</h3>
            <p>
              You must be at least 18 years of age to create an account and use the Platform. By creating an account, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into binding agreements.
            </p>
            <p>
              If you are using the Platform on behalf of a business or organization, you represent and warrant that you have the authority to bind that entity to these Terms.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.2 Account Creation</h3>
            <p>
              To use certain features of the Platform, you must create an account by providing accurate, current, and complete information. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide truthful and accurate registration information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.3 Account Types</h3>
            <p>
              The Platform offers different account types with varying levels of access and functionality:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Customer Account:</strong> Browse, book, and purchase services and products.</li>
              <li><strong className="text-text-primary">Vendor Account:</strong> List and sell products and services, manage orders, and receive payments. Requires additional verification.</li>
              <li><strong className="text-text-primary">Driver Account:</strong> Provide ride and delivery services. Requires background check and vehicle verification.</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.4 Account Suspension</h3>
            <p>
              We reserve the right to suspend or terminate your account at our discretion if we reasonably believe you have violated these Terms, engaged in fraudulent activity, or otherwise posed a risk to the Platform or its users. You will be notified of any suspension via email, except where prohibited by law or where such notification would compromise an investigation.
            </p>
          </div>
        </motion.section>

        {/* 4. Vendor Obligations */}
        <motion.section
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="vendor-terms"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              4. Vendor Obligations
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              If you register as a vendor on the Platform, you agree to the following obligations in addition to all other Terms:
            </p>
            <h3 className="text-lg font-semibold text-text-primary font-heading">4.1 Service Quality</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Deliver products and services that accurately match your listings</li>
              <li>Maintain professional standards in all customer interactions</li>
              <li>Respond to customer inquiries and orders in a timely manner</li>
              <li>Resolve customer complaints and issues promptly and fairly</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.2 Listings</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, complete, and current information in all listings</li>
              <li>Include clear descriptions, pricing, and availability</li>
              <li>Use high-quality, original images of actual products or services</li>
              <li>Not misrepresent products, services, or business information</li>
              <li>Update listings promptly when availability or pricing changes</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.3 Pricing &amp; Fees</h3>
            <p>
              Vendors set their own prices. AfriBook charges a commission on each transaction as outlined in the Vendor Agreement. Vendors are responsible for all applicable taxes on their sales. Prices must be inclusive of all mandatory fees except where local law requires otherwise.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.4 Compliance</h3>
            <p>
              Vendors must comply with all applicable local, national, and international laws, including but not limited to consumer protection laws, tax regulations, licensing requirements, and health and safety standards relevant to their products or services.
            </p>
          </div>
        </motion.section>

        {/* 5. Customer Obligations */}
        <motion.section
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="customer-terms"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              5. Customer Obligations
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>As a customer using the Platform, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate delivery and contact information</li>
              <li>Be available to receive deliveries at the scheduled time</li>
              <li>Pay for all orders and services in accordance with the stated terms</li>
              <li>Treat vendors, drivers, and other users with respect and courtesy</li>
              <li>Leave honest and fair reviews based on your actual experience</li>
              <li>Report any issues or disputes through the Platform&apos;s resolution process</li>
              <li>Not engage in fraudulent activity, including false chargebacks or claims</li>
              <li>Comply with any cancellation policies set by vendors</li>
            </ul>
            <p>
              You acknowledge that you enter into transactions with vendors at your own risk. AfriBook facilitates connections but is not responsible for the quality, safety, or legality of products and services offered by vendors.
            </p>
            <p>
              <strong className="text-text-primary">Personal responsibility.</strong> You are personally responsible for your own actions, errors, omissions, and negligence when using the Platform, including your interactions with vendors, drivers, hosts, and other users. To the fullest extent permitted by law, AfriBook is not an insurer, guarantor, or joint provider of the products and services you obtain, and you accept that you use the Platform and its services at your own risk.
            </p>
            <p>
              <strong className="text-text-primary">Your due diligence.</strong> You are responsible for conducting your own due diligence before purchasing products or services, including verifying the identity, licences, credentials, insurance, and reputation of the vendor, driver, or host you deal with. You should take reasonable precautions for your own safety, including confirming a driver&apos;s identity and vehicle details before boarding, and reviewing listing, house rules and cancellation terms before booking.
            </p>
            <p>
              <strong className="text-text-primary">Compliance with local law.</strong> You agree to comply with all applicable laws and regulations of your jurisdiction when using the Platform, including but not limited to consumer protection, tax, traffic, seat-belt and child-seat, and age-restriction laws. Any use of the Platform for conduct that violates local law is your sole responsibility.
            </p>
          </div>
        </motion.section>

        {/* 6. Rides & Delivery */}
        <motion.section
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="rides-delivery"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              6. Rides &amp; Delivery Services
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">6.1 Ride Services</h3>
            <p>
              AfriBook connects riders with independent drivers. When you request a ride through the Platform, you are entering into a contract directly with the driver. AfriBook facilitates the connection and payment processing but is not a party to the transportation contract.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fare estimates are approximate and may vary based on actual route, traffic, and time</li>
              <li>Drivers reserve the right to refuse service in accordance with applicable law</li>
              <li>You must wear seatbelts where required by law</li>
              <li>Do not request rides for more passengers than the vehicle&apos;s capacity</li>
              <li>Alcohol, drugs, and illegal substances are strictly prohibited in vehicles</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.2 Delivery Services</h3>
            <p>
              Delivery services connect senders with independent drivers for the transportation of goods. AfriBook does not guarantee delivery times and is not responsible for items that are perishable, fragile, or improperly packaged.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must not request delivery of prohibited, illegal, or hazardous items</li>
              <li>Adequate packaging is your responsibility unless the vendor provides packaging</li>
              <li>Estimated delivery times are approximate and not guaranteed</li>
              <li>Track your delivery through the Platform in real-time</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.3 Safety</h3>
            <p>
              Your safety is paramount. We encourage you to share your trip details with trusted contacts, verify driver and vehicle information before entering a vehicle, and report any safety concerns immediately through the Platform or by contacting emergency services.
            </p>
          </div>
        </motion.section>

        {/* 7. Payment Terms */}
        <motion.section
          custom={6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="payment"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              7. Payment Terms
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">7.1 Payment Methods</h3>
            <p>
              AfriBook supports a wide range of payment methods to serve our diverse user base across Africa and beyond, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Stripe:</strong> Credit/debit cards (Visa, Mastercard, American Express)</li>
              <li><strong className="text-text-primary">Paystack:</strong> Bank transfers, cards, USSD (Nigeria, Ghana, South Africa, Kenya)</li>
              <li><strong className="text-text-primary">Flutterwave:</strong> Multi-currency payments across Africa</li>
              <li><strong className="text-text-primary">M-Pesa:</strong> Mobile money payments (Kenya, Tanzania, DRC)</li>
              <li><strong className="text-text-primary">Razorpay:</strong> UPI, net banking, and wallets (India operations)</li>
              <li>AfriBook Wallet (prepaid balance)</li>
              <li>Bank transfers and other locally supported methods</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.2 Transaction Processing</h3>
            <p>
              All payments are processed through our secure, PCI-compliant payment partners. Payment information is encrypted and never stored on our servers. By providing payment information, you authorize us to charge the applicable fees to your selected payment method.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.3 Currencies &amp; Exchange Rates</h3>
            <p>
              Transactions may be processed in local currencies where supported. Where currency conversion is required, exchange rates are determined by our payment partners and may include a conversion fee. AfriBook is not responsible for exchange rate fluctuations between the time of order and settlement.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.4 Refunds</h3>
            <p>
              Refund policies vary by service type and vendor. Customer-initiated cancellations are subject to the cancellation policy applicable at the time of booking. Refunds, when approved, are processed to the original payment method within 5-14 business days depending on the payment provider.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.5 AfriBook Fees</h3>
            <p>
              AfriBook charges service fees for use of the Platform, which may include booking fees, convenience fees, and delivery fees. These fees are displayed before you confirm a transaction and may vary by location, service type, and demand. Fees are non-refundable except where required by applicable law.
            </p>
          </div>
        </motion.section>

        {/* 8. Intellectual Property */}
        <motion.section
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="intellectual-property"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              8. Intellectual Property
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">8.1 AfriBook IP</h3>
            <p>
              The Platform, including its design, code, trademarks, logos, graphics, and content, is the intellectual property of AfriBook and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Platform without our express written permission.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.2 User Content</h3>
            <p>
              You retain ownership of any content you submit to the Platform, including reviews, photos, and messages. However, by submitting content, you grant AfriBook a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, and display such content in connection with the operation of the Platform.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.3 Vendor Content</h3>
            <p>
              Vendors grant AfriBook a license to use their product images, descriptions, and branding for the purpose of operating and promoting the Platform. This license terminates when a vendor closes their account, except for content that has been shared by other users or incorporated into reviews.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.4 DMCA &amp; IP Complaints</h3>
            <p>
              We respect intellectual property rights and respond to valid takedown requests under applicable copyright laws. If you believe your intellectual property has been infringed on the Platform, please contact our designated agent with a detailed notice including identification of the work, the allegedly infringing material, and your contact information.
            </p>
          </div>
        </motion.section>

        {/* 9. Prohibited Conduct */}
        <motion.section
          custom={8}
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
              9. Prohibited Conduct
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>You must not engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using the Platform for any unlawful purpose or in violation of any local, national, or international law</li>
              <li>Creating multiple accounts to circumvent suspensions or manipulate the Platform</li>
              <li>Impersonating another person or entity, or misrepresenting your affiliation</li>
              <li>Collecting, harvesting, or storing personal information of other users without consent</li>
              <li>Interfering with, disrupting, or attempting to gain unauthorized access to the Platform or its servers</li>
              <li>Using automated systems, bots, or scrapers to access or interact with the Platform</li>
              <li>Posting false, misleading, defamatory, or harmful content</li>
              <li>Engaging in price-fixing, collusion, or anti-competitive behavior with other vendors</li>
              <li>Circumventing AfriBook&apos;s commission by conducting transactions outside the Platform with Platform-sourced customers</li>
              <li>Offering or accepting bribes, kickbacks, or corrupt payments</li>
              <li>Discriminating against any user on the basis of race, ethnicity, religion, gender, sexual orientation, disability, or any other protected characteristic</li>
              <li>Listing counterfeit, stolen, or illegal products or services</li>
              <li>Engaging in money laundering, terrorist financing, or other financial crimes through the Platform</li>
              <li>
                Engaging in, soliciting, facilitating, or condoning <strong className="text-text-primary">SHARFT</strong> — sexual harassment, assault, rape, fraud or trafficking, or any other form of sexual exploitation, abuse or financial crime — against any other user, provider, driver, host, or member of the public
              </li>
            </ul>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Ban className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-text-primary leading-relaxed">
                  <strong className="font-semibold">Zero tolerance for SHARFT.</strong> AfriBook has a strict and absolute policy that SHARFT — sexual harassment, assault, exploitation, fraud or trafficking — is completely prohibited on the Platform. Any user found to have engaged in, facilitated, solicited, or failed to report SHARFT or any criminal conduct will be immediately and permanently removed from the Platform without notice, may forfeit outstanding payments, will be reported to law enforcement authorities, and may be personally liable for their own conduct.
                </p>
              </div>
            </div>
            <p>
              Violation of these prohibitions may result in immediate account suspension or termination, forfeiture of pending payments, and referral to law enforcement authorities where applicable.
            </p>
          </div>
        </motion.section>

        {/* 10. Dispute Resolution */}
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
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              10. Dispute Resolution
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">10.1 Informal Resolution</h3>
            <p>
              Before initiating formal proceedings, you agree to first contact us at <a href="mailto:legal@afribook.app" className="text-amber-600 hover:text-amber-700">legal@afribook.app</a> and attempt to resolve the dispute informally for at least 30 days.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.2 Mediation</h3>
            <p>
              If informal resolution fails, either party may initiate mediation under the rules of the Lagos Multi-Door Courthouse (LMDC) or another mutually agreed-upon mediation service. The costs of mediation shall be shared equally unless the mediator determines otherwise.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.3 Arbitration</h3>
            <p>
              Any dispute that cannot be resolved through mediation shall be finally resolved by binding arbitration administered by the Arbitration and Mediation Centre of the Lagos Court of Arbitration in accordance with its rules. The arbitration shall be conducted in English, and the seat of arbitration shall be Lagos, Nigeria.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.4 Class Action Waiver</h3>
            <p>
              You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration against AfriBook.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.5 Platform Disputes</h3>
            <p>
              AfriBook provides a dispute resolution process for transactions conducted through the Platform. Both vendors and customers may open disputes within 14 days of a transaction. AfriBook will review evidence from all parties and make a determination, which may include partial or full refunds. Our dispute determinations are final and binding, subject to applicable law.
            </p>
          </div>
        </motion.section>

        {/* 11. Limitation of Liability */}
        <motion.section
          custom={10}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="liability"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              11. Limitation of Liability
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">No Warranty:</strong> The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </li>
              <li>
                <strong className="text-text-primary">Limitation:</strong> In no event shall AfriBook, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of the Platform.
              </li>
              <li>
                <strong className="text-text-primary">Cap:</strong> AfriBook&apos;s total aggregate liability to you for all claims arising out of or relating to these Terms or your use of the Platform shall not exceed the greater of (a) the total fees you paid to AfriBook in the twelve (12) months preceding the claim, or (b) One Hundred United States Dollars (USD $100).
              </li>
              <li>
                <strong className="text-text-primary">Third-Party Services:</strong> AfriBook is not responsible for the acts, omissions, or content of third-party vendors, drivers, payment processors, or other service providers accessed through the Platform.
              </li>
            </ul>
            <p>
              Some jurisdictions do not allow the exclusion of certain warranties or limitations on liability, so the above limitations may not apply to you. In such cases, our liability shall be limited to the fullest extent permitted by applicable law.
            </p>
          </div>
        </motion.section>

        {/* 12. Indemnification */}
        <motion.section
          custom={11}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="indemnification"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              12. Indemnification
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              You agree to indemnify, defend, and hold harmless AfriBook, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Platform or any services obtained through the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party right, including intellectual property, privacy, or proprietary rights</li>
              <li>Your violation of any applicable law or regulation</li>
              <li>Any content you submit, post, or transmit through the Platform</li>
              <li>Your interactions with other users, vendors, or drivers</li>
            </ul>
            <p>
              AfriBook reserves the right, at your expense, to assume the exclusive defense and control of any matter subject to indemnification by you, and you agree to cooperate with our defense of such claims.
            </p>
          </div>
        </motion.section>

        {/* 13. Modifications */}
        <motion.section
          custom={12}
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
              13. Modifications to Terms
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes, we will notify you by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Posting the updated Terms on the Platform with a revised &quot;Last Updated&quot; date</li>
              <li>Sending an email to the address associated with your account</li>
              <li>Displaying a prominent notice on the Platform</li>
              <li>For vendors, providing at least 30 days&apos; notice before material changes take effect</li>
            </ul>
            <p>
              Your continued use of the Platform after the effective date of any modifications constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the Platform and close your account.
            </p>
          </div>
        </motion.section>

        {/* 14. Governing Law */}
        <motion.section
          custom={13}
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
              14. Governing Law
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles. Any legal proceedings arising out of these Terms shall be brought exclusively in the courts of competent jurisdiction in Lagos, Nigeria, and you consent to the personal jurisdiction of such courts.
            </p>
            <p>
              Notwithstanding the foregoing, nothing in this section shall deprive you of the mandatory consumer protections afforded to you under the laws of your country of residence, to the extent such protections cannot be waived by agreement.
            </p>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue to be valid and enforceable to the fullest extent permitted by law.
            </p>
          </div>
        </motion.section>

        {/* 15. Waiver of Liability, Hold Harmless & Force Majeure */}
        <motion.section
          custom={14}
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
              15. Waiver of Liability, Hold Harmless &amp; Force Majeure
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              This section applies to all users of the Platform, including customers, vendors, drivers, restaurants, and other service providers.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">15.1 Release and Hold Harmless</h3>
            <p>
              To the fullest extent permitted by applicable law, you release, discharge, and hold harmless AfriBook, its owners, shareholders, partners, directors, officers, employees, contractors, and agents (collectively, &quot;AfriBook Parties&quot;) from any and all liability, claims, demands, damages, losses, costs, or expenses (including reasonable attorneys&apos; fees) arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Your normal and acceptable use of the Platform, including booking, ordering, requesting rides, arranging deliveries, and all other platform activities;
              </li>
              <li>
                Any transaction, agreement, or interaction between you and any independent vendor, driver, restaurant, or other third-party user facilitated through the Platform;
              </li>
              <li>
                The conduct, products, services, quality, safety, or legality of any independent vendor, driver, restaurant, or other third party; and
              </li>
              <li>
                Any unauthorized access to or use of your account that results from your failure to safeguard your credentials.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">15.2 Force Majeure</h3>
            <p>
              AfriBook shall not be liable for any failure or delay in performing its obligations, or for any loss, damage, or claim arising out of or in connection with, any event beyond its reasonable control, including but not limited to: acts of God and natural disasters (such as earthquakes, floods, hurricanes, storms, droughts, wildfires, landslides, and epidemics or pandemics); war, terrorism, civil unrest, or riots; strikes, lockouts, or other industrial disputes; power failures, telecommunications or internet outages, or failures of third-party infrastructure; government actions, orders, embargoes, or regulations; and any other unforeseeable event or circumstance.
            </p>
            <p>
              You acknowledge that AfriBook cannot guarantee the continuous, uninterrupted, or error-free availability of the Platform, the fulfilment of bookings or orders, or the completion of rides or deliveries when such performance is prevented or impeded by force majeure events, and you waive any claim against the AfriBook Parties in respect of such non-performance or delay.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">15.3 Intermediary Role</h3>
            <p>
              You accept that AfriBook acts solely as an intermediary platform and is not a party to any transaction between users. Where a dispute arises between users, the AfriBook Parties shall have no liability for the subject matter of that transaction, and you agree to pursue remedies against the relevant independent vendor, driver, restaurant, or other party in accordance with these Terms and applicable law.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">15.4 Severability and Savings</h3>
            <p>
              Where a court or other competent authority determines that any part of this waiver or hold-harmless provision is invalid or unenforceable, the remainder of this provision shall continue in full force and effect, and the invalid or unenforceable part shall be limited to the fullest extent permitted by law. Nothing in this section limits any rights you may have under mandatory consumer protection law of your country of residence that cannot be waived by agreement.
            </p>
          </div>
        </motion.section>

        {/* 16. Contact */}
        <motion.section
          custom={15}
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
              16. Contact Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-text-primary">AfriBook Technologies Limited</p>
                <p className="text-sm text-text-secondary">Legal Department</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Email:</p>
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
            href="/legal/privacy"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Privacy Policy &rarr;
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
