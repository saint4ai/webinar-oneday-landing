#!/usr/bin/env bash
# Выкладка только статики лендинга воркшопа одним заходом: index.html, thank-you.html, efir.js, assets/js/join.js
# (и новые файлы assets, если они есть в архиве). form-api и бот не трогаются.
#
# Архив собирается из корня репозитория:
#   tar -czf landing.tgz -C workshop-montazh index.html thank-you.html efir.js assets/js/join.js [assets/...]
# Запуск на сервере от root:
#   bash deploy-landing.sh /tmp/landing.tgz
#
# Порядок: проверка архива и окна времени, бэкап заменяемых файлов, подъём ?v= у join.js и efir.js до $V,
# замена по файлу (install во временное имя и mv): сначала assets, потом efir.js, страницы последними,
# проверки снаружи, откат одной командой. Откат не трогает ничего, кроме файлов этой выкладки.
#
# Переменные для проверки на своей машине (на сервере не нужны):
#   W, BACKUP_ROOT, ROLLBACK_DIR, OWNER (пусто = не менять владельца), BASE_URL, FORCE=1.
set -euo pipefail

PKG="${1:?нужен путь к архиву (tgz)}"
V="${V:-20261006b}"
TS="$(date +%Y%m%d-%H%M%S)"
W="${W:-/var/www/workshop-montazh}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups}"
ROLLBACK_DIR="${ROLLBACK_DIR:-/root}"
OWNER="${OWNER-onaiapp:onaiapp}"
BASE_URL="${BASE_URL:-https://onai.academy/workshop-montazh}"
B="$BACKUP_ROOT/workshop-landing-$TS"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() { echo "СТОП: $*" >&2; exit 1; }

# Переход на thank-you.html допустим только как запасной путь: catch(e3){ location.href='thank-you.html'; }.
# Считаем все упоминания и те, что стоят именно в запасном пути: они должны совпасть, и запасной путь должен быть.
redirect_state() { # читает html со stdin, печатает «всего запасных»
  local html; html="$(cat)"
  local total fb
  total="$(grep -o "location.href='thank-you.html'" <<<"$html" | wc -l | tr -d ' ')"
  fb="$(grep -o "catch(e3){ location.href='thank-you.html'; }" <<<"$html" | wc -l | tr -d ' ')"
  echo "$total $fb"
}
redirect_ok() { local st; st="$(redirect_state)"; [[ "${st% *}" == "${st#* }" && "${st#* }" -ge 1 ]]; }

