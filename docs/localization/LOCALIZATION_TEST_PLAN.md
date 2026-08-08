# Localization Test Plan

Automated matrix: `src/tests/unit/localization.test.ts` (83 tests) +
`src/tests/unit/payments-capabilities.test.ts` (8 tests) +
`src/tests/unit/email-localization.test.ts` (12 tests). Run with
`npx vitest run`; 103/103 passing.

## Covered by automation

### Market → currency resolution
- MW→MWK, ZM→ZMW, ZW→USD, KE→KES, NG→NGN, GH→GHS, TZ→TZS, UG→UGX, RW→RWF,
  CM→XAF, SN→XOF, ZA→ZAR, ET→ETB, EG→EGP, US→USD, CA→CAD, GB→GBP, FR/DE→EUR,
  AE→AED, IN→INR.
- **No silent USD fallback for African markets** (guards the 
  `COUNTRY_CURRENCY_FALLBACK` guarantee).
- Lower-case / mixed-case country codes normalize to upper-case.

### Money formatting (`formatMoney`)
- NBSP-aware assertions (`MWK\u00A05,000`).
- Decimal places per currency config.
- Symbol display via overrides (`₦`, `ZK`, …).
- Invalid currency code → safe fallback (no crash, no bare number).

### FX baseline
- `getExchangeRate` / `convertCurrency` / `getCurrencyConfig` for every market
  currency.

### Market context
- `resolveMarketContext` precedence: explicit > `x-country-code` >
  `cf-ipcountry` > `Accept-Language` region > `DEFAULT_COUNTRY='US'`.
- `buildMarketContext`: EG → `locale:'ar'`, `isRTL:true`,
  `timezone:'Africa/Cairo'`; AE → `locale:'en'`, `isRTL:true`,
  `timezone:'Asia/Dubai'`.

### Events pricing regression
- No ZM/ZW 1600%/1450% tax (correct: 16%/15%).
- Currency from country (KE→KES, default→USD).
- Free events carry currency.
- Tax applied on discounted subtotal.

### Payments capability layer (`payments-capabilities.test.ts`)
- Empty table / DB error → static-map fallback.
- Populated table → **authoritative** (narrows providers; a fully disabled
  market is an explicit denial with **no fallback**).
- Inactive rows ignored.
- Static baseline never widened by runtime rows.

### Transactional email localization (`email-localization.test.ts`)
- Locale resolution from country code (US→en, FR→fr, EG→ar; unknown → en).
- RTL detection for `dir` attribute (ar → rtl, en/fr → ltr).
- `{param}` interpolation and en fallback for missing locale strings.
- `welcomeEmail` subject/html localization incl. default-name fallback.

## Not yet automated (manual / future)

| Area | Gap |
| --- | --- |
| RTL layout e2e | Visual check of `dir="rtl"` pages (EG/AE) |
| Mobile flows | No `node_modules` for `mobile/` — tsc + tests can't run here |
| Live FX | No provider in CI; `fx_quotes` unseeded |
| Provider SDK e2e | `stripe` is mocked; no live sandbox calls in CI |
| i18n string coverage | `translations.ts` keys not linted against UI usages |
| Geolocation e2e | `cf-ipcountry`/subdomain behavior only unit-tested |

## Regression triggers

Run the full suite before/after any change to:
`src/lib/money.ts`, `src/lib/localization/*`, `src/lib/events/pricing.ts`,
`src/lib/payments/{types,capabilities,index}.ts`,
`supabase/migrations/015_*`, or any `formatMoney`/`currency` call site.
