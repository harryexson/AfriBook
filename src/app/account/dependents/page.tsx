'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ShieldCheck, UserPlus, Trash2, Loader2, Baby, HeartHandshake, X,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

interface Dependent {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  is_minor: boolean
}

/**
 * Caregiver/organization dashboard: manage the people you're responsible
 * for monitoring — minors, elderly relatives, people with disabilities, or
 * anyone else in your care — book rides on their behalf, and see their
 * trips live via the same shareable /track link riders get automatically.
 */
export default function DependentsPage() {
  const [dependents, setDependents] = useState<Dependent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addIsMinor, setAddIsMinor] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/caregiver/dependents')
      .then((res) => res.json())
      .then((body) => {
        if (!body.success) {
          setError(body.error ?? 'Failed to load')
          return
        }
        setDependents(body.dependents)
        setError('')
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleAdd = async () => {
    setAddBusy(true)
    setAddError('')
    try {
      const res = await fetch('/api/caregiver/dependents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, isMinor: addIsMinor }),
      })
      const body = await res.json()
      if (!body.success) {
        setAddError(body.error ?? 'Failed to link')
        return
      }
      setShowAdd(false)
      setAddEmail('')
      setAddIsMinor(false)
      load()
    } catch {
      setAddError('Failed to link')
    } finally {
      setAddBusy(false)
    }
  }

  const handleRemove = async (id: string) => {
    await fetch(`/api/caregiver/dependents/${id}`, { method: 'DELETE' })
    setDependents((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
      <motion.div variants={ITEM} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-amber-500" />
            People I Look After
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Book and monitor rides for a minor, an elderly relative, or anyone else in your care.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add
        </button>
      </motion.div>

      {loading && (
        <div className="flex items-center gap-2 text-text-secondary py-10 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 py-4">{error}</p>
      )}

      {!loading && !error && dependents.length === 0 && (
        <motion.div variants={ITEM} className="text-center py-16 rounded-2xl border border-dashed border-border">
          <ShieldCheck className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No one linked yet</p>
          <p className="text-sm text-text-tertiary mt-1">Add someone by their AfriBook account email to start monitoring their trips.</p>
        </motion.div>
      )}

      {!loading && !error && dependents.length > 0 && (
        <motion.div variants={ITEM} className="space-y-2">
          {dependents.map((dep) => (
            <div key={dep.id} className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                dep.is_minor ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30',
              )}>
                {dep.is_minor ? <Baby className="w-5 h-5 text-blue-600" /> : <ShieldCheck className="w-5 h-5 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{dep.full_name ?? dep.email}</p>
                <p className="text-xs text-text-secondary truncate">{dep.email}{dep.is_minor ? ' · Minor' : ''}</p>
              </div>
              <button
                onClick={() => handleRemove(dep.id)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Remove"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {showAdd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary">Add someone to monitor</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-surface-secondary">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            <label className="text-xs font-semibold text-text-secondary">Their AfriBook account email</label>
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />

            <label className="flex items-center gap-2 mt-3 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={addIsMinor} onChange={(e) => setAddIsMinor(e.target.checked)} />
              This person is a minor
            </label>

            {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}

            <p className="text-[11px] text-text-tertiary mt-3">
              They'll be notified that you've linked their account for ride-safety monitoring, and can remove the link at any time from their own account.
            </p>

            <button
              onClick={handleAdd}
              disabled={addBusy || !addEmail}
              className="w-full mt-4 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all"
            >
              {addBusy ? 'Linking…' : 'Link account'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
