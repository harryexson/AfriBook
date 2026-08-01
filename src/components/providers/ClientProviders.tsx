'use client'

import { type ReactNode } from 'react'
import { LocationProvider } from '@/components/providers/LocationProvider'
import { CountryProvider } from '@/components/shared/CountryProvider'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LocationProvider>
      <CountryProvider>{children}</CountryProvider>
    </LocationProvider>
  )
}
