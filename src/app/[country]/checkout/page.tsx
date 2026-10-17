import { redirect } from 'next/navigation'

// This route used to be a self-contained mock: hardcoded basket items, a
// two-second fake "processing" delay, then "Payment successful!" and a fixed
// ORD-ABC123 — no order created, no payment taken. The real cart checkout
// (Stripe and local providers, writing to /api/order) lives at /checkout.
export default function CountryCheckoutRedirect() {
  redirect('/checkout')
}
