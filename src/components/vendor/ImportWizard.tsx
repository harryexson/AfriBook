'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  X, Plus, FileSpreadsheet, Link, Camera, ArrowLeft, ArrowRight,
  Trash2, Edit3, Check, Loader2, Download, Upload, ChevronDown,
  Search, AlertCircle, PartyPopper, CheckCircle2,
} from 'lucide-react'
import CsvParser from './CsvParser'
import LinkImporter from './LinkImporter'

export interface ImportItem {
  name: string
  description: string
  price: number
  category?: string
  image?: string
  preparationTime?: number
  ingredients?: string[]
  allergens?: string[]
  dietaryTags?: string[]
  stock?: number
  comparePrice?: number
  tags?: string[]
  variants?: { name: string; price: number; stock: number }[]
  duration?: number
  maxCapacity?: number
}

interface ImportWizardProps {
  type: 'product' | 'menu' | 'service'
  isOpen: boolean
  onClose: () => void
  onImport: (items: ImportItem[]) => Promise<void>
}

type WizardStep = 'method' | 'manual' | 'csv' | 'link' | 'photo' | 'review'
type ImportMethod = 'manual' | 'csv' | 'link' | 'photo' | null

const MENU_CATEGORIES = ['Appetizers', 'Mains', 'Desserts', 'Drinks', 'Sides']
const PRODUCT_CATEGORIES = ['Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Food & Groceries', 'Sports', 'Books', 'Automotive', 'Health', 'Other']
const SERVICE_CATEGORIES = ['Hair & Beauty', 'Wellness & Spa', 'Health & Fitness', 'Education & Tutoring', 'Technology', 'Automotive', 'Home Services', 'Photography', 'Event Planning', 'Other']
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Keto', 'Organic']

