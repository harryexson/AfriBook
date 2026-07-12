'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Car, FileText, Shield, CheckCircle, ArrowRight, ArrowLeft,
  Upload, Camera, MapPin, Phone, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

interface OnboardingData {
  // Step 1: Personal
  fullName: string
  phone: string
  email: string
  dateOfBirth: string
  // Step 2: Vehicle
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  vehicleColor: string
  vehicleType: 'sedan' | 'suv' | 'motorcycle' | 'bicycle' | 'van'
  licensePlate: string
  // Step 3: Documents
  driversLicense: string | null
  vehicleRegistration: string | null
  insuranceDocument: string | null
  profilePhoto: string | null
  // Step 4: Banking
  bankName: string
  accountNumber: string
  accountName: string
  // Step 5: Location
  city: string
  countryCode: string
}

interface OnboardingWizardProps {
  countryCode: string
  onComplete: (data: OnboardingData) => Promise<void>
  className?: string
}

// ─── Steps ───────────────────────────────────────────────────

const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User, description: 'Your details' },
  { id: 'vehicle', title: 'Vehicle', icon: Car, description: 'Your vehicle' },
  { id: 'documents', title: 'Documents', icon: FileText, description: 'Verification' },
  { id: 'banking', title: 'Banking', icon: CreditCard, description: 'Get paid' },
  { id: 'location', title: 'Location', icon: MapPin, description: 'Where you drive' },
]

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'van', label: 'Van' },
]

const VEHICLE_MAKES = [
  'Toyota', 'Honda', 'Hyundai', 'Kia', 'Mercedes-Benz',
  'BMW', 'Ford', 'Nissan', 'Volkswagen', 'Suzuki',
  'Peugeot', 'Tesla', 'BYD', 'Other',
]

// ─── Component ───────────────────────────────────────────────

