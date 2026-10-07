/**
 * Бот воркшопа @workshop_aiprod_bot: вебхук, приветствие, подстановки, отправка,
 * команды владельцев, переход в эфир (/api/go/<token>) и клики со страницы «Спасибо».
 *
 * Тексты не живут в коде: всё из tg-series.json, который читается с диска из папки рядом
 * с бандлом (на сервере /opt/workshop-form/). Нет файла или он не прошёл проверку: бот
 * выключен, ошибка в логе, приём заявок работает. `/reload` перечитывает файл без рестарта.
 * Секреты и env читаем лениво, при вызове: loadEnv() в server.ts выполняется после
 * импортов, на верхнем уровне модуля env ещё пустой.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { noteRuntime, runtime, TgStore, type Audience, type Overrides, type Subscriber } from "./tg-store";
import {
  adminKeyboard,
  adminVersion,
  datePickerKeyboard,
  menuKeyboard,
  parseAdminCb,
  renderErrors,
  renderReport,
  renderUtmByDay,
  type AdminButton,
  type AdminCtx,
} from "./tg-admin";
import {
  DEFAULT_JOIN_MINUTES,
  addDays,
  assignStreamDay,
  atTime,
  dateLabel,
  dayKeyOf,
  dayWord,
  dayWordLower,
  isDayKey,
  isLive,
  isStreamDay,
  liveDayNow,
  parseHHMM,
  setUtcOffsetMinutes,
  streamEnd,
  type TimeCfg,
} from "./tg-time";

// ───────────────────────── конфиг ─────────────────────────

const env = (k: string) => (process.env[k] || "").trim();

export const botToken = () => env("TG_WORKSHOP_BOT_TOKEN");
export const webhookSecret = () => env("TG_WORKSHOP_WEBHOOK_SECRET");
/** Ключ подписи ссылок перехода: отдельный от секрета вебхука. */
export const goSecret = () => env("TG_GO_SECRET");
export const ownerIds = () => env("TG_LINK_OWNER_IDS").split(",").map((s) => s.trim()).filter(Boolean);
/** Выключатель: TG_BOT=off, бот и планировщик не стартуют, приём заявок работает. */
const botOff = () => env("TG_BOT").toLowerCase() === "off";
const apiBase = () => env("TG_API_BASE").replace(/\/+$/, "") || "https://api.telegram.org";

export function isOwner(userId: number | string | undefined): boolean {
  const ids = ownerIds();
  // Fail-closed: пустой список владельцев никого не пускает.
  return userId !== undefined && ids.length > 0 && ids.includes(String(userId));
}

/**
 * Кто может открыть мини-приложение админки: ADMIN_APP_IDS через запятую, не задан это Александр
 * (789638302). Задан, но пустой: не пускаем никого.
 */
export function adminAppIds(): string[] {
  const raw = process.env.ADMIN_APP_IDS;
  return (raw === undefined ? "789638302" : raw).split(",").map((s) => s.trim()).filter(Boolean);
}
export function isAdminAppUser(userId: number | string | undefined): boolean {
  return userId !== undefined && adminAppIds().includes(String(userId));
}
/** Публичный адрес мини-приложения (nginx: /workshop/api/X уходит на :4010/api/X). Переопределяется ADMIN_APP_URL. */
export const adminAppUrl = () => env("ADMIN_APP_URL") || "https://onai.academy/workshop/api/admin-app";

/** Публичный адрес перехода в эфир (nginx: /workshop/api/X уходит на :4010/api/X). */
const GO_BASE = "https://onai.academy/workshop/api/go";
/** Тело вебхука Telegram. Больше лимита: отвечаем 200 и выбрасываем. */
const MAX_UPDATE_BODY = 64 * 1024;
const API_TIMEOUT_MS = 10_000;
/** Запасная ссылка эфира, если серия не загружена, а старые ссылки перехода ещё живут у людей в чатах. */
const DEFAULT_BIZON = "https://start.bizon365.ru/room/196985/BguY0kXF-l";
const DEFAULT_REJOIN_ACK = "Готово, ссылку пришлю сюда в 19:50.";
const OTHER_THROTTLE_MS = 10 * 60_000;
const SEEN_UPDATES = 1000;

// ───────────────────────── серия (tg-series.json) ─────────────────────────

export type Button = { text: string; url?: string; callback?: string };
export type Media = { type: "photo" | "video"; url: string; poster?: string; width?: number; height?: number; duration?: number };
export type SeriesMsg = {
  id: string;
  at: string;
  dayOffset?: number;
  audience: Audience;
  enabled?: boolean;
  /** true: отправлять без звука (disable_notification), для «что сейчас на эфире». */
  silent?: boolean;
  /** true: обязательное, планировщик шлёт его даже при выключенной серии (/series_off). */
  essential?: boolean;
  media?: Media;
  text: string;
  buttons?: Button[][];
};
export type Links = {
  bizon: string;
  manager: string;
  managerName: string;
  whatsapp: string;
  whatsappPhone: string;
  pay: string;
  prepayKz: string;
  prepayIntl: string;
  cases: string;
  game: string;
  template: string;
};
export type Welcome = {
  media: Media;
  before: string;
  live: string;
  liveButtons: Button[][];
  /** Отдельное сообщение для записавшихся после окна live, пока сегодняшний эфир ещё идёт. */
  lateToday?: string;
  stop: string;
  other: string;
  paidAck: string;
  rejoinAck?: string;
};
export type Series = {
  version: string;
  timezone: string;
  utcOffsetMinutes?: number;
  firstDay?: string;
  skipDays?: string[];
  streamStart: string;
  streamMinutes: number;
  joinLiveMinutes?: number;
  graceMinutes: number;
  /** Время утреннего отчёта админам за вчера, HH:MM по Алматы. По умолчанию 09:00. */
  adminDailyReportAt?: string;
  links: Links;
  welcome: Welcome;
  messages: SeriesMsg[];
};

const AUDIENCES = ["all", "clicked", "notClicked", "notPaid"];
const LINK_KEYS = ["bizon", "manager", "managerName", "whatsapp", "whatsappPhone", "pay", "prepayKz", "prepayIntl", "cases", "game", "template"];
const TEXT_VARS = ["hi", "dayWord", "dayWordLower", "TEMPLATE"];
const URL_VARS = ["STREAM", "PAY", "PREPAY_KZ", "PREPAY_INTL", "MANAGER", "CASES", "GAME", "WHATSAPP_TEMPLATE"];
const HTML_TAGS = new Set(["b", "strong", "i", "em", "u", "ins", "s", "strike", "del", "code", "pre", "a", "tg-spoiler", "blockquote"]);

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function allStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => allStrings(v, out));
  else if (isObj(x)) Object.values(x).forEach((v) => allStrings(v, out));
  return out;
}

/** Текст из json считается доверенным HTML Telegram: проверяем, что теги закрыты, нет лишнего < и голого &. */
function checkHtml(s: string, where: string) {
  const stack: string[] = [];
  const re = /<(\/?)([A-Za-z][\w-]*)[^<>]*>|<|&(?!#?\w+;)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[0] === "<") throw new Error(`${where}: лишний символ < (экранируй как &lt;)`);
    if (m[0] === "&") throw new Error(`${where}: голый & (пиши &amp;)`);
    const name = m[2].toLowerCase();
    if (!HTML_TAGS.has(name)) throw new Error(`${where}: тег <${name}> Telegram не поддерживает`);
    if (m[1] === "/") {
      if (stack.pop() !== name) throw new Error(`${where}: тег </${name}> закрыт не там`);
    } else stack.push(name);
  }
  if (stack.length) throw new Error(`${where}: не закрыт тег <${stack[stack.length - 1]}>`);
}

function checkText(s: unknown, where: string) {
  if (typeof s !== "string" || !s) throw new Error(`${where}: нужен непустой текст`);
  for (const m of s.matchAll(/\{(\w+)\}/g)) {
    if (!TEXT_VARS.includes(m[1])) throw new Error(`${where}: неизвестная подстановка {${m[1]}}`);
  }
  checkHtml(s, where);
}

function checkMedia(m: unknown, where: string) {
  if (!isObj(m) || (m.type !== "photo" && m.type !== "video") || typeof m.url !== "string" || !/^https:\/\//.test(m.url)) {
    throw new Error(`${where}: media должен быть { type: photo|video, url: https://... }`);
  }
  if (m.poster !== undefined && typeof m.poster !== "string") throw new Error(`${where}: poster должен быть строкой`);
  for (const k of ["width", "height", "duration"]) {
    if (m[k] !== undefined && (typeof m[k] !== "number" || (m[k] as number) <= 0)) throw new Error(`${where}: ${k} должен быть положительным числом`);
  }
}

