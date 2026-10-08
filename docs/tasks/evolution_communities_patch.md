# ТЗ: патч сообществ к Evolution API 2.3.7 (этап A2 плана)

План целиком: `docs/plans/wa-communities-plan.md`, раздел «Этап A» и «Контракт патча». Работаешь в `C:\Проекты\wt-wa`, ветка `feat/wa-groups`. Не коммитить, не пушить, ничего не ставить на сервер и не подключать к настоящему WhatsApp.

## Что сделать

1. Склонировать Evolution API тега `2.3.7` в `C:\Проекты\_evo\evolution-api`: `git clone --depth 1 --branch 2.3.7 https://github.com/EvolutionAPI/evolution-api`. Зависимости ставить в этой папке. Если npm ставит долго, это нормально.
2. Изучить, как устроены маршруты групп:
   - `src/api/routes/group.router.ts`;
   - контроллер групп;
   - DTO и схемы валидации (`src/validate`);
   - методы групп в сервисе Baileys (`src/api/integrations/channel/whatsapp/whatsapp.baileys.service.ts`, где `this.client` это сокет Baileys);
   - подключение роутера в `src/api/routes/index.router.ts`;
   - проверка ключа и инстанса.

   Делай новые маршруты по тому же образцу.
3. Сделать маршруты сообществ строго по контракту из плана: `community/create`, `info`, `inviteCode`, `revokeInvite`, `updateSetting`, `memberAddMode`, `joinApprovalMode`, `requests` (GET и POST).
   - `create` не вызывает `communityCreate` Baileys как есть: там включены подгруппы от участников и общий чат. Нужен свой IQ-запрос по образцу `communityCreate` из `node_modules/baileys/lib/Socket/communities.js` (или исходника rc.9):
     - тег `create` с `subject`;
     - `description` с `body`;
     - `parent` с `default_membership_approval_mode: 'request_required'`, только если `approvalRequired`;
     - БЕЗ `allow_non_admin_sub_group_creation` и БЕЗ `create_general_chat`.
   - После создания найти JID вкладки объявлений: в метаданных привязанных групп признак `isCommunityAnnounce` (`default_sub_community`) или через `communityFetchLinkedGroups`. Вернуть `{communityJid, announcementJid}`.
   - `requests` GET возвращает исходные атрибуты заявок как есть (jid, phone_number, request_time и что придёт). Это нужно, чтобы на живом номере понять, приходит ли номер телефона или LID.
   - Ошибки WhatsApp отдавать понятным текстом с кодом 400/500, как в маршрутах групп.
4. Сборка в клоне: `npx tsc --noEmit` без новых ошибок и `npx tsup` (или `npm run build`). Проверить, что новые маршруты попали в `dist`.
5. Сделать патч: `git diff` от тега в `C:\Проекты\wt-wa\infra\evolution\communities.patch`. Проверить, что он чисто накладывается на свежий клон тега (`git apply --check`).
6. Скрипт установки `C:\Проекты\wt-wa\infra\evolution\install.sh` для сервера (Ubuntu, Node 20, PostgreSQL 17 и Redis уже стоят; запуск от root; повторный запуск безопасен; обновляет уже установленный `/opt/evolution`, не теряя базу и сессию):
   - клон тега 2.3.7 во временную папку;
   - `git apply` патча;
   - `npm ci`;
   - `npm run db:generate` и `db:deploy` с `DATABASE_PROVIDER=postgresql`;
   - сборка `npx tsup` с `NODE_OPTIONS=--max-old-space-size=1536`, памяти на сервере около 2,7 ГБ;
   - замена `/opt/evolution` с сохранением `.env` и бэкапом старой папки;
   - `pm2 restart evolution` под пользователем `onaiapp` (`runuser -u onaiapp -- env PM2_HOME=/home/onaiapp/.pm2 pm2 ...`);
   - проверка `GET http://127.0.0.1:8080/` и откат одной командой.
   - База и `.env` уже созданы на сервере. Скрипт их не трогает, только проверяет, что `.env` есть.
7. В `infra/evolution/README.md` коротко: что патч добавляет, контракт, как обновлять, как откатить.

## Отчёт (коротко)

- файлы;
- что проверено по исходникам (пути, имена методов Baileys rc.9, как найден JID вкладки объявлений);
- результат `tsc` и сборки;
- что можно проверить только на живом номере.
