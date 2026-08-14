import { NextRequest } from 'next/server';
import { COUNTRIES, getLocaleFromCountry } from './index';
import { getCurrencyForCountry } from '../money';

/**
 * MarketContext service — single server-side source of truth for resolving a
 * request's market: country, currency, locale, timezone, RTL and enabled
 * verticals. Used by API routes, middleware and server components so that
 * every market decision reads from one resolver instead of scattered
 * pathname/cookie/IP parsing.
 *
 * Resolution order (first match wins):
 *   1. Explicit `countryCode` (path segment, query, or header)
 *   2. `afribook-country` cookie / `x-country-code` header
 *   3. Cloudflare `cf-ipcountry` (IP geolocation)
 *   4. Vercel `x-vercel-ip-country`
 *   5. `Accept-Language` (weakest signal, maps to supported market)
 *   6. Default market (NG — never silently assumes the United States)
 */

export interface MarketContext {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  locale: string;
  timezone: string;
  isRTL: boolean;
  phoneFormat: string;
  /** Verticals enabled in this market from the country config. */
  categories: string[];
}

export const DEFAULT_COUNTRY = 'NG';

/** All countries with a full config (upper-case code → name). */
export const SUPPORTED_COUNTRIES: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRIES).map(([code, country]) => [code, country.name]),
);

function normalize(code: string | undefined | null): string | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  return c.length === 2 ? c : null;
}

function countryFromLanguage(lang: string | null): string | null {
  if (!lang) return null;
  // Accept-Language e.g. "en-NG,en;q=0.9,fr;q=0.8"
  const [primary] = lang.split(',');
  const [tag] = primary.split(';');
  const [langCode, region] = tag.trim().split('-');
  if (region && COUNTRIES[region.toUpperCase()]) return region.toUpperCase();
  // Language-only match (e.g. "fr" → FR, "ar" → EG, "sw" → KE)
  const byLang: Record<string, string> = { fr: 'FR', de: 'DE', ar: 'EG', es: 'ES', sw: 'KE', hi: 'IN', en: 'NG' };
  return byLang[langCode] ?? null;
}

export function resolveMarketContext(req: NextRequest | Headers, explicitCountry?: string): MarketContext {
  const headers = req instanceof Headers ? req : req.headers;
  const get = (name: string) => headers.get(name);

  const candidate =
    normalize(explicitCountry) ??
    normalize(get('x-country-code')) ??
    normalize(get('afribook-country')) ??
    normalize(get('cf-ipcountry')) ??
    normalize(get('x-vercel-ip-country')) ??
    countryFromLanguage(get('accept-language'));

  const countryCode = candidate ?? DEFAULT_COUNTRY;
  return buildMarketContext(countryCode);
}

export function buildMarketContext(countryCode: string): MarketContext {
  const cc = normalize(countryCode) ?? DEFAULT_COUNTRY;
  const country = COUNTRIES[cc];
  const currencyCode = getCurrencyForCountry(cc);

  return {
    countryCode: cc,
    countryName: country?.name ?? cc,
    currencyCode,
    locale: country?.language?.code ? getLocaleFromCountry(cc) : 'en',
    timezone: country?.timezone ?? 'UTC',
    isRTL: country?.isRTL ?? false,
    phoneFormat: country?.phoneFormat ?? '',
    categories: country?.categories ?? [],
  };
}

/** Client-safe variant that carries no server-only headers. */
export function buildMarketContextFromCountry(countryCode: string): MarketContext {
  return buildMarketContext(countryCode);
}
