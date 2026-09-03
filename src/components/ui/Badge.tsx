import { cn } from '@/lib/utils'

export type BadgeVariant = 'neutral' | 'amber' | 'success' | 'dark'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-tertiary text-text-secondary border-border',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  dark: 'bg-dark-300/90 text-white border-white/10 backdrop-blur-sm',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: React.ReactNode
}

/** Pill badge — category tags, "Featured"/"Delivery available" flags,
 *  rating chips. One shape everywhere instead of each card inventing its
 *  own padding/radius/border combination. */
export default function Badge({ variant = 'neutral', icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}
