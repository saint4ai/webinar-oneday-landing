/**
 * Кейсы для карусели 08c «Что я собрал для бизнеса»: 12 кейсов, которые хаб кейсов разрешает показывать
 * (onai-workspace, ветка claude/quirky-carson-ei234s, business-cases/README.md, раздел «Что показывать», срез 05.10.2026).
 * Тексты сжаты из business-cases/site-texts/<slug>.md, цифры только из FACTS.md с пометкой «да» или «с оговоркой» (оговорка в чипе).
 * Порядок как советует хаб для эфира: платформы, AI-ассистенты, аналитика, продукты, прототип.
 * Правила хаба: без цен и бюджетов, без названий AI-поставщиков, кадр на демо-данных с пометкой «демо-данные».
 * Кадры 1600×1000 в public/montage/cases/; первые три — одобренные кадры сайта из projects/saint_landing/public/assets/cases.
 */

/** Что показывать в окне браузера: скриншот, логотип клиента или карточку продукта (когда кадра нет, как на сайте). */
export type CaseVisual =
  | { kind: "shot"; src: string; demo?: boolean }
  | { kind: "logo"; src: string; dark?: boolean; tags: string[] }
  | { kind: "card"; icon: string; label: string; tags: string[] };

export type BizCase = {
  slug: string;
  title: string; // название решения или клиента, если клиент разрешил
  niche: string; // для кого
  oneLiner: string; // что даёт бизнесу, до 9 слов
  metric: string; // проверенные цифры через «·»
  visual: CaseVisual;
  url: string; // страница кейса без https://
};

