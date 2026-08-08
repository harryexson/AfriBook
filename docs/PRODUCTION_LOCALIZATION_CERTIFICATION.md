# AfriBook Production Localization Certification

**Date:** 2026-08-07
**Status:** CORE VERIFIED — launch scope not yet complete (open items below)

## Summary

The production-localization hardening pass is complete for the core money,
market, and payments layers. Full documentation and evidence live in
`docs/localization/`:

| Doc | Contents |
| --- | --- |
| `LOCALIZATION_ARCHITECTURE.md` | Module map, market resolution chain, money service, payment capability layers, vertical pricing, DB, mobile |
| `COUNTRY_SUPPORT_MATRIX.md` | Launch markets, currencies, locales, tax, methods; fallback strategy for all 196 codes |
| `CURRENCY_MATRIX.md` | Full currency config, symbol overrides, FX baseline, zero/3-decimal currencies |
| `PAYMENT_METHOD_MATRIX.md` | Two-layer capability model, 20-market seed table, enforcement |
| `GEOLOCATION_ARCHITECTURE.md` | Proxy/middleware, `resolveMarketContext`, client geolocation, authority order |
| `CROSS_BORDER_ARCHITECTURE.md` | Market pinning, persistence, cross-border payment/FX rules, edge cases |
| `LOCALIZATION_TEST_PLAN.md` | 103 automated tests, coverage, regression triggers, not-yet-automated |
| `LOCALIZATION_GAP_ANALYSIS.md` | Closed items + open items with impact/effort |
| `LOCALIZATION_PRODUCTION_CERTIFICATION.md` | This certification's detailed evidence table |

## Verified

- `typecheck` (tsc --noEmit) clean · `vitest run` 103/103 (9 files) · `next build` clean (364 routes)
- Market resolution precedence, 196-country currency fallback, NBSP-safe money
  formatting, African symbol overrides, FX baseline
- Events pricing tax/currency (ZM 16%, ZW 15%), ticket-manager currency
- Nearby-drivers country-scoped RPC; order API currency hardening
- Payment method gating (static + runtime table) enforced in `POST /api/payment/intent`
- 122-row capability seed across 20 launch markets (migration 015)
- Transactional email localization (`src/lib/localization/email.ts`, en/fr/ar,
  RTL-aware) wired into the welcome email in `POST /api/consents`

## Open before full global launch

1. Live FX (`fx_quotes` unseeded; static baseline active)
2. Apply migrations 013/014/015 to live Supabase; fix `supabase/seed.sql`
3. Generate `database.types.ts`
4. Finalize buyer-vs-business cross-border currency rule
5. Remove `?? 'USD'` fallbacks in `api/booking` + restaurant vertical
6. Mobile typecheck/build (blocked: no `mobile/node_modules`)
7. Notification localization (emails done: welcome email locale-aware via
   `src/lib/localization/email.ts`; in-app notification templates still hardcoded EN)
8. i18n string coverage audit
9. ZW dedicated payment rail

See `docs/localization/LOCALIZATION_GAP_ANALYSIS.md` for full detail.
