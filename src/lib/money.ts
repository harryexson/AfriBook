import { CURRENCIES, type CurrencyConfig } from './localization/currencies';
import { COUNTRIES } from './localization/countries';

/**
 * Consolidated money & currency service.
 *
 * Single source of truth for:
 *  - country -> currency resolution (market context)
 *  - localized money formatting (ISO 4217 codes, never bare amounts)
 *  - static-baseline FX conversion (exchange rates are config time snapshots;
 *    production rates should be loaded from the `fx_quotes` table / provider)
 *
 * Every monetary value in AfriBook must be rendered through `formatMoney`
 * so it always carries an explicit currency context.
 */

const DEFAULT_LOCALE = 'en-US';

/** Every known currency symbol, used to detect hard-coded symbols in data. */
export const KNOWN_CURRENCY_CODES = Object.keys(CURRENCIES);

export function getCurrencyConfig(code: string): CurrencyConfig | undefined {
  return CURRENCIES[code];
}

/**
 * Resolve the currency for a market/country code.
 *
 * Resolution order:
 *   1. Explicit country config (196 countries in `localization/countries`)
 *   2. Curated country map
 *   3. USD as a last-resort global default
 *
 * Never silently returns USD for a country we know about.
 */
export function getCurrencyForCountry(countryCode: string): string {
  const country = COUNTRIES[countryCode] ?? COUNTRIES[countryCode.toUpperCase()];
  if (country?.currency?.code) return country.currency.code;
  const fallback = COUNTRY_CURRENCY_FALLBACK[countryCode.toUpperCase()];
  if (fallback) return fallback;
  return 'USD';
}

/** Curated map for any country missing from the config table. */
export const COUNTRY_CURRENCY_FALLBACK: Record<string, string> = {
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  BR: 'BRL',
  MX: 'MXN',
  ZA: 'ZAR',
  NG: 'NGN',
  GH: 'GHS',
  KE: 'KES',
  TZ: 'TZS',
  UG: 'UGX',
  MW: 'MWK',
  ZM: 'ZMW',
  ZW: 'USD',
  RW: 'RWF',
  EG: 'EGP',
  SN: 'XOF',
  CI: 'XOF',
  CM: 'XAF',
  BF: 'XOF',
  BJ: 'XOF',
  GN: 'GNF',
  MR: 'MRU',
  NE: 'XOF',
  ML: 'XOF',
  TD: 'XAF',
  GA: 'XAF',
  CG: 'XAF',
  CD: 'CDF',
  ET: 'ETB',
  SL: 'SLL',
  LR: 'LRD',
  GM: 'GMD',
  GN2: 'GNF',
  CV: 'CVE',
  ST: 'STN',
  SC: 'SCR',
  MU: 'MUR',
  MG: 'MGA',
  MZ: 'MZN',
  AO: 'AOA',
  NA: 'NAD',
  BW: 'BWP',
  SZ: 'SZL',
  LS: 'LSL',
  KM: 'KMF',
  DJ: 'DJF',
  SO: 'SOS',
  SS: 'SSP',
  SD: 'SDG',
  LY: 'LYD',
  TN: 'TND',
  DZ: 'DZD',
  MA: 'MAD',
  EH: 'MAD',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  CH: 'CHF',
  IS: 'ISK',
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  JO: 'JOD',
  LB: 'LBP',
  IL: 'ILS',
  TR: 'TRY',
  IQ: 'IQD',
  IR: 'IRR',
  SY: 'SYP',
  YE: 'YER',
  AF: 'AFN',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  BT: 'BTN',
  MV: 'MVR',
  MY: 'MYR',
  SG: 'SGD',
  HK: 'HKD',
  TW: 'TWD',
  KR: 'KRW',
  TH: 'THB',
  VN: 'VND',
  PH: 'PHP',
  ID: 'IDR',
  KH: 'KHR',
  LA: 'LAK',
  MM: 'MMK',
  BN: 'BND',
  KZ: 'KZT',
  UZ: 'UZS',
  KG: 'KGS',
  TJ: 'TJS',
  TM: 'TMT',
  MN: 'MNT',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  UY: 'UYU',
  PY: 'PYG',
  BO: 'BOB',
  EC: 'USD',
  VE: 'VES',
  GT: 'GTQ',
  HN: 'HNL',
  NI: 'NIO',
  CR: 'CRC',
  PA: 'PAB',
  CU: 'CUP',
  DO: 'DOP',
  JM: 'JMD',
  TT: 'TTD',
  HT: 'HTG',
  GY: 'GYD',
  SR: 'SRD',
  BZ: 'BZD',
  BB: 'BBD',
  BS: 'BSD',
  AG: 'XCD',
  AI: 'XCD',
  DM: 'XCD',
  GD: 'XCD',
  KN: 'XCD',
  LC: 'XCD',
  VC: 'XCD',
  MS: 'XCD',
  TC: 'USD',
  KY: 'KYD',
  AW: 'AWG',
  CW: 'ANG',
  SX: 'ANG',
  BQ: 'USD',
  GL: 'DKK',
  FO: 'DKK',
  GI: 'GIP',
  MT: 'EUR',
  CY: 'EUR',
  LU: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  PT: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  NL: 'EUR',
  HR: 'EUR',
  XK: 'EUR',
  AD: 'EUR',
  MC: 'EUR',
  SM: 'EUR',
  VA: 'EUR',
  ME: 'EUR',
  RS: 'RSD',
  AL: 'ALL',
  MK: 'MKD',
  BA: 'BAM',
  MD: 'MDL',
  UA: 'UAH',
  BY: 'BYN',
  RU: 'RUB',
  GE: 'GEL',
  AM: 'AMD',
  AZ: 'AZN',
};

