#!/usr/bin/env bash
# Первая установка Evolution API 2.3.7 (без патча сообществ) на 5.35.107.129.
# Запуск от root: nohup bash first-install.sh > /root/evo-install.log 2>&1 &
# Ключ API и пароль базы генерируются здесь и живут только в /opt/evolution/.env (chmod 600).
# Обновление и патч сообществ ставит infra/evolution/install.sh.
set -euo pipefail
D=/opt/evolution
TAG=2.3.7
PM2="runuser -u onaiapp -- env PM2_HOME=/home/onaiapp/.pm2 pm2"
[[ -e "$D" ]] && { echo "СТОП: $D уже есть, для обновления install.sh"; exit 1; }

echo "== $(date '+%F %T') клон $TAG"
git clone -q --depth 1 --branch "$TAG" https://github.com/EvolutionAPI/evolution-api "$D"

echo "== база"
PW="$(openssl rand -hex 16)"
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='evolution'" | grep -q 1; then
  sudo -u postgres psql -q -c "ALTER ROLE evolution WITH LOGIN PASSWORD '$PW'"
else
  sudo -u postgres psql -q -c "CREATE ROLE evolution WITH LOGIN PASSWORD '$PW'"
fi
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='evolution'" | grep -q 1 || sudo -u postgres createdb -O evolution evolution

echo "== .env"
KEY="$(openssl rand -hex 24)"
cat > "$D/.env" <<ENV
SERVER_NAME=evolution
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://127.0.0.1:8080
TELEMETRY_ENABLED=false
CORS_ORIGIN=http://127.0.0.1
LOG_LEVEL=ERROR,WARN,INFO
LOG_COLOR=false
LOG_BAILEYS=error
DEL_INSTANCE=false
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:${PW}@127.0.0.1:5432/evolution?schema=evolution_api
DATABASE_CONNECTION_CLIENT_NAME=evolution_onai
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false
DATABASE_SAVE_DATA_LABELS=false
DATABASE_SAVE_DATA_HISTORIC=false
DATABASE_SAVE_IS_ON_WHATSAPP=false
DATABASE_DELETE_MESSAGE=false
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://127.0.0.1:6379/7
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_SAVE_INSTANCES=false
CACHE_LOCAL_ENABLED=false
WEBHOOK_GLOBAL_ENABLED=false
CONFIG_SESSION_PHONE_CLIENT=onAI
CONFIG_SESSION_PHONE_NAME=Chrome
QRCODE_LIMIT=30
AUTHENTICATION_API_KEY=${KEY}
LANGUAGE=en
ENV
chmod 600 "$D/.env"
chown -R onaiapp:onaiapp "$D"

cd "$D"
echo "== $(date '+%F %T') npm ci"
runuser -u onaiapp -- npm ci --no-audit --no-fund --loglevel=error
echo "== $(date '+%F %T') prisma"
runuser -u onaiapp -- env DATABASE_PROVIDER=postgresql npm run -s db:generate
runuser -u onaiapp -- env DATABASE_PROVIDER=postgresql npm run -s db:deploy
echo "== $(date '+%F %T') сборка"
runuser -u onaiapp -- env NODE_OPTIONS=--max-old-space-size=1536 npx tsup
ls -la dist/main.js

echo "== $(date '+%F %T') pm2"
$PM2 start dist/main.js --name evolution --cwd "$D" --time >/dev/null
$PM2 save >/dev/null
for i in $(seq 1 30); do curl -fsS -m 2 http://127.0.0.1:8080/ >/dev/null 2>&1 && break; sleep 2; done
curl -s -m 3 http://127.0.0.1:8080/ | head -c 300; echo
echo "Откат: $PM2 delete evolution; база evolution и папка $D остаются"
echo "EVO_INSTALL_OK $(date '+%F %T')"
