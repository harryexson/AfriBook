# Payments Audit — Findings and Remediation (2026-10-22)

Scope: AfriBook payment orchestration (`src/lib/payments/`), payment webhooks
(`src/app/api/webhooks/`), and the payment confirm route. This is a focused
audit of the highest-risk paths, not the full enterprise scope in the master
prompt. Evidence below was gathered from the code; nothing here has been
tested against live provider sandboxes.

## Findings

| ID | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| PAY-01 | P0 | M-Pesa callbacks are unsigned, and the handler marked payments `succeeded` from the callback body alone. A client who learns a `CheckoutRequestID` can forge a success and obtain goods or tickets unpaid. | `src/app/api/webhooks/mpesa/route.ts`; `verifyWebhook` in `mpesa-provider.ts` only checks that `stkCallback` exists | **Fixed in code**; needs live Daraja verification |
| PAY-02 | P0 (root cause of PAY-01) | M-Pesa `getTransactionStatus` always returned `processing`, so the provider never confirmed status. | `mpesa-provider.ts` (former stub) | **Fixed**: calls `/mpesa/stkpushquery/v1/query` |
| PAY-03 | P1 | `/api/payment/confirm` did not check that the transaction belongs to the caller. Any signed-in user could query or drive status changes on any transaction ID. It also wrote `succeeded` directly. | `src/app/api/payment/confirm/route.ts` | **Fixed**: ownership check (404 otherwise); the route no longer writes status |

## Fixes

- `mpesa-provider.ts`: `getTransactionStatus` calls the Daraja STK Query API.
  ResultCode `0` maps to `succeeded`. Terminal codes (`1`, `1032`, `1037`,
  `2001`) map to `failed`. Anything else, including error envelopes and HTTP
  errors, stays `processing`. Network errors propagate so the orchestrator can
  fall back to local status.
- `webhooks/mpesa/route.ts`: the callback no longer decides the outcome. The
  handler asks the orchestrator for the verified status. Only `succeeded` or
  `failed` can change the transaction; any other result returns
  `verification: pending` and changes nothing.
- `payment/confirm/route.ts`: returns 404 unless `payment_transactions.user_id`
  matches the caller. The route no longer writes a terminal status.

## Tests

- New: `src/tests/unit/mpesa-status-verification.test.ts` (6 tests) covers
  success, terminal failure, in-flight codes, error envelopes, the outgoing
  request, and network failure.
- Full suite: 157 of 157 passing across 15 files. `tsc --noEmit` passes.

## Not verified (blocked)

- Daraja ResultCode meanings and the STK Query response shape are taken from
  Safaricom's published documentation and have **not** been checked against a
  live sandbox. No Daraja sandbox credentials are available here.
- Whether the orchestrator registers the M-Pesa adapter under the
  `provider_code` stored on the transaction row. If it does not, the lookup
  falls back to local status and the webhook fails closed (no state change).
  This needs an end-to-end test with a real transaction row.

## Documentation corrections needed

`docs/audit/PAYMENT_FLOW_AUDIT.md` lists PayChangu under ZA and PawaPay under
MW. PayChangu is a Malawi-focused provider and PawaPay is a mobile-money
aggregator. Treat that table as unverified until each provider's actual
coverage is checked against its official documentation.

## Not yet audited

- Idempotency keys on payment creation, refunds, and payouts.
- Ledger balancing and immutability.
- Webhook handlers for the other providers (Stripe, Paystack, Flutterwave,
  Razorpay, Adyen, Airwallex, dLocal). Only PayChangu, PawaPay, and M-Pesa were
  read in this pass.
- Routing and failover logic, messaging, gateway, and multi-tenancy.

## Release decision

**NOT PRODUCTION-READY for real money movement.** PAY-01 is fixed in code, but
it has not been confirmed against a live Daraja sandbox. The audit scope above
is also incomplete. Use test-mode credentials only until the blocked items are
verified.
