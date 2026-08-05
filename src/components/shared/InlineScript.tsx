/**
 * Renders an inline <script> that is safe for React 19 hydration.
 *
 * React's client renderer warns — and will not re-execute — any <script>
 * it creates through React. To render an inline script that must run
 * during HTML parsing (e.g. theme preload to prevent FOUC), the element
 * is emitted as `text/javascript` on the server so the browser executes it
 * as it parses the HTML, and as `text/plain` on the client so React treats
 * it as a non-executable "script data block" and does not warn or attempt
 * to execute it. `suppressHydrationWarning` reconciles the type mismatch.
 *
 * See Next.js docs: "preventing-flash-before-hydration.md".
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
