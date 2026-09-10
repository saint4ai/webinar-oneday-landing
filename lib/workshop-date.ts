/**
 * Дата следующего живого эфира воркшопа.
 *
 * Правило: эфир каждый день в 20:00 ПО АЛМАТЫ. До 20:00 — показываем сегодня,
 * ровно в 20:00 и позже — завтра. Дата (число и месяц) меняется в момент
 * пересечения 20:00 Алматы.
 *
 * ВАЖНО про «все факторы» (таймзона сервера, GMT, локальное время):
 *  - Это НЕ крон/планировщик, который «срабатывает» и может промахнуться.
 *    Дата ВЫЧИСЛЯЕТСЯ из текущего абсолютного времени при каждом рендере
 *    (на клиенте — каждую секунду, на сервере — при ISR-ревалидации).
 *  - Время берём как Date.now() — это абсолютные UTC-миллисекунды от эпохи,
 *    ОДИНАКОВЫЕ на любом сервере (наш сервер вообще в UTC) и в любом браузере;
 *    они НЕ зависят от таймзоны системы.
 *  - В календарную дату Алматы переводим через IANA-пояс "Asia/Almaty"
 *    (Intl.DateTimeFormat с явным timeZone), а НЕ через хардкод смещения.
 *    Поэтому учитывается реальное смещение пояса (сейчас +05:00, без перехода
 *    на лето), а любой будущий сдвиг подхватится автоматически из tz-базы.
 *  => «20:00 Алматы» вычисляется как точный абсолютный момент. Промахнуться
 *     по таймзоне невозможно — дата выводится из времени, а не наоборот.
 */
const TZ = "Asia/Almaty";
const START_HOUR = 20; // старт эфира по Алматы
const DURATION_HOURS = 2;

// Фиксированная дата ЖИВОГО воркшопа (YYYY-MM-DD по Алматы). Пока стоит —
// лендинг / таймер / Schema показывают именно её, без ежедневного авто-переноса.
// Вернуть ежедневный эфир 20:00 → поставить null.
// 2026-06-24: null — ежедневный авто-перенос (каждый день в 20:00 Алматы → завтра).
// 2026-08-10: автосмена приостановлена по просьбе Александра.
// 2026-08-16: дата 12.08 протухла (таймер встал) → 17.08, синхронно с EasyBot.
// 2026-09-10: снова null — ежедневный авто-перенос. Причина: фиксированную дату
// надо менять руками после каждого эфира, её забыли на 24 дня и таймер стоял на нуле.
// Воронка переведена на WhatsApp-группу, EasyBot больше не диктует дату.
// ⚠️ ДАТА В ПРОШЛОМ = ТАЙМЕР НА НУЛЕ. Менять сразу после каждого эфира,
// и обязательно вместе с датой в EasyBot и в form-api/server.ts.
const FIXED_DATE: string | null = null;

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAYS = [
  "воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота",
];

const pad = (n: number) => String(n).padStart(2, "0");

type WallParts = {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number; // 0–23
  minute: number;
  second: number;
};

/** Стенные части времени в поясе Алматы для абсолютного момента ms. */
function partsInTZ(ms: number): WallParts {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const o: Record<string, number> = {};
  for (const p of dtf.formatToParts(ms)) {
    if (p.type !== "literal") o[p.type] = Number(p.value);
  }
  return {
    year: o.year,
    month: o.month,
    day: o.day,
    hour: o.hour,
    minute: o.minute,
    second: o.second,
  };
}

/**
 * UTC-инстант, у которого стенное время в Алматы = (y, m0, d, hour:00:00).
 * Итеративная коррекция по фактическому смещению пояса → DST-safe для любого пояса.
 */
function almatyWallToUTC(y: number, m0: number, d: number, hour: number): number {
  const wanted = Date.UTC(y, m0, d, hour, 0, 0);
  let utc = wanted;
  for (let i = 0; i < 3; i++) {
    const p = partsInTZ(utc);
    const wallAsUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const diff = wanted - wallAsUTC;
    if (diff === 0) break;
    utc += diff;
  }
  return utc;
}

/** Строка смещения пояса для момента ms, например "+05:00". */
function offsetString(ms: number): string {
  const p = partsInTZ(ms);
  const wallAsUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offMin = Math.round((wallAsUTC - ms) / 60000);
  const sign = offMin >= 0 ? "+" : "-";
  const abs = Math.abs(offMin);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export type NextWorkshop = {
  /** UTC-таймстамп старта эфира (мс). */
  startMs: number;
  /** Миллисекунд до старта (>= 0). */
  msUntil: number;
  /** «12 июня · пятница» — для таймера. */
  dateLabel: string;
  /** «12 июня» — короткая подпись. */
  dayMonth: string;
  /** ISO старта с реальным офсетом Алматы — для Schema.org. */
  isoStart: string;
  /** ISO конца. */
  isoEnd: string;
};

export function getNextWorkshop(nowMs: number = Date.now()): NextWorkshop {
  let startMs: number;
  if (FIXED_DATE) {
    // Фиксированный живой эфир — всегда эта дата (без ежедневного переноса).
    const [fy, fm, fd] = FIXED_DATE.split("-").map(Number);
    startMs = almatyWallToUTC(fy, fm - 1, fd, START_HOUR);
  } else {
    const now = partsInTZ(nowMs); // календарная дата Алматы «сейчас»
    startMs = almatyWallToUTC(now.year, now.month - 1, now.day, START_HOUR);
    if (nowMs >= startMs) {
      // Уже 20:00 или позже → следующий календарный день Алматы (с переносом месяца/года).
      const next = new Date(Date.UTC(now.year, now.month - 1, now.day));
      next.setUTCDate(next.getUTCDate() + 1);
      startMs = almatyWallToUTC(
        next.getUTCFullYear(),
        next.getUTCMonth(),
        next.getUTCDate(),
        START_HOUR,
      );
    }
  }

  // Подпись и ISO — от календарной даты Алматы у самого старта.
  const t = partsInTZ(startMs);
  const mo0 = t.month - 1;
  // День недели по календарной дате (UTC-полдень исключает любые краевые сдвиги).
  const dow = new Date(Date.UTC(t.year, mo0, t.day, 12, 0, 0)).getUTCDay();
  const dateAlmaty = `${t.year}-${pad(t.month)}-${pad(t.day)}`;
  const endMs = almatyWallToUTC(t.year, mo0, t.day, START_HOUR + DURATION_HOURS);

  return {
    startMs,
    msUntil: Math.max(0, startMs - nowMs),
    dateLabel: `${t.day} ${MONTHS_GEN[mo0]} · ${WEEKDAYS[dow]}`,
    dayMonth: `${t.day} ${MONTHS_GEN[mo0]}`,
    isoStart: `${dateAlmaty}T${pad(START_HOUR)}:00:00${offsetString(startMs)}`,
    isoEnd: `${dateAlmaty}T${pad(START_HOUR + DURATION_HOURS)}:00:00${offsetString(endMs)}`,
  };
}