# Не выкатывать во время эфира и оффера (с первого эфира 07.10): 19:30-21:30 по Алматы.
NOW_ALMATY="$(TZ=Asia/Almaty date +%Y-%m-%d\ %H%M)"
if [[ "${NOW_ALMATY%% *}" > "2026-10-06" ]]; then
  HM="${NOW_ALMATY##* }"
  if (( 10#$HM >= 1930 && 10#$HM < 2130 )) && [[ "${FORCE:-0}" != "1" ]]; then
    fail "идёт эфир или оффер ($NOW_ALMATY по Алматы). Повторить после 21:30 или FORCE=1."
  fi
fi

echo "== проверка архива"
[[ -s "$PKG" ]] || fail "нет архива $PKG"
LIST="$(tar -tzf "$PKG")"
# Только известные пути: страницы, efir.js и assets. Никаких абсолютных путей и «..».
while IFS= read -r p; do
  [[ -z "$p" || "$p" == */ ]] && continue
  case "$p" in
    index.html|thank-you.html|efir.js|assets/*) ;;
    *) fail "в архиве лишний путь: $p" ;;
  esac
  case "$p" in /*|*..*) fail "небезопасный путь в архиве: $p" ;; esac
done <<<"$LIST"
tar -xzf "$PKG" -C "$TMP"
for f in index.html thank-you.html efir.js assets/js/join.js; do
  [[ -s "$TMP/$f" ]] || fail "нет $f в архиве"
done
[[ -d "$W" ]] || fail "нет каталога сайта $W"

echo "== ?v= у join.js и efir.js: $V"
for f in index.html thank-you.html; do
  sed -i -E "s#(efir\.js\?v=)[0-9A-Za-z]+#\1$V#g; s#(assets/js/join\.js\?v=)[0-9A-Za-z]+#\1$V#g" "$TMP/$f"
done
grep -q "efir.js?v=$V" "$TMP/index.html"            || fail "в index.html нет efir.js?v=$V"
grep -q "assets/js/join.js?v=$V" "$TMP/index.html"  || fail "в index.html нет join.js?v=$V"
grep -q "efir.js?v=$V" "$TMP/thank-you.html"            || fail "в thank-you.html нет efir.js?v=$V"
grep -q "assets/js/join.js?v=$V" "$TMP/thank-you.html"  || fail "в thank-you.html нет join.js?v=$V"

echo "== проверка index.html до выкладки"
# Перехода на thank-you.html после заявки быть не должно, кроме запасного пути (catch при ошибке показа «Готово»).
redirect_ok <"$TMP/index.html" || fail "в index.html есть переход на thank-you.html вне запасного пути (всего/запасных: $(redirect_state <"$TMP/index.html"))"
grep -q "location.href=FALLBACK" "$TMP/index.html" || fail "в index.html нет запасного пути окна"
grep -q 'id="tpl-done"' "$TMP/index.html" || fail "в index.html нет шаблона окна «Готово»"

( cd "$TMP" && find index.html thank-you.html efir.js assets -type f | sort ) > "$TMP/files.list"
# страницы последними
{ grep -v -E '^(index\.html|thank-you\.html|efir\.js)$' "$TMP/files.list" || true; echo efir.js; echo index.html; echo thank-you.html; } > "$TMP/order.list"

echo "== бэкап заменяемых файлов в $B"
mkdir -p "$B"
: > "$B/added.list"
while IFS= read -r f; do
  if [[ -f "$W/$f" ]]; then
    install -D -m 644 "$W/$f" "$B/$f"
  else
    echo "$f" >> "$B/added.list"
  fi
done < "$TMP/order.list"
cp "$TMP/order.list" "$B/files.list"
echo "заменяется: $(grep -c . "$B/files.list") файлов, новых: $(grep -c . "$B/added.list" || true)"

echo "== откат заранее: $ROLLBACK_DIR/rollback-workshop-landing-$TS.sh"
mkdir -p "$ROLLBACK_DIR"
cat >"$ROLLBACK_DIR/rollback-workshop-landing-$TS.sh" <<ROLLBACK
#!/usr/bin/env bash
# Откат выкладки лендинга $TS: возвращает старые файлы и убирает те, которых раньше не было.
set -e
while IFS= read -r f; do
  [ -f "$B/\$f" ] && install -D -m 644 "$B/\$f" "$W/\$f"
done < "$B/files.list"
while IFS= read -r f; do
  [ -n "\$f" ] && rm -f "$W/\$f"
done < "$B/added.list"
echo ROLLBACK_OK
ROLLBACK
chmod 700 "$ROLLBACK_DIR/rollback-workshop-landing-$TS.sh"
bash -n "$ROLLBACK_DIR/rollback-workshop-landing-$TS.sh"

echo "== замена файлов: по одному через временное имя и mv, страницы последними"
place() {
  local f="$1" dst="$W/$1"
  local tmpn="$dst.new.$TS"
  mkdir -p "$(dirname "$dst")"
  install -m 644 "$TMP/$f" "$tmpn"
  [[ -z "$OWNER" ]] || chown "$OWNER" "$tmpn"
  mv -f "$tmpn" "$dst"
}
while IFS= read -r f; do place "$f"; echo "  $f"; done < "$TMP/order.list"
if [[ -n "$OWNER" ]]; then
  # каталоги, созданные при выкладке (assets/js), тоже отдаём владельцу сайта
  while IFS= read -r f; do d="$(dirname "$f")"; [[ "$d" == "." ]] || chown "$OWNER" "$W/$d" 2>/dev/null || true; done < "$TMP/order.list"
fi

echo "== проверки снаружи ($BASE_URL)"
code() { curl -s -o /dev/null -w '%{http_code}' -m 10 "$1"; }
ERR=0
chk() { # название, условие
  if [[ "$2" == "ok" ]]; then echo "  ок   $1"; else echo "  FAIL $1"; ERR=1; fi
}
c1="$(code "$BASE_URL/")"
c2="$(code "$BASE_URL/thank-you.html")"
chk "лендинг отвечает 200 ($c1)" "$([[ "$c1" == 200 ]] && echo ok || echo no)"
chk "«Спасибо» отвечает 200 ($c2)" "$([[ "$c2" == 200 ]] && echo ok || echo no)"
LIVE="$(curl -s -m 10 "$BASE_URL/" || true)"
chk "в index.html нет перехода на thank-you.html вне запасного пути" "$([[ -n "$LIVE" ]] && redirect_ok <<<"$LIVE" && echo ok || echo no)"
chk "в index.html свежие ?v=$V у efir.js и join.js" "$([[ "$LIVE" == *"efir.js?v=$V"* && "$LIVE" == *"assets/js/join.js?v=$V"* ]] && echo ok || echo no)"
chk "в index.html есть окно «Готово» (tpl-done)" "$([[ "$LIVE" == *'id="tpl-done"'* ]] && echo ok || echo no)"
JS="$(curl -s -m 10 -D "$TMP/join.hdr" "$BASE_URL/assets/js/join.js?v=$V" || true)"
chk "join.js отдаётся (200, window.Join)" "$([[ "$JS" == *"window.Join"* && "$(head -1 "$TMP/join.hdr" 2>/dev/null)" == *" 200"* ]] && echo ok || echo no)"
EF="$(curl -s -m 10 "$BASE_URL/efir.js?v=$V" || true)"
chk "efir.js новый (relDate, EFIR.fill(узел))" "$([[ "$EF" == *"relDate"* && "$EF" == *"calendarHref"* ]] && echo ok || echo no)"
TY="$(curl -s -m 10 "$BASE_URL/thank-you.html" || true)"
chk "thank-you.html подключает join.js?v=$V" "$([[ "$TY" == *"assets/js/join.js?v=$V"* ]] && echo ok || echo no)"
for img in bonus-referensy-prev.jpg bonus-virusny-prev.jpg bonus-plan-prev.jpg bonus-hooks-prev.jpg karta-6-referensov.pdf; do
  ci="$(code "$BASE_URL/assets/bonus/$img")"
  chk "assets/bonus/$img ($ci)" "$([[ "$ci" == 200 ]] && echo ok || echo no)"
done

echo
echo "Откат: bash $ROLLBACK_DIR/rollback-workshop-landing-$TS.sh"
if (( ERR )); then
  echo "ЕСТЬ FAIL в проверках: откатить командой выше или разобраться. DEPLOY_FAIL $TS"
  exit 1
fi
rm -f "$PKG"
echo "DEPLOY_OK $TS"
