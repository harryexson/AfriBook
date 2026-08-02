'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Search, X, Menu, ChevronDown, ShoppingBag,
  Package, LogOut, Settings, Heart, Bell, Store, Truck, Utensils, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useCountry } from './CountryProvider'
import MobileNav from './MobileNav'
import CountrySelector from './CountrySelector'

const NAV_LINKS = [
  { label: 'Marketplace', href: '/search', icon: ShoppingBag, category: '' },
  { label: 'Events', href: '/search', icon: Calendar, category: 'Entertainment' },
  { label: 'Food', href: '/search', icon: Utensils, category: 'Food & Dining' },
  { label: 'Rides', href: '/search', icon: Truck, category: 'Transportation' },
  { label: 'Deliveries', href: '/search', icon: Package, category: 'Logistics' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [countryModalOpen, setCountryModalOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const { user, authenticated, signOut } = useAuth()
  const { countryCode, country: selectedCountry } = useCountry()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/80 dark:bg-dark-300/80 backdrop-blur-xl shadow-sm border-b border-border/50'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Globe className={cn('w-7 h-7 text-amber-500', scrolled ? '' : 'text-white')} />
              <span className={cn(
                'text-xl font-bold font-heading tracking-tight',
                scrolled ? 'text-dark-300 dark:text-white' : 'text-white'
              )}>
                AfriBook
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={`${link.label}-${link.category}`}
                  href={`/${countryCode}${link.href}${link.category ? `?category=${encodeURIComponent(link.category)}` : ''}`}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    scrolled
                      ? 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              <Link
                href="/sell"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <Store className="w-4 h-4" />
                Sell
              </Link>
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-2">
              {/* Search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  scrolled
                    ? 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Country selector */}
              <button
                onClick={() => setCountryModalOpen(true)}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <span className="text-base">{selectedCountry?.flag ?? '🌍'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Currency display */}
              <span className={cn(
                'hidden md:block text-sm font-mono font-medium',
                scrolled ? 'text-text-secondary' : 'text-white/60'
              )}>
                {selectedCountry?.currency.symbol ?? '$'}
              </span>

              {/* Desktop auth */}
              <div className="hidden lg:flex items-center gap-3 ml-2">
                {authenticated && user ? (
                  <div ref={userMenuRef} className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={cn(
                        'flex items-center gap-2 p-1.5 rounded-lg transition-colors',
                        scrolled
                          ? 'hover:bg-surface-secondary'
                          : 'hover:bg-white/10'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                      </div>
                      <ChevronDown className={cn(
                        'w-4 h-4 transition-transform',
                        userMenuOpen ? 'rotate-180' : '',
                        scrolled ? 'text-text-secondary' : 'text-white/70'
                      )} />
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-200 rounded-xl shadow-xl border border-border overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-border">
                            <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                            <p className="text-xs text-text-secondary truncate">{user.email}</p>
                          </div>
                          <div className="p-1.5">
                            {[
                              { label: 'My Orders', icon: Package, href: '/account/orders' },
                              { label: 'Favorites', icon: Heart, href: '/account/favorites' },
                              { label: 'Notifications', icon: Bell, href: '/account/notifications' },
                              { label: 'Settings', icon: Settings, href: '/account/settings' },
                            ].map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                              >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-border p-1.5">
                            <button
                              onClick={() => { signOut(); setUserMenuOpen(false) }}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={cn(
                        'text-sm font-medium transition-colors',
                        scrolled ? 'text-text-secondary hover:text-text-primary' : 'text-white/80 hover:text-white'
                      )}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow-gold transition-colors hover:bg-amber-400"
                    >
                      <Store className="h-4 w-4" />
                      Become a Vendor
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={cn(
                  'lg:hidden p-2 rounded-lg transition-colors',
                  scrolled
                    ? 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search services, products, businesses..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface-tertiary transition-colors"
                      >
                        <X className="w-4 h-4 text-text-tertiary" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <MobileNav open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <CountrySelector open={countryModalOpen} onClose={() => setCountryModalOpen(false)} />
    </>
  )
}
