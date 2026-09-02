'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, Edit3, Trash2, Eye, EyeOff, GripVertical,
  Utensils, DollarSign, X, Upload, Download, Grid3X3, List,
  CheckSquare, Square, Tag, Loader2,
} from 'lucide-react'
import MenuItemForm from '@/components/vendor/MenuItemForm'
import ImportWizard, { type ImportItem } from '@/components/vendor/ImportWizard'
import type { MenuItem } from '@/types'

// Real menu data now. Categories are fetched from `menu_categories` rather
// than a hardcoded cat1..cat4 map — a real restaurant's categories are its
// own DB rows, not a fixed global enum. `dietaryTags` has no dedicated
// column in the schema, so it round-trips through `metadata.dietaryTags`
// (a JSONB field that already exists on the table for exactly this kind of
// extension) rather than inventing a new migration for this pass.

const FALLBACK_CATEGORY_COLORS = ['from-orange-400 to-amber-500', 'from-red-400 to-rose-500', 'from-pink-400 to-fuchsia-500', 'from-blue-400 to-cyan-500', 'from-emerald-400 to-teal-500', 'from-gray-400 to-slate-500']

const CATEGORY_COLORS: Record<string, string> = {
  Appetizers: 'from-orange-400 to-amber-500',
  Mains: 'from-red-400 to-rose-500',
  Desserts: 'from-pink-400 to-fuchsia-500',
  Drinks: 'from-blue-400 to-cyan-500',
  Sides: 'from-emerald-400 to-teal-500',
  Other: 'from-gray-400 to-slate-500',
}

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

interface CategoryRow {
  id: string
  name: string
}

function rowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    businessId: row.restaurant_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price),
    currencyCode: row.currency,
    image: row.image ?? '',
    ingredients: row.ingredients ?? [],
    allergens: row.allergens ?? [],
    dietaryTags: row.metadata?.dietaryTags ?? [],
    available: row.is_available,
    preparationTime: row.preparation_time ?? 15,
    sortOrder: row.sort_order ?? 0,
  }
}

