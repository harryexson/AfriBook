'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, ShoppingBag, Calendar, Truck } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import OAuthButtons from '@/components/shared/OAuthButtons'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const floatingIcons = [
  { Icon: ShoppingBag, delay: 0, x: '15%', y: '20%', size: 40, rotate: -12 },
  { Icon: Calendar, delay: 0.3, x: '80%', y: '15%', size: 36, rotate: 8 },
  { Icon: Truck, delay: 0.6, x: '70%', y: '75%', size: 44, rotate: -6 },
  { Icon: ShoppingBag, delay: 0.9, x: '20%', y: '80%', size: 32, rotate: 15 },
]

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setStatus } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    getFieldState,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  const redirectByRole = (role: string) => {
    if (role === 'admin' || role === 'super_admin') router.push('/admin')
    else if (role === 'vendor') router.push('/vendor')
    else if (role === 'driver') router.push('/driver')
    else router.push('/')
  }

  const onSubmit = async (data: LoginForm) => {
    setSubmitLoading(true)
    setServerError('')
    try {
      setStatus('loading')
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      if (authData.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        if (profile) {
          setUser(profile as any)
          redirectByRole(profile.role)
        } else {
          router.push('/')
        }
      }
    } catch (err: any) {
      setStatus('error')
      if (err.message?.includes('Invalid login')) {
        setServerError('Invalid email or password. Please try again.')
      } else if (err.message?.includes('Email not confirmed')) {
        setServerError('Please confirm your email address before signing in.')
      } else {
        setServerError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const handleAppleSignIn = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signInWithOAuth({ provider: 'apple' })
  }

  return (
    <div className="space-y-6">
      {/* Floating icons - only visible on lg+ layouts in the left panel, mirrored via layout */}

      {/* Welcome greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-text-secondary">
          Welcome back to <span className="font-semibold text-amber-600">AfriBook</span>
        </p>
      </motion.div>

      {/* Server error */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 p-3"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="email"
              autoFocus
              {...register('email')}
              placeholder="you@example.com"
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                getFieldState('email').invalid && getFieldState('email').isDirty
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-border focus:border-amber-500'
              )}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="Enter your password"
              className={cn(
                'w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                errors.password ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-amber-500'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded-md border-border text-amber-500 focus:ring-amber-500/30 focus:ring-2"
          />
          <span className="text-sm text-text-secondary">Remember me</span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitLoading}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-sm transition-all',
            'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
            'hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25',
            'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
          )}
        >
          {submitLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* OAuth */}
      <OAuthButtons onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} loading={submitLoading} />

      {/* Social proof */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-text-tertiary"
      >
        Join 500,000+ users across 16 countries
      </motion.p>

      {/* Register link */}
      <p className="text-center text-sm text-text-secondary">
        New to AfriBook?{' '}
        <Link href="/register" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
          Create account
        </Link>
      </p>
    </div>
  )
}
