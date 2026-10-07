# Запуск на MacBook (для агента)

Состояние на 07.10.2026, 19:40 по Алматы. Ветка `main` собрана из двух рабочих веток и содержит всё:

| Что | Откуда пришло | Где лежит |
|---|---|---|
| Презентация эфира «Вайб-продакшен» (ночное стекло, блок Vibe Coding PRO и пакет двух курсов, свежий скрин профиля 16,7 тыс., без OPUS.CLUB) | `glass/deck-1006` | `components/montage-deck/`, страница `/montage` |
| Воронка воркшопа: лендинг, «Спасибо», политика, короткие ссылки | `fix/lead-redirect-whatsapp` | `workshop-montazh/` |
| Telegram-бот @workshop_aiprod_bot и админка (Mini App) | `fix/lead-redirect-whatsapp` | `form-api/` (тесты `form-api/tg.test.ts`) |
| Цепочка рассылок (Telegram, WhatsApp, чат Bizon, ответы менеджера) | `fix/lead-redirect-whatsapp` | `docs/mailings/chain-v2.json`, таблица Google Sheets (ссылка в памяти «Вебинар») |
| Продающие PDF: Vibe Production, Vibe Coding PRO, два курса | `fix/lead-redirect-whatsapp` | `docs/sales-decks/` (исходники `index.html`, сборка `build_pdf.py`, готовые `pdf/`) |
| Задания исполнителям и решения | обе | `docs/tasks/`, `docs/copy/` |

Старые ветки (`glass/deck-1006`, `deck-wave2`, `fix/lead-redirect-whatsapp`) остаются как были. Новая работа идёт в `main`.

## Первый запуск

```bash
git clone https://github.com/saint4ai/webinar-oneday-landing.git
cd webinar-oneday-landing
git checkout main
npm ci
```

## Презентация эфира

Ночная (стеклянная) версия, которую показываем на эфире:

```bash
WEBINAR_LOCAL=1 NEXT_DIST_DIR=.next-glass npx next build
WEBINAR_LOCAL=1 NEXT_DIST_DIR=.next-glass npx next start -p 3003
```

Открыть `http://localhost:3003/montage`. Переключатель стиля: `GLASS` в `components/montage-deck/theme.ts` (true ночная, false светлая).
Сборка `next build` тяжёлая: на Windows-машине действует правило «один тяжёлый процесс за раз», на маке следите за нагрузкой сами.

Цены в одном месте: `components/montage-deck/prices.ts` (Vibe Production 150 000 ₸ вместо 250 000 ₸, PRO Solo 220 000 ₸, Pro 290 900 ₸, пакет 390 000 ₸ вместо 440 900 ₸).

## Правила, которые нельзя потерять

- Не трогать `components/montage-deck/slides/intro.tsx`, `components/montage-deck/fx/`, `CoverTunnel.tsx`, `app/sales-deck` (их ведут другие сессии).
- Правые 40% кадра на слайдах эфира пустые: там камера ведущего.
- The One System в рассылках, PDF и креативах не упоминаем (NDA). В презентации эфира кейс One System пока остался (экран урока), решение по нему за Александром.
- OPUS.CLUB не существует, нигде не писать.
- Цифры только с источником. Без длинного тире.

## Бот и лендинг (сервер 5.35.107.129)

Выкладка только скриптами: `scripts/deploy-form-api.sh` (код бота, пробный запуск на 4011, не в 19:30–21:30 по Алматы), `scripts/deploy-landing.sh` (статика лендинга).
SSH-ключ на маке свой (на Windows был `~/.ssh/onai_codex_windows`). Тесты бота:

```bash
npx esbuild form-api/tg.test.ts --bundle --platform=node --target=node20 --format=cjs --outfile=/tmp/tg.test.js
TZ=UTC node --test /tmp/tg.test.js
```
