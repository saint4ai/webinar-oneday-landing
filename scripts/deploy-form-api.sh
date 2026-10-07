#!/usr/bin/env bash
# Выкладка только кода form-api (бот, админка, приём заявок) без лендинга.
# Запуск на сервере от root: bash deploy-form-api.sh /tmp/server.js [/tmp/tg-series.json] [/tmp/admin-app.html]
# Порядок как в deploy-workshop-bot.sh: бэкап → пробный запуск на 4011 без бота → замена → рестарт → проверка.
# data/ и .env не трогаем. Во время эфира (19:30–21:30 по Алматы) не запускать без FORCE=1.
set -euo pipefail

NEW="${1:?нужен путь к новому server.js}"
SERIES="${2:-}"
APP="${3:-}"
F=/opt/workshop-form
TS="$(date +%Y%m%d-%H%M%S)"
PM2="runuser -u onaiapp -- env PM2_HOME=/home/onaiapp/.pm2 pm2"

HM="$(TZ=Asia/Almaty date +%H%M)"
if (( 10#$HM >= 1930 && 10#$HM < 2130 )) && [[ "${FORCE:-0}" != "1" ]]; then
  echo "СТОП: идёт эфир или оффер ($HM по Алматы). Повторить после 21:30 или FORCE=1."; exit 1
fi

test -s "$NEW"
cp -a "$F/server.js" "$F/server.js.bak.$TS"
[[ -n "$SERIES" ]] && { test -s "$SERIES"; cp -a "$F/tg-series.json" "$F/tg-series.json.bak.$TS"; }
[[ -n "$APP" ]] && { test -s "$APP"; [[ -f "$F/admin-app.html" ]] && cp -a "$F/admin-app.html" "$F/admin-app.html.bak.$TS"; install -o onaiapp -g onaiapp -m 644 "$APP" "$F/admin-app.html"; }

echo "== пробный запуск на 4011 без бота"
install -o onaiapp -g onaiapp -m 644 "$NEW" "$F/server.next.js"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"; pkill -u onaiapp -f "node server.next.js" 2>/dev/null || true' EXIT
( cd "$F" && runuser -u onaiapp -- env PORT=4011 TG_BOT=off FORM_API_ENV="$F/.env" node server.next.js >"$TMP/trial.log" 2>&1 & )
ok=0; for i in $(seq 1 20); do curl -fsS -m 1 http://127.0.0.1:4011/api/health >/dev/null 2>&1 && { ok=1; break; }; sleep 0.5; done
code=$(curl -s -o /dev/null -w '%{http_code}' -m 2 -X POST -H 'Content-Type: application/json' -d '{}' http://127.0.0.1:4011/api/lead || true)
pkill -u onaiapp -f 'node server.next.js' 2>/dev/null || true; sleep 0.5
if [[ $ok != 1 || ! "$code" =~ ^4 ]]; then echo "ПРОБНЫЙ ЗАПУСК НЕ ПРОШЁЛ (health=$ok, lead=$code)"; tail -20 "$TMP/trial.log" | grep -v -i token || true; rm -f "$F/server.next.js"; exit 1; fi
echo "пробный запуск: ок"

mv -f "$F/server.next.js" "$F/server.js"
[[ -n "$SERIES" ]] && install -o onaiapp -g onaiapp -m 644 "$SERIES" "$F/tg-series.json"
$PM2 restart workshop-form >/dev/null
for i in $(seq 1 20); do curl -fsS -m 1 http://127.0.0.1:4010/health >/dev/null 2>&1 && break; sleep 0.5; done
curl -s -m 3 http://127.0.0.1:4010/api/health; echo
$PM2 logs workshop-form --lines 15 --nostream 2>/dev/null | grep -E '\[tg|\[form-api\]' | grep -v -i -E 'token|secret' | tail -5 || true
echo "Откат: cp $F/server.js.bak.$TS $F/server.js && $PM2 restart workshop-form"
echo "DEPLOY_OK $TS"
