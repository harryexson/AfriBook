'use client'

import Link from 'next/link'
import { Globe, MapPin } from 'lucide-react'
import { COUNTRIES } from '@/lib/localization/countries'

import { useCountry } from './CountryProvider'

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  Marketplace: [
    { label: 'All Categories', href: '/marketplace' },
    { label: 'Features', href: '/features' },
    { label: 'Hotels', href: '/stays' },
    { label: 'Restaurants', href: '/food' },
    { label: 'Services', href: '/marketplace/services' },
    { label: 'Products', href: '/marketplace/products' },
    { label: 'Events & Tickets', href: '/events' },
    { label: 'Rides', href: '/rides' },
    { label: 'Delivery', href: '/deliveries' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Safety', href: '/safety' },
    { label: 'Cancellation', href: '/help/cancellation' },
    { label: 'Refund Policy', href: '/help/refunds' },
    { label: 'Report an Issue', href: '/help/report' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
    { label: 'Host Agreement', href: '/legal/host-agreement' },
    { label: 'Vendor Agreement', href: '/legal/vendor' },
    { label: 'Community Guidelines', href: '/legal/guidelines' },
  ],
}

export default function Footer() {

  const { countryCode, country, setCountry } = useCountry()
  const paymentMethods = country.paymentMethods.length > 0
    ? country.paymentMethods
    : [
        { id: 'visa', name: 'Visa', icon: 'credit-card' },
        { id: 'mastercard', name: 'Mastercard', icon: 'credit-card' },
        { id: 'paypal', name: 'PayPal', icon: 'credit-card' },
      ]


  return (
    <footer className="bg-[#F6EDE2] text-[#302219]">
      <div className="border-b border-border"><div className="max-w-7xl mx-auto px-6 py-9 flex flex-wrap justify-between items-center gap-5"><div><h3 className="text-xl font-semibold tracking-tight">A little closer to everything.</h3><p className="mt-2 text-sm text-text-secondary">Your city. Your community. Your AfriBook.</p></div><Link href="/help" className="rounded-lg border border-border px-5 py-3 text-sm font-medium">We're here to help →</Link></div></div>
      {/* Main links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-amber-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Logo & tagline */}
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-amber-500" />
              <div>
                <span className="text-lg font-bold font-heading">AfriBook</span>
                <p className="text-xs text-text-secondary mt-0.5">
                  Proudly built across Africa
                </p>
              </div>
            </div>

            {/* Country selector */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-text-secondary" />
              <select
                value={countryCode}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-white/10 border border-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                {Object.values(COUNTRIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-white text-text-primary">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Link href="/onboarding/vendor" className="rounded-lg bg-[#B74F25] text-white px-5 py-3 text-sm font-semibold">Become a vendor →</Link>
          </div>

          {/* Payment methods */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-border">
            <span className="text-xs text-text-secondary uppercase tracking-wider">We Accept</span>
            {paymentMethods.map((pm) => (
              <span
                key={pm.id}
                className="px-3 py-1.5 rounded-md bg-white/5 text-xs text-text-secondary font-medium"
              >
                {pm.name}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-center text-xs text-text-secondary mt-6">
            &copy; {new Date().getFullYear()} AfriBook. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