export const CASES: BizCase[] = [
  {
    slug: "erickson",
    title: "Erickson Central Asia",
    niche: "Коучинговый университет",
    oneLiner: "Платформа обучения с AI-куратором и менторингами",
    metric: "50 студентов · 81 урок · запуск за 2 месяца",
    visual: { kind: "shot", src: "/montage/cases/erickson.webp" },
    url: "onai.academy/saint/cases/erickson",
  },
  {
    slug: "the-one-system",
    title: "The One System",
    niche: "Бизнес-школа, Алматы",
    oneLiner: "Своя платформа обучения с AI за 9 недель",
    metric: "78 экранов · 3 роли · 2 языка",
    visual: { kind: "shot", src: "/montage/cases/the-one-system.webp" },
    url: "onai.academy/saint/cases/the-one-system",
  },
  {
    slug: "onai-academy",
    title: "onAI Academy",
    niche: "Моя онлайн-школа",
    oneLiner: "AI-наставник отвечает ученикам по каждому уроку",
    // 900+ на платформе со слов Александра 05.10.2026 (318 в FACTS — только с действующим доступом); всего выпускников 1000+ вместе с Discord, это на слайде 08
    metric: "900+ учеников · 113 уроков · 595 вопросов наставнику",
    visual: { kind: "shot", src: "/montage/cases/onai-academy.webp" },
    url: "onai.academy/saint/cases/onai-academy",
  },
  {
    // site-texts/ai-assistant.md, cases/instagram-bot-saint4ai/FACTS.md: срез базы ассистента на 04.10.2026, работает с 06.09.2026
    slug: "ai-assistant",
    title: "AI-ассистент",
    niche: "Свой продукт · Instagram и TikTok",
    oneLiner: "Комментарий под роликом превращается в заявку",
    metric: "2 117 человек получили материал · 66 кодовых слов",
    visual: { kind: "card", icon: "lg-i-chatkey", label: "Слово → директ → заявка", tags: ["Кодовые слова", "Ответы в директе", "Заявки в продажи"] },
    url: "onai.academy/saint/cases/ai-assistant",
  },
  {
    // site-texts/iqra.md: цифр результата нет, школа их не подтвердила; логотип logos/iqra.svg.
    // Дашборд: Александр 06.10.2026 «по CRM мы делали dashboard, был репозиторий»; IQRA — первый клиент в коде iqra-dashboard (cases/diskurs-whatsapp-analytics/FACTS.md)
    slug: "iqra",
    title: "IQRA",
    niche: "Школа казахского языка",
    oneLiner: "AI-консультант в чате и дашборд по заявкам из CRM",
    metric: "Запись на пробный урок в чате · дашборд на данных AmoCRM",
    visual: { kind: "logo", src: "/montage/cases/iqra-logo.svg", tags: ["AI-консультант", "Дашборд", "AmoCRM"] },
    url: "onai.academy/saint/cases/iqra",
  },
  {
    // site-texts/diskurs.md: дашборд нагрузки в статусе пилота; логотип logos/diskurs.png белый, только на тёмном
    slug: "diskurs",
    title: "Diskurs",
    niche: "Маркетинговое агентство",
    oneLiner: "AI-менеджер в чате и дашборд нагрузки команды",
    metric: "2 решения для одного агентства · дашборд в пилоте",
    visual: { kind: "logo", src: "/montage/cases/diskurs-logo.png", dark: true, tags: ["AI-менеджер", "Дашборд нагрузки"] },
    url: "onai.academy/saint/cases/diskurs",
  },
  {
    // site-texts/whatsapp-analytics.md. Цифры 7% → 55% и 141 из 141 не ставить: по FACTS.md это аудит клиента AT Academy, без его согласия нельзя
    slug: "whatsapp-analytics",
    title: "Сквозная аналитика",
    niche: "Клиенты агентства Diskurs",
    oneLiner: "Видно, какое объявление привело клиента из WhatsApp",
    metric: "Реклама, WhatsApp и CRM в одном отчёте · в Telegram в 8:00",
    visual: { kind: "card", icon: "lg-i-laptopcoins", label: "Клик → диалог → сделка", tags: ["Реклама", "WhatsApp", "CRM", "Отчёт в 8:00"] },
    url: "onai.academy/saint/cases/whatsapp-analytics",
  },
  {
    // cases/ai-targetolog/FACTS.md, только строки «да»; цифры клиентов и «60+ клиентов» без выгрузки не ставить, цен по правилу хаба нет.
    // Кадр — публичный лендинг app.aoneagency.kz, блок «Как работает»
    slug: "ai-targetolog",
    title: "AI-Таргетолог",
    niche: "Свой продукт · реклама FB и IG",
    oneLiner: "Видно, какая реклама приносит продажи",
    metric: "Собрал за 3 месяца · отчёт в Telegram каждое утро",
    visual: { kind: "shot", src: "/montage/cases/ai-targetolog.webp" },
    url: "onai.academy/saint/cases/ai-targetolog",
  },
  {
    // site-texts/omnidash.md: число клиентов не выгружено; кадр — публичный лендинг omnidash.kz, блок подключений
    slug: "omnidash",
    title: "OmniDash",
    niche: "Свой продукт · сквозная аналитика",
    oneLiner: "Реклама и продажи на одном экране",
    metric: "9 подключений · 5 моделей атрибуции",
    visual: { kind: "shot", src: "/montage/cases/omnidash.webp" },
    url: "onai.academy/saint/cases/omnidash",
  },
  {
    // site-texts/callvision.md: интерфейс на демо-данных (имена вымышлены), движок проверен на звонках школы onAI
    slug: "callvision",
    title: "CallVision AI",
    niche: "Отделы продаж",
    oneLiner: "AI-РОП оценивает каждый звонок",
    metric: "10 критериев · до 3 цитат из разговора на критерий",
    visual: { kind: "shot", src: "/montage/cases/callvision.webp", demo: true },
    url: "onai.academy/saint/cases/callvision",
  },
  {
    // site-texts/voiceseller.md: число звонков и дозвонов не выгружено, 7 минут — настройка по умолчанию
    slug: "voiceseller",
    title: "VoiceSeller",
    niche: "Свой продукт · звонки лидам",
    oneLiner: "Звонобот говорит по-казахски и по-русски",
    metric: "2 языка · звонок через 7 минут после заявки",
    visual: { kind: "card", icon: "lg-i-phonearrow", label: "Заявка → звонок → запись", tags: ["Казахский", "Русский", "AmoCRM"] },
    url: "onai.academy/saint/cases/voiceseller",
  },
  {
    // site-texts/showtoday.md: прототип на демо-данных, январь 2026; кадр обрезан сверху без значка внизу (правило хаба)
    slug: "showtoday",
    title: "ShowToday",
    niche: "Агентство праздников",
    oneLiner: "Прототип показал систему до разработки",
    metric: "8 метрик переписки · 10 экранов · из него вырос OmniDash",
    visual: { kind: "shot", src: "/montage/cases/showtoday.webp", demo: true },
    url: "onai.academy/saint/cases/showtoday",
  },
];