function checkButtons(b: unknown, where: string) {
  if (b === undefined) return;
  if (!Array.isArray(b)) throw new Error(`${where}: buttons должен быть массивом рядов`);
  for (const row of b) {
    if (!Array.isArray(row)) throw new Error(`${where}: ряд кнопок должен быть массивом`);
    for (const btn of row) {
      if (!isObj(btn) || typeof btn.text !== "string" || !btn.text) throw new Error(`${where}: у кнопки нет text`);
      const hasUrl = typeof btn.url === "string";
      const hasCb = typeof btn.callback === "string";
      if (hasUrl === hasCb) throw new Error(`${where}: у кнопки «${btn.text}» нужен ровно один из url или callback`);
      if (hasCb && (!btn.callback || Buffer.byteLength(btn.callback as string) > 64)) throw new Error(`${where}: callback кнопки «${btn.text}» длиннее 64 байт`);
      if (hasUrl) {
        const url = btn.url as string;
        for (const m of url.matchAll(/\{(\w+)\}/g)) {
          if (!URL_VARS.includes(m[1])) throw new Error(`${where}: у кнопки «${btn.text}» неизвестная подстановка {${m[1]}}`);
        }
        if (!/\{\w+\}/.test(url) && !/^https:\/\/\S+$/.test(url)) throw new Error(`${where}: у кнопки «${btn.text}» адрес должен быть https`);
      }
    }
  }
}

/**
 * Проверка структуры и текстов серии. Бросает Error с понятным текстом: старая серия при
 * /reload остаётся в работе, а при старте бот выключается.
 */
export function validateSeries(raw: unknown): Series {
  if (!isObj(raw)) throw new Error("серия: корень должен быть объектом");
  for (const s of allStrings(raw)) {
    if (s.includes(String.fromCharCode(0x2014))) throw new Error(`серия: длинное тире в «${s.slice(0, 50)}»`);
  }
  if (raw.timezone !== "Asia/Almaty") throw new Error("серия: timezone должен быть Asia/Almaty");
  if (typeof raw.version !== "string") throw new Error("серия: нет version");
  if (raw.utcOffsetMinutes !== undefined && (!Number.isInteger(raw.utcOffsetMinutes) || Math.abs(raw.utcOffsetMinutes as number) > 14 * 60)) {
    throw new Error("серия: utcOffsetMinutes целое число минут (300 для Алматы)");
  }
  if (raw.firstDay !== undefined && !isDayKey(raw.firstDay)) throw new Error("серия: firstDay вида YYYY-MM-DD");
  if (raw.skipDays !== undefined && (!Array.isArray(raw.skipDays) || !raw.skipDays.every(isDayKey))) throw new Error("серия: skipDays массив дней YYYY-MM-DD");
  if (typeof raw.streamStart !== "string" || !/^\d{1,2}:\d{2}$/.test(raw.streamStart)) throw new Error("серия: streamStart вида HH:MM");
  try {
    parseHHMM(raw.streamStart);
  } catch {
    throw new Error("серия: streamStart не время");
  }
  if (typeof raw.streamMinutes !== "number" || raw.streamMinutes <= 0) throw new Error("серия: streamMinutes должен быть числом больше 0");
  if (raw.joinLiveMinutes !== undefined && (typeof raw.joinLiveMinutes !== "number" || raw.joinLiveMinutes < 0)) throw new Error("серия: joinLiveMinutes число минут");
  if (typeof raw.graceMinutes !== "number" || raw.graceMinutes < 0) throw new Error("серия: graceMinutes должен быть числом");
  if (raw.adminDailyReportAt !== undefined) {
    try {
      if (typeof raw.adminDailyReportAt !== "string") throw new Error("not a string");
      parseHHMM(raw.adminDailyReportAt);
    } catch {
      throw new Error("серия: adminDailyReportAt вида HH:MM");
    }
  }
  if (!isObj(raw.links)) throw new Error("серия: нет links");
  for (const k of LINK_KEYS) {
    if (typeof raw.links[k] !== "string") throw new Error(`серия: links.${k} должен быть строкой`);
  }
  if (!/^https:\/\//.test(raw.links.bizon as string)) throw new Error("серия: links.bizon должен быть https-ссылкой");
  const w = raw.welcome;
  if (!isObj(w)) throw new Error("серия: нет welcome");
  checkMedia(w.media, "welcome");
  for (const k of ["before", "live", "stop", "other", "paidAck"]) checkText(w[k], `welcome.${k}`);
  for (const k of ["lateToday", "rejoinAck"]) if (w[k] !== undefined) checkText(w[k], `welcome.${k}`);
  checkButtons(w.liveButtons, "welcome.liveButtons");
  if (!Array.isArray(raw.messages)) throw new Error("серия: messages должен быть массивом");
  const ids = new Set<string>();
  for (const m of raw.messages) {
    if (!isObj(m) || typeof m.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(m.id)) throw new Error("серия: у сообщения нужен id из букв, цифр, _ и - (до 40 символов)");
    if (ids.has(m.id)) throw new Error(`серия: id «${m.id}» повторяется`);
    ids.add(m.id);
    const where = `сообщение ${m.id}`;
    if (typeof m.at !== "string" || !/^\d{1,2}:\d{2}$/.test(m.at)) throw new Error(`${where}: at вида HH:MM`);
    try {
      parseHHMM(m.at);
    } catch {
      throw new Error(`${where}: at не время`);
    }
    if (typeof m.audience !== "string" || !AUDIENCES.includes(m.audience)) throw new Error(`${where}: audience из ${AUDIENCES.join(", ")}`);
    checkText(m.text, where);
    if (m.dayOffset !== undefined && (!Number.isInteger(m.dayOffset) || (m.dayOffset as number) < 0 || (m.dayOffset as number) > 3)) {
      throw new Error(`${where}: dayOffset целое от 0 до 3`);
    }
    if (m.enabled !== undefined && typeof m.enabled !== "boolean") throw new Error(`${where}: enabled должен быть true или false`);
    if (m.silent !== undefined && typeof m.silent !== "boolean") throw new Error(`${where}: silent должен быть true или false`);
    if (m.essential !== undefined && typeof m.essential !== "boolean") throw new Error(`${where}: essential должен быть true или false`);
    if (m.media !== undefined) checkMedia(m.media, where);
    checkButtons(m.buttons, where);
  }
  return raw as unknown as Series;
}

/** Не ошибки, но то, о чём стоит знать: подпись с самым длинным именем не влезет в 1024 и будет разбита. */
export function seriesWarnings(sr: Series): string[] {
  const out: string[] = [];
  const ctx: RenderCtx = { series: sr, now: Date.now(), chatId: 1, firstName: "Ж".repeat(64), day: dayKeyOf(Date.now()) };
  const check = (id: string, c: { media?: Media; text: string }) => {
    const n = visibleLength(expandText(c.text, ctx));
    if (c.media && n > 1024) out.push(`${id}: подпись с длинным именем ${n} символов, больше 1024, уйдёт двумя сообщениями (картинка и текст)`);
    if (n > 4096) out.push(`${id}: текст ${n} символов, больше 4096, Telegram не примет`);
  };
  check("welcome.before", { media: sr.welcome.media, text: sr.welcome.before });
  for (const m of sr.messages) check(m.id, m);
  return out;
}

let store: TgStore | null = null;
let series: Series | null = null;
let botError = "";

export function getStore(): TgStore {
  if (!store) throw new Error("tg-workshop не инициализирован (initTgWorkshop)");
  return store;
}
export function getSeries(): Series {
  if (!series) throw new Error("серия не загружена");
  return series;
}
/** Бот работает: не выключен переключателем и серия загружена и проверена. */
export const botEnabled = () => !botOff() && !!series && !!store;
/** Всё, что нужно для работы: токен, секрет вебхука, ключ ссылок перехода. */
export const botConfigured = () => !!botToken() && !!webhookSecret() && !!goSecret();
export const timeCfg = (s: Series): TimeCfg => ({
  streamStart: s.streamStart,
  streamMinutes: s.streamMinutes,
  joinLiveMinutes: s.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES,
  firstDay: s.firstDay,
  skipDays: s.skipDays,
});

/** Серия с правками владельца поверх json (/at, /off, /on). */
export function applyOverrides(sr: Series, ov: Overrides): Series {
  return {
    ...sr,
    messages: sr.messages.map((m) => {
      const o = ov[m.id];
      if (!o) return m;
      return { ...m, ...(o.at ? { at: o.at } : {}), ...(o.enabled !== undefined ? { enabled: o.enabled } : {}) };
    }),
  };
}
export function activeSeries(): Series {
  return applyOverrides(getSeries(), getStore().state.overrides);
}

function seriesPath(explicit?: string): string {
  return explicit || env("TG_SERIES_FILE") || join(__dirname, "tg-series.json");
}

/**
 * Загрузить и проверить серию с диска. Бросает ошибку (файла нет, не json, не прошла проверка),
 * тогда прежняя серия остаётся в работе. Смещение пояса берётся из utcOffsetMinutes.
 */
export function reloadSeries(explicit?: string): { version: string; count: number; warnings: string[] } {
  const loaded = validateSeries(JSON.parse(readFileSync(seriesPath(explicit), "utf8")));
  series = loaded;
  botError = "";
  setUtcOffsetMinutes(loaded.utcOffsetMinutes ?? 300);
  return { version: loaded.version, count: loaded.messages.length, warnings: seriesWarnings(loaded) };
}

/**
 * Старт модуля: открыть хранилище и загрузить серию. Серия не прочиталась или не прошла
 * проверку: бот выключен, ошибка в логе, процесс и приём заявок живут. TG_BOT=off: то же без загрузки.
 */
export function initTgWorkshop(opts: { dir?: string; seriesFile?: string } = {}): TgStore {
  series = null;
  botError = "";
  store = new TgStore(opts.dir || env("DATA_DIR") || join(__dirname, "data"));
  if (botOff()) {
    botError = "off";
    console.log("[tg] TG_BOT=off: бот и планировщик не запущены");
    return store;
  }
  try {
    const r = reloadSeries(opts.seriesFile);
    console.log("[tg] серия %s, сообщений %d", r.version, r.count);
    for (const w of r.warnings) console.warn("[tg] предупреждение: %s", w);
  } catch (e) {
    botError = (e as Error).message;
    console.error("[tg] серия не загружена, бот выключен: %s", botError);
  }
  return store;
}

/** Блок tgBot для /health: без секретов. */
export function tgHealth() {
  return {
    configured: botEnabled() && botConfigured(),
    seriesEnabled: store?.state.seriesEnabled ?? false,
    subscribers: store?.subs.size ?? 0,
    ...(botError ? { error: botError } : {}),
  };
}

// ───────────────────────── Bot API ─────────────────────────

export type BotResult<T = unknown> =
  | { ok: true; result: T }
  | {
      ok: false;
      code: number;
      description: string;
      retryAfter?: number;
      /** Сеть отказала ещё до установления соединения: запрос до Telegram не дошёл, повторять безопасно. */
      connectFail?: boolean;
    };

/** Коды ошибок сокета, при которых запрос точно не был отправлен (соединение не установлено). */
const CONNECT_FAIL_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]);

