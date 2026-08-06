# AfriBook — Target Architecture (Unified Enterprise Platform)

**Date:** 2026-08-06

One enterprise ecosystem. One codebase. One database. One auth. One wallet. One payments orchestration. One notification/analytics/geo/AI layer. Ridely and RestroBuddy are modules, not apps.

---

## 1. Logical architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                        │
│   Web (Next.js App Router)          Mobile (Expo / React Native)        │
│   ─ public marketing + catalog       ─ customer app (marketplace,        │
│   ─ customer flows (book/order/        rides, food, events, deliveries)  │
│     ride/event/deliver)             ─ driver app (dispatch, nav, earn)  │
│   ─ vendor dashboard                ─ vendor/restaurant app             │
│   ─ admin console                   ─ multi-country, offline-ready       │
└───────────────┬───────────────────────────────┬────────────────────────┘
                │  HTTPS (App Router / Route Handlers)
┌───────────────▼───────────────────────────────▼────────────────────────┐
│                     API / PRESENTATION LAYER (Next.js)                   │
│  proxy.ts (country detect, auth guard, headers)                          │
│  Route Handlers: /api/**                                                  │
│  ├─ Auth: auth/callback                                                    │
│  ├─ Marketplace: booking, order, orders/pickup, pickup/*                    │
│  ├─ Mobility (Ridely): rides, deliveries, food-deliveries, dispatch,        │
│  │     nearby-drivers, location, surge                                      │
│  ├─ Restaurant (RestroBuddy): menu, kitchen, orders                         │
│  ├─ Events: events/** (CRUD, register, tickets, check-in, guests,          │
│  │     photos, promo-codes, subscriptions, analytics)                       │
│  ├─ Payments: payment/intent, payment/confirm, payment-methods, upload      │
│  └─ Webhooks: webhooks/{stripe,razorpay,paystack,flutterwave,paychangu,     │
│        mpesa,adyen,airwallex,dlocal,pawapay}                                │
└───────────────┬───────────────────────────────┬────────────────────────┘
                │ server-side only (service-role, RLS bypass)
┌───────────────▼───────────────────────────────▼────────────────────────┐
│                       SHARED ENTERPRISE CORE (src/lib/)                   │
│  payments/     10-provider orchestration + fees + settlement + ledger      │
│  events/       tickets, check-in, QR, sharing, pricing, analytics          │
│  ridely/       dispatch, route engine/optimization, surge, geospatial, H3  │
│  retrobuddy/   order manager, kitchen display, prep-time prediction        │
│  pickup/       compliance, safety, pickup codes                            │
│  loyalty/      engine + tiers                                              │
│  moderation/   content moderation (rule-based, provider-swappable)         │
│  notifications/push (server), table-backed in-app                          │
│  realtime/     driver location + ride status streams                       │
│  localization/ countries, currencies, ppp, languages, translations        │
│  webhooks/     idempotent event processing                                 │
│  stripe/       (via payments/providers)                                    │
│  supabase/     server + client + admin clients                             │
└───────────────┬───────────────────────────────┬────────────────────────┘
                │ RLS-aware (anon/user) and SECURITY DEFINER (guarded)
┌───────────────▼───────────────────────────────▼────────────────────────┐
│                      DATABASE (Supabase / Postgres 15)                    │
│  auth.* (users, sessions)                                                 │
│  Domain tables (≈90): profiles, marketplace, bookings, rides/deliveries,  │
│    restaurants, events, payments/wallets/ledger, loyalty, notifications,  │
│    moderation, pickup/safety, stays, domains, payment methods             │
│  RLS enabled everywhere; SECURITY DEFINER funcs guarded (require_auth)    │
│  Double-entry ledger (ledger_accounts, ledger_entries) = source of truth  │
└───────────────┬───────────────────────────────┬────────────────────────┘
                │
┌───────────────▼───────────────────────────────▼────────────────────────┐
│                EXTERNAL SERVICES (credentials required)                  │
│  Supabase (auth/DB/realtime/storage)   Stripe + 9 payment providers      │
│  OSRM/Mapbox (routing)  Expo Push      Sentry  PostHog  (AI provider TBD)│
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Shared infrastructure mandates (STEP 5)

| Concern | Canonical owner | Duplicates to remove |
|---|---|---|
| Authentication | Supabase Auth + `profiles`/`users` | none |
| Authorization | `requireAuth()`/`requireRole()` server helpers + RLS + guarded SECURITY DEFINER | per-route client-supplied ids |
| Wallet/Ledger | `ledger_accounts`/`ledger_entries` + `vendor_wallets` | driver earnings as ad-hoc balance |
| Payments | `src/lib/payments/` orchestrator | `payments/paychangu/callback` duplicate |
| Currencies/rates | `currencies`, `country_pricing`, `lib/localization` | none |
| Notifications | `notifications` table + `push.ts` | none |
| Email/SMS/push | push real; email/SMS via provider adapters (TBD) | — |
| Analytics | single client (PostHog) + Recharts dashboards | mock dashboard data |
| Audit logs | `audit_logs` + per-domain status history | none |
| Storage | Supabase Storage (`/upload` route) | — |
| GPS/Maps/Routing | `src/lib/ridely/geospatial.ts` + OSRM/H3 | mobile hardcoded coords |
| AI | `src/lib/moderation/` (rule-based) → central AI gateway (Phase 8) | scattered heuristics |
| Feature flags | `country_pricing`/config (extend) | — |
| Search | `[country]/search` (client filter) → Supabase/Postgres full-text (Phase 6) | — |
| Monitoring | Sentry (present), log drain (TBD) | — |

## 3. Module boundaries

```
Mobility Module (Ridely)          Restaurant Module (RestroBuddy)
├ Rider app: rides, prime,        ├ POS / Kitchen Display (kitchen route)
│   scheduled, airport, corp       ├ Menu builder (menu route)
├ Driver app: trips, earnings,     ├ Inventory + recipe costing
│   vehicle, safety, settings      ├ Table mgmt + reservations
├ Fleet + vehicle mgmt             ├ QR ordering
├ Dispatch engine (dispatch,       ├ Delivery integration (ridely/food)
│   nearby-drivers, surge, H3)     ├ Supplier / purchase orders
├ Driver wallet + instant payout   ├ Loyalty + gift cards
├ Safety: SOS, check-in, zones     ├ CRM + reporting/analytics
└ Navigation + ETA (route-engine)  └ Employee management (staff)

Marketplace Module                 Events Module
├ Vendors, products, services      ├ Create, publish, register
├ Search/filter (country-aware)    ├ Tickets, QR, check-in
├ Bookings + orders                ├ Guests, photos, promo-codes
└ Vendor analytics                 └ Subscriptions
```

## 4. Key architectural decisions

1. **Route handlers are the only DB-touching clients** in the web app; RLS protects anon/user reads; service-role is used only with server-verified session identity.
2. **Ledger-first money:** every wallet credit/debit goes through `post_ledger_entry` (SECURITY DEFINER, service/admin only). Client-facing amount updates are blocked by column revokes.
3. **Webhook idempotency:** every provider event flows through `webhook_events` dedupe (`provider + event_id`) then a terminal-state-guarded handler.
4. **Country-first globalization:** country detected in `proxy.ts` → country cookie → `[country]` routes, currencies/PPP/payment methods per country; language layer (`getTranslation`) to be wired.
5. **Single mobile client** shares one `src/lib` mirror of the web API contract; no relative URLs; absolute API base from `EXPO_PUBLIC_API_URL`.
6. **AI centralization:** one `src/lib/ai/` gateway (provider-agnostic) used by recommendations, search, support, moderation, forecasting, fraud — phased in STEP 8.

## 5. Deployment topology

- **Web/API:** Vercel (one deployment) + `vercel.json`.
- **DB/Auth/Realtime/Storage:** Supabase (one project).
- **Mobile:** EAS builds (Expo) → app stores; `mobile/.env.example` for Supabase URL/anon key + API URL.
- **CI/CD:** GitHub Actions — gate on `typecheck` + `lint` + `test` + `build` + `supabase db reset` (migration chain validation).
- **Monitoring:** Sentry (web + mobile), health checks on `/api` webhooks, structured logs.
```
