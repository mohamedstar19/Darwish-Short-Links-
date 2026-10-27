# روابط درويش — Darwish Links

A link shortener like Bitly, Arabic-first. Anyone can sign up, shorten links (random or custom codes), get a QR code, and see click stats: per day, referrer, country, device, browser, and OS. Admins can block abusive links and accounts.

Stack: Next.js 16 (App Router), PostgreSQL + Prisma 7, next-intl (Arabic/English), Tailwind CSS 4.

## Run locally

```bash
cp .env.example .env          # fill DATABASE_URL, APP_URL, SESSION_SECRET
npm install
npm run db:migrate            # creates the tables
npm run dev
```

Make yourself an admin after registering:

```bash
npm run make-admin -- you@example.com
```

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `APP_URL` | yes | Public base URL; short links are `APP_URL/{code}` |
| `SESSION_SECRET` | yes | ≥ 32 random characters (`openssl rand -base64 48`) |
| `SAFE_BROWSING_API_KEY` | no | Checks new links against Google Safe Browsing |

## Deploy

Works on any Node host. For Vercel + Neon/Supabase:

1. Create the Postgres database and copy its connection string.
2. Import this repo in Vercel and set the variables above.
3. Run `npm run db:deploy` once against the production database (and after every new migration).
4. Point your short domain at the deployment and set `APP_URL` to it.

See `doc/` for architecture and feature details.
