'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface OAuthButtonsProps {
  onGoogleSignIn?: () => Promise<void>
  onAppleSignIn?: () => Promise<void>
  loading?: boolean
}

export default function OAuthButtons({ onGoogleSignIn, onAppleSignIn, loading }: OAuthButtonsProps) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)

  const handleGoogle = async () => {
    if (!onGoogleSignIn) return
    setGoogleLoading(true)
    try {
      await onGoogleSignIn()
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleApple = async () => {
    if (!onAppleSignIn) return
    setAppleLoading(true)
    try {
      await onAppleSignIn()
    } finally {
      setAppleLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="space-y-3"
    >
      <div className="relative flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">or continue with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleGoogle}
          disabled={loading || googleLoading}
          className={cn(
            'flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-border',
            'text-sm font-medium text-text-primary hover:bg-surface-secondary transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
          )}
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Google
        </button>

        <button
          onClick={handleApple}
          disabled={loading || appleLoading}
          className={cn(
            'flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-border',
            'text-sm font-medium text-text-primary hover:bg-surface-secondary transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
          )}
        >
          {appleLoading ? (
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          )}
          Apple
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={handleGoogle}
          className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-surface-secondary transition-all mx-auto w-full"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">?</text>
          </svg>
          Sign in with SSO
        </button>
      </div>
    </motion.div>
  )
}
