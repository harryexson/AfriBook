import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface IconTileProps {
  icon: LucideIcon
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<IconTileProps['size']>, { box: string; icon: string }> = {
  sm: { box: 'w-9 h-9 rounded-lg', icon: 'w-4 h-4' },
  md: { box: 'w-12 h-12 rounded-xl', icon: 'w-5 h-5' },
  lg: { box: 'w-14 h-14 rounded-2xl', icon: 'w-6 h-6' },
}

/**
 * The colored rounded-square icon chip used across category grids and
 * benefit/feature sections (adapted from Sarwisi's icon-tile pattern —
 * see design direction notes). Solid amber gradient by default; pass
 * className to override for a specific section's accent needs.
 */
export default function IconTile({ icon: Icon, size = 'md', className }: IconTileProps) {
  const { box, icon } = SIZE_CLASSES[size]
  return (
    <div
      className={cn(
        box,
        'flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shrink-0',
        className,
      )}
    >
      <Icon className={icon} />
    </div>
  )
}
