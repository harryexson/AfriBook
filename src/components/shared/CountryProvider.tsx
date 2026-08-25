'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { COUNTRIES } from '@/lib/localization/countries'
import type { CountryConfig } from '@/lib/localization/countries'
import { getCurrencyForCountry } from '@/lib/money'
import { getLocaleFromCountry } from '@/lib/localization'
import { installMarketHeaderInterceptor } from '@/lib/api-market'

/**
 * GlobalMarketContext — the SINGLE authoritative source of market state for
 * the entire web app (UI, fetches, currency, locale, timezone).
 *
 * Resolution precedence (highest wins, evaluated once per session):
 *   1. Explicit in-session selection        (setMarket / setCountry)
 *   2. Saved user preference                (localStorage + cookie)
 *   3. URL country segment                  (deep link / shared URL only)
 *   4. Safe configured fallback             (NG — never silently US)
 *
 * Once a market exists (from 1 or 2) it is NEVER recomputed on navigation.
 * Pathname changes cannot overwrite an explicit or persisted selection.
 */

const COUNTRY_COOKIE = 'country'
const COUNTRY_STORAGE_KEY = 'afribook-country'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type MarketSource =
  | 'USER_SELECTED_COUNTRY'
  | 'USER_SELECTED_CITY'
  | 'DESTINATION_SEARCH'
  | 'ACCOUNT_PREFERENCE'
  | 'URL_CONTEXT'
  | 'AUTO_FALLBACK'

export interface MarketState {
  countryCode: string
  /** Selected city within the country (part of the market identity). */
  city: string
  source: MarketSource
  /** True once post-hydration resolution has completed exactly once. */
  initialized: boolean
}

interface SetCountryOptions {
  city?: string
  navigate?: boolean
  source?: MarketSource
}

// ─── Module-level store singleton ─────────────────────────────

let storeState: MarketState = {
  countryCode: '',
  city: '',
  source: 'AUTO_FALLBACK',
  initialized: false,
}

const listeners = new Set<() => void>()

function notify(): void {
  for (const fn of listeners) fn()
}

function setStore(next: Partial<MarketState>): void {
  storeState = { ...storeState, ...next }
  notify()
}

/** Current authoritative market — readable outside React (fetch interceptor). */
export function getMarketState(): MarketState {
  return storeState
}

/** Test-only: restore the pristine pre-initialization state. */
export function __resetMarketStoreForTests(): void {
  storeState = {
    countryCode: '',
    city: '',
    source: 'AUTO_FALLBACK',
    initialized: false,
  }
  notify()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ─── Persistence helpers ──────────────────────────────────────

function readCookie(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`${COUNTRY_COOKIE}=([A-Za-z]{2})`))
  return match?.[1]?.toUpperCase() ?? ''
}

function writeCookie(code: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COUNTRY_COOKIE}=${code}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
}

function readStorage(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(COUNTRY_STORAGE_KEY)?.toUpperCase() ?? ''
  } catch {
    return ''
  }
}

function writeStorage(code: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COUNTRY_STORAGE_KEY, code)
  } catch {
    // ignore storage errors
  }
}

function countryFromPathname(pathname: string): string {
  const segment = pathname.split('/')[1]?.toUpperCase()
  if (segment && COUNTRIES[segment]) return segment
  return ''
}

/**
 * One-time client initialization. Saved preference beats the URL so that a
 * persisted selection survives navigation, deep links and new tabs; the URL
 * segment is only consulted when nothing has ever been saved.
 */
function initializeMarket(pathname: string): void {
  if (storeState.initialized || typeof window === 'undefined') return

  const saved = readCookie() || readStorage()
  if (saved && COUNTRIES[saved]) {
    setStore({
      countryCode: saved,
      city: storeState.city,
      source: 'ACCOUNT_PREFERENCE',
      initialized: true,
    })
    // Normalize cookie casing (proxy may have written lowercase).
    if (readCookie() !== saved) writeCookie(saved)
    return
  }

  const fromUrl = countryFromPathname(pathname)
  if (fromUrl) {
    setStore({ countryCode: fromUrl, source: 'URL_CONTEXT', initialized: true })
    writeStorage(fromUrl)
    writeCookie(fromUrl)
    return
  }

  // Nothing resolvable — keep the pre-hydration display fallback but mark
  // initialized so we never re-resolve mid-session. NG is the configured
  // safe fallback; it is NEVER the United States.
  setStore({ countryCode: 'NG', source: 'AUTO_FALLBACK', initialized: true })
}

// ─── React binding ────────────────────────────────────────────

interface CountryContextValue {
  countryCode: string
  country: CountryConfig
  city: string
  marketSource: MarketSource
  marketReady: boolean
  currencyCode: string
  locale: string
  timezone: string
  setCountry: (code: string, options?: SetCountryOptions) => void
}

const CountryContext = createContext<CountryContextValue | null>(null)

export function CountryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Server snapshot AND pre-initialization client snapshot: derived purely
  // from the URL (no browser storage) so SSR and first hydration paint are
  // identical. After mount, initializeMarket() swaps in the authoritative
  // value (saved preference first).
  const getUrlSnapshot = useCallback(
    () => ({
      ...storeState,
      countryCode: countryFromPathname(pathname) || 'NG',
      source: 'URL_CONTEXT' as MarketSource,
      initialized: false,
    }),
    [pathname],
  )

  const getSnapshot = useCallback(
    () => (storeState.initialized ? storeState : getUrlSnapshot()),
    [getUrlSnapshot],
  )

  const state = useSyncExternalStore(subscribe, getSnapshot, getUrlSnapshot)

  useEffect(() => {
    initializeMarket(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const uninstall = installMarketHeaderInterceptor()
    return uninstall
  }, [])

  const setCountry = useCallback(
    (code: string, options?: SetCountryOptions) => {
      const normalized = code.toUpperCase()
      if (!COUNTRIES[normalized]) return
      writeCookie(normalized)
      writeStorage(normalized)
      setStore({
        countryCode: normalized,
        city: options?.city ?? storeState.city,
        source: options?.source ?? 'USER_SELECTED_COUNTRY',
        initialized: true,
      })
      const navigate = options?.navigate ?? true
      if (
        navigate &&
        typeof window !== 'undefined' &&
        window.location.pathname.split('/')[1]?.toUpperCase() !== normalized
      ) {
        window.location.assign(`/${normalized}`)
      }
    },
    [],
  )

  const value = useMemo<CountryContextValue>(() => {
    const code = state.countryCode
    const country = COUNTRIES[code] ?? COUNTRIES.NG
    return {
      countryCode: code,
      country,
      city: state.city,
      marketSource: state.source,
      marketReady: state.initialized,
      currencyCode: getCurrencyForCountry(code),
      locale: getLocaleFromCountry(code),
      timezone: country.timezone,
      setCountry,
    }
  }, [state, setCountry])

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider')
  return ctx
}
