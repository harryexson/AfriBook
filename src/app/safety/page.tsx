'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ShieldCheck,
  Car,
  Users,
  Lock,
  CreditCard,
  AlertTriangle,
  Phone,
  Heart,
  Eye,
  MapPin,
  MessageCircle,
  Key,
  Smartphone,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const rideSafetyTips = [
  { title: 'Verify the driver', detail: 'Always check the driver\'s photo, name, and vehicle details before getting in. Match the license plate with what\'s shown in the app.' },
  { title: 'Share your trip', detail: 'Use the "Share Trip" feature to let a friend or family member follow your route in real-time.' },
  { title: 'Sit in the back seat', detail: 'For personal safety, sit in the back seat rather than the front passenger seat.' },
  { title: 'Trust your instincts', detail: 'If something doesn\'t feel right, don\'t get in the vehicle. You can cancel the ride and report your concerns.' },
  { title: 'Keep your phone charged', detail: 'Make sure your phone has enough battery to contact emergency services if needed.' },
  { title: 'Follow the route', detail: 'Watch the in-app navigation to ensure the driver follows the expected route.' },
]

const meetupSafetyTips = [
  { title: 'Meet in public places', detail: 'Always meet in well-lit, public locations. Avoid meeting at private residences for the first time.' },
  { title: 'Tell someone your plans', detail: 'Share your meeting location, time, and the person\'s details with a trusted friend or family member.' },
  { title: 'Use AfriBook\'s in-app messaging', detail: 'Keep communication within the app so there\'s a record of your conversations.' },
  { title: 'Arrange your own transport', detail: 'Have your own way to leave if the situation becomes uncomfortable.' },
  { title: 'Keep personal info private', detail: 'Don\'t share your home address, workplace, or financial details with strangers.' },
]

const accountSecurityTips = [
  {
    icon: Lock,
    title: 'Strong Password',
    description: 'Use a unique, complex password with at least 8 characters including uppercase, lowercase, numbers, and symbols. Never reuse passwords from other sites.',
  },
  {
    icon: Smartphone,
    title: 'Two-Factor Authentication',
    description: 'Enable 2FA in your account settings for an extra layer of security. You\'ll receive a verification code via SMS or authenticator app when logging in.',
  },
  {
    icon: Key,
    title: 'Regular Password Updates',
    description: 'Change your password every 3-6 months and immediately if you suspect unauthorized access to your account.',
  },
  {
    icon: Eye,
    title: 'Monitor Account Activity',
    description: 'Regularly check your account activity and login history. Report any suspicious activity immediately.',
  },
]

const paymentSafetyTips = [
  { title: 'Never share payment PINs', detail: 'AfriBook staff will never ask for your PIN, password, or full card details over the phone or chat.' },
  { title: 'Use secure payment methods', detail: 'Pay through the AfriBook app only. Never make payments outside the platform as you lose buyer protection.' },
  { title: 'Verify payment confirmations', detail: 'Always wait for the official AfriBook payment confirmation before considering a transaction complete.' },
  { title: 'Keep transaction records', detail: 'Save receipts and transaction IDs for all payments made through the platform.' },
  { title: 'Watch for phishing', detail: 'Be cautious of emails or messages asking you to click links or provide account details. Always verify the sender.' },
]

const platformSafetyFeatures = [
  {
    icon: MapPin,
    title: 'Real-Time Trip Tracking',
    description: 'Every ride is tracked in real-time, allowing you and your trusted contacts to follow the journey.',
  },
  {
    icon: MessageCircle,
    title: 'In-App Emergency Button',
    description: 'One-tap emergency button during rides that connects you directly to local emergency services and shares your location.',
  },
  {
    icon: Users,
    title: 'Verified Users',
    description: 'All vendors, drivers, and service providers go through identity verification before they can offer services on AfriBook.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: 'Escrow-based payments ensure your money is only released when you confirm delivery or service completion.',
  },
  {
    icon: Heart,
    title: 'Rating & Review System',
    description: 'Community-driven ratings help maintain quality and accountability across the platform.',
  },
  {
    icon: ShieldAlert,
    title: '24/7 Support',
    description: 'Our safety team is available around the clock to handle reports and emergencies.',
  },
]

const emergencyContacts = [
  { service: 'AfriBook Safety Hotline', number: '+254 700 000 000', available: '24/7', type: 'AfriBook' },
  { service: 'Police', number: '999 / 112', available: '24/7', type: 'Emergency' },
  { service: 'Ambulance', number: '999', available: '24/7', type: 'Emergency' },
  { service: 'Fire Department', number: '999 / 112', available: '24/7', type: 'Emergency' },
  { service: 'Gender-Based Violence Hotline', number: '116', available: '24/7', type: 'Support' },
  { service: 'Child Helpline', number: '116', available: '24/7', type: 'Support' },
]

