# AfriBook Implementation Backlog

**Date:** 2026-08-11
**Status:** Living list. Items are P0 (money/security) or P1 (product-critical)
as labeled. Cross-references: `docs/audits/RELEASE_CHECKLIST.md` (security &
migration blockers), `docs/localization/LOCALIZATION_GAP_ANALYSIS.md` (localization).

## P0 — currency & money correctness (identified this pass)

- [ ] `src/app/api/events/subscriptions/plans/route.ts` hardcodes NGN plan
      prices. Flagged as a product decision (events are NG-first). Decide:
      keep NGN-only but document, or drive from country param + per-country
      pricing table.
- [ ] `src/components/checkout/AiUpsell.tsx:52` and
      `src/components/marketplace/PriceBreakdown.tsx:27` default
      `currencyCode = 'NGN'` (overridable via prop). Callers that don't pass the
      country-derived currency will display NGN for non-NG users. Audit all
      callers and pass real currency.
- [ ] `src/app/api/ridely/surge/route.ts:46` defaults `countryCode` to `'NG'`
      when the query param is missing. Should require the param or fall back to
      the server default country (mirroring checkout patterns).
- [ ] Mobile app NGN hardcodes (`mobile/`). Map and replace with
      `EXPO_PUBLIC_API_URL`-driven server pricing / `getCurrencyForCountry`
      equivalent.
- [ ] `src/lib/utils.ts` `formatCurrency` defaults to `'USD'`. Prefer explicit
      currency at every call site (drives page audits).
- [ ] Client `CountryProvider` default `'NG'` vs server `DEFAULT_COUNTRY='US'`
      mismatch — reconcile so first paint and server render agree.

## P0 — driver payouts wiring

- [ ] `src/lib/ridely/driver-payouts.ts` is rewritten against the real schema
      and unit-lintable, but has **no callers**. Wire it into the driver
      earnings/payout UI (`/driver/earnings`) or an API route, and add
      `driver_payout_methods` support / RLS policies per the schema.
- [ ] Add tests for `driver-payouts.ts` (balance aggregation, instant payout min
      threshold + fee, recordEarning insert shape).

## P1 — mocked frontends (no real data flow)

- [ ] Events UI: `/events`, `/events/create`, `/events/my-events`,
      `/events/[id]` (+ register/check-in/photos/confirmation) are frontend
      mocks. Wire to the existing `/api/events*` routes (register →
      `api/events/[id]/register`, tickets → `api/events/[id]/tickets`).
- [ ] Marketplace: homepage + `/marketplace` `MARKETPLACE_LISTINGS`,
      `/marketplace/[id]`, `/marketplace/products`, `/marketplace/services`.
- [ ] `[country]` verticals: `/search`, `/order/[id]`,
      `/book/[businessId]/[serviceId]` (data still `MOCK_SERVICE`; pricing now
      correct) — call real booking/order APIs.
- [ ] Vendor dashboard mocks (bookings/payouts/products/analytics).

## P1 — hydration & UX (from earlier audits)

- [ ] Module-level `Date.now()` in `[country]/order/[id]` and
      `[country]/business/[id]`; `Math.random()` in `RevenueChart.tsx`.
- [ ] 404 links (`/rides/prime`, `/vendor/settings`, `/business/{id}`,
      `/marketplace/{id}`); honor `?redirect=` on `/login`.

## P2 — ops / tooling

- [ ] Fix `typescript.ignoreBuildErrors: true` in `next.config.ts`; gate CI on
      `tsc --noEmit`.
- [ ] Fix `src/tests/setup.ts:48-49` `require()` imports.
- [ ] Add CSP; drop deprecated `X-XSS-Protection`.
- [ ] Generate `database.types.ts`; apply migrations 013/014/015 to live
      Supabase; repair `supabase/seed.sql`.
