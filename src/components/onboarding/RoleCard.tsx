'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface RoleCardProps {
  icon: LucideIcon
  title: string
  description: string
  selected: boolean
  onClick: () => void
}

export default function RoleCard({ icon: Icon, title, description, selected, onClick }: RoleCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200',
        'hover:border-amber-300 hover:shadow-md',
        selected
          ? 'border-amber-500 bg-amber-50 shadow-md'
          : 'border-border bg-surface hover:bg-surface-secondary'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
        selected ? 'bg-amber-500 text-white' : 'bg-surface-secondary text-text-secondary'
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
      </div>
    </motion.button>
  )
}
