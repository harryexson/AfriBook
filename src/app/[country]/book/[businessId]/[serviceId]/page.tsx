'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Shield, Check, Clock, MapPin, User,
  Sparkles, SearchX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCountryConfig, formatPrice } from '@/lib/localization'
import { getCurrencyForCountry } from '@/lib/money'
import type { CountryConfig } from '@/lib/localization/countries'
import { getCountryBusinesses, getCountryServices, getStaffForBusiness } from '@/lib/countries-data'
import BookingCalendar from '@/components/marketplace/BookingCalendar'
import { useAuth } from '@/hooks/useAuth'
import { zonedWallTimeToUtc, formatInTimezone } from '@/lib/time'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const businessId = (params?.businessId as string) ?? ''
  const serviceId = (params?.serviceId as string) ?? ''
  const country = getCountryConfig(countryCode) as CountryConfig | undefined
  const currencyCode = country?.currency.code ?? getCurrencyForCountry(countryCode)

  // Real lookup — this page used to render a hardcoded "Fresh Produce Box"
  // regardless of which business/service was actually clicked. Same data
  // source as the business detail page (getCountryBusinesses/Services), so
  // a barbershop's haircut now actually shows up here as a haircut.
  const business = useMemo(
    () => getCountryBusinesses(countryCode).find((b) => b.id === businessId),
    [countryCode, businessId],
  )
  const businessServices = useMemo(
    () => (business ? getCountryServices(countryCode).filter((s) => s.businessId === business.id) : []),
    [countryCode, business],
  )
  const service = useMemo(
    () => businessServices.find((s) => s.id === serviceId),
    [businessServices, serviceId],
  )
  const staff = useMemo(
    () => (business ? getStaffForBusiness(business, businessServices) : []),
    [business, businessServices],
  )

  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [selectedStaff, setSelectedStaff] = useState<string>()
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState(1)
  const [submit, setSubmit] = useState<{ state: 'idle' } | { state: 'saving' } | { state: 'error'; message: string }>({
    state: 'idle',
  })
  const [booking, setBooking] = useState<{ id: string; status: string; start: Date } | null>(null)
  const { user, authenticated } = useAuth()

  const staffSlots = useMemo(() => staff.map((s) => ({
    staffId: s.id,
    staffName: s.name,
    slots: [],
  })), [staff])

  // All hooks above run unconditionally on every render (Rules of Hooks) —
  // only branch on missing data after they've all been called.
  if (!business || !service) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8 text-text-tertiary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Service not found</h1>
          <p className="text-text-secondary mt-1">This service may no longer be available, or the link is incorrect.</p>
          <Link
            href={`/${countryCode}/search`}
            className="mt-5 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Browse services in {country?.name ?? 'this country'}
          </Link>
        </div>
      </div>
    )
  }

  // The quoted amount is exactly what POST /api/booking stores (the service
  // price). Platform fees, tax and promo codes used to be added here on the
  // client only, so the customer saw a total the booking never recorded.
  const total = service.price
  const priceCurrency = service.currencyCode ?? currencyCode

  // Catalogue/preview listings use non-database ids; /api/booking can't
  // create a booking for them, so say so instead of failing at the end.
  const isBookable = UUID.test(business.id) && UUID.test(service.id)

  // Slots follow the business's own hours for the picked weekday; a closed
  // day yields no slots.
  const dayKey = selectedDate ? WEEKDAYS[selectedDate.getDay()] : WEEKDAYS[new Date().getDay()]
  const dayHours = business.hours.find((h) => h.day === dayKey)
  const businessHours =
    !dayHours || dayHours.isClosed ? { open: '00:00', close: '00:00' } : { open: dayHours.open, close: dayHours.close }

  const canProceedStep1 = selectedDate && selectedTime
  const canProceedStep2 = authenticated
  const loginHref = `/login?redirect=${encodeURIComponent(`/${countryCode}/book/${business.id}/${service.id}`)}`

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !isBookable) return
    const [h, m] = selectedTime.split(':').map(Number)
    const start = zonedWallTimeToUtc(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate(),
      h,
      m,
      country?.timezone,
    )
    const end = new Date(start.getTime() + (service.duration || 30) * 60_000)

    setSubmit({ state: 'saving' })
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: service.id,
          staffId: selectedStaff && UUID.test(selectedStaff) ? selectedStaff : null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notes: notes.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setSubmit({ state: 'error', message: 'Your session expired — sign in again to send this booking.' })
        return
      }
      if (!res.ok) {
        setSubmit({ state: 'error', message: json.error ?? 'The booking could not be created.' })
        return
      }
      setBooking({ id: json.id, status: json.status ?? 'pending', start })
      setSubmit({ state: 'idle' })
      setStep(4)
    } catch {
      setSubmit({ state: 'error', message: 'Network error — no booking was created. Please try again.' })
    }
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
                  businessHours={businessHours}
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
                {/* Account — bookings are tied to the signed-in profile
                    (customer_id), so there's no separate contact form whose
                    values would never be sent. */}
                <div className="bg-surface rounded-2xl border border-border p-6">
                  <h2 className="text-lg font-bold font-heading text-text-primary">Your account</h2>
                  {authenticated ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Booking as <span className="font-semibold text-text-primary">{user?.name || user?.email}</span>.
                      {business.name} will see your profile contact details.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-text-secondary">Sign in so {business.name} knows who&apos;s booking.</p>
                      <Link
                        href={loginHref}
                        className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        Sign in to continue
                      </Link>
                    </div>
                  )}
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
                    { icon: User, label: 'Customer', value: user?.name || user?.email || '' },
                    { icon: Clock, label: 'Date & Time', value: selectedDate ? `${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${selectedTime}` : '' },
                    { icon: Clock, label: 'Duration', value: `${service.duration} minutes` },
                    { icon: MapPin, label: 'Location', value: business.address?.formatted || `${business.address?.city ?? ''}, ${country?.name ?? ''}` },
                    { icon: User, label: 'Staff', value: staff.find((s) => s.id === selectedStaff)?.name ?? 'Any available' },
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

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-text-secondary">Price</span>
                  <span className="font-mono text-lg font-bold tabular-nums text-text-primary">
                    {formatPrice(total, priceCurrency)}
                  </span>
                </div>
                <p className="-mt-3 text-xs text-text-tertiary">
                  You won&apos;t be charged now. Your request goes to {business.name}, who confirms the time.
                </p>

                {!isBookable && (
                  <p role="note" className="rounded-xl bg-surface-secondary p-3 text-sm text-text-secondary">
                    This is a preview listing. Online booking opens once {business.name} is set up on AfriBook.
                  </p>
                )}

                {submit.state === 'error' && (
                  <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {submit.message}
                    {!authenticated && (
                      <>
                        {' '}
                        <Link href={loginHref} className="font-semibold underline">
                          Sign in
                        </Link>
                      </>
                    )}
                  </p>
                )}

                <button
                  onClick={handleBook}
                  disabled={!isBookable || submit.state === 'saving'}
                  className="w-full rounded-xl bg-amber-500 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-surface-tertiary disabled:text-text-tertiary"
                >
                  {submit.state === 'saving'
                    ? 'Sending request…'
                    : `Request booking · ${formatPrice(total, priceCurrency)}`}
                </button>

                <button onClick={() => setStep(2)} className="w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors">
                  &larr; Edit details
                </button>
              </motion.div>
            )}

            {/* Step 4: request sent — reflects the stored booking, which is
                still pending until the business confirms it. */}
            {step === 4 && booking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 rounded-2xl border border-border bg-surface p-8 text-center"
              >
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-olive-50 text-olive-600">
                  <Check className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Booking request sent</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {service.name} at {business.name}
                  </p>
                </div>
                <dl className="mx-auto max-w-sm space-y-2 rounded-2xl bg-surface-secondary p-4 text-left text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">When</dt>
                    <dd className="text-right font-medium text-text-primary">
                      {formatInTimezone(booking.start, country?.timezone, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Status</dt>
                    <dd className="font-medium capitalize text-text-primary">{booking.status} — awaiting the business</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Reference</dt>
                    <dd className="font-mono text-xs text-text-primary">{booking.id.slice(0, 8).toUpperCase()}</dd>
                  </div>
                </dl>
                <Link
                  href="/account"
                  className="inline-flex rounded-full bg-dark-300 px-6 py-3 text-sm font-semibold text-white hover:bg-dark-200"
                >
                  Go to my account
                </Link>
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
                  <span className="font-semibold text-text-primary">{formatPrice(service.price, priceCurrency)}</span>
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
