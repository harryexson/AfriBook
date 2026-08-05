/**
 * Server-side rendering behavior of <InlineScript> (theme preload).
 *
 * On the server the script MUST be emitted as a real `text/javascript`
 * block so the browser executes it during HTML parsing, before first paint,
 * to prevent a flash of the wrong theme.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InlineScript } from '@/components/shared/InlineScript';

const THEME_PRELOAD_HTML =
  "(function(){try{var t=localStorage.getItem('afribook-ui');if(t){var p=JSON.parse(t);if(p.state.theme==='dark'||(p.state.theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}}catch(e){}})()";

describe('InlineScript (theme preload) server-side rendering', () => {
  it('emits an executable text/javascript script block on the server', () => {
    const markup = renderToStaticMarkup(
      <InlineScript html={THEME_PRELOAD_HTML} />,
    );
    expect(markup).toContain('<script type="text/javascript"');
    expect(markup).toContain("localStorage.getItem('afribook-ui')");
    expect(markup).toContain('classList.add');
  });

  it('renders exactly one script element', () => {
    const markup = renderToStaticMarkup(<InlineScript html="void 0" />);
    const count = (markup.match(/<script/g) ?? []).length;
    expect(count).toBe(1);
  });
});
