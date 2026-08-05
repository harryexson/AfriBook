# Release Checklist — AfriBook

**Status:** NOT READY FOR PRODUCTION. Gate every release on this list.

## 0. BLOCKING — Security & Money (do not ship until resolved)

- [ ] Gate `handle_payment_succeeded` behind server webhook route; REVOKE EXECUTE from `anon`/`authenticated` (`010:70-129`).
- [ ] Add `auth.uid()`/ownership checks to all SECURITY DEFINER functions; `SET search_path` everywhere (`002`, `004`, `006`).
- [ ] Gate `find_nearby_drivers*` behind authentication (`002:483`, `006`).
- [ ] Fix `profiles_update_own` — narrow to non-privileged columns (`role`, `kyc_status`, `is_verified` read-only for non-admins) (`001:1305-1308`).
- [ ] Narrow RLS UPDATE column lists on `orders`, `bookings`, `ridely_rides`, `ridely_deliveries`, `driver_payouts`.
- [ ] Stop trusting client `userId` in service-role routes (`api/ridely/rides`, `api/driver/apply`, `api/events/[id]/register`).
- [ ] Implement webhook routes for M-Pesa / Adyen / Airwallex / dLocal / PawaPay **or** disable those providers in the orchestrator.
- [ ] Add `ENABLE ROW LEVEL SECURITY` + policies to `prohibited_terms` / `content_moderation_flags` (`007`).
- [ ] Fix `webhook_events_insert` (`WITH CHECK (true)` → internal-only) (`010:140`).

## 1. Database & Migrations

- [ ] Repair migration chain: resolve duplicate `payout_status` enum, invalid `'available'` literal, `d.vehicle` ref, `updated_at` triggers on tables without the column (`006`).
- [ ] Re-add/recreate missing migration `005` (numbering jumps 004 → 006).
- [ ] Add writer paths (policies or RPCs) for `driver_safety_training`, `driver_safety_checklist`, `delivery_compliance_tracker` or remove them.
- [ ] Add SELECT coverage for `ridely_ride_id`/`delivery_id` in `payment_transactions`/`escrow_holds`/`refunds` read policies.
- [ ] Add rate limiting on RPCs (`verify_pickup_code` etc.).
- [ ] Add profile signup trigger syncing `email` from `auth.users`.
- [ ] Apply migrations to a fresh DB and run the full test suite against it (currently 006 fails).

## 2. Code Quality Gates

- [ ] Remove `typescript.ignoreBuildErrors: true` (`next.config.ts:4-6`); gate CI on `tsc --noEmit`.
- [ ] Fix 169 `@typescript-eslint/no-explicit-any` errors (esp. `src/lib/payments/**`).
- [ ] Fix `src/tests/setup.ts:48-49` `require()` imports.
- [ ] Add CSP (allowlist the theme-preload inline script by `'sha256-…'`); drop deprecated `X-XSS-Protection`.

## 3. Web Product (mock → real)

- [ ] Fix 404 links: `/rides/prime`→`/login`, `/vendor/settings`, `/business/{id}`, `/marketplace/{id}`.
- [ ] Honor `?redirect=` on `/login` after proxy redirect (`proxy.ts:143`).
- [ ] Remove guarded-but-missing routes from `proxy.ts:7` (`/profile`, `/payments`, `/bookings`, `/orders`) or add pages.
- [ ] Wire real `/checkout` into the UI (cart store has no consumers).
- [ ] Replace mock journeys with real data/APIs: `[country]/book`, `[country]/order/[id]`, `[country]/checkout`, `/deliveries/new`, `/events/[id]` + register (call `api/events/[id]/register`), vendor bookings/payouts/products/analytics.
- [ ] Fix hydration mismatches: module-level `Date.now()` in `[country]/order/[id]` and `[country]/business/[id]`, `Math.random()` in `RevenueChart.tsx`.

## 4. Mobile

- [ ] Export `supabase` instance from `mobile/src/lib/supabase.ts` (or fix imports in `useRide.ts`/`useRealtime.ts`).
- [ ] Replace relative `fetch('/api/…')` with absolute API URL (`EXPO_PUBLIC_API_URL`).
- [ ] Add `mobile/.env` with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.
- [ ] Replace simulated checkout with real payment (redirect to web Stripe checkout or use a real RN SDK).
- [ ] Wire business/book screens to real params + data.
- [ ] Add Google Maps API key to `app.json` for Android maps.
- [ ] Add typecheck + tests; add ESLint config.

## 5. Integrations

- [ ] Fix env mismatches: `PAYCHANGU_SECRET_KEY`, per-country M-Pesa keys, `FLUTTERWAVE_WEBHOOK_HASH`.
- [ ] Complete `.env.example` with all provider vars actually read in code; remove dead vars.

## 6. Release steps

- [ ] `npm run lint` clean (0 errors).
- [ ] `npm run typecheck` clean.
- [ ] `npm test` green (34 + new).
- [ ] `npm run build` clean.
- [ ] E2E smoke on a production build: login → ride booking (Stripe test) → vendor dashboard → refund.
- [ ] Verify no provider secret in client bundle (grep build output for `sk_live`, `SECRET_KEY`).
- [ ] Confirm script-tag warning absent in production bundle console.
- [ ] Run `docs/audits/AFRIBOOK_PRODUCTION_AUDIT.md` remediation tracker; re-audit before launch.
