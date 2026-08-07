'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, ShieldCheck, Scale, Ban, Globe, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const DOCUMENTS = [
  {
    id: 'tos',
    title: 'Terms of Service',
    description: 'The master agreement governing your use of the AfriBook platform, including liability limits, waivers and prohibited conduct.',
    href: '/legal/terms',
    version: 'v2.1',
    icon: FileText,
    status: 'In force',
  },
  {
    id: 'vendor',
    title: 'Vendor Agreement',
    description: 'Your operating agreement as a seller or service provider on AfriBook — obligations, commissions, quality and termination.',
    href: '/legal/vendor',
    version: 'v2.0',
    icon: Scale,
    status: 'In force',
  },
  {
    id: 'seller',
    title: 'Seller Terms & Conditions',
    description: 'Detailed terms for marketplace sellers covering listings, pricing, fulfilment, payouts and dispute handling.',
    href: '/seller-terms',
    version: 'v1.0',
    icon: ShieldCheck,
    status: 'In force',
  },
  {
    id: 'host',
    title: 'Host Agreement',
    description: 'Agreement for hotels, guesthouses and stayscape hosts listing rooms and accommodations on AfriBook.',
    href: '/legal/host-agreement',
    version: 'v1.0',
    icon: Globe,
    status: 'In force',
  },
  {
    id: 'driver',
    title: 'Driver Agreement',
    description: 'Agreement for ride-hailing and delivery drivers on the AfriBook Rides & Delivery network.',
    href: '/legal/driver-agreement',
    version: 'v1.0',
    icon: Globe,
    status: 'In force',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'How AfriBook collects, uses and protects personal data across all markets.',
    href: '/legal/privacy',
    version: 'v3.0',
    icon: ShieldCheck,
    status: 'In force',
  },
  {
    id: 'refund',
    title: 'Refund Policy',
    description: 'Eligibility, timeframes and dispute resolution for marketplace transactions.',
    href: '/refund-policy',
    version: 'v1.1',
    icon: Scale,
    status: 'In force',
  },
  {
    id: 'guidelines',
    title: 'Community Guidelines',
    description: 'Behaviour expectations and content standards for the entire AfriBook community.',
    href: '/legal/guidelines',
    version: 'v0.9',
    icon: Ban,
    status: 'Published',
  },
]

export default function VendorLegalPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={ITEM}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal & Compliance</p>
              <h1 className="text-2xl font-bold font-heading text-text-primary">Legal Center</h1>
            </div>
          </div>
          <p className="text-sm text-text-secondary mt-2 max-w-2xl">
            The agreements below govern your use of the AfriBook platform as a vendor, host, driver or seller.
            By operating on AfriBook you agree to be bound by these documents. They are reviewed regularly and updated
            with at least 30 days&apos; notice for material changes.
          </p>
        </motion.div>

        {/* Obligations summary */}
        <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <Scale className="w-5 h-5 text-amber-500 mb-3" />
            <p className="text-sm font-semibold text-text-primary">Independent provider</p>
            <p className="text-xs text-text-secondary mt-1.5">You operate as an independent business. AfriBook is an intermediary, not your employer or partner.</p>
          </div>
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <Ban className="w-5 h-5 text-amber-500 mb-3" />
            <p className="text-sm font-semibold text-text-primary">Zero tolerance</p>
            <p className="text-xs text-text-secondary mt-1.5">Fraud, illegal goods, harassment, discrimination and prohibited conduct lead to immediate termination.</p>
          </div>
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <ShieldCheck className="w-5 h-5 text-amber-500 mb-3" />
            <p className="text-sm font-semibold text-text-primary">Your responsibility</p>
            <p className="text-xs text-text-secondary mt-1.5">You are personally responsible for your own actions, errors, due diligence and compliance with local law.</p>
          </div>
        </motion.div>

        {/* Documents */}
        <motion.div variants={ITEM}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENTS.map((doc) => (
              <Link
                key={doc.id}
                href={doc.href}
                className="group p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <doc.icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary group-hover:text-amber-600 transition-colors">{doc.title}</h3>
                      <p className="text-xs text-text-tertiary mt-0.5">{doc.version}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-500 transition-colors" />
                </div>
                <p className="text-sm text-text-secondary mt-3 leading-relaxed">{doc.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  {doc.status === 'In force' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{doc.status}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{doc.status}</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
