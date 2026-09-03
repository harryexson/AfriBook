import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the amber border-hover affordance for clickable cards (wrap in
   *  <Link> yourself — this component stays a plain div so it can sit
   *  inside any link/button without nesting interactive elements). */
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
}

/**
 * The one card shell. Flat shadow, generous radius, border-color-only
 * hover — no translateY/scale (design-system anti-pattern: this app is
 * browsed in long scrolling lists, and cards animating on scroll reads as
 * noisy, not premium). Every business/service/listing card should wrap
 * its content in this instead of redefining the shell per component.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, padding = 'md', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-sm transition-colors duration-200',
        interactive && 'hover:border-amber-500/30 hover:shadow-md cursor-pointer',
        PADDING_CLASSES[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

export default Card
