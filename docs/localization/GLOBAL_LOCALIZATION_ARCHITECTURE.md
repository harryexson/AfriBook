# Global Localization Architecture

> Status: **Authoritative** (supersedes LOCALIZATION_ARCHITECTURE.md where they conflict)
> Last updated: 2026-08-25

## 1. Purpose

AfriBook previously exhibited a systemic defect: a user selecting Malawi,
Kenya, Zambia, South Africa or Nigeria would see the application revert to
USA/USD — across modules and after navigation. This document describes the
root architecture that eliminates that class of bug permanently.

## 2. Root causes found (and fixed)

| # | Root cause | Location (before fix) | Fix |
|---|---|---|---|
| 1 | **URL path segment outranked saved preference.** `resolveCountry(pathname)` = `pathname > cookie > storage > 'NG'`. Selecting MW in-place on `/us/...` wrote storage but the snapshot kept resolving US/USD. | `src/components/shared/CountryProvider.tsx:46-48` | Precedence inverted: explicit selection → persisted preference → URL → safe fallback. Navigation never re-resolves once resolved. |
| 2 | **Proxy stomped the user's cookie.** Middleware rewrote the `country` cookie whenever it disagreed with hostname/IP inference; unknown hosts fell back to `'ng'` making IP detection dead code, and `en-us` Accept-Language mapped to `us`. | `src/proxy.ts:35,90-105` | A well-formed country cookie is now treated as a deliberate user selection and is NEVER overwritten. Cookie is only set when absent. Cookies written uppercase. |
| 3 | **Lowercase cookies were unreadable.** Proxy wrote `'us'`/`'mw'`; `geo.ts` regex `[A-Z]{2}` failed to match — losing the persistence signal in both directions. | `src/lib/geo.ts:60`, `src/proxy.ts:99` | Case-insensitive matching + normalization to uppercase everywhere. |
| 4 | **GPS overwrote market selection.** `LocationProvider.storeLocation()` wrote the GPS-derived country into the `country` cookie — geolocation in Chicago could reset Malawi. | `src/lib/geo.ts:47`, `LocationProvider.tsx` | Geolocation persists ONLY `currentLocation` (`afribook-location`). Market state is owned exclusively by CountryProvider. |
| 5 | **Two competing client sources of truth.** `LocationProvider.detectedCountryCode` mixed GPS/URL/cookie signals independently of `CountryProvider`. | `LocationProvider.tsx:41-45` | Separated concepts: `currentLocation` (GPS) vs `selectedMarket` (context). No cross-writes. |
| 6 | **Silent USD defaults in API routes.** Products/bookings/stays-host fell back to `'USD'` when merchant currency was unset. | `api/products`, `api/products/[id]`, `api/booking`, `api/stays/host`, `api/order`, `food/[id]` page | Currency derives from market context or merchant country — never silently USD. |
| 7 | **Destination store invented NG default.** | `src/stores/destination-store.ts:18` | Empty = unset; consumers fall back to their own selected market. |
| 8 | **Mobile market not persisted.** App restart reset to NG. | `mobile/src/stores/market-store.ts` | Zustand `persist` via AsyncStorage; every mobile API call carries `x-country-code`. |

## 3. Architecture layers (single market context end-to-end)

```
UI (useCountry / useMarketStore)
        ↓
GlobalMarketContext  ← single authoritative source (web: CountryProvider;
        ↓             mobile: market-store) with recorded `source`
API Client           ← web: fetch interceptor adds x-country-code to every
        ↓              same-origin /api request; mobile: ApiClient adds it
Backend API          ← resolveMarketContext(req, queryParam): param →
        ↓              x-country-code → afribook-country cookie →
                       cf-ipcountry → x-vercel-ip-country → Accept-Language
Service Layer        ← getCurrencyForCountry(country), formatMoney(amount, cc)
Database Query       ← filtered by country/city/service area from market ctx
Payment Layer        ← transaction/settlement currency separate from display
```

## 4. Precedence model

1. Explicit in-session selection (`setCountry`)
2. Saved user preference (localStorage + `country` cookie / AsyncStorage)
3. Destination/search context (destination-store city refinement)
4. URL country segment (deep links only, when nothing is saved)
5. Device geolocation (fills `currentLocation`; never overrides 1–4)
6. Safe configured fallback: **NG** — the United States may never occupy #6.

If nothing can be resolved beyond the fallback, UI surfaces
"Choose your location" (see `DestinationChip`) rather than assuming US.

## 5. Related documents

- MARKET_CONTEXT.md — DTO shape and resolution service
- CURRENCY_ARCHITECTURE.md — display vs transaction vs settlement currency
- GEOLOCATION_ARCHITECTURE.md — currentLocation vs selectedMarket
- LOCALIZATION_TEST_PLAN.md — regression matrix
- LOCALIZATION_FAILURES_FIXED.md — change log of this remediation
