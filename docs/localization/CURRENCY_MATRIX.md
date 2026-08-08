# Currency Matrix

Source: `src/lib/localization/currencies.ts` (`CURRENCIES`, 150+ ISO 4217
codes) + `src/lib/money.ts`. `exchangeRate` values are **static, USD-benchmarked
baselines** — see Gap Analysis for the live-rate requirement.

## Formatting contract

- `formatMoney(amount, currencyCode, locale?, {currencyDisplay?})`
- Default display is **`currencyDisplay:'code'`** — ISO code + NBSP + grouped
  number (`MWK 5,000`). Never a bare number.
- `formatMoneySymbol` uses `CURRENCY_SYMBOL_OVERRIDES` because Node ICU prints
  the ISO code even for `currencyDisplay:'symbol'` on many non-ICU-fallback
  currencies.

## Symbol overrides (`CURRENCY_SYMBOL_OVERRIDES`)

| Code | Symbol | Position |
| --- | --- | --- |
| NGN | ₦ | prefix |
| KES | KSh | prefix |
| TZS | TSh | prefix |
| UGX | USh | prefix |
| MWK | MK | prefix |
| ZMW | ZK | prefix |
| XAF / XOF | FCFA | suffix |
| GHS | GH₵ | prefix |
| ETB | Br | suffix |
| ZAR | R | prefix |
| EGP | E£ | prefix |
| AED | د.إ | prefix |
| SAR | ر.س | prefix |
| INR | ₹ | prefix |
| CAD | CA$ | prefix |
| AUD | A$ | prefix |

## Key market baselines (USD → local)

| Currency | Code | ExchangeRate | DecimalPlaces |
| --- | --- | --- | --- |
| US Dollar | USD | 1 | 2 |
| Euro | EUR | 0.92 | 2 |
| British Pound | GBP | 0.79 | 2 |
| Nigerian Naira | NGN | 1550 | 2 |
| Kenyan Shilling | KES | 145 | 2 |
| Ghanaian Cedi | GHS | 15.3 | 2 |
| South African Rand | ZAR | 18.5 | 2 |
| Egyptian Pound | EGP | 49.0 | 2 |
| Tanzanian Shilling | TZS | 2550 | 2 |
| Ugandan Shilling | UGX | 3700 | 2 |
| Malawian Kwacha | MWK | 1730 | 2 |
| Rwandan Franc | RWF | 1350 | 0 |
| Zambian Kwacha | ZMW | 25 | 2 |
| Ethiopian Birr | ETB | 56 | 2 |
| CFA Franc (XAF/XOF) | — | 620 | 0 |
| Zimbabwe | USD | 1 | 2 |
| Indian Rupee | INR | 83.0 | 2 |
| Brazilian Real | BRL | 4.95 | 2 |
| UAE Dirham | AED | 3.67 | 2 |

## Country → currency resolution

1. `COUNTRIES[code].currency`
2. `COUNTRY_CURRENCY_FALLBACK[code]` (covers all 196 ISO codes)
3. `'USD'`

## FX

- `getExchangeRate(from, to)` and `convertCurrency(amount, from, to)` use the
  static baseline (USD as pivot). Unit-tested for every market currency.
- Production path for live FX is `fx_quotes` (migration 015) — currently
  **unseeded**; the static baseline remains active (see Gap Analysis).

## Notable zero-decimal / three-decimal currencies

`decimalPlaces` matters for display and API amounts: RWF, XAF, XOF, IDR, VND,
CLP, COP, JPY, KRW, HUF, ISK, MGA, GNF, BIF, DJF, KMF, VUV are 0; KWD, BHD,
OMR, JOD, TND are 3.
