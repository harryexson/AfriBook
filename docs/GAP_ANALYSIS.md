# AfriBook — Full Gap Analysis & Prioritized Backlog

**Date:** 2026-08-06
**Basis:** Source review of `src/`, `mobile/`, `supabase/migrations/`, plus verification runs (build ✓, typecheck ✓, tests ✓, lint ✗).

Priorities: **CRITICAL** (blocks launch / money / security), **HIGH** (major feature or quality gate), **MEDIUM**, **LOW**.

---

## 1. CRITICAL

### C1. Database migration chain is broken
- `supabase/migrations/002_ridely_retrobuddy.sql:392-394` — `mv_driver_stats` materialized view subquery references `driver_offers.accepted_at`, a column that **does not exist** (002:269-284 defines no `accepted_at`). `CREATE MATERIALIZED VIEW ... WITH NO DATA` still validates columns → **002 fails** → everything after it (003–012, including all security hardening) can never apply on a clean DB.
- `005` migration is missing (chain jumps 004 → 006).
- **Action:** add `accepted_at` to `driver_offers` (or fix the view), add a placeholder `005`, then validate full chain from scratch.

### C2. `ridely_dispatch*` RPCs reference a missing column
- `012_security_hardening.sql:1322,1411` — `UPDATE drivers SET current_trip_id = ...` but `drivers` has **no `current_trip_id`** column → the new dispatch engine throws at runtime.
- **Action:** add `current_trip_id UUID` to `drivers` in a new migration 013.

### C3. Unguarded SECURITY DEFINER RPC: `check_driver_safety_zone`
- `004_pickup_security_compliance.sql:724` — SECURITY DEFINER, **no `auth.uid()` check**, callable anonymously. Reveals safety-zone geometry/status.
- **Action:** harden in migration 013 (require authenticated + driver/zone owner).

### C4. ~23 API routes bypass authorization (service-role key + client-supplied identity)
All of the following use the `SUPABASE_SERVICE_ROLE_KEY` (RLS bypassed) and trust `userId`/`organizerId`/`driverId`/`buyerId`/`scannedBy` from query/body with no `getUser()` session check:

- `api/events/my-tickets` (GET `?userId=`)
- `api/events/registrations/[id]`, `api/events/registrations/[id]/tickets`
- `api/events/subscriptions` (PATCH takes `userId` from body)
- `api/events` (POST accepts `organizerId` from body — create events as anyone)
- `api/events/[id]` (PATCH takes `organizerId`/`adminRole` from body)
- `api/events/[id]/publish`, `[id]/guests`, `[id]/photos/[photoId]`, `[id]/check-in`, `[id]/check-in/bulk`, `[id]/tickets`, `[id]/analytics`, `[id]/promo-codes`, `[id]/share`, `[id]/invitations`
- `api/events/tickets/[id]` (omit `buyerId` to read any ticket incl. PII), `api/events/tickets/[id]/validate`
- `api/events/subscriptions/plans`
- `api/ridely/rides/[id]`, `api/ridely/rides/[id]/accept` (body `driverId`), `api/ridely/deliveries/[id]` (DELETE!), `api/ridely/nearby-drivers`, `api/ridely/location`

**Action:** enforce `supabase.auth.getUser()` + derive identity server-side on every service-role route; ignore client-supplied identity fields. Highest-value security fix in the codebase.

### C5. Mobile app cannot boot (fatal)
- `mobile/src/lib/supabase.ts:1,16` — local function `createClient` shadows the `@supabase/supabase-js` import of the same name → **TS2440 compile error + infinite recursion at runtime** (`RangeError`) whenever the module loads. Imported from `mobile/app/_layout.tsx` via `useAuth` → **crash on startup**.
- **Action:** rename the factory (e.g. `createSupabaseClient`) and export a singleton `supabase`.

### C6. Mobile payment + data are fully simulated
- `mobile/app/checkout.tsx:26-31` fake `setTimeout`; no SDK/server call.
- 100% of mobile commerce screens render hardcoded data; no real REST/Supabase reads.
- **Action:** wire checkout to `POST /api/payment/intent` (or Stripe), and replace mock screens with real API reads. This is a large build-out; the immediate certification-blocking piece is C5 + the env config (H2).

---

## 2. HIGH

