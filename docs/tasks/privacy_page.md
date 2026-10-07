# ТЗ: страница политики конфиденциальности воркшопа и команда /privacy в боте

Репозиторий `C:\Проекты\wt-funnel`. Не коммитить, не пушить, на сервер не ходить, localhost не трогать.

## 1. Страница `workshop-montazh/privacy.html`

- Текст строго из `docs/legal/privacy-workshop-2026-10.md`, слово в слово (заголовки разделов, списки, жирные подзаголовки). Ничего не добавлять и не сокращать.
- Оформление как у `workshop-montazh/thank-you.html`: те же шрифты, цвета, шапка с логотипом и ссылкой «на главную» (`./`), подвал. Читаемая колонка до 720px, на телефоне 360px без горизонтальной прокрутки.
- `<title>Политика конфиденциальности · воркшоп «Вайб-продакшен»</title>`, `<meta name="robots" content="index,follow">`, `lang="ru"`.
- Без длинного тире, без внешних скриптов кроме тех, что уже есть на thank-you (пиксель на этой странице не нужен, лучше без него).
- Адрес страницы на сайте будет `https://onai.academy/workshop-montazh/privacy` (nginx отдаёт `$uri.html`).

## 2. Ссылки на политику

- `workshop-montazh/index.html`: обе ссылки `https://onai.academy/privacy` (строки около 682 и 701, подвал и галочка согласия в форме) заменить на `https://onai.academy/workshop-montazh/privacy`.
- Если в `thank-you.html`, `assets/js/join.js` или шаблоне окна записи есть ссылка на политику, заменить так же. Если нет, в подвал `thank-you.html` добавить ссылку «Политика конфиденциальности».

## 3. Бот: команда /privacy

- В `form-api/tg-workshop.ts`: команда `/privacy` для всех пользователей отвечает одной строкой «Политика конфиденциальности: https://onai.academy/workshop-montazh/privacy» (ссылку вынести в функцию `privacyUrl()` с переопределением через env `PRIVACY_URL`, как `adminAppUrl`).
- Ответ на любое другое сообщение (текст `other` в `tg-series.json` не трогать) оставить как есть.
- Тест в `form-api/tg.test.ts`: /privacy отвечает ссылкой и пользователю, и владельцу.
- Тесты как обычно: `npx esbuild form-api/tg.test.ts --bundle --platform=node --target=node20 --format=cjs --outfile=<tmp>/tg.test.js`, затем `TZ=UTC node --test <tmp>` и `TZ=America/Los_Angeles node --test <tmp>`. Нужен `node_modules`: junction на `C:\Проекты\webinar-oneday-landing\node_modules`, после удалить только junction. Всё зелёное.
- Пересобрать `form-api/dist/server.js`: `npx esbuild form-api/server.ts --bundle --platform=node --format=cjs --target=node20 --outfile=form-api/dist/server.js`.

## 4. Проверка

Снимок страницы политики (телефон 390×844 и компьютер 1280×800) скриптом Playwright в scratchpad
`C:\Users\smmmc\AppData\Local\Temp\claude\C----------------------claude-worktrees-vibe-production-deck-wave2-ff7437\4f4febb1-a769-4a9d-aa47-6a48bc061f8d\scratchpad\`,
посмотреть глазами. Замок для снимков: `powershell -NoProfile -File C:\Проекты\_общее\heavy.ps1 take -who "Вебинар" -what "снимки политики"`, потом release.

## Отчёт (коротко)

Изменённые файлы, тесты N/N, пути к снимкам.
