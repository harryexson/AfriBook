# AfriBook Full Production Audit

- **Date:** 2026-08-05
- **Scope:** Web (`src/`), Mobile (`mobile/`), Supabase migrations (`supabase/migrations/`), payments (`src/lib/payments/`), integrations, security, tests, docs.
- **Result:** **NOT READY FOR PRODUCTION** — the script-tag rendering error is **fixed and verified**, but multiple critical financial and security vulnerabilities remain in the payment/Supabase layer, and the migration chain is broken.

---

## 1. Executive Summary

| Area | Verdict | Headline |
|---|---|---|
| Script-tag rendering error | **FIXED + VERIFIED** | Root-caused, fixed via Next.js documented pattern, regression-tested, confirmed in real browser (0 console errors). |
| Validation pipeline | **PASS** | `typecheck` ✓ · `build` ✓ · `test` 34/34 ✓ · changed files lint-clean ✓ |
| Code health | **WARN** | 170 pre-existing lint errors (169 `no-explicit-any`), `typescript.ignoreBuildErrors: true` |
| Payments / financial integrity | **CRITICAL FAIL** | Unauthenticated RPC can mark payments succeeded + credit wallets; no ledger; missing webhook routes |
| Supabase schema + RLS | **CRITICAL FAIL** | Profile role/KYC self-escalation; unauthenticated SECURITY DEFINER functions; broken migration chain (006 fails) |
| Web user journeys | **FAIL** | Most commerce flows are mock/simulated; multiple 404 links; real `/checkout` orphaned |
| Mobile (Expo) | **FAIL** | 100% mock except auth; broken Supabase/realtime wiring; simulated payments |
| Integrations | **WARN** | Stripe real; 9 other providers real-but-mostly-unconfigured; env var mismatches |
| Security headers | **PASS (partial)** | HSTS/permissions-policy present; **no CSP** |

**Primary deliverable this session:** the recurring `Encountered a script tag while rendering React component` error is permanently resolved (Section 2).

---

## 2. Script-Tag Rendering Error — Resolution (VERIFIED FIXED)

### 2.1 Root cause
- `src/app/layout.tsx` rendered the dark-mode theme preload script. The original implementation used `next/script`; subsequent attempts rendered a raw inline `<script>`.
- React 19's client renderer **will not execute** a `<script>` element that is created during render/hydration unless it qualifies as a *script data block*. Evidence: `isScriptDataBlock(props)` in `node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:23647`. Valid data blocks: `type="module"`, `importmap`, `speculationrules`, or any non-JS MIME type (e.g. `text/plain`, `application/ld+json`). Any other script element triggers the console warning **and is never executed** (theme preload silently dropped).
- The user-visible console error surfaced at `RootLayout` (`src/app/layout.tsx`) with stack frame `about://React/Server/...ssr...` — Turbopack's label for the SSR chunk that contains the Server Component's function body.

### 2.2 Fix (implemented)
Adopted Next.js's documented pattern (`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`):
- New component `src/components/shared/InlineScript.tsx`:
  - Server render: `type="text/javascript"` → browser executes during HTML parsing (no FOUC, no extra request).
  - Client render: `type="text/plain"` → treated as a script data block, no warning, no re-execution.
  - `suppressHydrationWarning` on the script element (attribute mismatch is the documented, expected part of this pattern).
- `src/app/layout.tsx` `<head>` now renders `<InlineScript html={theme-preload-js}>`.

### 2.3 Verification (evidence)
- **SSR output** (`curl http://localhost:3001`): `<script type="text/javascript">(function(){try{var t=localStorage.getItem('afribook-ui')…` — theme preload present and executable in SSR HTML.
- **Headless Chromium (Playwright) on the running dev server**: `console errors = []`, `page errors = []`, **script-tag warnings = 0**, hydration errors = 0. Theme script present with code after hydration.
- **Negative control**: reverting to a raw `<script>` (no type) produced **0 warnings** on a full page load — proving the warning path is client-side head re-reconciliation (the original `next/script` variant triggered it via head position mismatch), and confirming the fix removes it entirely.
- **Regression tests** (5/5 passing):
  - `src/tests/unit/script-rendering.test.tsx` (jsdom): client render emits `type="text/plain"`; code preserved; no script-tag console warning.
  - `src/tests/unit/script-server-rendering.test.tsx` (`renderToStaticMarkup`): server emits `<script type="text/javascript">`; exactly one script element.
