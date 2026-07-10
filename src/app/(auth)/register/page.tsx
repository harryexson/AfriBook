'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User, Store, Truck, Utensils, Mail, Phone, Lock, Globe,
  ChevronRight, Check, ArrowLeft, Building2,
} from 'lucide-react'
import { COUNTRIES } from '@/lib/localization/countries'
import OAuthButtons from '@/components/shared/OAuthButtons'
import PhoneVerification from '@/components/shared/PhoneVerification'

type AccountType = 'customer' | 'vendor' | 'driver' | 'restaurant'
type Step = 1 | 2 | 3

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: any; description: string }[] = [
  { type: 'customer', label: 'Customer', icon: User, description: 'Browse & book services' },
  { type: 'vendor', label: 'Vendor', icon: Store, description: 'Sell services & products' },
  { type: 'driver', label: 'Driver', icon: Truck, description: 'Deliver & earn' },
  { type: 'restaurant', label: 'Restaurant', icon: Utensils, description: 'Sell food & manage orders' },
]

const step2Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(6, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  countryCode: z.string().min(2),
  vendorBusinessName: z.string().optional(),
  vendorCategory: z.string().optional(),
})

type Step2Form = z.infer<typeof step2Schema>

const countryList = Object.values(COUNTRIES)

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [selectedCountry, setSelectedCountry] = useState(countryList[0])
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      countryCode: countryList[0].code,
      vendorBusinessName: '',
      vendorCategory: '',
    },
  })

  const isVendorType = accountType === 'vendor' || accountType === 'restaurant'

  const handleAccountSelect = (type: AccountType) => {
    setAccountType(type)
    setStep(2)
  }

  const handleStep2Submit = async (data: Step2Form) => {
    setSubmitLoading(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            country_code: data.countryCode,
            role: accountType,
            ...(isVendorType ? {
              business_name: data.vendorBusinessName,
              business_category: data.vendorCategory,
            } : {}),
          },
        },
      })
      if (error) throw error
      setStep(3)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleVerifyCode = async (code: string) => {
    // In real app this would verify the OTP
    router.push('/')
  }

  const handleResendCode = async () => {
    // Resend OTP
  }

  const handleGoogleSignIn = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const handleAppleSignIn = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signInWithOAuth({ provider: 'apple' })
  }

  const stepLabels: Record<Step, string> = { 1: 'Account Type', 2: 'Your Info', 3: 'Verification' }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              step === s
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : step > s
                ? 'bg-emerald-500 text-white'
                : 'bg-surface-secondary text-text-tertiary'
            )}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={cn(
              'text-xs font-medium hidden sm:block',
              step >= s ? 'text-text-primary' : 'text-text-tertiary'
            )}>
              {stepLabels[s]}
            </span>
            {s < 3 && <div className={cn('flex-1 h-px', step > s ? 'bg-emerald-500' : 'bg-border')} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Account Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-sm text-text-secondary">Choose how you want to use AfriBook</p>
            <div className="grid grid-cols-2 gap-3">
              {ACCOUNT_TYPES.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => handleAccountSelect(type)}
                  className={cn(
                    'flex flex-col items-center text-center gap-3 p-5 rounded-2xl border-2 transition-all',
                    'hover:shadow-md hover:border-amber-500/30',
                    accountType === type
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 shadow-md shadow-amber-500/10'
                      : 'border-border bg-surface hover:bg-surface-secondary'
                  )}
                >
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
                    accountType === type
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25'
                      : 'bg-surface-secondary text-text-secondary'
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{label}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-text-tertiary pt-2">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleSubmit(handleStep2Submit)} className="space-y-4">
              {/* Country */}
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <select
                  {...register('countryCode')}
                  value={selectedCountry.code}
                  onChange={(e) => setSelectedCountry(countryList.find((c) => c.code === e.target.value)!)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                >
                  {countryList.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Full name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Full name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="John Doe"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                    'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                    errors.name ? 'border-red-400' : 'border-border focus:border-amber-500'
                  )}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Email */}
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
                      errors.email ? 'border-red-400' : 'border-border focus:border-amber-500'
                    )}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder={selectedCountry.phoneFormat}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                      'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                      errors.phone ? 'border-red-400' : 'border-border focus:border-amber-500'
                    )}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Min. 6 characters"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                      'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                      errors.password ? 'border-red-400' : 'border-border focus:border-amber-500'
                    )}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* Vendor-specific fields */}
              {isVendorType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Business Details</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Business name</label>
                    <input
                      type="text"
                      {...register('vendorBusinessName')}
                      placeholder="Your business name"
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                        'bg-surface focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                        'border-border focus:border-amber-500'
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Category</label>
                    <select
                      {...register('vendorCategory')}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    >
                      <option value="">Select category</option>
                      {selectedCountry.categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded-md border-border text-amber-500 focus:ring-amber-500/30 focus:ring-2"
                />
                <span className="text-xs text-text-secondary">
                  I agree to the{' '}
                  <Link href={selectedCountry.legalTermsUrl} className="font-semibold text-amber-600 hover:text-amber-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href={selectedCountry.privacyUrl} className="font-semibold text-amber-600 hover:text-amber-700">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {/* Back + Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !acceptedTerms}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all',
                    'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
                    'hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25',
                    'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
                  )}
                >
                  {submitLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Continue <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* OAuth */}
            <div className="mt-6">
              <OAuthButtons onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn} />
            </div>

            <p className="text-center text-xs text-text-tertiary mt-4">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PhoneVerification
              phoneNumber={watch('phone')}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
