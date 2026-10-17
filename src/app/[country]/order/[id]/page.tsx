import { redirect } from 'next/navigation'

// This route rendered a hardcoded order with an invented driver and a
// simulated "live" map, whatever id was in the URL. Real orders, read from
// /api/order, are listed at /account/orders.
export default function CountryOrderRedirect() {
  redirect('/account/orders')
}
