# Landing — открытые задачи к запуску

## 🔴 Нужно перед публикацией

### 1. WhatsApp ссылка (бот или сообщество — Александр решит)
**Где заменить:**
- `app/thank-you/page.tsx` — константа `WHATSAPP_INVITE` (строка ~24)
- Поиск по проекту: `WHATSAPP_INVITE`

**Сейчас:** `https://chat.whatsapp.com/INVITE_CODE_HERE` (placeholder)

**После решения:** заменить на реальную инвайт-ссылку сообщества **или** на чат-бота (`https://wa.me/<номер>`).

---

### 2. Submit endpoint для форм регистрации
**Где:**
- `components/ui/register-modal.tsx` — `handleSubmit` (поиск `TODO: подключить отправку`)
- `components/sections/final-cta.tsx` — `handleSubmit` (поиск `TODO: реальный endpoint`)

**Сейчас:** обе формы делают `setTimeout(700)` без реального submit.

**Нужно:** POST на endpoint (CRM webhook / Telegram bot / Bitrix) с payload:
```ts
{ name: string, phone: string, source: "hero" | "final-cta" }
```

После успешного submit — `router.push("/thank-you")` (уже подключено).

---

### 3. Facebook Pixel (когда подключим)
- Conversion event срабатывает на странице `/thank-you`
- Лучше через `PageView` стандартное событие + custom `Lead` event
- Добавить в `app/thank-you/page.tsx` через `<Script>` или Next.js Script-компонент
- На основном лендинге — `PageView` всё время + `InitiateCheckout` при открытии модалки

---

## 🟡 Опционально

### 4. Yandex Metrika
- По словам Александра — на сайте `onai.academy` стоит «пиксель-функция» которая ловит только клики, не передаёт данные. Нужно подключить полноценный счётчик Я.Метрики.
- Добавить в `app/layout.tsx` через `<Script>`.

### 5. Open Graph image
- Нет `og.png` 1200×630 для соц-шейров
- Сгенерить через Higgsfield (см. `methods/higgsfield_generation.md`)

### 6. Замена placeholder скриншота Айдоса
- Сейчас custom JSX-дашборд (`AidosDashboard` в `testimonials.tsx`)
- Если будет реальный скрин — заменить `customMedia` на `screenshot`

---

## ✅ Готово к запуску

- 7 секций (Hero, AboutMe, CaseOnAIAcademy, MyOtherProducts, Testimonials, **Bonuses**, FinalCTA)
- Thank You page (`/thank-you`)
- Auto-detect country code в phone input (через ipapi.co)
- BENZIN local font (5 weights)
- Playwright 50+ тестов на mobile / tablet / desktop
- Beams + scan-line + grain эффекты
- Все формы → автоматический редирект на `/thank-you`
