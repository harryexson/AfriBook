/**
 * Regression test for the hydration mismatch in <CountryProvider>:
 *
 * The country is derived from the URL path segment plus client-only storage
 * (cookie + localStorage). Before this fix, `useSyncExternalStore` passed the
 * same snapshot function as both the live snapshot and the server snapshot.
 * The server (no document/window) fell back to `NG`, while the client read
 * the user's saved country (e.g. `US`) from localStorage during hydration —
 * so SSR and hydration disagreed, React regenerated the tree, and the inline
 * theme <script> in the root layout was re-created client-side (triggering the
 * "Encountered a script tag" warning).
 *
 * The fix supplies a dedicated `getServerSnapshot` that derives the country
 * purely from the URL (no browser storage), so SSR and hydration always match.
 * After hydration React swaps to the live snapshot and picks up the saved
 * country without error.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  CountryProvider,
  useCountry,
} from '@/components/shared/CountryProvider';

vi.mock('next/navigation', () => ({
  usePathname: () => '/search',
}));

function CountryProbe() {
  const { countryCode } = useCountry();
  return <span data-testid="country-code">{countryCode}</span>;
}

describe('CountryProvider hydration consistency', () => {
  beforeEach(() => {
    localStorage.setItem('afribook-country', 'US');
    document.cookie = 'country=US; path=/';
  });

  afterEach(() => {
    localStorage.clear();
    document.cookie = 'country=; Max-Age=0';
    vi.restoreAllMocks();
  });

  it('server snapshot ignores browser storage so SSR and hydration agree', () => {
    // Simulated server render: only the URL segment is available, storage is
    // deliberately different (US) to prove getServerSnapshot ignores it.
    const markup = renderToStaticMarkup(
      <CountryProvider>
        <CountryProbe />
      </CountryProvider>,
    );
    expect(markup).toContain('>NG<');
  });

  it('hydrates without a mismatch and then adopts the stored country', async () => {
    const markup = renderToStaticMarkup(
      <CountryProvider>
        <CountryProbe />
      </CountryProvider>,
    );

    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.appendChild(container);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const root = hydrateRoot(
      container,
      <CountryProvider>
        <CountryProbe />
      </CountryProvider>,
    );

    // Wait for the post-hydration passive effect that swaps to the live
    // snapshot (which reads localStorage -> US). React's scheduler flushes
    // passive effects asynchronously, so give it a couple of macrotasks.
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
    }

    const hydrationFailed = errorSpy.mock.calls.some((call) =>
      String(call[0]).includes('Hydration failed'),
    );
    expect(hydrationFailed).toBe(false);

    const node = container.querySelector('[data-testid="country-code"]');
    expect(node?.textContent).toBe('US');

    root.unmount();
    document.body.removeChild(container);
  });
});
