# Localization Test Plan

> Last updated: 2026-08-25

## 1. Automated regression suite

Run: `npm test` (vitest).

### `src/tests/unit/market-persistence.test.tsx`

The core regression suite for the US-revert bug:

| Test | Verifies |
|---|---|
| explicit selection beats URL segment + persists across navigation | Select MW on `/us/hotels`; navigate `/us`, `/us/hotels`, `/us/restaurants`, `/us/services`, `/us/products`, `/us/events`, `/us/rides`, `/us/delivery` — stays MW/MWK |
| persisted selection survives fresh mount and outranks URL | Saved ZM; deep link to `/us/restaurants` → ZM/ZMW |
| legacy lowercase proxy cookies are read + normalized | `country=mw` cookie → MW/MWK |
| currency follows every market switch, no stale prices | MW→KE→ZM→ZA→NG→TZ→RW→GH all resolve correct currency |
| selection writes uppercase cookie+storage and survives refresh | BW persists across simulated reload |
| SSR snapshot is storage-free | No hydration flash; server render uses URL segment only |
| GPS never overwrites explicit selection | currentLocation=Chicago/US while market stays MW/MWK |

### Existing suites (must stay green)

- `country-provider-hydration.test.tsx` — hydration consistency
- `localization.test.ts` — MW→MWK, KE→KES, header precedence,
  "never silently defaults African markets to USD"
- `ride-pricing`, `payments-capabilities`, `email-localization`,
  `script-rendering`, `moderation`

Current status: **10 files / 124 tests passing**; typecheck clean;
lint: 0 errors.

## 2. Manual web matrix

For each of MW KE ZM ZA NG TZ UG RW GH BW MZ ZW US CA GB IN:

1. Open app → select country (+ city where offered).
2. Verify currency indicator matches §3 table.
3. Visit Home, Hotels(stays), Restaurants(food), Services(booking),
   Products(marketplace), Events, Rides, Delivery.
4. At every step verify 📍 [City], [Country] and pricing currency.
5. Hard refresh → market retained.
6. Direct URL entry (`/hotels`, `/restaurants`, …) → market retained.
7. Logout → login → market retained per precedence rules.

### Required scenario tests

- **T1 (Malawi/Lilongwe):** full module walk, refresh at end → MW/MWK everywhere.
- **T2 (Kenya/Nairobi):** same walk → KE/KES everywhere.
- **T3 (US GPS, Malawi selected):** the critical regression — marketplace
  must NEVER return to USA/USD during any navigation.
- **T4 (destination search):** user in USA searches hotels in Cape Town →
  results/pricing use hotel's transaction currency; GPS/currentLocation
  remains USA.

## 3. Currency expectations

MW=MWK · ZM=ZMW · KE=KES · NG=NGN · ZA=ZAR · TZ=TZS · UG=UGX · RW=RWF ·
GH=GHS · BW=BWP · MZ=MZN · ZW=configured · US=USD · CA=CAD · GB=GBP · IN=INR
(single source: `src/lib/localization/countries.ts` + `src/lib/money.ts`).

## 4. Mobile matrix

Select Kenya → force-close app → reopen → KE/KES. Also test
background/foreground, deep links, logout/login. Persistence via AsyncStorage
(`afribook-market`). Every API request carries `x-country-code`.

## 5. Server-side verification

- Any `/api/*` call without an explicit query param resolves market from the
  `x-country-code` header (`resolveMarketContext`) — verified by header
  precedence unit tests in `localization.test.ts`.
- No route may fall back to `'USD'` for display currency; merchant/market
  derivation is required (audited in LOCALIZATION_FAILURES_FIXED.md).