const scrub = (s: string) => {
  const t = botToken();
  return t ? s.split(t).join("***") : s;
};
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Один вызов Bot API с таймаутом 10 с. Не бросает: ошибка приходит значением, токен вычищается. */
export async function botCall<T = unknown>(method: string, params: Record<string, unknown> | FormData, timeoutMs = API_TIMEOUT_MS): Promise<BotResult<T>> {
  const token = botToken();
  if (!token) return { ok: false, code: 0, description: "no_token" };
  try {
    const init: RequestInit =
      params instanceof FormData
        ? { method: "POST", body: params }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) };
    const res = await fetch(`${apiBase()}/bot${token}/${method}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      result?: T;
      error_code?: number;
      description?: string;
      parameters?: { retry_after?: number };
    } | null;
    if (data?.ok) return { ok: true, result: data.result as T };
    return {
      ok: false,
      code: data?.error_code ?? res.status,
      description: scrub(String(data?.description ?? res.statusText)),
      retryAfter: data?.parameters?.retry_after,
    };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const timeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      ok: false,
      code: 0,
      description: timeout ? "timeout" : scrub(String(err?.message || err)),
      ...(!timeout && err?.cause?.code && CONNECT_FAIL_CODES.has(err.cause.code) ? { connectFail: true } : {}),
    };
  }
}

// Общий ограничитель на все исходящие запросы бота: не быстрее 20 в секунду. Две очереди:
// «hi» (приветствия, ответы людям, команды) обгоняет «lo» (рассылка серии). На 429 пауза
// у всей очереди сразу, а не только у того запроса, что получил отказ.
const MIN_GAP_MS = 50;
export type Prio = "hi" | "lo";
const waitHi: Array<() => void> = [];
const waitLo: Array<() => void> = [];
let pumping = false;
let lastCallAt = 0;
let pausedUntil = 0;

export function acquireSlot(prio: Prio): Promise<void> {
  return new Promise((resolve) => {
    (prio === "hi" ? waitHi : waitLo).push(resolve);
    void pump();
  });
}

async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    while (waitHi.length || waitLo.length) {
      const wait = Math.max(lastCallAt + MIN_GAP_MS, pausedUntil) - Date.now();
      if (wait > 0) {
        await sleep(wait);
        continue;
      }
      const next = waitHi.shift() ?? waitLo.shift();
      lastCallAt = Date.now();
      next?.();
    }
  } finally {
    pumping = false;
  }
}

/** Пауза всей очереди (ответ 429 с retry_after). */
export function pauseAll(seconds: number) {
  pausedUntil = Math.max(pausedUntil, Date.now() + Math.min(60, Math.max(0, seconds)) * 1000 + 250);
}

/**
 * Вызов через общий ограничитель. 429: пауза всей очереди и повтор (Telegram запрос не принял).
 * Сетевая ошибка: одна повторная попытка, но никогда после таймаута (запрос мог дойти и
 * выполниться). retryNet "connect" (медиа) повторяет только отказ до установления соединения,
 * чтобы видео на 13 МБ не ушло дважды.
 */
async function botSend<T = unknown>(
  method: string,
  params: Record<string, unknown>,
  prio: Prio = "hi",
  opts: { timeoutMs?: number; retryNet?: "any" | "connect" } = {},
): Promise<BotResult<T>> {
  let netRetried = false;
  let r: BotResult<T> = { ok: false, code: 0, description: "not_sent" };
  for (let attempt = 0; attempt < 4; attempt++) {
    await acquireSlot(prio);
    r = await botCall<T>(method, params, opts.timeoutMs);
    if (r.ok) return r;
    if (r.code === 429) {
      pauseAll(r.retryAfter ?? 1);
      continue;
    }
    if (r.code === 0 && !netRetried && r.description !== "timeout" && (opts.retryNet === "connect" ? r.connectFail : true)) {
      netRetried = true;
      continue;
    }
    break;
  }
  return r;
}

/** Таймаут запроса sendPhoto/sendVideo по URL: Telegram сам скачивает файл, это дольше обычного вызова. */
const mediaTimeout = () => Number(env("TG_MEDIA_TIMEOUT_MS")) || 60_000;

export type SendResult = { ok: boolean; code?: number; error?: string };
const toSend = (r: BotResult): SendResult => (r.ok ? { ok: true } : { ok: false, code: r.code, error: `${r.code} ${r.description}` });

/** Получатель недоступен насовсем: заблокировал бота, аккаунт удалён (403) или чат не найден (400). */
export function isGone(r: SendResult): boolean {
  return !r.ok && (r.code === 403 || (r.code === 400 && /chat not found/i.test(r.error || "")));
}

// ───────────────────────── подстановки ─────────────────────────

export type InlineButton = { text: string; url?: string; callback_data?: string; web_app?: { url: string } };

export type RenderCtx = {
  series: Series;
  now: number;
  chatId: number;
  firstName?: string;
  /** День эфира D, для которого собираем сообщение. */
  day: string;
  /** День, на который ведёт {STREAM}, если он не равен D (запись на завтра, а сегодняшний эфир ещё идёт). */
  liveDay?: string;
  /** Предпросмотр владельцу: пустую оплату показываем кнопкой менеджера. */
  preview?: boolean;
};

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Длина подписи по правилу Telegram: после разбора разметки, без тегов и сущностей. */
export function visibleLength(html: string): number {
  return html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").length;
}

export function goUrl(chatId: number, day: string): string {
  const t = makeGoToken(chatId, day);
  return t ? `${GO_BASE}/${t}` : "";
}

function textVars(ctx: RenderCtx): Record<string, string> {
  const name = (ctx.firstName || "").replace(/\s+/g, " ").trim().slice(0, 64);
  return {
    hi: name ? `Привет, ${name}!` : "Привет!",
    dayWord: dayWord(ctx.day, ctx.now),
    dayWordLower: dayWordLower(ctx.day, ctx.now),
    TEMPLATE: ctx.series.links.template,
  };
}

/**
 * Текст сообщения. Тело из json считается доверенным HTML (там есть <code>), поэтому
 * экранируем только подставляемые значения: имя человека и {TEMPLATE}.
 */
export function expandText(tpl: string, ctx: RenderCtx): string {
  const vars = textVars(ctx);
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (Object.prototype.hasOwnProperty.call(vars, k) ? escapeHtml(vars[k]) : m));
}

function urlVars(ctx: RenderCtx): Record<string, string> {
  const l = ctx.series.links;
  // В предпросмотре пустые ссылки оплаты заменяем ссылкой на менеджера, чтобы владелец увидел кнопку.
  const pv = (v: string) => v || (ctx.preview ? l.manager : "");
  return {
    STREAM: goUrl(ctx.chatId, ctx.liveDay ?? ctx.day),
    PAY: pv(l.pay),
    PREPAY_KZ: pv(l.prepayKz),
    PREPAY_INTL: pv(l.prepayIntl),
    MANAGER: l.manager,
    CASES: l.cases,
    GAME: l.game,
    WHATSAPP_TEMPLATE: l.whatsapp ? `${l.whatsapp}?text=${encodeURIComponent(l.template)}` : "",
  };
}

/** Адрес кнопки: подставить {PLACEHOLDER}. Пустой, не http(s) или с неразвёрнутым {X} даёт пустую строку. */
export function expandUrl(url: string, ctx: RenderCtx): string {
  const vars = urlVars(ctx);
  const out = url.replace(/\{(\w+)\}/g, (m, k: string) => (Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m)).trim();
  return /^https?:\/\/[^\s{}]+$/i.test(out) ? out : "";
}

/** Кнопки сообщения. Кнопка с пустым адресом выпадает, пустой ряд тоже. */
export function buildKeyboard(rows: Button[][] | undefined, ctx: RenderCtx): InlineButton[][] | undefined {
  if (!rows) return undefined;
  const out: InlineButton[][] = [];
  for (const row of rows) {
    const r: InlineButton[] = [];
    for (const b of row) {
      if (b.callback) {
        r.push({ text: b.text, callback_data: b.callback });
        continue;
      }
      const url = b.url ? expandUrl(b.url, ctx) : "";
      if (url) r.push({ text: b.text, url });
    }
    if (r.length) out.push(r);
  }
  return out.length ? out : undefined;
}

// ───────────────────────── токен перехода /api/go ─────────────────────────

const signGo = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url").slice(0, 12);

/** base64url("<chat_id>:<D>") + "." + первые 12 символов base64url(HMAC-SHA256(TG_GO_SECRET, "<chat_id>:<D>")). */
export function makeGoToken(chatId: number, day: string, secret: string = goSecret()): string {
  if (!secret) return "";
  const payload = `${chatId}:${day}`;
  return `${Buffer.from(payload).toString("base64url")}.${signGo(payload, secret)}`;
}

export function verifyGoToken(token: string, secret: string = goSecret()): { chatId: number; day: string } | null {
  if (!secret || typeof token !== "string" || token.length > 200) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const payload = Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
  const m = /^(-?\d{1,15}):(\d{4}-\d{2}-\d{2})$/.exec(payload);
  if (!m || !isDayKey(m[2])) return null;
  const given = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(signGo(payload, secret));
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;
  return { chatId: Number(m[1]), day: m[2] };
}

// ───────────────────────── отправка ─────────────────────────

export type Content = { media?: Media; text: string; buttons?: Button[][]; silent?: boolean };

type PhotoSize = { file_id: string; width?: number; height?: number };
type SentMessage = { photo?: PhotoSize[]; video?: { file_id?: string; cover?: PhotoSize[] } };

/** file_id самого большого размера. */
function largest(sizes: PhotoSize[] | undefined): string | undefined {
  if (!Array.isArray(sizes) || !sizes.length) return undefined;
  return sizes.reduce((a, b) => ((b.width ?? 0) * (b.height ?? 0) >= (a.width ?? 0) * (a.height ?? 0) ? b : a)).file_id;
}

async function sendText(chatId: number, html: string, markup?: InlineButton[][], silent?: boolean, prio: Prio = "hi"): Promise<SendResult> {
  return toSend(
    await botSend(
      "sendMessage",
      {
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        // Telegram сам открывает ссылки и портит учёт переходов: превью выключено везде.
        link_preview_options: { is_disabled: true },
        ...(markup ? { reply_markup: { inline_keyboard: markup } } : {}),
        ...(silent ? { disable_notification: true } : {}),
      },
      prio,
    ),
  );
}

/**
 * Картинка или видео. Первый раз по URL, из ответа берём file_id и кешируем в tg-state.json,
 * дальше шлём по file_id. Если file_id протух (400), пробуем по URL, для видео ещё и без обложки.
 * Видео уходит с supports_streaming и размерами из серии (width, height, duration).
 */
async function sendMedia(chatId: number, media: Media, caption: string | undefined, markup: InlineButton[][] | undefined, silent: boolean | undefined, prio: Prio): Promise<SendResult> {
  const st = getStore();
  const isVideo = media.type === "video";
  const method = isVideo ? "sendVideo" : "sendPhoto";
  const field = isVideo ? "video" : "photo";
  const cachedRef = st.getMedia(media.url);
  const cachedCover = isVideo && media.poster ? st.getMedia(media.poster) : undefined;

  const attempts: Array<[string, string | undefined]> = [[cachedRef ?? media.url, cachedCover ?? media.poster]];
  if (cachedRef || cachedCover) attempts.push([media.url, media.poster]);
  if (isVideo && media.poster) attempts.push([media.url, undefined]);

  let r: BotResult<SentMessage> = { ok: false, code: 0, description: "not_sent" };
  let used: [string, string | undefined] = attempts[0];
  for (const a of attempts) {
    used = a;
    const params: Record<string, unknown> = { chat_id: chatId, [field]: a[0] };
    if (caption) {
      params.caption = caption;
      params.parse_mode = "HTML";
    }
    if (markup) params.reply_markup = { inline_keyboard: markup };
    if (silent) params.disable_notification = true;
    if (isVideo) {
      params.supports_streaming = true;
      if (media.width) params.width = media.width;
      if (media.height) params.height = media.height;
      if (media.duration) params.duration = media.duration;
      if (a[1]) params.cover = a[1];
    }
    // По URL Telegram скачивает файл сам: 60 с и никаких повторов после таймаута. По file_id обычный таймаут.
    const byUrl = /^https?:\/\//.test(a[0]);
    r = await botSend<SentMessage>(method, params, prio, { retryNet: "connect", ...(byUrl ? { timeoutMs: mediaTimeout() } : {}) });
    if (r.ok || r.code !== 400) break;
  }

  if (r.ok) {
    // Запоминаем только то, что отправили по URL: это новые file_id.
    if (used[0] === media.url) {
      const id = isVideo ? r.result?.video?.file_id : largest(r.result?.photo);
      if (id) st.setMedia(media.url, id);
    }
    if (isVideo && media.poster && used[1] === media.poster) {
      const cover = largest(r.result?.video?.cover);
      if (cover) st.setMedia(media.poster, cover);
    }
  }
  return toSend(r);
}

/** Ответ владельцу обычным текстом, без разметки. */
async function plain(chatId: number, text: string, markup?: InlineButton[][]): Promise<SendResult> {
  return toSend(
    await botSend("sendMessage", {
      chat_id: chatId,
      text: text.slice(0, 4000),
      link_preview_options: { is_disabled: true },
      ...(markup ? { reply_markup: { inline_keyboard: markup } } : {}),
    }),
  );
}

/** Сообщение всем владельцам (предупреждения, отчёты). Возвращает, скольким дошло. */
export async function notifyOwners(text: string): Promise<number> {
  let delivered = 0;
  for (const id of ownerIds()) {
    const n = Number(id);
    if (Number.isFinite(n) && (await plain(n, text)).ok) delivered++;
  }
  return delivered;
}

/** То же с разметкой HTML и кнопками (ежедневный админ-отчёт). */
export async function notifyOwnersHtml(text: string, markup?: InlineButton[][]): Promise<number> {
  let delivered = 0;
  for (const id of ownerIds()) {
    const n = Number(id);
    if (Number.isFinite(n) && (await sendText(n, text, markup)).ok) delivered++;
  }
  return delivered;
}

/** Одно предупреждение владельцам на каждое медиа за жизнь процесса. */
const mediaWarned = new Set<string>();
async function warnMedia(url: string, error: string | undefined) {
  if (mediaWarned.has(url)) return;
  mediaWarned.add(url);
  await notifyOwners(`Не отправилась картинка или видео ${url}: ${error || "ошибка"}. Шлю тот же текст без неё. Проверь, что файл выложен на сайт.`);
}

/**
 * Собрать и отправить сообщение серии или приветствия. Подпись к медиа не длиннее 1024
 * символов: если текст длиннее, сначала медиа, потом отдельным сообщением текст с кнопками.
 * Не ушло медиа (любая ошибка): тот же текст с кнопками уходит обычным сообщением.
 */
export async function sendContent(c: Content, ctx: RenderCtx, opts: { prio?: Prio } = {}): Promise<SendResult> {
  const prio = opts.prio ?? "hi";
  const html = expandText(c.text, ctx);
  const kb = buildKeyboard(c.buttons, ctx);
  if (!c.media) return sendText(ctx.chatId, html, kb, c.silent, prio);
  const short = visibleLength(html) <= 1024;
  const m = await sendMedia(ctx.chatId, c.media, short ? html : undefined, short ? kb : undefined, c.silent, prio);
  if (m.ok) return short ? m : sendText(ctx.chatId, html, kb, c.silent, prio);
  if (isGone(m)) return m;
  console.warn("[tg] медиа %s не ушло (%s), шлю текстом", c.media.url, m.error);
  noteRuntime("mediaFallback", { info: c.media.url });
  void warnMedia(c.media.url, m.error);
  return sendText(ctx.chatId, html, kb, c.silent, prio);
}

/** Недоступный получатель (403, чат не найден): помечаем blocked. */
export function noteSendResult(chatId: number, r: SendResult, now: number) {
  if (!isGone(r)) return;
  const st = getStore();
  const s = st.subs.get(chatId);
  if (s && !s.blocked) st.recordEvent({ type: "blocked", chat_id: chatId, ts: new Date(now).toISOString() });
}

// ───────────────────────── приветствие ─────────────────────────

/** День, который показываем человеку в тексте: его день, пока эфир не прошёл, иначе ближайший. */
function displayDay(sub: Subscriber | undefined, now: number, cfg: TimeCfg): string {
  return sub && now < streamEnd(sub.streamDay, cfg) ? sub.streamDay : assignStreamDay(now, cfg);
}

function liveContent(sr: Series): Content {
  return { text: sr.welcome.live, buttons: sr.welcome.liveButtons };
}

/**
 * Приветствие. Эфир дня подписчика идёт: welcome.live с кнопкой входа. Иначе обычное
 * приветствие с картинкой, а если при этом идёт сегодняшний эфир (человек записан на
 * завтра), следом отдельное сообщение lateToday с кнопкой на него.
 */
async function sendGreeting(sub: Subscriber, now: number): Promise<void> {
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const ctx: RenderCtx = { series: sr, now, chatId: sub.chatId, firstName: sub.firstName, day: sub.streamDay };
  if (isLive(sub.streamDay, now, cfg)) {
    noteSendResult(sub.chatId, await sendContent(liveContent(sr), ctx), now);
    return;
  }
  const r = await sendContent({ media: sr.welcome.media, text: sr.welcome.before }, ctx);
  noteSendResult(sub.chatId, r, now);
  const live = liveDayNow(now, cfg);
  if (r.ok && live && live !== sub.streamDay && sr.welcome.lateToday) {
    const r2 = await sendContent({ text: sr.welcome.lateToday, buttons: sr.welcome.liveButtons }, { ...ctx, liveDay: live });
    noteSendResult(sub.chatId, r2, now);
  }
}

// ───────────────────────── апдейты ─────────────────────────

type TgUser = { id: number; is_bot?: boolean; first_name?: string; username?: string; language_code?: string };
type TgChat = { id: number; type?: string };
type TgMessage = { chat: TgChat; from?: TgUser; text?: string };
type TgCallback = { id: string; from: TgUser; message?: { message_id?: number; chat?: TgChat }; data?: string };
type TgMemberUpdate = { chat: TgChat; from?: TgUser; new_chat_member?: { status?: string } };
export type TgUpdate = { update_id?: number; message?: TgMessage; callback_query?: TgCallback; my_chat_member?: TgMemberUpdate };

const OWNER_CMDS = new Set(["stats", "admin", "app", "series", "series_on", "series_off", "preview", "fire", "paid", "reload", "at", "off", "on", "bizon"]);

/** Справка владельцу (/help). У остальных /help идёт как обычный текст: им отвечает welcome.other. */
export const HELP_TEXT = [
  "Команды владельца:",
  "/admin: аналитика (заявки, бот, UTM по дням, ошибки), выбор периода и даты. /stats открывает то же",
  "/app: мини-приложение админки (кнопка, вход по паролю): сводка, источники, регистрации, подписчики, эфиры, ошибки",
  "/series: расписание сообщений на сегодня",
  "/preview: прислать себе всю серию для проверки",
  "/fire <id>: отправить сообщение сейчас (сначала превью, потом кнопка «Отправить»)",
  "/at <id> HH:MM: сдвинуть время сообщения (/at <id> reset вернёт как в json)",
  "/off <id>, /on <id>: выключить или включить сообщение",
  "/bizon <ссылка>: сменить ссылку эфира",
  "/paid <chat_id или @username>: отметить оплату",
  "/reload: перечитать tg-series.json",
  "/series_on, /series_off: включить или выключить серию",
  "",
  "Метка источника: добавь ?start=2gis к ссылке на бота (t.me/workshop_aiprod_bot?start=2gis), в отчётах она покажется как источник.",
].join("\n");

function parseCommand(text: string): { cmd: string; args: string } | null {
  const m = /^\/([A-Za-z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/.exec(text.trim());
  return m ? { cmd: m[1].toLowerCase(), args: (m[2] || "").trim() } : null;
}

function cleanPayload(args: string): string {
  const first = args.split(/\s+/)[0] || "";
  return /^[A-Za-z0-9_-]{1,64}$/.test(first) ? first : "";
}

/** Очередь по чату: апдейты одного человека обрабатываются по порядку, разных людей параллельно. */
const chains = new Map<string, Promise<unknown>>();
function serial<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  const tail = next.then(() => undefined, () => undefined);
  chains.set(key, tail);
  void tail.then(() => {
    if (chains.get(key) === tail) chains.delete(key);
  });
  return next;
}

/** Повторная доставка того же update_id (Telegram так делает при сбое ответа) не обрабатывается дважды. */
const seenUpdates: number[] = [];
const seenSet = new Set<number>();
function seenBefore(id: number | undefined): boolean {
  if (typeof id !== "number") return false;
  if (seenSet.has(id)) return true;
  seenSet.add(id);
  seenUpdates.push(id);
  if (seenUpdates.length > SEEN_UPDATES) seenSet.delete(seenUpdates.shift() as number);
  return false;
}

const lastOther = new Map<number, number>();
const previewing = new Set<number>();

export type FirePlan = { ok: true; day: string; msg: SeriesMsg; count: number } | { ok: false; error: string };
type FireHook = { plan: (id: string, now: number) => FirePlan; run: (id: string, now: number) => Promise<string> };
let fireHook: FireHook | null = null;
/** Планировщик регистрирует сюда /fire: так модули не импортируют друг друга по кругу. */
export function registerFire(h: FireHook) {
  fireHook = h;
}

export async function processUpdate(u: TgUpdate, now: number = Date.now()): Promise<void> {
  if (!store || !series) return;
  if (seenBefore(u.update_id)) return;
  const chatId = u.message?.chat?.id ?? u.callback_query?.message?.chat?.id ?? u.callback_query?.from?.id ?? u.my_chat_member?.chat?.id;
  if (typeof chatId !== "number") return;
  await serial(String(chatId), async () => {
    try {
      if (u.message) await onMessage(u.message, now);
      else if (u.callback_query) await onCallback(u.callback_query, now);
      else if (u.my_chat_member) onMemberUpdate(u.my_chat_member, now);
    } catch (e) {
      console.error("[tg] ошибка обработки апдейта:", scrub(String((e as Error)?.stack || e)));
    }
  });
}

async function onMessage(m: TgMessage, now: number) {
  // Только личные чаты: группы и каналы бота не касаются.
  if (m.chat?.type !== "private" || !m.from || m.from.is_bot) return;
  const text = (m.text || "").trim();
  if (!text) return;
  const c = parseCommand(text);
  if (c?.cmd === "start") return onStart(m, cleanPayload(c.args), now);
  if (c?.cmd === "stop") return onStop(m, now);
  if (c?.cmd === "help" && isOwner(m.from.id)) {
    await plain(m.chat.id, HELP_TEXT);
    return;
  }
  if (c && OWNER_CMDS.has(c.cmd)) {
    // Команды владельцев: от остальных молча игнорируем, даже не показываем, что команда есть.
    if (isOwner(m.from.id)) await ownerCommand(c.cmd, c.args, m, now);
    return;
  }
  if (isOwner(m.from.id)) return;
  await onOther(m, now);
}

async function onStart(m: TgMessage, payload: string, now: number) {
  const st = getStore();
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const from = m.from as TgUser;
  const prev = st.subs.get(m.chat.id);
  // День подписчика не трогаем, пока его эфир не закончился; закончился или человек новый: назначаем по правилу.
  const day = prev && now < streamEnd(prev.streamDay, cfg) ? prev.streamDay : assignStreamDay(now, cfg);
  st.recordEvent({
    type: "start",
    chat_id: m.chat.id,
    user_id: from.id,
    username: from.username,
    first_name: from.first_name,
    language_code: from.language_code,
    payload,
    streamDay: day,
    ts: new Date(now).toISOString(),
  });
  await sendGreeting(st.subs.get(m.chat.id) as Subscriber, now);
}

async function onStop(m: TgMessage, now: number) {
  const st = getStore();
  const sr = getSeries();
  const sub = st.subs.get(m.chat.id);
  if (sub) st.recordEvent({ type: "stop", chat_id: m.chat.id, ts: new Date(now).toISOString() });
  const ctx: RenderCtx = { series: sr, now, chatId: m.chat.id, firstName: sub?.firstName, day: displayDay(sub, now, timeCfg(sr)) };
  noteSendResult(m.chat.id, await sendContent({ text: sr.welcome.stop }, ctx), now);
}

async function onOther(m: TgMessage, now: number) {
  // Одному человеку не чаще раза в 10 минут: поток сообщений не должен превращаться в поток ответов.
  const last = lastOther.get(m.chat.id) ?? 0;
  if (now - last < OTHER_THROTTLE_MS) return;
  lastOther.set(m.chat.id, now);
  if (lastOther.size > 5000) for (const [k, t] of lastOther) if (now - t >= OTHER_THROTTLE_MS) lastOther.delete(k);
  const st = getStore();
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const sub = st.subs.get(m.chat.id);
  const firstName = sub?.firstName || m.from?.first_name;
  const live = liveDayNow(now, cfg);
  // Во время эфира вместо обычного ответа сразу даём кнопку входа.
  const ctx: RenderCtx = { series: sr, now, chatId: m.chat.id, firstName, day: live ?? displayDay(sub, now, cfg) };
  const content: Content = live ? liveContent(sr) : { text: sr.welcome.other };
  noteSendResult(m.chat.id, await sendContent(content, ctx), now);
}

async function onCallback(cq: TgCallback, now: number) {
  const st = getStore();
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const chatId = cq.message?.chat?.id ?? cq.from.id;
  const sub = st.subs.get(chatId);
  const ts = new Date(now).toISOString();
  // Любой callback закрываем сразу, чтобы у кнопки не крутился индикатор. Неизвестные тоже.
  await botSend("answerCallbackQuery", { callback_query_id: cq.id });

  // Меню админа: только владельцам, остальным ничего кроме закрытия кнопки.
  if (cq.data?.startsWith("adm:")) {
    if (isOwner(cq.from.id)) await onAdminCallback(cq, now);
    return;
  }

  if (cq.data === "paid") {
    if (!sub || sub.paid) return;
    st.recordEvent({ type: "paid", chat_id: chatId, by: "self", ts });
    const ctx: RenderCtx = { series: sr, now, chatId, firstName: sub.firstName, day: displayDay(sub, now, cfg) };
    noteSendResult(chatId, await sendContent({ text: sr.welcome.paidAck }, ctx), now);
    return;
  }

  if (cq.data === "rejoin") {
    const day = assignStreamDay(now, cfg);
    if (sub) st.recordEvent({ type: "rejoin", chat_id: chatId, streamDay: day, ts });
    const ctx: RenderCtx = { series: sr, now, chatId, firstName: sub?.firstName, day };
    // Эфир уже идёт: сразу даём кнопку входа, иначе обещаем ссылку в 19:50.
    const content: Content = isLive(day, now, cfg) ? liveContent(sr) : { text: sr.welcome.rejoinAck ?? DEFAULT_REJOIN_ACK };
    noteSendResult(chatId, await sendContent(content, ctx), now);
    return;
  }

  // Подтверждение массовой отправки командой /fire: только владелец, только по этой кнопке.
  if (cq.data?.startsWith("fire:")) {
    if (!isOwner(cq.from.id) || !fireHook) return;
    if (cq.message?.message_id) {
      await botSend("editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
    }
    await plain(chatId, await fireHook.run(cq.data.slice(5), now));
  }
}

/** Контекст аналитики: хранилище, расписание и версия деплоя. */
export function adminCtx(now: number): AdminCtx {
  return { store: getStore(), cfg: timeCfg(getSeries()), now, version: adminVersion() };
}

/** Стартовый экран админки: общая сводка (то, что раньше отдавал /stats) и выбор периода. */
export function adminHomeText(st: TgStore, sr: Series, now: number): string {
  return `${buildStatsText(st, sr, now)}\n\nВыбери период для отчёта:`;
}

/**
 * Нажатие кнопки меню: то же сообщение редактируется (editMessageText), новые не плодятся.
 * Не удалось отредактировать по другой причине, чем «не изменилось»: шлём новым сообщением.
 */
async function onAdminCallback(cq: TgCallback, now: number) {
  const cb = parseAdminCb(cq.data || "");
  if (!cb) return;
  const chatId = cq.message?.chat?.id ?? cq.from.id;
  const ctx = adminCtx(now);
  let text: string;
  let kb: AdminButton[][];
  let html = true;
  if (cb.action === "m") {
    text = adminHomeText(getStore(), activeSeries(), now);
    kb = menuKeyboard();
    html = false;
  } else if (cb.action === "d") {
    text = "Выбери день (последние 14 дней) или весь период:";
    kb = datePickerKeyboard(now);
    html = false;
  } else if (cb.action === "u") {
    text = renderUtmByDay(ctx, cb.period);
    kb = adminKeyboard(cb.period, "u");
  } else if (cb.action === "e") {
    text = renderErrors(ctx, cb.period);
    kb = adminKeyboard(cb.period, "e");
  } else {
    text = renderReport(ctx, cb.period);
    kb = adminKeyboard(cb.period, "p");
  }
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    ...(html ? { parse_mode: "HTML" } : {}),
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: kb },
  };
  const mid = cq.message?.message_id;
  if (mid) {
    const r = await botSend("editMessageText", { ...body, message_id: mid });
    if (r.ok || /not modified/i.test(r.description)) return;
    console.warn("[tg] не удалось отредактировать сообщение админки (%s), шлю новым", r.description);
  }
  await botSend("sendMessage", body);
}

function onMemberUpdate(u: TgMemberUpdate, now: number) {
  if (u.chat?.type !== "private") return;
  const st = getStore();
  const sub = st.subs.get(u.chat.id);
  if (!sub) return; // незнакомый chat_id игнорируем
  const status = u.new_chat_member?.status;
  const ts = new Date(now).toISOString();
  if (status === "kicked" && !sub.blocked) st.recordEvent({ type: "blocked", chat_id: u.chat.id, ts });
  else if (status === "member" && sub.blocked) st.recordEvent({ type: "unblocked", chat_id: u.chat.id, ts });
}

// ───────────────────────── статистика и отчёты ─────────────────────────

const AUD_LABEL: Record<Audience, string> = { all: "все", clicked: "нажавшим", notClicked: "не нажавшим", notPaid: "не оплатившим" };

/** Метка источника для /stats: ty_<uuid> группируется по префиксу до первого «_». */
export const payloadGroup = (payload: string) => payload.split("_")[0] || "без метки";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part * 100) / whole) : 0);

/** Строки таблицы по последним 7 дням эфира (по streamDay), новые сверху. */
export function buildDayTable(st: TgStore, sr: Series, now: number): string[] {
  const today = dayKeyOf(now);
  const days = new Set(st.regDayKeys());
  if (isStreamDay(today, timeCfg(sr))) days.add(today);
  return [...days]
    .sort()
    .reverse()
    .slice(0, 7)
    .map((d) => {
      const m = st.dayMetrics(d);
      return `${d}: записались ${m.registered}, перешли ${m.clicked} (${pct(m.clicked, m.registered)}%), «Я уже оплатил(а)» ${m.paid}`;
    });
}

/** Текст /stats: всего, активных, на сегодня и завтра, «Спасибо», метки, таблица по эфирам. */
export function buildStatsText(st: TgStore, sr: Series, now: number): string {
  const today = dayKeyOf(now);
  const tomorrow = addDays(today, 1);
  let active = 0;
  let forToday = 0;
  let forTomorrow = 0;
  let paid = 0;
  const byPayload = new Map<string, number>();
  for (const s of st.subs.values()) {
    if (st.isActive(s)) {
      active++;
      if (s.streamDay === today) forToday++;
      if (s.streamDay === tomorrow) forTomorrow++;
    }
    if (s.paid) paid++;
    const key = payloadGroup(s.payload);
    byPayload.set(key, (byPayload.get(key) || 0) + 1);
  }
  const tags = [...byPayload.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, n]) => `${k}: ${n}`).join(", ");
  const started = st.startedOn(today, dayKeyOf);
  const table = buildDayTable(st, sr, now);
  return [
    `Серия: ${st.state.seriesEnabled ? "включена" : "выключена"} (версия ${sr.version})`,
    `Подписчиков всего: ${st.subs.size}`,
    `Активных (не заблокировали, не отписались): ${active}`,
    `На эфир сегодня (${today}): ${forToday}`,
    `На эфир завтра (${tomorrow}): ${forTomorrow}`,
    `Оплатили (всего): ${paid}`,
    `Сегодня на странице «Спасибо» нажали Telegram: ${st.tyCount(today, "tg")}, WhatsApp: ${st.tyCount(today, "wa")}`,
    `Сегодня нажали «Запустить» в боте: ${started.total} (со страницы «Спасибо»: ${started.fromPrefix})`,
    `По меткам: ${tags || "пока пусто"}`,
    "",
    "Последние эфиры (записались в бота / перешли по кнопке эфира / нажали «Я уже оплатил(а)»):",
    ...(table.length ? table : ["пока пусто"]),
  ].join("\n");
}

/** Итоговый отчёт по эфиру дня D для владельцев. */
export function dayReportText(st: TgStore, day: string): string {
  const m = st.dayMetrics(day);
  return `Эфир ${dateLabel(day)}: записались в бота ${m.registered}, перешли по кнопке ${m.clicked} (${pct(m.clicked, m.registered)}%), со «Спасибо» нажали Telegram ${st.tyCount(day, "tg")}, WhatsApp ${st.tyCount(day, "wa")}.`;
}

/** Итоговое расписание на сегодня (sr уже с правками): время, id, аудитория, отправлено из скольких. */
export function buildSeriesText(st: TgStore, sr: Series, now: number): string {
  const today = dayKeyOf(now);
  const rows = sr.messages
    .map((m) => ({ m, day: addDays(today, -(m.dayOffset ?? 0)) }))
    .sort((a, b) => atTime(today, a.m.at) - atTime(today, b.m.at));
  const lines = rows.map(({ m, day }) => {
    let eligible = 0;
    for (const s of st.subs.values()) if (s.streamDay === day && st.isActive(s) && st.audienceOk(m.audience, s, day)) eligible++;
    const sent = st.sentCount(m.id, day);
    const ov = st.state.overrides[m.id];
    const inJson = series?.messages.find((x) => x.id === m.id)?.at;
    const marks = [
      m.enabled === false ? "выключено" : "",
      m.essential ? "обязательное, идёт без /series_on" : "",
      ov?.at ? `время изменено, в json ${inJson ?? "?"}` : "",
    ].filter(Boolean);
    return `${m.at} ${m.id} (${AUD_LABEL[m.audience]})${marks.length ? ` [${marks.join("; ")}]` : ""}: отправлено ${sent} из ${Math.max(sent, eligible)}`;
  });
  const head = [
    `Серия: ${st.state.seriesEnabled ? "включена" : "выключена"}, версия ${sr.version}`,
    isStreamDay(today, timeCfg(sr)) ? `Сообщения на сегодня (${today}):` : `Сегодня (${today}) эфира нет, сообщения ниже для справки:`,
  ];
  return [...head, ...lines].join("\n");
}

/** Предупреждение при включении серии: пустая ссылка оплаты {PAY} при кнопках с ней (не блокирует). */
export function payWarning(sr: Series): string {
  if (sr.links.pay) return "";
  const ids = sr.messages
    .filter((m) => m.enabled !== false && (m.buttons || []).some((row) => row.some((b) => b.url?.includes("{PAY}"))))
    .map((m) => m.id);
  if (!ids.length) return "";
  return `\n\nВнимание: links.pay пуст, кнопки {PAY} выпадут в сообщениях: ${ids.join(", ")}. Серия всё равно включена; задай ссылку в tg-series.json и сделай /reload.`;
}

function bizonValid(raw: string): string | null {
  try {
    const u = new URL(raw);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !(h === "bizon365.ru" || h.endsWith(".bizon365.ru")) || u.pathname.length < 2) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// ───────────────────────── команды владельцев ─────────────────────────

async function ownerCommand(cmd: string, args: string, m: TgMessage, now: number) {
  const st = getStore();
  const chatId = m.chat.id;
  const sr = () => activeSeries();
  switch (cmd) {
    case "stats":
    case "admin":
      await plain(chatId, adminHomeText(st, sr(), now), menuKeyboard());
      return;
    case "app":
      // Мини-приложение только для аккаунтов из ADMIN_APP_IDS; остальным владельцам коротко отказ без подробностей.
      if (!isAdminAppUser(m.from?.id)) {
        await plain(chatId, "Админка недоступна для этого аккаунта.");
        return;
      }
      await plain(chatId, "Админка воркшопа. Откроется внутри Telegram, вход по паролю.", [[{ text: "Открыть админку", web_app: { url: adminAppUrl() } }]]);
      return;
    case "series":
      await plain(chatId, buildSeriesText(st, sr(), now));
      return;
    case "series_on":
      st.setSeriesEnabled(true);
      await plain(chatId, `Серия включена. Сообщения уходят по расписанию.${payWarning(sr())}`);
      return;
    case "series_off":
      st.setSeriesEnabled(false);
      await plain(chatId, "Серия выключена. Приветствие работает как раньше.");
      return;
    case "reload":
      try {
        const r = reloadSeries();
        const warn = r.warnings.length ? `\n\nНа заметку:\n${r.warnings.slice(0, 8).join("\n")}` : "";
        await plain(chatId, `Серия перечитана: версия ${r.version}, сообщений ${r.count}.${warn}`);
      } catch (e) {
        await plain(chatId, `Не принял серию, работаю на прежней: ${(e as Error).message}`);
      }
      return;
    case "at": {
      const [id, time] = args.split(/\s+/);
      const msg = getSeries().messages.find((x) => x.id === id);
      if (!id || !time || !msg) {
        await plain(chatId, "Формат: /at <id> HH:MM или /at <id> reset. Список id: /series");
        return;
      }
      if (time === "reset") {
        st.setOverride(id, { at: null });
        await plain(chatId, `Время «${id}» вернул как в json: ${msg.at}.`);
        return;
      }
      let hhmm: string;
      try {
        const t = parseHHMM(time);
        hhmm = `${String(t.h).padStart(2, "0")}:${String(t.m).padStart(2, "0")}`;
      } catch {
        await plain(chatId, "Время вида HH:MM по Алматы, например 20:55.");
        return;
      }
      st.setOverride(id, { at: hhmm });
      await plain(chatId, `Время «${id}» теперь ${hhmm} (в json ${msg.at}).`);
      return;
    }
    case "off":
    case "on": {
      const id = args.split(/\s+/)[0];
      const msg = getSeries().messages.find((x) => x.id === id);
      if (!id || !msg) {
        await plain(chatId, `Формат: /${cmd} <id>. Список id: /series`);
        return;
      }
      st.setOverride(id, { enabled: cmd === "on" });
      await plain(chatId, cmd === "on" ? `Сообщение «${id}» включено.` : `Сообщение «${id}» выключено.`);
      return;
    }
    case "bizon": {
      if (!args) {
        await plain(chatId, `Ссылка эфира сейчас: ${currentBizon()}\nЧтобы сменить: /bizon https://start.bizon365.ru/room/...`);
        return;
      }
      const url = bizonValid(args.split(/\s+/)[0]);
      if (!url) {
        await plain(chatId, "Нужна ссылка вида https://...bizon365.ru/... Другие адреса не принимаю.");
        return;
      }
      st.setBizon(url);
      await plain(chatId, `Ссылка эфира обновлена: ${url}\nПереходы из бота ведут на неё сразу, с момента клика.`);
      return;
    }
    case "paid": {
      if (!args) {
        await plain(chatId, "Укажи chat_id или @username: /paid 123456789");
        return;
      }
      const s = st.find(args);
      if (!s) {
        await plain(chatId, `Не нашёл подписчика: ${args}`);
        return;
      }
      if (!s.paid) st.recordEvent({ type: "paid", chat_id: s.chatId, by: "owner", ts: new Date(now).toISOString() });
      await plain(chatId, `Отмечен оплатившим: ${s.firstName || "без имени"} (${s.username ? "@" + s.username + ", " : ""}${s.chatId}).`);
      return;
    }
    case "fire": {
      const id = args.split(/\s+/)[0];
      if (!id) {
        await plain(chatId, "Укажи id сообщения: /fire topic-p23. Список: /series");
        return;
      }
      if (!fireHook) {
        await plain(chatId, "Планировщик не запущен.");
        return;
      }
      const p = fireHook.plan(id, now);
      if (!p.ok) {
        await plain(chatId, p.error);
        return;
      }
      // Сначала покажем сообщение так, как его получат люди, и сколько их. Рассылка только по кнопке.
      const ctx: RenderCtx = { series: sr(), now, chatId, firstName: m.from?.first_name, day: p.day };
      await sendContent({ media: p.msg.media, text: p.msg.text, buttons: p.msg.buttons, silent: p.msg.silent }, ctx);
      await plain(chatId, `Получателей: ${p.count}. Отправить «${id}» сейчас?`, [[{ text: "Отправить", callback_data: `fire:${id}` }]]);
      return;
    }
    case "preview":
      // Долгий показ не держит очередь владельца: идёт сам, а команды продолжают работать.
      void runPreview(m, now).catch((e) => console.error("[tg] preview:", scrub(String(e))));
      return;
  }
}

