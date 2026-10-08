#!/usr/bin/env bash
# Обновление Evolution API 2.3.7 на сервере: накладывает патч сообществ (communities.patch) и пересобирает.
#
# Запуск от root:
#   bash install.sh             установить патч (повторный запуск безопасен)
#   bash install.sh --force     пересобрать, даже если этот патч уже стоит
#   bash install.sh rollback    вернуть предыдущую версию из бэкапа
#   bash install.sh status      что стоит сейчас
#
# Скрипт обновляет уже установленный /opt/evolution (его ставит first-install.sh) и не трогает базу.
# Файл .env, папки instances и store переносятся в новую версию как есть, пока процесс остановлен.
# Новая версия собирается рядом (/opt/evolution.build.<время>), старая папка уходит в /opt/evolution.bak.<время>.
# Рядом со скриптом должен лежать communities.patch.
# Переменные EVO_* нужны только для проверки скрипта на подставном окружении.
set -euo pipefail

APP="${EVO_APP:-/opt/evolution}"
APP_USER="${EVO_USER:-onaiapp}"
PM2_NAME="${EVO_PM2_NAME:-evolution}"
TAG="2.3.7"
# Коммит тега 2.3.7: если тег кто-то переставил, скрипт остановится.
EXPECTED_COMMIT="cd800f2976e1e5b682fbf86a01ee4d85ae61f370"
REPO="${EVO_REPO:-https://github.com/EvolutionAPI/evolution-api}"
HEALTH_URL="${EVO_HEALTH_URL:-http://127.0.0.1:8080}"
KEEP_BACKUPS="${EVO_KEEP_BACKUPS:-1}"
HEALTH_TRIES="${EVO_HEALTH_TRIES:-60}"
HEALTH_SLEEP="${EVO_HEALTH_SLEEP:-2}"
MIN_MEM_MB="${EVO_MIN_MEM_MB:-1200}"
LOCK_FILE="${EVO_LOCK:-/var/lock/evolution-install.lock}"
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCH="${EVO_PATCH:-$SELF_DIR/communities.patch}"
STATE_ITEMS=(.env instances store)
MARKER=".communities-patch.sha256"
STAMP="$(date +%Y%m%d-%H%M%S)"
BUILD_LOG="/tmp/evo-build-$STAMP.log"

WORK=""
BACKUP=""
PATCH_COPY=""
FAILED_DIR=""
FORCE=0
CMD="install"

log() { echo "== $(date '+%F %T') $*"; }
warn() { echo "!! $(date '+%F %T') $*" >&2; }
die() { echo "СТОП: $*" >&2; exit 1; }

as_app() { runuser -u "$APP_USER" -- "$@"; }
pm2u() { runuser -u "$APP_USER" -- env PM2_HOME="/home/$APP_USER/.pm2" pm2 "$@"; }

cleanup() {
  if [[ -n "$WORK" && "$WORK" == "$APP".build.* && -d "$WORK" ]]; then
    rm -rf -- "$WORK"
  fi
  if [[ -n "$PATCH_COPY" && -f "$PATCH_COPY" ]]; then
    rm -f -- "$PATCH_COPY"
  fi
}
trap cleanup EXIT

# Evolution отвечает на GET / своей версией.
wait_health() {
  local tries="${1:-60}" i body
  for ((i = 1; i <= tries; i++)); do
    body="$(curl -fsS -m 10 "$HEALTH_URL/" 2>/dev/null || true)"
    if [[ "$body" == *"\"version\":\"$TAG\""* ]]; then
      return 0
    fi
    sleep "$HEALTH_SLEEP"
  done
  return 1
}

# Маршруты сообществ подключены, если неизвестный инстанс даёт ответ guard-а, а не 404 "Cannot GET".
routes_ready() {
  local body
  body="$(curl -sS -m 10 "$HEALTH_URL/community/info/probe-no-such-instance?communityJid=1@g.us" 2>/dev/null || true)"
  [[ "$body" == *"does not exist"* ]]
}

