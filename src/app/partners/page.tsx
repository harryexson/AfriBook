'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, TrendingDown, Hotel, UtensilsCrossed, Car, Briefcase } from 'lucide-react'
import { CAMPAIGNS, type CampaignAudience } from '@/lib/incentives/promo-campaigns'

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const AUDIENCE_ICON: Record<CampaignAudience, typeof Hotel> = {
  hotel: Hotel,
  rental_company: Car,
  restaurant: UtensilsCrossed,
  gig_provider: Briefcase,
  driver: Car,
  rider: Car,
}

const PARTNER_AUDIENCES: CampaignAudience[] = ['restaurant', 'hotel', 'rental_company', 'gig_provider']

const FEE_COMPARISON = [
  { row: 'Ride-hailing driver commission', afribook: '12–18%', them: '25–30% (Uber/Lyft typical)' },
  { row: 'Restaurant delivery commission', afribook: '10–18% (10% launch rate)', them: '15–30%' },
  { row: 'Short-stay host commission', afribook: '8–12%, no separate guest service fee tier stacking', them: '≈14–20% combined host + guest fees (Airbnb typical)' },
  { row: 'Vehicle rental host commission', afribook: '10–15%', them: '15–25% (Turo/Airbnb-adjacent typical)' },
  { row: 'Marketplace / gig-service fee', afribook: '10–15% (10% launch rate)', them: '20%+ common on gig marketplaces' },
]

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold font-heading mb-4"
          >
            Partner with AfriBook
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-amber-50 max-w-2xl mx-auto"
          >
            Restaurants, hotels, vehicle rental companies and independent service providers —
            lower fees than the platforms you already know, and launch incentives to prove it.
          </motion.p>
        </div>
      </section>

      {/* Fee comparison */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-bold text-text-primary font-heading">Lower rates, on purpose</h2>
          </div>
          <p className="text-sm text-text-secondary mb-6 max-w-2xl">
            AfriBook is built to keep more of every booking with the people doing the work. Here&apos;s how our
            standard rates compare to what you&apos;d pay elsewhere.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary text-left">
                  <th className="px-4 py-3 font-semibold text-text-primary">Fee</th>
                  <th className="px-4 py-3 font-semibold text-emerald-600">AfriBook</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Typical elsewhere</th>
                </tr>
              </thead>
              <tbody>
                {FEE_COMPARISON.map((row) => (
                  <tr key={row.row} className="border-t border-border">
                    <td className="px-4 py-3 text-text-primary font-medium">{row.row}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{row.afribook}</td>
                    <td className="px-4 py-3 text-text-tertiary">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            Rates vary by market and category; see the Fee &amp; Commission Policy and your vendor/host
            agreement for the exact schedule that applies to you.{' '}
            <Link href="/legal/fee-commission-policy" className="text-amber-600 hover:underline">
              Read the policy
            </Link>
          </p>
        </motion.div>
      </section>

      {/* Launch campaigns */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="text-2xl font-bold text-text-primary font-heading mb-6"
        >
          Launch incentives by category
        </motion.h2>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {CAMPAIGNS.filter((c) => PARTNER_AUDIENCES.includes(c.audience)).map((campaign) => {
            const Icon = AUDIENCE_ICON[campaign.audience]
            return (
              <motion.div key={campaign.id} variants={fadeIn} className="rounded-2xl border border-border bg-surface p-6 flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">{campaign.name}</h3>
                <p className="text-sm font-medium text-amber-600 mb-3">{campaign.tagline}</p>
                <p className="text-sm text-text-secondary mb-4">{campaign.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {campaign.incentives.map((incentive) => (
                    <li key={incentive} className="flex items-start gap-2 text-xs text-text-secondary">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {incentive}
                    </li>
                  ))}
                </ul>
                <Link
                  href={campaign.cta.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
                >
                  {campaign.cta.label} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>
    </div>
  )
}
