import { forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Amber, dark text (per design-system/afribook/MASTER.md — white-on-amber
  // reads worse than dark text at this hue), state changes via opacity only.
  primary:
    'bg-amber-500 text-amber-950 shadow-gold hover:bg-amber-400 hover:opacity-95 active:opacity-90',
  secondary:
    'bg-transparent text-text-primary border border-border hover:border-amber-500/40 hover:bg-surface-secondary',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
  dark: 'bg-dark-300 text-white hover:bg-dark-200',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2',
}

interface BaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: React.ReactNode
}

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined }

type ButtonAsLink = BaseProps &
  Omit<React.ComponentProps<typeof Link>, keyof BaseProps> & { href: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink

/**
 * The one button primitive. Pill-shaped, no translate/scale on hover or
 * active (design-system anti-pattern — layout-shifting hover states read as
 * sloppy on a transactional product). Renders a <Link> when `href` is
 * passed, a <button> otherwise, so call sites never hand-roll either.
 */
const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const classes = cn(
      'inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className,
    )

    if ('href' in props && props.href !== undefined) {
      const { href, ...linkProps } = props as ButtonAsLink
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...linkProps}
        >
          {children}
        </Link>
      )
    }

    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} {...(props as ButtonAsButton)}>
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export default Button
