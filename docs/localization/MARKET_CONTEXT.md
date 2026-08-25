# Market Context

> Last updated: 2026-08-25

## 1. Authoritative sources

| Platform | Source of truth | Persistence |
|---|---|---|
| Web | `CountryProvider` (`src/components/shared/CountryProvider.tsx`) — module-level store + React context via `useSyncExternalStore` | `country` cookie (uppercase, 1y) + `afribook-country` localStorage |
| Mobile | `useMarketStore` (`mobile/src/stores/market-store.ts`) — zustand `persist` | AsyncStorage key `afribook-market` |
| Server | `resolveMarketContext(req, explicit?)` (`src/lib/localization/market-context.ts`) | Reads request headers/cookies per request |

There are no other components permitted to decide country/currency/market.

## 2. MarketContextDTO

Web context value (`useCountry()`):

```ts
{
  countryCode: string      // "MW"
  country: CountryConfig   // full config from COUNTRIES registry
  city: string             // "Lilongwe" (from destination refinement)
  marketSource: MarketSource
  marketReady: boolean     // true once resolution completed exactly once
  currencyCode: string     // "MWK" (derived via getCurrencyForCountry)
  locale: string           // derived from country config
  timezone: string         // e.g. "Africa/Blantyre"
  setCountry(code, { city?, navigate?, source? })
}
```

Server DTO (`MarketContext`, `src/lib/localization/market-context.ts`):

```ts
{
  countryCode, countryName, currencyCode, locale,
  timezone, isRTL, phoneFormat, categories
}
```

## 3. MarketSource values

`USER_SELECTED_COUNTRY` · `USER_SELECTED_CITY` · `DESTINATION_SEARCH` ·
`ACCOUNT_PREFERENCE` (hydrated from storage) · `URL_CONTEXT` (deep link) ·
`AUTO_FALLBACK` (safe configured fallback NG).

The source is recorded on every write and exposed to consumers for debugging.

## 4. Resolution precedence

```
1. Explicit in-session selection        (setCountry — wins over everything)
2. Saved user preference                (cookie/localStorage / AsyncStorage)
3. Destination/search context           (city refinement within the country)
4. URL country segment                  (only when nothing saved)
5. Device geolocation                   (currentLocation only; never overrides 1–4)
6. Safe configured fallback             (NG — never US)
```

## 5. Initialization contract

- Initialization runs **exactly once** per page load (`initializeMarket`,
  guarded by `initialized`), after hydration.
- SSR and first paint use a URL-derived snapshot only → zero hydration
  mismatch (see `src/tests/unit/country-provider-hydration.test.tsx`).
- Navigation NEVER re-runs initialization and never re-resolves from the
  pathname once an explicit or persisted selection exists.
- Authentication flows do not touch market state (market lives outside auth).

## 6. Transport to backend

- Web: `installMarketHeaderInterceptor()` (`src/lib/api-market.ts`) patches
  `window.fetch` once, adding `x-country-code: <CC>` to every same-origin
  `/api/*` request. Idempotent; uninstallable.
- Mobile: `ApiClient.getHeaders()` adds the same header from the market store.
- Server routes resolve with:
  `query param ?country= → x-country-code header → afribook-country cookie →
   cf-ipcountry → x-vercel-ip-country → Accept-Language → NG`.
