/**
 * Время бота воркшопа. Пояс Алматы задан фиксированным смещением (utcOffsetMinutes в
 * tg-series.json, 300 = UTC+5): перехода на летнее время в Казахстане нет. Поэтому без Intl и
 * без локальных геттеров Date, результат не зависит от TZ процесса (тесты идут с TZ=UTC
 * и TZ=America/Los_Angeles).
 *
 * «День эфира» D это строка YYYY-MM-DD по календарю Алматы: ровно так хранится у
 * подписчика и в логах отправки. Все функции принимают `now` (мс UTC) явно.
 */

const DEFAULT_OFFSET_MIN = 300;
let offsetMs = DEFAULT_OFFSET_MIN * 60_000;

/** Смещение пояса в минутах от UTC. Вызывается при загрузке серии (utcOffsetMinutes). */
export function setUtcOffsetMinutes(min: number): void {
  offsetMs = min * 60_000;
}
export const getUtcOffsetMinutes = () => offsetMs / 60_000;

/** Часть настроек из tg-series.json, от которой зависят расчёты. */
export type TimeCfg = {
  streamStart: string;
  streamMinutes: number;
  /** Сколько минут после старта ещё можно «зайти в сегодняшний эфир» по /start. По умолчанию 40. */
  joinLiveMinutes?: number;
  /** Первый день эфира: раньше этого дня эфиров нет. */
  firstDay?: string;
  /** Дни без эфира. */
  skipDays?: string[];
};

export const DEFAULT_JOIN_MINUTES = 40;

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const pad = (n: number) => String(n).padStart(2, "0");