/** Прислать владельцу все сообщения серии по порядку, раз в 1,5 с. Для проверки перед запуском. */
async function runPreview(m: TgMessage, now: number) {
  const chatId = m.chat.id;
  if (previewing.has(chatId)) {
    await plain(chatId, "Предпросмотр уже идёт.");
    return;
  }
  previewing.add(chatId);
  try {
    const sr = activeSeries();
    const day = assignStreamDay(now, timeCfg(sr));
    const msgs = [...sr.messages].sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0) || atTime(day, a.at) - atTime(day, b.at));
    const list = msgs.map((x) => `${x.dayOffset ? `+${x.dayOffset}д ` : ""}${x.at} ${x.id} (${AUD_LABEL[x.audience]})${x.enabled === false ? " [выключено]" : ""}`);
    await plain(chatId, `Предпросмотр серии: ${msgs.length} сообщений, по одному в 1,5 секунды. Ссылка эфира и день как для тебя; пустая оплата показана кнопкой менеджера.\n\n${list.join("\n")}`);
    const failed: string[] = [];
    for (const x of msgs) {
      await sleep(1500);
      const ctx: RenderCtx = { series: sr, now: Date.now(), chatId, firstName: m.from?.first_name, day, preview: true };
      const r = await sendContent({ media: x.media, text: x.text, buttons: x.buttons, silent: x.silent }, ctx);
      if (!r.ok) failed.push(`${x.id} (${r.error})`);
    }
    await plain(chatId, failed.length ? `Предпросмотр закончен. Не ушли: ${failed.join("; ")}` : "Предпросмотр закончен.");
  } finally {
    previewing.delete(chatId);
  }
}