export default function MenuPage() {
  const supabase = useMemo(() => createClient(), [])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkPrice, setShowBulkPrice] = useState(false)
  const [showBulkCategory, setShowBulkCategory] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Categories are real DB rows now, fetched per-restaurant — derived maps
  // below keep the rest of this file (written against a fixed cat1..cat4
  // map originally) working the same way, just backed by real data.
  const CATEGORY_MAP = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])
  const CATEGORY_REVERSE = useMemo(() => Object.fromEntries(categories.map((c) => [c.name, c.id])), [categories])
  const CATEGORY_TABS = useMemo(() => ['All', ...categories.map((c) => c.name)], [categories])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not signed in')
        const { data: business } = await (supabase.from('businesses') as any)
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle()
        if (!business) throw new Error('No business found for this account')
        const { data: restaurant } = await (supabase.from('restaurants') as any)
          .select('id')
          .eq('business_id', business.id)
          .maybeSingle()
        if (!restaurant) throw new Error('No restaurant found for this business')
        if (cancelled) return
        setRestaurantId(restaurant.id)

        const [{ data: catRows }, { data: itemRows }] = await Promise.all([
          (supabase.from('menu_categories') as any).select('id, name').eq('restaurant_id', restaurant.id).order('sort_order'),
          (supabase.from('menu_items') as any).select('*').eq('restaurant_id', restaurant.id),
        ])
        if (cancelled) return
        setCategories((catRows ?? []).map((r: any) => ({ id: r.id, name: r.name })))
        setMenuItems((itemRows ?? []).map(rowToMenuItem))
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load menu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  /** Find a category by name, or create it — used when adding/importing an
   *  item whose category doesn't exist yet for this restaurant. */
  const ensureCategory = useCallback(async (name: string): Promise<string> => {
    const existing = categories.find((c) => c.name === name)
    if (existing) return existing.id
    if (!restaurantId) throw new Error('No restaurant loaded')
    const { data, error } = await (supabase.from('menu_categories') as any)
      .insert({ restaurant_id: restaurantId, name, sort_order: categories.length })
      .select('id, name')
      .single()
    if (error || !data) throw new Error('Failed to create category')
    setCategories((prev) => [...prev, { id: data.id, name: data.name }])
    return data.id
  }, [categories, restaurantId, supabase])

  const filtered = useMemo(() => {
    let items = menuItems
    if (activeTab !== 'All') {
      items = items.filter((item) => CATEGORY_MAP[item.categoryId] === activeTab)
    }
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      )
    }
    return items
  }, [menuItems, activeTab, search])

  const stats = useMemo(() => {
    const total = menuItems.length
    const categoryCount = new Set(menuItems.map((item) => CATEGORY_MAP[item.categoryId])).size
    const avgPrice = total > 0 ? menuItems.reduce((s, i) => s + i.price, 0) / total : 0
    const onSale = menuItems.filter((i) => i.available).length
    return { total, categories: categoryCount, avgPrice, onSale }
  }, [menuItems, CATEGORY_MAP])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)))
    }
  }, [selectedIds.size, filtered])

  // Every handler below writes to Supabase directly from the browser
  // client — menu_items/menu_categories RLS already scopes writes to the
  // authenticated vendor's own restaurant (`menu_items_write` /
  // `menu_categories_write` policies), so there's no need for a dedicated
  // API route for this standard CRUD, same pattern already used for the
  // driver decline action earlier in this session. Local state updates
  // optimistically-ish (after the write succeeds) rather than before, so a
  // failed write doesn't silently diverge from the database.

  const toggleAvailability = useCallback(
    async (id: string) => {
      const item = menuItems.find((i) => i.id === id)
      if (!item) return
      const { error } = await (supabase.from('menu_items') as any)
        .update({ is_available: !item.available })
        .eq('id', id)
      if (error) return
      setMenuItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i))
      )
    },
    [menuItems, supabase]
  )

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await (supabase.from('menu_items') as any).delete().eq('id', id)
    if (error) return
    setMenuItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [supabase])

  const bulkToggleAvailability = useCallback(async () => {
    const ids = Array.from(selectedIds)
    // Mixed current-availability selections would need per-item toggling;
    // this sets all selected items to "available" — the common bulk case
    // ("turn these back on after a stockout") — rather than guessing at a
    // per-item toggle semantics for a bulk action.
    const { error } = await (supabase.from('menu_items') as any)
      .update({ is_available: true })
      .in('id', ids)
    if (error) return
    setMenuItems((prev) => prev.map((item) => (selectedIds.has(item.id) ? { ...item, available: true } : item)))
    setSelectedIds(new Set())
  }, [selectedIds, supabase])

  const bulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    const { error } = await (supabase.from('menu_items') as any).delete().in('id', ids)
    if (error) return
    setMenuItems((prev) => prev.filter((item) => !selectedIds.has(item.id)))
    setSelectedIds(new Set())
  }, [selectedIds, supabase])

  const handleImport = useCallback(async (importItems: ImportItem[]) => {
    if (!restaurantId) return
    const rows = await Promise.all(importItems.map(async (imp, i) => {
      const categoryId = await ensureCategory(imp.category ?? 'Other')
      return {
        restaurant_id: restaurantId,
        category_id: categoryId,
        name: imp.name,
        description: imp.description,
        price: imp.price,
        currency: 'USD',
        image: imp.image ?? '',
        ingredients: imp.ingredients ?? [],
        allergens: imp.allergens ?? [],
        metadata: { dietaryTags: imp.dietaryTags ?? [] },
        is_available: true,
        preparation_time: imp.preparationTime ?? 15,
        sort_order: menuItems.length + i,
      }
    }))
    const { data, error } = await (supabase.from('menu_items') as any).insert(rows).select('*')
    if (error || !data) return
    setMenuItems((prev) => [...prev, ...data.map(rowToMenuItem)])
  }, [menuItems.length, restaurantId, ensureCategory, supabase])

  const exportCSV = useCallback(() => {
    const header = 'Name,Description,Price,Category,Prep Time,Available'
    const rows = menuItems.map(
      (i) =>
        `"${i.name}","${i.description}",${i.price},"${CATEGORY_MAP[i.categoryId] ?? 'Other'}",${i.preparationTime},${i.available}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'menu.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [menuItems, CATEGORY_MAP])

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {loadError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-text-tertiary gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading menu…
        </div>
      ) : (
      <>
      {/* Header */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Menu Management</h1>
          <p className="text-sm text-text-secondary mt-1">{stats.total} items across {stats.categories} categories</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => { setEditItem(null); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: stats.total, icon: Utensils },
          { label: 'Categories', value: stats.categories, icon: Tag },
          { label: 'Avg Price', value: formatCurrency(stats.avgPrice, menuItems[0]?.currencyCode ?? 'USD'), icon: DollarSign },
          { label: 'Available', value: stats.onSale, icon: Eye },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <stat.icon className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary leading-tight">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Search + View Toggle */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
          />
        </div>
        <div className="flex bg-surface-secondary rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div variants={ITEM} className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'bg-amber-500 text-white'
                : 'text-text-secondary hover:bg-surface-secondary'
            )}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400 shrink-0">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setShowBulkPrice(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Update Price
                </button>
                <button
                  onClick={() => setShowBulkCategory(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" /> Category
                </button>
                <button
                  onClick={bulkToggleAvailability}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Toggle
                </button>
                <button
                  onClick={bulkDelete}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Items */}
      {filtered.length === 0 ? (
        <motion.div variants={ITEM} className="text-center py-16 rounded-2xl bg-surface border border-border">
          <Utensils className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No menu items found</p>
          <p className="text-sm text-text-tertiary mt-1 mb-4">Add your first menu item or import from a file</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setEditItem(null); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <Upload className="w-4 h-4" /> Import
            </button>
          </div>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item, i) => {
            const cat = CATEGORY_MAP[item.categoryId] ?? 'Other'
            const selected = selectedIds.has(item.id)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'rounded-2xl bg-surface border overflow-hidden hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group',
                  selected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border hover:border-amber-500/20'
                )}
              >
                <div className={cn('aspect-[4/3] bg-gradient-to-br flex items-center justify-center relative', CATEGORY_COLORS[cat] ?? 'from-gray-400 to-slate-500')}>
                  <Utensils className="w-10 h-10 text-white/60" />
                  {!item.available && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Unavailable</span>
                  )}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-sm shadow-sm hover:bg-surface transition-colors"
                    >
                      {selected ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" /> : <Square className="w-3.5 h-3.5 text-text-tertiary" />}
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => { setEditItem(item); setShowForm(true) }}
                      className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-sm shadow-sm hover:bg-surface transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-sm shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
                    <GripVertical className="w-4 h-4 text-text-tertiary shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-text-tertiary line-clamp-1 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary font-medium">{item.preparationTime} min</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary font-medium">{cat}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(item.price, item.currencyCode)}</p>
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className="p-1 rounded-md hover:bg-surface-secondary transition-colors"
                    >
                      {item.available ? (
                        <Eye className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-text-tertiary" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
          {/* List Header */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-surface-secondary">
            <button onClick={toggleAll} className="shrink-0">
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className="w-4 h-4 text-text-tertiary" />
              )}
            </button>
            <span className="flex-1 text-xs font-medium text-text-tertiary uppercase tracking-wider">Item</span>
            <span className="w-24 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden sm:block">Category</span>
            <span className="w-16 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden sm:block">Prep</span>
            <span className="w-20 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">Price</span>
            <span className="w-10" />
          </div>

          <div className="divide-y divide-border-light">
            {filtered.map((item, i) => {
              const cat = CATEGORY_MAP[item.categoryId] ?? 'Other'
              const selected = selectedIds.has(item.id)
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'flex items-center gap-4 p-4 px-5 hover:bg-surface-secondary transition-colors',
                    selected && 'bg-amber-50/50 dark:bg-amber-900/10'
                  )}
                >
                  <button onClick={() => toggleSelect(item.id)} className="shrink-0">
                    {selected ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4 text-text-tertiary" />
                    )}
                  </button>
                  <GripVertical className="w-4 h-4 text-text-tertiary cursor-grab shrink-0" />
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0" style={{ backgroundImage: undefined }}>
                    <div className={cn('w-full h-full rounded-xl bg-gradient-to-br flex items-center justify-center', CATEGORY_COLORS[cat])}>
                      <Utensils className="w-4 h-4 text-white/60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                      {!item.available && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Unavailable</span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">{item.description}</p>
                  </div>
                  <span className="w-24 text-xs text-text-secondary hidden sm:block shrink-0">{cat}</span>
                  <span className="w-16 text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary text-center hidden sm:block shrink-0">{item.preparationTime}m</span>
                  <p className="w-20 text-sm font-bold text-amber-600 text-right shrink-0">{formatCurrency(item.price, item.currencyCode)}</p>
                  <div className="w-10 flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleAvailability(item.id)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
                      {item.available ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-text-tertiary" />}
                    </button>
                    <button onClick={() => { setEditItem(item); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
                      <Edit3 className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <MenuItemForm
            item={editItem ?? undefined}
            categories={categories}
            loading={formSubmitting}
            onSubmit={async (data) => {
              setFormSubmitting(true)
              try {
                const categoryId = data.categoryName
                  ? await ensureCategory(data.categoryName)
                  : data.categoryId!

                if (data.id) {
                  const { error } = await (supabase.from('menu_items') as any)
                    .update({
                      category_id: categoryId,
                      name: data.name,
                      description: data.description,
                      price: data.price,
                      image: data.image,
                      ingredients: data.ingredients,
                      allergens: data.allergens,
                      metadata: { dietaryTags: data.dietaryTags ?? [] },
                      is_available: data.available,
                      preparation_time: data.preparationTime,
                    })
                    .eq('id', data.id)
                  if (error) throw error
                  setMenuItems((prev) =>
                    prev.map((item) => (item.id === data.id ? { ...item, ...data, categoryId } as MenuItem : item))
                  )
                } else {
                  if (!restaurantId) throw new Error('No restaurant loaded')
                  const { data: row, error } = await (supabase.from('menu_items') as any)
                    .insert({
                      restaurant_id: restaurantId,
                      category_id: categoryId,
                      name: data.name ?? '',
                      description: data.description ?? '',
                      price: data.price ?? 0,
                      currency: 'USD',
                      image: data.image ?? '',
                      ingredients: data.ingredients ?? [],
                      allergens: data.allergens ?? [],
                      metadata: { dietaryTags: data.dietaryTags ?? [] },
                      is_available: data.available ?? true,
                      preparation_time: data.preparationTime ?? 15,
                      sort_order: menuItems.length,
                    })
                    .select('*')
                    .single()
                  if (error || !row) throw error ?? new Error('Insert failed')
                  setMenuItems((prev) => [...prev, rowToMenuItem(row)])
                }
                setShowForm(false)
                setEditItem(null)
              } catch {
                setLoadError('Failed to save menu item — please try again.')
              } finally {
                setFormSubmitting(false)
              }
            }}
            onClose={() => { setShowForm(false); setEditItem(null) }}
          />
        )}
      </AnimatePresence>

      {/* Import Wizard (manual / CSV / link / photo) */}
      <ImportWizard
        type="menu"
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onImport={handleImport}
      />

      {/* Bulk Price Modal */}
      <AnimatePresence>
        {showBulkPrice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowBulkPrice(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary font-heading">Bulk Price Update</h2>
                <button onClick={() => setShowBulkPrice(false)} className="p-2 rounded-lg hover:bg-surface-secondary">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <p className="text-sm text-text-secondary">{selectedIds.size} items selected</p>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Update type</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                  <option>Percentage increase</option>
                  <option>Percentage decrease</option>
                  <option>Set fixed price</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Value</label>
                <input type="number" placeholder="e.g. 10" className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <button
                onClick={() => { setShowBulkPrice(false); setSelectedIds(new Set()) }}
                className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                Apply Update
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Category Modal */}
      <AnimatePresence>
        {showBulkCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowBulkCategory(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary font-heading">Change Category</h2>
                <button onClick={() => setShowBulkCategory(false)} className="p-2 rounded-lg hover:bg-surface-secondary">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <p className="text-sm text-text-secondary">{selectedIds.size} items selected</p>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">New category</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                  {CATEGORY_TABS.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setShowBulkCategory(false); setSelectedIds(new Set()) }}
                className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                Apply Category
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </motion.div>
  )
}
