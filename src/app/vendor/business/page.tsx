'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Save, Loader2, Upload, MapPin, Globe, Phone, Mail,
  ExternalLink, Eye, Shield, AlertTriangle,
} from 'lucide-react'
import BusinessHours from '@/components/vendor/BusinessHours'
import type { BusinessHours as BusinessHoursType } from '@/types'

const CATEGORIES = [
  'Hair & Beauty', 'Wellness & Spa', 'Restaurant & Dining', 'Technology',
  'Fashion & Tailoring', 'Home Services', 'Automotive', 'Photography',
  'Education', 'Health & Fitness', 'Event Planning', 'Other',
]

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function BusinessProfilePage() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "Amara's Beauty Studio",
    description: 'Premium beauty and wellness services in the heart of Lagos.',
    category: 'Hair & Beauty',
    subcategory: 'Hair Styling',
    email: 'hello@amarastudio.ng',
    phone: '+234 801 234 5678',
    website: 'https://amarastudio.ng',
    address: '25 Admiralty Way, Lekki Phase 1, Lagos',
    city: 'Lagos',
    state: 'Lagos',
    logoUrl: '',
    coverUrl: '',
    facebook: '',
    instagram: '',
    twitter: '',
    cancellationPolicy: 'moderate' as 'flexible' | 'moderate' | 'strict',
    cancellationFeePercent: 15,
    noShowPolicy: 'full_charge',
  })

  const [hours, setHours] = useState<BusinessHoursType[]>([])

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSaving(false)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
      <motion.div variants={ITEM}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Business Profile</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your business information and policies.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>

      {/* Basic Info */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text-primary font-heading">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">Business Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Subcategory</label>
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              placeholder="e.g. Hair Styling"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Media */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text-primary font-heading">Logo & Cover Image</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Logo</label>
            <div className="w-full aspect-square max-w-[200px] rounded-2xl border-2 border-dashed border-border hover:border-amber-400 flex flex-col items-center justify-center bg-surface-secondary cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-text-tertiary mb-2" />
              <p className="text-xs font-medium text-text-secondary">Upload Logo</p>
              <p className="text-[10px] text-text-tertiary">PNG, JPG up to 2MB</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Cover Image</label>
            <div className="w-full aspect-[2/1] rounded-2xl border-2 border-dashed border-border hover:border-amber-400 flex flex-col items-center justify-center bg-surface-secondary cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-text-tertiary mb-2" />
              <p className="text-xs font-medium text-text-secondary">Upload Cover</p>
              <p className="text-[10px] text-text-tertiary">16:9 ratio, PNG/JPG</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text-primary font-heading">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</span>
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Location */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text-primary font-heading">
          <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-amber-500" /> Location</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>
        </div>
        <div className="w-full h-48 rounded-xl bg-surface-secondary border border-border-light flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-tertiary">Map preview</p>
          </div>
        </div>
      </motion.div>

      {/* Social Links */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text-primary font-heading">Social Media</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Instagram', key: 'instagram' },
            { label: 'Facebook', key: 'facebook' },
            { label: 'Twitter / X', key: 'twitter' },
          ].map((s) => (
            <div key={s.key}>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{s.label}</label>
              <input
                type="url"
                value={form[s.key as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [s.key]: e.target.value })}
                placeholder={`https://${s.key.toLowerCase()}.com/...`}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Hours */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <BusinessHours hours={hours} onChange={setHours} />
      </motion.div>

      {/* Policies */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text-primary font-heading">
          <span className="flex items-center gap-2"><Shield className="w-5 h-5 text-amber-500" /> Policies</span>
        </h2>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Cancellation Policy</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'flexible', label: 'Flexible', desc: 'Full refund up to 24h before' },
              { value: 'moderate', label: 'Moderate', desc: 'Full refund up to 48h before' },
              { value: 'strict', label: 'Strict', desc: '50% refund up to 48h before' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, cancellationPolicy: opt.value as typeof form.cancellationPolicy })}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  form.cancellationPolicy === opt.value
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                    : 'border-border hover:border-amber-200'
                )}
              >
                <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                <p className="text-[11px] text-text-secondary mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">No-show Policy</p>
            <p className="text-xs text-text-secondary">Customers who don&apos;t show up will be charged the full amount.</p>
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      <motion.div variants={ITEM}>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
          <Eye className="w-4 h-4" />
          Preview as Customer
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  )
}
