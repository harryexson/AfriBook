'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'
import type { Service } from '@/types'

interface ServiceFormProps {
  service?: Partial<Service>
  onSubmit: (data: Partial<Service>) => void
  onClose: () => void
  loading?: boolean
}

const CATEGORIES = [
  'Hair & Beauty', 'Wellness & Spa', 'Health & Fitness', 'Education & Tutoring',
  'Technology', 'Automotive', 'Home Services', 'Photography', 'Event Planning', 'Other',
]

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 480]

export default function ServiceForm({ service, onSubmit, onClose, loading }: ServiceFormProps) {
  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    duration: service?.duration ?? 60,
    price: service?.price ?? 0,
    category: service?.category ?? '',
    image: service?.image ?? '',
    maxCapacityPerSlot: service?.maxCapacityPerSlot ?? 1,
    paddingMinutes: service?.paddingMinutes ?? 0,
    available: service?.available ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...service, ...form, id: service?.id })
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
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary font-heading">
            {service?.id ? 'Edit Service' : 'Add Service'}
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
              placeholder="e.g. Haircut & Styling"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this service..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d} min`}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Max per slot</label>
              <input
                type="number"
                value={form.maxCapacityPerSlot}
                onChange={(e) => setForm({ ...form, maxCapacityPerSlot: Number(e.target.value) })}
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Image URL</label>
            <div className="relative">
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
            <div>
              <p className="text-sm font-medium text-text-primary">Available for booking</p>
              <p className="text-xs text-text-secondary">Customers can see and book this service</p>
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
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {service?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
