#!/usr/bin/env bash
# Запуск презентации (sales-deck) для вебинара — прод на localhost:3001.
# ВСЕГДА собирает начисто (rm -rf .next) — так билд гарантированно не битый,
# даже если кто-то гонял next dev. Сборка ~1 минуту, делается разово перед показом.
#
#   ./webinar.sh
#
# Открыть в браузере:  http://localhost:3001/montage      (эфир Vibe Production, 01.10)
#                       http://localhost:3001/webinar-60   (часовая)
#                       http://localhost:3001/sales-deck   (трёхчасовая)
# Остановить:          Ctrl+C
set -e

cd "/Users/miso/Desktop/onAI-Workspace/projects/webinar_oneday/landing"
PORT=3001
URL="http://localhost:$PORT/webinar-60"
URL_FULL="http://localhost:$PORT/sales-deck"
URL_MONTAGE="http://localhost:$PORT/montage"

# 1) Освободить порт 3001
echo "→ Освобождаю порт $PORT ..."
PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
[ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null || true
pkill -f "next start -p $PORT" 2>/dev/null || true
pkill -f "next dev -p $PORT"   2>/dev/null || true
sleep 1

# 1б) Зависимости: если node_modules пропали (например, после очистки диска) — ставим по lock-файлу
if [ ! -x node_modules/.bin/next ]; then
  echo "→ Нет зависимостей, ставлю по package-lock.json ..."
  npm ci --no-audit --no-fund --loglevel=error
fi

# 2) Чистая прод-сборка (всегда с нуля)
echo "→ Собираю прод начисто (~1 минута)..."
rm -rf .next
WEBINAR_LOCAL=1 npm run build

# 3) Поднять сервер
echo ""
echo "═════════════════════════════════════════════════"
echo "  ПРЕЗЕНТАЦИЯ ГОТОВА"
echo "  Часовая дека:       $URL"
echo "  Трёхчасовая дека:   $URL_FULL"
echo "  Vibe Production:    $URL_MONTAGE"
echo "  Остановить сервер:  Ctrl + C"
echo "═════════════════════════════════════════════════"
echo ""
WEBINAR_LOCAL=1 npx next start -p $PORT
