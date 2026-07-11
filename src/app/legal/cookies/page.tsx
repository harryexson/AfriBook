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
  { id: 'types', label: '2. Types of Cookies We Use' },
  { id: 'specific', label: '3. Specific Cookies Used' },
  { id: 'third-party', label: '4. Third-Party Cookies' },
  { id: 'manage', label: '5. How to Manage Cookies' },
  { id: 'impact', label: '6. Impact of Disabling Cookies' },
  { id: 'dnt', label: '7. Do Not Track Signals' },
  { id: 'updates', label: '8. Updates to This Policy' },
  { id: 'contact', label: '9. Contact Information' },
]

const COOKIES_TABLE = [
  { name: 'afribook-session', purpose: 'Maintains your session and keeps you logged in', duration: 'Session', type: 'Essential' },
  { name: 'afribook-auth', purpose: 'Stores authentication tokens for secure access', duration: '30 days', type: 'Essential' },
  { name: 'afribook-csrf', purpose: 'Protects against cross-site request forgery attacks', duration: 'Session', type: 'Essential' },
  { name: 'afribook-cart', purpose: 'Preserves your shopping cart contents', duration: '7 days', type: 'Essential' },
  { name: 'afribook-country', purpose: 'Remembers your selected country preference', duration: '365 days', type: 'Functional' },
  { name: 'afribook-language', purpose: 'Stores your language preference', duration: '365 days', type: 'Functional' },
  { name: 'afribook-theme', purpose: 'Remembers your dark/light mode preference', duration: '365 days', type: 'Functional' },
  { name: 'afribook-location', purpose: 'Stores your recent search location for quick access', duration: '30 days', type: 'Functional' },
  { name: '_ga', purpose: 'Google Analytics — distinguishes unique users', duration: '2 years', type: 'Analytics' },
  { name: '_ga_*', purpose: 'Google Analytics — maintains session state', duration: '2 years', type: 'Analytics' },
  { name: '_gid', purpose: 'Google Analytics — distinguishes users', duration: '24 hours', type: 'Analytics' },
  { name: '_gat', purpose: 'Google Analytics — throttle request rate', duration: '1 minute', type: 'Analytics' },
  { name: 'ph_*', purpose: 'PostHog — product analytics and session recording', duration: '1 year', type: 'Analytics' },
  { name: '_fbp', purpose: 'Facebook Pixel — tracks visits across websites for ad targeting', duration: '90 days', type: 'Marketing' },
  { name: '_fbc', purpose: 'Facebook Pixel — stores the last Facebook ad click', duration: '90 days', type: 'Marketing' },
  { name: 'afribook-promo', purpose: 'Tracks promotional campaign interactions', duration: '30 days', type: 'Marketing' },
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
              Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work efficiently, improve user experience, and provide reporting information to website owners.
            </p>
            <p>
              Cookies set by the website owner (AfriBook) are called &quot;first-party cookies.&quot; Cookies set by parties other than the website owner are called &quot;third-party cookies.&quot; Third-party cookies enable features or functionality provided by external services, such as analytics, advertising, and interactive content.
            </p>
            <p>
              In addition to cookies, we may use similar technologies such as web beacons, pixel tags, local storage, and session storage to collect and store information. References to &quot;cookies&quot; in this policy include these similar technologies unless otherwise specified.
            </p>
          </div>
        </motion.section>

        {/* 2. Types of Cookies */}
        <motion.section
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          id="types"
          className="scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">
              2. Types of Cookies We Use
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-text-primary">Essential Cookies</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Required for the Platform to function properly. These enable core features like authentication, security, session management, and shopping cart functionality. The Platform cannot work properly without these cookies.
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-600">
                  Cannot be disabled
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-text-primary">Analytics Cookies</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Help us understand how visitors interact with the Platform by collecting anonymous usage data. This helps us improve the Platform&apos;s performance and user experience.
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-600">
                  Optional — can be disabled
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-green-500" />
                  <h3 className="font-semibold text-text-primary">Functional Cookies</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Enable enhanced functionality and personalization, such as remembering your country, language, theme preferences, and recently viewed items. If you do not allow these cookies, some features may not work as expected.
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-600">
                  Optional — can be disabled
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-text-primary">Marketing Cookies</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Used to track visitors across websites and display relevant advertisements. These cookies may be set by our advertising partners to build a profile of your interests and show you relevant ads on other sites.
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-600">
                  Optional — can be disabled
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3. Specific Cookies */}
        <motion.section
          custom={2}
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
              3. Specific Cookies Used
            </h2>
          </div>
          <div className="text-text-secondary space-y-4">
            <p className="text-sm">
              Below is a detailed list of the specific cookies we use on the AfriBook Platform:
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
                            : cookie.type === 'Functional'
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

        {/* 4. Third-Party Cookies */}
        <motion.section
          custom={3}
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
              4. Third-Party Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Some cookies on our Platform are placed by third-party services. We do not control these third-party cookies. Below are the main third-party services that set cookies through the AfriBook Platform:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-text-primary">Google Analytics:</strong> Used to analyze website traffic and user behavior. Google may use the data collected to contextualize and personalize the ads of its own advertising network. For more information on Google Analytics cookies, visit{' '}
                <a href="https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Google&apos;s cookie documentation
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">PostHog:</strong> Product analytics platform used to understand user interactions within the Platform. PostHog uses cookies to track sessions and events. For more information, visit{' '}
                <a href="https://posthog.com/docs/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  PostHog Privacy Documentation
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Stripe:</strong> Payment processing. Stripe may set cookies for fraud prevention, authentication, and to remember your payment preferences. For more information, visit{' '}
                <a href="https://stripe.com/cookies-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Stripe&apos;s Cookie Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Paystack:</strong> Payment processing. Paystack may set cookies for transaction security and session management. For more information, visit{' '}
                <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Paystack&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Facebook (Meta Pixel):</strong> Used for advertising and conversion tracking. The Meta Pixel helps us measure the effectiveness of our advertising by understanding the actions people take on the Platform. For more information, visit{' '}
                <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Meta&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-text-primary">Sentry:</strong> Error tracking and performance monitoring. Sentry may set cookies to help track errors and performance issues. For more information, visit{' '}
                <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Sentry&apos;s Privacy Policy
                </a>.
              </li>
            </ul>
            <p>
              Please note that we do not have control over third-party cookies and are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of these third-party services.
            </p>
          </div>
        </motion.section>

        {/* 5. How to Manage */}
        <motion.section
          custom={4}
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
              5. How to Manage Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">5.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can typically find these settings in the &quot;Options,&quot; &quot;Preferences,&quot; or &quot;Settings&quot; menu of your browser. Common options include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Block all cookies</li>
              <li>Accept only first-party cookies</li>
              <li>Delete cookies when you close your browser</li>
              <li>Receive notifications when a cookie is set</li>
            </ul>
            <p>
              Browser-specific instructions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data
              </li>
              <li>
                <strong className="text-text-primary">Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data
              </li>
              <li>
                <strong className="text-text-primary">Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data
              </li>
              <li>
                <strong className="text-text-primary">Edge:</strong> Settings &gt; Privacy, Search, and Services &gt; Cookies and site permissions
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.2 Mobile Device Settings</h3>
            <p>
              On mobile devices, you can control cookies through your device settings or by adjusting the privacy settings in your mobile browser. For our mobile applications, you can manage certain tracking preferences through your device&apos;s privacy settings.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.3 Our Cookie Preferences</h3>
            <p>
              When you first visit the AfriBook Platform, you will be presented with a cookie consent banner that allows you to choose which categories of optional cookies to accept. You can update your preferences at any time by clicking the &quot;Cookie Settings&quot; link in the footer of any page on the Platform.
            </p>

            <h3 className="text-lg font-semibold text-text-primary font-heading">5.4 Opt-Out Links</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Google Analytics Opt-Out:</strong> Install the{' '}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Google Analytics Opt-Out Browser Add-on
                </a>
              </li>
              <li>
                <strong className="text-text-primary">Facebook Opt-Out:</strong> Adjust your ad preferences at{' '}
                <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                  Facebook Ad Preferences
                </a>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* 6. Impact of Disabling */}
        <motion.section
          custom={5}
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
              6. Impact of Disabling Cookies
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              If you choose to disable cookies, some parts of the AfriBook Platform may not function correctly. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-text-primary">Essential Cookies:</strong> Disabling these will prevent you from logging in, making purchases, or using core features of the Platform. These cannot be disabled while using the Platform.</li>
              <li><strong className="text-text-primary">Functional Cookies:</strong> Disabling these means the Platform will not remember your preferences (country, language, theme), and you will need to set these each time you visit.</li>
              <li><strong className="text-text-primary">Analytics Cookies:</strong> Disabling these will not affect your experience, but we will be unable to gather anonymous usage data to improve the Platform.</li>
              <li><strong className="text-text-primary">Marketing Cookies:</strong> Disabling these will reduce the relevance of advertisements you see, but you will still see ads — they will simply be less tailored to your interests.</li>
            </ul>
          </div>
        </motion.section>

        {/* 7. Do Not Track */}
        <motion.section
          custom={6}
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
              7. Do Not Track Signals
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              Some web browsers offer a &quot;Do Not Track&quot; (DNT) signal that sends a request to websites you visit asking them not to track you. Currently, there is no universal standard for how websites should respond to DNT signals, and our Platform does not currently respond to DNT signals.
            </p>
            <p>
              However, you can control tracking through the cookie management tools described in Section 5 above. We respect the Global Privacy Control (GPC) signal where required by applicable law and will treat GPC signals as a valid opt-out request for applicable data sharing activities.
            </p>
          </div>
        </motion.section>

        {/* 8. Updates */}
        <motion.section
          custom={7}
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
              8. Updates to This Policy
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in the cookies we use, the purposes for which we use cookies, or for other operational, legal, or regulatory reasons. When we make changes, we will update the &quot;Last Updated&quot; date at the top of this page.
            </p>
            <p>
              For significant changes, we will provide more prominent notice, such as a banner on the Platform or an email notification. We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies.
            </p>
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
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-text-primary">AfriBook Technologies Limited</p>
                <p className="text-sm text-text-secondary">Privacy &amp; Data Protection Team</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-text-secondary">Email:</p>
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
            href="/legal/privacy"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Privacy Policy
          </Link>
          <Link
            href="/legal/vendor"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Vendor Agreement &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
