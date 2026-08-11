'use client'

import { motion } from 'framer-motion'
import { Tag, Info } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface PriceLineItem {
  label: string
  amount: number
  type?: 'subtotal' | 'fee' | 'tax' | 'discount' | 'total'
}

interface PriceBreakdownProps {
  items: PriceLineItem[]
  currencyCode?: string
  promoCode?: string | null
  onApplyPromo?: (code: string) => void
  onRemovePromo?: () => void
  promoError?: string | null
  promoApplied?: boolean
  platformFeePercent?: number
  className?: string
}

export default function PriceBreakdown({
  items,
  currencyCode = 'NGN',
  promoCode,
  onApplyPromo,
  onRemovePromo,
  promoError,
  promoApplied = false,
  platformFeePercent = 10,
  className,
}: PriceBreakdownProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Line items */}
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              'flex items-center justify-between text-sm',
              item.type === 'total'
                ? 'pt-3 border-t border-border text-base font-bold text-text-primary'
                : item.type === 'discount'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-text-secondary'
            )}
          >
            <span>{item.label}</span>
            <span className="font-medium">
              {item.type === 'discount' ? '-' : ''}
              {formatCurrency(item.amount, currencyCode)}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Promo Code */}
      <div className={cn(
        'pt-3 border-t border-border',
        (onApplyPromo || promoCode) && 'space-y-2'
      )}>
        {promoCode && promoApplied ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Tag className="w-4 h-4" />
              {promoCode}
            </span>
            {onRemovePromo && (
              <button onClick={onRemovePromo} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                Remove
              </button>
            )}
          </div>
        ) : (
          onApplyPromo && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Promo code"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onApplyPromo((e.target as HTMLInputElement).value)
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('[data-promo-input]')
                  if (input) onApplyPromo(input.value)
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                Apply
              </button>
            </div>
          )
        )}
        {promoError && (
          <p className="text-xs text-red-500 mt-1">{promoError}</p>
        )}
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-secondary text-xs text-text-tertiary">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          By proceeding, you agree to our Terms of Service and Privacy Policy.
          {platformFeePercent > 0 && ` A ${platformFeePercent}% platform fee is included.`}
        </span>
      </div>
    </div>
  )
}

export type { PriceLineItem }
