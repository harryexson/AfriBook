# Country Support Matrix

Coverage strategy: every ISO 3166-1 alpha-2 code resolves to a currency via
`COUNTRY_CURRENCY_FALLBACK` in `src/lib/money.ts` (all 196 codes). Full
`CountryConfig`s (currency, language, timezone, payment methods, categories,
tax) are defined in `src/lib/localization/countries.ts` (`COUNTRIES`, line 39)
for supported markets.

## Launch markets (fully configured + seeded payment capabilities)

| Code | Country | Currency | Locale | RTL | Timezone | Tax (base) | Signature methods |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MW | Malawi | MWK | en | no | Africa/Blantyre | — | Airtel Money, TNM Mpamba (MTN), card, bank transfer |
| ZM | Zambia | ZMW | en | no | Africa/Lusaka | 16% VAT | Mobile money |
| ZW | Zimbabwe | USD | en | no | Africa/Harare | 15% VAT | Card (USD) |
| KE | Kenya | KES | en | no | Africa/Nairobi | 16% VAT | M-Pesa, card |
| NG | Nigeria | NGN | en | no | Africa/Lagos | 7.5% VAT | Card, bank transfer, USSD, mobile money |
| GH | Ghana | GHS | en | no | Africa/Accra | 15% VAT | Card, bank transfer, mobile money |
| TZ | Tanzania | TZS | en | no | Africa/Dar_es_Salaam | 18% VAT | M-Pesa |
| UG | Uganda | UGX | en | no | Africa/Kampala | 18% VAT | M-Pesa, Airtel Money |
| RW | Rwanda | RWF | en | no | Africa/Kigali | 18% VAT | Mobile money |
| SN | Senegal | XOF | fr | no | Africa/Dakar | 18% VAT | Mobile money, card |
| CI | Côte d'Ivoire | XOF | fr | no | Africa/Abidjan | 18% VAT | Mobile money (Orange Money), card |
| CM | Cameroon | XAF | fr | no | Africa/Douala | 19.25% VAT | Mobile money (MTN MoMo), card |
| EG | Egypt | EGP | ar | yes | Africa/Cairo | 14% VAT | Card, Fawry, wallet |
| US | United States | USD | en | no | America/New_York | — | Card, bank transfer |
| CA | Canada | CAD | en/fr | no | America/Toronto | 5–15% GST/HST | Card |
| GB | United Kingdom | GBP | en | no | Europe/London | 20% VAT | Card, bank transfer |
| FR | France | EUR | fr | no | Europe/Paris | 20% VAT | Card, SEPA |
| DE | Germany | EUR | de | no | Europe/Berlin | 19% VAT | Card, SEPA |
| AE | UAE | AED | ar/en | yes | Asia/Dubai | 5% VAT | Card |
| IN | India | INR | hi/en | no | Asia/Kolkata | 18% GST | Card, UPI, wallet, net banking |
| BR | Brazil | BRL | pt | no | America/Sao_Paulo | 17% ICMS | Card, bank transfer, cash (Pix) |
| ET | Ethiopia | ETB | en | no | Africa/Addis_Ababa | 15% VAT | Mobile money (Telebirr) |
| ZA | South Africa | ZAR | en | no | Africa/Johannesburg | 15% VAT | Card, bank transfer |

> Tax figures are the base rate from `CountryConfig.taxRate`; GST/VAT/HST
> variations within a country (e.g. CA, IN, US) are handled per business where
> required. ZM 16% and ZW 15% were corrected (previously 1600%/1450%) — covered
> by regression tests.

## Beyond launch markets

- Every remaining ISO code maps to a currency via `COUNTRY_CURRENCY_FALLBACK`.
- **PPP tiering** (`src/lib/localization/ppp.ts`) drives localized platform
  fees, minimum fee floors, and subscription prices for the countries in
  `getAvailablePPPCountries()` — this is how pricing is kept sane in
  low-income markets even before a full `CountryConfig` exists.
- Markets without a `CountryConfig` inherit `locale:'en'`, `timezone:'UTC'`,
  and no RTL; they are placeable/browsable but are not launch-grade.

## Verticals by market

`CountryConfig.categories` gates which verticals appear in a market
(`src/lib/localization/categories.ts` defines the allowed global lists and
prohibited event categories). A vertical shown in a market without a
configured payment rail still falls back to USD/global fallback providers and
should be treated as non-launch.
