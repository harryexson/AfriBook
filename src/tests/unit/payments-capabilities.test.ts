import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: mockSelect,
    }),
  }),
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
    mockSelect.mockResolvedValue({ data: [], error: null });
    const providers = await getAvailableProviders('MW');
    expect(providers).toContain('paychangu');
    expect(providers).toContain('pawapay');
  });

  it('falls back to static methods when the table is empty', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    expect(await isMethodAvailableForCountry('MW', 'mtn_mobile_money')).toBe(true);
    expect(await isMethodAvailableForCountry('MW', 'paypal')).toBe(false);
  });

  it('falls back to static maps on a DB error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await isMethodAvailableForCountry('NG', 'ussd')).toBe(true);
    expect(await getAvailableProviders('KE')).toContain('mpesa');
  });

  it('returns null (fallback signal) when the query throws', async () => {
    mockSelect.mockRejectedValue(new Error('network'));
    expect(await getProviderCapabilities('US')).toBeNull();
    expect(await getAvailableProviders('US')).toEqual(['stripe', 'airwallex', 'adyen']);
  });

  it('narrows providers to what the runtime table allows', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { provider_code: 'pawapay', country_code: 'MW', method: 'mobile_money', currency_codes: ['MWK'], is_active: true },
        { provider_code: 'pawapay', country_code: 'MW', method: 'card', currency_codes: ['MWK'], is_active: true },
      ],
      error: null,
    });
    const providers = await getAvailableProviders('MW');
    expect(providers).toEqual(['pawapay']);
    expect(providers).not.toContain('paychangu');
  });

  it('validates a method against the runtime table', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { provider_code: 'pawapay', country_code: 'MW', method: 'mobile_money', currency_codes: ['MWK'], is_active: true },
        { provider_code: 'paychangu', country_code: 'MW', method: 'card', currency_codes: ['MWK'], is_active: true },
      ],
      error: null,
    });
    expect(await isMethodAvailableForCountry('MW', 'mobile_money')).toBe(true);
    expect(await isMethodAvailableForCountry('MW', 'card')).toBe(true);
    expect(await isMethodAvailableForCountry('MW', 'mtn_mobile_money')).toBe(false);
  });

  it('ignores inactive rows — a fully disabled market is an explicit denial, no fallback', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { provider_code: 'paychangu', country_code: 'MW', method: 'card', currency_codes: ['MWK'], is_active: false },
      ],
      error: null,
    });
    expect(await getProviderCapabilities('MW')).toEqual([]);
    expect(await getAvailableProviders('MW')).toEqual([]);
    expect(await isMethodAvailableForCountry('MW', 'card')).toBe(false);
    expect(await isMethodAvailableForCountry('MW', 'mobile_money')).toBe(false);
  });

  it('static maps remain the baseline — a method absent statically stays blocked', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { provider_code: 'stripe', country_code: 'XX', method: 'paypal', currency_codes: ['USD'], is_active: true },
      ],
      error: null,
    });
    expect(await isMethodAvailableForCountry('XX', 'paypal')).toBe(false);
  });
});
