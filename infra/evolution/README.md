# Evolution API 2.3.7 с патчем сообществ

Evolution 2.3.7 (Baileys 7.0.0-rc.9) умеет только обычные группы. Патч `communities.patch` добавляет маршруты `/community/*` поверх уже открытого сокета Baileys. Старые маршруты не меняются. Версию 2.3.7 пинуем: в 2.4 появились обязательная активация и телеметрия.

## Файлы

| Файл | Зачем |
|---|---|
| `first-install.sh` | первая установка Evolution без патча (уже выполнена) |
| `install.sh` | обновляет `/opt/evolution`: накладывает патч, пересобирает, откатывается |
| `communities.patch` | `git diff` от тега 2.3.7: 5 новых файлов и правки в 4 существующих |
| `check-communities.cjs` | проверка маршрутов и запросов на подставном сокете, без WhatsApp |

## Контракт

Все маршруты стоят за обычными guards Evolution: заголовок `apikey`, инстанс должен существовать. `{instance}` это имя инстанса. `communityJid` можно передать в query или в теле, суффикс `@g.us` добавляется сам. Инстанс должен быть подключён (`open`) и работать на Baileys.

| Маршрут | Тело | Ответ |
|---|---|---|
| `POST /community/create/{instance}` | `{subject, description?, approvalRequired?}` | 201 `{communityJid, announcementJid, announcementSource, warning?}` |
| `GET /community/info/{instance}?communityJid=&participants=true` | | 200, метаданные, `linkedGroups[]`, `announcementJid` |
| `GET /community/inviteCode/{instance}?communityJid=` | | 200 `{inviteUrl, inviteCode}` |
| `POST /community/revokeInvite/{instance}?communityJid=` | | 201 `{revoked, inviteUrl, inviteCode}` |
| `POST /community/updateSetting/{instance}?communityJid=` | `{action}`: `announcement`, `not_announcement`, `locked`, `unlocked` | 201 `{updated, communityJid, action}` |
| `POST /community/memberAddMode/{instance}?communityJid=` | `{mode}`: `admin_add`, `all_member_add` | 201 `{updated, communityJid, mode}` |
| `POST /community/joinApprovalMode/{instance}?communityJid=` | `{mode}`: `on`, `off` | 201 `{updated, communityJid, mode}` |
| `GET /community/requests/{instance}?communityJid=` | | 200 `{communityJid, count, requests: [...]}` |
| `POST /community/requests/{instance}?communityJid=` | `{participants: [...], action}`: `approve`, `reject` | 201 `{communityJid, action, results: [{status, jid}]}` |

Подробности:
- **create.** `approvalRequired: true` включает вступление по заявке (`parent default_membership_approval_mode=request_required`). Без него вступают сразу. Подгруппы от участников и общий чат не создаются, пустое описание не отправляется. Название до 100 символов, описание до 2048.
- **Вкладка объявлений.** После создания ищется до 4 раз с паузой 1,5 с, тремя способами по порядку. `announcementSource` говорит, какой сработал: `sub_groups.default_sub_group` (признак в ответе WhatsApp), `single_linked_group` (у нового сообщества без общего чата одна подгруппа), `group_metadata.isCommunityAnnounce`. Если не нашлась, сообщество всё равно создано: ответ 201 с `announcementJid: null` и `warning`. Повторите поиск через `info`, сообщество заново не создавайте.
- **info.** Метаданные группы без списка участников (`participants=true` добавляет его), `linkedGroups[]` с `id`, `subject`, `size`, `isAnnouncement`, сырыми `attrs` и `tags` узла. Подгруппу вместо сообщества не принимает.
- **requests (GET).** Атрибуты заявок отдаются как пришли от WhatsApp (`jid`, `phone_number`, `request_method`, `request_time` и что ещё будет). Так на живом номере видно, приходит номер телефона или LID.
- **requests (POST).** В `participants` идут `jid` из списка заявок как есть (допустимы и голые номера). До 256 за вызов, в `results[].status` `200` или код ошибки.
- **Сообщения во вкладку объявлений** идут штатными `/message/sendText|sendMedia|sendPoll` с `number = announcementJid`.
- **Аватарка и описание.** Штатные `/group/updateGroupPicture` и `/group/updateGroupDescription` с JID сообщества в `groupJid`. По исходникам блокировок для сообществ там нет, на живом номере не проверено. Если не сработают, добавим свои маршруты.
- **updateSetting** относится к самому сообществу. Для вкладки объявлений как группы есть штатный `/group/updateSetting` с её JID.