current_marker() {
  cat "$APP/$MARKER" 2>/dev/null || true
}

list_backups() {
  ls -d "$APP".bak.* 2>/dev/null | sort || true
}

need_root_and_lock() {
  [[ "$(id -u)" == "0" ]] || die "запускайте от root"
  exec 9>"$LOCK_FILE"
  flock -n 9 || die "уже идёт другой запуск install.sh"
}

preflight() {
  [[ -d "$APP" ]] || die "$APP нет: сначала first-install.sh"
  [[ -f "$APP/.env" ]] || die "нет $APP/.env, обновлять нечего"
  [[ -f "$PATCH" ]] || die "нет файла патча $PATCH"
  id "$APP_USER" >/dev/null 2>&1 || die "нет пользователя $APP_USER"

  local c
  for c in git npm npx node curl flock sha256sum runuser; do
    command -v "$c" >/dev/null 2>&1 || die "нет команды $c"
  done

  local node_major
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  [[ "$node_major" -ge 20 ]] || die "нужен Node 20 или новее, стоит $(node -v)"
  as_app node -v >/dev/null 2>&1 || die "пользователь $APP_USER не видит node"
  pm2u describe "$PM2_NAME" >/dev/null 2>&1 || die "в pm2 пользователя $APP_USER нет процесса $PM2_NAME"

  local installed
  installed="$(node -p "require('$APP/package.json').version" 2>/dev/null || true)"
  [[ "$installed" == "$TAG" ]] || die "на сервере Evolution $installed, скрипт рассчитан на $TAG"

  if ! grep -q '^TELEMETRY_ENABLED=false' "$APP/.env"; then
    warn "в $APP/.env нет TELEMETRY_ENABLED=false: Evolution будет слать телеметрию"
  fi
}

# Память и диск проверяются только перед настоящей сборкой.
check_resources() {
  local mem_mb free_mb app_mb need_mb
  mem_mb="$(awk '/^MemAvailable:/ {printf "%d", $2 / 1024}' /proc/meminfo 2>/dev/null || true)"
  if [[ -n "$mem_mb" && "$mem_mb" -lt "$MIN_MEM_MB" ]]; then
    die "мало свободной памяти: ${mem_mb} МБ, нужно хотя бы ${MIN_MEM_MB} МБ"
  fi

  app_mb="$(du -sm "$APP" | cut -f1)"
  free_mb="$(df -Pm "$(dirname "$APP")" | awk 'NR == 2 {print $4}')"
  need_mb=$((app_mb + 500))
  if [[ "$free_mb" -lt "$need_mb" ]]; then
    die "мало места на диске: свободно ${free_mb} МБ, нужно ${need_mb} МБ (папка ${app_mb} МБ). Старые бэкапы: $(list_backups | tr '\n' ' ')"
  fi
}

# Вернуть папку из бэкапа. Свежие .env, instances и store переезжают назад вместе с процессом.
restore_from_backup() {
  local bk="$1" failed="$APP.failed.$STAMP" item
  [[ -d "$bk" ]] || return 1

  pm2u stop "$PM2_NAME" >/dev/null 2>&1 || true
  if [[ -e "$APP" ]]; then
    mv "$APP" "$failed" || return 1
    for item in "${STATE_ITEMS[@]}"; do
      if [[ -e "$failed/$item" ]]; then
        rm -rf -- "${bk:?}/$item"
        cp -a "$failed/$item" "$bk/$item" || return 1
      fi
    done
    FAILED_DIR="$failed"
  fi
  mv "$bk" "$APP" || return 1
  pm2u restart "$PM2_NAME" >/dev/null || return 1
  wait_health "$HEALTH_TRIES"
}

