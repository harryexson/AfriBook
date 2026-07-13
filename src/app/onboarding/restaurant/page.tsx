'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingLayout } from '@/components/onboarding'
import { COUNTRIES } from '@/lib/localization/countries'
import {
  UtensilsCrossed, Plus, Trash2, ChevronDown,
  ArrowRight, CheckCircle2, Info, Clock,
  MapPin, CreditCard, DollarSign, Globe,
} from 'lucide-react'

const CUISINE_TYPES = [
  'African', 'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese',
  'Thai', 'Mediterranean', 'American', 'Korean', 'French', 'Local',
]

const MENU_CATEGORIES = ['Appetizers', 'Mains', 'Desserts', 'Drinks']

interface MenuItem {
  name: string
  description: string
  price: string
  category: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export default function RestaurantOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [showBack, setShowBack] = useState(false)

  // Step 2 - Restaurant Info
  const [restaurantName, setRestaurantName] = useState('')
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // Step 3 - Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: '', description: '', price: '', category: 'Mains' },
    { name: '', description: '', price: '', category: 'Mains' },
    { name: '', description: '', price: '', category: 'Drinks' },
  ])

  // Step 4 - Operations
  const [operatingDays, setOperatingDays] = useState<Record<string, boolean>>({
    Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false,
  })
  const [deliveryRadius, setDeliveryRadius] = useState(10)
  const [minimumOrder, setMinimumOrder] = useState('')
  const [acceptPreOrders, setAcceptPreOrders] = useState(false)

  // Step 5 - Payment
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [setupLater, setSetupLater] = useState(false)

  const totalSteps = 6
  const stepLabels: Record<number, string> = {
    1: 'Welcome',
    2: 'Restaurant Info',
    3: 'Menu Setup',
    4: 'Operations',
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

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    )
  }

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string) => {
    const updated = [...menuItems]
    updated[index] = { ...updated[index], [field]: value }
    setMenuItems(updated)
  }

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', description: '', price: '', category: 'Mains' }])
  }

  const removeMenuItem = (index: number) => {
    if (menuItems.length > 1) {
      setMenuItems(menuItems.filter((_, i) => i !== index))
    }
  }

  const toggleDay = (day: string) => {
    setOperatingDays((prev) => ({ ...prev, [day]: !prev[day] }))
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
                <span className="text-7xl">🍜</span>
              </div>
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-2xl"
              >
                🛵
              </motion.div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
                Sell food on <span className="text-gradient-gold">AfriBook</span>
              </h1>
              <p className="text-text-secondary mt-3 text-lg max-w-md mx-auto">
                Reach food lovers in your area and grow your restaurant
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: UtensilsCrossed, label: 'Reach food lovers', desc: 'in your area' },
                { icon: Clock, label: 'Manage orders', desc: 'easily & fast' },
                { icon: MapPin, label: 'Delivery support', desc: 'built-in' },
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

        {/* ─── Step 2: Restaurant Info ─── */}
        {step === 2 && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Restaurant Information</h2>
              <p className="text-text-secondary mt-1">Tell us about your restaurant</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Restaurant Name *</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. Mama Africa Kitchen"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Cuisine Type * (select multiple)</label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_TYPES.map((cuisine) => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      selectedCuisines.includes(cuisine)
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-amber-300'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your restaurant and specialties..."
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
                  placeholder="restaurant@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Restaurant address"
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
                <label className="text-sm font-medium text-text-primary">Country *</label>
                <div className="relative">
                  <button
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-secondary border border-border text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <span className={country ? 'text-text-primary' : 'text-text-tertiary'}>
                      {country ? `${COUNTRIES[country]?.flag} ${COUNTRIES[country]?.name}` : 'Select'}
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
            </div>

            <button
              onClick={next}
              disabled={!restaurantName || selectedCuisines.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 3: Menu Setup ─── */}
        {step === 3 && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Menu Setup</h2>
              <p className="text-text-secondary mt-1">Add at least 3 sample menu items</p>
            </div>

            <div className="space-y-4">
              {menuItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl border border-border bg-surface-secondary space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary text-sm">Item {i + 1}</h3>
                    {menuItems.length > 1 && (
                      <button
                        onClick={() => removeMenuItem(i)}
                        className="p-1 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateMenuItem(i, 'name', e.target.value)}
                    placeholder="Item name"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) => updateMenuItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Price</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateMenuItem(i, 'price', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateMenuItem(i, 'category', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {MENU_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={addMenuItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-amber-300 text-text-secondary hover:text-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Menu Item
            </button>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-secondary border border-border-light">
              <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">
                You can add more items, photos, and manage your menu from the restaurant dashboard later.
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

        {/* ─── Step 4: Operations ─── */}
        {step === 4 && (
          <motion.div
            key="operations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Operations</h2>
              <p className="text-text-secondary mt-1">Set your operating hours and delivery options</p>
            </div>

            {/* Operating hours */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-primary">Operating Days</label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      operatingDays[day]
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-border bg-surface-secondary text-text-tertiary'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery radius */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Delivery Radius</label>
                <span className="text-sm font-semibold text-amber-600">{deliveryRadius} km</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={deliveryRadius}
                onChange={(e) => setDeliveryRadius(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Minimum order */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Minimum Order Amount</label>
              <input
                type="number"
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Pre-orders toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-border-light">
              <div>
                <p className="text-sm font-medium text-text-primary">Accept Pre-orders</p>
                <p className="text-xs text-text-tertiary mt-0.5">Allow customers to order for later</p>
              </div>
              <button
                type="button"
                onClick={() => setAcceptPreOrders(!acceptPreOrders)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  acceptPreOrders ? 'bg-amber-500' : 'bg-border'
                }`}
              >
                <motion.div
                  animate={{ x: acceptPreOrders ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
                />
              </button>
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
                    placeholder="Name on the account"
                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
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
                  <UtensilsCrossed className="w-16 h-16 text-amber-600" />
                </motion.div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-text-primary font-heading">Your restaurant is ready!</h2>
              <p className="text-text-secondary mt-2">Here are some next steps to start receiving orders</p>
            </div>

            <div className="max-w-sm mx-auto space-y-3 text-left">
              {[
                { icon: '📸', label: 'Add menu photos', desc: 'Appetizing photos sell more' },
                { icon: '🕐', label: 'Set opening hours', desc: 'Let customers know when you\'re open' },
                { icon: '🧪', label: 'Test ordering', desc: 'Place a test order to see the flow' },
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
