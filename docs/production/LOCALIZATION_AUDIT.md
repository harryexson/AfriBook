# Localization Audit — Money Paths (Rides / Deliveries / Checkout)

**Date:** 2026-08-11
**Method:** Source scan (`NGN`, `₦`, `currency_code`, `?? 'USD'`, `?? 'NGN'`) +
manual verification of the payment currency resolution chain.

## Verified correct (this pass)

| Path | Mechanism | Verified |
|---|---|---|
| Rides fare estimate (client) | `estimateRideFare(..., countryCode)` returns `currencyCode` from `COUNTRIES` | `src/app/rides/book/page.tsx` |
| Rides fare estimate (server) | `GET /api/ridely/rides` → `estimateRideFare` | `src/app/api/ridely/rides/route.ts` |
| Surge currency | `getCurrencyForCountry(country)` | `src/app/api/ridely/surge/route.ts:47` |
| Delivery estimate | `COUNTRIES[countryCode].currency.code` + `taxRate` | `src/app/api/ridely/deliveries/estimate/route.ts:157,183,210` |
| Web checkout | item currency ?? `getCurrencyForCountry(countryCode)` → Stripe `currency` + `countryCode` | `src/app/checkout/page.tsx` |
| `[country]` checkout | `country?.currency.code ?? getCurrencyForCountry(countryCode)` | `src/app/[country]/checkout/page.tsx` |
| Business detail pricing | `formatCurrency(startingPrice, currencyCode)` | `src/app/[country]/business/[id]/page.tsx` |
| Service booking pricing | `service.currencyCode ?? currencyCode` (country-derived) | `src/app/[country]/book/[businessId]/[serviceId]/page.tsx` |
| Driver delivery page | `formatMoneySymbol(amount, getCurrencyForCountry(countryCode))` | `src/app/driver/delivery/[id]/page.tsx` |
| Customer delivery page | `formatCurrency(amount, currencyCode)` ×4 | `src/app/deliveries/[id]/page.tsx` |
| Payment intent | `params.currency?.toUpperCase() ?? getCurrencyForCountry(params.countryCode)` | `src/lib/payments/index.ts:169-171` |

## Remaining NGN/USD fallbacks (tracked)

| Location | Issue | Backlog ref |
|---|---|---|
| `src/app/api/events/subscriptions/plans/route.ts` | NGN plan prices hardcoded | P0 |
| `src/components/checkout/AiUpsell.tsx:52` | `currencyCode='NGN'` default | P0 |
| `src/components/marketplace/PriceBreakdown.tsx:27` | `currencyCode='NGN'` default | P0 |
| `src/app/api/ridely/surge/route.ts:46` | default country `'NG'` | P0 |
| `src/lib/utils.ts` `formatCurrency` | default currency `'USD'` | P0 |
| `CountryProvider` (client) vs `DEFAULT_COUNTRY` (server) | `'NG'` vs `'US'` | P0 |
| `mobile/` | NGN hardcodes | P0 |

The remaining `NGN` string in `src/app/[country]/book/[businessId]/[serviceId]/page.tsx:20` is mock seed data (`MOCK_SERVICE.currencyCode`), not a code-path default.
`CountryEditor.tsx` contains `₦` as legitimate config data (currency symbol in the country config editor).
