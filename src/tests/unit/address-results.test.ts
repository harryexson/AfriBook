import { describe, expect, it } from 'vitest';
import { photonResults } from '@/lib/address-results';
import { locationErrorMessage } from '@/lib/geo';
describe('address results', () => {
  it('preserves GeoJSON longitude/latitude order and builds a usable address', () => {
    const [place] = photonResults({ features: [{ geometry: { coordinates: [33.78, -13.96] }, properties: { name: 'City Mall', city: 'Lilongwe', country: 'Malawi', countrycode: 'mw' } }] });
    expect(place).toMatchObject({ latitude: -13.96, longitude: 33.78, countryCode: 'MW', displayName: 'City Mall, Lilongwe, Malawi' });
  });
  it('drops invalid results instead of inventing coordinates', () => {
    expect(photonResults({ features: [{ geometry: { coordinates: [999, 999] } }, { geometry: { coordinates: [0, 0] } }] })).toEqual([]);
  });
  it('gives distinct recovery guidance for permission, positioning and timeout failures', () => {
    expect(locationErrorMessage({ code: 1 })).toContain('browser settings');
    expect(locationErrorMessage({ code: 2 })).toContain('location services');
    expect(locationErrorMessage({ code: 3 })).toContain('timed out');
  });
});
