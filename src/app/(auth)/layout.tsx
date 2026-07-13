'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { Globe, ArrowLeft, ShoppingBag, Calendar, Truck, Users, Building2, MapPin } from 'lucide-react'
import Link from 'next/link'

const floatingIcons = [
  { Icon: ShoppingBag, x: '10%', y: '18%', size: 38, rotate: -12, delay: 0 },
  { Icon: Calendar, x: '82%', y: '12%', size: 34, rotate: 8, delay: 0.4 },
  { Icon: Truck, x: '75%', y: '72%', size: 42, rotate: -6, delay: 0.8 },
  { Icon: ShoppingBag, x: '15%', y: '78%', size: 30, rotate: 15, delay: 1.2 },
  { Icon: Building2, x: '50%', y: '45%', size: 28, rotate: -10, delay: 0.6 },
  { Icon: MapPin, x: '88%', y: '42%', size: 26, rotate: 12, delay: 1.0 },
]

const stats = [
  { value: '500K+', label: 'Users' },
  { value: '16', label: 'Countries' },
  { value: '10K+', label: 'Businesses' },
]

const features = [
  'Book services instantly',
  'Manage your business',
  'Deliver & earn',
  'Discover local deals',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, status } = useAuthStore()

  const isAuthenticated = status === 'authenticated' && user
  const [activeStat, setActiveStat] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      const role = user.role
      if (role === 'admin' || role === 'super_admin') router.replace('/admin')
      else if (role === 'vendor') router.replace('/vendor')
      else if (role === 'driver') router.replace('/driver')
      else router.replace('/')
    }
  }, [isAuthenticated, user, router])

  // Cycle stats
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Cycle features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pageTitle = pathname.includes('login')
    ? 'Welcome back'
    : pathname.includes('register')
    ? 'Create your account'
    : 'Reset your password'

  const pageSubtitle = pathname.includes('login')
    ? 'Sign in to your AfriBook account'
    : pathname.includes('register')
    ? 'Join millions across Africa and beyond'
    : "We'll send you a reset link"

  return (
    <div className="min-h-screen flex">
      {/* Brand side - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-500 via-dark-400 to-dark-600">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(245,158,11,0.05),transparent_70%)]" />
        </div>

        {/* Floating icons */}
        {floatingIcons.map((item, i) => {
          const Icon = item.Icon
          return (
            <motion.div
              key={i}
              className="absolute text-amber-500/20"
              style={{ left: item.x, top: item.y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -12, 0, 8, 0],
                rotate: [item.rotate, item.rotate + 5, item.rotate, item.rotate - 5, item.rotate],
              }}
              transition={{
                opacity: { delay: item.delay, duration: 0.5 },
                scale: { delay: item.delay, duration: 0.5, type: 'spring' },
                y: { delay: item.delay + 0.5, duration: 6, repeat: Infinity, ease: 'easeInOut' },
                rotate: { delay: item.delay + 0.5, duration: 8, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <Icon size={item.size} />
            </motion.div>
          )
        })}

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-heading">AfriBook</span>
          </Link>

          {/* Center content */}
          <div className="max-w-md">
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl font-bold text-white leading-tight font-heading"
            >
              &ldquo;Africa&apos;s commerce is not waiting for permission. It&apos;s building its own future.&rdquo;
            </motion.blockquote>

            {/* Rotating features */}
            <div className="h-8 mt-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeFeature}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/70 text-sm font-medium"
                >
                  {features[activeFeature]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Rotating stats */}
            <div className="flex items-center gap-8 mt-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  animate={{
                    opacity: activeStat === i ? 1 : 0.4,
                    scale: activeStat === i ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-white font-heading">{stat.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Country flags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center gap-6"
          >
            {['NG', 'KE', 'ZA', 'GH', 'TZ', 'EG'].map((code) => (
              <span key={code} className="text-2xl opacity-60 hover:opacity-100 transition-opacity">
                {String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))}
              </span>
            ))}
            <span className="text-white/40 text-xs font-medium">+10 more</span>
          </motion.div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex flex-col bg-surface">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary font-heading">AfriBook</span>
          </Link>
          <Link
            href={pathname.includes('login') ? '/register' : '/login'}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            {pathname.includes('login') ? 'Create account' : 'Sign in'}
          </Link>
        </div>

        {/* Mobile branding (compact) */}
        <div className="lg:hidden px-4 pt-2 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-text-tertiary">500K+ users across 16 countries</span>
          </div>
        </div>

        {/* Back to home (desktop) */}
        <div className="hidden lg:flex items-center px-8 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="w-full max-w-md"
          >
            {/* Page heading */}
            <div className="mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-2xl sm:text-3xl font-bold text-text-primary font-heading">
                    {pageTitle}
                  </h1>
                  <p className="text-sm text-text-secondary mt-2">{pageSubtitle}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {children}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6">
          <p className="text-xs text-text-tertiary text-center">
            &copy; {new Date().getFullYear()} AfriBook. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
