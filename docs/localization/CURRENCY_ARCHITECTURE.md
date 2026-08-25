# Currency Architecture

> Last updated: 2026-08-25

## 1. Principles

1. **Currency derives from market/transaction configuration** — never from
   ad-hoc UI decisions and never a silent `USD` fallback.
2. Three distinct currency concepts, never conflated:
   - **Display currency** — the selected market's currency (`useCountry().currencyCode`).
   - **Transaction currency** — the merchant/service/hotel's configured
     currency for the specific transaction (may differ cross-border).
   - **Settlement currency** — the provider payout currency (payment layer).
3. The United States must never be an implicit fallback. The documented
   final-resort in `getCurrencyForCountry()` (unknown country → USD) applies
   only to codes absent from the 196-country registry.

## 2. Canonical utilities

| Function | Location | Purpose |
|---|---|---|
| `getCurrencyForCountry(cc)` | `src/lib/money.ts` | ISO country → currency code (central registry) |
| `formatMoney(amount, cc)` / `formatMoneySymbol` / `convertCurrency` | `src/lib/money.ts` | Formatting + FX conversion |
| `resolveMarketContext(req)` | `src/lib/localization/market-context.ts` | Server: request → currencyCode |
| mobile `getCurrencyForCountry` / `getCurrencySymbol` | `mobile/src/lib/money.ts` | Mobile parity |

## 3. Rules by layer

- **UI**: always `currencyCode` from `useCountry()` / `useMarketStore()`.
  No component may hard-code `'USD'` or `$`.
- **API routes**: transaction/display currency precedence:
  1. explicit query/body value (validated)
  2. merchant record's own `currency`
  3. merchant's country via `getCurrencyForCountry(business.country_code)`
  4. request market context via `resolveMarketContext(req)`
  Never a bare `?? 'USD'`.
- **Payments**: provider routing uses customer/merchant/transaction country +
  currency against provider capability matrices; billing-address defaults
  (`?? 'US'`) inside PSP SDK payloads remain as PSP-required placeholders and
  are not display-currency logic.
- **Notifications/analytics**: format with the transaction or market currency
  and the market timezone; analytics never mutate market state.

## 4. Market switching

When the user switches markets (e.g. USA → Malawi → Kenya):

1. `setCountry(code)` writes cookie + storage + store atomically.
2. All consumers re-render from the single store — there are no per-page
   caches keyed without market (no react-query/SWR is used; fetches include
   the market param/header on every call).
3. Marketplace data is fetched per-market (`?country=` / `?countryCode=`,
   plus `x-country-code` header), so no stale MWK-priced data can be served
   for KES queries.
