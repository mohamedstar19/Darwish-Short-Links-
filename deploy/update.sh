#!/usr/bin/env bash
# تحديث «روابط درويش» لآخر نسخة على GitHub:
#   sudo bash deploy/update.sh
# بيسحب آخر كود في نسخة الريبو دي، وبعدين يشغّل install.sh (مايجريشن + بناء + إعادة تشغيل).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
OWNER="$(stat -c %U .)"
sudo -u "$OWNER" git pull --ff-only
exec bash deploy/install.sh
