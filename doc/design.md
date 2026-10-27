# Design rules

Reviewed against the UI/UX Pro Max checklist (product profile: Micro SaaS — flat, direct, let visitors try the product right away). Check these before shipping any visible change.

## Tokens (`src/app/globals.css`)

- Brand palette shared with Darwish Quran: emerald `--primary`, gold `--gold`, ivory background. Use tokens (`bg-primary`, `text-muted-foreground`, `border-input`…), never raw hex in components.
- `--border` is for decorative card and divider lines. `--input` is for form-field and outlined-button edges and stays ≥ 3:1 against card and background.
- Verified contrast (WCAG AA): body and muted text ≥ 4.5:1 on background, card, and `--muted` in both themes; button text ≥ 4.5:1 on its fill (dark `--primary` is `#12775b` for this reason).
- Dark mode is a `dark` class on `<html>`; check every change in both themes.

## Components

- Icons: `lucide-react` only, `aria-hidden` when next to visible text. No emoji as icons.
- Buttons and links that act like buttons: `buttonClass()` / `<Button>` from `src/components/ui.tsx`. They're 44px tall on phones (`min-h-11`); `size="sm"` drops to 36px from the `sm` breakpoint. Header controls follow the same rule.
- Fields: `<Input>` always has a visible label; hints stay below the field; errors render under their own field via `FieldError`, are linked with `aria-describedby`, set `aria-invalid`, and move focus to the field. Use `<PasswordInput>` for passwords (show/hide toggle; paste and autofill allowed).
- One filled (primary or gold) action per area. Row actions in lists are outlined; delete is a ghost danger button pushed to the end.
- Directional icons flip in RTL (`rtl:rotate-180` / `rtl:-scale-x-100`). Short URLs and destinations render `dir="ltr"`.
- Status is never color alone: state badges always carry text.

## Accessibility and layout

- Skip link to `#main` in the root layout; current nav item has `aria-current="page"`; toggles expose `aria-pressed` / `aria-expanded`.
- `prefers-reduced-motion` turns off animations and transitions globally.
- No horizontal scroll at 375px (portrait) or 812×375 (landscape). Grids that collapse to one column use `grid-cols-1` so native inputs (e.g. date) can't widen the page.
- Charts: one hue, exact value on hover/focus, a table view, and an empty state instead of a blank chart.
- Run an axe scan (WCAG 2.2 AA) on changed pages in both themes; the current pages report no violations.

## Icons

- Five icon concepts live in `design/icons/` (1 chain, 2 eight-point star, 3 mihrab arch, 4 nodes, 5 QR). The chain (1) is in use: it stays legible at 16px.
- In use: `src/app/icon.svg` (tab), `src/app/apple-icon.png` (180, full-bleed), `public/brand/icon-192.png`, `icon-512.png`, `maskable-512.png` (artwork inside the 80% safe zone), `public/brand/logo.svg` (header). The web app manifest is `src/app/manifest.ts`.
- To switch to another concept, regenerate those files from its SVG at the same sizes (full-bleed for apple/maskable).

## Animated background

`src/components/AnimatedBackground.tsx` draws a drifting "network of links" on a canvas behind `/`, `/login`, `/register`, and `/link-unavailable` only; data pages stay still.

- Interaction: dots lean toward the pointer (clamped pull) with gold lines to it; a tap on empty space sends a ripple. Taps on controls are ignored.
- Rules: a visible pause button (WCAG 2.2.2), remembered in `localStorage`; `prefers-reduced-motion` shows a still frame and no button; the loop stops while the tab is hidden; listeners and the frame loop are cleaned up on unmount; DPR capped at 2; 34–80 dots by screen area.
- Legibility: lines are faint (30% light / 40% dark at most), the hero headline sits on a radial "calm zone", and cards stay opaque or 80% so text never sits directly on moving lines.
