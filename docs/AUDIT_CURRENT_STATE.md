# AfriBook — Repository Discovery & Current-State Audit

**Date:** 2026-08-06
**Scope:** `src/` (web), `mobile/` (Expo), `supabase/` (database), `scripts/`, `docs/`, `design-system/`
**Baseline verification:** `npm run build` ✓ · `npm run typecheck` ✓ · `npm test` 36/36 ✓ · `npm run lint` ✗ (219 errors, 422 warnings)

---

## 1. Repository Topology

| Property | Value |
|---|---|
| Primary platform | AfriBook (`C:\Users\harry\AfriBook`) |
| Ridely (rides/delivery) | **Integrated module** inside AfriBook: `src/app/rides`, `src/app/driver`, `src/app/deliveries`, `src/lib/ridely/`, `src/app/api/ridely/` |
| RestroBuddy (restaurants) | **Integrated module** inside AfriBook: `src/app/vendor/restaurant`, `src/lib/retrobuddy/`, `src/app/api/retrobuddy/` |
| Mono-repo layout | ✅ Single repo, one enterprise app (no separate applications) |
| Package manager | npm (`package-lock.json` present) |
| Version control | git, branch `main`, Husky + commitlint + lint-staged |
| CI/CD | `.github/` present; Vercel target (`vercel.json`) |

> **Finding:** The "three repositories" from the spec already exist as modules inside one codebase. No consolidation is needed; the remaining work is completing and hardening the modules.

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Web framework | Next.js **16.2.10** (App Router, Turbopack) |
| UI | React 19.2.4, Tailwind CSS v4, framer-motion, lucide-react, Radix UI primitives |
| State | Zustand 5 (auth, cart, UI stores) |
| Validation | Zod 4, react-hook-form |
| Backend (BaaS) | Supabase (Postgres 15, Auth, Realtime, Storage) |
| Backend (custom API) | Next.js Route Handlers (`src/app/api/**`, ~90 routes) |
| Payments | Stripe (official SDK) + hand-rolled clients: Razorpay, Paystack, Flutterwave, PayChangu, M-Pesa, Adyen, Airwallex, dLocal, PawaPay |
| Maps / Geo | react-three-fiber globe (web), react-native-maps (mobile), OSRM + Haversine route engine, H3 grid dispatch |
| Notifications | Server push (`src/lib/notifications/push.ts`), in-app notifications table |
| AI | Local rule-based moderation + recommendation helpers (`src/lib/moderation/`); no external AI wired |
| Analytics | Recharts (client dashboards); PostHog config declared but unused; Sentry config present |
| Mobile | Expo SDK 51 / RN 0.74.5, expo-router, Zustand, Supabase, SecureStore |

## 3. Application Surface (Web — Next.js App Router)

### 3.1 Route groups & pages (~150 page routes)

