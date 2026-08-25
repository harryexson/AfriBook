# Localization Failures Fixed

> Remediation date: 2026-08-25
> Companion: GLOBAL_LOCALIZATION_ARCHITECTURE.md (architecture), LOCALIZATION_TEST_PLAN.md (verification)

## Summary

Users selecting Malawi/Kenya/Zambia/South Africa/Nigeria saw the app revert
to USA/USD. Eight distinct root causes were found; all are fixed at the
architecture level (no per-page conditionals, no new country selector).

---

## Fix 1 — URL segment outranked the user's explicit selection  ⚠ PRIMARY BUG

- **File:** `src/components/shared/CountryProvider.tsx`
- **Was:** `resolveCountry(pathname) = pathname || cookie || storage || 'NG'`.
  Selecting Malawi in-place on `/us/...` wrote storage, but the snapshot kept
  resolving `US`/`USD` on every render/navigation.
- **Now:** CountryProvider rebuilt as the authoritative GlobalMarketContext:
  module-level store + one-time initialization. Precedence:
  explicit selection → persisted preference → URL → NG fallback.
  Navigation never re-resolves once resolved.

## Fix 2 — Middleware stomped the user's market cookie

- **File:** `src/proxy.ts`
- **Was:** cookie rewritten whenever it disagreed with hostname/IP/lang;
  unknown hosts fell back to `'ng'` (killing IP detection); `en-us`
  Accept-Language mapped to `us`; cookies written lowercase; any country not
  in a 17-code allowlist was considered "invalid" and overwritten.
- **Now:** any well-formed ISO alpha-2 cookie is treated as deliberate user
  selection and never overwritten; cookie only set when absent; uppercase;
  host fallback returns null so IP/lang can actually apply.

## Fix 3 — Lowercase cookies unreadable by client geo helpers

- **Files:** `src/lib/geo.ts`, `src/proxy.ts`
- **Was:** proxy wrote `'mw'`; geo regex `[A-Z]{2}` matched nothing.
- **Now:** case-insensitive matching + uppercase normalization everywhere.

## Fix 4 — GPS overwrote the selected market

- **Files:** `src/lib/geo.ts`, `src/components/providers/LocationProvider.tsx`
- **Was:** `storeLocation()` wrote the GPS-derived country into the `country`
  cookie; `detectedCountryCode` mixed GPS/URL/cookie signals as a competing
  source of truth.
- **Now:** geolocation persists ONLY `currentLocation`
  (`afribook-location`). Market state is owned exclusively by
  CountryProvider. The two concepts can no longer overwrite each other.

## Fix 5 — Silent USD defaults in marketplace APIs

| File | Before | Now |
|---|---|---|
| `src/app/api/products/route.ts` | `currency ?? 'USD'`; country only from query | market context via `resolveMarketContext(req)`; currency falls back to market currency |
| `src/app/api/products/[id]/route.ts` | `?? 'USD'` | merchant-country currency |
| `src/app/api/booking/route.ts` | `service.currency ?? 'USD'` | request-market currency |
| `src/app/api/stays/route.ts` | countryCode from query only | header/market-context fallback |
| `src/app/api/stays/host/route.ts` | `?? 'USD'` | registry lookup |
| `src/app/api/restaurants/route.ts` | country param only | header/market-context fallback |
| `src/app/food/[id]/page.tsx` | `restaurant?.currency ?? "USD"` | restaurant's country currency |

Left intentionally (legitimate): admin-created records with explicit
`body.currencyCode ?? 'USD'`, Stripe webhook payload defaults, PSP
billing-address placeholders (`payments/*`).

## Fix 6 — Destination store invented a default country

- **File:** `src/stores/destination-store.ts`
- Default `'NG'` → empty/unset; label renders "Choose your location";
  consumers fall back to their own selected market.

## Fix 7 — No market transport to the backend from the web client

- **File added:** `src/lib/api-market.ts` (installed in CountryProvider).
  Patches `window.fetch` once to attach `x-country-code` to every same-origin
  `/api/*` request, so server routes resolve the same market as the UI even
  when pages omit query params.

## Fix 8 — Mobile market not persisted + API calls carried no market

- **Files:** `mobile/src/stores/market-store.ts`, `mobile/src/lib/api.ts`
- Market store now persists via AsyncStorage (`afribook-market`) — survives
  restart, background/foreground, login/logout, deep links.
  `ApiClient` attaches `x-country-code` on every request (web/mobile parity).

---

## Files changed

```
src/components/shared/CountryProvider.tsx      (rewritten — GlobalMarketContext)
src/lib/api-market.ts                          (new — fetch interceptor)
src/proxy.ts                                   (cookie precedence fixes)
src/lib/geo.ts                                 (cookie case; no market writes)
src/components/providers/LocationProvider.tsx  (currentLocation separation)
src/stores/destination-store.ts                (no invented default)
src/app/api/restaurants/route.ts               (market-aware country)
src/app/api/stays/route.ts                     (market-aware countryCode)
src/app/api/products/route.ts                  (market-aware currency)
src/app/api/products/[id]/route.ts             (merchant currency)
src/app/api/booking/route.ts                   (market-aware currency)
src/app/api/stays/host/route.ts                (registry currency)
src/app/food/[id]/page.tsx                     (restaurant-country currency)
mobile/src/stores/market-store.ts              (persisted market + source)
mobile/src/lib/api.ts                          (x-country-code header)
src/tests/unit/market-persistence.test.tsx     (new — 7 regression tests)
docs/localization/*.md                         (6 deliverables, updated)
```

## Verification

- `npm run typecheck` — clean (web). `tsc -p mobile` — clean.
- `npm run lint` — 0 errors.
- `npm test` — **10 files / 124 tests passing**, including the new
  market-persistence regression suite and all pre-existing suites.
