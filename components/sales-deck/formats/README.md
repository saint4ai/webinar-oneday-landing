# Новые дизайн-форматы слайдов

Свежие визуальные форматы для блока слайдов sales-deck. Цель — уйти от заезженных приёмов и пробивать баннерную слепоту через типографику, motion и композицию, а не через фоновые картинки и стеклянные карточки.

## Где лежат

```
components/sales-deck/formats/
├── EditorialSlide.tsx      ← Формат 1: editorial / magazine
├── KineticSlide.tsx        ← Формат 2: kinetic typography
├── SplitScreenSlide.tsx    ← Формат 3: split-screen + code/data
├── FormatsShowcase.tsx     ← витрина всех 3 форматов (client)
└── README.md               ← этот файл

app/sales-deck/formats/page.tsx   ← маршрут-витрина (Server Component, noindex)
```

Витрина: **http://localhost:3001/sales-deck/formats** (← → / SPACE / F / S / Home / End).

## Форматы

### 1. EditorialSlide — editorial / magazine layout
Сильная типографика с отрицательным tracking, гигантский **outline-номер** на фоне, вертикальный kicker (`writing-mode`), тонкий **blueprint-грид** через CSS `mask` (не gradient-сфера).

**Когда:** chapter-открытия глав, манифест-слайды, заголовочные утверждения.
**Props:** `bgNumber`, `kicker`, `verticalLabel`, `title`, `lead`, `children`, `accent`.

### 2. KineticSlide — kinetic typography
Заголовок собирается **по словам** с маска-reveal снизу + stagger; акцентные слова подсвечиваются лаймом. Только движущийся текст на чёрном — «abstract minimal motion».

**Когда:** engagement-слайды, мощные одностраничные тезисы, вопросы в чат.
**Props:** `kicker`, `words: {text, accent?}[]`, `sub`, `children`, `align` (`center`/`left`), `accent`.

### 3. SplitScreenSlide — split-screen + code/data
Асимметричная сетка **1.15fr / 0.85fr** (не 50/50). Слева крупный текст, справа — плоский **редактор кода** с номерами строк и diff-подсветкой (`add`/`del`/`comment`). Без glassmorphism.

**Когда:** «как это работает», демонстрация процесса, before/after, технические слайды.
**Props:** `kicker`, `title`, `lead`, `children`, `panelTitle`, `codeLines: {text, kind?}[]` или `panelContent`, `accent`.

## Как выбрать формат

| Задача слайда | Формат |
|---|---|
| Открытие главы / громкое утверждение | **Editorial** |
| Один мощный тезис / вопрос в чат / engagement | **Kinetic** |
| Процесс / код / before-after / «как работает» | **Split-screen** |
| Список фич / категории | bento-сетка (существующая) |
| Метрики с продуктом | iPhone/dashboard-мокап (существующие) |

## Единый дизайн-язык

Все форматы наследуют систему проекта:
- Палитра: чёрный `#000` / лайм `#B6FF00` / оранж `#FC5C02` (через `accent` prop).
- Шрифты: `--font-benzin` (display H1), `--font-jetbrains-mono` (kicker/код), inter-tight (body).
- Зона спикера справа: `var(--sd-speaker-zone, 25vw)` — контент туда не залезает.
- Совместимы с оркестратором `SlideDeck` (тот же keyboard-nav, transitions).

## Технические решения

- **Server/Client:** формат-компоненты — `"use client"` (нужны framer-motion + хуки). Маршрут `page.tsx` — Server Component.
- **Анимации:** только `framer-motion@12` (уже в проекте) — новых зависимостей НЕ добавлено.
- **prefers-reduced-motion:** каждый формат через `useReducedMotion()` отдаёт мгновенный показ без анимаций.
- **React Compiler:** в проекте не включён, поэтому ручные `useMemo`/`useCallback` допустимы (не понадобились).
- **Hydration:** нет `Date.now()`/`Math.random()` в рендере → mismatch исключён.
- **Tailwind v4:** работаем через существующие CSS-переменные и `@theme inline` в `globals.css`. Новый `tailwind.config.js` НЕ создавался.
- **Адаптив:** размеры через `clamp()`; split-screen на узких viewport переходит в стек; editorial-номер уезжает за край, текст остаётся читаемым.

## Референсы (идеи через MCP 21st.dev)

Взяты **идеи**, не код (зависимости gsap/radix/cva НЕ тащились):
- **Hero 04** (editorial) → гигантская типографика с отрицательным tracking, outline-номера, вертикальный label `writing-mode`, blueprint-грид с radial-mask.
- **AnimatedText / LayeredText** (kinetic) → char/word stagger, clip-mask reveal снизу.
- **Process Timeline / split screen code** → асимметричная сетка, моноширинная code-панель с номерами строк и diff.

## Сознательно исключено как заезженное

- ❌ glassmorphism-карточки (`backdrop-blur` + полупрозрачный bg как основной приём)
- ❌ floating spheres / анимированные сферы (`LiquidBackground` water/metal)
- ❌ generic gradient hero-backgrounds
- ❌ hero-экраны с фоновыми фотографиями
- ❌ Spline 3D-объекты как декор

## Проверка

- `npx tsc --noEmit` → **0 ошибок**
- Playwright на **1920 / 1440 / tablet 834 / mobile 390** + `reducedMotion: reduce` → **NO_ERRORS** (нет runtime/hydration ошибок ни на одном viewport)
- Скриншоты: `_screenshots/fmt-{editorial,kinetic,split}-{1920,1440,tablet,mobile}.png`
