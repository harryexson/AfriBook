'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { Globe, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, status } = useAuthStore()

  const isAuthenticated = status === 'authenticated' && user

  useEffect(() => {
    if (isAuthenticated) {
      const role = user.role
      if (role === 'vendor') router.replace('/vendor')
      else if (role === 'admin' || role === 'super_admin') router.replace('/admin')
      else if (role === 'driver') router.replace('/driver')
      else router.replace('/')
    }
  }, [isAuthenticated, user, router])

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
    : 'We\'ll send you a reset link'

  return (
    <div className="min-h-screen flex">
      {/* Brand side - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-500 via-dark-400 to-dark-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-heading">AfriBook</span>
          </Link>

          {/* Quote */}
          <div className="max-w-md">
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl font-bold text-white leading-tight font-heading"
            >
              &ldquo;Africa&apos;s commerce is not waiting for permission. It&apos;s building its own future.&rdquo;
            </motion.blockquote>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-4 text-white/60 text-sm"
            >
              Join 50,000+ businesses already on AfriBook
            </motion.p>
          </div>

          {/* Trust badges */}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary font-heading">
                {pageTitle}
              </h1>
              <p className="text-sm text-text-secondary mt-2">{pageSubtitle}</p>
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
