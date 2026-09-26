'use client'

import { useEffect, useState } from 'react'
import { COUNTRIES } from '@/lib/localization/countries'
import { useCountry } from '@/components/shared/CountryProvider'
import { convertCurrency, formatMoneySymbol, getExchangeRate } from '@/lib/money'

export interface LocalPrice {
  /** What the user is actually charged — always the listing's own currency.
   *  This is the bound, authoritative amount, and it's always what renders
   *  as the primary price. */
  display: string
  /** An indicative estimate in the viewer's own currency, or null. Only ever
   *  set when the viewer has explicitly opted in (see `showCurrencyEstimate`
   *  on useCountry()) — never shown automatically. */
  estimate: string | null
  /** True when `estimate` is populated: the viewer opted in AND the
   *  currencies actually differ. */
  hasEstimate: boolean
}

/**
 * Prices a listing for display: the listing's own currency is what's shown
 * and charged, an optional estimate in the viewer's currency is opt-in only.
 *
 * This mirrors what Uber, Airbnb, Amazon and (closer to home) Bolt and Jumia
 * all actually do — checked against each of them before writing this:
 *
 *  - Uber prices a ride in the local currency of where it happens.
 *    "Preferred Currency Pricing" (charging the rider's home currency
 *    instead) is a toggle the rider turns on, carries a disclosed 1.5% fee,
 *    and Uber's own guidance says paying local is "always your best option"
 *    since a card issuer's rate beats the platform's.
 *  - Airbnb's listing currency is the binding price; a guest-chosen payment
 *    currency is an add-on with its own disclosed fee, not the default.
 *  - Amazon's "pay in your currency" (dynamic currency conversion) is the
 *    industry's cautionary tale — opt-in, and documented as a 3-5% hidden
 *    markup with rates that don't match the market. Worth knowing what NOT
 *    to copy.
 *  - Bolt and Jumia, the direct African comparables, don't do cross-currency
 *    substitution at all: local currency per market, full stop.
 *
 * So: the listing's currency is always what's charged and always what's
 * primary on screen. A viewer can opt in (see the currency toggle in
 * CountryNotice) to see a secondary, clearly-labelled estimate — never a
 * silent substitution based on IP geolocation.
 *
 * Rates behind that estimate are the static config baseline in money.ts, not
 * live quotes — another reason the converted figure is presented as an
 * estimate rather than a number anyone should treat as final.
 */
export function useLocalPrice() {
  const { country, showCurrencyEstimate } = useCountry()
  const [detected, setDetected] = useState<string | null>(null)

  useEffect(() => {
    const match = document.cookie.match(/country_detected=([A-Za-z]{2})/)
    setDetected(match?.[1]?.toUpperCase() ?? null)
  }, [])

  const homeCurrency =
    (detected && COUNTRIES[detected]?.currency.code) || country.currency.code

  function price(amount: number, listingCurrency: string): LocalPrice {
    const from = (listingCurrency || '').toUpperCase()
    const display = formatMoneySymbol(amount, from)

    const to = homeCurrency.toUpperCase()
    if (!showCurrencyEstimate || !from || from === to || !getExchangeRate(from, to)) {
      return { display, estimate: null, hasEstimate: false }
    }

    const estimate = formatMoneySymbol(convertCurrency(amount, from, to), to)
    return { display, estimate, hasEstimate: true }
  }

  return {
    price,
    homeCurrency,
    /** Whether an estimate toggle is even worth offering — the viewer's
     *  currency is known and differs from what's being browsed. */
    hasForeignCurrency: Boolean(detected && COUNTRIES[detected]?.currency.code !== country.currency.code),
    showCurrencyEstimate,
  }
}
