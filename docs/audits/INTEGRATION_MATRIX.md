# Integration Matrix — AfriBook

**Date:** 2026-08-05

## 1. Payments

| Provider | Client impl | SDK | Configured? | Webhook verified? | Status |
|---|---|---|---|---|---|
| Stripe | `providers/stripe-provider.ts` | ✅ official `stripe` + `@stripe/react-stripe-js` | ✅ `STRIPE_SECRET_KEY`, publishable key | ✅ `constructEvent` + `STRIPE_WEBHOOK_SECRET` | **READY** |
| Razorpay | `providers/razorpay-provider.ts` | hand-rolled fetch | ✅ | ✅ HMAC | READY |
| Paystack | `providers/paystack-provider.ts` | hand-rolled fetch | ✅ | ✅ HMAC | READY |
| Flutterwave | `providers/flutterwave-provider.ts` | hand-rolled fetch | ⚠️ | ⚠️ webhook verifies with `FLUTTERWAVE_WEBHOOK_HASH`, env defines `FLUTTERWAVE_WEBHOOK_SECRET` | **WARN** |
| PayChangu | `providers/paychangu-provider.ts` | hand-rolled fetch | ❌ reads `PAYCHANGU_SECRET_KEY`, env defines `PAYCHANGU_API_KEY` → constructor throws | ✅ HMAC (unreachable) | **BROKEN** |
| M-Pesa | `providers/mpesa-provider.ts` | hand-rolled fetch | ❌ reads per-country `MPESA_SHORTCODE_KE/TZ/UG`+`PASSKEY_*`; env only generic `MPESA_SHORTCODE`/`PASSKEY` | ❌ **no callback route** | **BROKEN** |
| Adyen | `providers/adyen-provider.ts` | hand-rolled fetch | ❌ no keys | ❌ no route (helper exists) | UNCONFIGURED |
| Airwallex | `providers/airwallex-provider.ts` | hand-rolled fetch | ❌ no keys | ❌ no route (helper exists) | UNCONFIGURED |
| dLocal | `providers/dlocal-provider.ts` | hand-rolled fetch | ❌ no keys | ❌ no route (helper exists) | UNCONFIGURED |
| PawaPay | `providers/pawapay-provider.ts` | hand-rolled fetch | ❌ no keys | ❌ no route (helper exists) | UNCONFIGURED |

Orchestrator: `src/lib/payments/index.ts` resolves providers by country/availability and **skips unconfigured ones** (`:117-130`) — so live fallback is Stripe/Razorpay/Paystack/Flutterwave only.

## 2. Supabase

| Client | Where | Key | Assessment |
|---|---|---|---|
| Web SSR | `src/lib/supabase/server.ts` | anon | ✅ uses `@supabase/ssr` cookie auth |
| Web client | `src/lib/supabase/client.ts` | anon | ✅ |
| Web service-role | inline in ~33 route handlers | `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ server-only (correct), but some routes trust client `userId` |
| Mobile | `mobile/src/lib/supabase.ts` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ anon only + SecureStore (correct) but env absent → `''` fallback |

## 3. Other integrations

| Integration | Status | Notes |
|---|---|---|
| Routing/OSRM | REAL (free) | `route-engine.ts:12` `OSRM_BASE_URL` unset → Haversine fallback active |
| Mapbox | UNCONFIGURED | needs `MAPBOX_ACCESS_TOKEN` |
| Google Maps | DEAD CONFIG | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` never referenced in `src/`; mobile Android maps blank (no key in `app.json`) |
| Push (Expo) | REAL | `notifications/push.ts:71` server-side |
| Content moderation | LOCAL STUB (by design) | `moderation/provider.ts:31` `LocalKeywordModerationProvider`, swappable |
| PostHog | DEAD CONFIG | keys defined in env, never referenced in `src/` |
| Sentry | CONFIGURED | `sentry.*.config.ts` present |

## 4. Env-var hygiene

- `.env*` gitignored ✔; secrets resolve server-side only ✔; no `NEXT_PUBLIC_*` secret ✔.
- **Used in code but missing from `.env.example`:** `ADYEN_API_KEY`, `ADYEN_MERCHANT_ACCOUNT`, `ADYEN_ENV`, `ADYEN_WEBHOOK_HMAC`; `MPESA_SHORTCODE_KE/TZ/UG`, `MPESA_PASSKEY_KE/TZ/UG`, `MPESA_INITIATOR_NAME`, `MPESA_SECURITY_CREDENTIAL`; `PAWAPAY_API_KEY/ENV/WEBHOOK_SECRET`; `DLOCAL_LOGIN/TRANS_KEY/ENV/WEBHOOK_SECRET`; `AIRWALLEX_CLIENT_ID/SECRET/REGION/WEBHOOK_SECRET`; `RAZORPAY_ACCOUNT_NUMBER`; `OSRM_BASE_URL`, `MAPBOX_ACCESS_TOKEN`; `STRIPE_WEBHOOK_SECRET_EVENTS`.
- **Key mismatches (will break in prod):** `PAYCHANGU_SECRET_KEY` vs `PAYCHANGU_API_KEY`; per-country M-Pesa keys never defined; `FLUTTERWAVE_WEBHOOK_HASH` vs `FLUTTERWAVE_WEBHOOK_SECRET`.
- **Dead config:** `PAYSTACK_PUBLIC_KEY`, `FLUTTERWAVE_PUBLIC_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`/`HOST`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VERCEL_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## 5. Mobile integration status

| Area | Status |
|---|---|
| Auth | REAL (`supabase.auth`) |
| Realtime | **BROKEN** — `useRealtime.ts:8` imports `{ supabase }`, never exported by `supabase.ts` |
| Ride lifecycle | **BROKEN** — `useRide.ts:7` same import bug; `:118` relative `fetch('/api/…')` invalid in RN |
| Payments | **FAKE** — `checkout.tsx:26-31` setTimeout; no SDK/server call |
| Commerce data | 100% mock except auth |
| Deep links | `expo-linking` + scheme `afribook` declared, no linking config/QR handling |