### H1. Missing/incorrect payment verification paths
- `api/webhooks/flutterwave/route.ts:5-8` — verifies by comparing `sha256(secret)` to the `verif-hash` header (no body integrity). Confirm against Flutterwave docs; replace with documented scheme.
- `api/payments/paychangu/callback/route.ts:30-36` — falls back to client-supplied `?status=success` and marks transactions paid when provider lookup fails → **forgeable**.
- `api/payment/confirm/route.ts:32-36` — marks `payment_transactions` succeeded for a **client-supplied** `transactionId` with no ownership check.
- `api/payment/intent/route.ts:15` — accepts client `amount` with no server-side re-pricing against the booking/order.

### H2. Mobile env config absent
- No `mobile/.env`/`.env.example`; root `.env.example` has no `EXPO_PUBLIC_*`. `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` default to `''` → auth dead as shipped.
- **Action:** add `mobile/.env.example` with documented values + `mobile/app.json` Google Maps key slots.

### H3. No Content-Security-Policy
- `next.config.ts:27-41` sets security headers but **no CSP**. Given the inline theme preload script, a hash-based CSP should be added.

### H4. No rate limiting anywhere
- No throttling on auth, payments, pickup-code verification, ticket validation, or check-in endpoints.

### H5. Client-writable money columns via RLS
`bookings_update` (001:1639), `orders_update` (001:1689), `ride_requests_update` (001:1740), `deliveries_write` (001:1758), `ridely_food_deliveries_update` (002:975), `event_registrations_update` (003:1211), `organizer_subscriptions_update` (003:1419), `stay_bookings_update` (008:653) let customers set amounts/payment_status. Migration 012 fixed only 4 tables; extend column-level revokes to the rest.

### H6. Ledger is not the single source of truth
- Double-entry ledger exists (012) but **only** `handle_payment_succeeded` posts entries. Payouts, refunds, escrow release, driver earnings, and settlements do not post ledger entries.

### H7. `typescript.ignoreBuildErrors: true`
- `next.config.ts:4-6` — type errors silently pass `next build`. Remove and gate CI on `tsc --noEmit` (which currently passes).

### H8. Four dead links still live on the site
- `app/rides/prime/page.tsx:24`, `rides/book/page.tsx:111`, `rides/apply/page.tsx:109,116` → `/auth/login` (real route is `/login`; `/auth/signup` → `/register`).
- `components/vendor/VendorSidebar.tsx:28` → `/vendor/settings` (page does not exist).
- `components/marketplace/FeaturedBusinesses.tsx:106` → `/business/{id}` (no `[id]` route; real detail is `/[country]/business/[id]`) — rendered on homepage.
- `components/marketplace/MarketplaceCard.tsx:45` → `/marketplace/{id}` (no `[id]` route) — rendered on homepage.
- `app/checkout/page.tsx:177` → `/orders` (does not exist).

### H9. Seed data incompatible with schema
- `supabase/seed.sql` cannot apply against migrations 001–012: references `users` as a table (it's now a view, 012:63), `staff` table (doesn't exist), `description` on `business_categories`, `delivery_available`/`tags` on `businesses`, wrong `services`/`products` columns, `menu_items` FK mismatch, wrong `reviews` columns, wrong `payment_providers` columns, and an invalid hard-coded bcrypt hash for the seeded admin.

### H10. Account pages unguarded + AuthGuard dead code
- `/account/*` not in `AUTH_PROTECTED_ROUTES` (`proxy.ts:7`); `app/account/layout.tsx:42-43` hardcodes "Guest User". `AuthGuard` component is imported nowhere.

### H11. Mobile runtime bugs beyond C5
- `mobile/src/hooks/useRealtime.ts` unconstrained generic → TS2344; `useRide.ts:118,159,182` relative `fetch('/api/...')` invalid in RN; `CategoryGrid.tsx:48` navigates to nonexistent `/search`; `app/index.tsx:192` "My Bookings" navigates to search.

### H12. Lint gate failing
- 219 errors (216 `no-explicit-any`, 2 `no-require-imports`, 1 prefer-const). Systemic type-safety debt; money/status types are `any` in several places.

---

## 3. MEDIUM

