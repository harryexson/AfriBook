# Financial Invariants — AfriBook Payments Audit

**Scope:** `src/lib/payments/**`, `src/app/api/payments/**`, `src/app/api/webhooks/**`, `src/app/api/order`, `src/app/api/payment/**`, `supabase/migrations/001,002,010` payment tables.
**Date:** 2026-08-05
**Verdict:** **CRITICAL FAIL** — multiple unauthenticated money-movement paths and no end-to-end ledger. Do not enable real payments until resolved.

---

## 1. Data model

`payment_transactions` (001:634) is a single status table with `amount`, `net_amount`, `currency`, `status`, plus nullable FK links (`order_id`, `booking_id`, and — added in 010 — `ridely_ride_id`, `delivery_id`). Supporting tables: `payouts`, `escrow_holds`, `vendor_wallets`, `settlements`, `refunds`, `disputes`, `chargebacks`, `webhook_events` (010), `user_payment_methods` (011).

**There is no double-entry ledger.** Wallet balance is mutated only inside `handle_payment_succeeded`. No transaction records source-of-funds debit + destination credit atomically for the general case.

## 2. State machine

Provider-agnostic statuses observed across providers/webhooks:

```
created → pending → (provider) → succeeded   [happy path]
   └──→ failed / cancelled / expired
succeeded → refund_requested → refunded
```

Server authoritative statuses are set in `src/lib/payments/db.ts` helpers and the webhook routes. Client code must only set `created`/`pending`.

### Gaps
- **No explicit terminal-state guard at the DB level** — nothing prevents a provider webhook from transitioning a `refunded` transaction back to `succeeded` (only the app-level checks inside each webhook route prevent it, inconsistently).
- `handle_payment_succeeded` is the only idempotent transition (guards on `status = 'succeeded'`, 010:84-86) — **but it is callable by any client** (Section 4).
- **Missing webhook routes** mean the following state machines can never reach `succeeded` via a verified path:
  - M-Pesa (STK push stored, no `/api/payments/mpesa/callback` route — verified absent)
  - Adyen, Airwallex, dLocal, PawaPay (providers implement `verify*` but no webhook route exists)

## 3. Webhook signature verification per provider

| Provider | Webhook route | Signature verified? | Notes |
|---|---|---|---|
| Stripe | `api/webhooks/stripe` | ✅ yes | `constructEvent` + `STRIPE_WEBHOOK_SECRET` |
| Razorpay | `api/webhooks/razorpay` | ✅ yes | HMAC |
| Paystack | `api/webhooks/paystack` | ✅ yes | HMAC |
| PayChangu | `api/webhooks/paychangu` | ✅ yes | HMAC |
| Flutterwave | `api/webhooks/flutterwave` | ✅ yes | HMAC (env key mismatch — see §7) |
| M-Pesa | **none** | ❌ n/a | no route exists |
| Adyen | **none** | ❌ n/a | provider has `verify` helper, unused |
| Airwallex | **none** | ❌ n/a | same |
| dLocal | **none** | ❌ n/a | same |
| PawaPay | **none** | ❌ n/a | same |

`webhook_events` (010) is written with `WITH CHECK (true)` INSERT policy — unauthenticated clients can inject fake events into the idempotency ledger (010:140-142). HIGH.

## 4. CRITICAL — unauthenticated money-movement RPC

`handle_payment_succeeded(p_transaction_id UUID)` — `supabase/migrations/010_stripe_connect_payments.sql:70-129`:

```
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
```

- **No `auth.uid()` check**, no service-key check, no `pg_trigger_depth()` guard.
- Supabase default grants give `anon`/`authenticated` `EXECUTE` on public functions → any client can call `rpc('handle_payment_succeeded', { p_transaction_id })`.
- Effect: marks **any** `payment_transactions.id` as `succeeded` **and** adds `net_amount` to the owning vendor's `vendor_wallets.balance`/`available_balance` (010:122-127).
- This single function defeats payment authority: an attacker buys nothing, marks arbitrary transactions paid, and inflates any vendor wallet.

**Fix:** move wallet crediting behind an internal-only function (REVOKE EXECUTE from anon/authenticated), require the webhook route to pass `auth.uid() = service-role` or an internal schema; or inline the logic in the webhook route handler using the service role client (bypassing RLS is fine for server routes).

## 5. CRITICAL — other unauthenticated SECURITY DEFINER functions

All run with default `search_path` (only `handle_payment_succeeded` sets it) and no caller authorization:

