'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingLayout } from '@/components/onboarding'
import { COUNTRIES } from '@/lib/localization/countries'
import {
  Camera, Users, Calendar, DollarSign, ArrowRight, Check,
  ChevronDown, Plus, X, MapPin, Upload, Play, FileVideo, Image,
  AlertTriangle, CheckCircle2, Share2, LayoutDashboard,
} from 'lucide-react'

const SERVICE_TYPES = [
  { emoji: '💇', name: 'Hair Salon', description: 'Styling, braids, treatments & more' },
  { emoji: '✂️', name: 'Barber Shop', description: 'Fades, trims, beard grooming' },
  { emoji: '📸', name: 'Photography Studio', description: 'Portraits, events & product shoots' },
  { emoji: '🎥', name: 'Videography', description: 'Events, commercials & content creation' },
  { emoji: '💆', name: 'Spa & Wellness', description: 'Massages, facials & relaxation' },
  { emoji: '🚗', name: 'Mobile Car Wash', description: 'We come to you — home or office' },
  { emoji: '💈', name: 'Mobile Barber', description: 'On-location grooming services' },
  { emoji: '💅', name: 'Nail Studio', description: 'Manicures, pedicures & nail art' },
  { emoji: '🎨', name: 'Makeup Artist', description: 'Bridal, editorial & glam looks' },
  { emoji: '🏋️', name: 'Fitness Trainer', description: 'Personal training & group sessions' },
]

const BUSINESS_DURATIONS = [
  'Less than 1 year',
  '1-3 years',
  '3-5 years',
  '5+ years',
]

const DURATION_OPTIONS = [
  '15 min', '30 min', '45 min', '1 hr', '1.5 hr',
  '2 hr', '3 hr', 'Half day', 'Full day', 'Custom',
]

const CONTENT_AGREEMENT_SECTIONS = [
  {
    num: 1,
    title: 'Customer Consent Required',
    text: 'I certify that I have obtained explicit written consent from every customer depicted in any photo, video, or image I upload to AfriBook. I understand that posting images of customers without their consent is a violation of their privacy rights and may result in legal action against me.',
  },
  {
    num: 2,
    title: 'Content Ownership',
    text: 'I confirm that I own all rights to the content I upload, or I have obtained proper licenses and permissions. I grant AfriBook a non-exclusive, royalty-free license to display, promote, and market this content across the platform and its social media channels.',
  },
  {
    num: 3,
    title: 'Before & After Content',
    text: 'I understand that before/after photos of customers require specific written consent from the customer acknowledging that their images will be used for marketing purposes.',
  },
  {
    num: 4,
    title: 'Liability & Responsibility',
    text: 'I accept full legal responsibility for all content I post on AfriBook. I understand that AfriBook, its owners, directors, employees, and affiliates are NOT responsible for, and cannot be held liable for, any claims, damages, losses, or legal actions arising from my content.',
  },
  {
    num: 5,
    title: 'Indemnification',
    text: 'I agree to indemnify, defend, and hold harmless AfriBook and its owners from any claims, liabilities, damages, or expenses arising from my content or my use of the platform.',
  },
  {
    num: 6,
    title: 'Content Standards',
    text: 'I agree that my content will not contain: nudity, violence, hate speech, misleading information, copyrighted material I don\'t own, or content that violates any applicable laws.',
  },
  {
    num: 7,
    title: 'Voluntary Posting',
    text: 'I understand that all content I post is voluntary and of my own free will. No one at AfriBook has compelled, forced, or coerced me to post any content.',
  },
  {
    num: 8,
    title: 'Right to Remove',
    text: 'I understand that AfriBook reserves the right to remove any content that violates these terms or community guidelines, without prior notice.',
  },
  {
    num: 9,
    title: 'No Warranty',
    text: 'I understand that AfriBook makes no guarantees about the results of posting content, including but not limited to customer acquisition, bookings, or revenue.',
  },
  {
    num: 10,
    title: 'Governing Law',
    text: 'This agreement is governed by the laws of the jurisdiction in which AfriBook operates.',
  },
]

