'use client'

import { type ReactNode } from 'react'
import { LocationProvider } from '@/components/providers/LocationProvider'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <LocationProvider>{children}</LocationProvider>
}
