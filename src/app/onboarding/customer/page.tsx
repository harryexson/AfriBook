'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingLayout } from '@/components/onboarding'
import InterestCard from '@/components/onboarding/InterestCard'
import { COUNTRIES } from '@/lib/localization/countries'
import PaymentMethodsManager from '@/components/account/PaymentMethodsManager'
import ConsentSection, { DEFAULT_CONSENTS } from '@/components/account/ConsentSection'
import type { ConsentType } from '@/types'
import {
  Camera, MapPin, Search, ChevronDown,
  ArrowRight, PartyPopper, Lightbulb,
  BookOpen, Package, CalendarDays, Sparkles, Info,
} from 'lucide-react'

const INTERESTS = [
  { emoji: '💇', label: 'Beauty & Wellness' },
  { emoji: '🍽️', label: 'Food & Dining' },
  { emoji: '🛍️', label: 'Shopping & Fashion' },
  { emoji: '💻', label: 'Technology' },
  { emoji: '🏥', label: 'Healthcare' },
  { emoji: '🏠', label: 'Home Services' },
  { emoji: '🎉', label: 'Events & Entertainment' },
  { emoji: '🚗', label: 'Rides & Transport' },
  { emoji: '📦', label: 'Deliveries' },
  { emoji: '📚', label: 'Education' },
  { emoji: '🏋️', label: 'Fitness & Sports' },
  { emoji: '🐾', label: 'Pets & Animals' },
]

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