// ───────────────────────── HTTP: вебхук, переход, клики «Спасибо» ─────────────────────────

function reply(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}

/** Тело с жёстким лимитом: null, если больше лимита (остаток вычитываем и выбрасываем). */
function readLimited(req: IncomingMessage, max: number): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0;
    let over = false;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      if (over) return;
      size += c.length;
      if (size > max) {
        over = true;
        chunks.length = 0;
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(over ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });
}

function secretOk(provided: string | undefined): boolean {
  const secret = webhookSecret();
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/tg-workshop: вебхук Telegram. Без верного секрета 401. Дальше всегда 200 сразу
 * (даже на слишком большое тело, его выбрасываем), работу делаем после ответа.
 */
export async function handleTgWorkshop(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const h = req.headers["x-telegram-bot-api-secret-token"];
  if (!secretOk(Array.isArray(h) ? h[0] : h)) {
    runtime.webhookRejected++;
    return reply(res, 401, { ok: false });
  }
  const raw = await readLimited(req, MAX_UPDATE_BODY);
  reply(res, 200, { ok: true });
  if (raw === null || !botEnabled()) return;
  let update: TgUpdate | null = null;
  try {
    update = JSON.parse(raw) as TgUpdate;
  } catch {
    update = null;
  }
  if (!update || typeof update !== "object") return;
  void processUpdate(update).catch((e) => console.error("[tg] webhook:", scrub(String(e))));
}

/** Ссылка эфира в момент клика: из /bizon, иначе из серии, иначе запасная. */
export function currentBizon(): string {
  return store?.state.bizon || series?.links.bizon || DEFAULT_BIZON;
}

/**
 * GET /api/go/<token>: записать клик (один раз на пару чат и день, только GET) и увести на эфир.
 * Битый или чужой токен тоже ведёт на эфир, но без записи.
 */
export function handleGo(req: IncomingMessage, res: ServerResponse, rawToken: string): void {
  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    /* оставляем как есть */
  }
  if (req.method === "GET" && store && botEnabled()) {
    const v = verifyGoToken(token);
    if (v) store.recordClick(v.chatId, v.day, new Date().toISOString());
  }
  res.writeHead(302, { Location: currentBizon(), "Cache-Control": "no-store" });
  res.end();
}

