# Geolocation Architecture

## Server-side country detection (`src/proxy.ts` — Next.js Proxy/Middleware)

Resolution order for the homepage redirect and country cookie:

1. **`country` cookie** (previously chosen, 1-year max-age, `sameSite:lax`).
2. **Subdomain / hostname** — `detectCountry`: `mw.afribook.xyz`, plus TLD map
   (`afribook.co.ke` → ke, `afribook.com.eg` → eg, etc.). Supports 17 codes.
3. **IP geolocation** — `countryFromIpHeaders`: `cf-ipcountry`, then
   `x-vercel-ip-country`.
4. **`Accept-Language`** — `parseCountryFromAcceptLanguage` (`en-NG` → ng,
   `ar-EG` → eg, …).
5. **Default `us`**.

The proxy also: sets `X-Detected-Country` on every response, redirects `/` →
`/{country}`, and enforces auth + role guards (`vendor`/`admin`/`driver`) on
protected prefixes.

> The middleware's country set (17 codes) is a **subset** of the full
> `SUPPORTED_COUNTRIES` from the localization layer. That is intentional for
> redirect targets; API routes and server components should use
> `resolveMarketContext` (which reads the headers the proxy sets/accepts).

## Server market resolver (`src/lib/localization/market-context.ts`)

`resolveMarketContext(req, explicitCountry?)` is the API/server-component
authority:

1. explicit `countryCode`
2. `x-country-code` header
3. `afribook-country` cookie
4. `cf-ipcountry`
5. `x-vercel-ip-country`
6. `Accept-Language` region, then language-only map
7. `DEFAULT_COUNTRY='US'`

Returns a `MarketContext` (country, currency, locale, timezone, RTL,
phoneFormat, categories).

## Client geolocation (`src/lib/geo.ts`)

- `requestGeolocation()` — `navigator.geolocation` wrapper.
- `reverseGeocode(lat, lng)` — coordinates → location/country for the picker.
- `getCountryFromCookie()` / `getCountryFromUrl()` — client reads of the same
  signals the proxy uses.
- `storeLocation`/`clearLocation`/`getStoredLocation`, `haversineDistance`,
  `formatDistance(km)` (localized distance formatting),
  `sortBusinessesByProximity`, `filterByProximity`.

## Client country state (`CountryProvider` / `CountrySelector`)

`src/components/shared/CountryProvider.tsx` hydrates market state (country,
currency) into React context and syncs the `country` cookie;
`CountrySelector.tsx` renders the picker. `src/components/shared/CurrencyDisplay`
(or equivalent) formats through `src/lib/money.ts`.

## Ordering of authority (user overrides everything)

```
User pick (CountrySelector / explicit param)
  > country cookie
  > subdomain / hostname
  > IP geolocation
  > Accept-Language
  > DEFAULT_COUNTRY (US)
```

Privacy note: IP geolocation is coarse (country-level) and never persisted in
profile data; it is only used to pick an initial market, which the user can
change.
