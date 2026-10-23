import { describe, it, expect } from 'vitest';
import { PAWAPAY_MARKETS, PAWAPAY_CORRESPONDENTS } from '@/lib/payments/pawapay-operators';
import { COUNTRY_PROVIDER_MAP } from '@/lib/payments/types';

const EXPECTED_MARKETS = [
  'BJ', 'BF', 'CM', 'GH', 'CI', 'LR', 'ML', 'NG', 'SN', 'SL', 'CG', 'CD',
  'GA', 'LS', 'MW', 'MZ', 'ZM', 'ET', 'KE', 'RW', 'SS', 'TZ', 'UG',
];

describe('PawaPay market coverage', () => {
  it('lists the 23 markets supplied for this platform', () => {
    expect(PAWAPAY_MARKETS.map((m) => m.country).sort()).toEqual([...EXPECTED_MARKETS].sort());
  });

  it('only sends correspondents for countries on the supplied list', () => {
    const listed = new Set(PAWAPAY_MARKETS.map((m) => m.country));
    for (const country of Object.keys(PAWAPAY_CORRESPONDENTS)) {
      expect(listed.has(country)).toBe(true);
    }
  });

  it('never routes PawaPay to a country the adapter cannot serve', () => {
    for (const [country, providers] of Object.entries(COUNTRY_PROVIDER_MAP)) {
      if (providers.includes('pawapay')) {
        expect(PAWAPAY_CORRESPONDENTS[country], `pawapay routed to ${country} without a correspondent`).toBeDefined();
      }
    }
  });

  it('does not route PawaPay to South Africa, Egypt, or Malawi', () => {
    expect(COUNTRY_PROVIDER_MAP.ZA).not.toContain('pawapay');
    expect(COUNTRY_PROVIDER_MAP.EG).not.toContain('pawapay');
    expect(COUNTRY_PROVIDER_MAP.MW).not.toContain('pawapay');
  });

  it('does not route PayChangu to Egypt', () => {
    expect(COUNTRY_PROVIDER_MAP.EG).not.toContain('paychangu');
  });
});
