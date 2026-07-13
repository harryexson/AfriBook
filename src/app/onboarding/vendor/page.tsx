'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingLayout } from '@/components/onboarding'
import { COUNTRIES } from '@/lib/localization/countries'
import {
  Store, TrendingUp, CreditCard, ChevronDown,
  ArrowRight, CheckCircle2, MapPin, Globe,
  Plus, Trash2, Info, Package,
} from 'lucide-react'

const CATEGORIES = [
  'Beauty & Wellness', 'Food & Dining', 'Technology', 'Fashion & Tailoring',
  'Home Services', 'Healthcare', 'Education', 'Events & Entertainment',
  'Automotive', 'Legal & Financial', 'Real Estate', 'Fitness & Sports',
]

const PAYMENT_ICONS = [
  { name: 'Paystack', color: '#00A859' },
  { name: 'Stripe', color: '#635BFF' },
  { name: 'Flutterwave', color: '#F5A623' },
]

interface ServiceForm {
  name: string
  description: string
  price: string
  duration: string
}

export default function VendorOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [showBack, setShowBack] = useState(false)

  // Step 2 - Business
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [website, setWebsite] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Step 3 - Location
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [serviceRadius, setServiceRadius] = useState(25)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // Step 4 - Services
  const [services, setServices] = useState<ServiceForm[]>([
    { name: '', description: '', price: '', duration: '' },
    { name: '', description: '', price: '', duration: '' },
    { name: '', description: '', price: '', duration: '' },
  ])

  // Step 5 - Payment
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [setupLater, setSetupLater] = useState(false)

  const totalSteps = 6
  const stepLabels: Record<number, string> = {
    1: 'Welcome',
    2: 'Business Info',
    3: 'Location',
    4: 'Services',
    5: 'Payment',
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

  const filteredCountries = Object.entries(COUNTRIES).filter(([, c]) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  )

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={totalSteps}
      stepLabel={stepLabels[step] || ''}
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
            <div className="relative mx-auto w-48 h-48">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 animate-pulse-soft" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
                <span className="text-7xl">🏪</span>
              </div>
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-2xl"
              >
                💰
              </motion.div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
                Sell on <span className="text-gradient-gold">AfriBook</span>
              </h1>
              <p className="text-text-secondary mt-3 text-lg max-w-md mx-auto">
                Reach thousands of customers and grow your business
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: TrendingUp, label: 'Reach thousands', desc: 'of customers' },
                { icon: Store, label: 'Manage bookings', desc: 'easily & fast' },
                { icon: CreditCard, label: 'Get paid', desc: 'fast & secure' },
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
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        {/* ─── Step 2: Business Info ─── */}
        {step === 2 && (
          <motion.div
            key="business"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Business Information</h2>
              <p className="text-text-secondary mt-1">Tell us about your business</p>
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
              <label className="text-sm font-medium text-text-primary">Category *</label>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-secondary border border-border text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <span className={category ? 'text-text-primary' : 'text-text-tertiary'}>
                    {category || 'Select a category'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                </button>
                {showCategoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-surface border border-border shadow-xl"
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategory(cat); setShowCategoryDropdown(false) }}
                        className={`w-full px-4 py-2.5 text-sm text-left hover:bg-surface-secondary transition-colors ${
                          category === cat ? 'bg-amber-50 text-amber-700' : 'text-text-primary'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Description *</label>
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

            <button
              onClick={next}
              disabled={!businessName || !category}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
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
              <h2 className="text-2xl font-bold text-text-primary font-heading">Business Location</h2>
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
              disabled={!city || !country}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 4: Services ─── */}
        {step === 4 && (
          <motion.div
            key="services"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Your Services</h2>
              <p className="text-text-secondary mt-1">Add at least your first 3 services</p>
            </div>

            <div className="space-y-4">
              {services.map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl border border-border bg-surface-secondary space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary text-sm">Service {i + 1}</h3>
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(i)}
                        className="p-1 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
                      <label className="text-xs font-medium text-text-secondary">Price</label>
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => updateService(i, 'price', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Duration (min)</label>
                      <input
                        type="number"
                        value={service.duration}
                        onChange={(e) => updateService(i, 'duration', e.target.value)}
                        placeholder="60"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
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

            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-secondary border border-border-light">
              <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">
                You can add more services, update pricing, and manage your offerings from the vendor dashboard later.
              </p>
            </div>

            <button
              onClick={next}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 5: Payment ─── */}
        {step === 5 && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Payment Setup</h2>
              <p className="text-text-secondary mt-1">How would you like to receive payments?</p>
            </div>

            {!setupLater ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. First Bank of Nigeria"
                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Account Number *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account number"
                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Account Holder Name *</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Name on account"
                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-secondary border border-border-light">
                  <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-text-secondary">
                    Your bank details are encrypted and stored securely. You can update them anytime from settings.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
              >
                <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">Payment setup skipped. You can configure this later in settings.</p>
              </motion.div>
            )}

            {/* Supported methods */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-3">Supported payment methods</p>
              <div className="flex gap-3">
                {PAYMENT_ICONS.map((pm) => (
                  <div
                    key={pm.name}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-secondary"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: pm.color }}
                    >
                      {pm.name[0]}
                    </div>
                    <span className="text-sm font-medium text-text-primary">{pm.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={next}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
              >
                {setupLater ? 'Continue' : 'Save & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
              {!setupLater && (
                <button
                  onClick={() => setSetupLater(true)}
                  className="px-6 py-3 rounded-xl border border-border text-text-secondary font-medium hover:bg-surface-secondary transition-colors"
                >
                  Set up later
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Step 6: All Set ─── */}
        {step === 6 && (
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
                  <Store className="w-16 h-16 text-amber-600" />
                </motion.div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-text-primary font-heading">Your business is ready!</h2>
              <p className="text-text-secondary mt-2">Here are some next steps to get the most out of AfriBook</p>
            </div>

            <div className="max-w-sm mx-auto space-y-3 text-left">
              {[
                { icon: '👤', label: 'Complete your business profile', desc: 'Add logo and cover photo' },
                { icon: '📸', label: 'Add photos to your services', desc: 'Great photos attract more customers' },
                { icon: '🕐', label: 'Set your business hours', desc: 'Let customers know when you\'re open' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-light"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.desc}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-text-tertiary ml-auto shrink-0" />
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => router.push('/vendor')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingLayout>
  )
}
