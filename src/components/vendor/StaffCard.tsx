'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Mail, Star, ChevronRight } from 'lucide-react'
import type { Staff } from '@/types'

interface StaffCardProps {
  staff: Staff
  onClick?: (staff: Staff) => void
  loading?: boolean
}

export default function StaffCard({ staff, onClick, loading }: StaffCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-secondary" />
          <div className="flex-1">
            <div className="w-28 h-4 rounded bg-surface-secondary mb-2" />
            <div className="w-36 h-3 rounded bg-surface-secondary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick?.(staff)}
      className="rounded-2xl bg-surface border border-border p-5 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {staff.avatarUrl ? (
            <img src={staff.avatarUrl} alt={staff.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-lg">
              {staff.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface',
            staff.isActive ? 'bg-emerald-500' : 'bg-gray-400'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary truncate">{staff.name}</h3>
            <span className="text-xs text-text-tertiary capitalize bg-surface-secondary px-2 py-0.5 rounded-full">
              {staff.role}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{staff.email}</span>
            </span>
            {staff.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {staff.rating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {staff.serviceIds.slice(0, 3).map((sid) => (
              <span key={sid} className="text-[10px] font-medium text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                Service
              </span>
            ))}
            {staff.serviceIds.length > 3 && (
              <span className="text-[10px] font-medium text-text-tertiary px-2 py-0.5 rounded-full bg-surface-secondary">
                +{staff.serviceIds.length - 3} more
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-1" />
      </div>
    </motion.div>
  )
}
