/**
 * Кейсы для карусели 08c «Что я собрал для бизнеса».
 * Три кейса уже упакованы для сайта onai.academy/saint: факты из CASE_SOURCES.md и пакетов кейсов (срез 04.10.2026),
 * кадры — обезличенные скриншоты из projects/saint_landing/public/assets/cases (уменьшены до 1600×1000). Четвёртый — из облачного аудита.
 * Новые кейсы добавляет агент-сборщик (docs/tasks/cases_harvest_prompt.md): из cases.json сюда переносятся title, niche, oneLiner, metric, shot, url.
 */
export type BizCase = {
  slug: string;
  title: string; // название решения или клиента, если клиент разрешил
  niche: string; // для кого
  oneLiner: string; // что даёт бизнесу, до 9 слов
  metric: string; // проверенные цифры через «·»
  shot: string; // кадр 16:10 в public/montage/cases/
  url: string; // страница кейса без https://
};

export const CASES: BizCase[] = [
  {
    slug: "erickson",
    title: "Erickson Central Asia",
    niche: "Коучинговый университет",
    oneLiner: "Платформа обучения с AI-куратором и менторингами",
    metric: "50 студентов · 81 урок · запуск за 2 месяца",
    shot: "/montage/cases/erickson.webp",
    url: "onai.academy/saint/cases/erickson",
  },
  {
    slug: "the-one-system",
    title: "The One System",
    niche: "Бизнес-школа, Алматы",
    oneLiner: "Своя платформа обучения с AI за 9 недель",
    metric: "78 экранов · 3 роли · 2 языка",
    shot: "/montage/cases/the-one-system.webp",
    url: "onai.academy/saint/cases/the-one-system",
  },
  {
    slug: "onai-academy",
    title: "onAI Academy",
    niche: "Моя онлайн-школа",
    oneLiner: "AI-наставник отвечает ученикам по каждому уроку",
    metric: "318 учеников · 113 уроков · 595 вопросов наставнику",
    shot: "/montage/cases/onai-academy.webp",
    url: "onai.academy/saint/cases/onai-academy",
  },
  {
    // факты: business-cases/cases/ai-targetolog/FACTS.md (облачный аудит 05.10.2026, ветка claude/quirky-carson-ei234s в onai-workspace),
    // только строки «да»; цифры клиентов и «60+ клиентов» без выгрузки не ставить. Кадр — публичный лендинг app.aoneagency.kz, блок «Как работает»
    slug: "ai-targetolog",
    title: "AI-Таргетолог",
    niche: "Свой продукт · реклама FB и IG",
    oneLiner: "Видно, какая реклама приносит продажи",
    metric: "Собрал за 3 месяца · отчёт в Telegram каждое утро · от 49 990 ₸ в месяц",
    shot: "/montage/cases/ai-targetolog.webp",
    url: "onai.academy/saint/cases/ai-targetolog",
  },
];
