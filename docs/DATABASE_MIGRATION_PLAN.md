# AfriBook — Database Migration Plan & Consolidation

**Date:** 2026-08-06
**Rule:** **Never destroy production data.** All consolidation is additive (new columns, new tables, guarded backfills). No `DROP`, no destructive `ALTER`, no data loss.

---

## 1. Current migration inventory

| Migration | Content | Status |
|---|---|---|
| 001_initial_schema | Profiles, marketplace, bookings, orders, payments, wallets, notifications, countries/currencies/languages, admin | ✅ applies |
| 002_ridely_retrobuddy | Rides, deliveries, food-deliveries, driver_offers, surge, restaurants, menu | ❌ **FAILS** — `mv_driver_stats` references missing `driver_offers.accepted_at` (002:392-394) |
| 003_events_tickets | Events, tiers, registrations, tickets, guests, photos, check-ins, subscriptions | blocked by 002 |
| 004_pickup_security_compliance | Pickup, verification codes, safety, compliance, theft | blocked |
| **005** | **MISSING** | — |
| 006_h3_dispatch_unified | H3, driver sessions/earnings/payouts, loyalty, push tokens, group orders, country pricing | blocked |
| 007_content_moderation | Moderation | blocked |
| 008_stayscape | Stays | blocked |
| 009_business_subdomains | Business domains | blocked |
| 010_stripe_connect_payments | Payment transactions FKs, wallets metadata, webhook events | blocked |
| 011_user_payment_methods | Payment methods, consents | blocked |
| 012_security_hardening | Ledger, guard helpers, hardened SECURITY DEFINER functions, RLS fixes | blocked |
| seed.sql | Sample data | ❌ incompatible with 001–012 (see GAP_ANALYSIS H9) |

## 2. Entity consolidation map

Merge duplicate/near-duplicate entities into canonical tables. All merges are additive.

| Canonical entity | Consolidates | Plan |
|---|---|---|
| `profiles` | `auth.users`, mobile `users` view | keep `users` view (012); add signup trigger to sync `email` from `auth.users` |
| `vendor_wallets` → generalized wallets | `driver_earnings` running balance | add `account_type`/`account_id` wallet model; keep `driver_earnings` as transaction log |
| `ledger_entries` (double-entry) | all money movement | require every payout/refund/escrow release/earning to post ledger entries |
| `orders` family | `ridely_deliveries`, `ridely_food_deliveries`, `retrobuddy` orders | shared `order_status_history` insert rules; keep vertical tables (typed orders) |
| `notifications` | in-app + push tokens | keep; add read/ack columns if missing |
| `audit_logs` + `*_status_history` | per-domain event logs | keep domain tables; enforce server-only inserts (done for most in 012) |
| `driver_locations` | GPS streams + H3 | keep; `update_driver_location` guarded (done) |
| `loyalty_members` | rewards across verticals | keep core; extend for restaurant loyalty |

## 3. Migration 013 — "consolidation & hardening" (new)

Additive only. Contents:

1. **Fix 002 (unblock the chain) without editing 002:** add `accepted_at TIMESTAMPTZ` to `driver_offers` and rebuild `mv_driver_stats` (`REFRESH MATERIALIZED VIEW`), or create a corrected view under a new name and drop the broken one only if it was never created.
2. **Add missing 005 placeholder:** no-op migration (or move 006 content into chain) to restore `001→002→003→004→005→006→…` continuity.
3. **`drivers.current_trip_id UUID REFERENCES ridely_rides(id)`** — unblocks `ridely_dispatch`/`ridely_dispatch_delivery` (012:1322,1411).
4. **Harden `check_driver_safety_zone`** — replace with a guarded version (require authenticated + driver/zone ownership) using the established `require_authenticated()` pattern.
5. **Extend client-writable money-column protection** to the remaining tables (column-level `REVOKE UPDATE` or policy checks) for: `ride_requests`, `deliveries`, `ridely_food_deliveries`, `event_registrations`, `organizer_subscriptions`, `stay_bookings`, `disputes`.
6. **Close remaining anon-write:** `event_share_links_insert` (003:1378) → require authenticated.
7. **Add `user_sessions` insert policy** (or trigger) so clients can record sessions.
8. **Ledger integration for payouts/refunds/earnings:** add guarded SECURITY DEFINER functions (`record_payout`, `record_refund`, `record_driver_earning`) that both mutate the domain table **and** post `ledger_entries` atomically.
9. **Profile signup trigger:** `handle_new_user()` — insert into `profiles` from `auth.users` on signup (fixes email sync).
10. **Seed rewrite** as a separate fixture script (`supabase/fixtures/demo.sql`) that matches the real schema; keep `seed.sql` as a minimal, schema-correct bootstrap or remove it.

## 4. Migration 014+ (phased features)

| Phase | Migration | Adds |
|---|---|---|
| Payments | 014 | server-side re-pricing guard columns; escrow release ledger trigger; settlement engine tables |
| Mobility | 015 | scheduled/airport/corporate ride fields; fleet tables; instant-payout eligibility; incentive rules |
| Restaurant | 016 | recipes, purchase orders, stock transfers, waste, gift cards, table/reservation schema |
| Events | 017 | waitlist, seat maps, multi-currency tier pricing |
| Globalization | 018 | `countries` locale/format columns (date/number formats, address/phone patterns), `exchange_rates` time series |
| AI | 019 | feature-store / recommendation event table |

## 5. Validation procedure

1. `supabase stop` → `supabase start` (fresh local DB).
2. `supabase db reset` (runs 001→012 + 013 + seed/fixture).
3. Assert: no errors; materialized views refresh; `check_driver_safety_zone` requires auth; dispatch RPCs execute without `current_trip_id` errors; `psql` query of `ledger_balances` returns rows.
4. Add a CI job that runs `supabase db reset` on every PR (catches chain regressions).
5. Production: apply via `supabase db push` per migration, one at a time, with backup before each.

## 6. Data-safety guarantees

- Every migration is additive; backfills guarded by `WHERE` filters.
- Money columns protected at the DB layer (revokes) **and** the app layer (server re-pricing).
- Idempotency via `webhook_events` ledger; terminal-state guards on status transitions.
- No `DROP TABLE`/`DROP COLUMN` in any new migration without explicit sign-off.
