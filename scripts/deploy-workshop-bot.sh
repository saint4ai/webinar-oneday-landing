#!/usr/bin/env bash
# Выкладка воронки воркшопа одним заходом: form-api с ботом, потом лендинг и «Спасибо».
# Запуск на сервере от root: bash deploy-workshop-bot.sh /tmp/wsbot-<ts>.tgz
# Архив собирает scripts/pack-workshop-bot.ps1. Внутри: landing/, form/, static/, secrets.env (токен бота).
# Рассылка серии после выкладки ВЫКЛЮЧЕНА: включается командой /series_on в боте.
# Порядок (ревью 06.10): бэкап → пробный запуск нового server.js на 4011 без бота → рестарт → настройка бота →
# статика последней, по файлу через mv → проверки. Откат не трогает data/ (подписчики) и .env.
set -euo pipefail

PKG="${1:?нужен путь к архиву}"
chmod 600 "$PKG"
TS="$(date +%Y%m%d-%H%M%S)"
W=/var/www/workshop-montazh
F=/opt/workshop-form
S=/var/www/workshop-static
B=/var/backups/workshop-$TS
PM2="runuser -u onaiapp -- env PM2_HOME=/home/onaiapp/.pm2 pm2"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"; pkill -u onaiapp -f "node server.next.js" 2>/dev/null || true' EXIT

