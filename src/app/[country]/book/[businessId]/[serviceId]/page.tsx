'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Shield, Check, Clock, MapPin, User,
  Sparkles,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import { getCurrencyForCountry } from '@/lib/money'
import type { CountryConfig } from '@/lib/localization/countries'
import BookingCalendar from '@/components/marketplace/BookingCalendar'
import PriceBreakdown from '@/components/marketplace/PriceBreakdown'
import type { PriceLineItem } from '@/components/marketplace/PriceBreakdown'
import type { Service, Staff } from '@/types'

const MOCK_SERVICE: Service = {
  id: 's1', businessId: 'b1', name: 'Fresh Produce Box', description: 'Assorted seasonal fruits and vegetables - enough for a family of 4 for a week. Includes tomatoes, onions, peppers, leafy greens, and seasonal fruits.', duration: 30, price: 3500, currencyCode: 'NGN', category: 'Food & Dining', available: true, maxCapacityPerSlot: 10, paddingMinutes: 0, createdAt: '', updatedAt: '',
}

const MOCK_ADDONS = [
  { id: 'a1', name: 'Premium Fruit Upgrade', price: 2000 },
  { id: 'a2', name: 'Express Delivery', price: 1500 },
  { id: 'a3', name: 'Gift Wrapping', price: 500 },
]

