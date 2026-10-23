# AfriBook API credential setup

Use the root `.env.example` as a reference and add values to the existing root
`.env.local`. Do not replace that file: it already holds the local Neon setup.
Use `mobile/.env.example` for `mobile/.env.local`. The real environment files are
Git-ignored. Keep the examples blank; enter secrets locally or in Vercel, not chat.

In Vercel, open the AfriBook project, Settings, Environment Variables. Add the
same root variable names for the intended environment. Use test credentials for
Preview and live credentials only for Production. Set both public app/site URLs
to the deployment origin. Redeploy after changes; public variables are bundled
at build time. Vercel deploys the web/API, not the Android or iOS binaries.

| Integration | Variables / setup | Current state |
| --- | --- | --- |
| Neon | Preserve existing database, Auth and Data API values | Web integration exists; mobile shared authentication remains unfinished |
| Stripe | Publishable key, secret key, endpoint-specific signing secrets | Payment and webhook code exists; needs end-to-end test payments and reconciliation |
| SignalHouse | Reserved `SIGNALHOUSE_*` fields in the template | Not wired; credentials alone will not send messages |
| Transactional email | Choose one provider and verified sender | Resend, SendGrid and Postmark adapters exist |
| Authentication email | Configure sender/delivery in Neon Auth | Separate from the application's email service |
| SMS | Twilio credentials plus `SMS_PROVIDER=twilio` | Existing adapter; `console` only logs |
| Media uploads | R2 account, bucket, key pair and public media URL | Existing upload integration; configure bucket permissions and verify uploads |
| Maps / routes | Mapbox token and optional OSRM URLs | Existing routing settings; validate coverage and limits |
| Regional payments | Provider-specific fields in template | Existing adapters; select only providers required by enabled countries |

## Stripe

Start with a matching `pk_test_...` and `sk_test_...` pair. The secret key stays on
the server. Copy endpoint signing secrets (`whsec_...`) into the corresponding
variables; an API key is not a webhook secret.

The code contains these webhook routes:

- `/api/webhooks/stripe`: `STRIPE_WEBHOOK_SECRET`; handles
  `payment_intent.succeeded`, `payment_intent.payment_failed`,
  `checkout.session.completed`, `account.updated`, `payout.paid`, `payout.failed`.
- `/api/events/webhooks/stripe`: `STRIPE_WEBHOOK_SECRET_EVENTS`; handles
  `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.

Do not subscribe both endpoints to overlapping payment events without reviewing
event routing and reconciliation: both contain event-registration handling.
Validate one payment, retry delivery, failure and refund in test mode before
enabling live traffic. Stripe Connect onboarding and subscription price IDs
require their corresponding account/product configuration as well.

## SignalHouse

The current SMS service accepts only Twilio or console. SignalHouse's website
describes messaging APIs: https://signalhouse.io/ . The reserved names in the
template are proposed application settings, not a claim about its API schema.
Before implementation, obtain the official API documentation URL from your
SignalHouse dashboard, the account's authentication method, approved sender,
country coverage and delivery callback/signature documentation. Keep credentials
private. Do not set `SMS_PROVIDER=signalhouse` yet: it currently falls back to
console and would not deliver SMS. No SignalHouse callback endpoint exists yet.

## Remaining work beyond credentials

Mobile Neon sign-in, mobile restaurant API connectivity, SignalHouse delivery,
webhook reconciliation and production database migration verification remain
open. Push notification services and native payment SDK flows also require
implementation and device testing, not invented environment keys. See
`audits/reference-redesign-review.md` for the existing readiness report.

Restart local servers after changing credentials. On mobile, rebuild/restart Expo
after changing public settings. Never place database credentials, Stripe secret
keys or SMS/email provider secrets in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables.