export default function OnboardingWizard({
  countryCode,
  onComplete,
  className,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehicleType: 'sedan',
    licensePlate: '',
    driversLicense: null,
    vehicleRegistration: null,
    insuranceDocument: null,
    profilePhoto: null,
    bankName: '',
    accountNumber: '',
    accountName: '',
    city: '',
    countryCode,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setErrors({})
  }, [])

  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Personal
        if (!data.fullName.trim()) newErrors.fullName = 'Name is required'
        if (!data.phone.trim()) newErrors.phone = 'Phone is required'
        if (!data.email.trim()) newErrors.email = 'Email is required'
        break
      case 1: // Vehicle
        if (!data.vehicleMake) newErrors.vehicleMake = 'Make is required'
        if (!data.vehicleModel.trim()) newErrors.vehicleModel = 'Model is required'
        if (!data.vehicleYear) newErrors.vehicleYear = 'Year is required'
        if (!data.vehicleColor.trim()) newErrors.vehicleColor = 'Color is required'
        if (!data.licensePlate.trim()) newErrors.licensePlate = 'License plate is required'
        break
      case 2: // Documents
        if (!data.profilePhoto) newErrors.profilePhoto = 'Profile photo is required'
        if (!data.driversLicense) newErrors.driversLicense = "Driver's license is required"
        break
      case 3: // Banking
        if (!data.bankName) newErrors.bankName = 'Bank is required'
        if (!data.accountNumber.trim()) newErrors.accountNumber = 'Account number is required'
        if (!data.accountName.trim()) newErrors.accountName = 'Account name is required'
        break
      case 4: // Location
        if (!data.city.trim()) newErrors.city = 'City is required'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [step, data])

  const nextStep = useCallback(() => {
    if (!validateStep()) return
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    }
  }, [step, validateStep])

  const prevStep = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return
    setLoading(true)
    try {
      await onComplete(data)
    } finally {
      setLoading(false)
    }
  }, [data, validateStep, onComplete])

  return (
    <div className={cn('max-w-lg mx-auto', className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = i === step
          const isComplete = i < step

          return (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-full transition-colors',
                  isComplete && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2',
                  !isActive && !isComplete && 'bg-muted text-muted-foreground',
                )}
              >
                {isComplete ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 mx-1',
                    i < step ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{STEPS[step].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {step === 0 && (
            <>
              <InputField
                label="Full Name"
                value={data.fullName}
                onChange={(v) => updateData({ fullName: v })}
                error={errors.fullName}
                placeholder="John Doe"
              />
              <InputField
                label="Phone Number"
                value={data.phone}
                onChange={(v) => updateData({ phone: v })}
                error={errors.phone}
                placeholder="+234 800 000 0000"
                icon={<Phone className="h-4 w-4" />}
              />
              <InputField
                label="Email"
                value={data.email}
                onChange={(v) => updateData({ email: v })}
                error={errors.email}
                placeholder="john@example.com"
                type="email"
              />
              <InputField
                label="Date of Birth"
                value={data.dateOfBirth}
                onChange={(v) => updateData({ dateOfBirth: v })}
                type="date"
              />
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vehicle Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {VEHICLE_TYPES.map((vt) => (
                    <button
                      key={vt.value}
                      onClick={() => updateData({ vehicleType: vt.value as OnboardingData['vehicleType'] })}
                      className={cn(
                        'rounded-lg border p-2 text-xs text-center transition-colors',
                        data.vehicleType === vt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary',
                      )}
                    >
                      {vt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Make</label>
                <select
                  value={data.vehicleMake}
                  onChange={(e) => updateData({ vehicleMake: e.target.value })}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2 text-sm',
                    errors.vehicleMake ? 'border-destructive' : 'border-border',
                  )}
                >
                  <option value="">Select make</option>
                  {VEHICLE_MAKES.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                {errors.vehicleMake && <p className="text-xs text-destructive">{errors.vehicleMake}</p>}
              </div>

              <InputField
                label="Model"
                value={data.vehicleModel}
                onChange={(v) => updateData({ vehicleModel: v })}
                error={errors.vehicleModel}
                placeholder="Corolla"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Year"
                  value={data.vehicleYear}
                  onChange={(v) => updateData({ vehicleYear: v })}
                  error={errors.vehicleYear}
                  placeholder="2022"
                />
                <InputField
                  label="Color"
                  value={data.vehicleColor}
                  onChange={(v) => updateData({ vehicleColor: v })}
                  error={errors.vehicleColor}
                  placeholder="White"
                />
              </div>
              <InputField
                label="License Plate"
                value={data.licensePlate}
                onChange={(v) => updateData({ licensePlate: v })}
                error={errors.licensePlate}
                placeholder="ABC-123-DE"
              />
            </>
          )}

          {step === 2 && (
            <>
              <DocumentUpload
                label="Profile Photo"
                value={data.profilePhoto}
                onChange={(v) => updateData({ profilePhoto: v })}
                error={errors.profilePhoto}
              />
              <DocumentUpload
                label="Driver's License"
                value={data.driversLicense}
                onChange={(v) => updateData({ driversLicense: v })}
                error={errors.driversLicense}
              />
              <DocumentUpload
                label="Vehicle Registration (optional)"
                value={data.vehicleRegistration}
                onChange={(v) => updateData({ vehicleRegistration: v })}
              />
              <DocumentUpload
                label="Insurance Document (optional)"
                value={data.insuranceDocument}
                onChange={(v) => updateData({ insuranceDocument: v })}
              />
            </>
          )}

          {step === 3 && (
            <>
              <InputField
                label="Bank Name"
                value={data.bankName}
                onChange={(v) => updateData({ bankName: v })}
                error={errors.bankName}
                placeholder="Access Bank"
              />
              <InputField
                label="Account Number"
                value={data.accountNumber}
                onChange={(v) => updateData({ accountNumber: v })}
                error={errors.accountNumber}
                placeholder="0123456789"
              />
              <InputField
                label="Account Name"
                value={data.accountName}
                onChange={(v) => updateData({ accountName: v })}
                error={errors.accountName}
                placeholder="John Doe"
              />
            </>
          )}

          {step === 4 && (
            <>
              <InputField
                label="City"
                value={data.city}
                onChange={(v) => updateData({ city: v })}
                error={errors.city}
                placeholder="Lagos"
                icon={<MapPin className="h-4 w-4" />}
              />
              <p className="text-xs text-muted-foreground">
                This helps us match you with nearby ride requests.
              </p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <button
            onClick={prevStep}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Sub-Components ──────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary',
            icon && 'pl-9',
            error ? 'border-destructive' : 'border-border',
          )}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function DocumentUpload({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string | null
  onChange: (v: string | null) => void
  error?: string
}) {
  const handleUpload = async () => {
    // In production, use expo-image-picker or similar
    // For now, simulate with a placeholder
    onChange('uploaded_' + Date.now())
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="text-sm text-primary flex-1">Uploaded</span>
          <button
            onClick={() => onChange(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          onClick={handleUpload}
          className={cn(
            'w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-primary/5',
            error ? 'border-destructive' : 'border-border',
          )}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tap to upload</span>
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