| Vertical | Routes | Status |
|---|---|---|
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password`, auth callback | **Real** (Supabase) |
| Country home | `/[country]` | Static mock data (`lib/countries-data.ts`) |
| Marketplace | `/marketplace`, `/marketplace/products`, `/marketplace/services`, `/[country]/search`, `/[country]/business/[id]`, `/[country]/book/...` | **Mock** data, real search UI |
| Rides | `/rides`, `/rides/book`, `/rides/apply`, `/rides/prime`, `/driver/**` | Book/apply hit **real** APIs |
| Food | `/food`, `/vendor/restaurant/menu`, `/vendor/restaurant/orders` | Mock marketing + dashboards |
| Deliveries | `/deliveries`, `/deliveries/new`, `/deliveries/[id]` | Mock; real API exists unused |
| Events | `/events/**` (create, tickets, register, check-in, subscriptions) | Mock UI; **real** API layer |
| Vendor | `/vendor/**` (10 sub-pages) | Mock dashboards |
| Admin | `/admin/**` (17 sub-pages) | Mock dashboards |
| Account | `/account/**` | Mock; not auth-guarded |
| Legal/Content | ~20 marketing/legal pages | Static |

### 3.2 API surface (Route Handlers)

- **Auth/Session:** `auth/callback`
- **Marketplace:** `booking`, `order`, `orders/pickup/*`, `pickup/status`, `payment/intent`, `payment/confirm`, `payment-methods/*`, `upload`
- **Mobility (Ridely):** `ridely/rides`, `ridely/rides/[id]`, `ridely/rides/[id]/accept`, `ridely/deliveries*`, `ridely/food-deliveries`, `ridely/dispatch`, `ridely/location`, `ridely/nearby-drivers`, `ridely/surge`
- **Restaurant (RestroBuddy):** `retrobuddy/menu`, `retrobuddy/kitchen`, `retrobuddy/orders*`
- **Events:** 25+ routes (CRUD, register, tickets, check-in, guests, photos, promo-codes, publish, subscriptions, analytics)
- **Safety/Compliance:** `safety/sos`, `safety/check-in`, `safety/zones`, `compliance/*`
- **Payments webhooks:** `webhooks/{stripe,razorpay,paystack,flutterwave,paychangu,mpesa,adyen,airwallex,dlocal,pawapay}` + `events/webhooks/stripe`

## 4. Database (Supabase)

- **Postgres 15** (`supabase/config.toml`), migrations `001`–`012` (note: **005 missing**).
- ~90 tables across domains: auth/profiles, marketplace, bookings, rides/delivery (Ridely), restaurants (RestroBuddy), events, payments/wallets, escrow, ledger (new in 012), loyalty, notifications, moderation, pickup/safety, stays, business domains, payment methods.
- **Migration chain is broken:** `002` fails (`mv_driver_stats` references non-existent `driver_offers.accepted_at`), so nothing after 002 applies on a clean DB.
- RLS coverage is extensive post-012, but residual gaps remain (see GAP_ANALYSIS).

## 5. Mobile (Expo)

- **FATAL:** `mobile/src/lib/supabase.ts` has a compile-time duplicate-identifier error (TS2440) and a runtime infinite-recursion path; imported from root layout → app cannot start.
- No `.env`/`.env.example` → `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` are `''`.
- 100% of commerce screens use hardcoded mock data; only auth is real (and broken by §5 bug).
- Checkout simulates payment (`setTimeout`); no payment SDK.
- No Google Maps key in `app.json` → Android maps blank.
- No tests, no ESLint config, no lockfile, no `node_modules`.

## 6. Build & Quality Gates (baseline 2026-08-06)

| Gate | Result |
|---|---|
| `npm run build` | ✅ PASS (≈3.5 min) |
| `npm run typecheck` (`tsc --noEmit`) | ✅ PASS (0 errors) |
| `npm test` | ✅ PASS — 5 files / 36 tests |
| `npm run lint` | ❌ **219 errors** (216 `no-explicit-any`, 2 `no-require-imports`, 1 prefer-const) + 422 warnings |
| `next.config.ts` `typescript.ignoreBuildErrors` | ⚠️ **true** — type errors cannot fail `next build` |

### 6.1 Existing tests (`src/tests/unit/`)

| File | Covers |
|---|---|
| `example.test.ts` | Trivial placeholder |
| `script-rendering.test.tsx` / `script-server-rendering.test.tsx` | Inline-script React 19 data-block pattern |
| `country-provider-hydration.test.tsx` | SSR/hydration country consistency |
| `moderation.test.ts` | Content moderation rules |

> **Coverage gap:** zero tests for payments, webhooks, auth, RLS, money precision, or API authorization.

## 7. Infrastructure / Deployment

| Item | Status |
|---|---|
| Vercel config | `vercel.json` present |
| GitHub Actions | `.github/` present (workflows to verify) |
| Husky / commitlint / lint-staged | Configured |
| Sentry | Client/edge/server configs present |
| Service worker / PWA | `ServiceWorkerRegister` component + manifest |
| Environment | `.env.example` + `.env.local` present; `.env*` gitignored |

## 8. Third-Party Integration Status

| Integration | Status |
|---|---|
| Stripe | **Real + configured** (SDK, webhook `constructEvent`) |
| Razorpay / Paystack | Real, HMAC-verified webhooks |
| Flutterwave | Real; **webhook verification scheme is non-standard** (hashes secret, no body HMAC) |
| PayChangu | Real; **callback route trusts client `?status=`** |
| M-Pesa | Real; per-country keys; callback has no cryptographic signature (inherent to Daraja) |
| Adyen / Airwallex / dLocal / PawaPay | Real clients + webhook routes; require credentials |
| OSRM routing | Real (free) + Haversine fallback |
| Mapbox | Requires token |
| Google Maps | Declared key; mobile Android maps blank |
| Push (Expo) | Server-side real |
| PostHog | Declared, unused |
| next-intl | **Installed but not wired**; 11 translation sets generated but unused |

## 9. Security Posture (headline)

- Security headers present (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) — **no CSP**.
- ~23 API routes use the service-role key and trust **client-supplied** `userId`/`organizerId`/`driverId`/`buyerId` with no session check (primarily events + ridely).
- Migration 012 (security hardening) fixes the prior critical issues: unauthenticated `handle_payment_succeeded`, `find_nearby_drivers*`, profile role self-escalation, anon webhook-event inserts. One unguarded SECURITY DEFINER RPC remains: `check_driver_safety_zone` (004:724).
- No rate limiting anywhere.
- Money amounts: no `parseFloat` on money in payment paths (only geo coords). Several money columns remain client-writable via RLS UPDATE policies.

## 10. Design System

- **Real tokens exist** in `globals.css` (amber/dark premium theme, Inter + Geist Mono, dark mode via class).
- `src/components/ui/` is **empty**; no shadcn-style primitives — UI is hand-rolled Tailwind.
- `design-system/afribook/MASTER.md` is **stale/contradictory** (describes a cyberpunk Orbitron/#EA580C theme not implemented anywhere).

## 11. Verdict

The platform is **architecturally unified** (single repo, single app, single DB) and **builds cleanly**, with a real Supabase-backed backend for auth, payments (Stripe + 9 providers), rides, events, and restaurants. It is **NOT production-ready** because: the database migration chain is broken (002), the mobile app cannot boot (supabase.ts), ~23 API routes bypass authorization, and the majority of commerce UI is mock/hardcoded. See `GAP_ANALYSIS.md` for the prioritized remediation backlog.
