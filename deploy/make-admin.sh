#!/usr/bin/env bash
# يخلّي حساب موجود أدمن:  sudo bash deploy/make-admin.sh someone@example.com
set -euo pipefail
EMAIL="${1:?اكتب الإيميل: sudo bash deploy/make-admin.sh someone@example.com}"
sudo -u links bash -lc "cd /opt/darwish-links/app && npm run --silent make-admin -- '$EMAIL'"
