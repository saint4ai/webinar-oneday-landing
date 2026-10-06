/**
 * Кейсы для карусели 08c «Что я собрал для бизнеса»: 9 кейсов витрины onai.academy/saint (версия сайта 10, 06.10.2026).
 * ShowToday убран с сайта и из презентации по решению Александра 06.10: работа не состоялась.
 * Erickson убран из презентации по решению Александра 06.10. Diskurs убран с сайта 06.10, из презентации тоже.
 * The One System под NDA: экран клиента не показываем, вместо него карточка продукта (kind: "card").
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
    // NDA: у компании экран входа с фото основателей, слоганом и их цифрами показывать нельзя, поэтому вместо скриншота карточка продукта.
    // Срок: 9 недель от первого коммита 03.08 до сдачи 02–03.10.2026 (saint_landing/CASE_SOURCES.md). Роли «Курсант», «Трекер», «Администратор» — это наша работа.
    slug: "the-one-system",
    title: "The One System",
    niche: "Бизнес-школа, Алматы",
    oneLiner: "Платформа обучения для бизнес-школы за 9 недель",
    metric: "9 недель разработки · 3 роли · 2 языка",
    visual: { kind: "card", icon: "lg-i-rocket", label: "Платформа обучения", tags: ["Курсант", "Трекер", "Администратор"] },
    url: "onai.academy/saint/cases/the-one-system",
  },
  {
    slug: "onai-academy",
    title: "onAI Academy",
    niche: "Моя онлайн-школа",
    oneLiner: "AI-наставник отвечает ученикам по каждому уроку",
    // 900+ на платформе со слов Александра 05.10.2026 (318 в FACTS — только с действующим доступом); всего выпускников 1000+ вместе с Discord, это на слайде 08
    metric: "900+ учеников · 113 уроков · 595 вопросов наставнику",
    visual: shot("onai-academy"),
    url: "onai.academy/saint/cases/onai-academy",
  },
  {
    // карточка сайта ai-assistant; цифры — срез базы ассистента на 04.10.2026, работает с 06.09.2026
    slug: "ai-assistant",
    title: "AI-ассистент",
    niche: "Свой продукт · Instagram",
    oneLiner: "Комментарий под роликом превращается в заявку",
    metric: "2 117 человек получили материал · 66 кодовых слов",
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
    oneLiner: "Видно, какая реклама приносит продажи",
    metric: "Собрал за 3 месяца · отчёт в Telegram каждое утро",
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
