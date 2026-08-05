# Script-Tag Rendering Error — Root Cause Analysis

**Error:** `Encountered a script tag while rendering React component` (recurring, at `RootLayout`, `src/app/layout.tsx`). Seen under Next.js 16.2.10 + Turbopack.

---

## 1. Symptom

- Dev-server browser console shows:
  ```
  Encountered a script tag while rendering React component.
  Script tags inside rendered React components are never executed when rendering
  on the client. Consider using template tag instead:
  https://react.dev/reference/react-dom/components/common#dangerously-set-inner-html
  at script (<anonymous>)
  at RootLayout (...ssr...)
  ```
- Stack frame `about://React/Server/...ssr...` is Turbopack's module label for the SSR chunk that contains the Server Component body — it does **not** mean the warning fired server-side.

## 2. Root cause

React 19's client renderer will not run a `<script>` element produced during render/hydration **unless it is a "script data block"**. This is enforced in Next's vendored React:

- `node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:23647` — `isScriptDataBlock(props)`.
- A script is treated as a data block (warning suppressed, element created in the tree) only when `type` is one of: `module`, `importmap`, `speculationrules`, **or any non-JS MIME type** (`text/plain`, `application/ld+json`, …).
- Otherwise the dev build emits the warning above and **never executes the script** — so the dark-mode preload was silently dead in addition to spamming the console.

Why the layout: `src/app/layout.tsx` renders a small theme preload script in `<head>`:

```js
localStorage.getItem('afribook-ui') → apply .dark class
```

The original implementation used `next/script`; the `next/script` component's RSC representation and the server-injected head position can diverge, forcing the client to **create** a script element during head reconciliation → the createElement path → warning. The follow-up raw `<script>` variant still failed because plain (typeless) scripts are not data blocks.

## 3. Fix (implemented)

Adopted Next.js's documented pattern (`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`):

1. **Server render:** emit `type="text/javascript"`. The browser executes it during HTML parsing → theme applied before first paint (no FOUC, no extra network round-trip).
2. **Client render:** emit `type="text/plain"`. Hydration sees a script data block → no warning, no re-execution.
3. `suppressHydrationWarning` on the script element — the type attribute intentionally differs between server and client HTML; this is the expected and documented part of the pattern. Scope is limited to this one element.

New component `src/components/shared/InlineScript.tsx`:

```tsx
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

## 4. Why `text/plain` is safe here

- It is a script data block → React does not warn and does not attempt to execute it.
- The browser already executed the real JS from the SSR `text/javascript` copy during parse; the hydrated `text/plain` node is inert.
- The script's job is a one-time, idempotent DOM classList mutation; client re-execution is neither needed nor desired.

## 5. Evidence of fix

| Check | Result |
|---|---|
| SSR HTML contains `<script type="text/javascript">…afribook-ui…` | PASS |
| Headless Chromium against dev server | 0 console errors, 0 page errors, 0 script-tag warnings, 0 hydration errors |
| Theme script present after hydration (code intact) | PASS |
| Unit test: client render emits `text/plain`, preserves code, no warning | PASS |
| Unit test: `renderToStaticMarkup` emits exactly one `type="text/javascript"` script | PASS |
| Negative control: raw `<script>` (no type) on full load | no warning (client head-reconcile path only) — the `next/script` variant was the original trigger |

## 6. Guidelines for future inline scripts

- If a script must run **before first paint** (theme, bootstrapping) and is rendered by a Server Component in `<head>`, use `InlineScript` (or the type-toggle pattern) — never `next/script` with `beforeInteractive` and never a bare `<script>` inside RSC output.
- If the code only runs after hydration, prefer `useEffect` or a normal `<script src>` (external file) — no inline script needed.
- Keep `suppressHydrationWarning` scoped to the script element; do not widen it.

## 7. References

- `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`
- `node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:23647` (`isScriptDataBlock`), `:12957-12967` (warning source)
- React docs: `dangerouslySetInnerHTML`
