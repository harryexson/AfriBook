'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { Staff } from '@/types'

interface ProviderCardProps {
  staff: Staff
  /** Highlights the card as the current selection (e.g. in a booking picker). */
  selected?: boolean
  selectLabel?: string
  onSelect?: (staff: Staff) => void
  onViewProfile?: (staff: Staff) => void
  className?: string
}

/**
 * Provider/tasker selection card — avatar, rating, role/bio blurb, and a
 * "View profile" + "Select" action row. Adapted from Sarwisi's tasker-list
 * pattern (see design-direction notes): this is the piece AfriBook didn't
 * have a dedicated component for — picking a specific barber, stylist, or
 * photographer at a business, as opposed to just picking a service.
 */
export default function ProviderCard({
  staff,
  selected = false,
  selectLabel = 'Select',
  onSelect,
  onViewProfile,
  className,
}: ProviderCardProps) {
  return (
    <Card
      padding="md"
      className={cn(
        'flex items-start gap-4',
        selected && 'border-amber-500/50 ring-1 ring-amber-500/30',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shrink-0">
        {staff.avatarUrl ? (
          <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          staff.name.charAt(0)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-text-primary">{staff.name}</h4>
            <p className="text-sm text-text-secondary">{staff.role}</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-text-primary shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {staff.rating.toFixed(1)}
          </span>
        </div>

        {staff.bio && <p className="mt-1.5 text-sm text-text-secondary line-clamp-2">{staff.bio}</p>}

        <div className="flex items-center gap-2 mt-3">
          {onViewProfile && (
            <Button variant="secondary" size="sm" onClick={() => onViewProfile(staff)}>
              View profile
            </Button>
          )}
          <Button variant={selected ? 'dark' : 'primary'} size="sm" onClick={() => onSelect?.(staff)}>
            {selected ? 'Selected' : selectLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}
