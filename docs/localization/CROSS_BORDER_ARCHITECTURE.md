# Cross-Border Architecture

AfriBook is a multi-market marketplace with a single codebase and database. This
doc describes how a market is pinned for every transaction and how money moves
across borders.

## 1. Market pinning

Every request is pinned to exactly one market via `resolveMarketContext`
(market-context.ts:58) or `buildMarketContext(countryCode)`. The pin produces:

- `countryCode` (ISO alpha-2)
- `currencyCode` (ISO 4217, via `getCurrencyForCountry`)
- `locale`, `timezone`, `isRTL`
- `categories` (which verticals are available)

**Never** render or persist a price without a currency attached. The contract
is `formatMoney(amount, currencyCode, locale?)` and the order/registration
records carry `currency_code` and `country_code` together.

## 2. Where the market is persisted

- `businesses.country_code NOT NULL` → the business's home market.
- Orders (`api/order`) resolve currency from the business's country join first,
  falling back to `getCurrencyForCountry(business.country_code)` then `'USD'`.
- Event registrations store `currency_code` from `pricing.currencyCode`
  (venue-country derived), not the event owner's column — so a ticket always
  bills in the venue's currency.
- `drivers.country_code` scopes the PostGIS nearby-driver search
  (`ridely_find_nearby_drivers(..., p_country_code)`).
- `service_areas` (migration 015) will gate deliveries/rides to supported
  regions per market.

## 3. Cross-border payment rules

- **Collect locally.** A buyer pays in their market's currency through a
  provider active in their market (`isMethodAvailableForCountry`). The payment
  intent is created for `(countryCode, method)`.
- **Settle in provider currency.** Each provider's webhook maps the local
  currency to its settlement currency. ZW and other USD-anchored markets settle
  in USD (global fallback providers).
- **Static provider routing** (`COUNTRY_PROVIDER_MAP`) is the baseline; the
  runtime `payment_provider_capabilities` table can narrow/disable per market
  without a deploy.
- **Unsupported method** → HTTP 400 from `POST /api/payment/intent` with the
  list of supported methods, before any provider call.

## 4. FX

- Baseline: static USD-pivot rates in `CURRENCIES[].exchangeRate`
  (`getExchangeRate` / `convertCurrency`).
- Production: `fx_quotes` (migration 015) is the intended live-rate source but
  is currently **unseeded** — the static baseline remains active until a
  provider is wired (see Gap Analysis).
- PPP pricing (`localization/ppp.ts`) keeps fees/subscriptions proportional to
  purchasing power in lower-income markets instead of a flat USD number.

## 5. RTL, locale, and formatting

- `isRTL` from `CountryConfig` (EG, AE, SAR, …) drives `dir` and layout.
- `locale` derives from country via `getLocaleFromCountry` (ar for EG/AE, fr for
  FR/SN/CI/CM, etc.).
- Money formatting is NBSP-safe and symbol-correct for every launch currency via
  `CURRENCY_SYMBOL_OVERRIDES` (Node ICU can't render many African symbols).

## 6. Known cross-border edge cases (documented, not all fixed)

| Case | Current behavior | Required for production |
| --- | --- | --- |
| Buyer in KE, business in NG | Buyer pays in KE market; order currency follows **business** country (NGN) | Align: collect in buyer currency OR require buyer-to-business currency conversion with live FX; enforce one clear rule |
| ZW | Routes via global fallback, settles USD | Dedicated ZWL or explicit USD-billing notice to user |
| FX between non-USD pairs | Static baseline pivot | Live rates + `fx_quotes` seeding + daily refresh job |
| `api/booking` and restaurant verticals | Still contain `?? 'USD'`-style fallbacks (order route was hardened) | Audit and route through money service |
| Mobile checkout | `mobile/src/lib/money.ts` mirrors web; market state not yet wired | CountryPicker-driven market context (see Gap Analysis) |
