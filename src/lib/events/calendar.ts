// ─── Calendar Integration Utilities ────────────────────────────
// Generates Google Calendar, Apple Calendar, Outlook URLs and
// downloadable ICS files for AfriBook events.
// ───────────────────────────────────────────────────────────────

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: string;   // ISO string or parseable date (e.g. "Sat, Aug 15, 2026")
  endDate: string;
  startTime: string;   // e.g. "8:00 PM"
  endTime: string;     // e.g. "2:00 AM"
  venue: string;
  address: string;
  city: string;
  country: string;
}

// ─── Internal Helpers ──────────────────────────────────────────

const DEFAULT_TIMEZONE = 'Africa/Lagos';

function parseDate(dateStr: string, timeStr: string): Date {
  const combined = `${dateStr} ${timeStr}`;
  const parsed = new Date(combined);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Unable to parse date: ${combined}`);
  }
  return parsed;
}

function toUtcIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function toUtcCompactDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds())
  );
}

function toIsoDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

function buildLocation(event: CalendarEvent): string {
  const parts = [event.venue, event.address, event.city, event.country].filter(Boolean);
  return parts.join(', ');
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;

  const parts: string[] = [];
  let remaining = line;

  while (remaining.length > 75) {
    parts.push(remaining.slice(0, 75));
    remaining = remaining.slice(75);
  }
  if (remaining.length > 0) {
    parts.push(remaining);
  }

  return parts.join('\r\n ');
}

function generateUid(event: CalendarEvent): string {
  const hash = `${event.title}-${event.startDate}-${event.startTime}-${event.venue}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${hash}@afribook.app`;
}

// ─── Google Calendar URL ───────────────────────────────────────

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = parseDate(event.startDate, event.startTime);
  const endDate = parseDate(event.endDate, event.endTime);

  const dates = `${toUtcCompactDate(startDate)}/${toUtcCompactDate(endDate)}`;
  const location = buildLocation(event);
  const description = event.description || '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Apple Calendar URL ────────────────────────────────────────

export function generateAppleCalendarUrl(event: CalendarEvent): string {
  const startDate = parseDate(event.startDate, event.startTime);
  const endDate = parseDate(event.endDate, event.endTime);
  const now = new Date();

  const uid = generateUid(event);
  const location = buildLocation(event);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AfriBook//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcIcsDate(now)}`,
    `DTSTART:${toUtcIcsDate(startDate)}`,
    `DTEND:${toUtcIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const encoded = btoa(
    icsContent.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')
  );

  return `webcal://afribook.app/api/calendar.ics?data=${encodeURIComponent(encoded)}`;
}

// ─── Outlook Calendar URL ──────────────────────────────────────

export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const startDate = parseDate(event.startDate, event.startTime);
  const endDate = parseDate(event.endDate, event.endTime);
  const location = buildLocation(event);

  const params = new URLSearchParams({
    subject: event.title,
    startdt: toIsoDate(startDate),
    enddt: toIsoDate(endDate),
    body: event.description || '',
    location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// ─── ICS File Download ─────────────────────────────────────────

export function downloadICSFile(event: CalendarEvent): void {
  const startDate = parseDate(event.startDate, event.startTime);
  const endDate = parseDate(event.endDate, event.endTime);
  const now = new Date();

  const uid = generateUid(event);
  const location = buildLocation(event);

  const dtStart = toUtcIcsDate(startDate);
  const dtEnd = toUtcIcsDate(endDate);
  const dtStamp = toUtcIcsDate(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AfriBook//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(event.title)}`,
    `X-WR-TIMEZONE:${DEFAULT_TIMEZONE}`,
    'BEGIN:VTIMEZONE',
    `TZID:${DEFAULT_TIMEZONE}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0100',
    'TZNAME:WAT',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(event.title)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(event.description)}`),
    foldIcsLine(`LOCATION:${escapeIcsText(location)}`),
    `STATUS:CONFIRMED`,
    `TRANSP:OPAQUE`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], {
    type: 'text/calendar;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}.ics`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
