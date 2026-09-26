'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { COUNTRIES } from '@/lib/localization/countries'
import { useCountry } from '@/components/shared/CountryProvider'

/**
 * Web counterpart to the mobile CountryNotice: states plainly when the user is
 * browsing a market other than the one they appear to be in, and offers one
 * click back — plus, when the currencies actually differ, an opt-in toggle to
 * see estimated prices in the viewer's own currency.
 *
 * Booking across borders is a real use case — sending food to family,
 * arranging a service before you land — so this informs rather than blocks.
 * Everything on screen (prices, currency, availability, payment methods)
 * belongs to the destination country and is what's actually charged, matching
 * how Uber, Airbnb, Bolt and Jumia all price a listing in its own market's
 * currency by default. The estimate toggle here is the one, single, obvious
 * place to opt into a converted figure — mirroring Airbnb's "pay in your
 * currency" switch, which is guest-initiated and never automatic.
 *
 * The detected country comes from the `country_detected` cookie that proxy.ts
 * sets from edge IP headers. It's a hint for this copy only — never an
 * authority for pricing or access.
 */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono font-semibold tabular-nums text-text-primary">{children}</span>
  )
}

export default function CountryNotice() {
  const { countryCode, setCountry, showCurrencyEstimate, setShowCurrencyEstimate } = useCountry()
  const [detected, setDetected] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/country_detected=([A-Za-z]{2})/)
    setDetected(match?.[1]?.toUpperCase() ?? null)
  }, [])

  if (!detected || dismissed || detected === countryCode) return null

  const viewing = COUNTRIES[countryCode]
  const home = COUNTRIES[detected]
  if (!viewing || !home) return null

  const sameCurrency = viewing.currency.code === home.currency.code

  return (
    // The site header is `fixed`, so a bar rendered before <main> sits at
    // y=0 underneath it and is invisible. Offset by the header's height, and
    // stick just below it so the notice stays visible while scrolling — a
    // currency notice is worth keeping on screen during a booking.
    <div
      role="status"
      className="sticky top-16 z-30 mt-16 border-b border-border bg-surface-secondary md:top-20 md:mt-20"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <Globe className="h-4 w-4 shrink-0 text-text-tertiary" />
        {/* Prices are what's actually charged, always in the destination's own
            currency — never phrased as something the user is charged in
            their own currency, since that isn't true. */}
        <p className="text-text-secondary">
          You&apos;re browsing <span className="font-semibold text-text-primary">{viewing.name}</span>
          {' — prices in '}<Code>{viewing.currency.code}</Code>{'.'}
        </p>
        <button
          onClick={() => setCountry(detected, { navigate: false })}
          className="font-semibold text-amber-600 underline-offset-2 hover:underline"
        >
          Switch to {home.name}
        </button>
        {!sameCurrency && (
          <button
            onClick={() => setShowCurrencyEstimate(!showCurrencyEstimate)}
            aria-pressed={showCurrencyEstimate}
            className="font-semibold text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
            title="An indicative estimate only — you're always charged in the price shown above, not this figure."
          >
            {showCurrencyEstimate
              ? `Hide ${home.currency.code} estimate`
              : `Show estimate in ${home.currency.code}`}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto text-xs font-medium text-text-tertiary hover:text-text-secondary"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
