'use client'

import type { LucideIcon } from 'lucide-react'
import { BatteryFull, Wifi } from 'lucide-react'

interface PhoneTab {
  label: string
  icon: LucideIcon
  active?: boolean
}

interface PhoneScreenProps {
  header?: React.ReactNode
  children?: React.ReactNode
  tabs?: PhoneTab[]
  statusText?: string
  contentClassName?: string
}

export function PhoneScreen({
  header,
  children,
  tabs,
  statusText = '9:41',
  contentClassName,
}: PhoneScreenProps) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-dark-200 via-dark-300 to-dark-500 text-white">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pb-1 pt-3.5">
        <span className="text-[10px] font-semibold tracking-wide text-white/80">{statusText}</span>
        <span className="flex items-center gap-1.5 text-white/70">
          <Wifi className="h-2.5 w-2.5" />
          <BatteryFull className="h-3 w-3" />
        </span>
      </div>

      {/* Header */}
      {header && <div className="px-5 pt-1.5">{header}</div>}

      {/* Content */}
      <div className={`min-h-0 flex-1 overflow-hidden ${contentClassName ?? 'px-5 pb-2 pt-3'}`}>
        {children}
      </div>

      {/* Bottom tabs */}
      {tabs && tabs.length > 0 && (
        <div className="mt-1 border-t border-white/10 bg-dark-300/80 px-6 pb-3 pt-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            {tabs.map((tab) => (
              <div key={tab.label} className="flex flex-col items-center gap-1">
                <tab.icon
                  className={`h-4 w-4 ${tab.active ? 'text-amber-400' : 'text-white/35'}`}
                />
                <span
                  className={`text-[8px] font-medium ${
                    tab.active ? 'text-amber-400' : 'text-white/35'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PhoneMockupProps {
  children: React.ReactNode
  className?: string
  glow?: 'amber' | 'blue' | 'violet' | 'emerald' | 'rose' | 'none'
}

export default function PhoneMockup({
  children,
  className = '',
  glow = 'amber',
}: PhoneMockupProps) {
  const glowClass = {
    amber: 'shadow-[0_32px_80px_-24px_rgba(245,158,11,0.5)]',
    blue: 'shadow-[0_32px_80px_-24px_rgba(37,99,235,0.5)]',
    violet: 'shadow-[0_32px_80px_-24px_rgba(139,92,246,0.5)]',
    emerald: 'shadow-[0_32px_80px_-24px_rgba(16,185,129,0.5)]',
    rose: 'shadow-[0_32px_80px_-24px_rgba(244,63,94,0.5)]',
    none: 'shadow-2xl',
  }[glow]

  return (
    <div
      className={`relative h-[560px] w-[272px] shrink-0 overflow-hidden rounded-[2.75rem] border border-white/15 bg-dark-700 shadow-2xl ${glowClass} ${className}`}
    >
      {/* Dynamic island */}
      <div className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
      {/* Screen */}
      <div className="absolute inset-1 overflow-hidden rounded-[2.5rem] bg-dark-500">
        {children}
      </div>
    </div>
  )
}
