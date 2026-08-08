import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatMoneySymbol,
  getCurrencyForCountry,
  isValidCurrencyCode,
  convertCurrency,
  getExchangeRate,
  getCurrencyConfig,
} from '@/lib/money';
import {
  buildMarketContext,
  resolveMarketContext,
} from '@/lib/localization/market-context';
import {
  calculateTotalPricing,
  calculateTax,
  calculateFreeEventPricing,
} from '@/lib/events/pricing';
import { getCurrencyForCountry as paymentsGetCurrencyForCountry } from '@/lib/payments/types';

const MARKET_MATRIX: Array<{ country: string; currency: string }> = [
  { country: 'MW', currency: 'MWK' },
  { country: 'ZM', currency: 'ZMW' },
  { country: 'ZW', currency: 'USD' },
  { country: 'KE', currency: 'KES' },
  { country: 'NG', currency: 'NGN' },
  { country: 'GH', currency: 'GHS' },
  { country: 'TZ', currency: 'TZS' },
  { country: 'UG', currency: 'UGX' },
  { country: 'RW', currency: 'RWF' },
  { country: 'CM', currency: 'XAF' },
  { country: 'SN', currency: 'XOF' },
  { country: 'ZA', currency: 'ZAR' },
  { country: 'ET', currency: 'ETB' },
  { country: 'EG', currency: 'EGP' },
  { country: 'US', currency: 'USD' },
  { country: 'CA', currency: 'CAD' },
  { country: 'GB', currency: 'GBP' },
  { country: 'FR', currency: 'EUR' },
  { country: 'DE', currency: 'EUR' },
  { country: 'AE', currency: 'AED' },
  { country: 'IN', currency: 'INR' },
];

describe('getCurrencyForCountry — market → currency resolution', () => {
  it.each(MARKET_MATRIX)('resolves $country → $currency', ({ country, currency }) => {
    expect(getCurrencyForCountry(country)).toBe(currency);
    expect(paymentsGetCurrencyForCountry(country)).toBe(currency);
  });

  it('never silently defaults African markets to USD', () => {
    expect(getCurrencyForCountry('MW')).not.toBe('USD');
    expect(getCurrencyForCountry('ZM')).not.toBe('USD');
    expect(getCurrencyForCountry('KE')).not.toBe('USD');
    expect(getCurrencyForCountry('NG')).not.toBe('USD');
  });

  it('falls back to USD for an unknown country code', () => {
    expect(getCurrencyForCountry('XX')).toBe('USD');
  });

  it('handles lower-case input', () => {
    expect(getCurrencyForCountry('mw')).toBe('MWK');
  });
});

describe('formatMoney — every amount carries currency context', () => {
  it('formats with ISO code, never a bare number', () => {
    expect(formatMoney(5000, 'MWK')).toBe(`MWK\u00A05,000`);
    expect(formatMoney(5500, 'NGN')).toBe(`NGN\u00A05,500`);
    expect(formatMoney(25, 'USD')).toBe(`USD\u00A025`);
  });

  it('respects decimal places from config', () => {
    expect(formatMoney(1500.5, 'ZMW')).toBe(`ZMW\u00A01,500.5`);
  });

  it('supports symbol display', () => {
    expect(formatMoneySymbol(5500, 'NGN')).toContain('₦');
    expect(formatMoneySymbol(1500.5, 'ZMW')).toContain('ZK');
  });

  it('throws-safe fallback for invalid codes', () => {
    expect(() => formatMoney(100, 'NOTACODE')).not.toThrow();
  });
});

describe('isValidCurrencyCode', () => {
  it('accepts known ISO 4217 codes', () => {
    expect(isValidCurrencyCode('MWK')).toBe(true);
    expect(isValidCurrencyCode('KES')).toBe(true);
    expect(isValidCurrencyCode('ngn')).toBe(true);
  });

  it('rejects unknown codes', () => {
    expect(isValidCurrencyCode('XYZ')).toBe(false);
    expect(isValidCurrencyCode('')).toBe(false);
  });
});

