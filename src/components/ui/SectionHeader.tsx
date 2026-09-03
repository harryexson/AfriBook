import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  viewAllHref?: string
  viewAllLabel?: string
  action?: React.ReactNode
}

/**
 * "Title + subtitle left, 'View all' link right" — used ad hoc across
 * homepage sections and search results; formalized here so every section
 * header shares the same spacing/type scale instead of drifting per page.
 */
export default function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold font-heading text-text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {action ?? (viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
        >
          {viewAllLabel}
          <ChevronRight className="w-4 h-4" />
        </Link>
      ))}
    </div>
  )
}
