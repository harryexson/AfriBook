'use client'

import { motion } from 'framer-motion'
import { Globe, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import StepIndicator from './StepIndicator'

interface OnboardingLayoutProps {
  children: React.ReactNode
  currentStep: number
  totalSteps: number
  stepLabel: string
  showBack?: boolean
  onBack?: () => void
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  stepLabel,
  showBack = false,
  onBack,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary font-heading">AfriBook</span>
          </Link>
        </div>
        {showBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="px-4 sm:px-6 pt-6">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabel={stepLabel} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
