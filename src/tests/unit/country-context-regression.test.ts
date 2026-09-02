/**
 * Regression tests for the two country-context bugs found while auditing
 * why the header/footer country selector didn't propagate to Hotels,
 * Restaurants and Rides pricing (see design-system audit notes / commit
 * history around CountryProvider.tsx, destination-store.ts and proxy.ts).
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

describe('destination-store — country is not a second source of truth', () => {
  it('the Destination shape has no countryCode field', async () => {
    const { useDestinationStore } = await import('@/stores/destination-store');
    const state = useDestinationStore.getState().destination;
    expect(state).not.toHaveProperty('countryCode');
    expect(Object.keys(state).sort()).toEqual(['address', 'city', 'neighborhood']);
  });
});

describe('proxy middleware — country cookie case handling', () => {
  // Before the fix, COUNTRY_CODES here was lowercased while
  // CountryProvider (client) always wrote the cookie uppercase
  // (`code.toUpperCase()`). isValid() did a case-sensitive
  // Array.includes check, so a client-set 'MW' cookie was treated as
  // unrecognized and silently rewritten to the server-detected default
  // on the very next request — meaning a country picked in the
  // header/footer reverted the moment the page reloaded.
  const req = (cookieValue: string, pathname = '/api/probe') =>
    new NextRequest(`http://localhost:3000${pathname}`, {
      headers: { cookie: `country=${cookieValue}` },
    });

  it('preserves an uppercase client-set country cookie (does not revert it)', async () => {
    const res = await proxy(req('MW'));
    // No Set-Cookie means the middleware considered the existing cookie
    // valid and left it alone — which is the fix under test. Before the
    // fix this would be non-null and reset the value back to 'NG'.
    const setCookie = res.cookies.get('country');
    expect(setCookie === undefined || setCookie.value === 'MW').toBe(true);
  });

  it('still normalizes a legacy lowercase cookie without erroring', async () => {
    const res = await proxy(req('mw'));
    // Either left as a recognized market or normalized — must not throw,
    // and must not silently fall back to NG for a valid market code.
    const setCookie = res.cookies.get('country');
    const effective = setCookie?.value ?? 'MW';
    expect(effective.toUpperCase()).toBe('MW');
  });

  it('falls back to NG (uppercase) for a request with no country signal at all', async () => {
    const res = await proxy(
      new NextRequest('http://localhost:3000/api/probe'),
    );
    expect(res.headers.get('X-Detected-Country')).toBe('NG');
  });
});
