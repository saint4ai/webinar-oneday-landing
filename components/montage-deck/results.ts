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

  /** Сумма просмотров трёх площадок со скринов 6 октября (RESULTS.growth.platforms): 784 967 + 98 418 + 44,4 тыс. ≈ 927 800.
   * YouTube Studio округляет до сотен, поэтому на слайдах «927 тыс.». Не число людей, не охват. */
  totalViews: "927 тыс.",
  totalViewsNum: 927, // для счётчика, тысячи

  /** 22r · «30 дней: что смонтировал агент». Главная цифра — сумма трёх площадок (totalViews). */
  montage: {
    title: "За месяц: что смонтировал агент", // было «30 дней»: окна площадок 28–30 дней (ревью Б3, 07.10)
    views: "927 тыс." as Stat | string, // главная цифра, как totalViews
    viewsLabel: "просмотров в Instagram, TikTok и YouTube",
    small: [
      { value: 852, label: "подписчика с одного рилса" }, // без «за 30 дней»: в карточке рилса нет периода
      { value: 59047, label: "взаимодействий в Instagram" }, // Meta API 05.10, раздатки «00 Аналитика на 05.10»
      { value: "+1 935", label: "чистый прирост подписчиков" }, // панель Instagram, скрин 06.10 (Telegram Desktop, IMG_8103)
    ] as StatItem[],
    source: "Окна 28–30 дней, как в приложениях. Instagram и YouTube за 30 и 28 дней, TikTok 30 августа – 26 сентября · скрины 6 октября 2026",
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
  /**
   * 10 · лента обложек со счётчиком просмотров из приложения Instagram: скрины Александра 05.10 (раздатки, папка 04, IMG_8083–8092),
   * файлы public/montage/reels/app-1..10.jpg по убыванию просмотров. Цифра нарисована на самой обложке; views — она же, для подписи.
   * Счётчик приложения у «Одно слово» 135 тыс., в панели 90 тыс.: у Instagram это разные счётчики.
   */
  appCovers: [
    { file: "app-1", views: "135 тыс.", title: "Одно слово в ссылке GitHub" },
    { file: "app-2", views: "118 тыс.", title: "4 умных коннектора для Claude" },
    { file: "app-3", views: "63,8 тыс.", title: "Claude Code и реклама в Facebook" },
    { file: "app-4", views: "62,2 тыс.", title: "Claude тестирует на Android" },
    { file: "app-5", views: "23,6 тыс.", title: "Четыре подключения" },
    { file: "app-6", views: "21,2 тыс.", title: "Правки сайта кликом" },
    { file: "app-7", views: "15,9 тыс.", title: "Защита проекта" },
    { file: "app-8", views: "14,7 тыс.", title: "Три года внедряю ИИ в бизнес" },
    { file: "app-9", views: "10,1 тыс.", title: "Скилл Карпатого" },
    { file: "app-10", views: "10,1 тыс.", title: "Если ты только начал вайбкодить" },
  ],
  appCoversSource: "Счётчик под рилсом в приложении Instagram, 5 октября 2026",

  /**
   * Мои опубликованные рилсы видеопетлями (раздатки, папка 05; петли 540×960 без звука в public/montage/reels/<video>.mp4|jpg).
   * views — счётчик приложения Instagram с обложек папки 04 (тот же, что в appCovers), 5 октября 2026.
   */
  postedReels: [
    { video: "hit-gitingest", views: "135 тыс.", title: "Одно слово в ссылке GitHub" },
    { video: "hit-connectors", views: "118 тыс.", title: "4 умных коннектора для Claude" },
    { video: "hit-artemis", views: "62,2 тыс.", title: "Claude тестирует на Android" },
    { video: "hit-podkl", views: "23,6 тыс.", title: "Четыре подключения" },
    { video: "hit-agentation", views: "21,2 тыс.", title: "Правки сайта кликом" },
    { video: "hit-zashita", views: "15,9 тыс.", title: "Защита проекта" },
  ],

  /** Откуда плитки — подпись под заголовком. */
  viralSource: "Панель статистики Instagram, топ контента по просмотрам · 5 октября 2026" as string | null,

  /**
   * 10g · «30 дней: просмотры на трёх площадках». Скрины Александра 6 октября 2026, 00:49–00:50 (Telegram Desktop, IMG_8101–8103),
   * обрезаны без статус-бара: public/montage/results/<file>.jpg. Цифры под скринами ровно с них, периоды как в приложениях.
   */
  growth: {
    platforms: [
      { file: "growth-ig", name: "Instagram", views: "784 967", period: "30 дней" },
      { file: "growth-tiktok", name: "TikTok", views: "98 418", period: "30 авг – 26 сен" },
      { file: "growth-youtube", name: "YouTube", views: "44,4 тыс.", period: "28 дней" },
    ],
    stats: [
      { value: "+1 935", label: "чистый прирост подписчиков в Instagram" },
      { value: "91,7%", label: "просмотров Instagram от неподписчиков" },
    ] as StatItem[],
    source: "Скрины Instagram, TikTok и YouTube Studio, 6 октября 2026. Окна 28–30 дней, как в приложениях. Просмотры сложены, это не число людей" as string | null,
  },

  /** 10i · «Обращения за 30 дней»: одна цифра. 2 218 человек написали в директ за 30 дней (база бота, срез Instagram AI-менеджера 07.10.2026 18:20). */
  inquiries: {
    total: "2 218" as Stat,
    label: "человек написали в директ за 30 дней",
    source: "База бота, 07.09–07.10.2026" as string | null,
  },

  /**
   * 44 · воронка одного рилса, все цифры в одном месте (сессия «Instagram AI-менеджер», база бота и Instagram Graph API, срез 07.10.2026 18:20).
   * Рилс «4 умных коннектора для Claude», 06.09.2026, кодовое слово MCP. Это тот же рилс, что на слайдах 30 и 35 (118 тыс. в приложении, 119 570 по API).
   * Заменить цифры позже = поменять числа здесь, вёрстка и подписи берут всё отсюда. Заявок и «около 70» в базе нет: это 90 диалогов и 2 заявки с телефоном.
   */
  funnel: {
    reel: "4 умных коннектора для Claude",
    published: "06.09.2026",
    codeWord: "MCP",
    views: 119570, // просмотров рилса
    comments: 1384, // комментариев с кодовым словом
    material: 1495, // человек получили материал в директ
    dialogs: 90, // диалогов с ботом
    source: "Instagram и база бота, 06.09–07.10.2026",
  },
} as const;

/** Склонение по числу: ru(1384, ["комментарий", "комментария", "комментариев"]) → «комментария». */
export const ru = (n: number, [one, few, many]: readonly [string, string, string]) => {
  const a = Math.abs(n) % 100, b = a % 10;
  return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many;
};

/** 107237 → «107 237»; null → «—». */
export const fmtStat = (v: Stat) => (v == null ? "—" : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " "));
