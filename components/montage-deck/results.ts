/**
 * Результаты за месяц для слайдов 10v, 10g, 10i (рилсы, охваты, обращения), 22r, 46r, 47r и воронки 44.
 * Владелец вписывает сюда цифры — вёрстку трогать не нужно.
 *
 * Как заполнять:
 * - цифра — числом без пробелов: 107237 (на слайде станет «107 237»);
 * - null — цифры пока нет: на слайде «—» и пометка «ждёт цифры»;
 * - скриншоты — файлы в public/montage/results/ с именами ниже. Нет файла — на слайде пунктирное место с подсказкой.
 *   Файл подхватывается сам при следующем запуске ./webinar.sh (сборка начисто).
 */
export type Stat = number | null;
/** Цифра с подписью для карточек. Строка («91,7%») показывается как есть. */
export type StatItem = { value: Stat | string; label: string };

export const RESULTS = {
  /** Месяц в заголовках слайдов результатов 46r и 47r (вне показа 6 октября). */
  month: "Сентябрь",

  /**
   * 22r · «30 дней: что смонтировал агент». Срез 4 октября 2026, три площадки (docs/tasks/deck_wave2.json).
   * 825 701 — сумма просмотров Instagram, TikTok и YouTube: не число людей, не охват.
   */
  montage: {
    title: "30 дней: что смонтировал агент",
    views: 825701 as Stat, // главная цифра
    viewsLabel: "просмотр в Instagram, TikTok и YouTube",
    small: [
      { value: 852, label: "подписчика с одного рилса" }, // без «за 30 дней»: в карточке рилса нет периода
      { value: 45561, label: "взаимодействие в Instagram" },
      { value: 1714, label: "чистый прирост подписчиков" }, // 2 321 новых минус 607 отписок, Instagram API
    ] as StatItem[],
    /** Полоса из 4 обложек залетевших рилсов: имена файлов в public/montage/reels/ (без .jpg), собирает docs/deck-v2/build-handout-assets.mjs. */
    covers: ["hit-connectors", "hit-gitingest", "hit-artemis", "hit-semrush"],
    source: "Instagram, TikTok, YouTube · 4 сентября — 3 октября 2026 · срез 4 октября",
  },

  /** 46r · «Сентябрь: ИИ-бот в директе». Статистика бота за весь месяц. */
  bot: {
    dialogs: null as Stat, // главная цифра: диалогов с ботом
    codeWords: null as Stat, // кодовых слов в комментариях и директе
    leads: null as Stat, // заявок передано менеджеру
    avgReply: null as string | null, // среднее время ответа, строкой: «40 секунд»
    screenshot: "bot.png", // public/montage/results/bot.png — скрин переписки или статистики бота
    source: "Статистика бота за сентябрь 2026",
  },

  /** 47r · «Заявки с блога за месяц». */
  blog: {
    leads: null as Stat, // заявок с блога за месяц
    source: null as string | null, // откуда цифра — подпись под ней, например «amoCRM, сентябрь 2026»
    screenshot: "blog-leads.png", // public/montage/results/blog-leads.png — скрин заявок из CRM
  },

  /**
   * 10v · «Рилсы, которые залетели» — пять плиток из блока «Топ контента по просмотрам» профессиональной панели Instagram, срез 5 октября
   * (раздатки, папка 01; плитки вырезает docs/deck-v2/build-handout-assets.mjs). Решение Александра 05.10: на слайдах цифры панели,
   * потому что Meta и панель их подтверждают. Счётчик в приложении у Instagram свой: у «Одно слово» там 135 тыс., в панели 90 тыс.
   * Картинка лежит в public/montage/results/ под именем из file (подходят .png, .jpg, .jpeg, .webp).
   * views — строка ровно с того счётчика, что виден на самой плитке; title — тема рилса; date — дата выхода, как в панели. null — пропуск.
   */
  viral: [
    { file: "viral-1", views: "116 тыс." as string | null, title: "4 умных коннектора для Claude" as string | null, date: "6 сентября" as string | null },
    { file: "viral-2", views: "90 тыс." as string | null, title: "Одно слово в ссылке GitHub" as string | null, date: "3 октября" as string | null },
    { file: "viral-3", views: "61,7 тыс." as string | null, title: "Claude тестирует на Android" as string | null, date: "28 сентября" as string | null },
    { file: "viral-4", views: "29,8 тыс." as string | null, title: "Открытая замена Semrush" as string | null, date: "28 сентября" as string | null },
    { file: "viral-5", views: "21,6 тыс." as string | null, title: "Четыре подключения" as string | null, date: "25 сентября" as string | null },
  ],
  /** Откуда плитки — подпись под заголовком. */
  viralSource: "Instagram · профессиональная панель, топ контента по просмотрам · 5 октября 2026" as string | null,

  /**
   * 10g · «30 дней: охваты и подписчики». Instagram, профессиональная панель, срез 5 октября 2026 (скрины раздаток, 16:50).
   * Скрины — public/montage/results/growth-reach.* и growth-followers.*; цифры в карточках ровно с этих скринов.
   */
  growth: {
    reachShot: "growth-reach", // просмотры 784 840, 8,3% / 91,7%, зрители 342 807
    followersShot: "growth-followers", // подписчики 16 402 и часы наибольшей активности
    stats: [
      { value: 16402, label: "подписчиков сейчас" },
      { value: 342807, label: "зрителей за 30 дней" },
      { value: "91,7%", label: "просмотров от неподписчиков" },
    ] as StatItem[],
    source: "Instagram, последние 30 дней · срез 5 октября 2026 · профессиональная панель" as string | null,
  },

  /** 10i · «Обращения за 30 дней»: одна цифра. 101 человек дошёл до раздела с предложениями в директ-боте AI-РОП, без разбивки по услугам и обучению. */
  inquiries: {
    total: 101 as Stat,
    label: "обращение: услуги, консультации, онлайн-обучение",
    source: "Директ-бот AI-РОП: дошли до раздела с предложениями, 4 сентября — 3 октября 2026" as string | null,
  },

  /**
   * 44 · воронка одного рилса: все четыре ступени из одного источника, чтобы цифры не спорили между собой.
   * Просмотры и кодовые слова уже стояли на слайде 44 (статистика Instagram, сентябрь 2026). Это не рилс слайда 30 (116 тыс.).
   */
  funnel: {
    reel: null as string | null, // название рилса, строкой: подпись под воронкой. null — на слайде пропуск [название рилса]
    views: 1773 as Stat, // просмотров рилса
    codeWords: 68 as Stat, // комментариев с кодовым словом
    dialogs: null as Stat, // диалогов с ботом по этому рилсу
    leads: null as Stat, // заявок по этому рилсу
  },
} as const;

/** 107237 → «107 237»; null → «—». */
export const fmtStat = (v: Stat) => (v == null ? "—" : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " "));
