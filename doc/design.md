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
