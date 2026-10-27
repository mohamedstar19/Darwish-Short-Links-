# Architecture

## Runtime

- Next.js 16 App Router on Node. All pages are server-rendered on demand; client components only handle forms and buttons, then call `router.refresh()`.
- PostgreSQL through Prisma 7 with the `@prisma/adapter-pg` driver adapter (`src/lib/prisma.ts`).
- UI language comes from the `NEXT_LOCALE` cookie (`src/i18n/request.ts`), Arabic by default. URLs carry no locale prefix, because the root path belongs to short codes.
- Dark mode is a `dark` class on `<html>`, set before paint from `localStorage` or the system preference.

## Data model (`prisma/schema.prisma`)

- `User`: email (lowercase, unique), bcrypt hash, `role` (`USER`/`ADMIN`), `isBlocked`.
- `Link`: unique lowercase `code`, destination `url`, optional `title`/`expiresAt`, owner-controlled `isActive`, admin-controlled `isBlocked` + `blockedReason`, denormalized `clickCount`/`lastClickedAt`.
- `Click`: one row per counted click with `country`, `referrer` host, `device`, `browser`, `os`. No IP.

## Request flow

1. `GET /{code}` → `src/app/[code]/route.ts` looks the code up, checks `linkState()`, and returns a `302` with `Cache-Control: private, no-store`.
2. Unavailable codes go to `/link-unavailable?reason=missing|paused|expired|blocked`; invalid code shapes (e.g. `favicon.ico`) get a plain 404.
3. Human `GET` clicks are written in `after()`, so the redirect never waits on analytics.

## Security

- Sessions: HS256 JWT in the httpOnly, SameSite=Lax `dsl_session` cookie (30 days). Each request re-reads the user, so blocking or role changes apply immediately.
- Mutating APIs reject cross-site `Origin` headers (`isSameOrigin`).
- Login/registration and link creation are rate-limited in memory (`src/lib/rate-limit.ts`). On serverless or multi-instance hosting each instance counts separately — move to Redis/Upstash before relying on it there.
- Destinations: http(s) with a real domain name only (no IPs/localhost), max 2048 chars, not this site, not another shortener, and optionally Google Safe Browsing (fails open on API errors).
- Response headers: `nosniff`, `X-Frame-Options: DENY`, strict-origin referrer policy (`next.config.ts`).

## Deployment

- Production runs on the owner's Linux server behind Cloudflare and Nginx, like Darwish Quran: `deploy/install.sh <domain>` (first install and every update via `deploy/update.sh`), `deploy/nginx.conf` (template), `deploy/make-admin.sh`.
- Layout: user `links`, app in `/opt/darwish-links/app`, PostgreSQL container `darwish-links-db` on `127.0.0.1:5434` (volume `darwish_links_pg`), PM2 process `darwish-links` on port `3020`.
- Cloudflare sends `CF-Connecting-IP` (used for rate limiting) and `CF-IPCountry` (click country); Nginx passes both through.
- `npm run build` runs `prisma generate` then `next build`; `install.sh` runs `prisma migrate deploy` before it. Required env: `DATABASE_URL`, `APP_URL`, `SESSION_SECRET`.
