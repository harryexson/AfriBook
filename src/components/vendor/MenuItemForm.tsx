'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, Plus, Loader2 } from 'lucide-react'
import type { MenuItem } from '@/types'

interface MenuItemFormProps {
  item?: Partial<MenuItem>
  onSubmit: (data: Partial<MenuItem> & { categoryName?: string }) => void
  onClose: () => void
  loading?: boolean
  /** Real categories for this restaurant, fetched by the page — this form
   *  previously had no category field at all, so every new item silently
   *  defaulted to a hardcoded "Mains" category regardless of what it
   *  actually was. */
  categories: { id: string; name: string }[]
}

const COMMON_ALLERGENS = ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Fish', 'Sesame', 'Sulfites']
const COMMON_DIETARY = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Keto', 'Organic']
const NEW_CATEGORY_VALUE = '__new__'

export default function MenuItemForm({ item, onSubmit, onClose, loading, categories }: MenuItemFormProps) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price ?? 0,
    image: item?.image ?? '',
    preparationTime: item?.preparationTime ?? 15,
    available: item?.available ?? true,
    sortOrder: item?.sortOrder ?? 0,
  })

  const [categoryChoice, setCategoryChoice] = useState(
    item?.categoryId ?? categories[0]?.id ?? NEW_CATEGORY_VALUE
  )
  const [newCategoryName, setNewCategoryName] = useState('')

  const [ingredients, setIngredients] = useState<string[]>(item?.ingredients ?? [])
  const [allergens, setAllergens] = useState<string[]>(item?.allergens ?? [])
  const [dietaryTags, setDietaryTags] = useState<string[]>(item?.dietaryTags ?? [])
  const [newIngredient, setNewIngredient] = useState('')

  const toggleArrayItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()])
      setNewIngredient('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isNewCategory = categoryChoice === NEW_CATEGORY_VALUE
    onSubmit({
      ...item,
      ...form,
      ingredients,
      allergens,
      dietaryTags,
      id: item?.id,
      categoryId: isNewCategory ? undefined : categoryChoice,
      categoryName: isNewCategory ? (newCategoryName.trim() || 'Other') : undefined,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-lg font-semibold text-text-primary font-heading">
            {item?.id ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Jollof Rice"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
            <select
              value={categoryChoice}
              onChange={(e) => setCategoryChoice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value={NEW_CATEGORY_VALUE}>+ New category…</option>
            </select>
            {categoryChoice === NEW_CATEGORY_VALUE && (
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                required
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Describe the dish..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Price</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                min="0"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Prep Time (min)</label>
              <input
                type="number"
                value={form.preparationTime}
                onChange={(e) => setForm({ ...form, preparationTime: Number(e.target.value) })}
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Image URL</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Ingredients</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add ingredient"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
              <button type="button" onClick={addIngredient} className="px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm font-medium hover:bg-surface-tertiary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ingredients.map((ing, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-medium text-text-secondary">
                    {ing}
                    <button type="button" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="text-text-tertiary hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Allergens</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGENS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAllergens(toggleArrayItem(allergens, a))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                    allergens.includes(a)
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-surface text-text-secondary border-border hover:border-red-200'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Dietary Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DIETARY.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDietaryTags(toggleArrayItem(dietaryTags, d))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                    dietaryTags.includes(d)
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-surface text-text-secondary border-border hover:border-emerald-200'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
            <div>
              <p className="text-sm font-medium text-text-primary">Available</p>
              <p className="text-xs text-text-secondary">Show on menu</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, available: !form.available })}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                form.available ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                form.available ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item?.id ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
