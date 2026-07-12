'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface UpsellSuggestion {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  imageUrl?: string
  reason: string
  confidence: number
  category: 'pairing' | 'popular' | 'deal' | 'addon'
}

interface AiUpsellProps {
  cartItems: CartItem[]
  restaurantId: string
  currencyCode?: string
  onAddItem: (item: UpsellSuggestion) => void
  className?: string
}

const CATEGORY_LABELS: Record<UpsellSuggestion['category'], string> = {
  pairing: 'Perfect Pairing',
  popular: 'Popular Add-on',
  deal: 'Special Deal',
  addon: 'Complete Your Meal',
}

const CATEGORY_COLORS: Record<UpsellSuggestion['category'], string> = {
  pairing: 'bg-blue-50 text-blue-700 border-blue-200',
  popular: 'bg-orange-50 text-orange-700 border-orange-200',
  deal: 'bg-green-50 text-green-700 border-green-200',
  addon: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function AiUpsell({
  cartItems,
  restaurantId,
  currencyCode = 'NGN',
  onAddItem,
  className,
}: AiUpsellProps) {
  const [suggestions, setSuggestions] = useState<UpsellSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchSuggestions() {
      if (!cartItems.length) {
        setSuggestions([])
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/food/upsell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            cartItems: cartItems.map((i) => ({
              menuItemId: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions ?? [])
        }
      } catch {
        // Upsell suggestions are non-critical
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [cartItems, restaurantId])

  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => !dismissed.has(s.id)).slice(0, 3),
    [suggestions, dismissed],
  )

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  if (loading || !visibleSuggestions.length) return null

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">You might also like</span>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleSuggestions.map((suggestion) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            layout
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">{suggestion.name}</span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border',
                    CATEGORY_COLORS[suggestion.category],
                  )}
                >
                  {CATEGORY_LABELS[suggestion.category]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold">{formatPrice(suggestion.price)}</span>
                {suggestion.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(suggestion.originalPrice)}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground italic">{suggestion.reason}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddItem(suggestion)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => dismiss(suggestion.id)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
