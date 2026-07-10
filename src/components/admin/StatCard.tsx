'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  change?: number
  changeLabel?: string
  accent?: string
  loading?: boolean
}

export default function AdminStatCard({ label, value, icon: Icon, change, changeLabel, accent, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary" />
          <div className="w-8 h-4 rounded bg-surface-secondary" />
        </div>
        <div className="w-20 h-8 rounded bg-surface-secondary mb-1" />
        <div className="w-24 h-3 rounded bg-surface-secondary" />
      </div>
    )
  }

  const positive = change !== undefined && change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl bg-surface border border-border p-5 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          accent || 'bg-amber-100 dark:bg-amber-900/30'
        )}>
          <Icon className={cn('w-5 h-5', accent ? 'text-white' : 'text-amber-600 dark:text-amber-400')} />
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
            positive
              ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
              : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
          )}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-0.5">
        {label}
        {changeLabel && <span className="text-text-tertiary ml-1">{changeLabel}</span>}
      </p>
    </motion.div>
  )
}
