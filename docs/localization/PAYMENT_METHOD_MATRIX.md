# Payment Method Matrix

## Two-layer capability model

1. **Static baseline** — `src/lib/payments/types.ts`:
   - `COUNTRY_PROVIDER_MAP` (line ~279): country → ordered provider codes.
   - `COUNTRY_METHODS_MAP` / `getMethodsForCountry`: country → method list.
   - `getProvidersForCountry`: `COUNTRY_PROVIDER_MAP[cc] ?? GLOBAL_FALLBACK_PROVIDERS`.
   - The orchestrator (`orchestrator.ts`) picks the first *registered* provider
     for the country so a missing API key never blocks payments.
2. **Runtime table** — `payment_provider_capabilities` (migration 015):
   - Admin-editable (no deploy). Seeded for 20 launch markets (122 rows).
   - `src/lib/payments/capabilities.ts` (5-min cache):
     - `getProviderCapabilities(cc)` → `null` (empty/error ⇒ use static) or rows
       (populated ⇒ authoritative, **can narrow or disable**).
     - `getAvailableProviders(cc)` → provider codes.
     - `isMethodAvailableForCountry(cc, method)` → static must allow **and**
       runtime (when populated) must agree.
   - Enforcement: `POST /api/payment/intent` rejects unsupported methods with
     HTTP 400 + `supportedMethods`.

## Launch market capability table

| Code | Providers (static, in order) | Methods |
| --- | --- | --- |
| MW | paychangu, pawapay | mobile_money, airtel_money, mtn_mobile_money, bank_transfer, card |
| ZM | pawapay, airwallex | mobile_money |
| ZW | — (USD, global fallback) | card |
| KE | mpesa, pawapay, airwallex | mpesa, card |
| NG | paystack, flutterwave, pawapay | card, bank_transfer, ussd, mobile_money |
| GH | paystack, flutterwave, pawapay | card, bank_transfer, mobile_money |
| TZ | mpesa, pawapay | mpesa |
| UG | mpesa, pawapay | mpesa, airtel_money |
| RW | pawapay, airwallex | mobile_money |
| SN | pawapay, airwallex | mobile_money, card |
| CI | pawapay, airwallex | mobile_money, card |
| CM | pawapay, airwallex | mobile_money, card |
| EG | paychangu, airwallex, pawapay | card, fawry, wallet |
| US | stripe, airwallex, adyen | card, bank_transfer |
| CA | stripe, airwallex, adyen | card |
| GB | stripe, airwallex, adyen | card, bank_transfer |
| FR | stripe, airwallex, adyen | card, sepa |
| DE | stripe, airwallex, adyen | card, sepa |
| AE | stripe, airwallex, adyen | card |
| IN | razorpay, airwallex, stripe | card, upi, wallet, net_banking |
| BR | dlocal, adyen, airwallex | card, bank_transfer, cash |

> ZW: static map omits a dedicated rail, so it routes through
> `GLOBAL_FALLBACK_PROVIDERS` and settles in USD. CA/FR/DE static rows exist in
> `COUNTRY_PROVIDER_MAP`; the seed marks the *methods* available per market.

## Webhook endpoints (per provider)

`/api/webhooks/{stripe,paystack,flutterwave,mpesa,pawapay,paychangu,airwallex,adyen,dlocal,razorpay}`.

## API contract

`POST /api/payment/intent` → `{ redirectUrl, ... }` (provider-specific).
`createPaymentIntent` (in `src/lib/payments/index.ts`) validates amount/currency
before reaching a provider.

## Callback / payout surfaces

- PayChangu callback: `/api/payments/paychangu/callback`.
- Merchant onboarding selects providers via `COUNTRY_PROVIDER_MAP`
  (`src/lib/payments/merchant-onboarding.ts`).

## Backoffice

`/admin/payments` manages providers; capability rows in
`payment_provider_capabilities` are admin-write only (RLS), letting ops disable
a provider or method per country without a deploy.
