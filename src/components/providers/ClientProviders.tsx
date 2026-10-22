'use client'

import { type ReactNode } from 'react'
import { LocationProvider } from '@/components/providers/LocationProvider'
import { CountryProvider } from '@/components/shared/CountryProvider'
import { MotionConfig } from 'framer-motion'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user"><LocationProvider>
      <CountryProvider>{children}</CountryProvider>
    </LocationProvider></MotionConfig>
  )
}
