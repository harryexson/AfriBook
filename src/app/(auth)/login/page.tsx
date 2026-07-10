'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, Globe } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { COUNTRIES } from '@/lib/localization/countries'
import OAuthButtons from '@/components/shared/OAuthButtons'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

type RoleTab = 'customer' | 'vendor'

const countryList = Object.values(COUNTRIES)

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setStatus } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(countryList[0])
  const [roleTab, setRoleTab] = useState<RoleTab>('customer')
  const [submitLoading, setSubmitLoading] = useState(false)

  const detectedCountry = useMemo(() => {
    if (typeof window === 'undefined') return null
    const host = window.location.hostname
    const subdomain = host.split('.')[0]
    return countryList.find((c) => c.subdomain === subdomain) ?? null
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginForm) => {
    setSubmitLoading(true)
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
        if (profile) setUser(profile as any)
      }
      router.push('/')
    } catch (err: any) {
      setStatus('error')
      alert(err.message)
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
      {/* Role tabs */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex bg-surface-secondary rounded-xl p-1"
      >
        {(['customer', 'vendor'] as RoleTab[]).map((role) => (
          <button
            key={role}
            onClick={() => setRoleTab(role)}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize',
              roleTab === role
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {role === 'customer' ? 'Customer' : 'Vendor'}
          </button>
        ))}
      </motion.div>

      {/* Country selector */}
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
        <select
          value={selectedCountry.code}
          onChange={(e) => setSelectedCountry(countryList.find((c) => c.code === e.target.value)!)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all appearance-none cursor-pointer"
        >
          {countryList.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                errors.email ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-amber-500'
              )}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">Password</label>
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

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

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
            'Sign in'
          )}
        </button>
      </form>

      {/* OAuth */}
      <OAuthButtons onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} loading={submitLoading} />

      {/* Register link */}
      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  )
}
