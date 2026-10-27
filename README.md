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

## Deploy on your own Linux server

Same pattern as Darwish Quran: a dedicated `links` system user, PostgreSQL in its own Docker container (`127.0.0.1:5434`), PM2 on the first free port from `3020` (saved as `APP_PORT` in `.env`), and a separate Nginx site file. Nothing else on the server is touched.

```bash
# on the server (Ubuntu/Debian), once
git clone git@github.com:mohamedstar19/Darwish-Short-Links-.git
cd Darwish-Short-Links-
sudo bash deploy/install.sh links.darwish-tech.com   # your (sub)domain

# after signing up on the site, make yourself admin
sudo bash deploy/make-admin.sh you@example.com

# later updates
sudo bash deploy/update.sh
```

`install.sh` generates `/opt/darwish-links/app/.env` (database password, `SESSION_SECRET`, `APP_URL`) on the first run and never overwrites it; keep a backup. To force a port: `sudo APP_PORT=4020 bash deploy/install.sh <domain>`; the database port with `DB_PORT=…` on the first install.

Then point the domain at the server: behind Cloudflare Tunnel, add a Public Hostname for it to `http://localhost:80` (like `quran.darwish-tech.com`); with plain DNS, add an A record and enable SSL in Cloudflare or with `certbot --nginx`.

See `doc/` for architecture and feature details.
