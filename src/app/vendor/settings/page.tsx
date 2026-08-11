'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Building2, Bell, Shield, Palette, Globe, Check, Save,
  Mail, Phone, MapPin, Clock, Store, CreditCard, Ban,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const SECTIONS = [
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'contact', label: 'Contact & Location', icon: MapPin },
  { id: 'hours', label: 'Opening Hours', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payments', label: 'Payments & Payouts', icon: CreditCard },
  { id: 'security', label: 'Security & Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function VendorSettingsPage() {
  const [active, setActive] = useState('profile')
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={ITEM}>
          <h1 className="text-2xl font-bold font-heading text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your business profile, notifications and preferences.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section nav */}
          <motion.aside variants={ITEM} className="lg:col-span-1">
            <nav className="space-y-1 lg:sticky lg:top-20">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active === s.id
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  )}
                >
                  <s.icon className="w-4.5 h-4.5 shrink-0" />
                  {s.label}
                </button>
              ))}
            </nav>
          </motion.aside>

          {/* Panel */}
          <motion.div variants={ITEM} className="lg:col-span-3">
            <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
              {active === 'profile' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold">
                      L
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Business Logo</h3>
                      <p className="text-sm text-text-secondary mt-1">Upload a square image, PNG or JPG.</p>
                      <div className="flex gap-2 mt-3">
                        <button className="px-3.5 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">Upload</button>
                        <button className="px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:border-amber-500/40 hover:text-text-primary transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Business Name" defaultValue="Lagos Fresh Market" icon={Store} />
                    <Field label="Tagline" defaultValue="Fresh from farm to door" icon={Building2} />
                    <Field label="Category" defaultValue="Food & Dining" icon={Store} />
                    <Field label="VAT / Tax ID" defaultValue="" icon={CreditCard} />
                  </div>
                </div>
              )}

              {active === 'contact' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Phone Number" defaultValue="+234 800 123 4567" icon={Phone} />
                  <Field label="Email Address" defaultValue="hello@lagosfreshmarket.ng" icon={Mail} />
                  <div className="sm:col-span-2">
                    <Field label="Street Address" defaultValue="12 Ahmadu Bello Way, Lagos" icon={MapPin} />
                  </div>
                  <Field label="City" defaultValue="Lagos" icon={MapPin} />
                  <Field label="Country" defaultValue="Nigeria" icon={Globe} />
                </div>
              )}

              {active === 'hours' && (
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                    <div key={day} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-surface-secondary border border-border">
                      <div className="flex items-center gap-3">
                        <span className={cn('w-2 h-2 rounded-full', i < 6 ? 'bg-emerald-500' : 'bg-red-500')} />
                        <span className="text-sm font-medium text-text-primary">{day}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {i === 6 ? (
                          <span className="text-sm text-text-tertiary">Closed</span>
                        ) : (
                          <>
                            <input type="time" defaultValue={i === 5 ? '09:00' : '08:00'} className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-sm text-text-primary" />
                            <span className="text-text-tertiary">to</span>
                            <input type="time" defaultValue={i === 5 ? '18:00' : '19:00'} className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-sm text-text-primary" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {active === 'notifications' && (
                <div className="space-y-3">
                  <ToggleRow title="New bookings" description="Get notified when a customer books your services." defaultOn />
                  <ToggleRow title="New orders" description="Get notified for every marketplace order." defaultOn />
                  <ToggleRow title="Low stock alerts" description="Alerts when product inventory runs low." />
                  <ToggleRow title="Payout notifications" description="Updates on payouts, settlements and earnings." defaultOn />
                  <ToggleRow title="Marketing tips" description="Occasional tips to grow your business." />
                </div>
              )}

              {active === 'payments' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">Payout Account</p>
                        <p className="text-xs text-text-secondary">GTBank •••• 4521</p>
                      </div>
                    </div>
                    <button className="text-sm font-medium text-amber-500 hover:text-amber-600">Change</button>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                        <Ban className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">Payout Pause</p>
                        <p className="text-xs text-text-secondary">Temporarily pause automatic payouts</p>
                      </div>
                    </div>
                    <button className="px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:border-red-500/40 hover:text-red-500 transition-colors">Pause</button>
                  </div>
                </div>
              )}

              {active === 'security' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border">
                    <p className="font-semibold text-text-primary text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-text-secondary mt-1">Add an extra layer of security to your account.</p>
                    <button className="mt-3 px-3.5 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">Enable 2FA</button>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border">
                    <p className="font-semibold text-text-primary text-sm">Login Activity</p>
                    <p className="text-xs text-text-secondary mt-1">Review recent logins to your vendor account.</p>
                    <button className="mt-3 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:border-amber-500/40 hover:text-text-primary transition-colors">View activity</button>
                  </div>
                </div>
              )}

              {active === 'appearance' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm mb-3">Accent Color</h4>
                    <div className="flex gap-3">
                      {['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'].map((c) => (
                        <button key={c} className="w-10 h-10 rounded-full border-4 border-surface shadow" style={{ backgroundColor: c, boxShadow: `0 0 0 2px ${c === '#F59E0B' ? c : 'transparent'}` }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm mb-3">Booking Page Theme</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {['Light', 'Dark', 'Amber'].map((t, i) => (
                        <button key={t} className={cn('p-4 rounded-xl border-2 text-sm font-medium transition-all', i === 0 ? 'border-amber-500 text-amber-600' : 'border-border text-text-secondary hover:border-amber-500/40')}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save bar */}
              <div className="mt-8 pt-5 border-t border-border flex items-center justify-end gap-3">
                <button className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:border-amber-500/40 hover:text-text-primary transition-colors">
                  Cancel
                </button>
                <button
                  onClick={save}
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors',
                    saved ? 'bg-emerald-500' : 'bg-amber-500 hover:bg-amber-600'
                  )}
                >
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Saved!' : 'Save changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function Field({ label, defaultValue, icon: Icon }: { label: string; defaultValue: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <input
        type="text"
        defaultValue={defaultValue}
        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
      />
    </label>
  )
}

function ToggleRow({ title, description, defaultOn = false }: { title: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border">
      <div>
        <p className="font-semibold text-text-primary text-sm">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0',
          on ? 'bg-amber-500' : 'bg-surface-tertiary'
        )}
        aria-pressed={on}
      >
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  )
}
