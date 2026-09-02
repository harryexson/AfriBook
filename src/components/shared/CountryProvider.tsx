'use client'

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { COUNTRIES } from '@/lib/localization/countries'
import type { CountryConfig } from '@/lib/localization/countries'

const COUNTRY_COOKIE = 'country'
const COUNTRY_STORAGE_KEY = 'afribook-country'

interface SetCountryOptions {
  /** Hard-navigate to /CODE. Default true. Pass false when the caller
   *  manages the destination itself (e.g. the in-page DestinationSelector). */
  navigate?: boolean
}

interface CountryContextValue {
  countryCode: string
  country: CountryConfig
  setCountry: (code: string, options?: SetCountryOptions) => void
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

function countryFromPathname(pathname: string): string {
  const segment = pathname.split('/')[1]?.toUpperCase()
  if (segment && COUNTRIES[segment]) return segment
  return ''
}

function resolveCountry(pathname: string): string {
  return countryFromPathname(pathname) || readCookie() || readStorage() || 'NG'
}

function resolveServerCountry(pathname: string): string {
  return countryFromPathname(pathname) || 'NG'
}

// Real pub/sub so every mounted useCountry() consumer re-renders the
// instant setCountry() is called — not just when the URL pathname
// changes. Before this, switching country from the footer/header (or the
// destination selector's `navigate: false` path) silently updated the
// cookie/localStorage but never told React to re-read them, so any page
// not already re-rendering for an unrelated reason kept showing the old
// country/currency until the user happened to navigate somewhere else.
const countryChangeListeners = new Set<() => void>()

function subscribeToCountryChange(listener: () => void): () => void {
  countryChangeListeners.add(listener)
  return () => countryChangeListeners.delete(listener)
}

function notifyCountryChange() {
  for (const listener of countryChangeListeners) listener()
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const getSnapshot = useCallback(() => resolveCountry(pathname), [pathname])
  const getServerSnapshot = useCallback(
    () => resolveServerCountry(pathname),
    [pathname],
  )
  const countryCode = useSyncExternalStore(
    subscribeToCountryChange,
    getSnapshot,
    getServerSnapshot,
  )

  const setCountry = useCallback((code: string, options?: SetCountryOptions) => {
    const normalized = code.toUpperCase()
    if (!COUNTRIES[normalized]) return
    document.cookie = `${COUNTRY_COOKIE}=${normalized}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    try {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, normalized)
    } catch {
      // ignore storage errors
    }
    // Update every useCountry() consumer immediately, regardless of
    // whether we navigate below — this is what makes the change apply
    // across the whole site (header, footer, rides, hotels, checkout...)
    // in one shot instead of only wherever a route happens to re-render.
    notifyCountryChange()

    const navigate = options?.navigate ?? true
    if (!navigate) return
    // Only hard-navigate when we're already on a bare country-home route
    // (e.g. `/US`, matched by the `[country]` dynamic segment) — that
    // page is server-rendered per path segment, so it genuinely needs a
    // new URL to show the new country's content. Every other route
    // (rides, stays, checkout, vendor, ...) reads country from this
    // context reactively via the notify above, so forcing a redirect
    // there would just discard whatever the user was doing.
    const isCountryHomeRoute = /^\/[A-Za-z]{2}$/.test(window.location.pathname)
    if (isCountryHomeRoute && window.location.pathname !== `/${normalized}`) {
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
