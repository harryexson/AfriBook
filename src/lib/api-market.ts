import { getMarketState } from '@/components/shared/CountryProvider'

/**
 * Global market-header propagation for client → API requests.
 *
 * Installs a single window.fetch interceptor (idempotent) that attaches the
 * authoritative market context as an `x-country-code` header on every
 * same-origin `/api/...` request. Backend routes resolve market via
 * `resolveMarketContext(req, queryParam)`, so query-param-less calls still
 * reach the correct market instead of falling through to server defaults.
 */

const INTERCEPTOR_FLAG = '__afribookMarketInterceptor'

export function installMarketHeaderInterceptor(): () => void {
  if (typeof window === 'undefined') return () => {}
  const w = window as typeof window & { [INTERCEPTOR_FLAG]?: boolean }
  if (w[INTERCEPTOR_FLAG]) return () => {}
  w[INTERCEPTOR_FLAG] = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const url =
        input instanceof Request
          ? input.url
          : typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : ''

      const isApiCall = url.startsWith('/api/') || new URL(url, window.location.origin).origin === window.location.origin && new URL(url, window.location.origin).pathname.startsWith('/api/')

      if (isApiCall) {
        const countryCode = getMarketState().countryCode
        if (countryCode) {
          const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
          if (!headers.has('x-country-code')) {
            headers.set('x-country-code', countryCode)
          }
          if (input instanceof Request) {
            return originalFetch(new Request(input, { headers }))
          }
          return originalFetch(input, { ...init, headers })
        }
      }
    } catch {
      // Never break a request because of header decoration.
    }
    return originalFetch(input as RequestInfo, init)
  }

  return () => {
    window.fetch = originalFetch
    delete w[INTERCEPTOR_FLAG]
  }
}
