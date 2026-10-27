# Darwish Links — agent guide

`CLAUDE.md` points here. Keep this short; details live in `doc/`.

## Read only what you need

1. Start with `doc/README.md`, then the one feature file for your task.
2. Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` — this is Next.js 16.2.10 and conventions differ from older versions (e.g. `params` is a Promise, `after()` for post-response work).
3. Search with `rg` before opening files. Don't load every route or translation file.

## Repository map

- `src/app/[code]/route.ts` — the short link redirect. Short codes live at the site root.
- `src/app/{dashboard,admin,login,register,link-unavailable}` — UI pages (no locale in the URL).
- `src/app/api` — route handlers. User routes call `requireUser()`; admin routes call `requireAdmin()`.
- `src/lib` — domain logic: `links.ts` (code rules, Zod schemas), `link-service.ts` (DB writes, stats), `url-safety.ts`, `analytics.ts`, `auth/`.
- `src/components` — UI; `ui.tsx` holds shared primitives.
- `prisma` — PostgreSQL schema and migrations. Never edit `src/generated/prisma`.
- `messages/{ar,en}.json` — translations; keys must stay in sync (Arabic is the default).
- `test` — Vitest unit tests for `src/lib`.

## Non-negotiable rules

- Every new top-level route segment must be added to `RESERVED_CODES` in `src/lib/links.ts`, or a user could claim it as a short code.
- Validate all input with Zod; return `{ error: "CODE" }` with a deliberate status. Mutating API routes check `isSameOrigin()`.
- User-owned resources are always queried with `userId` in the `where`, and return 404 (not 403) for other users' ids.
- Never store IP addresses or other personal data in `Click`. Never log or commit secrets or `.env`.
- Redirects stay `302` + `no-store`, and click recording must never block or break a redirect.
- Arabic-first RTL with English LTR parity. Check both languages and both color modes for visible changes.

## Validation

`npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` (needs `DATABASE_URL` only for migrations, not for the build). Update the matching `doc/` file when behavior, API, data, or deployment changes.
