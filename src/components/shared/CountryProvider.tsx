'use client'

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { COUNTRIES } from '@/lib/localization/countries'
import type { CountryConfig } from '@/lib/localization/countries'

const COUNTRY_COOKIE = 'country'
const COUNTRY_STORAGE_KEY = 'afribook-country'

interface CountryContextValue {
  countryCode: string
  country: CountryConfig
  setCountry: (code: string) => void
}

const CountryContext = createContext<CountryContextValue | null>(null)

function readCookie(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/country=([A-Za-z]{2})/)
  return match?.[1]?.toUpperCase() ?? ''
}

function readStorage(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(COUNTRY_STORAGE_KEY)?.toUpperCase() ?? ''
  } catch {
    return ''
  }
}

function resolveCountry(pathname: string): string {
  const segment = pathname.split('/')[1]?.toUpperCase()
  if (segment && COUNTRIES[segment]) return segment
  return readCookie() || readStorage() || 'NG'
}

function noopSubscribe(): () => void {
  return () => {}
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const getSnapshot = useCallback(() => resolveCountry(pathname), [pathname])
  const countryCode = useSyncExternalStore(noopSubscribe, getSnapshot, getSnapshot)

  const setCountry = useCallback((code: string) => {
    const normalized = code.toUpperCase()
    if (!COUNTRIES[normalized]) return
    document.cookie = `${COUNTRY_COOKIE}=${normalized}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    try {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, normalized)
    } catch {
      // ignore storage errors
    }
    if (window.location.pathname !== `/${normalized}`) {
      window.location.assign(`/${normalized}`)
    }
  }, [])

  const country = COUNTRIES[countryCode] ?? COUNTRIES.NG

  return (
    <CountryContext.Provider value={{ countryCode, country, setCountry }}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider')
  return ctx
}
