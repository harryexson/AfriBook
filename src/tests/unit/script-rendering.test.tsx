/**
 * Regression test for the React 19 dev warning:
 * "Encountered a script tag while rendering React component..."
 *
 * React's client renderer only suppresses this warning when the <script>
 * element carries a non-JavaScript `type` (a "script data block", e.g.
 * text/plain, application/ld+json). This matches the documented Next.js
 * approach in `preventing-flash-before-hydration.md`, implemented by the
 * shared <InlineScript> component used by the theme preload script in
 * `src/app/layout.tsx`.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { InlineScript } from '@/components/shared/InlineScript';

const SCRIPT_TAG_WARNING =
  'Encountered a script tag while rendering React component';

const THEME_PRELOAD_HTML =
  "(function(){try{var t=localStorage.getItem('afribook-ui');if(t){var p=JSON.parse(t);if(p.state.theme==='dark'||(p.state.theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}}catch(e){}})()";

async function render(node: React.ReactNode): Promise<Root> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(node);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  return root;
}

function warnedAboutScripts(spy: ReturnType<typeof vi.spyOn>): boolean {
  return spy.mock.calls.some((call) =>
    String(call[0]).includes(SCRIPT_TAG_WARNING),
  );
}

describe('InlineScript (theme preload) client-side rendering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('renders the script as a non-executable data block on the client', async () => {
    const root = await render(<InlineScript html={THEME_PRELOAD_HTML} />);
    const script = document.querySelector('script');
    expect(script).not.toBeNull();
    // text/plain is the invariant that prevents React's client renderer
    // from warning about / trying to re-execute the script during hydration.
    expect(script!.getAttribute('type')).toBe('text/plain');
    root.unmount();
  });

  it('never emits the React script-tag rendering warning', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = await render(<InlineScript html={THEME_PRELOAD_HTML} />);
    root.unmount();
    expect(warnedAboutScripts(spy)).toBe(false);
  });

  it('preserves the preload code for the browser to execute', async () => {
    const root = await render(<InlineScript html={THEME_PRELOAD_HTML} />);
    const script = document.querySelector('script');
    expect(script?.textContent).toContain("localStorage.getItem('afribook-ui')");
    root.unmount();
  });
});