const MOCK_STAFF: Staff[] = [
  { id: 'st1', businessId: 'b1', userId: '', name: 'Adebayo Ola', role: 'Senior Farmer', email: 'ade@lagosfreshmarket.ng', phone: '+234 800 111 2222', avatarUrl: '', schedule: [{ day: 'mon', start: '07:00', end: '15:00', isAvailable: true }, { day: 'tue', start: '07:00', end: '15:00', isAvailable: true }, { day: 'wed', start: '07:00', end: '15:00', isAvailable: true }, { day: 'thu', start: '07:00', end: '15:00', isAvailable: true }, { day: 'fri', start: '07:00', end: '14:00', isAvailable: true }, { day: 'sat', start: '08:00', end: '13:00', isAvailable: true }, { day: 'sun', start: '00:00', end: '00:00', isAvailable: false }], serviceIds: ['s1', 's2'], isActive: true, bio: '', rating: 4.9, createdAt: '', updatedAt: '' },
  { id: 'st2', businessId: 'b1', userId: '', name: 'Chioma Eze', role: 'Produce Specialist', email: 'chioma@lagosfreshmarket.ng', phone: '+234 800 333 4444', avatarUrl: '', schedule: [{ day: 'mon', start: '09:00', close: '17:00', isAvailable: true }, { day: 'tue', start: '09:00', close: '17:00', isAvailable: true }, { day: 'wed', start: '09:00', close: '17:00', isAvailable: true }, { day: 'thu', start: '09:00', close: '17:00', isAvailable: true }, { day: 'fri', start: '09:00', close: '16:00', isAvailable: true }, { day: 'sat', start: '10:00', close: '15:00', isAvailable: true }, { day: 'sun', start: '00:00', close: '00:00', isAvailable: false }], serviceIds: ['s3', 's4'], isActive: true, bio: '', rating: 4.8, createdAt: '', updatedAt: '' },
]

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const country = getCountryConfig(countryCode) as CountryConfig | undefined
  const currencyCode = country?.currency.code ?? getCurrencyForCountry(countryCode)

  const service = MOCK_SERVICE

  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [selectedStaff, setSelectedStaff] = useState<string>()
  const [addons, setAddons] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  const staffSlots = useMemo(() => MOCK_STAFF.map((s) => ({
    staffId: s.id,
    staffName: s.name,
    slots: [],
  })), [])

  const addonTotal = useMemo(() => {
    return MOCK_ADDONS.filter((a) => addons.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
  }, [addons])

  const subtotal = service.price + addonTotal
  const platformFee = subtotal * 0.1
  const taxRate = country?.taxRate ?? 0.075
  const tax = subtotal * taxRate
  const discount = promoApplied ? subtotal * 0.1 : 0
  const total = subtotal + platformFee + tax - discount

  const priceItems: PriceLineItem[] = [
    { label: service.name, amount: service.price, type: 'subtotal' },
    ...addons.filter((a) => addons.includes(a)).map((a) => {
      const addon = MOCK_ADDONS.find((ad) => ad.id === a)
      return addon ? { label: addon.name, amount: addon.price } as PriceLineItem : null
    }).filter(Boolean) as PriceLineItem[],
    { label: 'Platform fee (10%)', amount: platformFee, type: 'fee' },
    { label: country?.taxName ?? 'Tax', amount: tax, type: 'tax' },
    ...(discount > 0 ? [{ label: 'Discount', amount: discount, type: 'discount' as const }] : []),
    { label: 'Total', amount: total, type: 'total' },
  ]

  const handlePromoApply = (code: string) => {
    if (code.toLowerCase() === 'welcome20') {
      setPromoCode(code)
      setPromoApplied(true)
      setPromoError(null)
    } else {
      setPromoError('Invalid promo code')
    }
  }

  const canProceedStep1 = selectedDate && selectedTime
  const canProceedStep2 = customerName && customerEmail

  const handleBook = () => {
    console.log('Booking confirmed:', { service: service.id, staff: selectedStaff, date: selectedDate, time: selectedTime, addons, notes, total })
    router.push(`/${params?.country}/order/${'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase()}`)
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[{ num: 1, label: 'Date & Time' }, { num: 2, label: 'Details' }, { num: 3, label: 'Confirm' }].map((s, i) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                step >= s.num ? 'bg-amber-500 text-white' : 'bg-surface-tertiary text-text-tertiary'
              )}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={cn('text-sm font-medium hidden sm:block', step >= s.num ? 'text-text-primary' : 'text-text-tertiary')}>{s.label}</span>
              {i < 2 && <div className={cn('w-8 h-0.5', step > s.num ? 'bg-amber-500' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step 1: Date, Time, Staff */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface rounded-2xl border border-border p-6"
              >
                <h2 className="text-lg font-bold font-heading text-text-primary mb-1">Choose your appointment</h2>
                <p className="text-sm text-text-secondary mb-6">{service.name} &middot; {service.duration} min</p>

                <BookingCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                  businessHours={{ open: '07:00', close: '18:00' }}
                  duration={service.duration || 30}
                  staffSlots={staffSlots}
                  selectedStaffId={selectedStaff}
                  onStaffSelect={setSelectedStaff}
                  timezone={country?.timezone}
                />

                <div className="flex justify-end mt-8">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className={cn(
                      'px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                      canProceedStep1 ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
                    )}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Contact Info */}
                <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
                  <h2 className="text-lg font-bold font-heading text-text-primary">Your details</h2>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={country?.phoneFormat ?? '+234 XXX XXX XXXX'}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* Add-ons */}
                <div className="bg-surface rounded-2xl border border-border p-6">
                  <h2 className="text-lg font-bold font-heading text-text-primary mb-4">Add-ons</h2>
                  <div className="space-y-3">
                    {MOCK_ADDONS.map((addon) => (
                      <label key={addon.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border cursor-pointer hover:border-amber-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={addons.includes(addon.id)}
                            onChange={() => setAddons((prev) => prev.includes(addon.id) ? prev.filter((a) => a !== addon.id) : [...prev, addon.id])}
                            className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30"
                          />
                          <span className="text-sm font-medium text-text-primary">{addon.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-text-primary">+{formatCurrency(addon.price, service.currencyCode ?? currencyCode)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-surface rounded-2xl border border-border p-6">
                  <h2 className="text-lg font-bold font-heading text-text-primary mb-4">Notes</h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or instructions..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(1)} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                    &larr; Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className={cn(
                      'px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                      canProceedStep2 ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
                    )}
                  >
                    Continue to review
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface rounded-2xl border border-border p-6 space-y-6"
              >
                <h2 className="text-lg font-bold font-heading text-text-primary">Review your booking</h2>

                {/* Summary */}
                <div className="space-y-3">
                  {[
                    { icon: User, label: 'Customer', value: customerName },
                    { icon: Clock, label: 'Date & Time', value: selectedDate ? `${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${selectedTime}` : '' },
                    { icon: Clock, label: 'Duration', value: `${service.duration} minutes` },
                    { icon: MapPin, label: 'Location', value: 'Victoria Island, Lagos' },
                    { icon: User, label: 'Staff', value: MOCK_STAFF.find((s) => s.id === selectedStaff)?.name ?? 'Any available' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <item.icon className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-text-secondary">{item.label}:</span>
                      <span className="font-medium text-text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>

                {notes && (
                  <div className="p-3 rounded-xl bg-surface-secondary text-sm text-text-secondary">
                    <span className="font-medium">Notes:</span> {notes}
                  </div>
                )}

                <PriceBreakdown
                  items={priceItems}
                  currencyCode={service.currencyCode ?? currencyCode}
                  promoCode={promoCode}
                  onApplyPromo={handlePromoApply}
                  onRemovePromo={() => { setPromoCode(null); setPromoApplied(false); setPromoError(null) }}
                  promoError={promoError}
                  promoApplied={promoApplied}
                  platformFeePercent={10}
                />

                <button
                  onClick={handleBook}
                  className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-base hover:bg-amber-600 transition-all shadow-sm"
                >
                  Book Now &middot; {formatCurrency(total, service.currencyCode ?? currencyCode)}
                </button>

                <button onClick={() => setStep(2)} className="w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors">
                  &larr; Edit details
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar summary (desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24 bg-surface rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">{service.name}</h3>
                  <p className="text-xs text-text-secondary line-clamp-2">{service.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Duration</span>
                  <span className="font-medium text-text-primary">{service.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Price</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(service.price, service.currencyCode ?? currencyCode)}</span>
                </div>
                {step >= 1 && selectedDate && selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Appointment</span>
                    <span className="font-medium text-text-primary text-right">
                      {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <br />{selectedTime}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <Shield className="w-3.5 h-3.5" />
                  Your booking is protected by AfriBook&apos;s secure platform
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
