'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Clock, Leaf, AlertCircle } from 'lucide-react'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import { useLocalPrice } from '@/lib/use-local-price'
import type { MenuItem } from '@/types'

interface DishDialogProps {
  item: MenuItem | null
  prepTime: number
  onClose: () => void
  onAdd: (item: MenuItem, quantity: number, notes?: string) => void
}

/**
 * The web half of the dish configurator. Deliberately mirrors
 * mobile/src/components/food/DishSheet.tsx step for step — same fact chips,
 * same instructions field, same stepper, same "Add · <live total>" commit —
 * so the two platforms teach the same interaction rather than each inventing
 * their own add-to-cart.
 *
 * Adapted from the staged builder reference, where the total and prep
 * estimate respond as you choose. Built only on fields MenuItem actually
 * has: this menu model carries no variants or add-ons, and inventing them
 * would put fake choices in front of a real checkout.
 */
export default function DishDialog({ item, prepTime, onClose, onAdd }: DishDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const { price } = useLocalPrice()

  useEffect(() => {
    if (item) {
      setQuantity(1)
      setNotes('')
    }
  }, [item])

  // Escape closes, matching the scrim tap on mobile.
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, onClose])

  const total = item ? item.price * quantity : 0
  const spicy =
    item?.ingredients?.some((i) => /chili|pepper|yaji|suya|spicy/i.test(i)) ||
    item?.description?.toLowerCase().includes('spicy')

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={item.name}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl"
          >
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-text-primary text-balance">
                  {item.name}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-tertiary text-text-primary transition-colors hover:bg-border active:scale-[0.97]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip
                  label={`${prepTime}-${prepTime + 10} min`}
                  icon={<Clock className="h-3 w-3" />}
                />
                {item.dietaryTags?.includes('vegetarian') && (
                  <Chip label="Vegetarian" icon={<Leaf className="h-3 w-3 text-emerald-600" />} />
                )}
                {spicy && <Chip label="Spicy" />}
                {item.allergens?.length > 0 && (
                  <Chip
                    label={`Contains ${item.allergens.length}`}
                    icon={<AlertCircle className="h-3 w-3" />}
                  />
                )}
              </div>

              {item.description && (
                <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              )}

              {item.allergens?.length > 0 && (
                <p className="mt-2 text-xs text-text-tertiary">
                  Allergens: {item.allergens.join(', ')}
                </p>
              )}

              <label
                htmlFor="dish-notes"
                className="mt-6 block text-sm font-bold text-text-primary"
              >
                Special instructions
              </label>
              <textarea
                id="dish-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="No onions, extra spicy…"
                className="mt-2 w-full resize-none rounded-xl border border-border bg-surface-secondary p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">Quantity</span>
                <div className="flex items-center gap-2 rounded-full bg-surface-secondary p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity === 1}
                    aria-label="Decrease quantity"
                    className="grid h-9 w-9 place-items-center rounded-full bg-surface text-text-primary transition-colors disabled:opacity-40 active:scale-[0.95]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-7 text-center font-mono text-base font-bold tabular-nums text-text-primary">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="grid h-9 w-9 place-items-center rounded-full bg-surface text-text-primary transition-colors active:scale-[0.95]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Commit bar — the price rides on the button, as in the reference.
                The button always carries the vendor's own currency: that's
                the amount actually charged, matching how Uber, Airbnb and
                Bolt all price a listing in its own market's currency by
                default. A viewer who has opted into currency estimates (see
                the toggle in CountryNotice) gets a secondary, clearly
                labelled estimate underneath — never a substituted total. */}
            <div className="border-t border-border p-4">
              {(() => {
                const p = price(total, item.currencyCode)
                return (
                  <>
                    <Button
                      variant="dark"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        onAdd(item, quantity, notes.trim() || undefined)
                        onClose()
                      }}
                    >
                      Add · {p.display}
                    </Button>
                    {p.hasEstimate && (
                      <p className="mt-2 text-center text-xs text-text-tertiary">
                        Estimate ≈ {p.estimate} at today's indicative rate — you're charged {p.display}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
