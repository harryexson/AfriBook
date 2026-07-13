'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Cookie,
  Shield,
  Settings,
  BarChart3,
  Megaphone,
  Clock,
  Mail,
  FileText,
  Globe,
  AlertTriangle,
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
  { id: 'what-are', label: '1. What Are Cookies' },
  { id: 'essential', label: '2. Essential Cookies' },
  { id: 'analytics', label: '3. Analytics Cookies' },
  { id: 'marketing', label: '4. Marketing Cookies' },
  { id: 'preferences', label: '5. Preferences Cookies' },
  { id: 'specific', label: '6. Specific Cookies Used' },
  { id: 'third-party', label: '7. Third-Party Cookies' },
  { id: 'manage', label: '8. How to Manage Cookies' },
  { id: 'impact', label: '9. Impact of Disabling Cookies' },
  { id: 'dnt', label: '10. Do Not Track & GPC' },
  { id: 'updates', label: '11. Updates to This Policy' },
  { id: 'contact', label: '12. Contact Information' },
]

const COOKIES_TABLE = [
  { name: 'afribook-session', purpose: 'Maintains your session and keeps you logged in across page navigations', duration: 'Session', type: 'Essential' },
  { name: 'afribook-auth', purpose: 'Stores encrypted authentication tokens for secure, persistent access', duration: '30 days', type: 'Essential' },
  { name: 'afribook-csrf', purpose: 'Protects against cross-site request forgery attacks on form submissions', duration: 'Session', type: 'Essential' },
  { name: 'afribook-cart', purpose: 'Preserves your shopping cart contents and pending orders across sessions', duration: '7 days', type: 'Essential' },
  { name: 'afribook-referral', purpose: 'Tracks referral sources for attribution and commission calculation', duration: '30 days', type: 'Essential' },
  { name: 'country-consent', purpose: 'Records your cookie consent preferences and country selection', duration: '365 days', type: 'Essential' },
  { name: 'afribook-country', purpose: 'Remembers your selected country for localized content and pricing', duration: '365 days', type: 'Preferences' },
  { name: 'afribook-language', purpose: 'Stores your preferred language for the Platform interface', duration: '365 days', type: 'Preferences' },
  { name: 'afribook-theme', purpose: 'Remembers your dark mode or light mode display preference', duration: '365 days', type: 'Preferences' },
  { name: 'afribook-location', purpose: 'Caches your recent search location for quick access on return visits', duration: '30 days', type: 'Preferences' },
  { name: 'afribook-recent', purpose: 'Tracks recently viewed items for personalized recommendations', duration: '14 days', type: 'Preferences' },
  { name: '_ga', purpose: 'Google Analytics 4 — distinguishes unique users and tracks site usage', duration: '2 years', type: 'Analytics' },
  { name: '_ga_*', purpose: 'Google Analytics 4 — maintains session state and user engagement data', duration: '2 years', type: 'Analytics' },
  { name: '_gid', purpose: 'Google Analytics — distinguishes users and throttles request rate', duration: '24 hours', type: 'Analytics' },
  { name: 'ph_*', purpose: 'PostHog — product analytics, session recording, and feature flag evaluation', duration: '1 year', type: 'Analytics' },
  { name: '_fbp', purpose: 'Facebook/Meta Pixel — tracks cross-site visits for ad targeting and conversion measurement', duration: '90 days', type: 'Marketing' },
  { name: '_fbc', purpose: 'Facebook/Meta Pixel — stores the last Facebook ad click identifier for attribution', duration: '90 days', type: 'Marketing' },
  { name: 'afribook-promo', purpose: 'Tracks engagement with promotional campaigns and discount code usage', duration: '30 days', type: 'Marketing' },
]