// Страховка от заливки диска: не больше 200 записей кликов «Спасибо» за 10 секунд.
let tyWindowStart = 0;
let tyWindowCount = 0;

/** Тело клика: ch=tg|wa, необязательные eid (uuid посетителя) и src=pp|ty (окно или страница). text/plain, форма или json. */
export function parseTyBody(raw: string): { ch: "tg" | "wa"; eid: string; src?: "pp" | "ty" } | null {
  let ch = "";
  let eid = "";
  let src = "";
  const s = raw.trim();
  try {
    if (s.startsWith("{")) {
      const o = JSON.parse(s) as Record<string, unknown>;
      ch = String(o.ch ?? "");
      eid = String(o.eid ?? "");
      src = String(o.src ?? "");
    } else {
      const p = new URLSearchParams(s);
      ch = p.get("ch") || "";
      eid = p.get("eid") || "";
      src = p.get("src") || "";
    }
  } catch {
    return null;
  }
  if (ch !== "tg" && ch !== "wa") return null;
  return { ch, eid: /^[A-Za-z0-9-]{1,64}$/.test(eid) ? eid : "", ...(src === "pp" || src === "ty" ? { src } : {}) };
}

/** POST /api/ty-click: клик по кнопке Telegram или WhatsApp на странице «Спасибо». Всегда 204. */
export async function handleTyClick(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readLimited(req, 2048);
  res.writeHead(204, { "Cache-Control": "no-store" });
  res.end();
  if (raw === null || !store) return;
  const p = parseTyBody(raw);
  if (!p) return;
  const t = Date.now();
  if (t - tyWindowStart > 10_000) {
    tyWindowStart = t;
    tyWindowCount = 0;
  }
  if (++tyWindowCount > 200) return;
  // Больше TY_DAILY_CAP записей за сутки: 204 без записи.
  store.recordTyClick(p.ch, p.eid, dayKeyOf(t), new Date(t).toISOString(), p.src);
}

/** День ближайшего эфира для /calendar: то же правило, что у /start (серия не загружена: 20:00, окно 40 минут). */
export function calendarDay(now: number = Date.now()): string {
  return assignStreamDay(now, series ? timeCfg(series) : { streamStart: "20:00", streamMinutes: 80, joinLiveMinutes: DEFAULT_JOIN_MINUTES });
}