- **M1.** Zero tests for payments/webhooks/auth (see T1). 
- **M2.** Stripe webhook idempotency is optional (`webhooks/stripe/route.ts:176-196`) — handlers not terminal-state-checked.
- **M3.** `STRIPE_WEBHOOK_SECRET_EVENTS` read but never defined in env files.
- **M4.** Stale env keys: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (unused), legacy `MPESA_SHORTCODE`/`MPESA_PASSKEY` (code uses per-country keys).
- **M5.** i18n non-functional: 11 translation sets generated but `getTranslation()` never called; `<html lang="en">` hardcoded; `next-intl` installed but unwired. RTL only on country home.
- **M6.** Cart store orphaned: `useCartStore.addItem` never called; `/checkout` (real Stripe) unreachable; `/marketplace/products` uses a local counter instead of the store.
- **M7.** A11y gaps: icon-only buttons without `aria-label` (`Header.tsx:302`, `BusinessCard.tsx:42`, `ProductCard.tsx:44`, `VendorSidebar.tsx:62`, `SearchHeader.tsx:85`, `[country]/search/page.tsx:184`); unlabeled search inputs; `MobileNav` drawer lacks `role="dialog"`/`aria-modal`; header menu/country buttons lack `aria-expanded`.
- **M8.** `design-system/afribook/MASTER.md` describes a theme (cyberpunk Orbitron/#EA580C) that doesn't match the implemented premium amber/Inter system; `design-system/afribook/pages/` empty.
- **M9.** Zero-policy RLS tables (`verification_codes`, `driver_safety_training`, `delivery_compliance_tracker`, `driver_safety_checklist`) are client-inaccessible by design — document server-only write path or add authenticated reads as needed.
- **M10.** `user_sessions` has no insert policy.
- **M11.** Anonymous INSERT still allowed on `event_share_links` (003:1378).
- **M12.** Mobile: unused deps (expo-camera, expo-notifications, async-storage, reanimated, qrcode-svg, date-fns, haptics, image-picker); dead `src/lib/api.ts` and `src/stores/cart-store.ts`; dead buttons (Google/Apple login, profile menu items, "Get Tickets").
- **M13.** `src/proxy.ts` redirect `/` → `/[country]` is a full redirect (fine); country cookie not `HttpOnly` (by design, client-read).

## 4. LOW

- **L1.** `no-explicit-any` remaining in stores/API after H12 cleanup.
- **L2.** SSR/client date mismatches from module-level `Date.now()` in mock order pages (`[country]/order/[id]/page.tsx:25`, `[country]/business/[id]/page.tsx:75`).
- **L3.** `vendor/qr/page.tsx:96` uses `document.write` (user-triggered print popup).
- **L4.** `X-XSS-Protection` header deprecated (remove in favor of CSP).
- **L5.** Mobile has no lockfile/`node_modules`; add `package-lock.json` and CI.
- **L6.** Mobile no ESLint/typecheck/test scripts.
- **L7.** `@react-native-async-storage/async-storage` etc. unused.
- **L8.** Duplicate lint output artifacts at repo root (`lint-out.txt`, `lint-output.txt`, `lint-output2.txt`) — should be gitignored/removed.

## 5. Feature-completeness matrix vs. enterprise spec

| Spec vertical | Web | Mobile | Backend/API | DB |
|---|---|---|---|---|
| Global Marketplace | Partial (mock data) | Mock | Partial | Yes |
| Service Booking | UI mock | Mock | Real (`api/booking`) | Yes |
| Restaurant OS (RestroBuddy) | Dashboard mock | — | Real (`api/retrobuddy`) | Partial |
| Food ordering/delivery | Marketing only | Mock | Real (`api/ridely/food-deliveries`) | Yes |
| Parcel/Courier | UI mock | — | Real (`api/ridely/deliveries`) | Yes |
| Ride sharing (Ridely) | Book/apply real | Mock/broken | Real | Yes (migration broken) |
| Events | UI mock, API real | Mock | Real (25 routes) | Yes |
| Vendor/Merchant | Mock dashboards | Mock | Real onboarding | Yes |
| Multi-country | Country data real | 20 static | Partial | Yes |

**All three spec'd products already share one codebase, one database, one auth, and one payment layer. The gaps are (a) broken migration chain, (b) mobile boot failure, (c) API authorization, (d) mock-to-real data completion, and (e) quality gates.**

## 6. Recommended execution order

1. C1, C2, C3 (DB) → new migration 013 + seed fix.
2. C4 (API authorization) — largest security surface.
3. C5, H2 (mobile boot + env).
4. C6, H1 (payments) + M2.
5. H3, H4, H8, H9, H10 (headers, rate limit, dead links, seed, guards).
6. H7, H12, M1 (quality gates + tests).
7. M5–M12, L1–L8 (incremental).