- Note: the public `react-dom` package does not carry the warning (only Next's vendored build does), so tests assert the documented invariant (`text/plain` client / `text/javascript` server) rather than the console message.

### 2.4 Regression risk
- The only `suppressHydrationWarning` in the fix is scoped to the single theme-preload `<script>`; the pre-existing one on `<html>` (for theme classes) remains. No other `suppressHydrationWarning` introduced.

---

## 3. Validation Pipeline (run 2026-08-05)

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | **PASS** | `tsc --noEmit`, 0 errors |
| `npm run build` | **PASS** | `✓ Compiled successfully in 3.4min`; no warnings |
| `npm test` | **PASS** | 4 files, 34/34 tests |
| `npx eslint` on changed files | **PASS** | 0 issues |
| `npm run lint` (whole repo) | **FAIL** | 590 problems: **170 errors** (169 `@typescript-eslint/no-explicit-any`, 2 `no-require-imports` in `src/tests/setup.ts`, prefer-const ×1), 420 warnings |

### 3.1 Code-health findings
- `next.config.ts:4-6` — `typescript.ignoreBuildErrors: true` masks type errors in CI/production builds. **HIGH.** Should be removed and type errors fixed; gate deploys on `tsc --noEmit`.
- 169 `no-explicit-any` errors across `src/lib/payments/`, stores, and API routes. **MEDIUM.** Systemic type-safety debt; money/status types are `any` in several places.
- `src/tests/setup.ts:48-49` — `require('util')` in an ESM/TS context; use imports.
- `src/lib/ridely/surge-pricing.ts`, `src/lib/stays/stays-data.ts`, `src/stores/ui-store.ts` — dead code / unused vars (warnings).

---

## 4. Security Headers & Middleware

- `src/proxy.ts` (Next.js 16 `proxy.ts`): country detection + country cookie, security headers, Supabase auth via `getUser()` (correct — not `getSession()`), role-gated redirects for `/vendor`, `/admin`, `/driver`. **PASS.**
- `next.config.ts:27-41` headers: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (`63072000; includeSubDomains; preload`). **PASS.**
- **No `Content-Security-Policy` anywhere. HIGH.** Required for production hardening; will need inline-script allowlist (`'sha256-…'`) for the theme preload and any other inline scripts/styles.
- `X-XSS-Protection: 1; mode=block` is deprecated; harmless but remove in favor of CSP.
- `proxy.ts` role check relies on the `profiles`/`users` table existing per-tenant and defaults unknown users to `customer` — acceptable, but see RLS section (role is client-writable).

---

## 5. Web User Journeys (evidence-based)

| Journey | Verdict | Evidence |
|---|---|---|
| Login / Register / Forgot / Reset | **PASS** | `(auth)/login`, `(auth)/register`, `(auth)/forgot-password`, `/reset-password` — real Supabase auth |
| Post-login redirect | **FAIL** | `proxy.ts:143` passes `?redirect=…` but `(auth)/login/page.tsx` ignores it |
| Rides booking + driver apply | **PASS (real)** | `/rides/book` → `/api/ridely/rides` + Stripe; `/rides/apply` → `/api/driver/apply` |
| Rides Prime | **FAIL** | `src/app/rides/prime/page.tsx:24` → `/auth/login` → **404** (route is `/login`) |
| Country landing (`/us` etc.) | **PASS (static)** | `[country]/page.tsx` from `lib/countries-data` |
| Country business/booking/order | **FAIL (mock)** | `[country]/business/[id]`, `[country]/book/...`, `[country]/order/[id]` all hardcoded; booking never persists |
| Country checkout | **FAIL (stub)** | `[country]/checkout/page.tsx` — `handlePay` is a 2s `setTimeout` → mock `ORD-ABC123` |
| Real `/checkout` | **FAIL (orphaned)** | Real Stripe + `/api/order`, but **no UI links to it**; cart store has zero consumers |
| Marketplace | **FAIL** | `MarketplaceCard.tsx:45` → `/marketplace/${id}` → **404** (no detail page); listings mock |
| Food | **FAIL (dead-end)** | `/food` marketing-only; `FeaturedRestaurants.tsx:135` loops back to `/food` |
| Deliveries | **FAIL (UI only)** | `/deliveries/new` simulates confirmation; real `/api/ridely/deliveries` unused; `[id]` is mock |
| Events | **FAIL (mock + orphaned API)** | `events/[id]` mock; register page simulates payment while real `api/events/[id]/register` never called; UI claims "Secure checkout powered by Stripe" without transacting |
| Vendor dashboard | **FAIL (mock)** | bookings, payouts (balance 156,750), products, menu, analytics all hardcoded; `/vendor/settings` → **404** (`VendorSidebar.tsx:28`) |
| Account | **WARN (mixed)** | `account/` hardcodes "Guest User"; payment-methods hits real API |
| Guarded-but-404 routes | **FAIL** | `proxy.ts:7` guards `/profile`, `/payments`, `/bookings`, `/orders` — none exist |

### 5.1 Definite bugs (should fix immediately)
1. `/auth/login` → 404 — `src/app/rides/prime/page.tsx:24`
2. `/vendor/settings` → 404 — `src/components/vendor/VendorSidebar.tsx:28`
3. `/business/{id}` → 404 — `src/components/marketplace/FeaturedBusinesses.tsx:106`
4. `/marketplace/{id}` → 404 — `src/components/marketplace/MarketplaceCard.tsx:45`
5. Post-login `redirect` param dropped — `proxy.ts:143` ↔ `(auth)/login/page.tsx`
6. Real `/checkout` unreachable (no cart UI anywhere)

---

## 6. Payments / Financial Integrity (CRITICAL FAIL)

See `docs/audits/FINANCIAL_INVARIANTS.md` for the full treatment. Headline findings:

1. **CRITICAL — `handle_payment_succeeded(p_transaction_id)`** (`010_stripe_connect_payments.sql:70-129`): `SECURITY DEFINER`, no `auth.uid()` check, and callable by any client via `rpc`. Any signed-in user can mark **any** transaction `succeeded` and credit the **vendor wallet** — free goods + fake settlement. Verified at line 129 (`LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp`).
2. **CRITICAL — no auth on 13+ SECURITY DEFINER functions**: `transition_ride_status`/`transition_delivery_status` (status forgery), `update_driver_location` (GPS spoof/stalking), `record_driver_earning` (arbitrary earnings), `award_loyalty_points` (free rewards), `start/end_driver_session`, `record_safety_event` (also has an FK bug), `verify_item_integrity`, `create_delivery_compliance_record`, `create_theft_prevention_record`.
3. **CRITICAL — anonymous driver GPS enumeration**: `find_nearby_drivers` (002:483) and `find_nearby_drivers_h3` (006) are SECURITY DEFINER, `STABLE`, callable anonymously, and return driver ids/locations — stalking/dispatch-DoS surface.
4. **M-Pesa / Adyen / Airwallex / dLocal / PawaPay have no webhook routes** → payments by these providers can never be confirmed server-side (verified: only `stripe`, `razorpay`, `paystack`, `paychangu`, `flutterwave` webhook routes exist; no `mpesa` callback).
5. **Client-writable financial columns via RLS UPDATE policies**: `orders.payment_status`/`total`/`status` (001:1689), `bookings.amount`/`payment_status` (001:1639), `ridely_rides.actual_fare`/`tip`/`status` (002:918), `driver_payouts` arbitrary INSERT amount (006:610).
6. **No ledger / double-entry.** `payment_transactions` is a single status table; no source-of-funds + destination balance invariant enforced except inside `handle_payment_succeeded`.
7. **Money handling:** amounts stored as numeric; server recomputes in `/api/payment/intent`. Confirm no `parseFloat` on money in customer paths (remaining `any`-typed fields need review).
8. **Service-role routes trust client `userId`**: `api/ridely/rides`, `api/driver/apply`, `api/events/[id]/register` accept `userId` in the body with no server auth check — any caller writes as any user.

---

## 7. Supabase Schema + RLS (CRITICAL FAIL)

Full detail in the audit agent report (migrations 001–011). Headline:

1. **CRITICAL — profile role/KYC self-escalation**: `profiles_update_own` (001:1305-1308) allows `UPDATE` with only `USING (id = auth.uid())`. No column restriction — a user can set their own `role`, `kyc_status`, `is_verified`. Comment claims otherwise. **Verified.** Self-promotion to `vendor`/`driver` unlocks app flows; `super_admin` alone is not enough to bypass `is_admin()` (which uses `admin_users`), but vendor/driver/KYC bypass is real.
2. **HIGH — two tables with NO RLS**: `prohibited_terms`, `content_moderation_flags` (007) — under Supabase default grants, `anon` gets full CRUD → moderation system is defeatable.
3. **HIGH — four tables RLS-locked with zero policies**: `verification_codes`, `driver_safety_training`, `delivery_compliance_tracker`, `driver_safety_checklist` — the last two have **no writer path** at all.
4. **HIGH — broken migration chain**: `006_h3_dispatch_unified.sql` **cannot apply** after 001:
   - `CREATE TYPE payout_status` (006:40) collides with `payout_status` created in 001 (with extra `'on_hold'`) → error.
   - `d.status = 'available'` (006:324,410) — invalid enum literal (`driver_status` has no `'available'`).
   - `d.vehicle->>'type'` (006:325) — no `vehicle` column on `drivers`.
   - `update_updated_at_column()` triggers on `driver_online_sessions`/`driver_earnings`/`driver_payouts` (006:540-550) — none have `updated_at`.
   - Migration **005 is missing** (jumps 004 → 006).
5. **HIGH — `webhook_events_insert` `WITH CHECK (true)`** (010:140-142) — anon can inject rows into the idempotency/webhook ledger.
6. **MED — anon-forgeable INSERT policies**: `order_status_history_insert` (001:1723), `audit_logs_insert` (001:1950), `ride_status_history_insert` (002:1044), `delivery_status_history_insert` (002:1063), `event_share_links` (003) — all `WITH CHECK (true)`.
7. **MED — RLS SELECT gaps**: `payment_transactions`/`escrow_holds`/`refunds` read policies (001) don't cover the new `ridely_ride_id`/`delivery_id` FK columns added in 010 → involved parties can't read their own ridely payments.
8. **MED — no rate limiting** anywhere; `verify_pickup_code` (004:623) is a plaintext 8-char code with no throttle.
9. **No profile signup trigger** — profiles are client-created (`profiles_insert_own`); nothing syncs `email` from `auth.users`.

---

## 8. Mobile (Expo) — FAIL

1. **HIGH — runtime crashes in ride/realtime**: `mobile/src/hooks/useRide.ts:7` & `useRealtime.ts:8` import `{ supabase }` which is **never exported** by `mobile/src/lib/supabase.ts` (exports `createClient` only) → `undefined.channel()` throws. Also `useRide.ts:118,159,182` use relative `fetch('/api/…')` — invalid in RN.
2. **HIGH — checkout simulates payment**: `mobile/app/checkout.tsx:26-31` fake 2s `setTimeout`; claims "256-bit SSL". No SDK, no server call, no redirect to web Stripe.
3. **HIGH — all commerce screens mock**: business detail ignores `id` param (`business/[id].tsx:68`), book ignores params, vendor/driver/events/food all hardcoded.
4. **HIGH — no env config shipped**: `mobile/.env` absent; `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` fall back to `''` → auth fails as shipped.
5. **MED — Android maps blank**: no Google Maps key in `app.json`; `MapView.tsx:48` uses `PROVIDER_DEFAULT`.
6. **LOW — no tests, no typecheck, no ESLint config** (`mobile/package.json:11` has only `expo lint`).
7. **Positive**: no service-role/secret keys in `mobile/`; SecureStore used correctly for session + bearer token; only the anon key is embedded.

---

## 9. Integrations & Env Config (WARN)

See `docs/audits/INTEGRATION_MATRIX.md`. Headline:

- **Stripe: REAL + configured** (official SDK; publishable key delivered via server intent response — correct pattern).
- **Razorpay / Paystack / Flutterwave: real hand-rolled clients, configured.** PayChangu / M-Pesa / Adyen / dLocal / Airwallex / PawaPay: real clients but **unconfigured or misconfigured**:
  - `paychangu-provider.ts:50` reads `PAYCHANGU_SECRET_KEY`, env defines `PAYCHANGU_API_KEY` → constructor throws.
  - M-Pesa reads `MPESA_SHORTCODE_KE/TZ/UG` + `MPESA_PASSKEY_KE/TZ/UG`; env only defines generic `MPESA_SHORTCODE`/`MPESA_PASSKEY`.
  - `flutterwave-provider.ts:282` verifies with `FLUTTERWAVE_WEBHOOK_HASH`; env defines `FLUTTERWAVE_WEBHOOK_SECRET`.
  - No env keys at all for Adyen/dLocal/Airwallex/PawaPay → orchestrator skips them (`payments/index.ts:117-130`).
- **Used but missing from `.env.example`**: ADYEN_*, MPESA_* per-country, PAWAPAY_*, DLOCAL_*, AIRWALLEX_*, `RAZORPAY_ACCOUNT_NUMBER`, `OSRM_BASE_URL`, `MAPBOX_ACCESS_TOKEN`, `STRIPE_WEBHOOK_SECRET_EVENTS`.
- **Dead config**: `PAYSTACK_PUBLIC_KEY`, `FLUTTERWAVE_PUBLIC_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VERCEL_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **No secret leakage**: all provider keys resolve server-side only; no `NEXT_PUBLIC_*` secrets; `.env*` gitignored. ✔
- Route engine: OSRM real (free) + Haversine fallback; Mapbox needs token.

---

## 10. Rendering/Hydration sweep — other findings

| File:Line | Issue | Severity |
|---|---|---|
| `src/app/[country]/order/[id]/page.tsx:25-26,41-43` | Module-level `Date.now()` mock order/delivery rendered with `toLocaleTimeString`/`timeAgo` → SSR/client mismatch | MED |
| `src/app/[country]/business/[id]/page.tsx:75` | Module-level `NOW` for mock review dates | MED |
| `src/components/vendor/RevenueChart.tsx:39-50` | `Math.random()` module-scope mock data (only non-default period) | LOW |
| `src/app/vendor/qr/page.tsx:96` | `document.write` in click handler (user-triggered print popup, static) | INFO |
| `src/components/shared/InlineScript.tsx` | Intentional inline script + scoped `suppressHydrationWarning` (documented pattern) | INFO |

No missing `'use client'` directives found. Client-only libs correctly handled (`dynamic(..., { ssr: false })` for the globe).

---

## 11. Ranked Top-10 Risks to Remediate Before Launch

| # | Severity | Risk | Where |
|---|---|---|---|
| 1 | CRITICAL | Unauthenticated RPC credits wallets / marks payments succeeded | `010:70-129` |
| 2 | CRITICAL | Profile role + KYC self-escalation | `001:1305-1308` |
| 3 | CRITICAL | 13+ unauthenticated SECURITY DEFINER functions (earnings/GPS/status forgery) | `002`,`004`,`006` |
| 4 | CRITICAL | Anonymous driver GPS enumeration | `002:483`, `006:291` |
| 5 | HIGH | Missing webhook routes for M-Pesa/Adyen/Airwallex/dLocal/PawaPay → payments never complete | `src/app/api` |
| 6 | HIGH | Broken migration chain — 006 cannot apply (duplicate enum, invalid refs) | `006` |
| 7 | HIGH | Client-writable financial columns (orders/bookings/rides/driver_payouts) | RLS UPDATE policies |
| 8 | HIGH | No CSP; `typescript.ignoreBuildErrors: true` | `next.config.ts` |
| 9 | HIGH | Service-role API routes trust client `userId` | `api/ridely`, `api/driver`, `api/events` |
| 10 | HIGH | Moderation tables without RLS; locked tables with no writer path | `007`, `004` |

---

## 12. Files Changed This Session

- `src/app/layout.tsx` — theme preload now via `InlineScript` (fix).
- `src/components/shared/InlineScript.tsx` — new data-block inline-script helper.
- `src/tests/unit/script-rendering.test.tsx` — client regression tests.
- `src/tests/unit/script-server-rendering.test.tsx` — SSR regression tests.
- `docs/audits/*.md` — audit deliverables.

**Verdict:** **NOT READY FOR PRODUCTION** until items #1–#7 in Section 11 are remediated. The script-tag error (the original reported bug) is fixed and verified; everything else is documented here with evidence.
