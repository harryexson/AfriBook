import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('@/lib/neon/admin', () => ({
  query: mockQuery,
}));

import {
  getProviderCapabilities,
  getAvailableProviders,
  isMethodAvailableForCountry,
  resetCapabilityCache,
} from '@/lib/payments/capabilities';

describe('payment capabilities (runtime table)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCapabilityCache();
  });

  it('falls back to the static provider map when the table is empty', async () => {
    mockQuery.mockResolvedValue([]);
    const providers = await getAvailableProviders('MW');
    expect(providers).toContain('paychangu');
    expect(providers).toContain('pawapay');
  });

  it('falls back to static methods when the table is empty', async () => {
    mockQuery.mockResolvedValue([]);
    expect(await isMethodAvailableForCountry('MW', 'mtn_mobile_money')).toBe(true);
    expect(await isMethodAvailableForCountry('MW', 'paypal')).toBe(false);
  });

  it('falls back to static maps on a DB error', async () => {
    mockQuery.mockRejectedValue(new Error('boom'));
    expect(await isMethodAvailableForCountry('NG', 'ussd')).toBe(true);
    expect(await getAvailableProviders('KE')).toContain('mpesa');
  });

  it('returns null (fallback signal) when the query throws', async () => {
    mockQuery.mockRejectedValue(new Error('network'));
    expect(await getProviderCapabilities('US')).toBeNull();
    expect(await getAvailableProviders('US')).toEqual(['stripe', 'airwallex', 'adyen']);
  });

  it('narrows providers to what the runtime table allows', async () => {
    mockQuery.mockResolvedValue([
      { provider_code: 'pawapay', country_code: 'MW', method: 'mobile_money', currency_codes: ['MWK'], is_active: true },
      { provider_code: 'pawapay', country_code: 'MW', method: 'card', currency_codes: ['MWK'], is_active: true },
    ]);
    const providers = await getAvailableProviders('MW');
    expect(providers).toEqual(['pawapay']);
    expect(providers).not.toContain('paychangu');
  });

  it('validates a method against the runtime table', async () => {
    mockQuery.mockResolvedValue([
      { provider_code: 'pawapay', country_code: 'MW', method: 'mobile_money', currency_codes: ['MWK'], is_active: true },
      { provider_code: 'paychangu', country_code: 'MW', method: 'card', currency_codes: ['MWK'], is_active: true },
    ]);
    expect(await isMethodAvailableForCountry('MW', 'mobile_money')).toBe(true);
    expect(await isMethodAvailableForCountry('MW', 'card')).toBe(true);
    expect(await isMethodAvailableForCountry('MW', 'mtn_mobile_money')).toBe(false);
  });

  it('ignores inactive rows — a fully disabled market is an explicit denial, no fallback', async () => {
    mockQuery.mockResolvedValue([
      { provider_code: 'paychangu', country_code: 'MW', method: 'card', currency_codes: ['MWK'], is_active: false },
    ]);
    expect(await getProviderCapabilities('MW')).toEqual([]);
    expect(await getAvailableProviders('MW')).toEqual([]);
    expect(await isMethodAvailableForCountry('MW', 'card')).toBe(false);
    expect(await isMethodAvailableForCountry('MW', 'mobile_money')).toBe(false);
  });

  it('static maps remain the baseline — a method absent statically stays blocked', async () => {
    mockQuery.mockResolvedValue([
      { provider_code: 'stripe', country_code: 'XX', method: 'paypal', currency_codes: ['USD'], is_active: true },
    ]);
    expect(await isMethodAvailableForCountry('XX', 'paypal')).toBe(false);
  });
});