interface ServiceForm {
  name: string
  description: string
  price: string
  duration: string
}

interface PortfolioFile {
  id: string
  name: string
  size: number
  type: 'image' | 'video'
  preview?: string
}

const TOTAL_STEPS = 8

const STEP_LABELS: Record<number, string> = {
  1: 'Welcome',
  2: 'Business Type',
  3: 'Business Details',
  4: 'Location',
  5: 'Services & Pricing',
  6: 'Portfolio',
  7: 'Consent & Legal',
  8: 'All Set!',
}

const STEP_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function ServiceVendorOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 2 — Business Type
  const [businessType, setBusinessType] = useState('')

  // Step 3 — Business Details
  const [businessName, setBusinessName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [website, setWebsite] = useState('')
  const [businessDuration, setBusinessDuration] = useState('')
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)

  // Step 4 — Location
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [serviceCities, setServiceCities] = useState<string[]>([])
  const [cityInput, setCityInput] = useState('')
  const [serviceRadius, setServiceRadius] = useState(25)

  // Step 5 — Services
  const [services, setServices] = useState<ServiceForm[]>([
    { name: '', description: '', price: '', duration: '' },
    { name: '', description: '', price: '', duration: '' },
    { name: '', description: '', price: '', duration: '' },
  ])

  // Step 6 — Portfolio
  const [portfolioFiles, setPortfolioFiles] = useState<PortfolioFile[]>([])
  const [beforeAfterMode, setBeforeAfterMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Step 7 — Consent
  const [consentAgreed, setConsentAgreed] = useState(false)
  const [customerConsent, setCustomerConsent] = useState(false)
  const [liabilityAccept, setLiabilityAccept] = useState(false)

  const selectedCountry = country ? COUNTRIES[country] : null
  const currencySymbol = selectedCountry?.currency?.symbol ?? '$'

  const filteredCountries = Object.entries(COUNTRIES).filter(([, c]) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const canAdvance = useCallback(() => {
    switch (step) {
      case 2: return businessType !== ''
      case 3: return businessName.trim() !== '' && phone.trim() !== ''
      case 4: return city.trim() !== '' && country !== ''
      case 7: return consentAgreed && customerConsent && liabilityAccept
      default: return true
    }
  }, [step, businessType, businessName, phone, city, country, consentAgreed, customerConsent, liabilityAccept])

  const next = () => {
    if (step < TOTAL_STEPS && canAdvance()) {
      setStep(step + 1)
    }
  }

  const prev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleFinish = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push('/vendor')
    }, 1500)
  }

  // Services helpers
  const updateService = (index: number, field: keyof ServiceForm, value: string) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const addService = () => {
    setServices([...services, { name: '', description: '', price: '', duration: '' }])
  }

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index))
    }
  }

  // City tags
  const addCityTag = () => {
    const trimmed = cityInput.trim()
    if (trimmed && !serviceCities.includes(trimmed)) {
      setServiceCities([...serviceCities, trimmed])
      setCityInput('')
    }
  }

  const removeCityTag = (city: string) => {
    setServiceCities(serviceCities.filter((c) => c !== city))
  }

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCityTag()
    }
  }

  // Portfolio file handling
  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: PortfolioFile[] = []
    const remaining = 20 - portfolioFiles.length

    Array.from(fileList).slice(0, remaining).forEach((file) => {
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      if (!isVideo && !isImage) return
      if (file.size > 50 * 1024 * 1024) return

      newFiles.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: isVideo ? 'video' : 'image',
        preview: isImage ? URL.createObjectURL(file) : undefined,
      })
    })

    if (newFiles.length > 0) {
      setPortfolioFiles((prev) => [...prev, ...newFiles])
    }
  }, [portfolioFiles.length])

  const removePortfolioFile = (id: string) => {
    setPortfolioFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleQuickAdd = (count: number) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-quick-count', String(count))
      fileInputRef.current.click()
    }
  }

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      stepLabel={STEP_LABELS[step] || ''}
      showBack={step > 1 && step < 8}
      onBack={prev}
    >
      <AnimatePresence mode="wait">
        {/* ─── Step 1: Welcome ─── */}
        {step === 1 && (
          <motion.div
            key="welcome"
            {...STEP_ANIMATION}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="relative mx-auto w-44 h-44">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 animate-pulse-soft" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
                  <span className="text-6xl">💼</span>
                </div>
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-2xl"
                >
                  📸
                </motion.div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
                Grow Your Business with{' '}
                <span className="text-gradient-gold">AfriBook</span>
              </h1>
              <p className="text-text-secondary text-lg max-w-md mx-auto">
                Everything you need to showcase your work, attract customers, and get booked
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {[
                { icon: Camera, label: 'Showcase Your Work', desc: 'Upload photos and videos of your best work' },
                { icon: Users, label: 'Reach More Customers', desc: 'Get discovered by thousands of local customers' },
                { icon: Calendar, label: 'Manage Bookings', desc: 'Accept and manage appointments effortlessly' },
                { icon: DollarSign, label: 'Get Paid Fast', desc: 'Weekly payouts to your bank account' },
              ].map((benefit, i) => (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.12 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-surface-secondary border border-border-light"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{benefit.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={next}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 2: Business Type ─── */}
        {step === 2 && (
          <motion.div
            key="business-type"
            {...STEP_ANIMATION}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">
                What type of business do you run?
              </h2>
              <p className="text-text-secondary mt-1">Select the one that best describes your service</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {SERVICE_TYPES.map((type) => (
                <motion.button
                  key={type.name}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBusinessType(type.name)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-amber-300 hover:shadow-md ${
                    businessType === type.name
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-border bg-surface hover:bg-surface-secondary'
                  }`}
                >
                  {businessType === type.name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  <span className="text-3xl">{type.emoji}</span>
                  <span className="text-sm font-semibold text-text-primary text-center leading-tight">
                    {type.name}
                  </span>
                  <span className="text-xs text-text-secondary text-center leading-tight">
                    {type.description}
                  </span>
                </motion.button>
              ))}
            </div>

            <button
              onClick={next}
              disabled={!businessType}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 3: Business Details ─── */}
        {step === 3 && (
          <motion.div
            key="business-details"
            {...STEP_ANIMATION}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">
                Business Information
              </h2>
              <p className="text-text-secondary mt-1">Tell us about your {businessType?.toLowerCase()}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Glow Beauty Studio"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Tell us about your business
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your business and what you offer..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 xxx xxx xxxx"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Website <span className="text-text-tertiary font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                How long have you been in business?
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-secondary border border-border text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <span className={businessDuration ? 'text-text-primary' : 'text-text-tertiary'}>
                    {businessDuration || 'Select duration'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                </button>
                {showDurationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 mt-1 w-full rounded-xl bg-surface border border-border shadow-xl overflow-hidden"
                  >
                    {BUSINESS_DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setBusinessDuration(d); setShowDurationDropdown(false) }}
                        className={`w-full px-4 py-2.5 text-sm text-left hover:bg-surface-secondary transition-colors ${
                          businessDuration === d ? 'bg-amber-50 text-amber-700' : 'text-text-primary'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <button
              onClick={next}
              disabled={!businessName.trim() || !phone.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 4: Location & Service Area ─── */}
        {step === 4 && (
          <motion.div
            key="location"
            {...STEP_ANIMATION}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">
                Location & Service Area
              </h2>
              <p className="text-text-secondary mt-1">Where is your business located?</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Business Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">State / Province</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Country *</label>
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
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-amber-500"
                        autoFocus
                      />
                    </div>
                    {filteredCountries.slice(0, 30).map(([code, c]) => (
                      <button
                        key={code}
                        onClick={() => { setCountry(code); setShowCountryDropdown(false); setCountrySearch('') }}
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

            {/* Mobile toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Do you offer mobile/on-location services?
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  E.g. mobile barbers, mobile car wash, on-location photography
                </p>
              </div>
              <button
                onClick={() => setIsMobile(!isMobile)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  isMobile ? 'bg-amber-500' : 'bg-border'
                }`}
              >
                <motion.div
                  animate={{ x: isMobile ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
                />
              </button>
            </div>

            {isMobile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-text-primary">
                  What areas do you serve?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={handleCityKeyDown}
                    placeholder="Type a city and press Enter"
                    className="flex-1 px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  />
                  <button
                    onClick={addCityTag}
                    disabled={!cityInput.trim()}
                    className="px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-amber-600 hover:border-amber-300 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {serviceCities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {serviceCities.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm border border-amber-200"
                      >
                        {c}
                        <button onClick={() => removeCityTag(c)} className="hover:text-amber-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {!isMobile && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Fixed Location Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address of your business location"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Service radius */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Service Radius</label>
                <span className="text-sm font-semibold text-amber-600">{serviceRadius} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={serviceRadius}
                onChange={(e) => setServiceRadius(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>5 km</span>
                <span>100 km</span>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="w-full h-40 rounded-xl bg-surface-secondary border border-border overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                  <p className="text-sm text-text-tertiary">
                    {city ? `Serving ${serviceRadius}km around ${city}` : 'Set location to see service area'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={next}
              disabled={!city.trim() || !country}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 5: Services & Pricing ─── */}
        {step === 5 && (
          <motion.div
            key="services"
            {...STEP_ANIMATION}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">
                Add Your Services
              </h2>
              <p className="text-text-secondary mt-1">Add at least your first 3 services</p>
            </div>

            <div className="space-y-4">
              {services.map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-xl border border-border bg-surface-secondary space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary text-sm">Service {i + 1}</h3>
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(i)}
                        className="p-1 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService(i, 'name', e.target.value)}
                    placeholder="Service name"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <textarea
                    value={service.description}
                    onChange={(e) => updateService(i, 'description', e.target.value)}
                    placeholder="Brief description"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">
                        Price ({currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(i, 'price', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Duration</label>
                      <select
                        value={service.duration}
                        onChange={(e) => updateService(i, 'duration', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                      >
                        <option value="">Select</option>
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-amber-600 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    Add photo
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              onClick={addService}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-amber-300 text-text-secondary hover:text-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Another Service
            </button>

            <p className="text-xs text-text-tertiary text-center">
              You can add more services later from your dashboard
            </p>

            <button
              onClick={next}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 6: Portfolio & Showcase ─── */}
        {step === 6 && (
          <motion.div
            key="portfolio"
            {...STEP_ANIMATION}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">
                Show Off Your Best Work
              </h2>
              <p className="text-text-secondary mt-1">
                Upload photos and videos of your work to attract more customers
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-border hover:border-amber-300 hover:bg-surface-secondary'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  Drag &amp; drop photos or videos here
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  or <span className="text-amber-500 font-medium">click to browse</span>
                </p>
              </div>
              <p className="text-xs text-text-tertiary">
                JPG, PNG, WEBP, MP4, MOV — Max 20 files, 50MB per file
              </p>
            </div>

            {/* Quick add buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleQuickAdd(3)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-secondary text-sm font-medium text-text-secondary hover:text-amber-600 hover:border-amber-300 transition-colors"
              >
                <Image className="w-4 h-4" />
                Add 3 photos
              </button>
              <button
                onClick={() => handleQuickAdd(5)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-secondary text-sm font-medium text-text-secondary hover:text-amber-600 hover:border-amber-300 transition-colors"
              >
                <Image className="w-4 h-4" />
                Add 5 photos
              </button>
            </div>

            {/* Before & After toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Add Before &amp; After</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Allows side-by-side upload pairs to showcase transformations
                </p>
              </div>
              <button
                onClick={() => setBeforeAfterMode(!beforeAfterMode)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  beforeAfterMode ? 'bg-amber-500' : 'bg-border'
                }`}
              >
                <motion.div
                  animate={{ x: beforeAfterMode ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
                />
              </button>
            </div>

            {/* Uploaded files grid */}
            {portfolioFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">
                  Uploaded files ({portfolioFiles.length}/20)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolioFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-xl border border-border overflow-hidden bg-surface-secondary"
                    >
                      <div className="aspect-square relative">
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {file.type === 'video' ? (
                              <FileVideo className="w-8 h-8 text-text-tertiary" />
                            ) : (
                              <Image className="w-8 h-8 text-text-tertiary" />
                            )}
                          </div>
                        )}
                        {file.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-text-primary ml-0.5" />
                            </div>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removePortfolioFile(file.id) }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-text-primary truncate">{file.name}</p>
                        <p className="text-xs text-text-tertiary">{formatFileSize(file.size)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={next}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 7: Consent & Legal ─── */}
        {step === 7 && (
          <motion.div
            key="consent"
            {...STEP_ANIMATION}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Required Step</span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary font-heading">
                Content Posting Agreement
              </h2>
              <p className="text-text-secondary mt-1">
                Please read and accept the terms below to continue
              </p>
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-xl border-2 border-amber-300 bg-surface p-5 space-y-5">
              <h3 className="text-base font-bold text-text-primary">
                VENDOR CONTENT POSTING AGREEMENT
              </h3>
              {CONTENT_AGREEMENT_SECTIONS.map((section) => (
                <div key={section.num} className="space-y-1">
                  <h4 className="text-sm font-bold text-text-primary">
                    {section.num}. {section.title}
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-secondary cursor-pointer hover:bg-surface transition-colors">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span className="text-sm text-text-primary">
                  I have read, understood, and agree to the Content Posting Agreement
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-secondary cursor-pointer hover:bg-surface transition-colors">
                <input
                  type="checkbox"
                  checked={customerConsent}
                  onChange={(e) => setCustomerConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span className="text-sm text-text-primary">
                  I confirm I have customer consent for all content I will post
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-secondary cursor-pointer hover:bg-surface transition-colors">
                <input
                  type="checkbox"
                  checked={liabilityAccept}
                  onChange={(e) => setLiabilityAccept(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span className="text-sm text-text-primary">
                  I accept full liability for my content and release AfriBook from any responsibility
                </span>
              </label>
            </div>

            <button
              onClick={next}
              disabled={!consentAgreed || !customerConsent || !liabilityAccept}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              I Agree — Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 8: All Set! ─── */}
        {step === 8 && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center space-y-8"
          >
            <div className="relative mx-auto w-48 h-48">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-200" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-amber-600" />
                </motion.div>
              </div>
              {[
                { emoji: '🎉', top: '5%', left: '75%', delay: 0.5 },
                { emoji: '✨', top: '15%', left: '0%', delay: 0.7 },
                { emoji: '🌟', top: '80%', left: '85%', delay: 0.9 },
              ].map((p, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: p.delay, type: 'spring' }}
                  className="absolute text-2xl"
                  style={{ top: p.top, left: p.left }}
                >
                  {p.emoji}
                </motion.span>
              ))}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-text-primary font-heading">
                Your business profile is ready!
              </h2>
              <p className="text-text-secondary mt-2">
                Here are the next steps to get the most out of AfriBook
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-3 text-left">
              {[
                { icon: '👤', label: 'Your profile is under review', desc: 'Usually within 24 hours' },
                { icon: '🕐', label: 'Complete your business hours', desc: 'Let customers know when you\'re available' },
                { icon: '📸', label: 'Add your logo and cover photo', desc: 'Make a great first impression' },
                { icon: '🔗', label: 'Share your profile link', desc: 'Spread the word to your customers' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-light"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.desc}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Go to Dashboard
                    <LayoutDashboard className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'Check out my business on AfriBook', url: window.location.origin })
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border text-text-secondary font-medium hover:bg-surface-secondary transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share your profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingLayout>
  )
}
