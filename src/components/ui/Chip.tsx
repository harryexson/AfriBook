'use client'

import { cn } from '@/lib/utils'

export type ChipVariant = 'meta' | 'filter' | 'overlay'

interface ChipProps {
  label: string
  icon?: React.ReactNode
  /**
   * `meta` is the neutral read-only pill used for facts sitting under a title
   * (rating, prep time, distance). `filter` is selectable. `overlay` sits on
   * top of photography.
   */
  variant?: ChipVariant
  selected?: boolean
  onClick?: () => void
  className?: string
}

/**
 * The selectable pill, matched field-for-field with the React Native Chip in
 * mobile/src/components/ui/Chip.tsx so a filter row behaves and reads the same
 * on both platforms.
 *
 * Selected state is ink, not amber. Filter selection is a *state*; amber is
 * reserved for the one primary action on a screen, plus ratings and price
 * emphasis. Web previously filled selected pills amber, which meant a search
 * page could show a dozen amber pills competing with its amber CTA and the
 * colour stopped discriminating anything.
 */
export default function Chip({
  label,
  icon,
  variant = 'meta',
  selected = false,
  onClick,
  className,
}: ChipProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
    variant === 'meta' && 'bg-surface-tertiary text-text-secondary',
    variant === 'filter' && 'border border-border bg-surface text-text-secondary',
    variant === 'overlay' && 'bg-white text-text-primary',
    selected && 'border-dark-300 bg-dark-300 text-white',
    onClick && 'cursor-pointer active:scale-[0.97]',
    !selected && onClick && 'hover:border-amber-500/40 hover:text-text-primary',
    className,
  )

  if (!onClick) {
    return (
      <span className={classes}>
        {icon}
        {label}
      </span>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={classes}>
      {icon}
      {label}
    </button>
  )
}
