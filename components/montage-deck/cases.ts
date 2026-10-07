/**
 * Кейсы для карусели 08c «Что я собрал для бизнеса»: 7 кейсов витрины onai.academy/saint (версия сайта 10, 06.10.2026).
 * Три платформы обучения (The One System, Erickson Central Asia, onAI Academy) с 07.10 вечером идут отдельным блоком 08p1–08p3
 * перед каруселью (PLATFORMS ниже) и в карусель не входят: иначе один и тот же кадр шёл бы подряд.
 * ShowToday убран с сайта и из презентации по решению Александра 06.10: работа не состоялась.
 * Erickson 06.10 был убран, 07.10 вечером Александр вернул его в блок платформ. Diskurs убран с сайта 06.10, из презентации тоже.
 * The One System под NDA: экран входа с основателями не показываем (решение 07.10), остальные экраны платформы можно.
 * Кадры — главные картинки кейсов с сайта (у сайта поле image: <имя>-large.webp, 2400×1500), уменьшены до 1600×1000 в public/montage/cases/.
 * Тексты сжаты из карточек сайта (title, description, proof), цифры только проверенные: фактчек сайта 06.10 и FACTS.md хаба кейсов.
 * Порядок как советует хаб для эфира: платформы, AI-ассистенты, аналитика, продукты.
 * Правила хаба: без цен и бюджетов клиентов, без названий AI-поставщиков, кадр на демо-данных с пометкой «демо-данные».
 */

/** Что показывать в окне браузера: скриншот, логотип клиента или карточку продукта (когда кадра нет). */
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

// ?v= — сброс кэша: prod-сервер отдаёт картинки из public с кэшем на 7 дней, а имена файлов при замене кадров не меняются
const shot = (slug: string, demo = false): CaseVisual => ({ kind: "shot", src: `/montage/cases/${slug}.webp?v=1006`, demo });

export const CASES: BizCase[] = [
  {
    // чистовик от сессии «Instagram AI-менеджер», сверен с кодом. Источник цифр: база ассистента и Instagram @saint4ai, 06.09–07.10.2026, срез 07.10 18:20.
    // Кадр пока прежний (демо-данные), полный кейс ассистента придёт позже
    slug: "ai-assistant",
    title: "AI-ассистент Instagram",
    niche: "Свой продукт · вместо SendPulse и ManyChat",
    oneLiner: "Раздаёт материалы, помогает в директе, передаёт горячих клиентов",
    metric: "2 423 получили материал · AI-РОП разобрал 129 разговоров · 16 горячих клиентов",
    visual: shot("ai-assistant", true),
    url: "onai.academy/saint/cases/ai-assistant",
  },
  {
    // карточка сайта iqra: дашборд сквозной аналитики и AI-консультант; кадр — стенд на вымышленных данных
    slug: "iqra",
    title: "IQRA",
    niche: "Школа казахского языка",
    oneLiner: "Видно, какое объявление приводит учеников",
    metric: "Реклама, заявки и продажи в AmoCRM · запись на урок в чате",
    visual: shot("iqra", true),
    url: "onai.academy/saint/cases/iqra",
  },
  {
    // карточка сайта whatsapp-analytics. Цифры 7% → 55% и 141 из 141 не ставить: аудит клиента AT Academy, без его согласия нельзя
    slug: "whatsapp-analytics",
    title: "Сквозная аналитика WhatsApp",
    niche: "Решение onAI для рекламы в WhatsApp",
    oneLiner: "Заявка из WhatsApp связана с рекламой и сделкой",
    metric: "Реклама → WhatsApp → CRM · отчёт в Telegram в 8:00",
    visual: shot("whatsapp-analytics", true),
    url: "onai.academy/saint/cases/whatsapp-analytics",
  },
  {
    // cases/ai-targetolog/FACTS.md, только строки «да»; цифры клиентов и «60+ клиентов» без выгрузки не ставить. Кадр сайта — демо-данные
    slug: "ai-targetolog",
    title: "AI-Таргетолог",
    niche: "Свой продукт · реклама FB и IG",
    // решение Александра 06.10: AI-Таргетолог это замена специалиста, а не отчёт; формулировка из ревью Б8 07.10. Клиентов называть можно (RocketGo, NNN Detailing, KardanKraft), их цифры нельзя
    oneLiner: "Сам запускает рекламу, управляет кампаниями и присылает отчёты",
    metric: "Собрал за 3 месяца",
    visual: shot("ai-targetolog", true),
    url: "onai.academy/saint/cases/ai-targetolog",
  },
  {
    // карточка сайта omnidash: пилот, кадр отчёта по таргету на вымышленных данных
    slug: "omnidash",
    title: "OmniDash",
    niche: "Решение onAI для предпринимателей",
    oneLiner: "Реклама и продажи на одном экране",
    metric: "Расход, выручка и ROMI по кампаниям · пилот",
    visual: shot("omnidash", true),
    url: "onai.academy/saint/cases/omnidash",
  },
  {
    // карточка сайта callvision: демо интерфейса на примерных данных
    slug: "callvision",
    title: "CallVision AI",
    niche: "Отделы продаж",
    oneLiner: "Оценка каждого звонка отдела продаж",
    metric: "10 пунктов чек-листа · цитаты из разговора",
    visual: shot("callvision", true),
    url: "onai.academy/saint/cases/callvision",
  },
  {
    // карточка сайта voiceseller: собран, чтобы позвонить по заявке, проверен на тестовой заявке; кадр — макет на демо-данных
    slug: "voiceseller",
    title: "VoiceSeller",
    niche: "Решение onAI для звонков по заявкам",
    oneLiner: "Звонок по свежей заявке через 7 минут",
    metric: "Казахский и русский · сценарий и ответы на возражения",
    visual: shot("voiceseller", true),
    url: "onai.academy/saint/cases/voiceseller",
  },
];

