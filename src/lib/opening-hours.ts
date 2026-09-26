import type { BusinessHours } from '@/types'

export interface OpeningStatus {
  /** Open right now, in the venue's own timezone. */
  isOpen: boolean
  /** Today's window, e.g. "09:00 - 18:00", or null when closed all day. */
  todayLabel: string | null
  /** Short zone abbreviation, e.g. "GMT+1" — set only when the venue's zone
   *  differs from the viewer's, which is the only case where the hours could
   *  be misread. Null for a local venue, so the common case stays clean. */
  zoneLabel: string | null
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/**
 * Whether a venue is open, evaluated in the venue's own timezone.
 *
 * This matters more than it looks: "8:00 AM - 5:00 PM" rendered against the
 * viewer's clock is wrong for anyone browsing another country, which is
 * exactly the cross-border case this product supports. A user in Nairobi
 * looking at a Lagos barber needs to know whether it's open *in Lagos*.
 *
 * Handles windows that cross midnight (a bar open 18:00-02:00 is open at
 * 01:00), which a naive open <= now <= close comparison reports as closed.
 */
export function openingStatus(
  hours: BusinessHours[] | undefined,
  timezone: string | undefined,
  now: Date = new Date(),
): OpeningStatus {
  if (!hours?.length || !timezone) {
    return { isOpen: false, todayLabel: null, zoneLabel: null }
  }

  let parts: Intl.DateTimeFormatPart[]
  let zoneLabel: string | null = null
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    })
    parts = fmt.formatToParts(now)
    const venueZone = parts.find((p) => p.type === 'timeZoneName')?.value ?? null
    zoneLabel = venueZone && venueZone !== localZoneName(now) ? venueZone : null
  } catch {
    // An invalid IANA zone shouldn't take a card down with it.
    return { isOpen: false, todayLabel: null, zoneLabel: null }
  }

  const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? NaN)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? NaN)
  if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) {
    return { isOpen: false, todayLabel: null, zoneLabel }
  }

  const nowMinutes = hour * 60 + minute
  const todayIndex = DAY_KEYS.indexOf(weekday as (typeof DAY_KEYS)[number])
  const today = hours.find((h) => h.day?.toLowerCase().startsWith(weekday))

  if (!today || today.isClosed) {
    return { isOpen: false, todayLabel: null, zoneLabel }
  }

  const open = toMinutes(today.open)
  const close = toMinutes(today.close)
  if (open === null || close === null) {
    return { isOpen: false, todayLabel: null, zoneLabel }
  }

  const crossesMidnight = close <= open
  let isOpen = crossesMidnight
    ? nowMinutes >= open || nowMinutes < close
    : nowMinutes >= open && nowMinutes < close

  // A window that ran past midnight belongs to yesterday's entry, so check it
  // too before declaring the venue shut in the small hours.
  if (!isOpen && todayIndex >= 0) {
    const yesterdayKey = DAY_KEYS[(todayIndex + 6) % 7]
    const yesterday = hours.find((h) => h.day?.toLowerCase().startsWith(yesterdayKey))
    if (yesterday && !yesterday.isClosed) {
      const yOpen = toMinutes(yesterday.open)
      const yClose = toMinutes(yesterday.close)
      if (yOpen !== null && yClose !== null && yClose <= yOpen && nowMinutes < yClose) {
        isOpen = true
      }
    }
  }

  return {
    isOpen,
    todayLabel: `${today.open} - ${today.close}`,
    zoneLabel,
  }
}

/** The viewer's own zone abbreviation, for the same instant. */
function localZoneName(now: Date): string | null {
  try {
    return (
      new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
        .formatToParts(now)
        .find((p) => p.type === 'timeZoneName')?.value ?? null
    )
  } catch {
    return null
  }
}
function toMinutes(value: string | undefined): number | null {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}
