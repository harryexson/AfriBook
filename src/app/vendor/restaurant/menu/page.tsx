'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Search, Edit3, Trash2, Eye, EyeOff, GripVertical,
  Utensils, DollarSign, X,
} from 'lucide-react'
import MenuItemForm from '@/components/vendor/MenuItemForm'
import type { MenuCategory, MenuItem } from '@/types'

const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 'mc1', businessId: 'b1', name: 'Starters', sortOrder: 0, items: [
    { id: 'mi1', businessId: 'b1', categoryId: 'mc1', name: 'Suya Skewers', description: 'Spiced grilled beef skewers with yaji spice', price: 2500, currencyCode: 'XAF', image: '', ingredients: ['beef', 'yaji spice', 'onions'], allergens: [], dietaryTags: ['Halal'], available: true, preparationTime: 15, sortOrder: 0 },
    { id: 'mi2', businessId: 'b1', categoryId: 'mc1', name: 'Plantain Chips', description: 'Crispy thinly sliced plantain', price: 1000, currencyCode: 'XAF', image: '', ingredients: ['plantain', 'palm oil', 'salt'], allergens: [], dietaryTags: ['Vegan', 'Gluten-Free'], available: true, preparationTime: 5, sortOrder: 1 },
  ]},
  { id: 'mc2', businessId: 'b1', name: 'Main Course', sortOrder: 1, items: [
    { id: 'mi3', businessId: 'b1', categoryId: 'mc2', name: 'Jollof Rice', description: 'Classic West African jollof with chicken', price: 4500, currencyCode: 'XAF', image: '', ingredients: ['rice', 'tomato', 'chicken', 'peppers'], allergens: [], dietaryTags: ['Halal'], available: true, preparationTime: 25, sortOrder: 0 },
    { id: 'mi4', businessId: 'b1', categoryId: 'mc2', name: 'Pounded Yam & Egusi', description: 'Pounded yam with melon seed soup', price: 5000, currencyCode: 'XAF', image: '', ingredients: ['yam', 'egusi', 'spinach', 'palm oil'], allergens: [], dietaryTags: ['Vegan'], available: true, preparationTime: 30, sortOrder: 1 },
  ]},
  { id: 'mc3', businessId: 'b1', name: 'Beverages', sortOrder: 2, items: [
    { id: 'mi5', businessId: 'b1', categoryId: 'mc3', name: 'Chapman', description: 'Refreshing cocktail mocktail', price: 1500, currencyCode: 'XAF', image: '', ingredients: ['fanta', 'sprite', 'grenadine', 'cucumber'], allergens: [], dietaryTags: ['Vegan'], available: true, preparationTime: 3, sortOrder: 0 },
  ]},
]

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function MenuPage() {
  const [categories] = useState<MenuCategory[]>(MOCK_CATEGORIES)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)

  const allItems = categories.flatMap((c) => c.items)

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Menu</h1>
          <p className="text-sm text-text-secondary mt-1">{allItems.length} items across {categories.length} categories</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkUpdate(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <DollarSign className="w-4 h-4" /> Bulk Price Update
          </button>
          <button
            onClick={() => { setEditItem(null); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </motion.div>

      <motion.div variants={ITEM}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
          />
        </div>
      </motion.div>

      {/* Menu by category */}
      <div className="space-y-8">
        {categories.map((category) => (
          <motion.div key={category.id} variants={ITEM}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">{category.name}</h2>
              <span className="text-sm text-text-tertiary">({category.items.length})</span>
            </div>

            <div className="rounded-2xl bg-surface border border-border overflow-hidden">
              <div className="divide-y divide-border-light">
                {category.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 p-4 px-5 hover:bg-surface-secondary transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-text-tertiary cursor-grab shrink-0" />

                    <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                      <Utensils className="w-5 h-5 text-amber-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                        {!item.available && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Unavailable</span>
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary truncate mt-0.5">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary">{item.preparationTime} min</span>
                        {item.allergens.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">Allergens</span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-bold text-amber-600 shrink-0">
                      {formatCurrency(item.price, item.currencyCode)}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.available ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-text-tertiary" />}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditItem(item); setShowForm(true) }}
                        className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <MenuItemForm
            item={editItem ?? undefined}
            onSubmit={() => { setShowForm(false); setEditItem(null) }}
            onClose={() => { setShowForm(false); setEditItem(null) }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Update Modal */}
      <AnimatePresence>
        {showBulkUpdate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowBulkUpdate(false)}
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
                <button onClick={() => setShowBulkUpdate(false)} className="p-2 rounded-lg hover:bg-surface-secondary">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Apply to category</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
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
              <button className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
                Apply Update
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
