'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Package, Store, Truck, ClipboardCheck, Camera, ChevronRight } from 'lucide-react'

export type DeliveryStep =
  | 'assigned'
  | 'arrived_at_vendor'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'

interface DeliveryProgressProps {
  currentStep: DeliveryStep
  onStepClick?: (step: DeliveryStep) => void
}

const STEPS: { key: DeliveryStep; label: string; description: string; icon: typeof Package }[] = [
  { key: 'assigned', label: 'Assigned', description: 'Delivery request accepted', icon: ClipboardCheck },
  { key: 'arrived_at_vendor', label: 'Arrive at Vendor', description: 'Navigate to pickup location', icon: Store },
  { key: 'picked_up', label: 'Pick Up', description: 'Verify code and collect items', icon: Package },
  { key: 'in_transit', label: 'In Transit', description: 'Delivering to customer', icon: Truck },
  { key: 'delivered', label: 'Delivered', description: 'Complete handoff to customer', icon: Camera },
]

export default function DeliveryProgress({ currentStep, onStepClick }: DeliveryProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="space-y-1">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex
        const isCurrent = i === currentIndex
        const isFuture = i > currentIndex
        const Icon = step.icon

        return (
          <button
            key={step.key}
            onClick={() => isCurrent && onStepClick?.(step.key)}
            disabled={!isCurrent && !isComplete}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left',
              isComplete && 'bg-emerald-50/50 dark:bg-emerald-900/10',
              isCurrent && 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
              isFuture && 'opacity-40',
              (isCurrent || isComplete) && 'cursor-pointer hover:brightness-95',
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
              isComplete && 'bg-emerald-500 text-white',
              isCurrent && 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
              isFuture && 'bg-surface-secondary text-text-tertiary',
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-semibold',
                isComplete && 'text-emerald-700 dark:text-emerald-400',
                isCurrent && 'text-amber-700 dark:text-amber-400',
                isFuture && 'text-text-secondary',
              )}>
                {step.label}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{step.description}</p>
            </div>
            {isCurrent && (
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ChevronRight className="w-5 h-5 text-amber-500" />
              </motion.div>
            )}
          </button>
        )
      })}
    </div>
  )
}