Ошибки приходят в формате Evolution: `{status, error, response: {message: [...]}}`. Ошибки проверки параметров это 400 и список `{property, message}`. Ошибки WhatsApp это `message: [что не вышло, причина по-русски, исходный текст и код WhatsApp]`: 500 для `create`, 400 для остальных. Код 500 при создании с таймаутом не повторяйте вслепую: сообщество могло создаться.

## Установка и обновление

На сервере `/opt/evolution` уже стоит `first-install.sh` (pm2 `evolution` под `onaiapp`). Положите `install.sh` и `communities.patch` в одну папку и запустите от root:

```
bash install.sh              # патч + сборка + замена + проверка
bash install.sh --force      # пересобрать, даже если этот патч уже стоит
bash install.sh status       # что стоит, отвечает ли Evolution, есть ли маршруты
```

Что делает `install.sh`:
1. Проверяет root, Node 20+, версию на сервере (`2.3.7`), наличие `.env`, процесс в pm2, свободные память и диск.
2. Клонирует тег 2.3.7 в `/opt/evolution.build.<время>`, сверяет коммит, накладывает патч (`git apply --check`, потом `git apply`).
3. Копирует `.env`, затем `npm ci`, `db:generate`, `db:deploy` с `DATABASE_PROVIDER=postgresql` (для того же тега миграций нет), `npx tsup` с `NODE_OPTIONS=--max-old-space-size=1536`. Всё от пользователя `onaiapp`. Если сборка не прошла, старая версия не тронута.
4. Останавливает pm2, переименовывает старую папку в `/opt/evolution.bak.<время>`, ставит новую, переносит из старой `.env`, `instances` и `store`, запускает pm2. База и Redis не затрагиваются, сессия WhatsApp остаётся (ключи в Postgres и Redis).
5. Проверяет `GET http://127.0.0.1:8080/` (версия) и маршруты `/community/*` без ключа: ответ про несуществующий инстанс значит, что маршрут подключён. Если проверка не прошла, возвращает прежнюю папку сам.
6. Пишет хеш патча в `.communities-patch.sha256`, оставляет один последний бэкап.

Evolution не отвечает только на время перезапуска pm2, инстанс переподключается при старте. Весь запуск занимает несколько минут, основное время уходит на `npm ci` и сборку.

Откат одной командой, возвращает последний бэкап и свежие `.env`, `instances`, `store`:

```
bash install.sh rollback
```

Папку `/opt/evolution.failed.<время>` после отката можно удалить.

## Проверка без WhatsApp

Из папки клона с патчем: `npx tsx /путь/к/check-communities.cjs`. Проверяет IQ-запрос создания (нет `allow_non_admin_sub_group_creation` и `create_general_chat`), поиск вкладки объявлений, тексты ошибок, контроллер и все 9 маршрутов на настоящем Express-роутере с подставным контроллером.

## Что можно проверить только на живом номере

- WhatsApp принимает создание без двух тегов и показывает сообщество с одной вкладкой объявлений.
- Каким способом найдена вкладка (`announcementSource`) и какие теги приходят у подгрупп (`linkedGroups[].tags`).
- Что лежит в заявках: номер телефона или LID.
- Вступление по ссылке через заявку и одобрение через `requests`.
- `updateSetting`, `memberAddMode`, `joinApprovalMode` на самом сообществе, аватарка и описание через штатные маршруты групп.

## Как обновить патч

Свежий клон нужного тега, правки, `git add -N <новые файлы>`, `git diff --binary > communities.patch`. В `install.sh` поменять `TAG` и `EXPECTED_COMMIT`. Проверить `git apply --check` на чистом клоне и прогнать `check-communities.cjs`.
