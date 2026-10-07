# ТЗ: дожим на следующий день после эфира (бот @workshop_aiprod_bot)

Репозиторий `C:\Проекты\wt-funnel`. Не коммитить, не пушить, на сервер не ходить, localhost не трогать.
Решения Александра 07.10.2026 ~19:00:
- на следующий день после эфира бот дожимает тех, кто **был на эфире** (нажал «Открыть эфир» в день D) и **не оплатил**: шлёт презентации PDF и офферы;
- **оба оффера сохраняются до 23:59 по Алматы следующего дня**: Vibe Production 150 000 ₸ вместо 250 000 ₸ и оба курса 390 000 ₸ вместо 440 900 ₸;
- тех, кто записался, но **не пришёл**, утром зовём на сегодняшний эфир (сообщение `next-day-1100` уже есть, сейчас выключено).

## 1. Код

1. **Новая аудитория `clickedNotPaid`** (`form-api/tg-store.ts` `audienceOk`, список `AUDIENCES` и проверка серии в `tg-workshop.ts`, подпись `AUD_LABEL` «были на эфире, не оплатили», тип `Audience`, админка/отчёты, где перечисляются аудитории).
   Условие: есть клик (переход на эфир) за день D **и** `!s.paid`.
2. **Медиа `document`** (`Media.type: "photo" | "video" | "document"`, поле `url`, необязательное `filename` не нужно): отправка через `sendDocument` с `document: url`, подпись как у фото (до 1024, длинная подпись делится так же, как у фото), кнопки под документом.
   При ошибке Telegram (например, не скачал файл) запасной путь как у фото: отправить текст с кнопками и учесть `mediaFallback`. Проверка серии: у `document` url должен быть https и оканчиваться на `.pdf`.
3. Проверить, что кнопка `rejoin` в `next-day-1100` реально переводит подписчика на сегодняшний эфир (streamDay = сегодня) и после этого он получает серию сегодняшнего дня с 19:50. Если чего-то не хватает, доделать. Тест.
4. Тесты в `form-api/tg.test.ts`:
   - `clickedNotPaid`: клик есть и не оплачено → да; клик есть и оплачено → нет; клика нет → нет;
   - сообщение с `dayOffset: 1` и `clickedNotPaid` уходит на следующий день только кликнувшим неоплатившим, подписчику, перешедшему по `rejoin` на сегодня, вчерашний дожим не уходит;
   - `document` уходит методом `sendDocument` с подписью и кнопками; при ошибке уходит текст с кнопками;
   - `tg-series.json` в репозитории проходит проверку.
   Запуск: `npx esbuild form-api/tg.test.ts --bundle --platform=node --target=node20 --format=cjs --outfile=<tmp>/tg.test.js`, затем `TZ=UTC` и `TZ=America/Los_Angeles` `node --test`. Всё зелёное.
   `node_modules`: junction на `C:\Проекты\webinar-oneday-landing\node_modules` (New-Item -ItemType Junction), удалить только junction через `[IO.Directory]::Delete(путь)`.
5. Пересобрать `form-api/dist/server.js` (`npx esbuild form-api/server.ts --bundle --platform=node --format=cjs --target=node20 --outfile=form-api/dist/server.js`).

## 2. Файлы презентаций на сайте

Скопировать в `workshop-montazh/assets/decks/` под латинскими именами:
`docs/sales-decks/pdf/Vibe Production.pdf` → `Vibe-Production.pdf`, `Vibe Coding PRO.pdf` → `Vibe-Coding-PRO.pdf`, `Два курса вместе.pdf` → `Vibe-Production-plus-PRO.pdf`.
Адреса: `https://onai.academy/workshop-montazh/assets/decks/<имя>`.

**Перед копированием поправить презентацию «Два курса вместе»** (`docs/sales-decks/bundle/index.html`): везде, где срок «в день эфира», написать «до 23:59 по Алматы на следующий день после эфира»
(слайд 4 мелкая строка, слайд 7 «23:59 по Алматы, в день эфира» → «23:59 по Алматы, на следующий день после эфира»). Пересобрать `python docs/sales-decks/bundle/build_pdf.py` под замком
(`powershell -NoProfile -File C:\Проекты\_общее\heavy.ps1 take -who "Вебинар" -what "PDF два курса"`, потом `release`), проверить глазами.

## 3. Серия `form-api/tg-series.json`

Версию поднять до `2026-10-07.5`. Сообщение `next-day-1100`: `"enabled": true` (поле убрать или true), текст заменить на:

