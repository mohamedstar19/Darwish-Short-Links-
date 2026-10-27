#!/usr/bin/env bash
# ============================================================================
# تثبيت/تحديث «روابط درويش» على سيرفر لينكس (نفس نمط منصة القرآن):
# مستخدم نظام معزول + PostgreSQL في حاوية Docker خاصة + PM2 + ملف Nginx منفصل.
# لا يلمس أي موقع أو قاعدة بيانات تانية على السيرفر.
#
# أول مرة (من نسخة الريبو على السيرفر):
#   sudo bash deploy/install.sh links.darwish-tech.com
#
# التحديث بعد كده: sudo bash deploy/update.sh
#
# آمن لإعادة التشغيل: ملف .env وقاعدة البيانات مش بيتمسحوا أبداً.
# ============================================================================
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="links"
APP_HOME="/opt/darwish-links"
APP_DIR="$APP_HOME/app"
ENV_FILE="$APP_DIR/.env"
APP_PORT_REQUESTED="${APP_PORT:-}" # optional; otherwise the saved port, or the first free one from 3020
DB_CONTAINER="darwish-links-db"
DB_PORT="${DB_PORT:-5434}"
PM2_NAME="darwish-links"
NGINX_SITE="/etc/nginx/sites-available/darwish-links.conf"