# Не выкатывать во время эфира и оффера (с первого эфира 07.10): 19:30–21:30 по Алматы.
NOW_ALMATY="$(TZ=Asia/Almaty date +%Y-%m-%d\ %H%M)"
if [[ "${NOW_ALMATY%% *}" > "2026-10-06" ]]; then
  HM="${NOW_ALMATY##* }"
  if (( 10#$HM >= 1930 && 10#$HM < 2130 )) && [[ "${FORCE:-0}" != "1" ]]; then
    echo "СТОП: идёт эфир или оффер ($NOW_ALMATY по Алматы). Повторить после 21:30 или FORCE=1."; exit 1
  fi
fi

echo "== распаковка"
tar -xzf "$PKG" -C "$TMP"
for f in form/server.js form/tg-setup.js form/tg-series.json form/wa-series.json form/admin-app.html form/VERSION landing/thank-you.html landing/efir.js landing/index.html static/thank-you.html secrets.env; do
  test -s "$TMP/$f" || { echo "нет $f в архиве"; exit 1; }
done

echo "== бэкапы в $B"
mkdir -p "$B"
cp -a "$W" "$B/workshop-montazh"
cp -a "$F/server.js" "$F/.env" "$B/"
[[ -f "$F/admin-app.html" ]] && cp -a "$F/admin-app.html" "$B/" || true
cp -a "$S/thank-you.html" "$B/static-thank-you.html"
# Старые *.bak.* лежали внутри корня сайта и отдавались наружу: переносим их в бэкапы.
mkdir -p /var/backups/workshop-montazh-old
find "$W" -maxdepth 1 -name '*.bak.*' -exec mv -t /var/backups/workshop-montazh-old/ {} + || true

echo "== секреты в .env (значения не печатаем)"
add_env() { grep -q "^$1=" "$F/.env" || printf '\n%s=%s\n' "$1" "$2" >> "$F/.env"; }
add_env TG_WORKSHOP_BOT_TOKEN "$(sed -n 's/^TG_WORKSHOP_BOT_TOKEN=//p' "$TMP/secrets.env")"
add_env TG_WORKSHOP_WEBHOOK_SECRET "$(openssl rand -hex 24)"
add_env TG_GO_SECRET "$(openssl rand -hex 24)"
rm -f "$TMP/secrets.env"
chown onaiapp:onaiapp "$F/.env"; chmod 600 "$F/.env"
echo "переменных TG_WORKSHOP_ и TG_GO_: $(grep -c -E '^(TG_WORKSHOP_|TG_GO_)' "$F/.env")"

echo "== пробный запуск нового server.js на 4011 без бота"
install -o onaiapp -g onaiapp -m 644 "$TMP/form/tg-series.json" "$F/tg-series.json"
# Расписание WhatsApp-сообществ лежит рядом с server.js; модуль включается отдельно флагом WA_GROUPS=on в .env.
install -o onaiapp -g onaiapp -m 644 "$TMP/form/wa-series.json" "$F/wa-series.json"
install -o onaiapp -g onaiapp -m 644 "$TMP/form/VERSION" "$F/VERSION"
# Страница мини-приложения админки лежит рядом с server.js; пароль и ключ сессий (ADMIN_APP_PIN, ADMIN_APP_SECRET) в .env дописываются отдельно.
install -o onaiapp -g onaiapp -m 644 "$TMP/form/admin-app.html" "$F/admin-app.html"
install -o onaiapp -g onaiapp -m 644 "$TMP/form/server.js" "$F/server.next.js"
install -d -o onaiapp -g onaiapp -m 700 "$F/data"
( cd "$F" && runuser -u onaiapp -- env PORT=4011 TG_BOT=off FORM_API_ENV="$F/.env" node server.next.js >"$TMP/trial.log" 2>&1 & echo $! >"$TMP/trial.pid" )
ok=0
for i in $(seq 1 20); do curl -fsS -m 1 http://127.0.0.1:4011/health >/dev/null 2>&1 && { ok=1; break; }; sleep 0.5; done
trial_stop() { kill "$(cat "$TMP/trial.pid")" 2>/dev/null || true; pkill -u onaiapp -f 'node server.next.js' 2>/dev/null || true; }
trial_fail() { echo "ПРОБНЫЙ ЗАПУСК НЕ ПРОШЁЛ: $1"; tail -20 "$TMP/trial.log" | grep -v -i token || true; trial_stop; rm -f "$F/server.next.js"; exit 1; }
[[ $ok == 1 ]] || trial_fail "/health не ответил"
curl -fsS -m 2 http://127.0.0.1:4011/api/health >/dev/null || trial_fail "/api/health"
curl -fsS -m 2 http://127.0.0.1:4011/api/whatsapp-link | grep -q 'chat.whatsapp.com' || trial_fail "/api/whatsapp-link"
code=$(curl -s -o /dev/null -w '%{http_code}' -m 2 -X POST -H 'Content-Type: application/json' -d '{}' http://127.0.0.1:4011/api/lead || true)
[[ "$code" =~ ^4 ]] || trial_fail "/api/lead с пустым телом ответил $code, ждали 4xx"
code=$(curl -s -o /dev/null -w '%{http_code}' -m 2 http://127.0.0.1:4011/api/go/bad || true)
[[ "$code" == 302 ]] || trial_fail "/api/go/bad ответил $code"
code=$(curl -s -o /dev/null -w '%{http_code}' -m 2 http://127.0.0.1:4011/api/admin-app || true)
[[ "$code" == 200 ]] || trial_fail "/api/admin-app ответил $code"
code=$(curl -s -o /dev/null -w '%{http_code}' -m 2 http://127.0.0.1:4011/api/admin/summary || true)
[[ "$code" == 403 || "$code" == 503 ]] || trial_fail "/api/admin/summary без initData ответил $code, ждали 403 или 503"
trial_stop
sleep 0.5
echo "пробный запуск: ок"

echo "== откат заранее: /root/rollback-workshop-$TS.sh"
cat >"/root/rollback-workshop-$TS.sh" <<ROLLBACK
#!/usr/bin/env bash
# Откат выкладки $TS. data/ (подписчики) и .env не трогаем.
set -e
cp -a $B/server.js $F/server.js
for f in efir.js index.html thank-you.html; do cp -a $B/workshop-montazh/\$f $W/\$f; done
cp -a $B/static-thank-you.html $S/thank-you.html
if [ -f $B/static-thank-you-index.html ]; then cp -a $B/static-thank-you-index.html $S/thank-you/index.html; else rm -f $S/thank-you/index.html; fi
$PM2 restart workshop-form
T=\$(sed -n 's/^TG_WORKSHOP_BOT_TOKEN=//p' $F/.env)
[ -n "\$T" ] && curl -s -m 8 "https://api.telegram.org/bot\$T/deleteWebhook" >/dev/null || true
echo ROLLBACK_OK
ROLLBACK
chmod 700 "/root/rollback-workshop-$TS.sh"; bash -n "/root/rollback-workshop-$TS.sh"

echo "== рестарт form-api"
mv -f "$F/server.next.js" "$F/server.js"
install -o onaiapp -g onaiapp -m 644 "$TMP/form/tg-setup.js" "$F/tg-setup.js"
$PM2 restart workshop-form --update-env >/dev/null
for i in $(seq 1 20); do curl -fsS -m 1 http://127.0.0.1:4010/health >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS -m 3 http://127.0.0.1:4010/api/health; echo

echo "== статика: файлы по одному через mv, страницы последними"
place() { install -D -o onaiapp -g onaiapp -m 644 "$TMP/landing/$1" "$W/$1.new.$TS" && mv -f "$W/$1.new.$TS" "$W/$1"; }
( cd "$TMP/landing" && find assets -type f ) > "$TMP/assets.list"
while read -r f; do place "$f"; done < "$TMP/assets.list"
place efir.js
place index.html
place thank-you.html
install -m 644 "$TMP/static/thank-you.html" "$S/thank-you.html.new.$TS" && mv -f "$S/thank-you.html.new.$TS" "$S/thank-you.html"
# Адрес со слешем на конце (/workshop/thank-you/) тоже ведём на новую страницу.
if [[ -d "$S/thank-you" ]]; then
  [[ -f "$S/thank-you/index.html" ]] && cp -a "$S/thank-you/index.html" "$B/static-thank-you-index.html"
  install -m 644 "$TMP/static/thank-you.html" "$S/thank-you/index.html"
fi

echo "== настройка бота (сбой шага не останавливает выкладку)"
( cd "$F" && runuser -u onaiapp -- node tg-setup.js "$W/assets/tg/avatar.jpg" ) 2>&1 | grep -v -i -E 'token|secret' || echo "tg-setup: есть FAIL, смотри выше"

echo "== проверки снаружи"
code() { curl -s -o /dev/null -w '%{http_code}' -m 8 "$1"; }
echo "лендинг: $(code https://onai.academy/workshop-montazh/)"
echo "спасибо: $(code https://onai.academy/workshop-montazh/thank-you.html)"
echo "health: $(curl -s -m 8 https://onai.academy/workshop/api/health)"
echo "переход в эфир: $(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -m 8 https://onai.academy/workshop/api/go/bad)"
echo "кнопка Telegram на «Спасибо»: $(curl -s -m 8 https://onai.academy/workshop-montazh/thank-you.html | grep -c 'workshop_aiprod_bot')"
echo "старая страница переадресует: $(curl -s -m 8 https://onai.academy/workshop/thank-you | grep -c 'workshop-montazh/thank-you.html')"
echo "кэш efir.js: $(curl -sI -m 8 'https://onai.academy/workshop-montazh/efir.js?v=20261006' | grep -i -E '^cache-control' | tr -d '\r')"
$PM2 logs workshop-form --lines 20 --nostream 2>/dev/null | grep -v -i -E 'token|secret' | tail -20 || true

echo
echo "Откат: bash /root/rollback-workshop-$TS.sh"
rm -f "$PKG"
echo "DEPLOY_OK $TS"
