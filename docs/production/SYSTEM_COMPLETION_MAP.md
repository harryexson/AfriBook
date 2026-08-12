# AfriBook System Completion Map

**Date:** 2026-08-11
**Scope:** Web monorepo (Next.js 16.2.10). Vertical-by-vertical completion status for the marketplace, rides, deliveries, events, payments, and localization layers.

Legend: **DONE** = real code path, DB-backed, country-aware, verified. **PARTIAL** = real backend but UI mocked or gaps remain. **MOCK** = frontend-only / simulated, no real data flow.

## Payments & Checkout

| Flow | Status | Evidence |
|---|---|---|
| Payment intent creation (Stripe) | **DONE** | `POST /api/payment/intent` → `createPaymentIntent` in `src/lib/payments/index.ts:155-184`. Currency resolution: `params.currency?.toUpperCase() ?? getCurrencyForCountry(params.countryCode)`. Validates method via `isMethodAvailableForCountry`. |
| Payment confirmation | **DONE** | `POST /api/payment/confirm`. |
| Method capability matrix | **DONE** | 122-row capability seed across 20 launch markets (migration 015). `card` available in all core markets (`getMethodsForCountry`, `src/lib/payments/types.ts`). |
| Web checkout → Stripe | **DONE** | `src/app/checkout/page.tsx` derives `currencyCode` from menu/product item or `getCurrencyForCountry(countryCode)`; passes `countryCode={countryCode}` + `currency={currencyCode}` to `StripePaymentSection` (was hardcoded `countryCode="US"`). |
| `[country]` checkout | **DONE** | `src/app/[country]/checkout/page.tsx` uses `country?.currency.code ?? getCurrencyForCountry(countryCode)`; 4 `?? 'NGN'` fallbacks removed. |
| Mobile checkout | **MOCK** | `mobile/` still simulates checkout; NGN hardcodes remain. See backlog. |

## Food (previous pass — certified)

| Flow | Status | Evidence |
|---|---|---|
| Browse menu → cart | **DONE** | Restaurant/menu APIs (`/api/restaurants`, `/api/retrobuddy/menu`). |
| Cart → order API | **DONE** | `POST /api/order` country/currency aware; order pickup flow `/api/orders/pickup` + verify. |
| Payment | **DONE** | Shared payment intent flow above. |
| Driver/delivery tracking | **DONE** | `/api/ridely/deliveries`, `/api/ridely/deliveries/[id]`, `/api/ridely/food-deliveries`. |

## Rides (this pass)

| Flow | Status | Evidence |
|---|---|---|
| Fare estimation (server) | **DONE** | `GET /api/ridely/rides?estimate` → `estimateRideFare` (`src/lib/ridely/ride-pricing.ts`). 15-country per-country tables, ride-type multiplier, minimum-fare floor, local currency code. |
| Fare estimation (client) | **DONE** | `src/app/rides/book/page.tsx` uses `estimateRideFare` with real `countryCode`; ride-type cards show local-currency fares; Stripe receives `countryCode` + `displayCurrency`. |
| Surge pricing | **DONE** | `src/lib/ridely/surge-pricing.ts` re-exports shared tables from `ride-pricing`; DB-backed surge zones on top. `GET /api/ridely/surge` returns `currencyCode` via `getCurrencyForCountry`. |
| Ride request / accept / rate | **PARTIAL** | Real routes exist; ride creation reads client `userId` (see release checklist §0). |
| Nearby drivers | **DONE** | Country-scoped RPC (migration 015 work). |

## Deliveries

| Flow | Status | Evidence |
|---|---|---|
| Delivery estimate | **DONE** | `POST /api/ridely/deliveries/estimate` — full country-aware pricing (`COUNTRIES[countryCode]`, `currency.code`, `taxRate`). |
| Create/fetch delivery | **DONE** | `/api/ridely/deliveries`, `/api/ridely/deliveries/[id]`. |
| Driver delivery detail page | **DONE** | `src/app/driver/delivery/[id]/page.tsx` — `₦` hardcodes replaced with `formatMoneySymbol(getCurrencyForCountry(countryCode))`. |
| Customer delivery page | **DONE** | `src/app/deliveries/[id]/page.tsx` — `formatCurrency(amount, currencyCode)` (4 call sites), `useCountry()` + `getCurrencyForCountry`. |
| Driver payouts | **DONE (lib) / UNWIRED** | `src/lib/ridely/driver-payouts.ts` rewritten against real schema (`driver_earnings`/`driver_payouts`, per-driver currency via `resolveDriverCurrencyCode`). **No callers yet** — see backlog. |

## Marketplace & `[country]` verticals

| Flow | Status | Evidence |
|---|---|---|
| Business detail | **DONE** | `src/app/[country]/business/[id]/page.tsx` — `formatCurrency(startingPrice, currencyCode)`, fallback via `getCurrencyForCountry`. |
| Service booking page | **DONE (pricing) / MOCK (data)** | `src/app/[country]/book/[businessId]/[serviceId]/page.tsx` — NGN fallback removed; **service + business data are still mocked** (`MOCK_SERVICE`). |
| Search | **MOCK** | `[country]/search` renders PRNG data. |
| Marketplace listings | **MOCK** | Homepage + `/marketplace` use `MARKETPLACE_LISTINGS`; `marketplace/[id]` simulated. |

## Events

| Flow | Status | Evidence |
|---|---|---|
| Events API | **PARTIAL** | Full CRUD routes exist (`/api/events*`), pricing via `src/lib/events/pricing` (tax/currency tested). |
| Events UI | **MOCK** | `/events`, `/events/create`, `/events/my-events`, `/events/[id]*` frontends are mocked; do not call the events API. |
| Subscription plans API | **PARTIAL** | `/api/events/subscriptions/plans` hardcodes NGN prices — documented product decision; flagged in backlog. |

## Verified gates (this pass)

- `npm run typecheck` — clean
- `npm run test` — **113/113** (9 files; +10 new `ride-pricing.test.ts`)
- `npm run build` — clean, 368 routes
- `npm run lint` (changed files) — 0 errors

## Not yet done (summary)

See `docs/production/IMPLEMENTATION_BACKLOG.md` for the full list: mock frontend rewiring (events, marketplace, `[country]`), mobile NGN hardcodes, events plans NGN, `AiUpsell`/`PriceBreakdown` default `'NGN'`, driver-payouts caller wiring, surge default `'NG'` when `countryCode` missing, plus the earlier security/money blockers in `docs/audits/RELEASE_CHECKLIST.md`.