log() { echo -e "\n\033[1;32m==> $1\033[0m"; }
die() { echo -e "\033[1;31m✗ $1\033[0m" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "شغّله بصلاحيات root: sudo bash deploy/install.sh <الدومين>"

# الدومين: من أول تشغيل، أو من .env الموجود في التحديثات
DOMAIN="${1:-}"
if [[ -z "$DOMAIN" && -f "$ENV_FILE" ]]; then
  DOMAIN="$(sed -n 's/^APP_URL="https\?:\/\/\([^"/]*\).*/\1/p' "$ENV_FILE")"
fi
[[ -n "$DOMAIN" ]] || die "اكتب الدومين: sudo bash deploy/install.sh links.darwish-tech.com"
[[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]] || die "الدومين مش صحيح: $DOMAIN"

# ---------- 1) المتطلبات ----------
log "1/7 المتطلبات (Node 22 / PM2 / Docker / Nginx)"
need_apt=()
command -v nginx >/dev/null || need_apt+=(nginx)
command -v rsync >/dev/null || need_apt+=(rsync)
command -v openssl >/dev/null || need_apt+=(openssl)
if ((${#need_apt[@]})); then
  apt-get update -qq && apt-get install -y -qq "${need_apt[@]}" >/dev/null
fi
if ! command -v node >/dev/null || (( $(node -v | grep -oE '^v[0-9]+' | tr -d v) < 22 )); then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
command -v pm2 >/dev/null || npm i -g pm2 >/dev/null 2>&1
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh >/dev/null
  systemctl enable --now docker >/dev/null
fi
echo "   node $(node -v) · $(docker -v | cut -d, -f1)"

port_busy() { ss -ltnH "sport = :$1" 2>/dev/null | grep -q .; }

# ---------- 2) المستخدم والكود ----------
log "2/7 مستخدم النظام ونسخ الكود إلى $APP_DIR"
id -u "$APP_USER" &>/dev/null || useradd -r -m -d "$APP_HOME" -s /bin/bash "$APP_USER"
mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude .env \
  --exclude src/generated \
  "$SRC_DIR"/ "$APP_DIR"/
chown -R "$APP_USER:$APP_USER" "$APP_HOME"

# ---------- 3) PostgreSQL + .env (مرة واحدة فقط) ----------
if [[ ! -f "$ENV_FILE" ]]; then
  log "3/7 PostgreSQL في حاوية Docker خاصة + توليد الأسرار"
  DB_PASS="$(openssl rand -hex 24)"
  if ! docker ps -a --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
    port_busy "$DB_PORT" && die "المنفذ $DB_PORT مستخدم — شغّل تاني بمنفذ تاني: sudo DB_PORT=5440 bash deploy/install.sh $DOMAIN"
    docker run -d --name "$DB_CONTAINER" --restart unless-stopped \
      -e POSTGRES_USER=links -e POSTGRES_PASSWORD="$DB_PASS" -e POSTGRES_DB=darwish_links \
      -p "127.0.0.1:$DB_PORT:5432" \
      -v darwish_links_pg:/var/lib/postgresql/data \
      postgres:16-alpine >/dev/null
  else
    die "الحاوية $DB_CONTAINER موجودة من غير ملف .env — رجّع ملف .env القديم لـ $ENV_FILE قبل ما تكمّل"
  fi
  echo -n "   بانتظار قاعدة البيانات"
  for _ in $(seq 1 30); do
    docker exec "$DB_CONTAINER" pg_isready -U links -d darwish_links >/dev/null 2>&1 && break
    echo -n "."; sleep 2
  done
  echo
  cat > "$ENV_FILE" <<EOF
# تم توليده بواسطة deploy/install.sh — خُد نسخة احتياطية آمنة منه
DATABASE_URL="postgresql://links:$DB_PASS@127.0.0.1:$DB_PORT/darwish_links?schema=public"
APP_URL="https://$DOMAIN"
SESSION_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
# اختياري: مفتاح Google Safe Browsing لفحص الروابط الضارة
SAFE_BROWSING_API_KEY=""
EOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  log "3/7 ملف .env موجود — قاعدة البيانات والأسرار زي ما هي"
  docker start "$DB_CONTAINER" >/dev/null 2>&1 || true
fi

# ---------- 4) الحزم + المايجريشن + البناء ----------
log "4/7 تثبيت الحزم والمايجريشن والبناء (دقايق)"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm ci --no-audit --no-fund && npx prisma migrate deploy && npm run build"

# ---------- 5) PM2 ----------
# المنفذ: اللي طلبته، أو المحفوظ في .env من تثبيت سابق، أو أول منفذ فاضي من 3020
PM2_EXISTS=0
sudo -u "$APP_USER" bash -lc "pm2 describe $PM2_NAME" >/dev/null 2>&1 && PM2_EXISTS=1
SAVED_PORT="$(sed -n 's/^APP_PORT="\{0,1\}\([0-9]\{2,5\}\)"\{0,1\}$/\1/p' "$ENV_FILE")"
if [[ -n "$APP_PORT_REQUESTED" ]]; then
  APP_PORT="$APP_PORT_REQUESTED"
  [[ "$APP_PORT" =~ ^[0-9]{2,5}$ ]] || die "المنفذ مش صحيح: $APP_PORT"
  if { [[ $PM2_EXISTS -eq 0 ]] || [[ "$APP_PORT" != "$SAVED_PORT" ]]; } && port_busy "$APP_PORT"; then
    die "المنفذ $APP_PORT مستخدم من برنامج تاني — جرّب من غير APP_PORT وهختار منفذ فاضي لوحدي"
  fi
elif [[ -n "$SAVED_PORT" ]]; then
  APP_PORT="$SAVED_PORT"
else
  APP_PORT=3020
  while port_busy "$APP_PORT"; do
    APP_PORT=$((APP_PORT + 1))
    (( APP_PORT < 3100 )) || die "مالقيتش منفذ فاضي بين 3020 و3099 — حدّد واحد: sudo APP_PORT=4020 bash deploy/install.sh $DOMAIN"
  done
fi
# يتحفظ في .env عشان التحديثات الجاية تستخدم نفس المنفذ
if grep -q '^APP_PORT=' "$ENV_FILE"; then
  sed -i "s/^APP_PORT=.*/APP_PORT=\"$APP_PORT\"/" "$ENV_FILE"
else
  printf '\n# منفذ التطبيق (Nginx بيوجّه عليه)\nAPP_PORT="%s"\n' "$APP_PORT" >> "$ENV_FILE"
fi

log "5/7 تشغيل التطبيق عبر PM2 على المنفذ $APP_PORT"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && (pm2 describe $PM2_NAME >/dev/null 2>&1 && PORT=$APP_PORT pm2 restart $PM2_NAME --update-env || PORT=$APP_PORT pm2 start npm --name $PM2_NAME -- start) && pm2 save" >/dev/null
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "$APP_HOME" >/dev/null 2>&1 || true

# ---------- 6) Nginx (ملف منفصل) ----------
log "6/7 Nginx لـ $DOMAIN"
sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__PORT__/$APP_PORT/g" "$APP_DIR/deploy/nginx.conf" > "$NGINX_SITE"
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/darwish-links.conf
nginx -t || die "إعدادات Nginx فيها مشكلة (شوف الرسالة فوق) — الموقع مااتغيرش"
systemctl reload nginx

# ---------- 7) فحص ----------
log "7/7 فحص التشغيل"
for _ in $(seq 1 20); do
  curl -fsS -o /dev/null "http://127.0.0.1:$APP_PORT/" && break
  sleep 2
done
if curl -fsS -o /dev/null -H "Host: $DOMAIN" "http://127.0.0.1/"; then
  echo -e "\n\033[1;32m✅ «روابط درويش» شغّال على السيرفر: https://$DOMAIN\033[0m"
else
  die "التطبيق مش بيرد — شوف: sudo -u $APP_USER pm2 logs $PM2_NAME"
fi
cat <<EOF

الخطوات الجاية:
  1) لو الدومين ورا Cloudflare Tunnel: ضيف Public Hostname لـ $DOMAIN يشاور على http://localhost:80
     (زي quran.darwish-tech.com). لو DNS عادي: اعمل سجل A لـ $DOMAIN على IP السيرفر.
  2) افتح https://$DOMAIN/register واعمل حسابك.
  3) خلّي نفسك أدمن:  sudo bash $APP_DIR/deploy/make-admin.sh إيميلك@gmail.com
  ملف الأسرار: $ENV_FILE (خُد منه نسخة احتياطية)
EOF
