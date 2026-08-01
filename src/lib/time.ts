// IANA timezone helpers. Safe on both server and client.

interface TzParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: string
}

function getTzParts(date: Date, timeZone: string): TzParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  })
  const parts = dtf.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: get('weekday'),
  }
}

/**
 * Returns a wall-clock Date whose getHours()/getMinutes()/getDay()/etc match
 * the given IANA timezone, regardless of the server/browser timezone.
 */
export function toTimezoneDate(date: Date, timeZone?: string): Date {
  if (!timeZone) return date
  const p = getTzParts(date, timeZone)
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
}

/** Lowercase short weekday key ('mon'...'sun') for the given timezone. */
export function getWeekdayKey(date: Date, timeZone?: string): string {
  return toTimezoneDate(date, timeZone)
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toLowerCase()
}

/** Current time formatted in the given timezone, e.g. "3:45 PM". */
export function formatInTimezone(
  date: Date,
  timeZone?: string,
  opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' },
): string {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: timeZone ?? undefined }).format(date)
}

/** Date-only key (YYYY-MM-DD) of "today" in the given timezone. */
export function getTzDateKey(date: Date, timeZone?: string): string {
  return toTimezoneDate(date, timeZone).toISOString().slice(0, 10)
}
