# AfriBook Localization Architecture

> Single source of truth for how AfriBook resolves a user's **market** (country,
> currency, locale, timezone, RTL, payment methods, enabled verticals) across the
> web app, mobile app, API routes, payments, and each vertical (booking, food,
> rides, delivery, events, marketplace).

---

## 1. Core modules

| Module | Responsibility |
| --- | --- |
| `src/lib/localization/countries.ts` | `CountryConfig` per ISO 3166-1 alpha-2 code: `currency`, `language`, `timezone`, `paymentMethods`, `categories`, `taxRate`, `taxName`, `isRTL`, `subdomain`. `COUNTRIES` map starts at line 39. |
| `src/lib/localization/currencies.ts` | `CurrencyConfig` per ISO 4217 code: `symbol`, `name`, `decimalPlaces`, `format`, `exchangeRate` (static USD-benchmarked baseline). |
| `src/lib/localization/market-context.ts` | Server-side market resolver. Exports `MarketContext`, `DEFAULT_COUNTRY='US'`, `SUPPORTED_COUNTRIES`, `resolveMarketContext(req, explicit?)`, `buildMarketContext(countryCode)`. |
| `src/lib/localization/index.ts` | Barrel + convenience: `getCountryConfig`, `getCurrencyConfig`, `getLanguageConfig`, `getCountryCurrency`, `getLocaleFromCountry`, `getTranslation`, `formatPrice`. |
| `src/lib/localization/languages.ts` | `LanguageConfig` registry (locale tag, name, native name, RTL flag). |
| `src/lib/localization/translations.ts` | `TRANSLATIONS` keyed by locale tag; `getTranslation` lookup with fallback. |
| `src/lib/localization/ppp.ts` | Purchasing-power-parity pricing: `getPPPConfig`, `usdToLocal`, `getMinimumFeeFloor`, `getLocalizedSubscriptionPrices`, `getPlatformCommission`, `convertDistance`. |
| `src/lib/money.ts` | **Shared money service** — the only way money is formatted/converted in the app. |
| `src/lib/payments/types.ts` | Static `COUNTRY_PROVIDER_MAP` (line ~279) and method maps — the baseline routing source. |
| `src/lib/payments/capabilities.ts` | Runtime capability layer backed by the `payment_provider_capabilities` table (migration 015). |

## 2. Market resolution chain

`resolveMarketContext` (market-context.ts:58) — first match wins:

1. **Explicit** `countryCode` (path segment, query, or header).
2. **`x-country-code`** header or **`afribook-country`** cookie.
3. **`cf-ipcountry`** (Cloudflare IP geolocation).
4. **`x-vercel-ip-country`** (Vercel fallback geolocation).
5. **`Accept-Language`** — region tag first (`en-NG` → NG), then language-only map `{ fr:'FR', de:'DE', ar:'EG', es:'ES', sw:'KE', hi:'IN', en:'US' }`.
6. **`DEFAULT_COUNTRY = 'US'`**.

Result is a `MarketContext`: country, countryName, `currencyCode` (via `getCurrencyForCountry`), `locale`, `timezone`, `isRTL`, `phoneFormat`, and enabled `categories`.

### Where the chain is applied

- **Middleware / `src/proxy.ts`**: country from subdomain → path → headers, rewrites `/` to `/[country]` (SSG paths for all 196 codes, see build output).
- **`src/components/shared/CountryProvider.tsx`** / **`CountrySelector.tsx`**: client country state, cookie sync, and a picker.
- **API routes**: call `resolveMarketContext(req)` (or `buildMarketContext(countryCode)`) at the top.
- **Money everywhere**: prices are formatted through `src/lib/money.ts` `formatMoney`, never a bare number.

## 3. Money service (`src/lib/money.ts`)

