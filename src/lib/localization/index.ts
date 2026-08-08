import { COUNTRIES } from './countries';
import { CURRENCIES } from './currencies';
import { LANGUAGES } from './languages';
import { TRANSLATIONS, type Translations } from './translations';
import {
  getPPPConfig,
  usdToLocal,
  getMinimumFeeFloor,
  getLocalizedSubscriptionPrices,
  getPlatformCommission,
  getAvailablePPPCountries,
  convertDistance,
} from './ppp';
import {
  formatMoney,
  formatMoneySymbol,
  getCurrencyForCountry,
  convertCurrency,
  getExchangeRate,
  isValidCurrencyCode,
} from '../money';

export { COUNTRIES, CURRENCIES, LANGUAGES, TRANSLATIONS };
export {
  getPPPConfig,
  usdToLocal,
  getMinimumFeeFloor,
  getLocalizedSubscriptionPrices,
  getPlatformCommission,
  getAvailablePPPCountries,
  convertDistance,
};
export {
  formatMoney,
  formatMoneySymbol,
  getCurrencyForCountry,
  convertCurrency,
  getExchangeRate,
  isValidCurrencyCode,
};
export type { ExchangeRate } from '../money';
export type { PPPConfig } from './ppp';
export type { CountryConfig, PaymentMethodConfig } from './countries';
export type { CurrencyConfig } from './currencies';
export type { LanguageConfig } from './languages';
export type { Translations } from './translations';

export function getCountryConfig(code: string) {
  return COUNTRIES[code];
}

export function getCurrencyConfig(code: string) {
  return CURRENCIES[code];
}

export function getLanguageConfig(code: string) {
  return LANGUAGES[code];
}

/** Convenience: resolve the ISO 4217 currency for a country code. */
export function getCountryCurrency(countryCode: string): string {
  return getCurrencyForCountry(countryCode);
}

export function getLocaleFromCountry(countryCode: string): string {
  const country = COUNTRIES[countryCode];
  return country?.language?.code ?? 'en';
}

export function getTranslation(
  locale: string,
  module: keyof Translations,
  key: string,
  fallback?: string
): string {
  const translations = TRANSLATIONS[locale];
  if (!translations) return fallback ?? key;
  const mod = translations[module];
  if (!mod) return fallback ?? key;
  return (mod as Record<string, string>)[key] ?? fallback ?? key;
}

export function formatPrice(
  amount: number,
  currencyCode: string,
  locale?: string
): string {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `${amount}`;
  const dec = currency.decimalPlaces;
  const fixed = amount.toFixed(dec);
  const { symbol, format } = currency;
  const formatted = format === 'amount symbol' ? `${fixed} ${symbol}` : `${symbol}${fixed}`;
  if (locale === 'ar' || locale === 'ae' || locale === 'eg') {
    return `\u200F${formatted}`;
  }
  return formatted;
}

export function getCountryFromLocale(locale: string): string | undefined {
  for (const [code, country] of Object.entries(COUNTRIES)) {
    if (country.language.code === locale || country.subdomain === locale) return code;
  }
  return undefined;
}