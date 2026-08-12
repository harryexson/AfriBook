'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, X, ShoppingBag, Store, Truck, Utensils, Package,
  LogIn, Heart, HelpCircle, ChevronRight, Calendar,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCountry } from './CountryProvider'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { label: 'Marketplace', href: '/search', icon: ShoppingBag, scoped: true },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Sell', href: '/sell', icon: Store, plain: true },
  { label: 'Rides', href: '/rides', icon: Truck },
  { label: 'Food', href: '/food', icon: Utensils },
  { label: 'Deliveries', href: '/deliveries', icon: Package },
]

const ACCOUNT_ITEMS = [
  { label: 'Favorites', href: '/account/favorites', icon: Heart },
  { label: 'Help Center', href: '/help', icon: HelpCircle },
]

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const { user, authenticated } = useAuth()
  const { countryCode, country } = useCountry()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />

          {/* Drawer */}
          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-dark-200 z-[70] lg:hidden shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-border">
                <div className="flex items-center gap-2">
                  <Globe className="w-6 h-6 text-amber-500" />
                  <span className="text-lg font-bold font-heading text-dark-300 dark:text-white">
                    AfriBook
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                {/* Auth section */}
                {!authenticated && (
                  <div className="flex flex-col gap-2 mb-6 px-2">
                    <Link
                      href="/login"
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-text-primary font-semibold hover:bg-surface-secondary transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      Become a Vendor
                    </Link>
                  </div>
                )}

                {/* User info when logged in */}
                {authenticated && user && (
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                      <p className="text-xs text-text-secondary truncate">{user.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  </Link>
                )}

                {/* Navigation */}
                <div className="space-y-1 mb-6">
                  <p className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                    Browse
                  </p>
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.plain ? item.href : item.scoped ? `/${countryCode}${item.href}` : item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Account links */}
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                    Account
                  </p>
                  {ACCOUNT_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Country badge */}
              <div className="px-5 py-4 border-t border-border">
                <p className="text-xs text-text-tertiary text-center">
                  Serving {country.flag} <span className="text-amber-500 font-semibold">{country.name}</span> in {countryCode}
                </p>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
