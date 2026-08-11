'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Search, Filter, Edit3, Trash2, Eye, EyeOff,
  Clock, CheckSquare, Upload,
} from 'lucide-react'
import ServiceForm from '@/components/vendor/ServiceForm'
import ImportWizard, { type ImportItem } from '@/components/vendor/ImportWizard'
import type { Service } from '@/types'

const MOCK_SERVICES: Service[] = [
  { id: 's1', businessId: 'b1', name: 'Haircut & Styling', description: 'Professional haircut with styling', duration: 60, price: 5000, currencyCode: 'XAF', category: 'Hair & Beauty', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  { id: 's2', businessId: 'b1', name: 'Braiding', description: 'Box braids, cornrows, twists', duration: 180, price: 15000, currencyCode: 'XAF', category: 'Hair & Beauty', available: true, maxCapacityPerSlot: 1, paddingMinutes: 0, createdAt: '', updatedAt: '' },
  { id: 's3', businessId: 'b1', name: 'Manicure & Pedicure', description: 'Complete nail care treatment', duration: 90, price: 8000, currencyCode: 'XAF', category: 'Wellness & Spa', available: true, maxCapacityPerSlot: 3, paddingMinutes: 10, createdAt: '', updatedAt: '' },
  { id: 's4', businessId: 'b1', name: 'Facial Treatment', description: 'Deep cleansing facial', duration: 45, price: 7000, currencyCode: 'XAF', category: 'Wellness & Spa', available: false, maxCapacityPerSlot: 1, paddingMinutes: 15, createdAt: '', updatedAt: '' },
]

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function ServicesPage() {
  const [services] = useState<Service[]>(MOCK_SERVICES)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)

  const handleImport = async (items: ImportItem[]) => {
    console.log('Importing services:', items)
  }

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Services</h1>
          <p className="text-sm text-text-secondary mt-1">{services.length} services total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => { setEditService(null); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="text-xs text-text-secondary px-3 py-1.5 rounded-lg bg-surface-secondary">
              {selected.length} selected
            </span>
          )}
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </motion.div>

      {/* Service list */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Scissors className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary font-medium">No services found</p>
            <p className="text-sm text-text-tertiary mt-1">Add your first service to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {filtered.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 px-5 hover:bg-surface-secondary transition-colors"
              >
                <button
                  onClick={() => toggleSelect(service.id)}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    selected.includes(service.id)
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-border hover:border-amber-300'
                  )}
                >
                  {selected.includes(service.id) && <CheckSquare className="w-3 h-3 text-white" />}
                </button>

                <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5 text-amber-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{service.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {service.duration} min
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-secondary">{service.category}</span>
                  </div>
                </div>

                <p className="text-sm font-bold text-text-primary shrink-0">
                  {formatCurrency(service.price, service.currencyCode)}
                </p>

                <div className="flex items-center gap-1 shrink-0">
                  {service.available ? (
                    <Eye className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-text-tertiary" />
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditService(service); setShowForm(true) }}
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
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <ServiceForm
            service={editService ?? undefined}
            onSubmit={() => { setShowForm(false); setEditService(null) }}
            onClose={() => { setShowForm(false); setEditService(null) }}
          />
        )}
      </AnimatePresence>

      <ImportWizard
        type="service"
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </motion.div>
  )
}

function Scissors(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}
