# /public/handouts/

Раздаточные материалы Александра (фото, бонус-карточки, QR-коды, PDF). Хранятся в репо, не в `~/Downloads`. Подключаются в презентацию через локальные пути `/handouts/...`.

## Структура

```
public/handouts/
├── alex/         Фото Александра
├── higgs/        Higgsfield-рендеры (карточки бонусов, ассеты)
├── payment/      QR-коды Каспи, реквизиты
├── docs/         PDF-документы (программы, рефы)
└── README.md
```

## Текущий состав

### alex/
- `alex_hero.png` — premium hero-shot Александра в onAI футболке. **Используется в Slide 13** (`/handouts/alex/alex_hero.png`).
- _TODO_ `alex_half_robot.png` — фото 50/50 робот-человек когда Александр сгенерит в Higgsfield. После добавления — заменить в `Slide_13_AlexanderIntro.tsx`.

### higgs/
Все варианты Higgsfield бонус-карточек v4:
- `v4_bonus1_*` — Гайд по Android (hand_C, samsung_A, pixel_B, flatlay_D)
- `v4_bonus2_*` — 30 промптов (giftbox_A/B, chest_C, shelf_D)
- `v4_bonus3_*` — Чек-лист 9 сервисов (fan_D, bento_B, clipboard_A, orbit_C)

Финальные карточки, выбранные для **Slide 5**, продублированы в `/public/bonuses/bonus-{1,2,3}.png` (hand_C, giftbox_B, fan_D).

### payment/
- `kaspi-qr.png` — QR-код для предоплаты. _Будет подключён к слайдам тарифа/предоплаты (после Slide 17)._

### docs/
- `saint_web_day1_3day_program.pdf` — программа 3-дневника от Saint Web.

## Правила работы

1. **Никаких раздаток в `~/Downloads`**. Александр предоставляет файл → копируем сюда, подключаем по `/handouts/<подпапка>/<имя>`.
2. **Имена файлов snake_case без пробелов/кириллицы** — иначе Next.js Image падает.
3. **Большие PNG (>5MB)** оптимизируются автоматически Next.js Image на первом запросе.
4. **Бэкап через git** — после добавления нового файла: `git add public/handouts/<file>` и коммит.