function generateId(): string {
  return `imp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
}

export default function ImportWizard({ type, isOpen, onClose, onImport }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('method')
  const [method, setMethod] = useState<ImportMethod>(null)
  const [items, setItems] = useState<ImportItem[]>([])
  const [direction, setDirection] = useState(1)
  const [importing, setImporting] = useState(false)
  const [success, setSuccess] = useState(false)

  const typeLabel = useMemo(() => {
    if (type === 'menu') return 'Menu Item'
    if (type === 'service') return 'Service'
    return 'Product'
  }, [type])

  const categories = useMemo(() => {
    if (type === 'menu') return MENU_CATEGORIES
    if (type === 'service') return SERVICE_CATEGORIES
    return PRODUCT_CATEGORIES
  }, [type])

  const navigateTo = useCallback((next: WizardStep) => {
    setDirection(next === 'review' || (step === 'method' && next !== 'method') ? 1 : -1)
    setStep(next)
  }, [step])

  const selectMethod = useCallback((m: ImportMethod) => {
    setMethod(m)
    if (m === 'manual') navigateTo('manual')
    else if (m === 'csv') navigateTo('csv')
    else if (m === 'link') navigateTo('link')
    else if (m === 'photo') navigateTo('photo')
  }, [navigateTo])

  const addItems = useCallback((newItems: ImportItem[]) => {
    setItems((prev) => [...prev, ...newItems])
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateItem = useCallback((index: number, item: ImportItem) => {
    setItems((prev) => prev.map((existing, i) => i === index ? item : existing))
  }, [])

  const handleFinalImport = useCallback(async () => {
    setImporting(true)
    try {
      await onImport(items)
      setSuccess(true)
    } catch {
      // error handled upstream
    } finally {
      setImporting(false)
    }
  }, [items, onImport])

  const handleReset = useCallback(() => {
    setStep('method')
    setMethod(null)
    setItems([])
    setSuccess(false)
  }, [])

  const handleClose = useCallback(() => {
    handleReset()
    onClose()
  }, [handleReset, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-surface rounded-2xl border border-border shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                {step !== 'method' && (
                  <button
                    onClick={() => navigateTo('method')}
                    className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-text-secondary" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-text-primary font-heading">
                    Import {typeLabel}s
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {step === 'method' && 'Choose how you want to import'}
                    {step === 'manual' && `Add ${typeLabel.toLowerCase()}s one by one`}
                    {step === 'csv' && 'Upload and map your spreadsheet'}
                    {step === 'link' && 'Import from external platform'}
                    {step === 'photo' && 'Scan and extract from image'}
                    {step === 'review' && `Review your ${items.length} ${typeLabel.toLowerCase()}s`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && step !== 'review' && (
                  <button
                    onClick={() => navigateTo('review')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Review ({items.length})
                  </button>
                )}
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Step indicator */}
            {step !== 'method' && (
              <div className="flex items-center gap-1 px-6 pt-4 shrink-0">
                {['method', 'add', 'review'].map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      'h-1 rounded-full flex-1 transition-colors',
                      i === 0 || (i === 1 && step !== 'method') || (i === 2 && step === 'review')
                        ? 'bg-amber-500' : 'bg-surface-secondary'
                    )} />
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 'method' && (
                  <MethodStep key="method" onSelect={selectMethod} type={type} typeLabel={typeLabel} />
                )}
                {step === 'manual' && (
                  <ManualStep
                    key="manual"
                    type={type}
                    typeLabel={typeLabel}
                    categories={categories}
                    items={items}
                    onAdd={addItems}
                    onRemove={removeItem}
                    onUpdate={updateItem}
                    onNext={() => navigateTo('review')}
                  />
                )}
                {step === 'csv' && (
                  <CsvStep
                    key="csv"
                    type={type}
                    onImport={(parsed) => { addItems(parsed); navigateTo('review') }}
                    onBack={() => navigateTo('method')}
                  />
                )}
                {step === 'link' && (
                  <LinkStep
                    key="link"
                    type={type}
                    onImport={(imported) => { addItems(imported); navigateTo('review') }}
                    onBack={() => navigateTo('method')}
                  />
                )}
                {step === 'photo' && (
                  <PhotoStep
                    key="photo"
                    type={type}
                    typeLabel={typeLabel}
                    onImport={(scanned) => { addItems(scanned); navigateTo('review') }}
                    onBack={() => navigateTo('method')}
                  />
                )}
                {step === 'review' && (
                  <ReviewStep
                    key="review"
                    type={type}
                    typeLabel={typeLabel}
                    categories={categories}
                    items={items}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    importing={importing}
                    success={success}
                    onImport={handleFinalImport}
                    onReset={handleReset}
                    onClose={handleClose}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Step 1: Choose Method ──────────────────────────────────── */

function MethodStep({
  onSelect,
  type,
  typeLabel,
}: {
  onSelect: (m: ImportMethod) => void
  type: 'product' | 'menu' | 'service'
  typeLabel: string
}) {
  const methods = [
    {
      id: 'manual' as const,
      icon: Plus,
      title: 'Add Manually',
      desc: `Add ${typeLabel.toLowerCase()}s one by one with our easy form`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'csv' as const,
      icon: FileSpreadsheet,
      title: 'Upload CSV/Spreadsheet',
      desc: 'Upload a CSV or Excel file with your items',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'link' as const,
      icon: Link,
      title: 'Import from Link',
      desc: 'Import from Facebook, UberEats, Yelp, or Google',
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      id: 'photo' as const,
      icon: Camera,
      title: 'Scan Photo/Menu',
      desc: 'Take a photo of your menu or product catalog',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={1}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="p-6"
    >
      <div className="grid grid-cols-2 gap-3">
        {methods.map((m) => (
          <motion.button
            key={m.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(m.id)}
            className="flex flex-col items-start p-5 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-colors text-left group"
          >
            <div className={cn('p-2.5 rounded-xl mb-3', m.bg)}>
              <m.icon className={cn('w-5 h-5', m.color)} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">{m.title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{m.desc}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Step 2A: Manual Add ────────────────────────────────────── */

function ManualStep({
  type,
  typeLabel,
  categories,
  items,
  onAdd,
  onRemove,
  onUpdate,
  onNext,
}: {
  type: 'product' | 'menu' | 'service'
  typeLabel: string
  categories: string[]
  items: ImportItem[]
  onAdd: (items: ImportItem[]) => void
  onRemove: (index: number) => void
  onUpdate: (index: number, item: ImportItem) => void
  onNext: () => void
}) {
  const emptyForm = useMemo<ImportItem>(() => ({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    ...(type === 'menu' ? { preparationTime: 15, ingredients: [], allergens: [], dietaryTags: [] } : {}),
    ...(type === 'product' ? { stock: 0, comparePrice: 0, tags: [] } : {}),
    ...(type === 'service' ? { duration: 60, maxCapacity: 1 } : {}),
  }), [type])

  const [form, setForm] = useState<ImportItem>(emptyForm)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [dietaryInput, setDietaryInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [ingredientInput, setIngredientInput] = useState('')

  const handleAdd = () => {
    if (!form.name.trim()) return
    if (editIndex !== null) {
      onUpdate(editIndex, { ...form })
      setEditIndex(null)
    } else {
      onAdd([{ ...form, name: form.name.trim(), description: form.description.trim() }])
    }
    setForm(emptyForm)
  }

  const handleEdit = (index: number) => {
    setForm({ ...items[index] })
    setEditIndex(index)
  }

  const toggleDietary = (tag: string) => {
    const current = form.dietaryTags ?? []
    setForm({
      ...form,
      dietaryTags: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    })
  }

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setForm({ ...form, ingredients: [...(form.ingredients ?? []), ingredientInput.trim()] })
      setIngredientInput('')
    }
  }

  const addTag = () => {
    if (tagInput.trim()) {
      setForm({ ...form, tags: [...(form.tags ?? []), tagInput.trim()] })
      setTagInput('')
    }
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm'

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="p-6 space-y-4"
    >
      {/* Form */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={`${typeLabel} name`}
            className={inputClass}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder={`Describe your ${typeLabel.toLowerCase()}...`}
            className={cn(inputClass, 'resize-none')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Price *</label>
          <input
            type="number"
            value={form.price || ''}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            min="0"
            placeholder="0"
            className={inputClass}
          />
        </div>
        {type === 'product' && (
          <>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Compare Price</label>
              <input
                type="number"
                value={form.comparePrice || ''}
                onChange={(e) => setForm({ ...form, comparePrice: Number(e.target.value) })}
                min="0"
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Stock</label>
              <input
                type="number"
                value={form.stock || ''}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                min="0"
                placeholder="0"
                className={inputClass}
              />
            </div>
          </>
        )}
        {type === 'menu' && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Prep Time (min)</label>
            <input
              type="number"
              value={form.preparationTime || ''}
              onChange={(e) => setForm({ ...form, preparationTime: Number(e.target.value) })}
              min="1"
              placeholder="15"
              className={inputClass}
            />
          </div>
        )}
        {type === 'service' && (
          <>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Duration (min)</label>
              <input
                type="number"
                value={form.duration || ''}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                min="1"
                placeholder="60"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Max Capacity</label>
              <input
                type="number"
                value={form.maxCapacity || ''}
                onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })}
                min="1"
                placeholder="1"
                className={inputClass}
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
          <select
            value={form.category ?? ''}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputClass}
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Image URL</label>
          <input
            type="url"
            value={form.image ?? ''}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Menu-specific: dietary tags */}
      {type === 'menu' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Dietary Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDietary(tag)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                  (form.dietaryTags ?? []).includes(tag)
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-surface text-text-secondary border-border hover:border-emerald-200'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu-specific: ingredients */}
      {type === 'menu' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Ingredients</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              placeholder="Add ingredient"
              className={cn(inputClass, 'flex-1')}
            />
            <button type="button" onClick={addIngredient} className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm hover:bg-surface-tertiary transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {(form.ingredients ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.ingredients ?? []).map((ing, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-text-secondary">
                  {ing}
                  <button type="button" onClick={() => setForm({ ...form, ingredients: (form.ingredients ?? []).filter((_, idx) => idx !== i) })} className="text-text-tertiary hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product-specific: tags */}
      {type === 'product' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag"
              className={cn(inputClass, 'flex-1')}
            />
            <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm hover:bg-surface-tertiary transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {(form.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.tags ?? []).map((tag, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-text-secondary">
                  {tag}
                  <button type="button" onClick={() => setForm({ ...form, tags: (form.tags ?? []).filter((_, idx) => idx !== i) })} className="text-text-tertiary hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Update button */}
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!form.name.trim() || form.price <= 0}
          className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {editIndex !== null ? (
            <><Check className="w-4 h-4" /> Update Item</>
          ) : (
            <><Plus className="w-4 h-4" /> Add & Next</>
          )}
        </button>
        {editIndex !== null && (
          <button
            onClick={() => { setEditIndex(null); setForm(emptyForm) }}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Item list */}
      {items.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-primary">{items.length} {typeLabel.toLowerCase()}s added</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border"
              >
                {item.image && (
                  <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                  <p className="text-xs text-text-secondary">{item.price > 0 ? `$${item.price.toFixed(2)}` : 'No price'}{item.category ? ` · ${item.category}` : ''}</p>
                </div>
                <button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg hover:bg-surface transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                </button>
                <button onClick={() => onRemove(i)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Done button */}
      {items.length > 0 && (
        <button
          onClick={onNext}
          className="w-full px-4 py-2.5 rounded-xl border border-amber-500 text-amber-600 text-sm font-semibold hover:bg-amber-50 transition-colors"
        >
          Done Adding — Review {items.length} {typeLabel.toLowerCase()}s
        </button>
      )}
    </motion.div>
  )
}

/* ── Step 2B: CSV Upload ────────────────────────────────────── */

function CsvStep({
  type,
  onImport,
  onBack,
}: {
  type: 'product' | 'menu' | 'service'
  onImport: (items: ImportItem[]) => void
  onBack: () => void
}) {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={1}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="p-6"
    >
      <CsvParser type={type} onParsed={onImport} onCancel={onBack} />
    </motion.div>
  )
}

/* ── Step 2C: Link Import ───────────────────────────────────── */

function LinkStep({
  type,
  onImport,
  onBack,
}: {
  type: 'product' | 'menu' | 'service'
  onImport: (items: ImportItem[]) => void
  onBack: () => void
}) {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={1}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="p-6"
    >
      <LinkImporter type={type} onImport={onImport} />
      <button onClick={onBack} className="mt-4 w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
        Back to methods
      </button>
    </motion.div>
  )
}

/* ── Step 2D: Photo Scan ────────────────────────────────────── */

function PhotoStep({
  type,
  typeLabel,
  onImport,
  onBack,
}: {
  type: 'product' | 'menu' | 'service'
  typeLabel: string
  onImport: (items: ImportItem[]) => void
  onBack: () => void
}) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [results, setResults] = useState<ImportItem[] | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const mockScanResults = useMemo<ImportItem[]>(() => {
    if (type === 'menu') {
      return [
        { name: 'Jollof Rice', description: 'Classic West African jollof with spiced tomato sauce', price: 12.99, category: 'Mains', preparationTime: 20, dietaryTags: ['Halal'] },
        { name: 'Suya Skewers', description: 'Grilled beef skewers with suya spice and onions', price: 8.99, category: 'Appetizers', preparationTime: 15, dietaryTags: ['Halal', 'Gluten-Free'] },
        { name: 'Puff Puff', description: 'Sweet fried dough balls, dusted with powdered sugar', price: 5.99, category: 'Desserts', preparationTime: 10, dietaryTags: ['Vegetarian'] },
        { name: 'Chin Chin', description: 'Crunchy fried pastry snacks', price: 4.99, category: 'Sides', preparationTime: 5, dietaryTags: ['Vegetarian'] },
        { name: 'Chapman', description: 'Refreshing Nigerian cocktail with Fanta, Sprite, and grenadine', price: 6.99, category: 'Drinks', preparationTime: 3 },
        { name: 'Pepper Soup', description: 'Spicy goat meat pepper soup with mixed spices', price: 14.99, category: 'Mains', preparationTime: 25, dietaryTags: ['Halal', 'Gluten-Free'] },
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
      { name: 'Haircut & Styling', description: 'Professional haircut with consultation', price: 25.00, duration: 45, category: 'Hair & Beauty' },
      { name: 'Deep Conditioning Treatment', description: 'Intensive hair repair treatment', price: 35.00, duration: 60, category: 'Hair & Beauty' },
      { name: 'Full Body Massage', description: 'Relaxing 90-minute full body massage', price: 55.00, duration: 90, category: 'Wellness & Spa', maxCapacity: 1 },
      { name: 'Manicure & Pedicure', description: 'Complete nail care package', price: 30.00, duration: 60, category: 'Hair & Beauty' },
    ]
  }, [type])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string)
      setScanning(true)
      setTimeout(() => {
        setResults(mockScanResults)
        setScanning(false)
      }, 2000)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateResult = (index: number, item: ImportItem) => {
    setResults((prev) => prev ? prev.map((r, i) => i === index ? item : r) : null)
  }

  const handleRemoveResult = (index: number) => {
    setResults((prev) => prev ? prev.filter((_, i) => i !== index) : null)
  }

  const inputClass = 'w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30'

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={1}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="p-6 space-y-4"
    >
      {!results && !scanning && (
        <>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Scan your {typeLabel.toLowerCase()} list</h3>
            <p className="text-xs text-text-secondary mb-4">Take a photo of your menu, price list, or product catalog</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Choose Photo
              <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </>
      )}

      {scanning && (
        <div className="text-center py-12">
          {preview && (
            <img src={preview} alt="Uploaded" className="w-32 h-32 rounded-xl object-cover mx-auto mb-4 border border-border" />
          )}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            <span className="text-sm font-medium text-text-primary">Scanning and extracting items...</span>
          </div>
          <p className="text-xs text-text-secondary">Our AI is reading your {typeLabel.toLowerCase()} list</p>
        </div>
      )}

      {results && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">{results.length} items extracted</h3>
            <button onClick={() => { setResults(null); setPreview(null) }} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Rescan</button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {results.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-border bg-surface-secondary"
              >
                {editingIndex === i ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateResult(i, { ...item, name: e.target.value })}
                      className={inputClass}
                      placeholder="Name"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleUpdateResult(i, { ...item, price: Number(e.target.value) })}
                        className={cn(inputClass, 'w-24')}
                        placeholder="Price"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateResult(i, { ...item, description: e.target.value })}
                        className={cn(inputClass, 'flex-1')}
                        placeholder="Description"
                      />
                    </div>
                    <button onClick={() => setEditingIndex(null)} className="text-xs text-amber-600 font-medium hover:text-amber-700">Done editing</button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-secondary truncate">{item.description}</p>
                      <p className="text-xs font-semibold text-amber-600 mt-1">${item.price.toFixed(2)}{item.category ? ` · ${item.category}` : ''}</p>
                    </div>
                    <button onClick={() => setEditingIndex(i)} className="p-1.5 rounded-lg hover:bg-surface transition-colors shrink-0">
                      <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                    </button>
                    <button onClick={() => handleRemoveResult(i)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => onImport(results)}
            className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm & Import {results.length} {typeLabel.toLowerCase()}s
          </button>
        </>
      )}
    </motion.div>
  )
}

/* ── Step 3: Review & Confirm ───────────────────────────────── */

function ReviewStep({
  type,
  typeLabel,
  categories,
  items,
  onUpdate,
  onRemove,
  importing,
  success,
  onImport,
  onReset,
  onClose,
}: {
  type: 'product' | 'menu' | 'service'
  typeLabel: string
  categories: string[]
  items: ImportItem[]
  onUpdate: (index: number, item: ImportItem) => void
  onRemove: (index: number) => void
  importing: boolean
  success: boolean
  onImport: () => void
  onReset: () => void
  onClose: () => void
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null)

  const validateItem = (item: ImportItem) => {
    const issues: string[] = []
    if (!item.name.trim()) issues.push('Missing name')
    if (!item.price || item.price <= 0) issues.push('Invalid price')
    if (!item.category) issues.push('No category')
    return issues
  }

  const totalIssues = items.reduce((count, item) => count + (validateItem(item).length > 0 ? 1 : 0), 0)

  const inputClass = 'w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30'

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Successfully imported!</h3>
        <p className="text-sm text-text-secondary mb-6">
          {items.length} {typeLabel.toLowerCase()}s have been added to your {type === 'menu' ? 'menu' : type === 'service' ? 'services' : 'catalog'}.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            Import More
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={1}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {items.length} {typeLabel.toLowerCase()}s ready to import
        </h3>
        {totalIssues > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {totalIssues} with issues
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-text-secondary">No items to import. Go back and add some {typeLabel.toLowerCase()}s.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((item, i) => {
            const issues = validateItem(item)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'p-3 rounded-xl border bg-surface-secondary',
                  issues.length > 0 ? 'border-amber-300 dark:border-amber-700' : 'border-border'
                )}
              >
                {editIndex === i ? (
                  <div className="space-y-2">
                    <input type="text" value={item.name} onChange={(e) => onUpdate(i, { ...item, name: e.target.value })} className={inputClass} placeholder="Name" />
                    <div className="flex gap-2">
                      <input type="number" value={item.price} onChange={(e) => onUpdate(i, { ...item, price: Number(e.target.value) })} className={cn(inputClass, 'w-24')} placeholder="Price" />
                      <select value={item.category ?? ''} onChange={(e) => onUpdate(i, { ...item, category: e.target.value })} className={cn(inputClass, 'flex-1')}>
                        <option value="">Category</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setEditIndex(null)} className="text-xs text-amber-600 font-medium hover:text-amber-700">Done</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary truncate">{item.name || <span className="text-red-500 italic">Missing name</span>}</p>
                        {issues.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium shrink-0">
                            {issues.length} issue{issues.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">
                        {item.price > 0 ? `$${item.price.toFixed(2)}` : 'No price'}
                        {item.category ? ` · ${item.category}` : ''}
                      </p>
                    </div>
                    <button onClick={() => setEditIndex(i)} className="p-1.5 rounded-lg hover:bg-surface transition-colors shrink-0">
                      <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                    </button>
                    <button onClick={() => onRemove(i)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {items.length > 0 && (
        <button
          onClick={onImport}
          disabled={importing}
          className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {importing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
          ) : (
            <>
              <PartyPopper className="w-4 h-4" />
              Import All {items.length} {typeLabel.toLowerCase()}s
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}