export type WallParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Стенные части времени Алматы для абсолютного момента ms. */
export function partsInTZ(ms: number): WallParts {
  const d = new Date(ms + offsetMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

/** UTC-момент, у которого стенное время в Алматы = (y, m0, d, hour:minute:00). m0 это месяц с нуля. */
export function almatyWallToUTC(y: number, m0: number, d: number, hour: number, minute = 0): number {
  return Date.UTC(y, m0, d, hour, minute, 0) - offsetMs;
}

/** Строка дня YYYY-MM-DD по Алматы для момента ms. */
export function dayKeyOf(ms: number): string {
  const p = partsInTZ(ms);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDayKey(s: unknown): s is string {
  if (typeof s !== "string" || !DAY_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function parseDayKey(day: string): { y: number; m0: number; d: number } {
  if (!isDayKey(day)) throw new Error(`bad day key: ${day}`);
  const [y, m, d] = day.split("-").map(Number);
  return { y, m0: m - 1, d };
}

/** Сдвиг дня на n суток (переход месяца и года считает Date.UTC). */
export function addDays(day: string, n: number): string {
  const { y, m0, d } = parseDayKey(day);
  const t = new Date(Date.UTC(y, m0, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function parseHHMM(s: string): { h: number; m: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(`bad time: ${s}`);
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) throw new Error(`bad time: ${s}`);
  return { h, m: mi };
}

/** Момент (мс UTC) «день D, HH:MM по Алматы». */
export function atTime(day: string, hhmm: string): number {
  const { y, m0, d } = parseDayKey(day);
  const { h, m } = parseHHMM(hhmm);
  return almatyWallToUTC(y, m0, d, h, m);
}

/** Старт эфира дня D: streamStart из json (20:00 по Алматы). */
export function streamStart(day: string, cfg: TimeCfg): number {
  return atTime(day, cfg.streamStart);
}

/** Конец эфира дня D: старт плюс streamMinutes. */
export function streamEnd(day: string, cfg: TimeCfg): number {
  return streamStart(day, cfg) + cfg.streamMinutes * 60_000;
}

/** Конец окна «зайти в эфир по /start»: старт плюс joinLiveMinutes. */
export function joinCloses(day: string, cfg: TimeCfg): number {
  return streamStart(day, cfg) + (cfg.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES) * 60_000;
}

/** Бывает ли в этот день эфир: не раньше firstDay и не из skipDays. */
export function isStreamDay(day: string, cfg: TimeCfg): boolean {
  if (cfg.firstDay && day < cfg.firstDay) return false;
  return !(cfg.skipDays || []).includes(day);
}

/** Первый день эфира не раньше from (с учётом firstDay и skipDays). */
export function nextStreamDay(from: string, cfg: TimeCfg): string {
  let d = cfg.firstDay && cfg.firstDay > from ? cfg.firstDay : from;
  for (let i = 0; i < 400 && !isStreamDay(d, cfg); i++) d = addDays(d, 1);
  return d;
}

/** Идёт ли эфир дня D прямо сейчас: [старт, конец). */
export function isLive(day: string, now: number, cfg: TimeCfg): boolean {
  return now >= streamStart(day, cfg) && now < streamEnd(day, cfg);
}

/** Сегодняшний день эфира, если эфир идёт прямо сейчас, иначе null. */
export function liveDayNow(now: number, cfg: TimeCfg): string | null {
  const today = dayKeyOf(now);
  return isStreamDay(today, cfg) && isLive(today, now, cfg) ? today : null;
}

/**
 * Какой день эфира назначить при /start. Пока не прошло старт плюс joinLiveMinutes, это
 * сегодня (после старта человек попадает в идущий эфир). Позже: ближайший следующий день эфира.
 * День никогда не раньше firstDay и не из skipDays.
 */
export function assignStreamDay(now: number, cfg: TimeCfg): string {
  const today = dayKeyOf(now);
  if (isStreamDay(today, cfg) && now < joinCloses(today, cfg)) return today;
  return nextStreamDay(addDays(today, 1), cfg);
}

/**
 * Прямой эфир (режим event у WhatsApp, docs/tasks/automation_master_switch_event_mode.md): одна дата и своё время старта.
 * Пока режим активен, Telegram назначает всем записавшимся этот день и шлёт серию только в него, со сдвигом под start.
 */
export type EventSched = {
  date: string;
  start: string;
  /** Когда настройки прямого эфира сохранили (мс). Не задано: считаем, что сохранили только что. */
  since?: number;
};

/**
 * День сохранения прямого эфира: ежедневный эфир этого дня идёт как обычно (записавшиеся на него остаются на нём, получают ссылку и
 * живой, кнопка входа работает), ежедневных дней позже него и до даты эфира нет. Записанных на более поздние дни переписывают на дату эфира.
 */
export function eventKeepDay(ev: EventSched, now: number): string {
  return dayKeyOf(ev.since ?? now);
}

const toMin = (hhmm: string) => {
  const p = parseHHMM(hhmm);
  return p.h * 60 + p.m;
};
const fromMin = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

/** Сдвиг старта прямого эфира относительно времени, под которое написана серия, в минутах. */
export function startShiftMin(baseStart: string, start: string): number {
  return toMin(start) - toMin(baseStart);
}

/**
 * Часы в текстах серии написаны под старт в baseStart (20:00 по Алматы, 18:00 по Москве, ссылка на эфир за 10 минут до старта, 19:50).
 * Если старт другой, подставляем его: «18:00 по Москве» на московское (Алматы минус 2 часа), baseStart на start, время ссылки на
 * start минус 10 минут. Остальные числа (23:59, 21:59 по Москве и т.д.) не трогаем. Считает по строке, зависимости от пояса нет.
 */
export function retimeStream(text: string, baseStart: string, start: string): string {
  if (!start || start === baseStart) return text;
  const baseMsk = fromMin(toMin(baseStart) - 120);
  const msk = fromMin(toMin(start) - 120);
  const link = fromMin(toMin(baseStart) - 10);
  const newLink = fromMin(toMin(start) - 10);
  // Один проход по тексту: подмены не цепляются друг за друга (новый старт 19:50 не превращается в время ссылки).
  // Границы цифр и двоеточия, чтобы «20:00» не задевало «120:00» или «20:001».
  const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![\\d:])(${esc(`${baseMsk} по Москве`)}|${esc(baseStart)}|${esc(link)})(?![\\d:])`, "g");
  return text.replace(re, (m) => (m === `${baseMsk} по Москве` ? `${msk} по Москве` : m === baseStart ? start : newLink));
}

/** «Сегодня», «Завтра» или «7 октября» для дня D относительно now. */
export function dayWord(day: string, now: number): string {
  const today = dayKeyOf(now);
  if (day === today) return "Сегодня";
  if (day === addDays(today, 1)) return "Завтра";
  const { m0, d } = parseDayKey(day);
  return `${d} ${MONTHS_GEN[m0]}`;
}

/** «7 октября» для дня D без «сегодня» и «завтра». */
export function dateLabel(day: string): string {
  const { m0, d } = parseDayKey(day);
  return `${d} ${MONTHS_GEN[m0]}`;
}

/** То же с маленькой буквы: «сегодня», «завтра», «7 октября». */
export function dayWordLower(day: string, now: number): string {
  const w = dayWord(day, now);
  return w.charAt(0).toLowerCase() + w.slice(1);
}

/** «HH:MM» по Алматы, для служебных ответов владельцу. */
export function hhmmOf(ms: number): string {
  const p = partsInTZ(ms);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}
