'use client'

import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabel: string
}

export default function StepIndicator({ currentStep, totalSteps, stepLabel }: StepIndicatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text-secondary">{stepLabel}</span>
        <span className="text-text-tertiary">
          {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-500',
              i < currentStep
                ? 'bg-amber-500'
                : i === currentStep - 1
                ? 'bg-amber-400'
                : 'bg-border'
            )}
          />
        ))}
      </div>
    </div>
  )
}
