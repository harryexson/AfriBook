# AfriBook — Repository Comparison (AfriBook ⊇ Ridely, RestroBuddy)

**Date:** 2026-08-06

## 1. Conclusion up front

Ridely and RestroBuddy are **already integrated as modules** inside the AfriBook monorepo — there are no separate repositories to merge. The comparison below therefore compares the **module implementations** and recommends how they should be aligned, deduplicated, and completed against the shared enterprise core. **Recommendation for every shared concern: REUSE the AfriBook core; MERGE module-specific duplicates into it; REMOVE module-local reinventions of core services.**

---

## 2. Module inventory

| Module | UI (web) | API routes | Business logic | DB |
|---|---|---|---|---|
| **AfriBook core** | `src/app/**` (marketplace, events, vendor, admin, account) | `api/booking`, `api/order`, `api/payment/*`, `api/events/*` | `src/lib/payments/`, `src/lib/events/`, `src/lib/moderation/`, `src/lib/localization/` | migrations 001, 003, 007–011 |
| **Ridely** | `src/app/rides/**`, `src/app/driver/**`, `src/app/deliveries/**` | `api/ridely/**` (15) | `src/lib/ridely/` (10 files) | migration 002, 004, 006, 012 |
| **RestroBuddy** | `src/app/vendor/restaurant/**`, `src/app/food/**` | `api/retrobuddy/**` (4) | `src/lib/retrobuddy/` (5 files) | migration 002, 006, 012 |

Mobile mirrors the same split: `app/ride/**`, `app/driver/**`, `app/food/**` (all mock).

## 3. Shared models (present in multiple places → consolidate)

| Concept | AfriBook core | Ridely | RestroBuddy | Verdict |
|---|---|---|---|---|
| User/profile | `profiles` (001) | uses `profiles` | uses `profiles` | **REUSE** (shared) |
| Wallet/balance | `vendor_wallets` (001), `payment_transactions` (001) | `driver_earnings` (006) + `driver_payouts` (006) | none | **MERGE** — unify driver earnings into the ledger; wallets should be per-account-type on `vendor_wallets` or a generic `wallets` table |
| Order | `orders` (001) | `ridely_deliveries`, `ridely_food_deliveries` (002) | `retrobuddy` orders via `orders`? | **REFACTOR** — decide canonical order model per vertical; share status history pattern |
| Booking | `bookings` (001) | `ride_requests` (001) | reservations (planned) | **REUSE** booking status machine |
| Payments | `payment_transactions`, `escrow_holds`, `refunds`, `disputes`, `chargebacks`, `settlements` (001), `user_payment_methods` (011) | uses core | uses core | **REUSE** — single payment orchestration |
| Notifications | `notifications` (001), `push_tokens` (006) | uses core | uses core | **REUSE** |
| Audit | `audit_logs` (001), `admin_audit_log` (001) | `ride_status_history`, `delivery_status_history` (002) | — | **MERGE** — status history is vertical event log; keep as domain tables but enforce same insert restrictions |
| Location/GPS | `driver_locations` (002) | `driver_locations`, `surge_zones` (002), H3 (006) | — | **REUSE** — shared driver location infra |
| Loyalty | `loyalty_members`, `points_transactions` (006) | — | loyalty planned | **REUSE** core loyalty engine (`src/lib/loyalty/`) |

## 4. Shared APIs

| Concern | Canonical API | Module-local duplicate |
|---|---|---|
| Payment intent | `api/payment/intent`, `api/payment/confirm` | none ✅ |
| Webhooks | `api/webhooks/*` (10 providers) | `api/payments/paychangu/callback` (duplicate PayChangu path), `api/events/webhooks/stripe` (separate Stripe flow for events) |
| Booking create | `api/booking` | `api/ridely/rides` (ride-specific, fine) |
| Rides | `api/ridely/*` | none |
| Restaurant | `api/retrobuddy/*` | none |
| Events | `api/events/*` (25 routes) | none |

