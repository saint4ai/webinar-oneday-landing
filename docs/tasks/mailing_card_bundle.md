# ТЗ: карточка пакетного оффера `offer-bundle`

Репозиторий: `C:\Проекты\wt-funnel`. Не коммитить, не пушить, на сервер не ходить.
Не трогать: `form-api/`, `docs/mailings/`, `workshop-montazh/` кроме нового файла `assets/tg/offer-bundle.jpg`.

Шаблон: `docs/tg-media/card.html`, запись `offer` (карточка `workshop-montazh/assets/tg/offer.jpg`: кикер, зачёркнутая старая цена,
крупная золотая цена, строка под ней, плашка «до 23:59 по Алматы», объект справа снизу). Новая карточка той же композиции, id `offer-bundle`.

| Элемент | Текст |
|---|---|
| Кикер | Только для участников эфира |
| Зачёркнуто | 440 900 ₸ |
| Цена | 390 000 ₸ |
| Строка под ценой (2 строки) | Vibe Production и Vibe Coding PRO, оба курса с обратной связью |
| Плашка | до 23:59 по Алматы |
| Объект | по смыслу «два курса вместе»: `lg-i-cards`, `lg-i-rocket` или `lg-i-laptopcoins` из `C:\Проекты\webinar-oneday-landing\public\montage\lego\` (посмотреть глазами, выбрать лучший; не песочные часы, они уже на `offer` и `last-call`) |

Тексты строго как в таблице, без длинного тире. Цена не должна рваться по строкам.

Рендер только новой карточки: `node docs/tg-media/render.mjs cards offer-bundle` (аргумент уже поддерживается). Перед рендером замок
`powershell -NoProfile -File C:\Проекты\_общее\heavy.ps1 take -who "Вебинар" -what "карточка offer-bundle"`, после `... release -who "Вебинар"`.
Если нет `node_modules`: временный junction на `C:\Проекты\webinar-oneday-landing\node_modules`, потом удалить только junction (`cmd /c rmdir node_modules`).

Проверить глазами (Read по jpg): ничего не обрезано, текст не наезжает на объект, `overflow: нет`.

Отчёт коротко: путь, размер в КБ, какой объект.