# Замена папки. Шаг записывается, чтобы откат знал, что уже сделано.
SWAP_STAGE=0
swap_in() {
  local item
  pm2u stop "$PM2_NAME" >/dev/null || return 1
  mv "$APP" "$BACKUP" || return 1
  SWAP_STAGE=1
  mv "$WORK" "$APP" || return 1
  SWAP_STAGE=2
  WORK=""
  for item in "${STATE_ITEMS[@]}"; do
    if [[ -e "$BACKUP/$item" ]]; then
      rm -rf -- "${APP:?}/$item"
      cp -a "$BACKUP/$item" "$APP/$item" || return 1
    fi
  done
  pm2u restart "$PM2_NAME" >/dev/null || return 1
}

auto_rollback() {
  if [[ "$SWAP_STAGE" == "0" ]]; then
    # Папки ещё не двигали: старая версия на месте, остановленный процесс просто запускаем.
    pm2u restart "$PM2_NAME" >/dev/null 2>&1 || true
    wait_health "$HEALTH_TRIES"
  elif [[ "$SWAP_STAGE" == "1" ]]; then
    # Старую папку убрали, новую поставить не успели.
    mv "$BACKUP" "$APP" || return 1
    pm2u restart "$PM2_NAME" >/dev/null 2>&1 || return 1
    wait_health "$HEALTH_TRIES"
  else
    restore_from_backup "$BACKUP"
  fi
}

do_install() {
  need_root_and_lock
  preflight

  local patch_sha
  patch_sha="$(sha256sum "$PATCH" | cut -d' ' -f1)"

  if [[ "$(current_marker)" == "$patch_sha" && "$FORCE" == "0" ]]; then
    log "патч ${patch_sha:0:12} уже стоит, пересборка не нужна (--force пересоберёт)"
    if wait_health 5 && routes_ready; then
      log "Evolution отвечает, маршруты сообществ подключены"
      echo "EVO_PATCH_OK $(date '+%F %T') без изменений"
      return 0
    fi
    die "патч стоит, но Evolution не отвечает или маршрутов нет: смотрите pm2 logs $PM2_NAME или запустите с --force"
  fi

  check_resources

  local grp
  grp="$(id -gn "$APP_USER")"
  WORK="$APP.build.$STAMP"
  BACKUP="$APP.bak.$STAMP"
  PATCH_COPY="$(mktemp /tmp/evo-communities.XXXXXX)"
  cp -- "$PATCH" "$PATCH_COPY"
  chmod 644 "$PATCH_COPY"

  log "клон $TAG в $WORK"
  install -d -o "$APP_USER" -g "$grp" "$WORK"
  as_app git clone -q --depth 1 --branch "$TAG" "$REPO" "$WORK"
  local commit
  commit="$(as_app git -C "$WORK" rev-parse HEAD)"
  if [[ "$commit" != "$EXPECTED_COMMIT" ]]; then
    die "тег $TAG указывает на $commit, ожидался $EXPECTED_COMMIT: тег переставлен, проверьте вручную"
  fi

  log "патч ${patch_sha:0:12}"
  as_app git -C "$WORK" apply --check "$PATCH_COPY" || die "патч не накладывается на чистый $TAG"
  as_app git -C "$WORK" apply "$PATCH_COPY"

  # .env нужен Prisma для миграций; в рабочую версию он ещё раз копируется при замене.
  install -m 600 -o "$APP_USER" -g "$grp" "$APP/.env" "$WORK/.env"

  log "npm ci"
  (cd "$WORK" && as_app npm ci --no-audit --no-fund --loglevel=error)

  log "prisma generate и migrate deploy (для 2.3.7 новых миграций нет)"
  (cd "$WORK" && as_app env DATABASE_PROVIDER=postgresql npm run -s db:generate)
  (cd "$WORK" && as_app env DATABASE_PROVIDER=postgresql npm run -s db:deploy) 2>&1 | tail -n 5

  log "сборка tsup (лог $BUILD_LOG)"
  if ! (cd "$WORK" && as_app env NODE_OPTIONS=--max-old-space-size=1536 npx tsup) >"$BUILD_LOG" 2>&1; then
    tail -n 30 "$BUILD_LOG" >&2
    die "сборка упала, старая версия не тронута"
  fi
  [[ -s "$WORK/dist/main.js" ]] || die "в сборке нет dist/main.js, старая версия не тронута"
  [[ -d "$WORK/dist/translations" ]] || die "в сборке нет dist/translations, старая версия не тронута"
  grep -q 'joinApprovalMode' "$WORK/dist/main.js" || die "в сборке нет маршрутов сообществ, старая версия не тронута"

  log "остановка pm2, замена $APP, запуск"
  if ! swap_in || ! wait_health "$HEALTH_TRIES" || ! routes_ready; then
    warn "новая версия не поднялась, возвращаю прежнюю"
    if auto_rollback; then
      die "обновление не удалось, прежняя версия возвращена и отвечает. Проверьте: pm2 logs $PM2_NAME, ${FAILED_DIR:-$APP.failed.$STAMP}"
    fi
    die "ОТКАТ ТОЖЕ НЕ УДАЛСЯ. Бэкап прежней версии: $BACKUP. Нужен ручной разбор"
  fi

  echo "$patch_sha" >"$APP/$MARKER"
  chown "$APP_USER:$grp" "$APP/$MARKER"

  local old
  while IFS= read -r old; do
    [[ -n "$old" ]] || continue
    log "удаляю старый бэкап $old"
    rm -rf -- "$old"
  done < <(list_backups | head -n "-$KEEP_BACKUPS")

  log "готово"
  echo "версия: $TAG, коммит ${commit:0:12}, патч ${patch_sha:0:12}"
  echo "бэкап прежней версии: $BACKUP"
  echo "откат одной командой: bash $SELF_DIR/install.sh rollback"
  echo "EVO_PATCH_OK $(date '+%F %T')"
}

