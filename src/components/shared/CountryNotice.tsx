'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { COUNTRIES } from '@/lib/localization/countries'
import { useCountry } from '@/components/shared/CountryProvider'

/**
 * Web counterpart to the mobile CountryNotice: states plainly when the user is
 * browsing a market other than the one they appear to be in, and offers one
 * click back.
 *
 * Booking across borders is a real use case — sending food to family,
 * arranging a service before you land — so this informs rather than blocks.
 * But everything on screen (prices, currency, availability, payment methods)
 * belongs to the destination country, and someone who hasn't noticed the
 * switch can get a long way into a booking on wrong assumptions.
 *
 * The detected country comes from the `country_detected` cookie that proxy.ts
 * sets from edge IP headers. It's a hint for this copy only — never an
 * authority for pricing or access.
 */
export default function CountryNotice() {
  const { countryCode, setCountry } = useCountry()
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

  return (
    // The site header is `fixed`, so a bar rendered before <main> sits at
    // y=0 underneath it and is invisible. Offset by the header's height, and
    // stick just below it so the notice stays visible while scrolling — a
    // currency warning is worth keeping on screen during a booking.
    <div
      role="status"
      className="sticky top-16 z-30 mt-16 border-b border-border bg-surface-secondary md:top-20 md:mt-20"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <Globe className="h-4 w-4 shrink-0 text-text-tertiary" />
        <p className="text-text-secondary">
          You&apos;re browsing <span className="font-semibold text-text-primary">{viewing.name}</span>
          {' — prices in '}
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {viewing.currency.code}
          </span>
          {'.'}
        </p>
        <button
          onClick={() => setCountry(detected, { navigate: false })}
          className="font-semibold text-amber-600 underline-offset-2 hover:underline"
        >
          Switch to {home.name}
        </button>
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