export default function CustomerOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [showBack, setShowBack] = useState(false)

  // Step 2 - Profile
  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Step 3 - Location
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // Step 4 - Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Step 5 - Payment & Consents
  const [grantedConsents, setGrantedConsents] = useState<ConsentType[]>([])
  const [, setConsentSaving] = useState(false)

  const totalSteps = 6

  const stepLabels: Record<number, string> = {
    1: 'Welcome',
    2: 'Your Profile',
    3: 'Location',
    4: 'Interests',
    5: 'Payment & Consents',
    6: 'All Set',
  }

  const next = () => {
    if (step < totalSteps) {
      setStep(step + 1)
      setShowBack(true)
    }
  }

  const prev = () => {
    if (step > 1) {
      setStep(step - 1)
      if (step - 1 === 1) setShowBack(false)
    }
  }

  const handleDetectLocation = () => {
    setDetectingLocation(true)
    setTimeout(() => {
      setCountry('NG')
      setCity('Lagos')
      setDetectingLocation(false)
      setLocationDetected(true)
    }, 1500)
  }

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const filteredCountries = Object.entries(COUNTRIES).filter(([, c]) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const finish = async () => {
    // Record onboarding disclosures/consents (best-effort, non-blocking).
    setConsentSaving(true)
    try {
      await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'onboarding',
          consents: grantedConsents.map((consentType) => ({
            consentType,
            context: 'onboarding',
            consentVersion: '2025-06-01',
          })),
        }),
      })
    } catch {
      // Best-effort recording.
    } finally {
      setConsentSaving(false)
      router.push(`/${country.toLowerCase() || 'ng'}`)
    }
  }

  const STEP_LABEL = stepLabels[step] || ''

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={totalSteps}
      stepLabel={STEP_LABEL}
      showBack={showBack}
      onBack={prev}
    >
      <AnimatePresence mode="wait">
        {/* ─── Step 1: Welcome ─── */}
        {step === 1 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            {/* Illustration */}
            <div className="relative mx-auto w-48 h-48">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 animate-pulse-soft" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
                <span className="text-7xl">🌍</span>
              </div>
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-2xl"
              >
                ✨
              </motion.div>
              <motion.div
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-1 -left-2 w-10 h-10 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-xl"
              >
                📱
              </motion.div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
                Welcome to <span className="text-gradient-gold">AfriBook</span>!
              </h1>
              <p className="text-text-secondary mt-3 text-lg max-w-md mx-auto">
                Discover and book trusted local services near you
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: BookOpen, label: 'Book Services', desc: 'Salons, repairs & more' },
                { icon: Package, label: 'Get Deliveries', desc: 'Food & packages' },
                { icon: CalendarDays, label: 'Find Events', desc: 'Events near you' },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-secondary border border-border-light"
                >
                  <f.icon className="w-6 h-6 text-amber-500" />
                  <span className="text-sm font-semibold text-text-primary">{f.label}</span>
                  <span className="text-xs text-text-tertiary">{f.desc}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={next}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-shadow"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        {/* ─── Step 2: Profile Setup ─── */}
        {step === 2 && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Set up your profile</h2>
              <p className="text-text-secondary mt-1">Tell us a bit about yourself</p>
            </div>

            {/* Photo upload */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className="w-28 h-28 rounded-full bg-surface-secondary border-2 border-dashed border-border group-hover:border-amber-400 transition-colors flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-text-tertiary group-hover:text-amber-500 transition-colors" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="appearance-none w-24 px-3 py-3 pr-8 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">+...</option>
                    {Object.entries(COUNTRIES).slice(0, 20).map(([code, c]) => (
                      <option key={code} value={code}>
                        {c.flag} +{c.phoneFormat.match(/\+(\d+)/)?.[1] ?? ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* DOB */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Date of Birth <span className="text-text-tertiary font-normal">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Gender <span className="text-text-tertiary font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      gender === g
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-amber-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={next}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="px-6 py-3 rounded-xl border border-border text-text-secondary font-medium hover:bg-surface-secondary transition-colors"
              >
                Complete Later
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 3: Location ─── */}
        {step === 3 && (
          <motion.div
            key="location"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Where are you located?</h2>
              <p className="text-text-secondary mt-1">Help us find services near you</p>
            </div>

            {/* Auto detect */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                {detectingLocation ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MapPin className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-text-primary">
                  {locationDetected ? 'Location detected!' : 'Auto-detect my location'}
                </p>
                <p className="text-sm text-text-secondary">
                  {locationDetected ? `${city}, ${COUNTRIES[country]?.name ?? country}` : 'Use GPS to find your current location'}
                </p>
              </div>
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-3 text-text-tertiary">or enter manually</span>
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Country</label>
              <div className="relative">
                <button
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-secondary border border-border text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <span className={country ? 'text-text-primary' : 'text-text-tertiary'}>
                    {country ? `${COUNTRIES[country]?.flag} ${COUNTRIES[country]?.name}` : 'Select country'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                </button>
                {showCountryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-surface border border-border shadow-xl"
                  >
                    <div className="sticky top-0 p-2 bg-surface border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    {filteredCountries.slice(0, 30).map(([code, c]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setCountry(code)
                          setShowCountryDropdown(false)
                          setCountrySearch('')
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-secondary transition-colors ${
                          country === code ? 'bg-amber-50 text-amber-700' : 'text-text-primary'
                        }`}
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Location services info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-secondary border border-border-light">
              <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">
                Enabling location services helps us show you the most relevant services and providers in your area. You can change this anytime in settings.
              </p>
            </div>

            {/* Map placeholder */}
            <div className="w-full h-48 rounded-xl bg-surface-secondary border border-border overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">
                    {city && country
                      ? `Map preview: ${city}, ${COUNTRIES[country]?.name ?? ''}`
                      : 'Select a location to see map preview'}
                  </p>
                </div>
              </div>
              {/* Fake grid lines for map feel */}
              <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full" style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)',
                  backgroundSize: '30px 30px'
                }} />
              </div>
            </div>

            <button
              onClick={next}
              disabled={!country}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 4: Interests ─── */}
        {step === 4 && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">What services are you interested in?</h2>
              <p className="text-text-secondary mt-1">
                Select at least 3 to continue
                {selectedInterests.length > 0 && (
                  <span className="text-amber-500 font-medium ml-1">
                    ({selectedInterests.length} selected)
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {INTERESTS.map((interest) => (
                <InterestCard
                  key={interest.label}
                  emoji={interest.emoji}
                  label={interest.label}
                  selected={selectedInterests.includes(interest.label)}
                  onClick={() => toggleInterest(interest.label)}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={next}
                disabled={selectedInterests.length < 3}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="px-6 py-3 rounded-xl text-text-secondary font-medium hover:text-text-primary hover:bg-surface-secondary transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 5: Payment & Consents ─── */}
        {step === 5 && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Payments &amp; consents</h2>
              <p className="text-text-secondary mt-1">
                Save a payment method and confirm your consents (you can manage both later)
              </p>
            </div>

            <PaymentMethodsManager compact />

            <div className="p-4 rounded-xl border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                Disclosures &amp; Consents
              </p>
              <ConsentSection
                items={[
                  {
                    type: 'terms_of_service',
                    title: 'Terms of Service',
                    description: (
                      <>
                        I agree to the Terms of Service, including the Limitation of Liability and Indemnification provisions.
                      </>
                    ),
                  },
                  {
                    type: 'privacy_policy',
                    title: 'Privacy Policy',
                    description: (
                      <>
                        I agree to the Privacy Policy, including how my personal and payment data is processed.
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
                        I consent to receive transactional, service, and promotional communications (promotions can be opted out anytime).
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

            <button
              onClick={next}
              disabled={grantedConsents.length < DEFAULT_CONSENTS.length}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 6: All Set! ─── */}
        {step === 6 && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center space-y-8"
          >
            {/* Confetti animation */}
            <div className="relative mx-auto w-48 h-48">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-200" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  <PartyPopper className="w-16 h-16 text-amber-600" />
                </motion.div>
              </div>
              {/* Confetti dots */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05, type: 'spring' }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'][i % 5],
                    top: `${10 + Math.random() * 80}%`,
                    left: `${5 + Math.random() * 90}%`,
                  }}
                />
              ))}
            </div>

            <div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-text-primary font-heading"
              >
                You&apos;re all set!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-text-secondary mt-2"
              >
                Welcome to AfriBook. Here&apos;s what we set up for you:
              </motion.p>
            </div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="max-w-sm mx-auto space-y-3 text-left"
            >
              {displayName && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-light">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">👤</div>
                  <span className="text-sm text-text-primary">Profile: {displayName}</span>
                </div>
              )}
              {country && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-light">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">📍</div>
                  <span className="text-sm text-text-primary">
                    Location: {city ? `${city}, ` : ''}{COUNTRIES[country]?.name ?? country}
                  </span>
                </div>
              )}
              {selectedInterests.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-light">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">❤️</div>
                  <span className="text-sm text-text-primary">
                    Interests: {selectedInterests.slice(0, 3).join(', ')}
                    {selectedInterests.length > 3 && ` +${selectedInterests.length - 3} more`}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Quick tips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="max-w-sm mx-auto space-y-2"
            >
              <p className="text-sm font-semibold text-text-primary flex items-center justify-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Quick tips
              </p>
              {[
                'Browse services near you',
                'Book your first service',
                'Invite friends and earn rewards',
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {tip}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <button
                onClick={finish}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
              >
                Start Exploring
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-6 py-3 rounded-xl border border-border text-text-secondary font-medium hover:bg-surface-secondary transition-colors">
                Take a quick tour
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingLayout>
  )
}
