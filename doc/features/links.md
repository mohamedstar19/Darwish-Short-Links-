# Links and redirects

- UI: `ShortenForm` on `/` (signed in) and `/dashboard`; `LinksList` on `/dashboard` with copy, QR, stats, edit, pause/resume, delete.
- APIs (owner only, others get 404): `GET/POST /api/links`, `GET/PATCH/DELETE /api/links/[id]`.
- Redirect: `src/app/[code]/route.ts`.

## Rules

- Codes: lowercase `a-z0-9-`, 3–50 chars, no leading/trailing hyphen. Custom codes are lowercased. Random codes are 7 chars from an alphabet without look-alikes (`0/o`, `1/l/i`), retried on collision.
- `RESERVED_CODES` in `src/lib/links.ts` blocks app paths (`admin`, `dashboard`, `login`, …). Add every new top-level route there.
- The code is immutable. Destination, title, active flag, and expiry can change; a new destination goes through the same safety checks.
- States, in priority order: `blocked` (admin) > `paused` (owner) > `expired` > `active`. Owners can't lift an admin block.
- Errors: `INVALID_INPUT`, `CODE_TAKEN`, `CODE_RESERVED`, `SELF_LINK`, `SHORTENER`, `UNSAFE`, `RATE_LIMITED`, `NOT_FOUND`.
- Limits: 30 new links/hour and 200/day per user.
- Deleting a link deletes its clicks (cascade).
