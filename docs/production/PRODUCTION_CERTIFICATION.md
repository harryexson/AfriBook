# AfriBook Production Certification — Rides & Delivery Currency Pass

**Date:** 2026-08-11
**Status:** RIDES/DELIVERY CURRENCY LAYER VERIFIED. Full global launch still gated (see `docs/audits/RELEASE_CHECKLIST.md`).

## What was certified this pass

Per-country, local-currency pricing for rides and deliveries, and removal of
hardcoded NGN/USD in money-critical web paths:

1. **New shared pricing module** `src/lib/ridely/ride-pricing.ts` (pure,
   dependency-free, safe for client and server):
   - `COUNTRY_PRICING` — 15 markets (NG, KE, ZA, US, GB, IN, GH, TZ, UG, MW, EG,
     AE, CA, FR, DE), each with baseFare/perKmRate/perMinRate/minimumFare.
   - `DEFAULT_PRICING` fallback for the other 181 country codes.
   - `getRidePricingForCountry(code)` — case-insensitive, falls back to default.
   - `getRideTypeMultiplier(type)` — ratio of a type's base fare to economy.
   - `estimateRideFare(rideType, distanceKm, durationMin, countryCode, surgeMultiplier=1)`
     → `RideFareEstimate` with local `currencyCode` (via `COUNTRIES`).
   - Surge multipliers < 1 are ignored (floor at 1); minimum fare is always
     honored.
2. **Surge module** `src/lib/ridely/surge-pricing.ts` now re-exports the shared
   tables and uses `getRideTypeMultiplier`; removed duplicated definitions and
   the unused `RIDE_TYPE_CONFIG` import (lint-clean).
3. **Server estimate** `GET /api/ridely/rides` `estimatePricing` delegates to
   `estimateRideFare`.
4. **Ride booking page** `src/app/rides/book/page.tsx`:
   - Estimates and ride-type card fares use `estimateRideFare` with the real
     `countryCode` (no NGN-only table).
   - Stripe receives `countryCode={countryCode}` + `currency={displayCurrency}`
     (previously `countryCode="US"` → cross-currency charge bug).
5. **Checkout** `src/app/checkout/page.tsx`: `currencyCode` derived from the
   menu/product item or `getCurrencyForCountry(countryCode)`; Stripe now gets the
   real country + currency (was `countryCode="US"`).
6. **`[country]` checkout**: 4 × `country?.currency.code ?? 'NGN'` replaced with
   `currencyCode` derived via `getCurrencyForCountry`.
7. **Delivery pages**: `₦` hardcodes removed from
   `src/app/driver/delivery/[id]/page.tsx` and
   `src/app/deliveries/[id]/page.tsx` (per-country via `useCountry()` +
   `getCurrencyForCountry`).
8. **Driver payouts library** rewritten against the real DB schema with
   per-driver currency resolution (`resolveDriverCurrencyCode`). See
   `docs/production/IMPLEMENTATION_BACKLOG.md` for the caller-wiring follow-up.

## Verified evidence

| Gate | Result |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | Clean |
| `npm run test` | **113/113** (9 files) — +10 new `src/tests/unit/ride-pricing.test.ts` (per-country fares, type multipliers, minimum-fare floor, surge >1, surge <1 ignored, unknown-country fallback, currency codes) |
| `npm run build` (`next build`) | Clean — 368 routes |
| `npm run lint` (all changed files) | 0 errors |

## Grounding (verified in source)

- Payment currency resolution: `src/lib/payments/index.ts:169-171`
  `resolvedCurrency = params.currency?.toUpperCase() ?? getCurrencyForCountry(params.countryCode)`.
- `POST /api/payment/intent` requires `amount`, `countryCode`, `method`; validates
  via `isMethodAvailableForCountry`; `card` available in all core markets.
- Delivery estimate is fully country-aware
  (`src/app/api/ridely/deliveries/estimate/route.ts` → `COUNTRIES[countryCode]`,
  `currency.code`, `taxRate`).
- `GET /api/ridely/surge` returns `currencyCode` via `getCurrencyForCountry`
  (note: defaults to `'NG'` when `countryCode` is missing — backlog item).
- DB schema used by payouts rewrite confirmed against migrations 001/006
  (`driver_earnings`, `driver_payouts` — see SYSTEM_COMPLETION_MAP).

## Launch gates (unchanged, outside this pass)

`docs/audits/RELEASE_CHECKLIST.md` remains the authoritative gate list
(security/money blockers, migration chain repair, mobile, integration envs).
