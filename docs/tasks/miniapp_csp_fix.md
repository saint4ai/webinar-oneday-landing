# ТЗ: мини-приложение админки не видит Telegram (скрипт SDK блокируется CSP)

Репозиторий: `C:\Проекты\wt-funnel` (ветка fix/lead-redirect-whatsapp). Работать только тут.
Не коммитить, не пушить, на сервер не ходить: это делает Opus-сессия.

## Причина (проверено 07.10.2026)

Страница `https://onai.academy/workshop/api/admin-app` получает ДВА заголовка Content-Security-Policy:
1. наш из `form-api/tg-miniapp.ts` (`handleAdminApp`): `script-src 'nonce-…' https://telegram.org`;
2. общий от nginx сайта: `script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://www.googletagmanager.com https://cdn.jsdelivr.net https://*.supabase.co`.

Браузер применяет обе политики сразу. Вторая не пускает `https://telegram.org/js/telegram-web-app.js`,
`window.Telegram` не появляется, `initData` пустая, и страница во всех клиентах (телефон, Telegram Desktop)
показывает заставку «Приложение работает только внутри Telegram». nginx не трогаем.

## Что сделать

1. **Скрипт Telegram со своего адреса.**
   - Скрипт `scripts/vendor-tg-sdk.mjs` (Node 20, без зависимостей): скачивает `https://telegram.org/js/telegram-web-app.js`,
     проверяет, что ответ 200 и в тексте есть `WebApp`, и пишет `form-api/tg-webapp-sdk.ts`:
     ```ts
     // Сгенерировано scripts/vendor-tg-sdk.mjs из https://telegram.org/js/telegram-web-app.js, <дата>, sha256 <хеш>.
     // Не править руками: перегенерировать скриптом.
     export const TG_WEBAPP_SDK: string = <JSON.stringify(текст)>;
     ```
     Запустить его один раз, файл закоммитится вместе с кодом.
   - В `form-api/tg-miniapp.ts` функция `handleTgSdk(req, res)`: 200, `Content-Type: application/javascript; charset=utf-8`,
     `Content-Length`, `Cache-Control: public, max-age=86400`, `X-Content-Type-Options: nosniff`; на HEAD без тела.
   - В `form-api/server.ts` маршрут `GET|HEAD /api/tg-web-app.js` → `handleTgSdk` рядом с маршрутом `/api/admin-app`.
     Снаружи он будет `https://onai.academy/workshop/api/tg-web-app.js` (nginx проксирует `/workshop/api/X` → `:4010/api/X`).

2. **Страница `form-api/admin-app.html`.**
   - `<script src="https://telegram.org/js/telegram-web-app.js"></script>` заменить на
     `<script nonce="__NONCE__" src="tg-web-app.js"></script>` (относительный путь: со страницы `/workshop/api/admin-app`
     он даёт `/workshop/api/tg-web-app.js`, в тестах `/api/tg-web-app.js`).
   - Заставка без initData (строки около 726–728): вместо «Приложение работает только внутри Telegram.» написать
     `login-sub`: «Откройте админку в Telegram на телефоне или компьютере.»; сообщение оставить про кнопку «Админка» и /app.
     Без длинного тире.

3. **Наша CSP в `handleAdminApp`.** `script-src 'nonce-${nonce}'` (убрать `https://telegram.org`, он больше не нужен).
   Остальные директивы не менять.

4. **Тесты `form-api/tg.test.ts`.**
   - Поправить проверку, где ищется `src="https://telegram.org/js/telegram-web-app.js"`: теперь скрипт `src="tg-web-app.js"` с `nonce="__NONCE__"`,
     внешних адресов в странице нет. Тест «внешний адрес один» привести к новой правде (внешних адресов ноль).
   - Новый тест: `GET /api/tg-web-app.js` → 200, тип `application/javascript`, тело длиннее 20 000 символов и содержит `WebApp`;
     HEAD без тела; в CSP страницы `script-src` без `https://telegram.org`.
   - Регрессия на причину: в отданном HTML каждый `<script>` с `src` указывает на свой origin (нет `://`) и несёт nonce.
   - Дым-тест на 4110 (уже есть): добавить запрос `/api/tg-web-app.js` → 200.

5. **Сборка и проверка.**
   - `node --test` как сейчас запускаются тесты form-api (смотри, как запускались: `npx tsx --test form-api/tg.test.ts` или по package.json). Нужно всё зелёное.
     Если нет `node_modules` в worktree: временный junction `node_modules` → `C:\Проекты\webinar-oneday-landing\node_modules`,
     после проверки junction удалить (не саму папку!) через `cmd /c rmdir node_modules`.
   - Бандл: `npx esbuild form-api/server.ts --bundle --platform=node --format=cjs --target=node20 --outfile=form-api/dist/server.js`
     (если в репозитории есть другой принятый способ сборки dist/server.js, использовать его). Проверить, что в бандле есть маршрут `tg-web-app.js`.

## Ограничения

- Не трогать nginx, лендинг, презентацию, `tg-series.json`, `.env`.
- Тяжёлых процессов нет (тесты и esbuild не тяжёлые), замок не нужен.
- Секреты и токен бота не печатать.

## Отчёт (коротко)

Список изменённых файлов, итог тестов (N/N), размер `dist/server.js`, sha256 скачанного SDK.