export default function SafetyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-amber-500/5 via-surface to-surface-secondary border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-amber-500)_0%,_transparent_50%)] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-amber-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Safety Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-text-primary mb-3">
              Your Safety Matters
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              AfriBook is committed to providing a safe marketplace for everyone. Learn about our safety features, tips, and resources.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Safety Commitment */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20"
          >
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary mb-3">
              Our Safety Commitment
            </h2>
            <p className="text-text-secondary leading-relaxed">
              At AfriBook, safety is our top priority. We invest in technology, policies, and human review
              processes to protect every user on our platform. From verified vendors and drivers to secure
              escrow payments and real-time trip tracking, we build safety into every aspect of the
              marketplace. If you ever feel unsafe, we have dedicated support available 24/7 to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Personal Safety Tips - Rides */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Car className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Ride Safety Tips
              </h2>
            </div>
            <p className="text-text-secondary">
              Stay safe when using AfriBook rides
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {rideSafetyTips.map((tip) => (
              <motion.div
                key={tip.title}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{tip.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tip.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Personal Safety Tips - Meetups */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Meetup Safety Tips
              </h2>
            </div>
            <p className="text-text-secondary">
              Stay safe when meeting vendors or service providers in person
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {meetupSafetyTips.map((tip) => (
              <motion.div
                key={tip.title}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{tip.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tip.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Account Security */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Account Security
              </h2>
            </div>
            <p className="text-text-secondary">
              Protect your AfriBook account from unauthorized access
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {accountSecurityTips.map((tip) => (
              <motion.div
                key={tip.title}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <tip.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{tip.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tip.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Payment Safety */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Payment Safety
              </h2>
            </div>
            <p className="text-text-secondary">
              Keep your financial transactions secure
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {paymentSafetyTips.map((tip) => (
              <motion.div
                key={tip.title}
                variants={fadeInUp}
                className="flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border"
              >
                <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">{tip.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{tip.detail}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Platform Safety Features */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mb-2">
              Platform Safety Features
            </h2>
            <p className="text-text-secondary">
              Built-in features designed to keep you safe
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {platformSafetyFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Reporting Safety Concerns */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl bg-surface border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary">
                Reporting Safety Concerns
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-6">
              If you experience or witness any safety issue on AfriBook, please report it immediately.
              All reports are confidential and investigated promptly. You can report through the app,
              by email, or by calling our safety hotline.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/help/report"
                className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all"
              >
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Report in App</p>
                  <p className="text-xs text-text-secondary">Submit a detailed report through our form</p>
                </div>
              </Link>
              <a
                href="tel:+254700000000"
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all"
              >
                <Phone className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Call Safety Hotline</p>
                  <p className="text-xs text-text-secondary">+254 700 000 000 — Available 24/7</p>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-12 sm:py-16 bg-surface-secondary border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary">
                Emergency Contacts
              </h2>
            </div>
            <p className="text-text-secondary">
              Important numbers to keep handy
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {emergencyContacts.map((contact) => (
              <motion.div
                key={contact.service}
                variants={fadeInUp}
                className="p-5 rounded-2xl bg-surface border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    contact.type === 'Emergency'
                      ? 'text-red-600 bg-red-500/10'
                      : contact.type === 'AfriBook'
                      ? 'text-amber-600 bg-amber-500/10'
                      : 'text-blue-600 bg-blue-500/10'
                  }`}>
                    {contact.type}
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary text-sm mb-1">{contact.service}</h3>
                <a
                  href={`tel:${contact.number.replace(/[^0-9+]/g, '')}`}
                  className="text-lg font-bold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  {contact.number}
                </a>
                <p className="text-xs text-text-tertiary mt-1">{contact.available}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* COVID-19 Guidelines */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 sm:p-8 rounded-2xl bg-surface border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-text-primary">
                Health & Hygiene Guidelines
              </h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-6">
              We encourage all users to follow recommended health and hygiene practices when using
              AfriBook services, especially for rides, deliveries, and in-person services.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Follow local health authority guidelines',
                'Wash hands before and after transactions',
                'Use contactless payment when possible',
                'Maintain recommended distance during meetups',
                'Wear a mask if required by local regulations',
                'Report any health-related concerns through the app',
              ].map((guideline) => (
                <div key={guideline} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border">
                  <CheckCircle2 className="flex-shrink-0 w-4 h-4 text-green-500" />
                  <span className="text-sm text-text-secondary">{guideline}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
