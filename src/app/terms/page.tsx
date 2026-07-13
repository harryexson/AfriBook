import type { Metadata } from 'next'
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
  BookOpen,
  RefreshCw,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'AfriBook Terms of Service — the legal agreement governing your use of the AfriBook platform across 16+ African countries and beyond.',
}

const TABLE_OF_CONTENTS = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'definitions', label: '2. Definitions' },
  { id: 'accounts', label: '3. Account Registration & Eligibility' },
  { id: 'conduct', label: '4. User Responsibilities & Conduct' },
  { id: 'services', label: '5. Services & Transactions' },
  { id: 'fees', label: '6. Fees & Pricing' },
  { id: 'ip', label: '7. Intellectual Property' },
  { id: 'privacy', label: '8. Privacy & Data Protection' },
  { id: 'disputes', label: '9. Dispute Resolution & Arbitration' },
  { id: 'liability', label: '10. Limitation of Liability' },
  { id: 'indemnification', label: '11. Indemnification' },
  { id: 'termination', label: '12. Termination' },
  { id: 'governing-law', label: '13. Governing Law & Jurisdiction' },
  { id: 'changes', label: '14. Changes to Terms' },
  { id: 'contact', label: '15. Contact Information' },
]

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="mb-12">
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
            <span>Last updated: July 1, 2025</span>
          </div>
          <span className="text-text-tertiary">|</span>
          <span>Effective: July 1, 2025</span>
        </div>
        <p className="text-sm text-text-secondary mt-4 max-w-2xl">
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and
          AfriBook Technologies Limited governing your use of the AfriBook platform. Please read them carefully.
        </p>
      </header>

      {/* Table of Contents */}
      <nav className="mb-12 p-6 rounded-2xl bg-surface border border-border">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
          Table of Contents
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {TABLE_OF_CONTENTS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-text-secondary hover:text-amber-600 transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Content Sections */}
      <div className="space-y-16">
        {/* 1. Acceptance of Terms */}
        <section id="acceptance" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              1. Acceptance of Terms
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Welcome to AfriBook. These Terms of Service (&quot;Terms&quot;) constitute a legally binding
              agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and AfriBook
              Technologies Limited (&quot;AfriBook,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
              a company incorporated under the laws of the Federal Republic of Nigeria (RC Number:
              [RC Number]), with its registered office at 14 Adeola Odeku Street, Victoria Island, Lagos,
              Nigeria.
            </p>
            <p>
              These Terms govern your access to and use of the AfriBook platform, including our website
              (afribook.app), mobile applications, APIs, and all related services, tools, and features
              (collectively, the &quot;Platform&quot;).
            </p>
            <p>
              By accessing, browsing, or using the Platform in any way — including creating an account,
              making a purchase, booking a service, listing a product, requesting a ride, or placing a
              delivery order — you acknowledge that you have read, understood, and agree to be bound by
              these Terms and our{' '}
              <Link href="/privacy" className="text-amber-600 hover:text-amber-700 font-medium">
                Privacy Policy
              </Link>
              , which is incorporated herein by reference.
            </p>
            <p>
              If you are using the Platform on behalf of a business, organization, or other entity, you
              represent and warrant that you have the authority to bind that entity to these Terms, and
              &quot;you&quot; and &quot;your&quot; shall refer to that entity.
            </p>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                Important: These Terms include provisions that limit our liability (Section 10), require
                you to resolve disputes through binding arbitration rather than in court (Section 9), and
                include an indemnification obligation (Section 11). Please review these provisions carefully.
              </p>
            </div>
            <p>
              If you do not agree to these Terms, you must not access or use the Platform. Your continued
              use of the Platform after the effective date of any modifications to these Terms constitutes
              your acceptance of the modified Terms.
            </p>
          </div>
        </section>

        {/* 2. Definitions */}
        <section id="definitions" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. Definitions
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              The following definitions apply throughout these Terms. Understanding these terms will help
              you know what each part of the agreement means.
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;Platform&quot;</h3>
                <p className="text-sm">
                  The AfriBook digital marketplace, including the afribook.app website, all associated
                  mobile applications (iOS and Android), APIs, developer tools, and any successor or
                  related services operated by AfriBook Technologies Limited. The Platform encompasses
                  all services described in Section 5.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;User&quot;</h3>
                <p className="text-sm">
                  Any individual or entity that accesses or uses the Platform, regardless of whether
                  they have created an account. Users include Customers, Vendors, and Drivers, each of
                  whom may have additional role-specific obligations as described in these Terms.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;Vendor&quot;</h3>
                <p className="text-sm">
                  A User who has registered as a seller on the Platform and been approved to list and
                  sell products or services through the AfriBook marketplace. Vendors include individual
                  entrepreneurs, sole proprietors, businesses, restaurants, and other commercial entities.
                  Vendors are subject to the additional{' '}
                  <Link href="/seller-terms" className="text-amber-600 hover:text-amber-700">
                    Seller Terms
                  </Link>
                  {' '}set forth in a separate agreement.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;Customer&quot;</h3>
                <p className="text-sm">
                  A User who browses, purchases, books, or otherwise acquires products or services
                  through the Platform. Customers may also use the Platform to request rides and
                  deliveries.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;Service&quot; or &quot;Services&quot;</h3>
                <p className="text-sm">
                  All services provided through the Platform, including but not limited to marketplace
                  transactions (buying and selling products), service bookings (beauty, wellness,
                  maintenance, professional services), ride-hailing, food delivery, package delivery,
                  event ticketing, and any other features or tools made available through the Platform
                  from time to time.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;Content&quot;</h3>
                <p className="text-sm">
                  All text, images, photographs, videos, reviews, ratings, messages, listings, product
                  descriptions, graphics, data, software, audio, and other materials that are uploaded,
                  submitted, displayed, or otherwise made available through the Platform by Users or
                  AfriBook.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;Transaction&quot;</h3>
                <p className="text-sm">
                  Any purchase, sale, booking, ride, delivery, or other exchange of value between Users
                  facilitated through the Platform, including the processing of payment through the
                  Platform&apos;s integrated payment systems.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">&quot;Driver&quot;</h3>
                <p className="text-sm">
                  A User who has registered, been verified, and been approved to provide ride-hailing
                  and/or delivery services through the Platform using their own vehicle(s).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Account Registration & Eligibility */}
        <section id="accounts" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              3. Account Registration &amp; Eligibility
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">3.1 Eligibility</h3>
            <p>
              You must be at least 18 years of age (or the age of legal majority in your jurisdiction,
              whichever is greater) to create an account and use the Platform. By creating an account, you
              represent and warrant that you meet this age requirement and have the legal capacity to
              enter into binding agreements under the laws of your jurisdiction.
            </p>
            <p>
              The Platform is available to Users in 16+ African countries, as well as the United States,
              the United Kingdom, and the European Union. Service availability, features, and payment
              methods may vary by country and region. You are responsible for ensuring that your use of
              the Platform complies with all laws applicable to you in your jurisdiction.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.2 Account Creation</h3>
            <p>
              To access certain features of the Platform, you must create an account by providing accurate,
              current, and complete information. The registration process may require:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full legal name and a valid email address</li>
              <li>A verified mobile phone number</li>
              <li>A secure password meeting our minimum complexity requirements</li>
              <li>Country of residence and primary city of operation</li>
              <li>Payment information (bank account, mobile money, or card details)</li>
            </ul>
            <p>
              You agree to provide truthful and accurate information and to maintain and promptly update
              your account information to keep it accurate, complete, and current. We reserve the right
              to verify the information you provide and to request additional documentation as needed.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.3 Account Types</h3>
            <p>The Platform supports multiple account types, each with distinct features and obligations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Customer Account:</strong> Browse products and
                services, make purchases, book services, request rides and deliveries, leave reviews,
                and save favorites.
              </li>
              <li>
                <strong className="text-text-primary">Vendor Account:</strong> List and sell products or
                services, manage inventory and orders, receive payouts, and access vendor analytics.
                Requires additional identity verification (KYC) and acceptance of the{' '}
                <Link href="/seller-terms" className="text-amber-600 hover:text-amber-700">
                  Seller Terms
                </Link>
                .
              </li>
              <li>
                <strong className="text-text-primary">Driver Account:</strong> Provide ride-hailing
                and/or delivery services. Requires background check, vehicle verification, valid
                driver&apos;s license, and applicable insurance.
              </li>
            </ul>
            <p>
              You may hold more than one account type simultaneously (e.g., a Customer account and a
              Vendor account) provided you comply with the terms applicable to each role.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.4 Account Security</h3>
            <p>
              You are solely responsible for maintaining the confidentiality and security of your account
              credentials. You must:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Choose a strong, unique password and enable two-factor authentication where available</li>
              <li>Not share your account credentials with any third party</li>
              <li>Not allow others to access or use your account</li>
              <li>Notify us immediately at{' '}
                <a href="mailto:security@afribook.app" className="text-amber-600 hover:text-amber-700">
                  security@afribook.app
                </a>{' '}
                if you suspect unauthorized access to your account
              </li>
            </ul>
            <p>
              You accept responsibility for all activities that occur under your account, whether or not
              you authorized them. AfriBook shall not be liable for any loss or damage arising from
              unauthorized use of your account.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">3.5 Account Verification</h3>
            <p>
              AfriBook operates a multi-tier verification system. Certain activities (such as selling
              products, accepting payments, or providing rides) require completion of identity
              verification (Know Your Customer / KYC). Verification tiers unlock additional features
              and may affect commission rates and payout schedules. We use third-party verification
              services and may require government-issued identification, proof of address, business
              registration documents, tax identification numbers, and biometric verification.
            </p>
          </div>
        </section>

        {/* 4. User Responsibilities & Conduct */}
        <section id="conduct" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              4. User Responsibilities &amp; Conduct
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">4.1 General Obligations</h3>
            <p>
              All Users of the Platform agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Platform only for lawful purposes and in accordance with these Terms</li>
              <li>Provide accurate and truthful information in all interactions</li>
              <li>Treat all other Users, vendors, drivers, and AfriBook staff with respect and courtesy</li>
              <li>Comply with all applicable local, national, and international laws and regulations</li>
              <li>Use the Platform&apos;s built-in messaging and payment systems for all transaction-related activity</li>
              <li>Promptly report any safety concerns, suspicious activity, or policy violations</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.2 Prohibited Conduct</h3>
            <p>You must not engage in any of the following:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using the Platform for any unlawful purpose or in furtherance of illegal activities</li>
              <li>Creating multiple accounts to circumvent suspensions, manipulations, or restrictions</li>
              <li>Impersonating another person, entity, or AfriBook employee</li>
              <li>Collecting, harvesting, or storing personal information of other Users without their consent</li>
              <li>Interfering with, disrupting, or attempting to gain unauthorized access to the Platform or its infrastructure</li>
              <li>Using automated systems, bots, crawlers, or scrapers to access or interact with the Platform</li>
              <li>Posting false, misleading, defamatory, or harmful content</li>
              <li>Engaging in price-fixing, collusion, or anti-competitive behavior with other Users</li>
              <li>Circumventing AfriBook&apos;s commission by conducting off-Platform transactions with Platform-sourced Customers</li>
              <li>Offering or accepting bribes, kickbacks, or corrupt payments</li>
              <li>Discriminating against any User on the basis of race, ethnicity, religion, gender, sexual orientation, disability, age, national origin, or any other protected characteristic</li>
              <li>Listing counterfeit, stolen, recalled, or illegal products or services</li>
              <li>Engaging in money laundering, terrorist financing, or other financial crimes</li>
              <li>Reverse engineering, decompiling, or disassembling any part of the Platform</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">4.3 Content Standards</h3>
            <p>
              Any content you submit to the Platform — including listings, reviews, messages, profile
              information, photos, and videos — must:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be accurate and not misleading</li>
              <li>Be original or properly licensed (you must own or have rights to all content you submit)</li>
              <li>Not infringe the intellectual property, privacy, or other rights of any third party</li>
              <li>Not contain hate speech, threats, harassment, or discriminatory language</li>
              <li>Not contain sexually explicit, graphic, or violent material</li>
              <li>Not promote or facilitate illegal activities, substances, or services</li>
              <li>Not contain spam, phishing content, or deceptive commercial messaging</li>
            </ul>
            <p>
              AfriBook reserves the right to remove any content that violates these standards and to
              take enforcement action against the responsible User, as described in our{' '}
              <Link href="/legal/guidelines" className="text-amber-600 hover:text-amber-700">
                Community Guidelines
              </Link>.
            </p>
          </div>
        </section>

        {/* 5. Services & Transactions */}
        <section id="services" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              5. Services &amp; Transactions
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              AfriBook is a multi-service digital marketplace connecting Users across 16+ African countries
              and international markets. The Platform offers the following core services:
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.1 Marketplace (Products)</h3>
            <p>
              Vendors list physical and digital products for sale to Customers. AfriBook provides the
              marketplace infrastructure, search and discovery tools, payment processing, and order
              management. AfriBook is not a party to the sale between Vendor and Customer and does not
              take title to any products unless expressly stated (e.g., for AfriBook-fulfilled items
              in the future). Vendors are solely responsible for product quality, safety, accuracy of
              listings, and compliance with applicable laws.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.2 Service Bookings</h3>
            <p>
              The Platform enables Customers to discover and book local services — including beauty and
              wellness, home maintenance, professional services, events, and experiences — from verified
              Vendors. Bookings are agreements between the Customer and the Vendor. AfriBook facilitates
              the discovery, booking, and payment process but is not a party to the service contract.
              Specific cancellation and refund policies are set by each Vendor and displayed at the
              time of booking.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.3 Rides</h3>
            <p>
              AfriBook connects riders with independent Drivers for point-to-point transportation. When
              you request a ride, you enter into a contract directly with the Driver. AfriBook
              facilitates the connection, fare estimation, routing, and payment processing. Key terms:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fare estimates are approximate and may vary based on actual route, traffic, wait time, and demand-based pricing</li>
              <li>Drivers reserve the right to refuse service in accordance with applicable law</li>
              <li>You must wear seatbelts where required by law and comply with all vehicle safety rules</li>
              <li>Do not request rides for more passengers than the vehicle&apos;s legal capacity</li>
              <li>Alcohol, drugs, smoking, and illegal substances are strictly prohibited in vehicles</li>
              <li>Shared ride details with trusted contacts using the Platform&apos;s safety features is strongly recommended</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.4 Deliveries</h3>
            <p>
              The Platform connects senders with Drivers for the transportation of goods — including
              food, groceries, packages, and parcels. AfriBook does not guarantee delivery times and is
              not responsible for items that are perishable, fragile, improperly packaged, or prohibited.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must not request delivery of prohibited, illegal, or hazardous items</li>
              <li>Adequate packaging is your responsibility unless the Vendor provides packaging</li>
              <li>Estimated delivery times are approximations and not guarantees</li>
              <li>Track your delivery in real-time through the Platform</li>
              <li>For food deliveries, check packaging upon receipt and report any safety concerns immediately</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.5 Event Ticketing</h3>
            <p>
              AfriBook may facilitate the sale of tickets for events listed by Vendors on the Platform.
              Event ticket purchases are subject to the event organizer&apos;s terms and conditions
              (displayed at the time of purchase) in addition to these Terms. AfriBook is not the event
              organizer and is not responsible for event cancellations, changes, or quality. Refund
              policies for event tickets are governed by the{' '}
              <Link href="/refund-policy" className="text-amber-600 hover:text-amber-700">
                Refund Policy
              </Link>.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.6 Platform Role</h3>
            <p>
              AfriBook acts solely as an intermediary platform connecting Users. Except where explicitly
              stated otherwise, we are not a party to any transaction between Users. We do not control
              the quality, safety, or legality of products and services offered through the Platform, the
              truthfulness of listings, the ability of Vendors to sell, or the ability of Customers to
              pay. We encourage all Users to exercise reasonable caution and due diligence in their
              transactions.
            </p>
          </div>
        </section>

        {/* 6. Fees & Pricing */}
        <section id="fees" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              6. Fees &amp; Pricing
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">6.1 Platform Fees</h3>
            <p>
              AfriBook charges fees for use of the Platform. Fees may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Transaction Commission:</strong> A percentage-based
                fee on each completed transaction, charged to the Vendor. Rates vary by service category,
                country, and Vendor verification tier. Your specific commission rate is displayed in your
                Vendor dashboard and the{' '}
                <Link href="/seller-terms" className="text-amber-600 hover:text-amber-700">
                  Seller Terms
                </Link>.
              </li>
              <li>
                <strong className="text-text-primary">Booking / Convenience Fees:</strong> A fee charged
                to Customers for using the Platform&apos;s booking and payment infrastructure, displayed
                at checkout before payment.
              </li>
              <li>
                <strong className="text-text-primary">Delivery Fees:</strong> Fees for delivery services,
                calculated based on distance, item size, and demand. Displayed before order confirmation.
              </li>
              <li>
                <strong className="text-text-primary">Service Fees:</strong> Additional fees for specific
                features such as express delivery, priority booking, or promoted listings.
              </li>
            </ul>
            <p>
              All fees are displayed in local currency where available and are inclusive of applicable
              taxes unless otherwise stated. Fees may vary by country, service type, and demand
              conditions. AfriBook reserves the right to change its fee structure with 30 days&apos;
              advance notice.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.2 Payment Processing</h3>
            <p>
              All payments are processed through our PCI-DSS compliant payment partners. AfriBook
              supports the following payment methods (availability varies by country):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Stripe:</strong> Credit and debit cards (Visa, Mastercard, American Express) — available globally</li>
              <li><strong className="text-text-primary">Paystack:</strong> Bank transfers, cards, USSD — available in Nigeria, Ghana, South Africa, Kenya</li>
              <li><strong className="text-text-primary">Flutterwave:</strong> Multi-currency payments across Africa, including mobile money and bank transfers</li>
              <li><strong className="text-text-primary">M-Pesa (Daraja):</strong> Mobile money payments — available in Kenya, Tanzania, DRC</li>
              <li><strong className="text-text-primary">Razorpay:</strong> UPI, net banking, and wallets — for India operations</li>
              <li><strong className="text-text-primary">AfriBook Wallet:</strong> Prepaid balance with instant processing and reduced fees</li>
              <li>Additional local payment methods as they become available in each market</li>
            </ul>
            <p>
              Payment information is tokenized and encrypted. We never store full card numbers on our
              servers. By providing payment information, you authorize us and our payment processors to
              charge the applicable fees to your selected payment method.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.3 Currencies &amp; Exchange Rates</h3>
            <p>
              Transactions are processed in the local currency of the applicable market where supported.
              Where currency conversion is required, exchange rates are determined by our payment
              processing partners and may include a conversion fee disclosed at the time of the
              transaction. AfriBook is not responsible for exchange rate fluctuations between the time
              of order and settlement.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.4 Subscription Plans</h3>
            <p>
              AfriBook may offer subscription plans that provide Vendors with reduced commission rates,
              enhanced features, priority support, and promotional benefits. Subscription terms,
              pricing, and benefits are displayed in the Vendor dashboard and may be modified with 30
              days&apos; notice. Subscriptions renew automatically unless cancelled at least 7 days
              before the renewal date. No partial refunds are provided for mid-cycle cancellations.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">6.5 Refunds</h3>
            <p>
              Refund policies vary by service type, Vendor, and country. Customer-initiated
              cancellations are subject to the cancellation policy displayed at the time of booking or
              purchase. Refunds, when approved, are processed to the original payment method within
              5–14 business days depending on the payment provider and bank. For complete details,
              refer to our{' '}
              <Link href="/refund-policy" className="text-amber-600 hover:text-amber-700">
                Refund Policy
              </Link>.
            </p>
          </div>
        </section>

        {/* 7. Intellectual Property */}
        <section id="ip" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              7. Intellectual Property
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">7.1 AfriBook Intellectual Property</h3>
            <p>
              The Platform — including its design, code, algorithms, trademarks, logos, trade names,
              service marks, graphics, icons, content, documentation, and all other proprietary
              materials — is the exclusive intellectual property of AfriBook and is protected by
              copyright, trademark, patent, trade secret, and other intellectual property and
              proprietary rights laws of Nigeria, the United States, the European Union, and
              international treaties. You are granted a limited, non-exclusive, non-transferable,
              revocable license to access and use the Platform for personal, non-commercial purposes
              in accordance with these Terms. You may not copy, modify, distribute, sell, lease,
              reverse engineer, or create derivative works from any part of the Platform without our
              express written permission.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.2 User Content License</h3>
            <p>
              You retain ownership of any Content you submit to the Platform, including reviews,
              photos, videos, messages, and listings. However, by submitting Content to the Platform,
              you grant AfriBook a worldwide, non-exclusive, royalty-free, sublicensable, and
              transferable license to use, reproduce, modify, adapt, translate, publish, display,
              distribute, and create derivative works from such Content solely in connection with the
              operation, promotion, and improvement of the Platform. This license survives termination
              of your account to the extent that your Content has been shared with other Users or
              incorporated into publicly visible portions of the Platform (e.g., reviews).
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.3 Vendor Content</h3>
            <p>
              Vendors grant AfriBook a license to use product images, descriptions, branding, and
              related materials for the purpose of operating, promoting, and marketing the Platform.
              This license terminates when a Vendor removes the content from the Platform or closes
              their account, except for content that has been shared by other Users or incorporated
              into reviews.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">7.4 Copyright &amp; IP Complaints</h3>
            <p>
              We respect intellectual property rights and comply with applicable copyright laws,
              including the Digital Millennium Copyright Act (DMCA) and equivalent legislation in
              other jurisdictions. If you believe your intellectual property has been infringed on
              the Platform, please contact our designated agent at{' '}
              <a href="mailto:ip@afribook.app" className="text-amber-600 hover:text-amber-700">
                ip@afribook.app
              </a>{' '}
              with: (a) identification of the copyrighted work or intellectual property claimed to
              have been infringed; (b) identification of the allegedly infringing material and its
              location on the Platform; (c) your contact information; (d) a statement of good faith
              belief; and (e) a statement under penalty of perjury that the information in the
              notification is accurate and that you are authorized to act on behalf of the rights
              owner.
            </p>
          </div>
        </section>

        {/* 8. Privacy & Data Protection */}
        <section id="privacy" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              8. Privacy &amp; Data Protection
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Your privacy is important to us. Our collection, use, and protection of your personal
              information is governed by our{' '}
              <Link href="/privacy" className="text-amber-600 hover:text-amber-700">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. Key points include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We collect personal information necessary to provide and improve the Platform, including identity data, payment data, location data, device data, and usage data</li>
              <li>We process data on the legal bases of contract performance, legitimate interests, consent, and legal obligation</li>
              <li>We comply with applicable data protection laws in every jurisdiction where we operate, including the Nigeria Data Protection Act (NDPA), Kenya Data Protection Act, South Africa POPIA, EU GDPR, UK GDPR, and US state privacy laws (CCPA/CPRA)</li>
              <li>You have rights including access, correction, deletion, portability, and opt-out of certain processing</li>
              <li>We implement industry-standard security measures including encryption (TLS 1.3 in transit, AES-256 at rest) and PCI-DSS compliant payment processing</li>
            </ul>
            <p>
              For comprehensive details, please review our{' '}
              <Link href="/privacy" className="text-amber-600 hover:text-amber-700">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/cookies" className="text-amber-600 hover:text-amber-700">
                Cookie Policy
              </Link>.
            </p>
          </div>
        </section>

        {/* 9. Dispute Resolution & Arbitration */}
        <section id="disputes" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              9. Dispute Resolution &amp; Arbitration
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">9.1 Informal Resolution</h3>
            <p>
              Before initiating formal proceedings, you agree to first contact us at{' '}
              <a href="mailto:legal@afribook.app" className="text-amber-600 hover:text-amber-700">
                legal@afribook.app
              </a>{' '}
              and attempt to resolve the dispute informally for at least 30 days. Most concerns can be
              resolved quickly through direct communication, and we encourage this approach.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">9.2 Platform Dispute Resolution</h3>
            <p>
              For disputes arising from transactions conducted through the Platform (e.g., product
              quality issues, service disputes, delivery problems), AfriBook provides a built-in
              dispute resolution process. Both Vendors and Customers may open a dispute within 14 days
              of the transaction. AfriBook will review evidence from all parties and make a
              determination, which may include partial or full refunds. Our dispute determinations
              are final and binding on the parties, subject to applicable consumer protection law.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">9.3 Mediation</h3>
            <p>
              If informal resolution fails for disputes not covered by the Platform dispute process,
              either party may initiate mediation under the rules of the Lagos Multi-Door Courthouse
              (LMDC) or another mutually agreed-upon mediation service. The costs of mediation shall
              be shared equally unless the mediator determines otherwise.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">9.4 Binding Arbitration</h3>
            <p>
              Any dispute that cannot be resolved through mediation shall be finally resolved by
              binding arbitration administered by the Arbitration and Mediation Centre of the Lagos
              Court of Arbitration in accordance with its rules. The arbitration shall be conducted in
              English, and the seat of arbitration shall be Lagos, Nigeria. The arbitrator&apos;s
              decision shall be final and enforceable in any court of competent jurisdiction.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">9.5 Exceptions to Arbitration</h3>
            <p>
              Notwithstanding the above, either party may seek injunctive or other equitable relief
              in any court of competent jurisdiction to prevent the actual or threatened infringement,
              misappropriation, or violation of intellectual property rights. Additionally, Users in
              the European Union, the United Kingdom, and other jurisdictions with non-waivable
              statutory dispute resolution rights retain those rights.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">9.6 Class Action Waiver</h3>
            <p>
              To the maximum extent permitted by applicable law, you agree that any dispute resolution
              proceedings will be conducted only on an individual basis and not in a class,
              consolidated, or representative action. You waive any right to participate in a class
              action lawsuit or class-wide arbitration against AfriBook. Nothing in this section
              prevents you from filing a complaint with a government consumer protection agency.
            </p>
          </div>
        </section>

        {/* 10. Limitation of Liability */}
        <section id="liability" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              10. Limitation of Liability
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Disclaimer of Warranties:</strong> The Platform
                is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
                kind, whether express, implied, or statutory, including but not limited to implied
                warranties of merchantability, fitness for a particular purpose, title, and
                non-infringement. AfriBook does not warrant that the Platform will be uninterrupted,
                error-free, secure, or free of viruses or other harmful components.
              </li>
              <li>
                <strong className="text-text-primary">Exclusion of Consequential Damages:</strong> In
                no event shall AfriBook, its directors, officers, employees, agents, affiliates,
                or licensors be liable for any indirect, incidental, special, consequential,
                punitive, or exemplary damages, including but not limited to damages for loss of
                profits, revenue, goodwill, data, or other intangible losses, arising out of or in
                connection with your use of or inability to use the Platform.
              </li>
              <li>
                <strong className="text-text-primary">Liability Cap:</strong> AfriBook&apos;s total
                aggregate liability to you for all claims arising out of or relating to these Terms
                or your use of the Platform shall not exceed the greater of: (a) the total fees you
                paid to AfriBook in the twelve (12) months immediately preceding the event giving
                rise to the claim; or (b) One Hundred United States Dollars (USD $100) or its
                equivalent in local currency.
              </li>
              <li>
                <strong className="text-text-primary">Third-Party Services:</strong> AfriBook is not
                responsible for the acts, omissions, content, products, services, accuracy, opinions,
                or availability of any third-party vendor, Driver, payment processor, or other
                service provider accessed through the Platform. Your interactions with third parties
                are solely between you and the third party.
              </li>
            </ul>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain warranties or
              liabilities. In such jurisdictions, our liability shall be limited to the fullest
              extent permitted by applicable law. Nothing in these Terms excludes or limits liability
              for fraud, gross negligence, willful misconduct, or any liability that cannot be
              excluded under applicable law.
            </p>
          </div>
        </section>

        {/* 11. Indemnification */}
        <section id="indemnification" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              11. Indemnification
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              You agree to indemnify, defend, and hold harmless AfriBook, its parent company,
              subsidiaries, affiliates, officers, directors, employees, agents, and licensors from
              and against any and all claims, damages, obligations, losses, liabilities, costs, and
              expenses (including reasonable attorneys&apos; fees and legal costs) arising from or
              relating to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of, or inability to use, the Platform or any services obtained through the Platform</li>
              <li>Your violation of these Terms or any applicable law, regulation, or third-party right</li>
              <li>Your Content, including any claims that your Content infringes or misappropriates a third party&apos;s intellectual property or other rights</li>
              <li>Your interactions with other Users, including Vendors, Drivers, and Customers</li>
              <li>Your products, services, listings, or business operations as a Vendor</li>
              <li>Your negligent, reckless, or willful acts or omissions</li>
            </ul>
            <p>
              AfriBook reserves the right, at its own expense, to assume the exclusive defense and
              control of any matter subject to indemnification by you, in which case you agree to
              cooperate with our defense of such claim. You shall not settle any such matter without
              the prior written consent of AfriBook.
            </p>
          </div>
        </section>

        {/* 12. Termination */}
        <section id="termination" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              12. Termination
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">12.1 Termination by You</h3>
            <p>
              You may close your account at any time through your account settings or by contacting
              support at{' '}
              <a href="mailto:support@afribook.app" className="text-amber-600 hover:text-amber-700">
                support@afribook.app
              </a>.
              Upon closure: (a) all active orders and bookings must be completed or appropriately
              cancelled; (b) pending payouts will be processed after deduction of any owed fees or
              refunds; (c) your listings and profile will be removed from public view; and (d) you
              must cease using any AfriBook branding or intellectual property.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">12.2 Termination by AfriBook</h3>
            <p>
              We may suspend or terminate your account at our discretion, with or without notice,
              if we reasonably believe you have:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violated these Terms, the Privacy Policy, the{' '}
                <Link href="/legal/guidelines" className="text-amber-600 hover:text-amber-700">Community Guidelines</Link>,{' '}
                or the{' '}
                <Link href="/seller-terms" className="text-amber-600 hover:text-amber-700">Seller Terms</Link>
              </li>
              <li>Engaged in fraudulent, illegal, or harmful conduct</li>
              <li>Posed a risk to the Platform, its Users, or third parties</li>
              <li>Created liability for AfriBook or its Users</li>
              <li>Failed to complete required verification or maintain valid documentation</li>
            </ul>
            <p>
              For non-critical violations, we will provide written notice and a reasonable opportunity
              to cure (typically 14 days) before termination. For serious violations (fraud, safety
              threats, illegal activity), we may terminate immediately without prior notice.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">12.3 Effect of Termination</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your right to access and use the Platform ceases immediately</li>
              <li>All outstanding fees and obligations become immediately due</li>
              <li>We may retain your data as required by law or for legitimate business purposes (as described in our Privacy Policy)</li>
              <li>Certain provisions of these Terms survive termination, including Sections 7 (Intellectual Property), 10 (Limitation of Liability), 11 (Indemnification), and 13 (Governing Law)</li>
            </ul>
          </div>
        </section>

        {/* 13. Governing Law & Jurisdiction */}
        <section id="governing-law" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              13. Governing Law &amp; Jurisdiction
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              Federal Republic of Nigeria, without regard to its conflict of law principles. Any legal
              proceedings (other than those subject to the arbitration provisions in Section 9) shall
              be brought exclusively in the courts of competent jurisdiction in Lagos, Nigeria, and
              you consent to the personal jurisdiction of such courts.
            </p>
            <p>
              Notwithstanding the foregoing, nothing in this section shall deprive you of the
              mandatory consumer protections afforded to you under the laws of your country of
              residence, to the extent such protections cannot be waived by contract. In particular:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">European Union / European Economic Area Users:</strong> You benefit from mandatory provisions of consumer protection law in your country of residence, and nothing in these Terms affects your rights under those provisions. You may also bring proceedings in the courts of the EU Member State where you reside.</li>
              <li><strong className="text-text-primary">United Kingdom Users:</strong> Nothing in these Terms affects your statutory rights under the Consumer Rights Act 2015 and other applicable UK consumer protection legislation.</li>
              <li><strong className="text-text-primary">United States Users:</strong> To the extent required by applicable state law (e.g., California, New York), certain provisions may be modified to comply with state-specific consumer protection requirements.</li>
              <li><strong className="text-text-primary">African Users:</strong> Users in countries where AfriBook operates retain all rights under local consumer protection legislation that cannot be contractually waived.</li>
            </ul>
            <p>
              If any provision of these Terms is found by a court or arbitrator of competent
              jurisdiction to be invalid, illegal, or unenforceable, the remaining provisions shall
              continue in full force and effect, and the invalid provision shall be modified to the
              minimum extent necessary to make it valid and enforceable while preserving its original
              intent.
            </p>
          </div>
        </section>

        {/* 14. Changes to Terms */}
        <section id="changes" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              14. Changes to Terms
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We reserve the right to modify these Terms at any time to reflect changes in our
              services, technology, legal requirements, business practices, or for other operational
              reasons. When we make material changes, we will notify you by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Posting the updated Terms on the Platform with a revised &quot;Last Updated&quot; date</li>
              <li>Sending an email notification to the address associated with your account at least 30 days before material changes take effect</li>
              <li>Displaying a prominent notice on the Platform</li>
              <li>For Vendors, providing at least 30 days&apos; written notice before material changes to commission structures, payout terms, or other commercially significant terms</li>
            </ul>
            <p>
              Your continued use of the Platform after the effective date of any modifications
              constitutes your acceptance of the updated Terms. If you do not agree to the modified
              Terms, you must stop using the Platform and close your account before the changes take
              effect. We will maintain an archive of previous versions of these Terms, which you may
              request by contacting{' '}
              <a href="mailto:legal@afribook.app" className="text-amber-600 hover:text-amber-700">
                legal@afribook.app
              </a>.
            </p>
          </div>
        </section>

        {/* 15. Contact Information */}
        <section id="contact" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              15. Contact Information
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              If you have any questions, concerns, or feedback about these Terms of Service, please
              contact us:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary">AfriBook Technologies Limited</p>
                <p className="text-sm text-text-secondary">Legal Department</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">General Legal Inquiries:</p>
                  <a href="mailto:legal@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    legal@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Customer Support:</p>
                  <a href="mailto:support@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    support@afribook.app
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Data Protection Officer:</p>
                  <a href="mailto:dpo@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    dpo@afribook.app
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
        </section>
      </div>

      {/* Navigation */}
      <footer className="mt-16 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/privacy"
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
      </footer>
    </div>
  )
}
