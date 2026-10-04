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

export const RESULTS = {
  /** Месяц в заголовках слайдов результатов. */
  month: "Сентябрь",

  /** 22r · «Сентябрь: что смонтировал агент» — статистика Instagram за месяц. */
  montage: {
    views: null as Stat, // главная цифра: просмотры роликов, смонтированных агентом
    reels: null as Stat, // роликов
    saves: null as Stat, // сохранений
    followers: null as Stat, // новых подписчиков
    /** Полоса из 4 обложек рилсов месяца: имена файлов в public/montage/reels/ (без .jpg). */
    covers: ["mcp", "zashita", "google10", "papka"],
    source: "Статистика Instagram за сентябрь 2026",
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
   * 10v · «Рилсы, которые залетели» — до шести скринов рилсов с просмотрами.
   * Скрин кладётся в public/montage/results/ под именем из file: viral-1.png (подходят .png, .jpg, .jpeg, .webp).
   * views — просмотры на скрине, title — тема рилса строкой (подпись под скрином). null — пропуск.
   */
  viral: [
    { file: "viral-1", views: null as Stat, title: null as string | null },
    { file: "viral-2", views: null as Stat, title: null as string | null },
    { file: "viral-3", views: null as Stat, title: null as string | null },
    { file: "viral-4", views: null as Stat, title: null as string | null },
    { file: "viral-5", views: null as Stat, title: null as string | null },
    { file: "viral-6", views: null as Stat, title: null as string | null },
  ],
  /** Когда сняты скрины рилсов — подпись под стеной, например «Instagram, 5 октября 2026». */
  viralSource: null as string | null,

  /** 10g · «30 дней: охваты и подписчики». Скрины — public/montage/results/growth-reach.* и growth-followers.* */
  growth: {
    reachShot: "growth-reach", // скрин статистики охвата за 30 дней
    followersShot: "growth-followers", // скрин роста подписчиков за 30 дней
    followers: null as Stat, // подписчиков сейчас
    gained: null as Stat, // новых подписчиков за 30 дней
    reach: null as Stat, // охват за 30 дней (аккаунтов)
    source: null as string | null, // например «Статистика Instagram, 5 сентября — 4 октября 2026»
  },

  /** 10i · «Обращения за 30 дней»: сколько людей написали по услугам и по обучению. */
  inquiries: {
    services: null as Stat, // обращений по моим услугам: разработка, автоматизация, монтаж
    training: null as Stat, // обращений по обучению
    source: null as string | null, // откуда цифры, например «amoCRM, 5 сентября — 4 октября 2026»
  },

  /**
   * 44 · воронка одного рилса: все четыре ступени из одного источника, чтобы цифры не спорили между собой.
   * Просмотры и кодовые слова уже стояли на слайде 44 (статистика Instagram, сентябрь 2026). Это не рилс слайда 30 (107 237).
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
