# Click analytics

- Recorded by `recordClick()` in `src/lib/link-service.ts` after the redirect response, inside a transaction that also bumps `Link.clickCount`.
- Counted: `GET` requests from non-bot user agents. Skipped: `HEAD`, empty UAs, crawlers, and link previews (WhatsApp, Facebook, Telegram, Slack, Discord…) — see `isBot()` in `src/lib/analytics.ts`.
- Stored per click: device (mobile/tablet/desktop), browser, OS, referrer host (not full URL; this site's own host is dropped), and country from `x-vercel-ip-country` or `cf-ipcountry` when the host provides it. No IP addresses.
- Stats page `/dashboard/links/[id]` (owner or admin): all-time total, last 30 days total, last click, daily bars (Africa/Cairo days, with a table view), and top referrers, countries, devices, browsers, OS.
