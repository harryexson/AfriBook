# Localization Gap Analysis

Status of the production-localization work. Everything here is either done,
intentionally scoped, or blocked — nothing is claimed complete that is not.

## Closed

- **Market-context cleanup** — removed the import of the nonexistent
  `country-codes` module; `SUPPORTED_COUNTRIES` is built from `COUNTRIES`.
- **Money service** — `formatMoney`/`formatMoneySymbol`/`getCurrencyForCountry`
  with full 196-country currency fallback and symbol overrides.
- **Events pricing tax bug** — ZM 16%, ZW 15% (was 1600%/1450%); currency
  derived from venue country; QR/payment/registration currency unified.
- **Nearby-drivers route** — now uses the `ridely_find_nearby_drivers` RPC with
  country scoping (was selecting nonexistent `drivers` columns).
- **Order API currency** — hardened (business country join → money service).
- **Payment capability layer** — runtime table + helper + intent-route
  enforcement + 20-market seed (122 rows) in migration 015.
- **Mobile market wiring** — `market-store.ts` (zustand) drives `countryCode`/
  `currencyCode`; screens (`checkout`, `ride`, `events`, `food`, `vendor/*`,
  `driver/*`, `book/[businessId]/[serviceId]`, `ServiceCard`, `BookingCard`)
  format via `formatMoney`; no screen-level hardcoded `₦`/`NGN` display
  literals remain.
- **Transactional email localization** — `src/lib/localization/email.ts`
  (en/fr/ar, RTL-aware) wired into the welcome email in `POST /api/consents`.

## Open — required before claiming global production readiness

| # | Item | Impact | Effort |
| --- | --- | --- | --- |
| 1 | **Live FX rates** — `fx_quotes` unseeded; static baseline is the only active source | Prices drift vs reality; cross-border conversion is approximate | Medium (provider + daily refresh job + seeding) |
| 2 | **Migrations 013/014/015 not applied to live Supabase**; `supabase/seed.sql` broken | Capability table/fx/service_areas absent in prod; seed can't bootstrap | Low (apply + fix seed) |
| 3 | **`database.types.ts` missing** — hand-written `src/types/index.ts` out of sync | No compile-time DB schema safety | Medium (generate + reconcile) |
| 4 | **Buyer-vs-business currency rule** — order currency follows the business country while the buyer pays in their market currency | Ambiguous cross-border settlements | Medium (policy + enforcement + tests) |
| 5 | **`api/booking` + restaurant vertical `?? 'USD'` fallbacks** | Silent USD pricing in non-US markets | Low (audit → money service) |
| 6 | **Mobile typecheck/build** — blocked: no `mobile/node_modules` in this environment | Mobile code can't be CI-gated | Low (install + run) |
| 7 | **Notification localization** — in-app notification templates in `src/lib/events/notifications.ts` still hardcoded EN (money strings already go through `formatMoney`); transactional emails are now locale-aware | Notifications not translated in ar/fr/sw markets | Low |
| 8 | **Middleware country set (17 codes)** narrower than `SUPPORTED_COUNTRIES` | Non-listed markets fall back to `us` for the redirect target (API resolver still correct) | Low (widen or derive) |
| 9 | **i18n string coverage** — `translations.ts` not linted against UI | Untranslated UI in ar/fr/sw markets | Medium |
| 10 | **ZW dedicated rail** | ZW settles via USD global fallback | Low (provider add) |

## Explicitly out of scope (documented, not claimed)

- Mobile typecheck/build (no `node_modules` in this environment).
- Live provider sandbox e2e (SDKs mocked in CI).
- 100% certification claim — this repo's docs state verified scope, not a
  blanket "100% localized" claim.
