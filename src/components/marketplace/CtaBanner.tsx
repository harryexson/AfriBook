import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface CtaBannerStat {
  label: string
  value: string
}

interface CtaBannerProps {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  stats: CtaBannerStat[]
  /** 'dark' for a neutral navy banner, 'amber' for the brand-accent
   *  treatment — pick 'amber' only when the surrounding page is otherwise
   *  quiet, so it doesn't compete with another amber CTA nearby. */
  variant?: 'dark' | 'amber'
  className?: string
}

/**
 * Recurring recruitment-moment banner (adapted from Sarwisi's "Become a
 * Tasker"/"Become a Driver" banner pattern — see design-direction notes).
 * Built from AfriBook's own existing pieces rather than a fabricated photo
 * collage: the route/path motif already used in the homepage hero (the
 * "something is en route" signature element from MASTER.md) as the
 * decorative graphic, and the floating-stat-card treatment already used on
 * /sell and /rides — so this is a real consolidation, not a new visual
 * language.
 */
export default function CtaBanner({
  icon: Icon,
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  stats,
  variant = 'dark',
  className,
}: CtaBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-8 sm:p-12',
        variant === 'dark' ? 'bg-dark-300' : 'bg-gradient-to-br from-amber-600 to-amber-700',
        className,
      )}
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14] motion-reduce:opacity-[0.1]"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M -30 340 C 120 320, 160 180, 320 170 S 520 60, 680 110 S 860 90, 920 200"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="2 14"
          strokeLinecap="round"
        />
        <circle cx="320" cy="170" r="5" fill="white" />
        <circle cx="680" cy="110" r="5" fill="white" />
      </svg>

      <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
            <Icon className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold font-heading text-white leading-tight text-balance">
            {title}
          </h2>
          <p className="mt-3 max-w-lg text-white/70">{description}</p>
          <Button href={ctaHref} className="mt-6" size="lg">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md p-4 sm:p-5"
            >
              <p className="font-heading text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
