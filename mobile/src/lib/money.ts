import { COUNTRIES, CURRENCY_RATES, type CountryConfig } from '../constants/countries';

/**
 * Mobile money & currency service.
 *
 * Mirrors the web `src/lib/money.ts` contract: every monetary value rendered
 * on mobile carries an explicit ISO 4217 currency context, and the currency
 * for a market is resolved from the country config — never hard-coded.
 */

export function getCountryConfig(code: string): CountryConfig | undefined {
  return COUNTRIES[code?.toUpperCase()];
}

export function getCurrencyForCountry(countryCode: string): string {
  return getCountryConfig(countryCode)?.currency.code ?? 'USD';
}

export function getCurrencySymbol(countryCode: string): string {
  return getCountryConfig(countryCode)?.currency.symbol ?? '$';
}

/**
 * Format an amount with an explicit currency context using the ISO code.
 *
 *   formatMoney(5000, 'MWK') => "MWK 5,000"
 *   formatMoney(5500, 'NGN') => "NGN 5,500"
 */
export function formatMoney(
  amount: number,
  currencyCode: string,
  opts: { symbol?: boolean } = {},
): string {
  const code = (currencyCode || '').toUpperCase();
  const symbol = getCurrencySymbolForCode(code);
  if (opts.symbol && symbol) {
    return `${symbol}${amount.toLocaleString()}`;
  }
  return `${code} ${amount.toLocaleString()}`;
}

/** Symbol-first variant, e.g. `formatMoneySymbol(5500, 'NGN')` => "₦5,500". */
export function formatMoneySymbol(amount: number, currencyCode: string): string {
  return formatMoney(amount, currencyCode, { symbol: true });
}

const SYMBOL_MAP: Record<string, string> = {
  NGN: '₦',
  KES: 'KSh ',
  TZS: 'TSh ',
  UGX: 'USh ',
  MWK: 'MK ',
  ZMW: 'ZK ',
  ZAR: 'R',
  XAF: 'FCFA ',
  XOF: 'FCFA ',
  GHS: 'GH₵',
  RWF: 'RWF ',
  ETB: 'Br',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'AED ',
  SAR: 'SAR ',
};

export function getCurrencySymbolForCode(code: string): string {
  return SYMBOL_MAP[code] ?? `${code} `;
}

// ─── Conversion ──────────────────────────────────────────────
//
// Config rates are units-per-USD (USD 1, EUR 0.92, NGN 1550, KES 145), so
// going from one currency to another is `to / from` — not the inverse. Getting
// that backwards is silent: the numbers still render, just wrong by orders of
// magnitude, which is exactly how the same bug survived unnoticed on web.
//
// These are baseline config rates, not live quotes. Good enough to help
// someone decide, which is why every converted figure is labelled approximate
// rather than presented as the settlement amount.

/** Rate to multiply a `from` amount by to get `to`, or null if unknown. */
export function getExchangeRate(from: string, to: string): number | null {
  const f = CURRENCY_RATES[(from || '').toUpperCase()];
  const t = CURRENCY_RATES[(to || '').toUpperCase()];
  if (!f || !t || f <= 0 || t <= 0) return null;
  return t / f;
}

/** Convert between currencies, rounded to whole units of the target. */
export function convertCurrency(amount: number, from: string, to: string): number {
  const rate = getExchangeRate(from, to);
  if (rate === null) return amount;
  return Math.round(amount * rate * 100) / 100;
}
