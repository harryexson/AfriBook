import { createAdminClient } from '@/lib/supabase/admin';
import { getMethodsForCountry, getProvidersForCountry } from './types';

/**
 * Runtime payment-capability lookups backed by the `payment_provider_capabilities`
 * table (migration 015). The table is admin-editable without a code deploy and
 * becomes authoritative once populated; until then (or on any DB failure) the
 * static maps in `payments/types.ts` remain the source of truth, so enabling
 * this layer is safe — it can only narrow, never widen, what the static maps
 * allow.
 */

export interface ProviderCapability {
  provider_code: string;
  country_code: string | null;
  method: string;
  currency_codes: string[];
  processor_fee_percent: number;
  processor_fee_fixed: number;
  is_active: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let capabilityCache: ProviderCapability[] | null = null;
let cacheTimestamp = 0;

/**
 * Active capability rows for a market.
 *
 * Returns `null` when the table is empty, unreadable, or errored — callers
 * should fall back to the static maps. Returns `[]` when the table is
 * populated but nothing is active for the market — callers should treat that
 * as an explicit denial and NOT fall back.
 */
export async function getProviderCapabilities(
  countryCode: string,
): Promise<ProviderCapability[] | null> {
  try {
    const now = Date.now();
    if (!capabilityCache || now - cacheTimestamp > CACHE_TTL_MS) {
      const sb = createAdminClient();
      const { data, error } = await sb
        .from('payment_provider_capabilities')
        .select('*');
      if (error || !data || data.length === 0) return null;
      capabilityCache = data as ProviderCapability[];
      cacheTimestamp = now;
    }

    const cc = countryCode.toUpperCase();
    return capabilityCache.filter(
      (c) =>
        c.is_active &&
        (c.country_code === null || c.country_code.toUpperCase() === cc),
    );
  } catch {
    return null;
  }
}

/** Providers able to charge in a market (runtime table, else static map). */
export async function getAvailableProviders(
  countryCode: string,
): Promise<string[]> {
  const caps = await getProviderCapabilities(countryCode);
  if (caps === null) return getProvidersForCountry(countryCode);
  return [...new Set(caps.map((c) => c.provider_code))];
}

/**
 * Validate a payment method is chargeable in a market. Static maps are the
 * baseline; a populated runtime table must agree (and may further narrow or
 * disable a method).
 */
export async function isMethodAvailableForCountry(
  countryCode: string,
  method: string,
): Promise<boolean> {
  const m = method.toLowerCase();
  const staticMethods = getMethodsForCountry(countryCode);
  if (!staticMethods.some((s) => s.toLowerCase() === m)) return false;

  const caps = await getProviderCapabilities(countryCode);
  if (caps === null) return true;
  return caps.some((c) => c.method.toLowerCase() === m);
}

/** Test support: clears the module-level cache. */
export function resetCapabilityCache(): void {
  capabilityCache = null;
  cacheTimestamp = 0;
}
