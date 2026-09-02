# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> **Revised 2026-08-29** — this file previously contained three unrelated,
> contradictory design templates (a food-delivery orange/blue palette, a
> cyberpunk Orbitron/JetBrains-Mono type system, and a generic "Cinema Mobile"
> glassmorphism app-store landing pattern) stitched together from separate
> auto-generated passes. None of them matched what's actually live in
> `src/app/globals.css`. This version documents the real, live tokens and
> gives them an intentional point of view, so it's a source of truth again
> instead of noise.

---

**Project:** AfriBook — multi-service marketplace (rideshare, stays, food &
delivery, local services) spanning many African countries plus diaspora
markets.

**Audience:** mobile-first, price-conscious, transacting in local currency,
often on average-spec Android devices and imperfect connectivity. This is a
utility super-app people open several times a day, not a marketing site —
clarity, speed, and trust beat spectacle.

**Design Dials:** Variance 5/10 (confident but restrained) | Motion 4/10
(purposeful, not decorative) | Density 6/10 (transactional, data-forward)

---

## Global Rules

### Color Palette (live in `src/app/globals.css`)

| Role | Hex (light) | Hex (dark) | CSS Variable |
|------|-------------|------------|--------------|
| Brand accent | `#F59E0B` (amber-500) | `#FBBF24` (amber-400) | `--color-amber-500` |
| Surface | `#FFFFFF` | `#0E0C12` | `--color-surface` |
| Surface secondary | `#F7F7F5` | `#16141C` | `--color-surface-secondary` |
| Text primary | `#1C1B19` | `#F4F2ED` | `--color-text-primary` |
| Text secondary | `#6E6A63` | `#A39F97` | `--color-text-secondary` |
| Border | `#E6E4DF` | `#26232E` | `--color-border` |

**Color notes:** amber is the one accent — it should feel like warm sunlight,
not a generic SaaS orange. Never introduce a second competing accent hue for
a "trust" color or a "CTA" color; contrast and hierarchy come from surface
depth (surface → surface-secondary → surface-tertiary) and type weight, not
extra colors. Dark mode is a first-class target, not an afterthought — it's
how most of this audience will actually use the app in low light.

### Typography (live in `src/app/layout.tsx`)

- **Heading & body:** Inter (`--font-sans`) — a workhorse grotesque that
  reads cleanly at small sizes on cheap Android screens and supports the
  Latin, Arabic-adjacent, and extended-Latin character sets this app's
  markets need.
- **Numerals, prices, ETAs, ride codes:** Geist Mono (`--font-mono`) —
  reserve the monospace face specifically for things that are *counted*:
  fares, distances, timers, order numbers, currency amounts. This is the
  signature typographic move: prose is humane and warm (Inter), anything
  the user is meant to scan as data snaps to a grid (Geist Mono tabular
  figures). Don't use Geist Mono for headings or body copy — that reads as
  a dev-tool, not a consumer marketplace.

### Spacing

Standard Tailwind scale (4/8/16/24/32/48/64px). Density 6/10 means booking
flows, price breakdowns, and dispatch/tracking screens can run tighter
(8–16px rhythm) than marketing surfaces like the homepage hero (24–48px).

### Shadows

Keep shadows shallow (`shadow-sm`/`shadow-md`) — this is a flat, warm,
daylight-readable app, not a glassmorphic one. Depth comes from the
surface/surface-secondary/surface-tertiary steps above, not blur.

---

## Component Specs

### Buttons

```css
.btn-primary {
  background: var(--color-amber-500);
  color: #1C1B19; /* dark text on amber reads better than white at this hue */
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  transition: transform 150ms ease, opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.92; }
.btn-primary:active { transform: scale(0.98); }

.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
}
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  transition: border-color 150ms ease;
}
.card:hover { border-color: var(--color-amber-500); }
```
No lift-on-hover translateY, no heavy shadow growth — this app is browsed in
long scrolling lists (businesses, ride types, order history); dozens of
cards animating on scroll reads as noisy, not premium.

### Price / fare display

Always pair the currency symbol from the country's `CurrencyConfig` with
Geist Mono tabular numerals, e.g. `<span className="font-mono tabular-nums">
{formatPrice(amount, currency)}</span>`. This is the single highest-value
consistency rule in the app: every price, everywhere, in every country,
should visually read as the same "kind" of thing.

### Inputs

```css
.input {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}
.input:focus {
  border-color: var(--color-amber-500);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-amber-500) 20%, transparent);
}
```

---

## Signature element

**The live status strip.** Because this app spans rides, deliveries, and
bookings that all have a real-time state (driver en route, order preparing,
booking confirmed), a thin, persistent status strip — amber accent bar +
Geist Mono countdown/status text — is the one recurring visual signature
that should appear consistently across ride tracking, delivery tracking, and
order status, so a user recognizes "something is happening" at a glance
regardless of which service they're using.

---

## Motion

Keep it purposeful, not decorative:
- Route/status updates (driver marker moving, order status changing): ease
  the transition (200–300ms), don't snap.
- List/grid entrances: skip stagger animations on data-dense lists (search
  results, order history) — they slow down repeat users. Reserve a subtle
  fade-up (150ms) for hero/marketing sections only.
- Respect `prefers-reduced-motion` everywhere.

---

## Anti-Patterns (Do NOT Use)

- ❌ A second accent color competing with amber
- ❌ Glassmorphism / heavy blur — wrong register for this product
- ❌ Emojis as icons — use Lucide (already the icon set in use)
- ❌ Card hover states that shift layout (translateY / scale on hover)
- ❌ Prices or numerals set in Inter where Geist Mono should be used
- ❌ Low contrast text — maintain 4.5:1 minimum in both light and dark mode
- ❌ Missing `cursor: pointer` on clickable elements
- ❌ Invisible focus states

## Pre-Delivery Checklist

- [ ] Prices/fares/ETAs use Geist Mono tabular numerals
- [ ] No second accent color introduced
- [ ] Dark mode checked, not just light mode
- [ ] Hover/focus states present and visible, no layout shift
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
