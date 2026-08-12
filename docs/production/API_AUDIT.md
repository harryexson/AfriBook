# API Audit — Currency & Country Flow (Rides / Deliveries / Payments)

**Date:** 2026-08-11
**Scope:** Request → response currency correctness for money-moving APIs touched this pass.

## Rides

| Route | Method | Country-aware? | Currency | Notes |
|---|---|---|---|---|
| `/api/ridely/rides` | POST (create) | partial | — | Reads client `userId`; see release checklist §0. |
| `/api/ridely/rides` (estimate) | GET | ✅ | `COUNTRIES[countryCode].currency.code` | Delegates to `estimateRideFare`. Falls back to `DEFAULT_PRICING` for unknown codes. |
| `/api/ridely/rides/[id]` | GET | n/a | — | — |
| `/api/ridely/rides/[id]/accept` | POST | n/a | — | — |
| `/api/ridely/rides/[id]/rate` | POST | n/a | — | — |
| `/api/ridely/surge` | GET | ✅ | `getCurrencyForCountry` | ⚠️ Defaults `countryCode` to `'NG'` when missing (backlog P0). |
| `/api/ridely/nearby-drivers` | GET | ✅ | — | Country-scoped RPC. |

## Deliveries

| Route | Method | Country-aware? | Currency | Notes |
|---|---|---|---|---|
| `/api/ridely/deliveries/estimate` | POST | ✅ | `COUNTRIES[code].currency.code` + `taxRate` | Requires `countryCode` (400 if missing/unknown). Zone-aware (same_city/country/cross_border/pan_african). |
| `/api/ridely/deliveries` | POST | ✅ | order currency | — |
| `/api/ridely/deliveries/[id]` | GET | ✅ | stored per-order | — |
| `/api/ridely/food-deliveries` | POST | ✅ | — | — |

## Payments

| Route | Method | Country-aware? | Currency | Notes |
|---|---|---|---|---|
| `/api/payment/intent` | POST | ✅ | `params.currency?.toUpperCase() ?? getCurrencyForCountry(params.countryCode)` | Requires `amount`, `countryCode`, `method`; validates via `isMethodAvailableForCountry`. |
| `/api/payment/confirm` | POST | ✅ | resolves intent currency | — |
| `/api/payment-methods` | GET/POST/DELETE | ✅ | — | Method capability matrix (migration 015). |
| `/api/events/subscriptions/plans` | GET | ❌ | NGN hardcoded | Backlog P0 (product decision). |

## Orders

| Route | Method | Country-aware? | Notes |
|---|---|---|---|
| `/api/order` | POST | ✅ | Previously hardened; currency resolved from cart items/country. |
| `/api/orders/pickup` + `/verify` | POST | ✅ | Verify guarded (rate-limit pending — release checklist §1). |

## Cross-cutting observations

1. Pattern now consistent: server APIs resolve currency from a required
   `countryCode` (or stored order currency); client pages resolve via
   `getCurrencyForCountry`. The two remaining `'NG'`/`'NGN'` server defaults are
   `surge` and `events/subscriptions/plans` — both backlogged.
2. All money amounts reach the payment intent as **local currency** (no
   cross-currency charge path remains in web).
3. Webhook routes (M-Pesa/Adyen/Airwallex/dLocal/PawaPay) still missing —
   see `docs/audits/RELEASE_CHECKLIST.md`.
