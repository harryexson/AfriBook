# Localization Production Certification

**Scope of this certification:** the production-localization hardening pass on
the AfriBook monorepo. It certifies what has been verified; it does **not**
claim 100% of the roadmap (see Gap Analysis for open items).

## Verified (evidence in this repo)

| Area | Status | Evidence |
| --- | --- | --- |
| Market resolution chain | ✅ | `market-context.ts`; tests assert precedence (explicit > header > IP > language > default) |
| Country → currency for all 196 ISO codes | ✅ | `COUNTRY_CURRENCY_FALLBACK`; tests assert no silent USD for African markets |
| Money formatting contract (NBSP, no bare numbers) | ✅ | `src/lib/money.ts`; NBSP/symbol tests |
| African currency symbols (ICU workaround) | ✅ | `CURRENCY_SYMBOL_OVERRIDES`; symbol tests |
| FX baseline + conversion | ✅ (baseline) | `getExchangeRate`/`convertCurrency` tests; live rates open (Gap #1) |
| Events pricing (tax, currency, free events, discounts) | ✅ | `pricing.ts`; ZM/ZW regression tests |
| Nearby-drivers country scoping | ✅ | RPC + route rewrite |
| Order API currency | ✅ | business-country join + money service |
| Payment method gating (static + runtime) | ✅ | `capabilities.ts` + intent-route enforcement + 8 tests |
| Launch-market capability seed | ✅ | migration 015, 122 rows / 20 markets |
| Transactional email localization | ✅ | `localization/email.ts` (en/fr/ar, RTL) + welcome-email wiring + 12 tests |
| Docs | ✅ | `docs/localization/*` |
| Unit test suite | ✅ | 103/103 passing (9 files) |
| Typecheck | ✅ | `tsc --noEmit` clean |
| Production build | ✅ | `next build` clean, 364 routes |

## Not verified (open)

1. Live FX (`fx_quotes` unseeded) — static baseline active.
2. Migrations 013/014/015 applied to live Supabase.
3. `database.types.ts` generation.
4. Cross-border buyer/business currency rule finalization.
5. `api/booking` + restaurant vertical `?? 'USD'` fallbacks.
6. Mobile typecheck/build (no `node_modules`; mobile not typecheckable here).
7. Notification localization (in-app templates hardcoded EN; emails done).
8. i18n string coverage audit.
9. ZW dedicated rail.

## Commands to reproduce

```bash
npm run typecheck
npx vitest run        # 103/103
npm run build         # 364 routes, clean
```

## Conclusion

**Localization core (market resolution, currency, payments gating, events
pricing, driver geolocation) is production-hardened and verified.** Global
production readiness additionally requires closing Gap items 1–10; see
`docs/localization/LOCALIZATION_GAP_ANALYSIS.md`.
