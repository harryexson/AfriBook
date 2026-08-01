'use client'

import Link from 'next/link'
import { Globe, Mail, MapPin } from 'lucide-react'
import { COUNTRIES } from '@/lib/localization/countries'
import { useState } from 'react'
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
    { label: 'Services', href: '/marketplace/services' },
    { label: 'Products', href: '/marketplace/products' },
    { label: 'Events & Tickets', href: '/events' },
    { label: 'Food & Dining', href: '/food' },
    { label: 'Rides', href: '/rides' },
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
    { label: 'Vendor Agreement', href: '/legal/vendor' },
    { label: 'Community Guidelines', href: '/legal/guidelines' },
  ],
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const { countryCode, country, setCountry } = useCountry()
  const paymentMethods = country.paymentMethods.length > 0
    ? country.paymentMethods
    : [
        { id: 'visa', name: 'Visa', icon: 'credit-card' },
        { id: 'mastercard', name: 'Mastercard', icon: 'credit-card' },
        { id: 'paypal', name: 'PayPal', icon: 'credit-card' },
      ]

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail('')
  }

  return (
    <footer className="bg-dark-300 dark:bg-dark-500 text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold font-heading">Stay in the loop</h3>
              <p className="text-white/60 mt-1 max-w-md">
                Get updates on new features, promotions, and global expansions.
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 text-dark-300 font-semibold hover:bg-amber-400 transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
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
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Logo & tagline */}
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-amber-500" />
              <div>
                <span className="text-lg font-bold font-heading">AfriBook</span>
                <p className="text-xs text-white/40 mt-0.5">
                  Made with <span className="text-red-400">❤️</span> in Africa
                </p>
              </div>
            </div>

            {/* Country selector */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/40" />
              <select
                value={countryCode}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-white/10 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                {Object.values(COUNTRIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-dark-300 text-white">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* App download */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                App Store
              </a>
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                Google Play
              </a>
            </div>
          </div>

          {/* Payment methods */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-white/10">
            <span className="text-xs text-white/40 uppercase tracking-wider">We Accept</span>
            {paymentMethods.map((pm) => (
              <span
                key={pm.id}
                className="px-3 py-1.5 rounded-md bg-white/5 text-xs text-white/50 font-medium"
              >
                {pm.name}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-center text-xs text-white/30 mt-6">
            &copy; {new Date().getFullYear()} AfriBook. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