```
Если вчера не получилось попасть на эфир, сегодня в 20:00 по Алматы (18:00 по Москве) я снова провожу его вживую.

Нажми кнопку, и ссылка придёт сюда в 19:50.
```

Добавить три сообщения в конец массива `messages` (перед `next-day-1100` или после, порядок не важен):

```json
{
  "id": "follow-1030",
  "at": "10:30",
  "dayOffset": 1,
  "audience": "clickedNotPaid",
  "media": { "type": "document", "url": "https://onai.academy/workshop-montazh/assets/decks/Vibe-Production.pdf" },
  "buttons": [
    [{ "text": "Предоплата 10 000 ₸ · Kaspi", "url": "{PREPAY_KZ}" }],
    [{ "text": "Предоплата из России и других стран", "url": "{PREPAY_INTL}" }],
    [{ "text": "Задать вопрос Аяне", "url": "https://onai.academy/workshop-montazh/tg-ayana" }],
    [{ "text": "Я уже оплатил(а)", "callback": "paid" }]
  ],
  "text": "Доброе утро! Вчера ты был на эфире «Вайб-продакшен». Собрал всё в одну презентацию: чему учим, как агент работает с тобой по шагам, чем курс отличается от вайбкодинга и сколько стоит.\n\nВчерашние условия сохранили за тобой ещё на день, до 23:59 по Алматы (21:59 по Москве): Vibe Production за 150 000 ₸ вместо 250 000 ₸ или от 6 250 ₸ в месяц в рассрочку.\n\nЗакрепить цену: предоплата 10 000 ₸ по кнопке ниже, она входит в стоимость. Не подойдёт обучение, предоплату вернём."
},
{
  "id": "follow-1500",
  "at": "15:00",
  "dayOffset": 1,
  "audience": "clickedNotPaid",
  "media": { "type": "document", "url": "https://onai.academy/workshop-montazh/assets/decks/Vibe-Production-plus-PRO.pdf" },
  "buttons": [
    [{ "text": "Предоплата 10 000 ₸ · Kaspi", "url": "{PREPAY_KZ}" }],
    [{ "text": "Предоплата из России и других стран", "url": "{PREPAY_INTL}" }],
    [{ "text": "Написать Аяне про два курса", "url": "https://onai.academy/workshop-montazh/tg-dva" }],
    [{ "text": "Программа Vibe Coding PRO (PDF)", "url": "https://onai.academy/workshop-montazh/assets/decks/Vibe-Coding-PRO.pdf" }],
    [{ "text": "Я уже оплатил(а)", "callback": "paid" }]
  ],
  "text": "Если хочешь не только рилсы, но и свои сервисы и сайты, вот второй вариант: оба курса вместе.\n\nVibe Production и Vibe Coding PRO с обратной связью за 390 000 ₸ вместо 440 900 ₸. Это на 50 900 ₸ выгоднее, чем по отдельности. Условие тоже до 23:59 сегодня.\n\nБронь одна, 10 000 ₸. Остальное в рассрочку до 24 месяцев или двумя платежами, подробности у Аяны."
},
{
  "id": "follow-2145",
  "at": "21:45",
  "dayOffset": 1,
  "audience": "clickedNotPaid",
  "buttons": [
    [{ "text": "Предоплата 10 000 ₸ · Kaspi", "url": "{PREPAY_KZ}" }],
    [{ "text": "Предоплата из России и других стран", "url": "{PREPAY_INTL}" }],
    [{ "text": "Написать Аяне в Telegram", "url": "https://onai.academy/workshop-montazh/tg-ayana" }],
    [{ "text": "Написать Аяне в WhatsApp", "url": "https://onai.academy/workshop-montazh/ayana" }],
    [{ "text": "Я уже оплатил(а)", "callback": "paid" }]
  ],
  "text": "Давай честно: прими решение до конца сегодняшнего дня. Ты с нами или нет?\n\nЕсли да, закрепи место предоплатой 10 000 ₸ по кнопке ниже, и Аяна поможет с остальным.\nЕсли нет, окей, можешь ничего не делать. Больше писать про эти условия не буду.\n\nДо 23:59 по Алматы (21:59 по Москве) скидка ещё твоя: Vibe Production 150 000 ₸ вместо 250 000 ₸, оба курса 390 000 ₸ вместо 440 900 ₸."
}
```

Тексты не менять. Длинных тире нет и не добавлять.

## Отчёт (коротко)

Изменённые файлы, тесты N/N, что было не так с `rejoin` (если было), путь к снимку пересобранной страницы 7 «Два курса вместе».