- `formatMoney(amount, currencyCode, locale?, {currencyDisplay?})` — default `currencyDisplay:'code'`; **never returns a bare number**; uses `\u00A0` (NBSP) between ISO code and amount (e.g. `MWK 5,000`).
- `formatMoneySymbol(amount, currencyCode, locale?)` — symbol display.
- `CURRENCY_SYMBOL_OVERRIDES` — Node ICU cannot render symbols for NGN/KES/etc. even with `currencyDisplay:'symbol'`, so explicit overrides exist (NGN `₦`, KES `KSh`, TZS `TSh`, UGX `USh`, MWK `MK`, ZMW `ZK`, XAF/XOF `FCFA`, GHS `GH₵`, ETB `Br`, ZAR `R`, EGP `E£`, AED `د.إ`, SAR `ر.س`, INR `₹`, CAD `CA$`, AUD `A$`), each with prefix/suffix position.
- `getCurrencyForCountry(countryCode)` — `COUNTRIES` config → `COUNTRY_CURRENCY_FALLBACK` (covers all 196 countries) → `'USD'`.
- `getExchangeRate(from, to)` / `convertCurrency(amount, from, to)` — static USD-benchmarked baseline from each `CurrencyConfig.exchangeRate`. **Baseline only; production must source live rates** (see Gap Analysis).
- `isValidCurrencyCode(code)` / `KNOWN_CURRENCY_CODES`.
- `formatMoneyIn(amount, countryCode, ...)` — convenience for country-first callers.

## 4. Payment capabilities

Two layers:

1. **Static baseline** (`src/lib/payments/types.ts`): `COUNTRY_PROVIDER_MAP` and `COUNTRY_METHODS_MAP` — always the source of truth for *routing* and *method gating*.
2. **Runtime table** (`payment_provider_capabilities`, migration 015): admin-editable without a deploy. `src/lib/payments/capabilities.ts` reads it with a 5-minute cache.

Semantics (`capabilities.ts`):
- `getProviderCapabilities(countryCode)` → `ProviderCapability[] | null`. **`null`** = table empty / DB error → callers fall back to static. **`[]`** = table populated but nothing active for the market → explicit denial, **no fallback** (lets ops disable a method by flipping `is_active`).
- `getAvailableProviders(countryCode)` → provider codes (runtime if populated, else static).
- `isMethodAvailableForCountry(countryCode, method)` → static map must allow it **and** (if the table is populated) the runtime table must too.

Enforcement point: `POST /api/payment/intent` rejects a method with 400 + `supportedMethods` before creating an intent. Seeded for 20 launch markets (122 rows) in migration 015.

## 5. Vertical pricing

- **Events** (`src/lib/events/pricing.ts`): `calculateTotalPricing`/`calculateFreeEventPricing` derive `currencyCode` via `getCurrencyForCountry(countryCode)`. Tax rates are per-country from config (e.g. `ZM: 0.16`, `ZW: 0.15`). Registration QR/payment/`currency_code` all use `pricing.currencyCode`.
- **Rides/surge/notifications**: use `getCurrencyForCountry`; notification `formatCurrency` delegates to `formatMoney`.
- **Order API** (`src/app/api/order/route.ts`): currency resolved from `countries.currency_code` join → `getCurrencyForCountry(business.country_code)` → `'USD'` fallback.
- **Delivery fees**: stored per business in `businesses.metadata.delivery_fee` — already per-market.

## 6. Database

- `countries` table (migration 001): `code`, `name`, `currency_code`, ... Full config lives in code (`countries.ts`).
- `businesses.country_code VARCHAR(4) NOT NULL REFERENCES countries(code)`.
- Migration 015 adds: `fx_quotes`, `payment_provider_capabilities`, `service_areas`, and a `p_country_code` parameter on `ridely_find_nearby_drivers` (filters `d.country_code`).
- PostGIS RPC `ridely_find_nearby_drivers(p_lat, p_lng, p_radius_km, p_vehicle_type, p_country_code)` — the only supported way to find drivers; the route no longer selects the `drivers` table directly.

## 7. Mobile

`mobile/src/lib/money.ts` mirrors the web contract (`formatMoney`,
`getCurrencyForCountry`). `mobile/src/stores/market-store.ts` (zustand) is the
single source for country/currency on mobile; screens format all displayed
money through the store (`ServiceCard`, `BookingCard`, checkout, ride, events,
food, vendor, driver). Mobile cannot be typechecked in this environment (no
`node_modules`).

## 8. Transactional email localization

`src/lib/localization/email.ts` holds a small, focused email dictionary
(en/fr/ar; unknown locales fall back to en) with `{param}` interpolation and
RTL detection. `getEmailLocale(countryCode)` derives the locale from
`getLocaleFromCountry`. The only `sendEmail` call site —
`POST /api/consents` welcome email — uses `welcomeEmail()` (subject + `dir`-
aware HTML), resolving the recipient's country from `user_metadata.countryCode`.
In-app notification templates (`src/lib/events/notifications.ts`) are still
hardcoded EN (money strings already delegate to `formatMoney`).