do_rollback() {
  need_root_and_lock
  [[ -d "$APP" ]] || die "$APP нет"
  command -v runuser >/dev/null 2>&1 || die "нет команды runuser"
  local latest
  latest="$(list_backups | tail -n 1)"
  [[ -n "$latest" ]] || die "бэкапов нет, откатывать не к чему"
  log "откат на $latest"
  if restore_from_backup "$latest"; then
    log "прежняя версия возвращена и отвечает"
    echo "версия с патчем осталась в ${FAILED_DIR:-$APP.failed.$STAMP}: удалите её командой rm -rf, когда не понадобится"
    echo "EVO_ROLLBACK_OK $(date '+%F %T')"
  else
    die "откат не удался. Папка $latest не удалена, нужен ручной разбор"
  fi
}

do_status() {
  [[ -d "$APP" ]] || die "$APP нет"
  local patch_sha=""
  [[ -f "$PATCH" ]] && patch_sha="$(sha256sum "$PATCH" | cut -d' ' -f1)"
  echo "папка: $APP"
  echo "версия: $(node -p "require('$APP/package.json').version" 2>/dev/null || echo неизвестна)"
  local marker
  marker="$(current_marker)"
  echo "стоит патч: ${marker:-нет}"
  echo "патч рядом со скриптом: ${patch_sha:-нет файла}"
  echo "бэкапы: $(list_backups | tr '\n' ' ')"
  if wait_health 1; then echo "Evolution отвечает"; else echo "Evolution НЕ отвечает"; fi
  if routes_ready; then echo "маршруты сообществ подключены"; else echo "маршрутов сообществ нет"; fi
}

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    install | rollback | status) CMD="$arg" ;;
    -h | --help) sed -n '2,12p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) die "неизвестный аргумент: $arg (install, rollback, status, --force)" ;;
  esac
done

case "$CMD" in
  install) do_install ;;
  rollback) do_rollback ;;
  status) do_status ;;
esac