**Recommendation:** route all PayChangu notifications through `api/webhooks/paychangu`; keep `events/webhooks/stripe` but make it share the same `webhook_events` idempotency ledger as `api/webhooks/stripe`.

## 5. Shared authentication

- **One auth system** (Supabase Auth + `profiles` + `users` view) used by all three modules ✅.
- **Gap:** the three modules' API routes use *different authorization styles*:
  - Core/booking/order/rides/create: session-checked (`getUser()`) ✅.
  - Events + several Ridely routes: service-role client trusting client-supplied ids ❌ (see GAP_ANALYSIS C4).
- **Recommendation:** a single `requireAuth()` server helper (get session → return `{ user }` or 401) used by every service-role route; remove all client-supplied identity fields.

## 6. Shared payments

- One orchestration layer `src/lib/payments/` (10 providers) is used by all verticals ✅.
- **Gaps:** mobile uses none; web `[country]/checkout` simulates; real `/checkout` is orphaned; payment/confirm and PayChangu callback trust client input.
- **Recommendation:** the mobile + web UI must both call `api/payment/intent`; server reconciles amount against the booking/order.

## 7. Shared notifications / analytics / location / UI

| Concern | Current state | Verdict |
|---|---|---|
| Notifications | `notifications` table + push.ts (server) | **REUSE**; add client push registration |
| Analytics | Recharts per-dashboard; PostHog unused | **MERGE** — single analytics client; wire PostHog or remove |
| GPS/routing | OSRM + Haversine + H3 in `src/lib/ridely/` | **REUSE** as `src/lib/geo/` core |
| UI | Hand-rolled Tailwind + tokens in `globals.css`; empty `components/ui/` | **BUILD** shared primitive library (see TARGET_ARCHITECTURE) |
| i18n | 11 translation sets unused | **MERGE** — wire `getTranslation` + `<html lang>` |

## 8. Shared business logic — duplicates to remove

1. **Surge/route/dispatch:** all in `src/lib/ridely/` — no duplicate. ✅
2. **Price formatting:** `formatPrice` in `lib/localization/index.ts` — single impl ✅.
3. **Cart state:** `src/stores/cart-store.ts` is the only cart store, but **unused** by any UI (marketplace/products uses a local counter) — remove the local counter, use the store.
4. **Moderation:** `src/lib/moderation/` single impl used by API ✅.
5. **Compliance/safety:** `src/lib/pickup/` + `src/lib/ridely/` overlap on driver safety records — align under `src/lib/pickup/`.
6. **PayChangu:** duplicate callback path (see §4).

## 9. Comparison: AfriBook vs Ridely vs RestroBuddy capability table

| Capability | AfriBook core | Ridely | RestroBuddy |
|---|---|---|---|
| Auth | ✅ real | ✅ real | ✅ real |
| Payments | ⚠️ real API, mock UI | ✅ real (book/apply) | ⚠️ API only |
| Data persistence | ⚠️ API-backed, UI mock | ⚠️ migration broken | ⚠️ API-backed |
| Web UI | ✅ broad | ⚠️ book/apply real, rest mock | ❌ dashboards mock |
| Mobile | ❌ mock/broken | ❌ mock/broken | ❌ mock |
| Realtime/GPS | ⚠️ hooks broken | ⚠️ hooks broken | — |
| Analytics dashboards | ❌ mock | ❌ mock | ❌ mock |
| Tests | ⚠️ 36 (no payments/auth) | ❌ none | ❌ none |

## 10. Actions summary

| Concern | Action |
|---|---|
| Identity/ownership on API routes | **FIX** (all modules) — require session, drop client ids |
| Wallets + earnings + ledger | **MERGE** into one double-entry ledger |
| Notifications/analytics/geo/UI/i18n | **REUSE/MERGE** single shared core |
| Duplicate PayChangu path | **REPLACE** with canonical webhook route |
| Mock web+mobile commerce | **REPLACE** with real API reads |
| `useCartStore` | **REFACTOR** marketplace/products to use it; make `/checkout` reachable |
