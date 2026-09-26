'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Save, Loader2, Upload, MapPin, Globe, Phone, Mail,
  ExternalLink, Eye, Shield, AlertTriangle, X, ImageIcon,
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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
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

  // Load the vendor's real business record on mount, so the form reflects
  // what's actually saved rather than a fixed sample business every vendor
  // saw. A missing business (not onboarded yet) or a network failure both
  // leave the form on its placeholder defaults — this page shouldn't crash
  // or block just because there's nothing to load yet.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/vendor/business')
        if (cancelled) return
        if (res.ok) {
          const { business } = await res.json()
          setBusinessId(business.id)
          setForm((f) => ({
            ...f,
            name: business.name ?? f.name,
            description: business.description ?? f.description,
            logoUrl: business.media?.logoUrl ?? '',
            coverUrl: business.media?.coverUrl ?? '',
          }))
        } else if (res.status !== 404) {
          // 404 just means no business yet (pre-onboarding) — not an error
          // worth surfacing. Anything else (401, 500, network) is.
          const body = await res.json().catch(() => ({}))
          setLoadError(body.error || "Couldn't load your business profile.")
        }
      } catch {
        if (!cancelled) setLoadError("Couldn't reach AfriBook's servers to load your business profile.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleUpload = async (kind: 'logo' | 'cover', file: File) => {
    setUploading(kind)
    setSaveError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('bucket', 'uploads')
      body.append('folder', `business/${businessId ?? 'pending'}`)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const field = kind === 'logo' ? 'logoUrl' : 'coverUrl'
      setForm((f) => ({ ...f, [field]: data.url }))
    } catch (err: any) {
      setSaveError(
        err instanceof TypeError
          ? "We couldn't reach AfriBook's servers to upload that image. Check your connection and try again."
          : err.message || 'Upload failed. Please try again.',
      )
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/vendor/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          media: { logoUrl: form.logoUrl, coverUrl: form.coverUrl },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setSaveError(
        err instanceof TypeError
          ? "We couldn't reach AfriBook's servers. Your changes weren't saved — check your connection and try again."
          : err.message || 'Something went wrong saving your changes.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
      <motion.div variants={ITEM}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Business Profile</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your business information and policies.</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
        {loadError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {loadError}
          </p>
        )}
        {saveError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {saveError}
          </p>
        )}
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
        <p className="text-xs text-text-secondary -mt-2">
          Optional. Until you upload your own, customers see photography that
          matches your business category instead of a placeholder.
        </p>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload('logo', f); e.target.value = '' }}
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload('cover', f); e.target.value = '' }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Logo</label>
            <div className="relative w-full aspect-square max-w-[200px] rounded-2xl overflow-hidden">
              {form.logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logoUrl} alt="Business logo" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setForm({ ...form, logoUrl: '' })}
                    aria-label="Remove logo"
                    className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading === 'logo'}
                  className="w-full h-full rounded-2xl border-2 border-dashed border-border hover:border-amber-400 flex flex-col items-center justify-center bg-surface-secondary cursor-pointer transition-colors disabled:opacity-60"
                >
                  {uploading === 'logo' ? (
                    <Loader2 className="w-8 h-8 text-text-tertiary mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-text-tertiary mb-2" />
                  )}
                  <p className="text-xs font-medium text-text-secondary">
                    {uploading === 'logo' ? 'Uploading…' : 'Upload Logo'}
                  </p>
                  <p className="text-[10px] text-text-tertiary">PNG, JPG up to 10MB</p>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Cover Image</label>
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden">
              {form.coverUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverUrl} alt="Business cover" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setForm({ ...form, coverUrl: '' })}
                    aria-label="Remove cover image"
                    className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading === 'cover'}
                  className="w-full h-full rounded-2xl border-2 border-dashed border-border hover:border-amber-400 flex flex-col items-center justify-center bg-surface-secondary cursor-pointer transition-colors disabled:opacity-60"
                >
                  {uploading === 'cover' ? (
                    <Loader2 className="w-8 h-8 text-text-tertiary mb-2 animate-spin" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-text-tertiary mb-2" />
                  )}
                  <p className="text-xs font-medium text-text-secondary">
                    {uploading === 'cover' ? 'Uploading…' : 'Upload Cover'}
                  </p>
                  <p className="text-[10px] text-text-tertiary">16:9 ratio, PNG/JPG up to 10MB</p>
                </button>
              )}
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
