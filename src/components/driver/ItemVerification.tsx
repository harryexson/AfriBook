'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  name: string
  quantity: number
}

interface ItemVerificationProps {
  orderId: string
  role: 'vendor' | 'driver' | 'customer'
  items: Item[]
  verifiedBy: string
  onComplete: () => void
}

export default function ItemVerification({ orderId, role, items, verifiedBy, onComplete }: ItemVerificationProps) {
  const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set())
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false)
  const [discrepancyNotes, setDiscrepancyNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const toggleItem = (itemId: string) => {
    const next = new Set(verifiedItems)
    if (next.has(itemId)) next.delete(itemId)
    else next.add(itemId)
    setVerifiedItems(next)
  }

  const handleSubmit = async () => {
    if (verifiedItems.size !== items.length && !hasDiscrepancy) {
      setError('Verify all items or report a discrepancy')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/compliance/verify-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          verifiedBy,
          role,
          itemsConfirmed: items,
          hasDiscrepancy,
          discrepancyNotes: hasDiscrepancy ? discrepancyNotes : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Verification failed')
      }

      setDone(true)
      setTimeout(onComplete, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleLabels = { vendor: 'Vendor', driver: 'Driver', customer: 'Customer' }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-amber-600" />
        <h3 className="font-bold text-text-primary">Verify Items ({roleLabels[role]})</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const isVerified = verifiedItems.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              disabled={done}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                isVerified
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10'
                  : 'border-border bg-surface hover:border-amber-200 dark:hover:border-amber-800',
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isVerified ? 'bg-emerald-500 text-white' : 'bg-surface-secondary text-text-tertiary',
              )}>
                {isVerified ? <CheckCircle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{item.name}</p>
                <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasDiscrepancy"
          checked={hasDiscrepancy}
          onChange={(e) => setHasDiscrepancy(e.target.checked)}
          className="rounded border-border"
        />
        <label htmlFor="hasDiscrepancy" className="text-sm text-text-secondary">
          Report a discrepancy with items
        </label>
      </div>

      {hasDiscrepancy && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <textarea
            value={discrepancyNotes}
            onChange={(e) => setDiscrepancyNotes(e.target.value)}
            placeholder="Describe what's wrong..."
            className="flex-1 text-sm bg-transparent border-0 outline-none resize-none text-text-primary placeholder:text-text-tertiary"
            rows={2}
          />
        </motion.div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || done}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-all',
          done
            ? 'bg-emerald-500 text-white'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isSubmitting ? 'Submitting...' : done ? 'Verified!' : 'Confirm Item Integrity'}
      </button>
    </div>
  )
}