/**
 * Три платформы обучения для слайдов 08p1–08p3 и страницы кейсов 08cs (Александр, 07.10.2026 вечером).
 * Экраны взяты с живого сайта onai.academy/saint/assets/cases/ и просмотрены глазами: нет экрана входа The One System с основателями,
 * нет лиц людей и имён курсантов. Файлы в public/montage/cases/: pl-* экраны платформы (компьютер, телефон), page-* страницы кейсов на сайте
 * (1440×900 и 390×844), logo-* логотипы с сайта. У The One System и Erickson страница кейса снята ниже первого экрана:
 * наверху у них экран входа с людьми. Факты только с сайта /saint/ (карточки кейсов и страницы кейсов).
 */
export type Platform = {
  slug: string; // страница кейса на сайте: onai.academy/saint/cases/<slug>
  name: string;
  line: string; // одна строка: что это
  facts: { big: string; small: string }[]; // 2–3 проверенных факта
  logo: string; // файл в public/montage/cases/
  logoH: number; // высота логотипа на светлой плашке, cqw
  desk: string; // экран платформы на компьютере
  mob: string; // экран платформы на телефоне
  pageDesk: string; // страница кейса на сайте, компьютер
  pageMob: string; // страница кейса на сайте, телефон
  demo: boolean; // на экране демо-профиль («Курсант Демонстрация», «Демо Студент»): подписать «демо-данные»
};

// ?v= — сброс кэша картинок из public (см. выше)
const img = (name: string) => `/montage/cases/${name}?v=1007`;

export const PLATFORMS: Platform[] = [
  {
    // Срок: 9 недель от первого коммита 03.08 до сдачи 02–03.10.2026 (saint_landing/CASE_SOURCES.md). Роли «Курсант», «Трекер», «Администратор» — это наша работа.
    // Экран: урок с AI-куратором (one-lesson на сайте, видео размыто). Журнал ДЗ (one-journal) не взят: в нём имена курсантов;
    // one-home и one-mobile-home не взяты: экран входа и главная с фото основателей.
    slug: "the-one-system",
    name: "The One System",
    line: "Платформа обучения для бизнес-школы в Алматы",
    facts: [
      { big: "9 недель", small: "разработки" },
      { big: "3 роли", small: "курсант, трекер, администратор" },
      { big: "2 языка", small: "русский и казахский" },
    ],
    logo: "logo-the-one-system.png",
    logoH: 4.4,
    desk: img("pl-one-desk.webp"),
    mob: img("pl-one-mob.webp"),
    pageDesk: img("page-one-desk.webp"),
    pageMob: img("page-one-mob.webp"),
    demo: true,
  },
  {
    // Факты со страницы кейса /saint/cases/erickson и карточки сайта; 6 групп на 04.10.2026. Экран: диалог с AI-куратором (erickson-curator), на телефоне диалог на казахском.
    slug: "erickson",
    name: "Erickson Central Asia",
    line: "Платформа для коучинговой академии: уроки, практика и менторинг",
    facts: [
      { big: "2 месяца", small: "от первого созвона до запуска" },
      { big: "AI-куратор", small: "на русском и казахском" },
      { big: "6 групп", small: "учатся (04.10.2026)" },
    ],
    logo: "logo-erickson.svg",
    logoH: 3.4,
    desk: img("pl-erickson-desk.webp"),
    mob: img("pl-erickson-mob.webp"),
    pageDesk: img("page-erickson-desk.webp"),
    pageMob: img("page-erickson-mob.webp"),
    demo: true,
  },
  {
    // 1000+ выпускников: слова Александра (900+ на платформе и Discord, слайд 08). Экран: AI-наставник отвечает по уроку (onai-mentor), на телефоне страница урока.
    slug: "onai-academy",
    name: "onAI Academy",
    line: "Моя платформа, где AI-наставник отвечает ученикам по уроку",
    facts: [
      { big: "1000+", small: "выпускников" },
      { big: "AI-наставник", small: "в каждом уроке" },
    ],
    logo: "logo-onai-academy.svg",
    logoH: 2.5,
    desk: img("pl-onai-desk.webp"),
    mob: img("pl-onai-mob.webp"),
    pageDesk: img("page-onai-desk.webp"),
    pageMob: img("page-onai-mob.webp"),
    demo: false,
  },
];