/** True when a code is a known ISO 4217 currency in the config. */
export function isValidCurrencyCode(code: string): boolean {
  return Boolean(code && CURRENCIES[code.toUpperCase()]);
}

/**
 * Format an amount with explicit currency context using the ISO 4217 code.
 *
 *   formatMoney(5000, 'MWK') => "MWK 5,000"
 *   formatMoney(25, 'USD')   => "USD 25"
 *   formatMoney(25, 'USD', 'en-US', { currencyDisplay: 'symbol' }) => "$25"
 *
 * Never returns a bare number: a valid currency code is required.
 */
export function formatMoney(
  amount: number,
  currencyCode: string,
  locale: string = DEFAULT_LOCALE,
  opts: { currencyDisplay?: 'code' | 'symbol' | 'narrowSymbol' | 'name' } = {},
): string {
  const code = (currencyCode || '').toUpperCase();
  const config = CURRENCIES[code];
  const decimals = config?.decimalPlaces ?? 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: opts.currencyDisplay ?? 'code',
      minimumFractionDigits: opts.currencyDisplay === 'symbol' ? decimals : 0,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(decimals)}`;
  }
}

/** Symbol-first variant, e.g. `formatMoneySymbol(5000, 'NGN')` => "₦5,000". */
export function formatMoneySymbol(amount: number, currencyCode: string, locale?: string): string {
  const code = (currencyCode || '').toUpperCase();
  const override = CURRENCY_SYMBOL_OVERRIDES[code];
  if (override) {
    const config = CURRENCIES[code];
    const decimals = config?.decimalPlaces ?? 2;
    const number = formatNumber(amount, locale ?? DEFAULT_LOCALE, decimals);
    return override.position === 'prefix'
      ? `${override.symbol}${number}`
      : `${number} ${override.symbol}`;
  }
  return formatMoney(amount, code, locale, { currencyDisplay: 'symbol' });
}

/**
 * Localized symbols for currencies where this Node ICU's CLDR has no distinct
 * glyph (it prints the ISO code even for `currencyDisplay: 'symbol'`). Covers
 * the AfriBook core markets; anything not listed uses the native CLDR symbol.
 */
export const CURRENCY_SYMBOL_OVERRIDES: Record<string, { symbol: string; position: 'prefix' | 'suffix' }> = {
  NGN: { symbol: '₦', position: 'prefix' },
  KES: { symbol: 'KSh', position: 'prefix' },
  TZS: { symbol: 'TSh', position: 'prefix' },
  UGX: { symbol: 'USh', position: 'prefix' },
  MWK: { symbol: 'MK', position: 'prefix' },
  ZMW: { symbol: 'ZK', position: 'prefix' },
  XAF: { symbol: 'FCFA', position: 'suffix' },
  XOF: { symbol: 'FCFA', position: 'suffix' },
  GHS: { symbol: 'GH₵', position: 'prefix' },
  ETB: { symbol: 'Br', position: 'prefix' },
  ZAR: { symbol: 'R', position: 'prefix' },
  EGP: { symbol: 'E£', position: 'prefix' },
  AED: { symbol: 'د.إ', position: 'suffix' },
  SAR: { symbol: 'ر.س', position: 'suffix' },
  INR: { symbol: '₹', position: 'prefix' },
  CAD: { symbol: 'CA$', position: 'prefix' },
  AUD: { symbol: 'A$', position: 'prefix' },
};

function formatNumber(amount: number, locale: string, decimals: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
}

/**
 * Baseline static FX rate between two currencies, derived from each
 * currency's USD-benchmarked config rate.
 *
 *   getExchangeRate('USD', 'NGN') => 1550
 *   getExchangeRate('NGN', 'KES') => 0.0935 (NGN -> KES via USD)
 *
 * These are config snapshots. Production should call `getFxQuote` (fx_quotes
 * table / live provider) for charge-time quotes.
 */
export function getExchangeRate(from: string, to: string): ExchangeRate | null {
  const fromCfg = CURRENCIES[from.toUpperCase()];
  const toCfg = CURRENCIES[to.toUpperCase()];
  if (!fromCfg || !toCfg || fromCfg.exchangeRate <= 0 || toCfg.exchangeRate <= 0) return null;
  return { from: from.toUpperCase(), to: to.toUpperCase(), rate: fromCfg.exchangeRate / toCfg.exchangeRate };
}

/** Convert an amount from one currency to another using the baseline rate. */
export function convertCurrency(amount: number, from: string, to: string): number {
  const rate = getExchangeRate(from, to);
  if (!rate) return amount;
  return amount * rate.rate;
}

/** Format an amount into a different display currency (baseline rate). */
export function formatMoneyIn(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  locale?: string,
): string {
  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  return formatMoney(converted, toCurrency, locale);
}