describe('FX conversion — baseline config rates', () => {
  it('returns a rate for a known pair', () => {
    const rate = getExchangeRate('USD', 'NGN');
    expect(rate).not.toBeNull();
    expect(rate!.rate).toBeGreaterThan(0);
  });

  it('converts from a base currency to a local one', () => {
    const rate = getExchangeRate('USD', 'KES');
    expect(rate).not.toBeNull();
    expect(convertCurrency(10, 'USD', 'KES')).toBeCloseTo(10 * rate!.rate, 6);
  });

  it('returns null for an unknown currency', () => {
    expect(getExchangeRate('USD', 'XYZ')).toBeNull();
  });

  it('has config entries for every market currency', () => {
    for (const { currency } of MARKET_MATRIX) {
      expect(getCurrencyConfig(currency)).toBeDefined();
    }
  });
});

describe('resolveMarketContext — header resolution order', () => {
  const ctx = (headers: Record<string, string>, explicit?: string) =>
    resolveMarketContext(new Headers(headers), explicit);

  it('prefers an explicit country code', () => {
    const c = ctx({ 'cf-ipcountry': 'US' }, 'KE');
    expect(c.countryCode).toBe('KE');
    expect(c.currencyCode).toBe('KES');
  });

  it('uses x-country-code header before IP geolocation', () => {
    const c = ctx({ 'x-country-code': 'ZM', 'cf-ipcountry': 'US' });
    expect(c.countryCode).toBe('ZM');
    expect(c.currencyCode).toBe('ZMW');
  });

  it('uses IP geolocation before Accept-Language', () => {
    const c = ctx({ 'cf-ipcountry': 'NG', 'accept-language': 'fr-FR' });
    expect(c.countryCode).toBe('NG');
    expect(c.currencyCode).toBe('NGN');
  });

  it('uses Accept-Language region when no geo header present', () => {
    const c = ctx({ 'accept-language': 'en-GB,en;q=0.9' });
    expect(c.countryCode).toBe('GB');
  });

  it('defaults to US when no signal is available', () => {
    const c = ctx({});
    expect(c.countryCode).toBe('US');
  });
});

describe('buildMarketContext', () => {
  it('carries locale, timezone and RTL for an Arabic market', () => {
    const c = buildMarketContext('EG');
    expect(c.locale).toBe('ar');
    expect(c.isRTL).toBe(true);
    expect(c.timezone).toBe('Africa/Cairo');
  });

  it('keeps the primary language of the market', () => {
    const c = buildMarketContext('AE');
    expect(c.locale).toBe('en');
    expect(c.isRTL).toBe(true);
    expect(c.timezone).toBe('Asia/Dubai');
  });

  it('resolves currency from country config', () => {
    expect(buildMarketContext('MW').currencyCode).toBe('MWK');
    expect(buildMarketContext('KE').currencyCode).toBe('KES');
  });
});

describe('events pricing — tax and currency localization', () => {
  it('no longer applies 1600%/1450% tax rates for ZM/ZW', () => {
    expect(calculateTax(100, 'ZM').rate).toBeCloseTo(0.16);
    expect(calculateTax(100, 'ZW').rate).toBeCloseTo(0.15);
    expect(calculateTax(100, 'ZM').amount).toBeCloseTo(16, 2);
  });

  it('derives currency from the event country, not a hard-coded default', () => {
    expect(calculateTotalPricing(50, 2, 'free', 'MW').currencyCode).toBe('MWK');
    expect(calculateTotalPricing(50, 2, 'free', 'NG').currencyCode).toBe('NGN');
    expect(calculateTotalPricing(50, 2, 'free', 'US').currencyCode).toBe('USD');
  });

  it('free events also carry a market currency', () => {
    expect(calculateFreeEventPricing(3, 'KE').currencyCode).toBe('KES');
    expect(calculateFreeEventPricing(3).currencyCode).toBe('USD');
  });

  it('tax is computed on the discounted subtotal', () => {
    const p = calculateTotalPricing(100, 1, 'free', 'NG', 'card', {
      discountType: 'percent',
      discountValue: 10,
    });
    expect(p.tax.amount).toBeCloseTo(90 * 0.075, 2);
  });
});

describe('payment validation — market-derived currency', () => {
  it('payment types currency resolution delegates to the shared service', () => {
    expect(paymentsGetCurrencyForCountry('MW')).toBe('MWK');
    expect(paymentsGetCurrencyForCountry('XX')).toBe('USD');
  });
});
