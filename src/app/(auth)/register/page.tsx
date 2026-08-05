'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User, Store, Truck, Utensils, Mail, Phone, Lock, Globe,
  ChevronRight, Check, ArrowLeft, Building2, MapPin, Sparkles,
  Eye, EyeOff,
} from 'lucide-react'
import { COUNTRIES } from '@/lib/localization/countries'
import { moderateRegistration, getBlockMessage } from '@/lib/moderation'
import PhoneVerification from '@/components/shared/PhoneVerification'
import ConsentSection from '@/components/account/ConsentSection'
import type { ConsentType } from '@/types'

type AccountType = 'customer' | 'vendor' | 'driver' | 'restaurant'
type Step = 1 | 2 | 3 | 4 | 5

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
  businessName: z.string().optional(),
  businessCategory: z.string().optional(),
})

type Step2Form = z.infer<typeof step2Schema>

const countryList = Object.values(COUNTRIES)

const STEP_LABELS: Record<Step, string> = {
  1: 'Account Type',
  2: 'Your Info',
  3: 'Verification',
  4: 'Location',
  5: 'Done!',
}

const TOTAL_STEPS = 5

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [selectedCountry, setSelectedCountry] = useState(countryList[0])
  const [grantedConsents, setGrantedConsents] = useState<ConsentType[]>([])
  const [submitLoading, setSubmitLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [city, setCity] = useState('')

  // Step 4 location
  const [detectedCountry, setDetectedCountry] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      businessName: '',
      businessCategory: '',
    },
    mode: 'onBlur',
  })

  const isVendorType = accountType === 'vendor'
  const isRestaurantType = accountType === 'restaurant'
  const showBusinessFields = isVendorType || isRestaurantType
  const watchedPhone = watch('phone')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      const subdomain = host.split('.')[0]
      const detected = countryList.find((c) => c.subdomain === subdomain)
      if (detected) {
        setSelectedCountry(detected)
        setValue('phone', `+${detected.phoneFormat.replace(/\D/g, '').slice(0, 4)}`)
      }
    }
  }, [setValue])

  const handleAccountSelect = (type: AccountType) => {
    setAccountType(type)
    setStep(2)
  }

  const handleStep2Submit = async (data: Step2Form) => {
    setSubmitLoading(true)
    setServerError('')
    try {
      // ── Trust & safety gate: block prohibited registrations immediately ──
      const screening = moderateRegistration({
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        businessName: showBusinessFields ? data.businessName : undefined,
        businessCategory: showBusinessFields ? data.businessCategory : undefined,
      })
      if (screening.blocked) {
        setServerError(getBlockMessage(screening))
        setSubmitLoading(false)
        return
      }

      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            phone: data.phone,
            country_code: selectedCountry.code,
            role: accountType,
            ...(showBusinessFields ? {
              business_name: data.businessName,
              business_category: data.businessCategory,
            } : {}),
          },
        },
      })
      if (error) throw error
      if (authData.user) {
        localStorage.setItem('afribook-register-role', accountType || 'customer')
        localStorage.setItem('afribook-register-user-id', authData.user.id)

        // Record sign-up disclosures/consents (best-effort; non-blocking).
        try {
          await fetch('/api/consents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              context: 'signup',
              consents: grantedConsents.map((consentType) => ({
                consentType,
                context: 'signup',
                consentVersion: '2025-06-01',
              })),
            }),
          })
        } catch {
          // Consent recording is best-effort and must not block registration.
        }
      }
      setStep(3)
    } catch (err: any) {
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setServerError('An account with this email already exists. Try signing in instead.')
      } else if (err.message?.includes('Password should')) {
        setServerError('Password is too weak. Use at least 6 characters with a mix of letters and numbers.')
      } else {
        setServerError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleVerifyCode = async (_code: string) => {
    setStep(4)
  }

  const handleResendCode = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signInWithOtp({ phone: watchedPhone })
  }

  const handleLocationSubmit = () => {
    localStorage.setItem('afribook-register-country', selectedCountry.code)
    localStorage.setItem('afribook-register-city', city)
    setStep(5)
  }

  const getNextStep = () => {
    if (!accountType) return '/onboarding/customer'
    return `/onboarding/${accountType}`
  }

  const roleConfig: Record<AccountType, { button: string; description: string; icon: any }> = {
    customer: { button: 'Complete your profile', description: 'Add your preferences and interests', icon: User },
    vendor: { button: 'Set up your business', description: 'Add your services and pricing', icon: Store },
    driver: { button: 'Apply to drive', description: 'Submit your documents and vehicle info', icon: Truck },
    restaurant: { button: 'Set up your restaurant', description: 'Add your menu and operating hours', icon: Utensils },
  }

  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-xs font-medium text-amber-600">{STEP_LABELS[step]}</span>
        </div>
        <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between px-1">
          {([1, 2, 3, 4, 5] as Step[]).map((s) => (
            <div
              key={s}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                step === s
                  ? 'bg-amber-500 scale-125'
                  : step > s
                  ? 'bg-emerald-500'
                  : 'bg-border'
              )}
            />
          ))}
        </div>
      </div>

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
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.button>
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
              {/* Full name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Full name</label>
                <input
                  type="text"
                  autoFocus
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
                  <select
                    {...register('phone')}
                    onChange={(e) => {
                      const country = countryList.find((c) => c.code === e.target.value)
                      if (country) {
                        setSelectedCountry(country)
                        setValue('phone', `+${country.phoneFormat.replace(/\D/g, '').slice(0, 4)}`)
                      }
                    }}
                    className="sr-only"
                  >
                    {countryList.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
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
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Min. 6 characters"
                    className={cn(
                      'w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                      'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                      errors.password ? 'border-red-400' : 'border-border focus:border-amber-500'
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
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* Business fields for vendor / restaurant */}
              {showBusinessFields && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {isRestaurantType ? 'Restaurant Details' : 'Business Details'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">
                      {isRestaurantType ? 'Restaurant name' : 'Business name'}
                    </label>
                    <input
                      type="text"
                      {...register('businessName')}
                      placeholder={isRestaurantType ? 'Your restaurant name' : 'Your business name'}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                        'bg-surface focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                        'border-border focus:border-amber-500'
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">
                      {isRestaurantType ? 'Cuisine type' : 'Primary category'}
                    </label>
                    <select
                      {...register('businessCategory')}
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

              {/* Disclosures & Consents */}
              <div className="p-4 rounded-xl border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5 space-y-2">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Disclosures &amp; Consents
                </p>
                <ConsentSection
                  items={[
                    {
                      type: 'terms_of_service',
                      title: 'Terms of Service',
                      description: (
                        <>
                          I agree to the{' '}
                          <Link href={selectedCountry.legalTermsUrl} target="_blank" className="font-semibold text-amber-600 hover:text-amber-700">
                            Terms of Service
                          </Link>
                          , including the Limitation of Liability and Indemnification provisions.
                        </>
                      ),
                    },
                    {
                      type: 'privacy_policy',
                      title: 'Privacy Policy',
                      description: (
                        <>
                          I agree to the{' '}
                          <Link href={selectedCountry.privacyUrl} target="_blank" className="font-semibold text-amber-600 hover:text-amber-700">
                            Privacy Policy
                          </Link>
                          , including how my personal and payment data is processed.
                        </>
                      ),
                    },
                    {
                      type: 'payment_authorization',
                      title: 'Payment Authorization',
                      description: (
                        <>
                          I authorise AfriBook to store payment methods and charge them for purchases, bookings, and subscriptions. Card numbers are never stored directly.
                        </>
                      ),
                    },
                    {
                      type: 'communications',
                      title: 'Communications Consent',
                      description: (
                        <>
                          I consent to receive transactional, service, and promotional communications by email, SMS, and push notification (promotions can be opted out anytime).
                        </>
                      ),
                    },
                    {
                      type: 'hold_harmless_waiver',
                      title: 'Waiver of Liability & Hold Harmless',
                      description: (
                        <>
                          To the fullest extent permitted by law, I release and hold harmless AfriBook, its owners, shareholders, partners, directors, employees, and agents from liability arising from normal and acceptable use of the Platform, unforeseeable events, events beyond AfriBook&apos;s control, and acts of nature (including natural disasters). AfriBook acts as an intermediary and is not a party to transactions between users and independent vendors or providers.
                        </>
                      ),
                    },
                  ]}
                  onChange={setGrantedConsents}
                />
              </div>

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
                  disabled={submitLoading || grantedConsents.length < 5}
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

            <p className="text-center text-xs text-text-tertiary mt-4">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {/* Step 3: Phone Verification */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PhoneVerification
              phoneNumber={watchedPhone || 'your phone'}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}

        {/* Step 4: Location */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25"
              >
                <MapPin className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-text-primary font-heading">Where are you located?</h2>
              <p className="text-sm text-text-secondary mt-2">This helps us show you relevant services nearby</p>
            </div>

            {/* Country selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Country</label>
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
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">City</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lagos, Nairobi, Cape Town"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-secondary text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleLocationSubmit}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all',
                  'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
                  'hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25',
                  'active:scale-[0.98]'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25"
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>

            <div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-text-primary font-heading"
              >
                Account created!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-text-secondary mt-2"
              >
                Welcome to AfriBook. Let&apos;s get you set up.
              </motion.p>
            </div>

            {accountType && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {(() => {
                      const cfg = roleConfig[accountType]
                      const RoleIcon = cfg.icon
                      return (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <RoleIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-text-primary capitalize">{accountType} account</p>
                            <p className="text-xs text-text-tertiary">{cfg.description}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                <button
                  onClick={() => router.push(getNextStep())}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-sm transition-all',
                    'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
                    'hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25',
                    'active:scale-[0.98]'
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {roleConfig[accountType!].button}
                  </span>
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Skip for now
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