| Function | Ref | Abuse |
|---|---|---|
| `transition_ride_status(ride_id, status, …)` | 002:690 | Mark any ride completed/cancelled |
| `transition_delivery_status(delivery_id, status, …)` | 002:739 | Same for deliveries |
| `update_driver_location(driver_id, lat, lng, …)` | 002:785 | Spoof any driver's GPS (stalking/DoS on dispatch) |
| `record_driver_earning(driver_id, fares, tip, platform_fee)` | 006:434 | Create arbitrary earnings (finance manipulation) |
| `award_loyalty_points(member_id, points)` | 006:473 | Free rewards |
| `start_driver_session(id)` / `end_driver_session(id)` | 006:399/416 | Flip any driver online/offline |
| `record_safety_event(driver_id, …)` | 004:733 | Forge SOS events; **FK bug** — writes `drivers.id` into `notifications.user_id` (FK→`profiles.id`) → runtime failure (004:769-783) |
| `verify_item_integrity(order_id, …)` | 004:924 | Confirm any order chain-of-custody |
| `create_delivery_compliance_record` / `create_theft_prevention_record` | 004:798/901 | Unauthenticated record creation |

**Fix:** add `auth.uid()`/ownership checks inside each function; REVOKE EXECUTE from `anon` where anonymous isn't required; add `SET search_path` to all.

## 6. CRITICAL — anonymous driver GPS enumeration

- `find_nearby_drivers(lat,lng,radius,limit)` (002:483) and `find_nearby_drivers_h3(...)` (006) — SECURITY DEFINER, `STABLE`, no auth gate → **anonymous** clients can enumerate driver ids + locations.
- Feeds stalking and dispatch manipulation.

**Fix:** require an authenticated caller with a valid role; clamp radius/limit; add rate limiting.

## 7. Client-writable financial columns (RLS)

The RLS UPDATE policies let *involved parties* mutate financial/status columns:

| Policy | Ref | What an owner can set |
|---|---|---|
| `orders_update` | 001:1689 | `payment_status`, `total`, `status='delivered'` |
| `bookings_update` | 001:1639 | `amount`, `payment_status='succeeded'`, `status` |
| `ridely_rides_update` | 002:918 | `actual_fare`, `tip`, `status`, `rating` |
| `ridely_deliveries_update` | 002:943 | `actual_fare`, `status` |
| `driver_payouts_insert` | 006:610 | INSERT any `amount` — no balance check against `driver_earnings` |

**Fix:** revoke UPDATE on these columns from owner roles (either narrow the policy column list, or add a `BEFORE UPDATE` trigger rejecting changes to money/status fields unless the caller is admin/service).

## 8. Money handling

- Amounts stored as `numeric`; provider amounts converted in `src/lib/payments/providers/*` (integer minor units at API boundaries). Good.
- **Must verify** (flagged `any`-typed code): no `parseFloat`/`Math.round` on money in customer-facing paths. `payment_transactions.net_amount` is the authoritative net; wallet credit uses `COALESCE(net_amount, amount)` — a NULL net silently credits the full gross. HIGH if any provider path leaves `net_amount` NULL.
- Fees: computed server-side (platform_fee) in `src/lib/payments/db.ts`; confirm a single fee source of truth per provider before enabling.

## 9. Service-role routes trusting client identity

`/api/ridely/rides`, `/api/driver/apply`, `/api/events/[id]/register` use the **service-role** client and accept `userId` in the request body with **no server-side auth check** (only `/api/order`, `/api/payment/intent`, `/api/payment-methods`, `/api/consents` use the auth-guarded `src/lib/supabase/server.ts`).

- Any caller can create rides/driver applications/event registrations as **any user**.
- **Fix:** derive the actor from `supabase.auth.getUser()` server-side; never trust a body `userId` (or require role membership + an explicit admin path).

## 10. Top financial fixes (blocking)

1. Gate `handle_payment_succeeded` behind the webhook route (internal-only; revoke EXECUTE).
2. Add auth checks + `search_path` to all SECURITY DEFINER functions; revoke EXECUTE from anon where possible.
3. Gate `find_nearby_drivers*` behind authentication.
4. Narrow RLS UPDATE column lists on orders/bookings/rides/driver_payouts.
5. Implement webhook routes for M-Pesa/Adyen/Airwallex/dLocal/PawaPay (or disable those providers until implemented).
6. Stop trusting client `userId` in service-role routes.
7. Add a double-entry ledger (debit customer source / credit vendor wallet in one DB transaction) as the single source of truth.