export default function CookiePolicyPage() {
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
            <Cookie className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              Cookie Policy
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
        {/* 1. What Are Cookies */}
        <motion.section
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="what-are"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              1. What Are Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Cookies are small text files that are placed on your device (computer, tablet, or mobile
              phone) when you visit a website. They are widely used to make websites work efficiently,
              improve user experience, and provide reporting information to website owners.
            </p>
            <p>
              Cookies set by the website owner (AfriBook) are called &quot;first-party cookies.&quot;
              Cookies set by parties other than the website owner are called &quot;third-party
              cookies.&quot; Third-party cookies enable features or functionality provided by external
              services, such as analytics, advertising, and interactive content.
            </p>
            <p>
              In addition to cookies, we may use similar technologies such as web beacons (pixel
              tags), local storage (localStorage), session storage (sessionStorage), and device
              fingerprinting for the purposes described in this policy. References to
              &quot;cookies&quot; in this policy include all of these similar technologies unless
              otherwise specified.
            </p>
            <p>
              This Cookie Policy should be read alongside our{' '}
              <Link href="/privacy" className="text-amber-600 hover:text-amber-700">
                Privacy Policy
              </Link>
              , which explains how we use the information collected through cookies and other
              tracking technologies.
            </p>
          </div>
        </motion.section>

        {/* 2. Essential Cookies */}
        <motion.section
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="essential"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. Essential Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Essential cookies (also called &quot;strictly necessary&quot; cookies) are required for
              the AfriBook Platform to function properly. These cookies enable core features such as
              authentication, security, session management, and shopping cart functionality. The
              Platform cannot work properly without these cookies, and they cannot be disabled through
              our cookie consent tool.
            </p>
            <p>We use essential cookies for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Session Management:</strong> Keeping you logged in as you navigate between pages, maintaining your session state across the Platform</li>
              <li><strong className="text-text-primary">Authentication:</strong> Verifying your identity and maintaining secure access to your account</li>
              <li><strong className="text-text-primary">Security:</strong> Protecting against cross-site request forgery (CSRF) attacks, detecting unauthorized access attempts, and enabling security features</li>
              <li><strong className="text-text-primary">Shopping Cart:</strong> Preserving your cart contents, pending orders, and selected items as you browse and return to the Platform</li>
              <li><strong className="text-text-primary">Cookie Consent:</strong> Remembering your cookie preferences and consent selections</li>
              <li><strong className="text-text-primary">Load Balancing:</strong> Distributing traffic across servers to ensure Platform reliability and performance</li>
            </ul>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mt-4">
              <p className="text-sm text-text-primary font-medium">
                These cookies do not require your consent under applicable law (e.g., the EU ePrivacy
                Directive, UK PECR) because they are strictly necessary for the service you have
                requested.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 3. Analytics Cookies */}
        <motion.section
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="analytics"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              3. Analytics Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Analytics cookies help us understand how visitors interact with the AfriBook Platform
              by collecting and reporting anonymous usage data. This information helps us improve the
              Platform&apos;s performance, identify popular features, detect errors, and enhance the
              overall user experience.
            </p>
            <p>Analytics cookies allow us to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Count the number of visitors to the Platform and individual pages</li>
              <li>Understand how Users navigate between pages and which features they use most</li>
              <li>Identify errors and technical issues that need to be fixed</li>
              <li>Measure the effectiveness of marketing campaigns and promotional activities</li>
              <li>Analyze user demographics and interests in aggregate (not individually)</li>
              <li>Conduct A/B testing to improve the Platform&apos;s design and functionality</li>
              <li>Monitor Platform performance and optimize loading speeds</li>
            </ul>
            <p>
              Analytics cookies are <strong className="text-text-primary">optional</strong> and can
              be disabled through our cookie consent tool. Disabling analytics cookies does not affect
              the functionality of the Platform, but it limits our ability to gather data to improve
              the service.
            </p>
          </div>
        </motion.section>

        {/* 4. Marketing Cookies */}
        <motion.section
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="marketing"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              4. Marketing Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Marketing cookies are used to track visitors across websites and display advertisements
              that are relevant and engaging for the individual User. These cookies may be set by our
              advertising partners (such as Meta/Facebook) through the AfriBook Platform and are used
              to build a profile of your interests and show you relevant advertisements on other sites.
            </p>
            <p>Marketing cookies allow us to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Deliver personalized advertisements based on your interests and browsing behavior</li>
              <li>Measure the effectiveness of our advertising campaigns across platforms</li>
              <li>Limit the number of times you see a particular advertisement</li>
              <li>Understand which advertisements drove traffic to the Platform</li>
              <li>Retarget Users who have visited the Platform or shown interest in specific products or services</li>
              <li>Build audience segments for advertising purposes (in aggregate)</li>
            </ul>
            <p>
              Marketing cookies are <strong className="text-text-primary">optional</strong> and
              require your explicit consent before activation. Disabling marketing cookies will not
              remove advertisements — you will simply see less personalized, generic advertisements
              instead.
            </p>
          </div>
        </motion.section>

        {/* 5. Preferences Cookies */}
        <motion.section
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="preferences"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              5. Preferences Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Preferences cookies (also called &quot;functional&quot; cookies) enable enhanced
              functionality and personalization on the Platform. They remember choices you make —
              such as your country, language, theme, and location settings — to provide a more
              tailored experience.
            </p>
            <p>Preferences cookies allow us to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Country Selection:</strong> Remember your selected country so you see localized content, pricing, and payment methods without re-selecting it each visit</li>
              <li><strong className="text-text-primary">Language:</strong> Store your preferred language for the Platform interface</li>
              <li><strong className="text-text-primary">Theme:</strong> Remember whether you prefer dark mode or light mode</li>
              <li><strong className="text-text-primary">Location:</strong> Cache your recent search location for quick access</li>
              <li><strong className="text-text-primary">Recently Viewed:</strong> Track items you have recently viewed for quick re-access</li>
              <li><strong className="text-text-primary">Display Preferences:</strong> Remember map views, list views, sort orders, and filter settings</li>
            </ul>
            <p>
              Preferences cookies are <strong className="text-text-primary">optional</strong>. If you
              do not allow these cookies, the Platform will still function, but some features may not
              work as expected — you may need to re-enter your preferences each time you visit.
            </p>
          </div>
        </motion.section>

        {/* 6. Specific Cookies Used */}
        <motion.section
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="specific"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              6. Specific Cookies Used
            </h2>
          </div>
          <div className="text-text-secondary space-y-4">
            <p className="text-sm">
              Below is a detailed list of the specific cookies deployed on the AfriBook Platform,
              their purpose, duration, and category:
            </p>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Cookie Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Purpose</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-text-primary">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES_TABLE.map((cookie, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 font-mono text-xs text-amber-600 whitespace-nowrap">
                        {cookie.name}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {cookie.purpose}
                      </td>
                      <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                        {cookie.duration}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          cookie.type === 'Essential'
                            ? 'bg-red-500/10 text-red-600'
                            : cookie.type === 'Analytics'
                            ? 'bg-blue-500/10 text-blue-600'
                            : cookie.type === 'Preferences'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-purple-500/10 text-purple-600'
                        }`}>
                          {cookie.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* 7. Third-Party Cookies */}
        <motion.section
          custom={6}
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
              7. Third-Party Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Some cookies on our Platform are placed by third-party services. We do not control
              these third-party cookies and are not responsible for the privacy practices of these
              third parties. Below are the main third-party services that set cookies through the
              AfriBook Platform:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-text-primary">Google Analytics (GA4):</strong> Used to
                analyze website traffic, user behavior, and conversion patterns. Google may use the
                data collected to contextualize and personalize the ads of its own advertising
                network. For more information, visit{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Google&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">PostHog:</strong> Product analytics platform
                used to understand user interactions, record sessions (with consent), and manage
                feature flags within the Platform. For more information, visit{' '}
                <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  PostHog&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Stripe:</strong> Payment processing. Stripe
                may set cookies for fraud prevention, authentication, and to remember your payment
                preferences for future transactions. For more information, visit{' '}
                <a href="https://stripe.com/cookies-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Stripe&apos;s Cookie Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Paystack:</strong> Payment processing in
                Nigeria, Ghana, South Africa, and Kenya. Paystack may set cookies for transaction
                security and session management. For more information, visit{' '}
                <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Paystack&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Meta/Facebook Pixel:</strong> Used for
                advertising and conversion tracking. The Meta Pixel helps us measure the
                effectiveness of our advertising by understanding the actions people take on the
                Platform. For more information, visit{' '}
                <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Meta&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Sentry:</strong> Error tracking and
                performance monitoring. Sentry may set cookies to help track errors, performance
                issues, and crash reports to improve Platform stability. For more information,
                visit{' '}
                <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Sentry&apos;s Privacy Policy
                </a>.
              </li>
            </ul>
            <p>
              We encourage you to review the privacy policies of these third-party services to
              understand how they handle your data. We periodically review our third-party
              integrations to ensure compliance with our privacy standards.
            </p>
          </div>
        </motion.section>

        {/* 8. How to Manage Cookies */}
        <motion.section
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="manage"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              8. How to Manage Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">8.1 Our Cookie Consent Tool</h3>
            <p>
              When you first visit the AfriBook Platform, you will be presented with a cookie consent
              banner that allows you to choose which categories of optional cookies to accept. You can
              update your preferences at any time by clicking the &quot;Cookie Settings&quot; link in
              the footer of any page on the Platform.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.2 Browser Settings</h3>
            <p>
              You can also control cookies through your web browser settings. Most browsers allow you
              to block or delete cookies. Common options include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Block all cookies</li>
              <li>Accept only first-party cookies</li>
              <li>Delete cookies when you close your browser</li>
              <li>Receive notifications when a cookie is set</li>
            </ul>
            <p>Browser-specific instructions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
              <li><strong className="text-text-primary">Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
              <li><strong className="text-text-primary">Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
              <li><strong className="text-text-primary">Edge:</strong> Settings &gt; Privacy, Search, and Services &gt; Cookies and site permissions</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.3 Mobile Device Settings</h3>
            <p>
              On mobile devices, you can control cookies through your device settings or by adjusting
              the privacy settings in your mobile browser. For our mobile applications, you can manage
              certain tracking preferences through your device&apos;s privacy settings (e.g., iOS
              Settings &gt; Privacy &gt; Tracking, Android Settings &gt; Privacy &gt; Ads).
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">8.4 Opt-Out Links</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Google Analytics Opt-Out:</strong> Install the{' '}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Google Analytics Opt-Out Browser Add-on
                </a>
              </li>
              <li>
                <strong className="text-text-primary">Meta/Facebook Ad Preferences:</strong> Adjust your ad preferences at{' '}
                <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Facebook Ad Preferences
                </a>
              </li>
              <li>
                <strong className="text-text-primary">PostHog:</strong> Opt out of session recording and analytics through the cookie consent tool or by contacting{' '}
                <a href="mailto:privacy@afribook.app" className="text-amber-600 hover:text-amber-700">
                  privacy@afribook.app
                </a>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* 9. Impact of Disabling Cookies */}
        <motion.section
          custom={8}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="impact"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              9. Impact of Disabling Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              If you choose to disable cookies, some parts of the AfriBook Platform may not function
              correctly. The impact depends on which categories you disable:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">Essential Cookies</h3>
                <p className="text-sm text-text-secondary">
                  Disabling these will prevent you from logging in, making purchases, using the
                  shopping cart, or accessing any core feature of the Platform. The Platform
                  fundamentally cannot function without essential cookies. These cannot be disabled
                  while using the Platform.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">Preferences Cookies</h3>
                <p className="text-sm text-text-secondary">
                  Disabling these means the Platform will not remember your country, language, theme,
                  or other preferences. You will need to re-select these each time you visit or log
                  in from a new device or browser.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">Analytics Cookies</h3>
                <p className="text-sm text-text-secondary">
                  Disabling these will not affect your experience on the Platform, but we will be
                  unable to gather anonymous usage data to understand how the Platform is used and
                  where improvements are needed.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold text-text-primary mb-1">Marketing Cookies</h3>
                <p className="text-sm text-text-secondary">
                  Disabling these will reduce the relevance of advertisements you see on the Platform
                  and on other websites. You will still see advertisements — they will simply be less
                  tailored to your interests and browsing behavior.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 10. Do Not Track & GPC */}
        <motion.section
          custom={9}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="dnt"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              10. Do Not Track &amp; GPC
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">10.1 Do Not Track (DNT)</h3>
            <p>
              Some web browsers offer a &quot;Do Not Track&quot; (DNT) signal that sends a request to
              websites you visit asking them not to track you. Currently, there is no universal
              standard for how websites should respond to DNT signals, and our Platform does not
              currently respond to DNT signals. However, you can control tracking through the cookie
              management tools described in Section 8 above.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">10.2 Global Privacy Control (GPC)</h3>
            <p>
              We respect the Global Privacy Control (GPC) signal where required by applicable law.
              Specifically, we honor GPC signals as a valid opt-out of the sale or sharing of personal
              information under the California Consumer Privacy Act (CCPA/CPRA) and similar
              legislation. When we detect a GPC signal, we will disable marketing cookies and refrain
              from sharing your personal information for cross-context behavioral advertising
              purposes.
            </p>
          </div>
        </motion.section>

        {/* 11. Updates to This Policy */}
        <motion.section
          custom={10}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="updates"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              11. Updates to This Policy
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in the cookies we
              use, the purposes for which we use cookies, or for other operational, legal, or
              regulatory reasons. When we make changes, we will update the &quot;Last Updated&quot;
              date at the top of this page.
            </p>
            <p>
              For significant changes — particularly changes to the types of cookies we use or the
              purposes for which we use them — we will provide more prominent notice, such as a
              cookie consent banner on the Platform or an email notification. We encourage you to
              review this Cookie Policy periodically to stay informed about our use of cookies.
            </p>
            <p>
              Previous versions of this policy are available upon request by contacting{' '}
              <a href="mailto:privacy@afribook.app" className="text-amber-600 hover:text-amber-700">
                privacy@afribook.app
              </a>.
            </p>
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
              If you have any questions about our use of cookies or this Cookie Policy, please
              contact us:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary">AfriBook Technologies Limited</p>
                <p className="text-sm text-text-secondary">Privacy &amp; Data Protection Team</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Email:</p>
                  <a href="mailto:privacy@afribook.app" className="text-sm text-amber-600 hover:text-amber-700">
                    privacy@afribook.app
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
            href="/privacy"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Privacy Policy
          </Link>
          <Link
            href="/refund-policy"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Refund Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
