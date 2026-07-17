'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User, Bell, Lock, MapPin, Wallet, Eye, EyeOff,
  Save, ChevronRight, Globe, Phone, Mail,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  maxTripDistance: z.number().min(1).max(200),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
})

type ProfileForm = z.infer<typeof profileSchema>

const NOTIFICATION_OPTIONS = [
  { id: 'new_trip', label: 'New trip requests', description: 'Get notified when a new trip is available' },
  { id: 'trip_updates', label: 'Trip status updates', description: 'Pickup confirmations, delivery updates' },
  { id: 'earnings', label: 'Earnings reports', description: 'Daily and weekly earnings summaries' },
  { id: 'payouts', label: 'Payout notifications', description: 'When your earnings are paid out' },
  { id: 'promotions', label: 'Promotions & bonuses', description: 'Special offers and incentive programs' },
  { id: 'system', label: 'System announcements', description: 'App updates and policy changes' },
]

export default function DriverSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState(NOTIFICATION_OPTIONS.map((n) => n.id))
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+234 801 234 5678',
      maxTripDistance: 50,
      workingHoursStart: '08:00',
      workingHoursEnd: '20:00',
    },
  })

  const handleProfileSave = async (data: ProfileForm) => {
    setSaving(true)
    // In real app: save to API
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
  }

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    )
  }

  const sections = [
    { id: 'profile', icon: User, label: 'Profile', desc: 'Personal information' },
    { id: 'availability', icon: MapPin, label: 'Availability', desc: 'Trip preferences & hours' },
    { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Push & email preferences' },
    { id: 'payment', icon: Wallet, label: 'Payment Account', desc: 'Bank & mobile money details' },
    { id: 'privacy', icon: Lock, label: 'Privacy', desc: 'Data sharing & visibility' },
  ]

  const [activeSection, setActiveSection] = useState(sections[0].id)

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your account and preferences</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section nav */}
        <motion.div variants={ITEM} className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal',
                  activeSection === section.id
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                )}
              >
                <section.icon className={cn(
                  'w-5 h-5 shrink-0',
                  activeSection === section.id ? 'text-amber-600 dark:text-amber-400' : 'text-text-tertiary'
                )} />
                <div className="hidden lg:block text-left">
                  <p className="font-medium">{section.label}</p>
                  <p className="text-xs text-text-tertiary font-normal">{section.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Settings content */}
        <motion.div variants={ITEM} className="flex-1 min-w-0">
          <div className="rounded-2xl bg-surface border border-border p-5 sm:p-6">
            {activeSection === 'profile' && (
              <form onSubmit={handleSubmit(handleProfileSave)} className="space-y-5">
                <h3 className="text-lg font-semibold text-text-primary font-heading">Profile</h3>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl font-bold">
                    JD
                  </div>
                  <div>
                    <button className="px-4 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-all">
                      Change photo
                    </button>
                    <p className="text-xs text-text-tertiary mt-1">JPG, GIF or PNG. 500KB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Full name</label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                      <select className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all appearance-none cursor-pointer">
                        <option>Nigeria</option>
                        <option>Kenya</option>
                        <option>Ghana</option>
                        <option>South Africa</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password change */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Change password
                    <ChevronRight className={cn('w-4 h-4 transition-transform', showPasswordForm && 'rotate-90')} />
                  </button>

                  {showPasswordForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Current password</label>
                        <input
                          type="password"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-text-secondary">New password</label>
                          <input
                            type="password"
                            value={passwordData.newPass}
                            onChange={(e) => setPasswordData({ ...passwordData, newPass: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-text-secondary">Confirm password</label>
                          <input
                            type="password"
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'availability' && (
              <form onSubmit={handleSubmit(handleProfileSave)} className="space-y-5">
                <h3 className="text-lg font-semibold text-text-primary font-heading">Availability</h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Maximum trip distance (km)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="200"
                      {...register('maxTripDistance', { valueAsNumber: true })}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="text-sm font-semibold text-text-primary w-12 text-right">
                      {50} km
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">You won&apos;t receive trip requests beyond this distance</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Working hours start</label>
                    <input
                      type="time"
                      {...register('workingHoursStart')}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Working hours end</label>
                    <input
                      type="time"
                      {...register('workingHoursEnd')}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20">
                  <p className="text-xs text-text-secondary">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Note:</span> Your availability affects the trip requests you receive. You can go online/offline anytime from the dashboard.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-text-primary font-heading">Notifications</h3>
                <div className="space-y-2">
                  {NOTIFICATION_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{option.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{option.description}</p>
                      </div>
                      <div
                        onClick={() => toggleNotification(option.id)}
                        className={cn(
                          'w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer shrink-0',
                          notifications.includes(option.id) ? 'bg-amber-500' : 'bg-surface-tertiary'
                        )}
                      >
                        <div className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          notifications.includes(option.id) ? 'translate-x-5' : 'translate-x-0'
                        )} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'payment' && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-text-primary font-heading">Payment Account</h3>

                <div className="p-4 rounded-xl bg-surface-secondary border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-semibold text-text-primary">Bank Account</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary">Bank name</label>
                      <input
                        type="text"
                        defaultValue="GTBank"
                        className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary">Account name</label>
                      <input
                        type="text"
                        defaultValue="John Doe"
                        className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary">Account number</label>
                      <input
                        type="text"
                        defaultValue="0123456789"
                        className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary">Mobile money</label>
                      <input
                        type="text"
                        defaultValue="+234 801 234 5678"
                        className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98]">
                  <Save className="w-4 h-4" />
                  Save Payment Details
                </button>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-text-primary font-heading">Privacy</h3>

                <div className="space-y-3">
                  {[
                    { id: 'show_profile', label: 'Show profile to customers', desc: 'Let customers see your name and photo after accepting a trip' },
                    { id: 'share_location', label: 'Share live location', desc: 'Share your real-time location during trips' },
                    { id: 'data_collection', label: 'Usage data collection', desc: 'Help us improve by sharing anonymous usage data' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{item.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                      </div>
                      <div className="w-11 h-6 rounded-full bg-amber-500 transition-all relative cursor-pointer shrink-0">
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm translate-x-5" />
                      </div>
                    </label>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-surface-secondary border border-border">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Data & Privacy Controls</h4>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-surface-tertiary transition-colors flex items-center justify-between">
                      Download my data
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </button>
                    <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-surface-tertiary transition-colors flex items-center justify-between">
                      Delete my account
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
