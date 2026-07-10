'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import type { UserRole } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  role?: UserRole | UserRole[]
  fallbackUrl?: string
}

export default function AuthGuard({ children, role, fallbackUrl = '/login' }: AuthGuardProps) {
  const router = useRouter()
  const { user, status } = useAuthStore()

  const isLoading = status === 'idle' || status === 'loading'
  const isUnauthenticated = status === 'unauthenticated' || status === 'error'

  useEffect(() => {
    if (isUnauthenticated) {
      const params = new URLSearchParams()
      if (typeof window !== 'undefined') {
        params.set('redirect', window.location.pathname)
      }
      router.replace(`${fallbackUrl}?${params.toString()}`)
      return
    }

    if (role && user && !isLoading) {
      const allowed = Array.isArray(role) ? role : [role]
      if (!allowed.includes(user.role)) {
        router.replace('/')
      }
    }
  }, [isUnauthenticated, role, user, isLoading, router, fallbackUrl])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-glow">
            <span className="text-white font-bold text-2xl">Af</span>
          </div>
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary font-medium">Verifying access...</p>
        </motion.div>
      </div>
    )
  }

  if (isUnauthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-glow">
            <span className="text-white font-bold text-2xl">Af</span>
          </div>
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary font-medium">Redirecting to login...</p>
        </motion.div>
      </div>
    )
  }

  if (role && user) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm mx-auto px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary font-heading mb-2">Access Denied</h2>
            <p className="text-sm text-text-secondary mb-6">
              You do not have the required permissions to view this page.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors"
            >
              Go Home
            </button>
          </motion.div>
        </div>
      )
    }
  }

  return <>{children}</>
}
