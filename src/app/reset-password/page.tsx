'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Globe, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import Link from 'next/link'

type Status = 'form' | 'loading' | 'success' | 'error'

function getPasswordStrength(password: string): { label: string; score: number; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak', score: 1, color: 'bg-red-500' }
  if (score <= 2) return { label: 'Medium', score: 2, color: 'bg-amber-500' }
  if (score <= 3) return { label: 'Strong', score: 3, color: 'bg-green-500' }
  return { label: 'Very Strong', score: 4, color: 'bg-emerald-500' }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<Status>('form')
  const [error, setError] = useState('')
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        setHasToken(true)
      }
    }
  }, [])

  const strength = getPasswordStrength(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }, [password, confirmPassword, supabase])

  return (
    <div className="min-h-screen flex">
      {/* Brand side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-500 via-dark-400 to-dark-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-heading">AfriBook</span>
          </Link>

          <div className="max-w-md">
            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl font-bold text-white leading-tight font-heading"
            >
              &ldquo;Security is not an option — it&apos;s a foundation.&rdquo;
            </motion.blockquote>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-4 text-white/60 text-sm"
            >
              Your account security is our top priority
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-amber-400/60" />
            <span className="text-white/40 text-xs font-medium">End-to-end encrypted</span>
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
        </div>

        {/* Back */}
        <div className="hidden lg:flex items-center px-8 pt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </motion.div>

                  <div>
                    <h1 className="text-2xl font-bold text-text-primary font-heading">Password updated!</h1>
                    <p className="text-text-secondary mt-2">
                      Your password has been successfully reset. You can now sign in with your new password.
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
                  >
                    Sign in
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-primary font-heading">
                      Reset your password
                    </h1>
                    <p className="text-sm text-text-secondary mt-2">
                      Enter your new password below
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 mb-6"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {!hasToken && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6"
                    >
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-700">
                        No reset token detected. Please use the link from your email.
                      </p>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New password */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-primary">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError('') }}
                          placeholder="Enter new password"
                          className="w-full px-4 py-3 pr-11 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Strength indicator */}
                      {password.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2 pt-1"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                  level <= strength.score ? strength.color : 'bg-border'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${
                            strength.score <= 1 ? 'text-red-500' :
                            strength.score <= 2 ? 'text-amber-500' :
                            strength.score <= 3 ? 'text-green-500' :
                            'text-emerald-500'
                          }`}>
                            {strength.label}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-primary">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                          placeholder="Confirm new password"
                          className={`w-full px-4 py-3 pr-11 rounded-xl bg-surface-secondary border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                            confirmPassword.length > 0
                              ? passwordsMatch
                                ? 'border-green-400'
                                : 'border-red-300'
                              : 'border-border'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                      {passwordsMatch && (
                        <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Passwords match
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'loading' || password.length < 8 || !passwordsMatch}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'loading' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
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
