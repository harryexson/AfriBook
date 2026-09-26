/**
 * Global market persistence regression tests.
 *
 * Covers the core localization failures that caused Malawi/Kenya/etc.
 * selections to silently revert to US/USD:
 *
 *  1. Explicit selection wins over the URL path segment (the prime bug:
 *     selecting MW in-place while on /us/... used to keep resolving US).
 *  2. Navigation does not re-resolve or reset the market.
 *  3. A persisted selection survives a fresh mount (refresh / new tab) and
 *     outranks the URL segment.
 *  4. Currency follows country across market switches with no stale USD.
 *  5. Legacy lowercase proxy cookies are read and normalized to uppercase.
 *  6. GPS-derived currentLocation never writes the market-selection cookie
 *     or overwrites an explicit selection.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import {
  CountryProvider,
  useCountry,
  getMarketState,
  __resetMarketStoreForTests,
} from '@/components/shared/CountryProvider';
import { storeLocation, getCountryFromCookie } from '@/lib/geo';

// Mutable pathname controlled per test to simulate navigation.
let currentPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

// Captures setCountry from context on every mount.
const setterRef: {
  current: ((code: string, opts?: { navigate?: boolean; city?: string }) => void) | null;
} = { current: null };

function MarketProbe() {
  const { countryCode, currencyCode, city, marketSource, setCountry } = useCountry();
  setterRef.current = setCountry;
  return (
    <span
      data-testid="market"
      data-country={countryCode}
      data-currency={currencyCode}
      data-city={city}
      data-source={marketSource}
    />
  );
}

function flush(): void {
  act(() => {});
}

function mount(): { probe: () => HTMLElement; root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <CountryProvider>
        <MarketProbe />
      </CountryProvider>,
    );
  });
  return {
    container,
    root,
    probe: () => container.querySelector('[data-testid="market"]') as HTMLElement,
  };
}

function assertMarket(el: HTMLElement, country: string, currency: string): void {
  expect(el.dataset.country).toBe(country);
  expect(el.dataset.currency).toBe(currency);
}

describe('GlobalMarketContext', () => {
  beforeEach(() => {
    __resetMarketStoreForTests();
    localStorage.clear();
    document.cookie = 'country=; Max-Age=0; path=/';
    currentPathname = '/';
    setterRef.current = null;
  });

  afterEach(() => {
    localStorage.clear();
    document.cookie = 'country=; Max-Age=0; path=/';
    vi.restoreAllMocks();
  });

  it('explicit selection beats the URL segment and persists across navigation', () => {
    // User is on a /us/... route but explicitly selects Malawi in-place.
    currentPathname = '/us/hotels';
    const { probe, root } = mount();

    // Pre-init snapshot matches SSR (URL-derived): /us/hotels → US.
    assertMarket(probe(), 'US', 'USD');

    // Init effect adopts saved preference if any — none here, so URL applies.
    flush();

    // User explicitly selects Malawi/Lilongwe (in-place, no navigation).
    act(() => {
      setterRef.current?.('MW', { city: 'Lilongwe', navigate: false });
    });
    assertMarket(probe(), 'MW', 'MWK');
    expect(probe().dataset.city).toBe('Lilongwe');

    // Navigate across every marketplace module — market must NOT revert.
    const routes = [
      '/us',
      '/us/hotels',
      '/us/restaurants',
      '/us/services',
      '/us/products',
      '/us/events',
      '/us/rides',
      '/us/delivery',
    ];
    for (const path of routes) {
      currentPathname = path;
      flush(); // re-render triggered by pathname change ("navigation")
      assertMarket(probe(), 'MW', 'MWK');
    }

    root.unmount();
  });

  it('persisted selection survives a fresh mount and outranks the URL', () => {
    // Previous session selected Zambia.
    localStorage.setItem('afribook-country', 'ZM');
    document.cookie = 'country=ZM; path=/';

    // New page load deep-links straight into a /us/... route.
    currentPathname = '/us/restaurants';
    const { probe, root } = mount();

    flush(); // init effect runs once post-mount
    assertMarket(probe(), 'ZM', 'ZMW');

    root.unmount();
  });

  it('legacy lowercase proxy cookies are read and normalized', () => {
    document.cookie = 'country=mw; path=/'; // old proxy wrote lowercase

    currentPathname = '/search';
    const { probe, root } = mount();

    flush();
    assertMarket(probe(), 'MW', 'MWK');
    expect(getMarketState().countryCode).toBe('MW');

    root.unmount();
  });

  it('currency follows every market switch with no stale prices', () => {
    localStorage.setItem('afribook-country', 'NG');
    document.cookie = 'country=NG; path=/';
    currentPathname = '/ng';
    const { probe, root } = mount();
    flush();

    const switches: Array<[string, string]> = [
      ['MW', 'MWK'],
      ['KE', 'KES'],
      ['ZM', 'ZMW'],
      ['ZA', 'ZAR'],
      ['NG', 'NGN'],
      ['TZ', 'TZS'],
      ['RW', 'RWF'],
      ['GH', 'GHS'],
    ];

    for (const [code, currency] of switches) {
      act(() => {
        setterRef.current?.(code, { navigate: false });
      });
      assertMarket(probe(), code, currency);
      // The resolved currency must equal the freshly selected country's
      // currency — no carry-over from the previous market.
      expect(getMarketState().countryCode).toBe(code);
    }

    root.unmount();
  });

  it('selection writes uppercase cookie + storage and survives refresh', () => {
    localStorage.setItem('afribook-country', 'KE');
    document.cookie = 'country=KE; path=/';
    currentPathname = '/ke';
    const { probe, root } = mount();
    flush();

    act(() => {
      setterRef.current?.('BW', { navigate: false });
    });

    assertMarket(probe(), 'BW', 'BWP');
    expect(localStorage.getItem('afribook-country')).toBe('BW');
    expect(document.cookie).toContain('country=BW');

    // Simulate browser refresh: brand-new provider instance reads persisted
    // state and must land on BW again.
    root.unmount();
    __resetMarketStoreForTests();

    const second = mount();
    flush();
    assertMarket(second.probe(), 'BW', 'BWP');
    second.root.unmount();
  });

  it('SSR snapshot is stable and storage-free (no hydration flash)', () => {
    localStorage.setItem('afribook-country', 'ZA');
    currentPathname = '/us/products';
    const markup = renderToStaticMarkup(
      <CountryProvider>
        <MarketProbe />
      </CountryProvider>,
    );
    // Server render uses the URL segment only — no storage access, so SSR
    // and first hydration paint agree before the init effect runs.
    expect(markup).toContain('data-country="US"');
    expect(markup).toContain('data-currency="USD"');
  });

  it('GPS currentLocation never overwrites an explicit selection', () => {
    localStorage.setItem('afribook-country', 'MW');
    document.cookie = 'country=MW; path=/';
    currentPathname = '/mw';
    const { probe, root } = mount();
    flush();
    assertMarket(probe(), 'MW', 'MWK');

    // User physically located in Chicago, USA — GPS records currentLocation.
    act(() => {
      storeLocation({
        latitude: 41.8781,
        longitude: -87.6298,
        countryCode: 'US',
        city: 'Chicago',
        state: 'Illinois',
        displayName: 'Chicago, IL, USA',
        timestamp: Date.now(),
      });
    });

    // The stored location keeps its own country...
    expect(JSON.parse(localStorage.getItem('afribook-location')!).countryCode).toBe('US');
    // ...but the selected market stays Malawi, and geolocation never touched
    // the market-selection cookie (geo.ts no longer writes it).
    assertMarket(probe(), 'MW', 'MWK');
    expect(getCountryFromCookie()).toBe('MW');

    root.unmount();
  });
});
