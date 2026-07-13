'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingLayout } from '@/components/onboarding'
import {
  Car, Bike, Truck, Upload, Camera, FileText,
  ArrowRight, CheckCircle2, Clock, ShieldCheck, UserCheck,
  ChevronDown, Info, DollarSign, Calendar,
} from 'lucide-react'

const VEHICLE_TYPES = [
  { id: 'car', label: 'Car', icon: Car },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'bicycle', label: 'Bicycle', icon: Bike },
  { id: 'van', label: 'Van', icon: Truck },
]

const PAYOUT_OPTIONS = ['Weekly', 'Bi-weekly']

interface DocUpload {
  name: string
  file: File | null
  preview: string
}

export default function DriverOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [showBack, setShowBack] = useState(false)

  // Step 2 - Personal
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')

  // Step 3 - Vehicle
  const [vehicleType, setVehicleType] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [color, setColor] = useState('')
  const [licensePlate, setLicensePlate] = useState('')

  // Step 4 - Documents
  const [documents, setDocuments] = useState<Record<string, DocUpload>>({
    license: { name: "Driver's License", file: null, preview: '' },
    registration: { name: 'Vehicle Registration', file: null, preview: '' },
    insurance: { name: 'Insurance Document', file: null, preview: '' },
    profilePhoto: { name: 'Profile Photo', file: null, preview: '' },
  })

  // Step 5 - Banking
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [payoutSchedule, setPayoutSchedule] = useState('Weekly')
  const [setupLater, setSetupLater] = useState(false)

  const totalSteps = 6
  const stepLabels: Record<number, string> = {
    1: 'Welcome',
    2: 'Personal Info',
    3: 'Vehicle',
    4: 'Documents',
    5: 'Banking',
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

  const handleFileUpload = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocuments((prev) => ({
        ...prev,
        [docKey]: {
          ...prev[docKey],
          file,
          preview: file.name,
        },
      }))
    }
  }

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
                <span className="text-7xl">🚗</span>
              </div>
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-2xl"
              >
                💵
              </motion.div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
                Drive with <span className="text-gradient-gold">AfriBook</span>
              </h1>
              <p className="text-text-secondary mt-3 text-lg max-w-md mx-auto">
                Earn money on your own schedule
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: DollarSign, label: 'Earn on your', desc: 'schedule' },
                { icon: Calendar, label: 'Flexible', desc: 'hours' },
                { icon: Clock, label: 'Weekly', desc: 'payouts' },
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

            {/* Earnings stat */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-amber-50 border border-amber-200"
            >
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Average earnings: $500/week</span>
            </motion.div>

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

        {/* ─── Step 2: Personal Info ─── */}
        {step === 2 && (
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Personal Information</h2>
              <p className="text-text-secondary mt-1">Tell us about yourself</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
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
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Date of Birth *</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your residential address"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              onClick={next}
              disabled={!fullName || !phone}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 3: Vehicle ─── */}
        {step === 3 && (
          <motion.div
            key="vehicle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Vehicle Information</h2>
              <p className="text-text-secondary mt-1">What will you be driving?</p>
            </div>

            {/* Vehicle type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Vehicle Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VEHICLE_TYPES.map((vt) => (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => setVehicleType(vt.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      vehicleType === vt.id
                        ? 'border-amber-500 bg-amber-50 shadow-md'
                        : 'border-border bg-surface hover:border-amber-300'
                    }`}
                  >
                    <vt.icon className={`w-6 h-6 ${vehicleType === vt.id ? 'text-amber-600' : 'text-text-secondary'}`} />
                    <span className={`text-sm font-medium ${vehicleType === vt.id ? 'text-amber-700' : 'text-text-primary'}`}>
                      {vt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Make *</label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g. Toyota"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Model *</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Corolla"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Year *</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2020"
                  min={1990}
                  max={2026}
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Color *</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Silver"
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">License Plate *</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="e.g. ABC-123-DE"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all uppercase tracking-wider"
              />
            </div>

            <button
              onClick={next}
              disabled={!vehicleType || !make || !model}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Step 4: Documents ─── */}
        {step === 4 && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Upload Documents</h2>
              <p className="text-text-secondary mt-1">We need a few documents to verify your identity</p>
            </div>

            <div className="space-y-3">
              {Object.entries(documents).map(([key, doc], i) => (
                <motion.label
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-border hover:border-amber-300 bg-surface-secondary cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(key, e)}
                  />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    doc.file ? 'bg-green-100 text-green-600' : 'bg-surface-tertiary text-text-tertiary'
                  }`}>
                    {doc.file ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : key === 'profilePhoto' ? (
                      <Camera className="w-6 h-6" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{doc.name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {doc.file ? doc.preview : 'Tap to upload (JPG, PNG, or PDF)'}
                    </p>
                  </div>
                  {doc.file && (
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  )}
                </motion.label>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-secondary border border-border-light">
              <ShieldCheck className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">
                Your documents are encrypted and stored securely. They are only used for verification purposes.
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

        {/* ─── Step 5: Banking ─── */}
        {step === 5 && (
          <motion.div
            key="banking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Banking Details</h2>
              <p className="text-text-secondary mt-1">How would you like to get paid?</p>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Payout Schedule</label>
                  <div className="flex gap-3">
                    {PAYOUT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPayoutSchedule(opt)}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          payoutSchedule === opt
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-border bg-surface-secondary text-text-secondary hover:border-amber-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
              >
                <DollarSign className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">Banking setup skipped. You can add this later in settings.</p>
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
                  <Car className="w-16 h-16 text-amber-600" />
                </motion.div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-text-primary font-heading">Application submitted!</h2>
              <p className="text-text-secondary mt-2">We&apos;ll review your information and get back to you soon</p>
            </div>

            <div className="max-w-sm mx-auto space-y-3 text-left">
              {[
                { icon: FileText, label: 'Document review', desc: '1-2 business days', color: 'text-blue-500 bg-blue-50' },
                { icon: Car, label: 'Vehicle inspection', desc: 'Scheduled after approval', color: 'text-amber-500 bg-amber-50' },
                { icon: UserCheck, label: 'Account activation', desc: 'Start earning immediately', color: 'text-green-500 bg-green-50' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-light"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => router.push('/driver')}
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

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
