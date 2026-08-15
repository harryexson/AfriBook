import { formatMoneySymbol } from '@/lib/money';

/** Format an ISO start_date as a readable local event date/time. */
export function formatEventDate(iso: string): string {
  if (!iso) return 'TBA';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** Format a short date range, e.g. "Fri–Sat, Sep 5–6, 2026". */
export function formatEventDateRange(startIso: string, endIso: string): string {
  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;
  if (!start || Number.isNaN(start.getTime())) return 'TBA';
  if (!end || Number.isNaN(end.getTime())) return formatEventDate(startIso);
  return `${formatEventDate(startIso)} – ${formatEventDate(endIso)}`;
}

/** Format a ticket price from min/max, handling free events. */
export function formatPrice(
  min: number,
  max: number,
  currency: string,
  isFree: boolean,
): string {
  if (isFree || (min === 0 && max === 0)) return 'Free';
  if (min === max) return formatMoneySymbol(max, currency);
  return `${formatMoneySymbol(min, currency)} – ${formatMoneySymbol(max, currency)}`;
}

/** Format a single monetary amount with symbol. */
export function formatAmount(amount: number, currency: string): string {
  return formatMoneySymbol(amount, currency);
}