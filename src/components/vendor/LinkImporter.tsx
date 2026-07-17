'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Link as LinkIcon, Loader2, Check, Edit3, Trash2, AlertCircle,
  Globe, RefreshCw,
} from 'lucide-react'
import type { ImportItem } from './ImportWizard'

export interface LinkImporterProps {
  type: 'product' | 'menu' | 'service'
  onImport: (items: ImportItem[]) => void
}

type Platform = 'facebook' | 'ubereats' | 'yelp' | 'instagram' | 'google' | 'unknown'

interface PlatformInfo {
  id: Platform
  label: string
  hostnames: string[]
  color: string
  bg: string
}

const PLATFORMS: PlatformInfo[] = [
  { id: 'facebook', label: 'Facebook', hostnames: ['facebook.com', 'fb.com', 'fb.me'], color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { id: 'ubereats', label: 'Uber Eats', hostnames: ['ubereats.com', 'eats.uber.com'], color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { id: 'yelp', label: 'Yelp', hostnames: ['yelp.com', 'yelp.to'], color: 'text-red-600', bg: 'bg-red-500/10' },
  { id: 'instagram', label: 'Instagram', hostnames: ['instagram.com', 'instagr.am'], color: 'text-pink-600', bg: 'bg-pink-500/10' },
  { id: 'google', label: 'Google', hostnames: ['google.com', 'goo.gl', 'maps.app.goo.gl', 'business.google.com'], color: 'text-amber-600', bg: 'bg-amber-500/10' },
]

function detectPlatform(url: string): Platform {
  let host: string
  try {
    host = new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return 'unknown'
  }
  for (const p of PLATFORMS) {
    if (p.hostnames.some((h) => host === h || host.endsWith(`.${h}`))) return p.id
  }
  return 'unknown'
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function mockImportForPlatform(platform: Platform, type: 'product' | 'menu' | 'service'): ImportItem[] {
  if (type === 'menu') {
    return [
      { name: 'Jollof Rice', description: 'Classic West African jollof with spiced tomato sauce', price: 12.99, category: 'Mains', preparationTime: 20, dietaryTags: ['Halal'] },
      { name: 'Suya Skewers', description: 'Grilled beef skewers with suya spice and onions', price: 8.99, category: 'Appetizers', preparationTime: 15, dietaryTags: ['Halal', 'Gluten-Free'] },
      { name: 'Egusi Soup', description: 'Melon seed soup with assorted meat and spinach', price: 14.99, category: 'Mains', preparationTime: 25, dietaryTags: ['Gluten-Free'] },
      { name: 'Puff Puff', description: 'Sweet fried dough balls dusted with sugar', price: 5.99, category: 'Desserts', preparationTime: 10, dietaryTags: ['Vegetarian'] },
      { name: 'Chapman', description: 'Refreshing Nigerian cocktail mocktail', price: 6.99, category: 'Drinks', preparationTime: 3 },
    ]
  }
  if (type === 'product') {
    return [
      { name: 'Ankara Print Tote Bag', description: 'Handcrafted African print tote bag', price: 24.99, category: 'Fashion', stock: 50, tags: ['handmade', 'african print'] },
      { name: 'Shea Butter Body Cream', description: 'Organic shea butter moisturizer', price: 18.99, category: 'Beauty', stock: 120, tags: ['organic', 'skincare'] },
      { name: 'Kente Throw Pillow', description: 'Colorful kente cloth decorative pillow', price: 32.99, category: 'Home & Garden', stock: 30, tags: ['handmade', 'home decor'] },
      { name: 'African Beaded Bracelet', description: 'Handmade Maasai beaded bracelet', price: 12.99, category: 'Fashion', stock: 200, tags: ['jewelry', 'handmade'] },
    ]
  }
  return [
    { name: 'Haircut & Styling', description: 'Professional haircut with consultation', price: 25.0, duration: 45, category: 'Hair & Beauty' },
    { name: 'Deep Conditioning Treatment', description: 'Intensive hair repair treatment', price: 35.0, duration: 60, category: 'Hair & Beauty' },
    { name: 'Full Body Massage', description: 'Relaxing 90-minute full body massage', price: 55.0, duration: 90, category: 'Wellness & Spa', maxCapacity: 1 },
    { name: 'Manicure & Pedicure', description: 'Complete nail care package', price: 30.0, duration: 60, category: 'Hair & Beauty' },
  ]
}

export default function LinkImporter({ type, onImport }: LinkImporterProps) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'importing' | 'results' | 'error'>('idle')
  const [error, setError] = useState('')
  const [results, setResults] = useState<ImportItem[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const detected = useMemo(() => detectPlatform(url), [url])
  const detectedInfo = useMemo(
    () => PLATFORMS.find((p) => p.id === detected) ?? null,
    [detected],
  )

  const typeLabel = type === 'menu' ? 'menu item' : type === 'service' ? 'service' : 'product'

  const handleImport = useCallback(() => {
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (starting with http:// or https://).')
      setStatus('error')
      return
    }
    setError('')
    setStatus('importing')
    const platform = detectPlatform(url)
    setTimeout(() => {
      const imported = mockImportForPlatform(platform, type)
      setResults(imported)
      setStatus('results')
    }, 1800)
  }, [url, type])

  const updateResult = useCallback((index: number, item: ImportItem) => {
    setResults((prev) => prev.map((r, i) => (i === index ? item : r)))
  }, [])

  const removeResult = useCallback((index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResults([])
    setEditingIndex(null)
    setError('')
  }, [])

  const inputClass =
    'w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30'

  return (
    <div className="space-y-4">
      {/* Idle / input state */}
      {(status === 'idle' || status === 'error') && (
        <>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Paste a link from Facebook, Uber Eats, Yelp, Instagram, or Google
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  if (status === 'error') setStatus('idle')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="https://www.ubereats.com/store/..."
                className={cn(inputClass, 'pl-9')}
              />
            </div>
          </div>

          {url.trim().length > 0 && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                  detectedInfo ? detectedInfo.bg : 'bg-surface-secondary',
                  detectedInfo ? detectedInfo.color : 'text-text-secondary',
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                {detectedInfo ? `Detected: ${detectedInfo.label}` : 'Unrecognized platform — we\u2019ll still try'}
              </div>
            </div>
          )}

          {status === 'error' && error && (
            <div className="flex items-start gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs',
                  detected === p.id ? 'ring-1 ring-amber-500/40' : '',
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', p.bg)} />
                <span className="text-text-secondary">{p.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={!url.trim()}
            className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            Import from Link
          </button>
        </>
      )}

      {/* Importing state */}
      {status === 'importing' && (
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            <span className="text-sm font-medium text-text-primary">
              Fetching {typeLabel}s from {detectedInfo?.label ?? 'the link'}...
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            We&rsquo;re reading the page and extracting items for you
          </p>
        </div>
      )}

      {/* Results state */}
      {status === 'results' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {results.length} {typeLabel}s found
            </h3>
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try another link
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {results.map((item, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 rounded-xl border border-border bg-surface-secondary"
                >
                  {editingIndex === i ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateResult(i, { ...item, name: e.target.value })}
                        className={inputClass}
                        placeholder="Name"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateResult(i, { ...item, price: Number(e.target.value) })}
                          className={cn(inputClass, 'w-24')}
                          placeholder="Price"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateResult(i, { ...item, description: e.target.value })}
                          className={cn(inputClass, 'flex-1')}
                          placeholder="Description"
                        />
                      </div>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="text-xs text-amber-600 font-medium hover:text-amber-700"
                      >
                        Done editing
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-secondary truncate">{item.description}</p>
                        <p className="text-xs font-semibold text-amber-600 mt-1">
                          ${item.price.toFixed(2)}
                          {item.category ? ` \u00b7 ${item.category}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingIndex(i)}
                        className="p-1.5 rounded-lg hover:bg-surface transition-colors shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => removeResult(i)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={() => onImport(results)}
            disabled={results.length === 0}
            className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm &amp; Import {results.length} {typeLabel}s
          </button>
        </>
      )}
    </div>
  )
}
