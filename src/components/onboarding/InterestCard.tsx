'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface InterestCardProps {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
}

export default function InterestCard({ emoji, label, selected, onClick }: InterestCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
        'hover:border-amber-300 hover:shadow-md',
        selected
          ? 'border-amber-500 bg-amber-50 shadow-md'
          : 'border-border bg-surface hover:bg-surface-secondary'
      )}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium text-text-primary text-center leading-tight">{label}</span>
    </motion.button>
  )
}
