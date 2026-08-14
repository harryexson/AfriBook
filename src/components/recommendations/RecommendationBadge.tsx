'use client'

import { useState } from 'react'
import { Info, Sparkles, TrendingUp, HeartHandshake, Megaphone, Star, BadgeCheck, Gem, Zap } from 'lucide-react'
import type { RecommendationReason } from '@/lib/recommendations/types'

const TONE_CLASSES: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/25 hover:bg-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 hover:bg-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-700 border-blue-500/25 hover:bg-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-700 border-purple-500/25 hover:bg-purple-500/20',
  neutral: 'bg-surface-tertiary text-text-secondary border-border hover:bg-surface-secondary',
}

const TONE_DARK: Record<string, string> = {
  amber: 'dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  emerald: 'dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  blue: 'dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',
  purple: 'dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
  neutral: 'dark:bg-dark-200 dark:text-text-tertiary dark:border-border',
}

const TYPE_ICONS: Record<string, typeof Sparkles> = {
  featured: Sparkles,
  popular: TrendingUp,
  recommended: HeartHandshake,
  sponsored: Megaphone,
  top_rated: Star,
  local_favorite: BadgeCheck,
  trending: Zap,
  new_and_noteworthy: Sparkles,
  best_value: Gem,
}

interface RecommendationBadgeProps {
  reason: RecommendationReason
  className?: string
}

/**
 * Distinct, explainable recommendation label. Every badge exposes a
 * "Why am I seeing this?" tooltip so users can trust the surface.
 */
export default function RecommendationBadge({ reason, className = '' }: RecommendationBadgeProps) {
  const [open, setOpen] = useState(false)
  const Icon = TYPE_ICONS[reason.type] ?? Sparkles

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${TONE_CLASSES[reason.tone] ?? TONE_CLASSES.neutral} ${TONE_DARK[reason.tone] ?? TONE_DARK.neutral}`}
      >
        <Icon className="h-3 w-3" />
        {reason.label}
        <Info className="h-3 w-3 opacity-70" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-white p-3 text-xs leading-relaxed text-text-secondary shadow-xl dark:bg-dark-200"
        >
          <span className="mb-1 flex items-center gap-1.5 font-semibold text-text-primary">
            <Icon className="h-3.5 w-3.5" />
            Why am I seeing this?
          </span>
          {reason.why}
        </span>
      )}
    </span>
  )
}