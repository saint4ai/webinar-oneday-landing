/**
 * Дожим «записался, но не вступил в сообщество» через WABA (Wazzup), только номера Казахстана (docs/tasks/wa_wazzup_dozhim.md).
 *
 * Что делает модуль:
 *  - раз в 10 минут (а когда есть кому писать, раз в 5) берёт участников вкладки объявлений сообществ текущего и следующего дня у Evolution
 *    (phoneNumber каждого участника) и хранит номера в DATA_DIR/wa-members.json по каждой цели;
 *  - читает заявки (leads.jsonl), день эфира заявки считает так же, как бот (assignStreamDay), и выбирает кандидатов: номер Казахстана,
 *    нет среди участников сообщества этого дня, Telegram-бот по заявке не запускали, шаблон по заявке ещё не слали;
 *  - через 30 минут после заявки, только с 09:00 до 21:00 по Алматы (ночные уходят в 09:00), в день эфира не позже 19:30, не больше
 *    200 шаблонов за 24 часа, перед отправкой замер участников не старше 10 минут, отправка шаблона через Wazzup POST /v3/message;
 *  - вебхук Wazzup (POST /api/wazzup-hook?s=секрет): ответ человека на шаблон открывает окно 24 часа, и сервер присылает обычным текстом
 *    ссылку на сообщество его дня; ответ «Нет» даёт вежливый отказ и больше этому номеру ничего; чужие переписки номера (менеджер Аяна)
 *    не трогаются вообще: реакция только на чаты, которым мы сами слали шаблон за последние 48 часов;
 *  - статус шаблона из вебхука пишется в журнал, одобрение основного шаблона «Вступите в сообщество» приходит владельцам в Telegram;
 *  - пульт: переключатель (по умолчанию выключен), выбор одобренного шаблона и соответствие переменных, задержка, окно часов, лимит,
 *    кнопки вебхука, счётчики, последние 30 отправок, тестовая отправка. Команды бота: /wa_dozhim on|off, /wa_dozhim_test <номер>.
 *
 * Выключенный дожим не делает ничего: ни запросов к Evolution и Wazzup, ни отправок. Ответы на уже отправленные шаблоны обрабатываются, пока
 * стоит вебхук (человек ждёт ссылку). Ключ Wazzup нигде не печатается, номера в журнале модуля, логах и пульте маскированы (7708***4575);
 * полные номера лежат только в wa-dozhim.jsonl и wa-members.json на сервере, как в leads.jsonl.
 *
 * С wa-groups.ts связь односторонняя: он передаёт сюда «хозяина» (DzHost) с часами, очередью запросов к Evolution, состоянием и целями,
 * а этот файл сам wa-groups не импортирует.
 */
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, writeFileSync } from "node:fs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import * as evo from "./wa-evolution";
import * as wz from "./wazzup";
import type { Lead } from "./tg-admin";
import { addDays, atTime, dateLabel, dayKeyOf, hhmmOf, nextStreamDay, parseDayKey, parseHHMM, partsInTZ, type TimeCfg } from "./tg-time";

const env = (k: string) => (process.env[k] || "").trim();

// ───────────────────────── настройки ─────────────────────────

const MIN = 60_000;
const HOUR = 3600_000;
/** Заявки старше двух суток дожим не трогает никогда: при сдвиге даты эфира или режима история leads.jsonl не должна получить шаблон. */
const MAX_LEAD_AGE = 48 * HOUR;
const DAY = 24 * HOUR;
/** Свежесть замера участников: старше этого срока слать нельзя. */
export const MEASURE_MAX_AGE = 10 * MIN;
/** Когда есть кому писать, замер обновляется чаще, чтобы он не успел устареть посреди пачки. */
const MEASURE_BUSY_AGE = 5 * MIN;
/** За один проход не больше столько отправок. */
const PER_TICK = 25;
/** Пауза между отправками, мс. */
const PACE_MS: [number, number] = [1500, 3500];
/** Повтор после 429 и 5xx: через 5 минут, не больше двух раз (всего три попытки). */
const RETRY_AFTER = 5 * MIN;
const MAX_ATTEMPTS = 3;
/** Ответы людям и отказы принимаем от чатов, которым слали шаблон не раньше чем столько назад. */
const REPLY_WINDOW = 48 * HOUR;
/** Подряд столько окончательных отказов Wazzup (не 429 и не 5xx): отправки встают на час, а не сжигают заявки. */
const HALT_AFTER = 3;
const HALT_MS = HOUR;
/** Не опрашивать Evolution по одной и той же цели чаще раза в 2 минуты, если замер не получился. */
const MEASURE_RETRY = 2 * MIN;
const FILE_TAIL_BYTES = 3 * 1024 * 1024;
const FILE_COMPACT_BYTES = 6 * 1024 * 1024;
const ROWS_KEEP = 6000;

/** Дальше этого постоянного адреса ведёт кнопка шаблона и запасная ссылка ответа. Задаёт wa-groups (TEMPLATE_URL). */
export const SIGNUP_URL = "https://onai.academy/workshop-montazh/";
const HOOK_PATH_DEFAULT = "https://onai.academy/workshop/api/wazzup-hook";
const hookBase = () => env("WAZZUP_HOOK_URL") || HOOK_PATH_DEFAULT;

export const LINK_TEXT = (url: string) => `Вот ссылка на сообщество участников, ссылка на эфир придёт туда в 19:50: ${url}`;
export const DECLINE_TEXT = `Хорошо. Если передумаете, запись на любой день: ${SIGNUP_URL}`;

export type DzAct = { ok: boolean; code?: string; message: string };
const fail = (code: string, message: string): DzAct => ({ ok: false, code, message });

// ───────────────────────── состояние ─────────────────────────

/** Откуда берётся значение переменной шаблона: имя, дата эфира, ссылка /wa или постоянный текст. */
export type VarSrc = { kind: "name" | "date" | "link" | "text"; text?: string };

export type DzState = {
  enabled: boolean;
  /** Вебхук Wazzup поставлен нами. */
  hookOn: boolean;
  /** Секрет вебхука, если WAZZUP_HOOK_SECRET не задан в .env. В пульт и логи не попадает. */
  secret: string;
  templateId: string;
  templateName: string;
  /** Сколько переменных в выбранном шаблоне (0, если неизвестно). */
  vars: number;
  delayMin: number;
  from: string;
  to: string;
  cutoff: string;
  dailyLimit: number;
  /** Соответствие переменных по шаблонам: ключ templateId. */
  maps: Record<string, VarSrc[]>;
};

export const freshDz = (): DzState => ({
  enabled: false,
  hookOn: false,
  secret: "",
  templateId: "",
  templateName: "",
  vars: 0,
  delayMin: 30,
  from: "09:00",
  to: "21:00",
  cutoff: "19:30",
  dailyLimit: 200,
  maps: {},
});

const HHMM = /^\d{1,2}:\d{2}$/;
const validHHMM = (s: unknown): s is string => {
  if (typeof s !== "string" || !HHMM.test(s)) return false;
  try {
    parseHHMM(s);
    return true;
  } catch {
    return false;
  }
};
const padHHMM = (s: string) => {
  const { h, m } = parseHHMM(s);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const minsOf = (s: string) => {
  const { h, m } = parseHHMM(s);
  return h * 60 + m;
};

function cleanMap(x: unknown): VarSrc[] | null {
  if (!Array.isArray(x) || x.length > 10) return null;
  const out: VarSrc[] = [];
  for (const v of x) {
    if (!v || typeof v !== "object") return null;
    const kind = (v as any).kind;
    if (kind === "name" || kind === "date" || kind === "link") out.push({ kind });
    else if (kind === "text") {
      const text = typeof (v as any).text === "string" ? (v as any).text.replace(/\s+/g, " ").trim().slice(0, 200) : "";
      out.push({ kind, text });
    } else return null;
  }
  return out;
}

/** Состояние из wa-state.json: всё проверяется, лишнее отбрасывается. */
export function normalizeDz(raw: unknown): DzState {
  const st = freshDz();
  if (!raw || typeof raw !== "object") return st;
  const r = raw as Record<string, any>;
  st.enabled = r.enabled === true;
  st.hookOn = r.hookOn === true;
  st.secret = typeof r.secret === "string" ? r.secret : "";
  st.templateId = typeof r.templateId === "string" ? r.templateId : "";
  st.templateName = typeof r.templateName === "string" ? r.templateName.slice(0, 120) : "";
  st.vars = Number.isInteger(r.vars) && r.vars >= 0 && r.vars <= 10 ? r.vars : 0;
  if (Number.isFinite(r.delayMin) && r.delayMin >= 0 && r.delayMin <= 1440) st.delayMin = Math.round(r.delayMin);
  if (validHHMM(r.from) && validHHMM(r.to) && minsOf(r.from) < minsOf(r.to)) {
    st.from = padHHMM(r.from);
    st.to = padHHMM(r.to);
  }
  if (validHHMM(r.cutoff)) st.cutoff = padHHMM(r.cutoff);
  if (Number.isFinite(r.dailyLimit) && r.dailyLimit >= 1 && r.dailyLimit <= 250) st.dailyLimit = Math.round(r.dailyLimit);
  if (r.maps && typeof r.maps === "object" && !Array.isArray(r.maps)) {
    for (const [k, v] of Object.entries(r.maps)) {
      const m = cleanMap(v);
      if (m && k.length <= 80) st.maps[k] = m;
    }
  }
  return st;
}

// ───────────────────────── чистые помощники ─────────────────────────

export type Phone = { digits: string; kz: boolean };

/**
 * Номер из заявки до цифр. 8XXXXXXXXXX становится 7XXXXXXXXXX; 10 цифр без кода считаются казахстанскими только при первой цифре 7
 * (7771234567 -> 77771234567). Казахстан: 77 и всего 11 цифр. Остальные номера остаются как есть (для сверки с участниками), но kz false.
 */
export function normalizePhone(raw: unknown): Phone | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length < 8 || d.length > 15) return null;
  if (d.length === 11 && d[0] === "8") d = `7${d.slice(1)}`;
  else if (d.length === 10 && d[0] === "7") d = `7${d}`;
  return { digits: d, kz: /^77\d{9}$/.test(d) };
}

export const maskDigits = (d: string) => (d.length >= 9 ? `${d.slice(0, 4)}***${d.slice(-4)}` : d ? "***" : "");

const NAME_STOP = new Set(["тест", "test", "тестовый", "имя", "name", "нет", "no", "none", "null", "undefined", "asd", "asdf", "qwe", "qwerty", "йцукен", "фыв", "admin", "абв", "абвг", "абвгд", "аааа", "xxx", "ххх"]);

/**
 * Имя для {{1}}: первое слово, только буквы и дефис, до 30 знаков. Мусор (цифры, адрес, почта, одна буква, повтор одной буквы,
 * набор без гласных, слова вроде «тест») даёт пустую строку. Слово целиком строчными или заглавными приводится к виду «Айгерим».
 */
export function cleanName(raw: unknown): string {
  const token = String(raw ?? "").normalize("NFC").trim().split(/\s+/)[0] || "";
  if (!token || /[@\d/\\:]|https?|www\./i.test(token)) return "";
  let s = token.replace(/[^\p{L}-]/gu, "").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  if (s.length < 2 || s.length > 30) return "";
  const plain = s.replace(/-/g, "");
  if (plain.length < 2) return "";
  if (NAME_STOP.has(plain.toLowerCase())) return "";
  if (/(.)\1{3,}/iu.test(plain) || new Set(plain.toLowerCase()).size < 2) return "";
  if (!/[аеёиоуыэюяaeiouyәөүұі]/iu.test(plain)) return "";
  if (plain === plain.toLowerCase() || plain === plain.toUpperCase()) {
    s = s
      .split("-")
      .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p))
      .join("-");
  }
  return s;
}

const WEEKDAY_ACC = ["в воскресенье", "в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу"];

/** {{2}}: «сегодня, 9 октября», «завтра, 10 октября», дальше «в субботу, 10 октября». Считается от дня эфира и момента отправки. */
export function dateWord(day: string, now: number): string {
  const today = dayKeyOf(now);
  const date = dateLabel(day);
  if (day === today) return `сегодня, ${date}`;
  if (day === addDays(today, 1)) return `завтра, ${date}`;
  const { y, m0, d } = parseDayKey(day);
  return `${WEEKDAY_ACC[new Date(Date.UTC(y, m0, d)).getUTCDay()]}, ${date}`;
}

const text = (t: string): VarSrc => ({ kind: "text", text: t });

/** Соответствие переменных по умолчанию для трёх известных шаблонов; для остальных имя, дата и пустые тексты, которые нужно заполнить. */
export function defaultMap(name: string, title: string, vars: number | null): VarSrc[] {
  const key = `${name} ${title}`.toLowerCase();
  let base: VarSrc[];
  if (/napominanie_o_zapisi|напоминание о записи/.test(key)) base = [text("команда onAI Academy"), text("воркшопе «Вайб-продакшен»"), text("20:00 по Алматы")];
  else base = [{ kind: "name" }, { kind: "date" }];
  const n = vars ?? base.length;
  const out = base.slice(0, n);
  while (out.length < n) out.push(text(""));
  return out;
}

export type ValueCtx = { name: string; day: string; now: number; link: string };

/** Значения переменных по соответствию. Пустое значение Wazzup отвергнет, поэтому null, если какое-то пусто. */
export function buildValues(map: VarSrc[], c: ValueCtx): string[] | null {
  const out: string[] = [];
  for (const v of map) {
    const s = v.kind === "name" ? c.name : v.kind === "date" ? dateWord(c.day, c.now) : v.kind === "link" ? c.link : (v.text || "").trim();
    if (!s) return null;
    out.push(s);
  }
  return out;
}

const DECLINE_RE = /^(нет|не надо|не нужно|не хочу|стоп|stop|отписаться|отпишите|отписка)(?![\p{L}])/u;

/** Ответ «Нет» (в том числе кнопка «Нет, не могу прийти»): короткий текст, начинающийся с отказа. */
export function isDecline(raw: unknown): boolean {
  const t = String(raw ?? "").toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}\s,]/gu, " ").replace(/\s+/g, " ").trim();
  return t.length > 0 && t.length <= 40 && DECLINE_RE.test(t);
}

const digitsOf = (x: unknown) => (typeof x === "string" ? x.replace(/[:@].*$/, "").replace(/\D/g, "") : "");

// ───────────────────────── хозяин и память ─────────────────────────

export type DzTarget = { id: string; day: string; sendJid: string };

export type DzHost = {
  dir: string;
  now: () => number;
  rand: () => number;
  sleep: (ms: number) => Promise<void>;
  /** Тревога владельцам: строка в журнале модуля плюс Telegram. В тексте нет полных номеров. */
  alarm: (text: string) => Promise<void>;
  /** Сообщение владельцам в Telegram без записи в журнал модуля. */
  notify: (text: string) => Promise<unknown>;
  journal: (row: Record<string, unknown>) => void;
  /** Общая очередь запросов к Evolution: строго по одному. */
  exclusive: <T>(fn: () => Promise<T>) => Promise<T>;
  state: () => DzState;
  patch: (p: Partial<DzState>) => void;
  /** Можно ли сейчас работать: модуль не на паузе, номер подключён, данные держит этот процесс. */
  canRun: () => { ok: true } | { ok: false; why: string };
  timeCfg: () => TimeCfg;
  /** День эфира, на который записана заявка, поданная в момент ts (assignStreamDay, как у бота; в живом эфире день эфира). */
  dayOf: (ts: number) => string;
  /** Цели (сообщества) текущего и следующего дня, ещё не закрытые. */
  targets: (now: number) => DzTarget[];
  /** Сообщить число участников цели (обновляет members для переполнения). */
  noteMembers: (id: string, count: number, at: number) => void;
  /** Ссылка сообщества дня D; null, если готового сообщества этого дня нет. */
  linkFor: (day: string, now: number) => string | null;
  /** Заявки из leads.jsonl. leads null: файл недоступен. */
  leads: () => { leads: Lead[] | null; error: string };
  /** eventId заявок, по которым человек нажал Start в боте. */
  linkedEids: () => Set<string>;
  /** Постоянный адрес /wa. */
  waUrl: string;
};

type Member = { day: string; at: number; total: number; unresolved: number; numbers: Set<string> };
type Chat = { eid: string; day: string; sentAt: number; test: boolean; replyAt: number; linkAt: number };
type Row = { ts: number; ev: string; [k: string]: unknown };
type Reply = { chat: string; kind: "link" | "decline"; tries: number; nextAt: number };

type Dz = {
  host: DzHost;
  file: string;
  membersFile: string;
  rows: Row[];
  members: Map<string, Member>;
  sentEids: Set<string>;
  sentPhoneDay: Set<string>;
  failedEids: Set<string>;
  tries: Map<string, { n: number; nextAt: number }>;
  chats: Map<string, Chat>;
  declined: Set<string>;
  seenMid: Set<string>;
  tplSeen: Set<string>;
  sendTimes: number[];
  names: Map<string, string>;
  alarmAt: Map<string, number>;
  replies: Reply[];
  running: Set<Promise<unknown>>;
  /** Ответы, которые сейчас отправляются (вид и чат): два сообщения подряд от одного человека не должны дать два письма. */
  busy: Set<string>;
  ticking: boolean;
  toggling: boolean;
  hookBusy: boolean;
  consecFail: number;
  haltUntil: number;
  measureFails: number;
  /** Когда последний раз пробовали замерить цель: после неудачи следующая попытка не раньше чем через MEASURE_RETRY. */
  measureTry: Map<string, number>;
  testAt: number[];
  tpl: { at: number; callAt: number; items: wz.WzTemplate[] } | null;
  hookCheckAt: number;
  lastTickAt: number;
};

let A: Dz | null = null;
const need = (): Dz => {
  if (!A) throw new Error("дожим WABA не инициализирован");
  return A;
};

const log = (msg: string, ...args: unknown[]) => console.log(`[wa-dozhim] ${msg}`, ...args);
const clipText = (s: unknown, n: number) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const scrub = (s: string) => {
  let out = s;
  for (const k of [wz.wzKey(), evo.evoKey(), A?.host.state().secret || "", env("WAZZUP_HOOK_SECRET")]) if (k) out = out.split(k).join("***");
  return out;
};

function appendRow(a: Dz, row: Row) {
  try {
    appendFileSync(a.file, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    console.error("[wa-dozhim] не смог дописать wa-dozhim.jsonl:", (e as Error).message);
  }
  a.rows.push(row);
  if (a.rows.length > ROWS_KEEP) a.rows.splice(0, a.rows.length - ROWS_KEEP);
}

function readTail(file: string, maxBytes: number): any[] {
  try {
    const size = statSync(file).size;
    const start = Math.max(0, size - maxBytes);
    const buf = Buffer.alloc(size - start);
    const fd = openSync(file, "r");
    try {
      readSync(fd, buf, 0, buf.length, start);
    } finally {
      closeSync(fd);
    }
    let t = buf.toString("utf8");
    if (start > 0) t = t.slice(t.indexOf("\n") + 1);
    const out: any[] = [];
    for (const line of t.split("\n")) {
      const s = line.trim();
      if (!s) continue;
      try {
        out.push(JSON.parse(s));
      } catch {
        /* битую строку пропускаем */
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Применить строку файла к памяти (при старте). */
function applyRow(a: Dz, row: Row) {
  const ts = typeof row.ts === "number" ? row.ts : 0;
  const to = typeof row.to === "string" ? row.to : "";
  const chat = typeof row.chat === "string" ? row.chat : "";
  switch (row.ev) {
    case "send": {
      if (row.ok !== true || !to) break;
      const eid = String(row.eid || "");
      if (eid) a.sentEids.add(eid);
      const day = String(row.day || "");
      if (day) a.sentPhoneDay.add(`${to}|${day}`);
      a.sendTimes.push(ts);
      const prev = a.chats.get(to);
      if (!prev || ts >= prev.sentAt) a.chats.set(to, { eid, day, sentAt: ts, test: row.test === true, replyAt: 0, linkAt: 0 });
      if (row.test === true) a.declined.delete(to);
      break;
    }
    case "send_fail": {
      const eid = String(row.eid || "");
      if (!eid) break;
      if (row.final === true) a.failedEids.add(eid);
      else a.tries.set(eid, { n: Number(row.attempt) || 1, nextAt: ts + RETRY_AFTER });
      break;
    }
    case "in": {
      if (typeof row.mid === "string" && row.mid) a.seenMid.add(row.mid);
      const c = a.chats.get(chat);
      if (c && ts >= c.sentAt) c.replyAt = Math.max(c.replyAt, ts);
      break;
    }
    case "link": {
      const c = a.chats.get(chat);
      if (c && row.ok === true) c.linkAt = Math.max(c.linkAt, ts);
      break;
    }
    case "decline":
      if (chat) a.declined.add(chat);
      break;
    case "tpl_status":
      a.tplSeen.add(`${row.guid}|${row.status}`);
      break;
  }
}

function persistMembers(a: Dz) {
  try {
    const targets: Record<string, unknown> = {};
    for (const [id, m] of a.members) targets[id] = { day: m.day, at: m.at, total: m.total, unresolved: m.unresolved, numbers: [...m.numbers] };
    const tmp = `${a.membersFile}.tmp.${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ v: 1, targets }) + "\n", "utf8");
    renameSync(tmp, a.membersFile);
  } catch (e) {
    console.error("[wa-dozhim] не смог записать wa-members.json:", (e as Error).message);
  }
}

function loadMembers(a: Dz) {
  try {
    if (!existsSync(a.membersFile)) return;
    const raw = JSON.parse(readFileSync(a.membersFile, "utf8"));
    for (const [id, m] of Object.entries<any>(raw?.targets || {})) {
      if (!m || !Array.isArray(m.numbers) || typeof m.at !== "number") continue;
      a.members.set(id, { day: String(m.day || ""), at: m.at, total: Number(m.total) || m.numbers.length, unresolved: Number(m.unresolved) || 0, numbers: new Set(m.numbers.map(String)) });
    }
  } catch {
    log("wa-members.json нечитаем, начинаю без замера");
  }
}

/** Подключить дожим к модулю: прочитать файлы, восстановить, кому и что уже слали. */
export function dzInit(host: DzHost): void {
  dzReset();
  mkdirSync(host.dir, { recursive: true });
  const a: Dz = {
    host,
    file: join(host.dir, "wa-dozhim.jsonl"),
    membersFile: join(host.dir, "wa-members.json"),
    rows: [],
    members: new Map(),
    sentEids: new Set(),
    sentPhoneDay: new Set(),
    failedEids: new Set(),
    tries: new Map(),
    chats: new Map(),
    declined: new Set(),
    seenMid: new Set(),
    tplSeen: new Set(),
    sendTimes: [],
    names: new Map(),
    alarmAt: new Map(),
    replies: [],
    running: new Set(),
    busy: new Set(),
    ticking: false,
    toggling: false,
    hookBusy: false,
    consecFail: 0,
    haltUntil: 0,
    measureFails: 0,
    measureTry: new Map(),
    testAt: [],
    tpl: null,
    hookCheckAt: 0,
    lastTickAt: 0,
  };
  try {
    if (existsSync(a.file) && statSync(a.file).size > FILE_COMPACT_BYTES) {
      const keep = readTail(a.file, 2 * 1024 * 1024);
      const tmp = `${a.file}.tmp.${process.pid}`;
      writeFileSync(tmp, keep.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
      renameSync(tmp, a.file);
    }
  } catch (e) {
    console.error("[wa-dozhim] не смог сжать wa-dozhim.jsonl:", (e as Error).message);
  }
  for (const row of readTail(a.file, FILE_TAIL_BYTES)) {
    if (!row || typeof row.ev !== "string" || typeof row.ts !== "number") continue;
    a.rows.push(row as Row);
    applyRow(a, row as Row);
  }
  if (a.rows.length > ROWS_KEEP) a.rows.splice(0, a.rows.length - ROWS_KEEP);
  a.sendTimes = a.sendTimes.filter((t) => host.now() - t < 2 * DAY);
  loadMembers(a);
  A = a;
}

export function dzReset(): void {
  A = null;
}

export const dzActive = () => !!A;
/** Для тестов. */
export const _dz = () => A;

// ───────────────────────── что нужно для работы ─────────────────────────

/** Секрет вебхука: из WAZZUP_HOOK_SECRET, иначе случайный из состояния модуля. */
function hookSecret(): string {
  return env("WAZZUP_HOOK_SECRET") || A?.host.state().secret || "";
}

function ensureSecret(a: Dz): string {
  if (env("WAZZUP_HOOK_SECRET")) return env("WAZZUP_HOOK_SECRET");
  const cur = a.host.state().secret;
  if (cur) return cur;
  const secret = randomBytes(24).toString("hex");
  a.host.patch({ secret });
  return secret;
}

const hookUri = (secret: string) => `${hookBase()}?s=${encodeURIComponent(secret)}`;
/** Адрес без секрета: его можно показывать. */
const hookShown = () => hookBase();

function currentMap(a: Dz): VarSrc[] {
  const st = a.host.state();
  return st.maps[st.templateId] ?? defaultMap(st.templateName, "", st.vars || null);
}

/** Соответствие заполнено полностью и по числу переменных подходит шаблону. */
function mapProblem(a: Dz): string {
  const st = a.host.state();
  const map = currentMap(a);
  if (st.vars && map.length !== st.vars) return `В шаблоне ${st.vars} переменных, а настроено ${map.length}.`;
  for (let i = 0; i < map.length; i++) if (map[i].kind === "text" && !(map[i].text || "").trim()) return `Заполни текст для переменной {{${i + 1}}}.`;
  return "";
}

/** Можно ли включать: есть ключ и канал Wazzup, выбран шаблон, переменные заполнены. */
function prerequisites(a: Dz): { ok: true } | { ok: false; reason: string } {
  if (!wz.wzKey()) return { ok: false, reason: "Нет WAZZUP_API_KEY в .env на сервере: дожим не стартует." };
  if (!wz.wzChannel()) return { ok: false, reason: "Нет WAZZUP_CHANNEL_ID в .env на сервере: дожим не стартует." };
  if (!evo.evoKey()) return { ok: false, reason: "Нет EVOLUTION_API_KEY: без него не видно, кто вступил." };
  const st = a.host.state();
  if (!st.templateId) return { ok: false, reason: "Выбери шаблон из одобренных и сохрани настройки." };
  const bad = mapProblem(a);
  if (bad) return { ok: false, reason: bad };
  return { ok: true };
}

// ───────────────────────── тревоги ─────────────────────────

/** Одна тревога на ключ за окно. */
async function alarmOnce(a: Dz, key: string, windowMs: number, textMsg: string) {
  const now = a.host.now();
  if (now - (a.alarmAt.get(key) || 0) < windowMs) return;
  a.alarmAt.set(key, now);
  try {
    await a.host.alarm(textMsg);
  } catch {
    /* Telegram недоступен: тревога осталась в журнале */
  }
}

// ───────────────────────── замер участников ─────────────────────────

/**
 * Участники вкладки объявлений цели. Номер берём из phoneNumber (77…@s.whatsapp.net), а если его нет, из id вида …@s.whatsapp.net;
 * участник только с LID и без номера считается неопознанным (число пишется в замер). Подозрительное падение числа (список вдруг
 * в разы короче прошлого) замером не принимается: иначе пустой ответ Evolution превратил бы всех вступивших в «не вступил».
 */
async function measureTarget(a: Dz, t: DzTarget): Promise<boolean> {
  const r = await a.host.exclusive(() => evo.groupParticipants(t.sendJid));
  const at = a.host.now();
  if (!r.ok) {
    a.measureFails++;
    log("замер %s не получен: %s", t.id, scrub(r.error));
    if (a.measureFails >= 3) await alarmOnce(a, "measure", HOUR, `Дожим WABA: не получается узнать, кто вступил в сообщество (${clipText(scrub(r.error), 100)}). Пока замера нет, шаблоны не отправляются.`);
    return false;
  }
  const numbers = new Set<string>();
  let unresolved = 0;
  for (const p of r.data) {
    const d = digitsOf(p.phoneNumber) || (p.id.endsWith("@s.whatsapp.net") ? digitsOf(p.id) : "");
    if (d) numbers.add(d);
    else unresolved++;
  }
  const total = r.data.length;
  // Первый замер тоже проверяем: пустой список или участники без номеров (только LID) превратили бы вступивших в «не вступил».
  if (total === 0 || (total >= 20 && unresolved > total * 0.05)) {
    a.measureFails++;
    log("замер %s не принят: участников %d, без номера %d", t.id, total, unresolved);
    if (a.measureFails >= 3) await alarmOnce(a, `bad:${t.id}`, HOUR, `Дожим WABA: замер сообщества ${t.day} не принят (участников ${total}, без номера ${unresolved}). Шаблоны этому дню не отправляются.`);
    return false;
  }
  const prev = a.members.get(t.id);
  if (prev && prev.total >= 10 && total < prev.total * 0.7) {
    a.measureFails++;
    log("замер %s подозрителен: было %d, стало %d, не принимаю", t.id, prev.total, total);
    await alarmOnce(a, `shrink:${t.id}`, HOUR, `Дожим WABA: список участников сообщества ${t.day} вдруг стал короче (${prev.total} -> ${total}). Замер не принят, шаблоны этому дню не отправляются, пока список не вернётся.`);
    return false;
  }
  a.measureFails = 0;
  a.members.set(t.id, { day: t.day, at, total, unresolved, numbers });
  a.host.noteMembers(t.id, total, at);
  persistMembers(a);
  log("замер %s: участников %d, номеров %d, без номера %d", t.id, total, numbers.size, unresolved);
  return true;
}

/** Забыть замеры целей, которых больше нет среди актуальных. */
function pruneMembers(a: Dz, live: DzTarget[]) {
  const ids = new Set(live.map((t) => t.id));
  let changed = false;
  for (const id of [...a.members.keys()]) {
    if (!ids.has(id)) {
      a.members.delete(id);
      changed = true;
    }
  }
  if (changed) persistMembers(a);
}

/** Номера участников всех сообществ дня D. null: цели нет или замер хоть одной не свежий. */
function membersOfDay(a: Dz, day: string, targets: DzTarget[], now: number, needFresh: boolean): Set<string> | null {
  const list = targets.filter((t) => t.day === day);
  if (!list.length) return null;
  const union = new Set<string>();
  for (const t of list) {
    const m = a.members.get(t.id);
    if (!m) return null;
    if (needFresh && now - m.at > MEASURE_MAX_AGE) return null;
    for (const n of m.numbers) union.add(n);
  }
  return union;
}

// ───────────────────────── отбор кандидатов ─────────────────────────

export type Pick = { lead: Lead; digits: string; day: string; eid: string; due: number };

export type Eval = {
  /** Можно слать прямо сейчас, от старых заявок к новым. */
  ready: Pick[];
  /** Подходят по правилам, но ещё ждут: срок, окно часов, замер. */
  waiting: number;
  /** Из них ждут свежего замера. */
  needMeasure: number;
  foreign: number;
  /** Дни, на которые есть ждущие заявки, а готового сообщества с замером нет: шаблон им не уйдёт. */
  noTarget: string[];
  /** Дни эфира для «вступили N из M». */
  days: Array<{ day: string; applied: number; joined: number | null; measuredAt: number; unresolved: number }>;
  error: string;
};

const minuteOfDay = (ms: number) => {
  const p = partsInTZ(ms);
  return p.hour * 60 + p.minute;
};

/** Ближайший момент не раньше ms, лежащий в окне часов [from, to). Раньше окна: сегодня в from, позже: завтра в from. */
export function windowStart(ms: number, from: string, to: string): number {
  const m = minuteOfDay(ms);
  const day = dayKeyOf(ms);
  if (m < minsOf(from)) return atTime(day, from);
  if (m >= minsOf(to)) return atTime(addDays(day, 1), from);
  return ms;
}

const inWindow = (ms: number, st: DzState) => {
  const m = minuteOfDay(ms);
  return m >= minsOf(st.from) && m < minsOf(st.to);
};

/**
 * Кто сейчас кандидат на шаблон. Правило: заявка на день D (assignStreamDay по времени заявки, как у бота), D не раньше сегодня, номер
 * Казахстана, нет среди участников сообщества D, бот по заявке не запускали, шаблон по заявке и по номеру на день ещё не слали, номер не
 * отказался. Срок: через delayMin минут после заявки, в окне часов, в день эфира не позже cutoff, замер дня не старше 10 минут.
 */
export function evaluate(a: Dz, now: number): Eval {
  const h = a.host;
  const st = h.state();
  const out: Eval = { ready: [], waiting: 0, needMeasure: 0, foreign: 0, noTarget: [], days: [], error: "" };
  const src = h.leads();
  if (!src.leads) {
    out.error = src.error || "заявки недоступны";
    return out;
  }
  const cfg = h.timeCfg();
  const today = dayKeyOf(now);
  const targets = h.targets(now);
  const linked = h.linkedEids();
  const seenEid = new Set<string>();
  const seenPhoneDay = new Set<string>();
  const cutoffMs = atTime(today, st.cutoff);
  const curDay = h.dayOf(now);
  const nxtDay = nextStreamDay(addDays(curDay, 1), cfg);
  const shown = new Map<string, Set<string>>([[today, new Set()], [curDay, new Set()], [nxtDay, new Set()]]);
  const leads = [...src.leads].sort((x, y) => x.ts - y.ts);
  for (const lead of leads) {
    if (lead.ts > now) continue;
    if (now - lead.ts > MAX_LEAD_AGE) continue;
    const day = h.dayOf(lead.ts);
    const ph = normalizePhone(lead.phone);
    if (ph && shown.has(day)) shown.get(day)!.add(ph.digits);
    if (day < today || !ph) continue;
    if (!ph.kz) {
      out.foreign++;
      continue;
    }
    const eid = lead.eventId || lead.id;
    if (!eid || linked.has(eid)) continue;
    if (seenEid.has(eid) || a.sentEids.has(eid) || a.failedEids.has(eid)) continue;
    const pd = `${ph.digits}|${day}`;
    if (seenPhoneDay.has(pd) || a.sentPhoneDay.has(pd) || a.declined.has(ph.digits)) continue;
    const anyMembers = membersOfDay(a, day, targets, now, false);
    if (anyMembers?.has(ph.digits)) continue;
    seenEid.add(eid);
    seenPhoneDay.add(pd);
    out.waiting++;
    const fresh = membersOfDay(a, day, targets, now, true);
    if (!fresh) {
      out.needMeasure++;
      if (!targets.some((t) => t.day === day) && !out.noTarget.includes(day)) out.noTarget.push(day);
      continue;
    }
    const due = windowStart(lead.ts + st.delayMin * MIN, st.from, st.to);
    if (now < due || !inWindow(now, st)) continue;
    if (day === today && now > cutoffMs) continue;
    if (a.tries.get(eid) && (a.tries.get(eid)!.nextAt > now)) continue;
    out.ready.push({ lead, digits: ph.digits, day, eid, due });
  }
  for (const [day, phones] of shown) {
    const mem = membersOfDay(a, day, targets, now, false);
    let joined: number | null = null;
    if (mem) {
      joined = 0;
      for (const p of phones) if (mem.has(p)) joined++;
    }
    const at = Math.min(...targets.filter((t) => t.day === day).map((t) => a.members.get(t.id)?.at ?? 0), Number.MAX_SAFE_INTEGER);
    const unresolved = targets.filter((t) => t.day === day).reduce((n, t) => n + (a.members.get(t.id)?.unresolved ?? 0), 0);
    out.days.push({ day, applied: phones.size, joined, measuredAt: at === Number.MAX_SAFE_INTEGER ? 0 : at, unresolved });
  }
  return out;
}

// ───────────────────────── отправка ─────────────────────────

const sends24 = (a: Dz, now: number) => a.sendTimes.filter((t) => now - t < DAY).length;

/** Имя для {{1}}: из заявки; нет или мусор, имя профиля WhatsApp у Evolution; нет и его, «друг». */
async function resolveName(a: Dz, lead: Lead | null, digits: string, useProfile: boolean): Promise<{ name: string; from: "lead" | "profile" | "fallback" }> {
  const own = lead ? cleanName(lead.name) : "";
  if (own) return { name: own, from: "lead" };
  if (useProfile) {
    let prof = a.names.get(digits);
    if (prof === undefined) {
      const r = await a.host.exclusive(() => evo.contactPushName(digits));
      prof = r.ok ? cleanName(r.data) : "";
      // Ошибку запроса не запоминаем: следующий проход спросит ещё раз. Успешный пустой ответ запоминаем.
      if (r.ok) {
        a.names.set(digits, prof);
        if (a.names.size > 2000) a.names.delete(a.names.keys().next().value as string);
      }
    }
    if (prof) return { name: prof, from: "profile" };
  }
  return { name: "друг", from: "fallback" };
}

type SendOutcome = { ok: true; mid: string; dup?: boolean } | { ok: false; status: number; error: string; retryable: boolean };

async function sendTemplate(a: Dz, chat: string, values: string[], crm: string): Promise<SendOutcome> {
  const st = a.host.state();
  const r = await wz.wzSend({ chatId: chat, templateId: st.templateId, templateValues: values, crmMessageId: crm });
  if (r.ok) return { ok: true, mid: r.data.messageId };
  if (wz.isRepeatedCrmId(r)) return { ok: true, mid: "", dup: true };
  return { ok: false, status: r.status, error: scrub(r.error), retryable: r.retryable };
}

function recordSent(a: Dz, p: { to: string; eid: string; day: string; mid: string; test: boolean; name: string; from: string; dup?: boolean }) {
  const now = a.host.now();
  appendRow(a, { ts: now, ev: "send", ok: true, to: p.to, eid: p.eid, day: p.day, tpl: a.host.state().templateId, tplName: a.host.state().templateName, mid: p.mid, crm: `dozhim-${p.eid}`, status: 201, ...(p.test ? { test: true } : {}), nameFrom: p.from, ...(p.dup ? { dup: true } : {}) });
  if (p.eid) a.sentEids.add(p.eid);
  a.sentPhoneDay.add(`${p.to}|${p.day}`);
  a.sendTimes.push(now);
  a.chats.set(p.to, { eid: p.eid, day: p.day, sentAt: now, test: p.test, replyAt: 0, linkAt: 0 });
  a.tries.delete(p.eid);
  if (p.test) a.declined.delete(p.to);
}

/** Отправить шаблон одной заявке. Возвращает false, если отправки встали (halt) и цикл надо прервать. */
async function sendPick(a: Dz, pick: Pick): Promise<boolean> {
  const h = a.host;
  const st = h.state();
  const map = currentMap(a);
  const needsName = map.some((v) => v.kind === "name");
  const nm = needsName ? await resolveName(a, pick.lead, pick.digits, true) : { name: "", from: "lead" as const };
  const now = h.now();
  const link = h.waUrl;
  const values = buildValues(map, { name: nm.name, day: pick.day, now, link });
  if (!values) {
    await alarmOnce(a, "values", HOUR, "Дожим WABA: не удалось собрать значения переменных шаблона (пустое значение). Проверь соответствие переменных в пульте.");
    return false;
  }
  const res = await sendTemplate(a, pick.digits, values, `dozhim-${pick.eid}`);
  if (res.ok) {
    a.consecFail = 0;
    recordSent(a, { to: pick.digits, eid: pick.eid, day: pick.day, mid: res.mid, test: false, name: nm.name, from: nm.from, dup: res.dup });
    log("шаблон ушёл: %s, эфир %s", maskDigits(pick.digits), pick.day);
    return true;
  }
  const n = (a.tries.get(pick.eid)?.n ?? 0) + 1;
  const final = !res.retryable || n >= MAX_ATTEMPTS;
  appendRow(a, { ts: h.now(), ev: "send_fail", to: pick.digits, eid: pick.eid, day: pick.day, tpl: st.templateId, status: res.status, err: clipText(res.error, 160), retryable: res.retryable, attempt: n, final });
  log("шаблон не ушёл (%s): %s, попытка %d%s", maskDigits(pick.digits), res.error, n, final ? ", окончательно" : "");
  // 429 и 5xx: Wazzup сейчас не принимает, остальным заявкам в этом проходе не пишем. Следующий проход через 30 секунд, повтор этой заявки через 5 минут.
  if (!final) {
    a.tries.set(pick.eid, { n, nextAt: h.now() + RETRY_AFTER });
    // Сбой на стороне Wazzup: пауза для всех заявок, иначе каждая следующая за несколько минут сожжёт свои попытки.
    a.haltUntil = Math.max(a.haltUntil || 0, h.now() + RETRY_AFTER);
    return false;
  }
  a.failedEids.add(pick.eid);
  a.tries.delete(pick.eid);
  await alarmOnce(a, `fail:${res.status}:${clipText(res.error, 40)}`, HOUR, `Дожим WABA: шаблон ${maskDigits(pick.digits)} не отправлен (${clipText(res.error, 120)}). ${res.retryable ? "Три попытки исчерпаны." : "Повтора не будет."}`);
  if (res.retryable) return false;
  a.consecFail++;
  if (a.consecFail >= HALT_AFTER) {
    a.haltUntil = h.now() + HALT_MS;
    a.consecFail = 0;
    await alarmOnce(a, "halt", HOUR, `Дожим WABA: ${HALT_AFTER} отказа подряд, отправки остановлены на час, чтобы не терять заявки. Проверь шаблон, канал и ключ Wazzup в пульте.`);
    return false;
  }
  return true;
}

export type DzTickInfo = { skipped?: "off" | "no_run" | "no_config" | "busy" | "halt" | "no_leads"; sent: number; measured: number; ready: number };

/**
 * Один проход (раз в 30 секунд): замер участников, если устарел, отбор кандидатов, отправка. Выключенный дожим не делает ничего.
 * Повторы ответов людям (ссылка) идут и при выключенном дожиме, пока стоит вебхук. Не бросает.
 */
export async function dzTick(): Promise<DzTickInfo> {
  const a = A;
  const none: DzTickInfo = { sent: 0, measured: 0, ready: 0 };
  if (!a) return none;
  if (a.ticking) return { ...none, skipped: "busy" };
  a.ticking = true;
  try {
    const h = a.host;
    const st = h.state();
    a.lastTickAt = h.now();
    if (st.hookOn || a.replies.length) await runReplies(a);
    if (st.hookOn) await hookCheck(a);
    if (!st.enabled) return { ...none, skipped: "off" };
    const can = h.canRun();
    if (!can.ok) return { ...none, skipped: "no_run" };
    if (!prerequisites(a).ok) return { ...none, skipped: "no_config" };
    const now0 = h.now();
    const targets = h.targets(now0);
    pruneMembers(a, targets);
    // Замер: раз в 10 минут, а если есть кому писать, раз в 5.
    const first = evaluate(a, now0);
    const maxAge = first.ready.length || first.needMeasure ? MEASURE_BUSY_AGE : MEASURE_MAX_AGE;
    let measured = 0;
    for (const t of targets) {
      const m = a.members.get(t.id);
      if (m && now0 - m.at < maxAge) continue;
      if (now0 - (a.measureTry.get(t.id) ?? 0) < MEASURE_RETRY) continue;
      a.measureTry.set(t.id, now0);
      if (await measureTarget(a, t)) measured++;
    }
    const ev = measured ? evaluate(a, h.now()) : first;
    const info: DzTickInfo = { sent: 0, measured, ready: ev.ready.length };
    if (h.now() < a.haltUntil) return { ...info, skipped: "halt" };
    if (!ev.ready.length) return info;
    for (const pick of ev.ready) {
      if (info.sent >= PER_TICK) break;
      if (!h.state().enabled || !h.canRun().ok) break;
      const now = h.now();
      if (now < a.haltUntil) break;
      // Замер мог устареть за время пачки: тогда останавливаемся, следующий проход обновит его.
      const tg = h.targets(now);
      const mem = membersOfDay(a, pick.day, tg, now, true);
      if (!mem) break;
      if (mem.has(pick.digits)) continue;
      if (sends24(a, now) >= h.state().dailyLimit) {
        await alarmOnce(a, `limit:${dayKeyOf(now)}`, DAY, `Дожим WABA: за сутки уже ${h.state().dailyLimit} шаблонов, это предел защиты номера. Остальные заявки подождут.`);
        break;
      }
      const before = a.sentEids.has(pick.eid);
      const cont = await sendPick(a, pick);
      if (!before && a.sentEids.has(pick.eid)) info.sent++;
      if (!cont) break;
      await h.sleep(Math.round(PACE_MS[0] + h.rand() * (PACE_MS[1] - PACE_MS[0])));
    }
    return info;
  } catch (e) {
    console.error("[wa-dozhim] проход упал:", scrub(String((e as Error)?.stack || e)).slice(0, 400));
    return none;
  } finally {
    a.ticking = false;
  }
}

// ───────────────────────── вебхук Wazzup: приём ─────────────────────────

const hashOf = (s: string) => createHash("sha256").update(s).digest();

function readLimited(req: IncomingMessage, max: number): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0;
    let over = false;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > max) over = true;
      else chunks.push(c);
    });
    req.on("end", () => resolve(over ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });
}

/**
 * POST /api/wazzup-hook?s=секрет. Секрет неверный: 403 и ничего больше. Верный: 200 сразу (Wazzup ждёт ответа несколько секунд),
 * разбор идёт после ответа. Тестовый POST {test:true} при установке вебхука получает 200 и больше ничего не вызывает.
 */
export async function handleWazzupHook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
    res.end(payload);
  };
  const secret = hookSecret();
  let given = "";
  try {
    given = new URL(req.url || "/", "http://x").searchParams.get("s") || "";
  } catch {
    given = "";
  }
  if (req.method !== "POST" || !secret || !given || !timingSafeEqual(hashOf(secret), hashOf(given))) {
    req.resume();
    return send(req.method !== "POST" ? 405 : 403, { ok: false });
  }
  const raw = await readLimited(req, 1024 * 1024);
  send(200, { ok: true });
  const a = A;
  if (!a || raw === null) return;
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return;
  }
  if (!body || typeof body !== "object" || body.test === true) return;
  const job = ingest(a, body)
    .catch((e) => console.error("[wa-dozhim] разбор вебхука упал:", scrub(String((e as Error)?.message || e)).slice(0, 200)))
    .finally(() => a.running.delete(job));
  a.running.add(job);
}

/** Для тестов: разобрать тело вебхука без HTTP. */
export function dzHookBody(body: unknown): void {
  const a = A;
  if (!a || !body || typeof body !== "object") return;
  const job = ingest(a, body as any)
    .catch(() => {})
    .finally(() => a.running.delete(job));
  a.running.add(job);
}

/** Для тестов: дождаться разбора всех принятых вебхуков. */
export async function dzFlush(): Promise<void> {
  const a = A;
  if (!a) return;
  for (let i = 0; i < 40 && a.running.size; i++) await Promise.allSettled([...a.running]);
}

async function ingest(a: Dz, body: any): Promise<void> {
  const st = a.host.state();
  // Выключен и вебхук не поставлен: ничего не трогаем.
  if (!st.enabled && !st.hookOn) return;
  if (body.templateStatus !== undefined && body.templateStatus !== null) onTemplateStatus(a, body.templateStatus);
  const msgs = Array.isArray(body.messages) ? body.messages : [];
  for (const m of msgs) await onMessage(a, m);
}

function onTemplateStatus(a: Dz, raw: unknown) {
  const list = Array.isArray(raw) ? raw : [raw];
  for (const t of list) {
    if (!t || typeof t !== "object") continue;
    const o = t as Record<string, any>;
    const guid = String(o.templateGuid ?? o.guid ?? o.templateId ?? o.id ?? "").slice(0, 80);
    const name = clipText(o.name ?? o.templateName ?? o.title ?? "", 120);
    const rawStatus = o.status ?? o.templateStatus ?? o.state;
    const status = clipText(typeof rawStatus === "string" ? rawStatus.toLowerCase() : rawStatus, 40);
    if (!guid && !name) continue;
    const key = `${guid || name}|${status}`;
    const fresh = !a.tplSeen.has(key);
    a.tplSeen.add(key);
    appendRow(a, { ts: a.host.now(), ev: "tpl_status", guid, name, status });
    a.host.journal({ ev: "dz_tpl", name, status });
    a.tpl = null;
    if (!fresh) continue;
    const main = /вступите в сообщество|vstupite_v_soobshchestvo/i.test(`${name} ${guid === a.host.state().templateId ? a.host.state().templateName : ""}`);
    if (!main) continue;
    if (/approv|одобр/i.test(status)) void a.host.notify(`Шаблон WABA «${name || "Вступите в сообщество"}» одобрен. Его можно выбрать в пульте WhatsApp, блок «Дожим WABA».`).catch(() => {});
    else if (/reject|отклон|disabled/i.test(status)) void a.host.notify(`Шаблон WABA «${name || "Вступите в сообщество"}» не прошёл модерацию (${status}). Дожим пока идёт запасным шаблоном.`).catch(() => {});
  }
}

async function onMessage(a: Dz, m: any): Promise<void> {
  if (!m || typeof m !== "object") return;
  if (m.isEcho !== false || m.chatType !== "whatsapp") return;
  const ch = wz.wzChannel();
  if (ch && m.channelId && String(m.channelId) !== ch) return;
  const chat = digitsOf(String(m.chatId ?? ""));
  if (!chat) return;
  const h = a.host;
  const now = h.now();
  const info = a.chats.get(chat);
  // Чужая переписка (менеджер Аяна и все, кому мы шаблон не слали): не трогаем вообще, даже не записываем.
  if (!info || now - info.sentAt > REPLY_WINDOW) return;
  const mid = String(m.messageId ?? "").slice(0, 100) || createHash("sha1").update(`${chat}|${m.dateTime ?? ""}|${m.text ?? ""}`).digest("hex");
  if (a.seenMid.has(mid)) return;
  a.seenMid.add(mid);
  if (a.seenMid.size > 8000) a.seenMid.delete(a.seenMid.values().next().value as string);
  appendRow(a, { ts: now, ev: "in", mid, chat });
  info.replyAt = now;
  if (a.declined.has(chat)) return;
  const body = typeof m.text === "string" ? m.text : typeof m.content === "string" ? m.content : "";
  if (isDecline(body)) {
    a.declined.add(chat);
    appendRow(a, { ts: now, ev: "decline", chat });
    await replyOnce(a, { chat, kind: "decline", tries: 0, nextAt: 0 });
    return;
  }
  if (info.linkAt) return;
  await replyOnce(a, { chat, kind: "link", tries: 0, nextAt: 0 });
}

/** Ссылка на сообщество дня D: ссылка сообщества этого дня, а если его нет, постоянный /wa (сам переадресует). */
function linkTextFor(a: Dz, info: Chat): string {
  const now = a.host.now();
  const url = a.host.linkFor(info.day, now) ?? a.host.waUrl;
  return LINK_TEXT(url);
}

/** Одна попытка ответа. Не вышло по 429 или 5xx: повтор через минуту, не больше двух раз; остальное в журнал и тревога. */
async function replyOnce(a: Dz, rp: Reply): Promise<void> {
  const key = `${rp.kind}:${rp.chat}`;
  if (a.busy.has(key)) return;
  a.busy.add(key);
  try {
    await replyNow(a, rp);
  } finally {
    a.busy.delete(key);
  }
}

async function replyNow(a: Dz, rp: Reply): Promise<void> {
  const h = a.host;
  const info = a.chats.get(rp.chat);
  if (!info) return;
  if (rp.kind === "link" && info.linkAt) return;
  const body = rp.kind === "link" ? linkTextFor(a, info) : DECLINE_TEXT;
  // Один и тот же идентификатор на все попытки: если первая дошла, но ответ потерялся, Wazzup отвергнет повтор и второго сообщения не будет.
  const crm = `dozhim-${rp.kind}-${info.eid}`;
  const r = await wz.wzSend({ chatId: rp.chat, text: body, crmMessageId: crm });
  const now = h.now();
  if (r.ok || wz.isRepeatedCrmId(r)) {
    if (rp.kind === "link") info.linkAt = now;
    appendRow(a, { ts: now, ev: rp.kind === "link" ? "link" : "decline_sent", ok: true, chat: rp.chat, day: info.day, mid: r.ok ? r.data.messageId : "" });
    log("%s ушло: %s", rp.kind === "link" ? "ссылка" : "отказ принят", maskDigits(rp.chat));
    return;
  }
  appendRow(a, { ts: now, ev: rp.kind === "link" ? "link" : "decline_sent", ok: false, chat: rp.chat, status: r.status, err: clipText(scrub(r.error), 160), attempt: rp.tries + 1 });
  log("ответ не ушёл (%s): %s", maskDigits(rp.chat), scrub(r.error));
  if (r.retryable && rp.tries < 2 && rp.kind === "link") {
    a.replies.push({ ...rp, tries: rp.tries + 1, nextAt: now + MIN });
    return;
  }
  await alarmOnce(a, `reply:${r.status}`, HOUR, `Дожим WABA: ответ человеку ${maskDigits(rp.chat)} не отправился (${clipText(scrub(r.error), 120)}). Ссылку он не получил.`);
}

async function runReplies(a: Dz): Promise<void> {
  if (!a.replies.length) return;
  const now = a.host.now();
  const due = a.replies.filter((r) => r.nextAt <= now);
  a.replies = a.replies.filter((r) => r.nextAt > now);
  for (const rp of due) await replyOnce(a, rp);
}

// ───────────────────────── вебхук Wazzup: установка ─────────────────────────

const SUBS_ON = { messagesAndStatuses: true, contactsAndDealsCreation: false, channelsUpdates: false, templateStatus: true };
const SUBS_OFF = { messagesAndStatuses: false, contactsAndDealsCreation: false, channelsUpdates: false, templateStatus: false };

/** Тот же ли это вебхук: сравниваем адрес без секрета и параметров. */
function sameHook(current: string): boolean {
  try {
    const x = new URL(current);
    const y = new URL(hookBase());
    return x.origin === y.origin && x.pathname.replace(/\/+$/, "") === y.pathname.replace(/\/+$/, "");
  } catch {
    return false;
  }
}

/** Наш адрес без секрета: хост и путь. */
const hostOf = (u: string) => {
  try {
    const x = new URL(u);
    return `${x.origin}${x.pathname}`;
  } catch {
    return "адрес не разобран";
  }
};
/** Чужой адрес показываем только до хоста: в пути и параметрах бывают токены. */
const originOf = (u: string) => {
  try {
    return new URL(u).origin;
  } catch {
    return "адрес не разобран";
  }
};

/**
 * Поставить или снять вебхук Wazzup. Сначала GET: стоит чужой адрес, не перезаписываем и не снимаем, владельцам тревога.
 * Секрет в адресе нигде не показывается.
 */
export async function dzHookSet(on: unknown): Promise<DzAct> {
  const a = A;
  if (!a) return MODULE_OFF;
  if (typeof on !== "boolean") return fail("bad_request", "Нужно true или false.");
  if (!wz.wzKey()) return fail("no_key", "Нет WAZZUP_API_KEY в .env на сервере.");
  if (a.hookBusy) return fail("busy", "Предыдущая операция с вебхуком ещё идёт, подожди несколько секунд.");
  a.hookBusy = true;
  try {
    const cur = await wz.wzGetHooks();
    if (!cur.ok) return fail("wazzup", `Не удалось узнать, какой вебхук стоит в Wazzup: ${clipText(scrub(cur.error), 120)}. Ничего не менял.`);
    const uri = cur.data.webhooksUri.trim();
    if (on) {
      if (uri && !sameHook(uri)) {
        await a.host.alarm(`Дожим WABA: в Wazzup уже стоит чужой вебхук (${originOf(uri)}). Свой не поставил, чтобы не сломать чужое. Реши, нужен ли он, и сними вручную в Wazzup.`);
        return fail("foreign_hook", `В Wazzup уже стоит чужой вебхук (${originOf(uri)}). Я его не трогаю. Свой не поставлен.`);
      }
      const secret = ensureSecret(a);
      const r = await wz.wzSetHooks({ webhooksUri: hookUri(secret), subscriptions: SUBS_ON });
      if (!r.ok) return fail("wazzup", `Wazzup не принял вебхук: ${clipText(scrub(r.error), 140)}. Он проверяет адрес тестовым запросом: адрес должен отвечать снаружи.`);
      a.host.patch({ hookOn: true });
      a.host.journal({ ev: "dz_hook", on: true });
      log("вебхук Wazzup поставлен");
      return { ok: true, message: `Вебхук Wazzup поставлен (${hostShown()}). Ответы людей на шаблон будут получать ссылку.` };
    }
    if (uri && !sameHook(uri)) return fail("foreign_hook", `В Wazzup стоит чужой вебхук (${originOf(uri)}), не наш. Я его не снимаю.`);
    if (uri) {
      let r = await wz.wzSetHooks({ webhooksUri: "", subscriptions: SUBS_OFF });
      // Если пустой адрес не принят, снимаем подписки: события приходить перестанут.
      if (!r.ok && r.status >= 400 && r.status < 500) r = await wz.wzSetHooks({ webhooksUri: uri, subscriptions: SUBS_OFF });
      if (!r.ok) return fail("wazzup", `Wazzup не снял вебхук: ${clipText(scrub(r.error), 140)}.`);
    }
    a.host.patch({ hookOn: false });
    a.host.journal({ ev: "dz_hook", on: false });
    log("вебхук Wazzup снят");
    return { ok: true, message: "Вебхук Wazzup снят. Ответы людей на шаблон больше не обрабатываются." };
  } finally {
    a.hookBusy = false;
  }
}

const hostShown = () => hostOf(hookShown());

/** Раз в 3 часа проверяем, что вебхук Wazzup всё ещё наш: иначе ответы людей молча перестали бы приходить. */
async function hookCheck(a: Dz): Promise<void> {
  const now = a.host.now();
  if (now - a.hookCheckAt < 3 * HOUR || a.hookBusy) return;
  a.hookCheckAt = now;
  const cur = await wz.wzGetHooks();
  if (!cur.ok) return;
  const uri = cur.data.webhooksUri.trim();
  if (uri && sameHook(uri) && cur.data.subscriptions.messagesAndStatuses !== false) return;
  await alarmOnce(a, "hookgone", 6 * HOUR, `Дожим WABA: вебхук Wazzup ${uri ? `теперь чужой (${originOf(uri)})` : "пропал"}. Ответы людей на шаблон не приходят. Поставь его заново в пульте, блок «Дожим WABA».`);
}

// ───────────────────────── шаблоны Wazzup ─────────────────────────

export type TemplateItem = wz.WzTemplate & { map: VarSrc[] };
type TplRes = DzAct & { items: TemplateItem[]; total: number; at: number; cached: boolean; note: string };

const TPL_CACHE_MS = 60_000;
const TPL_MIN_GAP_MS = 5_000;

async function loadTemplates(a: Dz, force: boolean): Promise<{ ok: true; items: wz.WzTemplate[]; at: number; cached: boolean } | { ok: false; message: string; code: string }> {
  const now = a.host.now();
  if (a.tpl && (!force || now - a.tpl.callAt < TPL_MIN_GAP_MS) && now - a.tpl.at < TPL_CACHE_MS) return { ok: true, items: a.tpl.items, at: a.tpl.at, cached: true };
  if (!wz.wzKey()) return { ok: false, code: "no_key", message: "Нет WAZZUP_API_KEY в .env на сервере." };
  const r = await wz.wzTemplates();
  if (!r.ok) {
    const stale = a.tpl && now - a.tpl.at < 10 * MIN;
    if (stale) return { ok: true, items: a.tpl!.items, at: a.tpl!.at, cached: true };
    return { ok: false, code: "wazzup", message: `Не удалось получить шаблоны Wazzup: ${clipText(scrub(r.error), 120)}.` };
  }
  a.tpl = { at: now, callAt: now, items: r.data };
  return { ok: true, items: r.data, at: now, cached: false };
}

/** Одобренные шаблоны для выбора в пульте. Статус не определился ни у одного: показываем все с пометкой. */
export async function dzTemplates(force = false): Promise<TplRes | DzAct> {
  const a = A;
  if (!a) return MODULE_OFF;
  const t = await loadTemplates(a, force);
  if (!t.ok) return fail(t.code, t.message);
  let list = t.items.filter((x) => x.approved === true);
  let note = "";
  if (!list.length) {
    const unknown = t.items.filter((x) => x.approved === null);
    if (unknown.length) {
      list = unknown;
      note = "Wazzup не отдал статус шаблонов, показываю все. Выбирай только одобренные.";
    } else if (t.items.length) note = "Одобренных шаблонов пока нет.";
    else note = "В Wazzup нет шаблонов WABA.";
  }
  const st = a.host.state();
  const items = list.map((x) => ({ ...x, map: x.id === st.templateId ? currentMap(a) : st.maps[x.id] ?? defaultMap(x.name, x.title, x.vars) }));
  return { ok: true, message: note, items, total: t.items.length, at: t.at, cached: t.cached, note };
}

// ───────────────────────── пульт: действия ─────────────────────────

const MODULE_OFF = fail("module_off", "Модуль WhatsApp не запущен: на сервере нет WA_GROUPS=on или он не стартовал (см. /api/health).");

/**
 * Сохранить настройки: шаблон (из одобренных), задержка, окно часов, лимит, соответствие переменных. Всё проверяется, ошибка
 * ничего не меняет. Менять можно и при включённом дожиме: новые значения действуют со следующей отправки.
 */
export async function dzSave(p: unknown): Promise<DzAct> {
  const a = A;
  if (!a) return MODULE_OFF;
  if (!p || typeof p !== "object" || Array.isArray(p)) return fail("bad_request", "Не удалось прочитать настройки.");
  const q = p as Record<string, any>;
  const st = a.host.state();
  const next: Partial<DzState> = {};
  if (q.delayMin !== undefined) {
    const n = Number(q.delayMin);
    if (!Number.isInteger(n) || n < 0 || n > 1440) return fail("bad_request", "Задержка: целое число минут от 0 до 1440.");
    next.delayMin = n;
  }
  if (q.from !== undefined || q.to !== undefined) {
    const from = q.from === undefined ? st.from : q.from;
    const to = q.to === undefined ? st.to : q.to;
    if (!validHHMM(from) || !validHHMM(to) || minsOf(from) >= minsOf(to)) return fail("bad_request", "Окно часов: время вида 09:00, начало раньше конца.");
    next.from = padHHMM(from);
    next.to = padHHMM(to);
  }
  if (q.cutoff !== undefined) {
    if (!validHHMM(q.cutoff)) return fail("bad_request", "Предел в день эфира: время вида 19:30.");
    next.cutoff = padHHMM(q.cutoff);
  }
  if (q.dailyLimit !== undefined) {
    const n = Number(q.dailyLimit);
    if (!Number.isInteger(n) || n < 1 || n > 250) return fail("bad_request", "Лимит в сутки: целое число от 1 до 250 (предел Meta 250 новых переписок).");
    next.dailyLimit = n;
  }
  const maps = { ...st.maps };
  const tid = typeof q.templateId === "string" && q.templateId ? q.templateId : q.map !== undefined ? st.templateId : "";
  if (tid && (tid !== st.templateId || q.map !== undefined)) {
    let t = await loadTemplates(a, false);
    if (!t.ok) return fail(t.code, t.message);
    let tpl = t.items.find((x) => x.id === tid);
    // Шаблон только что одобрили, а список в кэше старый: один раз спрашиваем Wazzup заново, прежде чем отказать.
    if (!tpl || tpl.approved === false) {
      const fresh = await loadTemplates(a, true);
      if (fresh.ok) {
        t = fresh;
        tpl = t.items.find((x) => x.id === tid);
      }
    }
    if (!tpl) return fail("not_found", "Такого шаблона нет в Wazzup. Обнови список шаблонов.");
    if (tpl.approved === false) return fail("not_approved", `Шаблон «${tpl.title || tpl.name}» ещё не одобрен (${tpl.status || "статус неизвестен"}). Выбери одобренный.`);
    let map: VarSrc[] | null;
    if (q.map !== undefined) {
      map = cleanMap(q.map);
      if (!map) return fail("bad_request", "Соответствие переменных не разобрано.");
    } else map = maps[tpl.id] ?? defaultMap(tpl.name, tpl.title, tpl.vars);
    if (tpl.vars !== null && map.length !== tpl.vars) return fail("bad_request", `В шаблоне ${tpl.vars} переменных, а настроено ${map.length}.`);
    for (let i = 0; i < map.length; i++) if (map[i].kind === "text" && !(map[i].text || "").trim()) return fail("bad_request", `Заполни текст для переменной {{${i + 1}}}.`);
    maps[tpl.id] = map;
    next.maps = maps;
    next.templateId = tpl.id;
    next.templateName = tpl.title || tpl.name;
    next.vars = tpl.vars ?? map.length;
  }
  if (!Object.keys(next).length) return { ok: true, code: "same", message: "Нечего сохранять." };
  a.host.patch(next);
  a.host.journal({ ev: "dz_save", template: next.templateName ?? st.templateName });
  return { ok: true, message: "Настройки дожима сохранены." };
}

/** Включить или выключить. Включение: ключи Wazzup и Evolution, выбранный шаблон, заполненные переменные. Выключенный ничего не делает. */
export async function dzSetEnabled(on: unknown): Promise<DzAct> {
  const a = A;
  if (!a) return MODULE_OFF;
  if (typeof on !== "boolean") return fail("bad_request", "Нужно true или false.");
  if (a.toggling) return fail("busy", "Предыдущее переключение ещё идёт, подожди несколько секунд.");
  a.toggling = true;
  try {
    const st = a.host.state();
    if (on) {
      if (st.enabled) return { ok: true, code: "same", message: "Дожим уже включён." };
      const pre = prerequisites(a);
      if (!pre.ok) return fail("no_config", `${pre.reason} Дожим не включён.`);
      a.host.patch({ enabled: true });
      a.host.journal({ ev: "dz_on", by: "panel" });
      log("включён");
      return { ok: true, message: `Дожим включён. Шаблон «${st.templateName}» уходит тем, кто записался на воркшоп с номером Казахстана и не вступил в сообщество: через ${st.delayMin} минут после заявки, с ${st.from} до ${st.to} по Алматы.${st.hookOn ? "" : " Вебхук не поставлен: ответы людей ссылку не получат, нажми «Поставить вебхук»."}` };
    }
    if (!st.enabled) return { ok: true, code: "same", message: "Дожим уже выключен." };
    a.host.patch({ enabled: false });
    a.host.journal({ ev: "dz_off", by: "panel" });
    log("выключен");
    return { ok: true, message: "Дожим выключен: новые шаблоны не отправляются." };
  } finally {
    a.toggling = false;
  }
}

/**
 * Тестовая отправка выбранного шаблона на указанный номер. Только по подтверждению в пульте или командой владельца. Окно часов,
 * задержка и проверка участников не действуют, суточный лимит действует. Ответ на кнопку получит ссылку, как у настоящей заявки.
 */
export async function dzTestSend(numberRaw: unknown, nowArg?: number): Promise<DzAct> {
  const a = A;
  if (!a) return MODULE_OFF;
  const ph = normalizePhone(numberRaw);
  if (!ph || ph.digits.length < 10) return fail("bad_number", "Номер: только цифры, с кодом страны, например 77011234567.");
  const pre = prerequisites(a);
  if (!pre.ok) return fail("no_config", pre.reason);
  const now = nowArg ?? a.host.now();
  a.testAt = a.testAt.filter((t) => now - t < HOUR);
  if (a.testAt.length && now - a.testAt[a.testAt.length - 1] < 10_000) return fail("rate", "Слишком часто, подожди 10 секунд.");
  if (a.testAt.length >= 10) return fail("rate", "Тестов за час уже 10. Подожди.");
  const st = a.host.state();
  if (sends24(a, now) >= st.dailyLimit) return fail("limit", `За сутки уже ${st.dailyLimit} шаблонов, это предел защиты номера.`);
  a.testAt.push(now);
  const day = a.host.dayOf(now);
  const src = a.host.leads();
  const lead = src.leads ? [...src.leads].reverse().find((l) => normalizePhone(l.phone)?.digits === ph.digits) ?? null : null;
  // Имя профиля у Evolution в тесте не запрашиваем: тест не должен зависеть от подключения номера.
  const nm = await resolveName(a, lead, ph.digits, false);
  const values = buildValues(currentMap(a), { name: nm.name, day, now, link: a.host.waUrl });
  if (!values) return fail("no_config", "Не удалось собрать значения переменных: проверь соответствие в пульте.");
  const eid = `test-${now}`;
  const res = await sendTemplate(a, ph.digits, values, `dozhim-${eid}`);
  if (!res.ok) {
    appendRow(a, { ts: a.host.now(), ev: "send_fail", to: ph.digits, eid, day, tpl: st.templateId, status: res.status, err: clipText(res.error, 160), retryable: res.retryable, attempt: 1, final: true, test: true });
    return fail("wazzup", `Wazzup не принял тестовое сообщение: ${clipText(res.error, 140)}.`);
  }
  recordSent(a, { to: ph.digits, eid, day, mid: res.mid, test: true, name: nm.name, from: nm.from, dup: res.dup });
  log("тестовый шаблон ушёл: %s", maskDigits(ph.digits));
  return { ok: true, message: `Тестовый шаблон «${st.templateName}» отправлен на ${maskDigits(ph.digits)}. Нажми в нём кнопку: придёт ссылка на сообщество эфира ${dateLabel(day)}.` };
}

// ───────────────────────── пульт: данные ─────────────────────────

const ddmm = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
const stamp = (ms: number) => `${ddmm(dayKeyOf(ms))} ${hhmmOf(ms)}`;
const agoText = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 90 ? `${s} с назад` : s < 5400 ? `${Math.round(s / 60)} мин назад` : `${Math.round(s / 3600)} ч назад`;
};

type Recent = { t: string; who: string; day: string; dayLabel: string; status: string; tone: "ok" | "wait" | "bad" | "mute"; test: boolean };

/** Блок «Дожим WABA» для пульта. Номера закрыты, полных нет. */
export function dzPanel(nowArg?: number): Record<string, unknown> {
  const a = A;
  if (!a) return { available: false };
  const h = a.host;
  const now = nowArg ?? h.now();
  const st = h.state();
  const pre = prerequisites(a);
  let reason = "";
  if (!pre.ok) reason = pre.reason;
  else if (st.enabled) {
    const can = h.canRun();
    if (!can.ok) reason = `Сейчас не отправляет: ${can.why}.`;
    else if (now < a.haltUntil) reason = "Отправки на паузе после ошибок Wazzup (после сбоя 5 минут, после трёх отказов час). Проверь шаблон, канал и ключ.";
  }
  const ev = evaluate(a, now);
  if (ev.error) reason = reason || `Заявки недоступны: ${ev.error}.`;
  if (!reason && st.enabled && ev.noTarget.length) reason = `Нет готового сообщества с замером на ${ev.noTarget.map(ddmm).join(", ")}: заявки на эти дни ждут, шаблон им не уйдёт.`;
  if (!reason && st.enabled && !st.hookOn) reason = "Вебхук Wazzup не поставлен: ответы людей на шаблон не обрабатываются, ссылку они не получат. Нажми «Поставить вебхук».";
  const today = dayKeyOf(now);
  const todayRows = a.rows.filter((r) => dayKeyOf(r.ts) === today);
  const realSends = todayRows.filter((r) => r.ev === "send" && r.ok === true && r.test !== true);
  const toNumber = (r: Row) => String(r.to || "");
  const days = ev.days.map((d) => ({ day: d.day, dayLabel: ddmm(d.day), applied: d.applied, joined: d.joined, measured: d.measuredAt ? agoText(now - d.measuredAt) : "", unresolved: d.unresolved }));
  const targets = h.targets(now);
  let joinedAfter = 0;
  for (const r of realSends) {
    const mem = membersOfDay(a, String(r.day), targets, now, false);
    if (mem?.has(toNumber(r))) joinedAfter++;
  }
  const inToday = new Set(todayRows.filter((r) => r.ev === "in").map((r) => String(r.chat)));
  const sendRows = a.rows.filter((r) => r.ev === "send" || r.ev === "send_fail");
  const recent: Recent[] = sendRows
    .slice(-30)
    .reverse()
    .map((r): Recent => {
      const to = toNumber(r);
      const day = String(r.day || "");
      const base = { t: stamp(r.ts), who: maskDigits(to), day, dayLabel: day ? ddmm(day) : "", test: r.test === true };
      if (r.ev === "send_fail") {
        const final = r.final === true;
        return { ...base, status: final ? `ошибка: ${clipText(r.err, 60)}` : `ошибка, повтор через 5 минут (${clipText(r.err, 40)})`, tone: final ? "bad" : "wait" };
      }
      const c = a.chats.get(to);
      const mine = c && c.sentAt === r.ts;
      const joined = day ? membersOfDay(a, day, targets, now, false)?.has(to) : false;
      if (mine && a.declined.has(to)) return { ...base, status: "отказался", tone: "mute" };
      if (joined) return { ...base, status: "вступил", tone: "ok" };
      if (mine && c!.linkAt) return { ...base, status: "получил ссылку", tone: "ok" };
      if (mine && c!.replyAt) return { ...base, status: "ответил", tone: "ok" };
      return { ...base, status: "отправлено", tone: "wait" };
    });
  const map = currentMap(a);
  const waitingTotal = ev.waiting;
  return {
    available: true,
    enabled: st.enabled,
    canEnable: pre.ok,
    reason,
    configured: { key: !!wz.wzKey(), channel: !!wz.wzChannel() },
    template: { id: st.templateId, name: st.templateName, vars: st.vars },
    settings: { delayMin: st.delayMin, from: st.from, to: st.to, cutoff: st.cutoff, dailyLimit: st.dailyLimit },
    map,
    mapProblem: mapProblem(a),
    webhook: { on: st.hookOn, url: hostShown(), secretInEnv: !!env("WAZZUP_HOOK_SECRET") },
    counters: {
      candidates: realSends.length + waitingTotal,
      waiting: waitingTotal,
      waitingMeasure: ev.needMeasure,
      sent: realSends.length,
      replied: inToday.size,
      links: todayRows.filter((r) => r.ev === "link" && r.ok === true).length,
      joinedAfter,
      declined: todayRows.filter((r) => r.ev === "decline").length,
      failed: todayRows.filter((r) => r.ev === "send_fail" && r.final === true).length,
    },
    limit: { used: sends24(a, now), max: st.dailyLimit },
    days,
    recent,
    lastTick: a.lastTickAt ? agoText(now - a.lastTickAt) : "",
    halted: now < a.haltUntil,
  };
}

/** Команды владельца: /wa_dozhim [on|off] и /wa_dozhim_test <номер>. */
export async function dzCommand(cmd: string, args: string): Promise<string> {
  if (!A) return MODULE_OFF.message;
  if (cmd === "wa_dozhim_test") {
    const r = await dzTestSend(args);
    return r.message;
  }
  const arg = args.trim().toLowerCase();
  if (arg === "on" || arg === "off") return (await dzSetEnabled(arg === "on")).message;
  // Настройки без пульта: /wa_dozhim hook on|off, /wa_dozhim tpls, /wa_dozhim tpl <часть названия>, /wa_dozhim set to=19:30 limit=90 delay=30 cutoff=19:30
  const [sub, ...restParts] = args.trim().split(/\s+/);
  const rest = restParts.join(" ").trim();
  const subL = (sub || "").toLowerCase();
  if (subL === "hook" && (rest === "on" || rest === "off")) return (await dzHookSet(rest === "on")).message;
  if (subL === "tpls" || subL === "tpl") {
    const r = (await dzTemplates(true)) as any;
    if (!r.ok) return r.message;
    const items: Array<{ id: string; title: string; name: string; vars: number | null }> = r.items;
    if (subL === "tpls" || !rest) return [r.note || "Одобренные шаблоны:", ...items.map((x) => `• ${x.title || x.name} (${x.vars ?? "?"} перем.)`)].join("\n");
    const q = rest.toLowerCase();
    const hit = items.filter((x) => `${x.title} ${x.name}`.toLowerCase().includes(q));
    if (hit.length !== 1) return hit.length ? `Подходит несколько: ${hit.map((x) => x.title || x.name).join(", ")}. Уточни.` : "Такого одобренного шаблона нет. Список: /wa_dozhim tpls";
    return (await dzSave({ templateId: hit[0].id })).message;
  }
  if (subL === "set" && rest) {
    const kv: Record<string, string> = {};
    for (const part of rest.split(/\s+/)) {
      const m = part.match(/^(to|from|cutoff|limit|delay)=(.+)$/i);
      if (!m) return `Не понял «${part}». Пример: /wa_dozhim set to=19:30 limit=90 delay=30 cutoff=19:30`;
      kv[m[1].toLowerCase()] = m[2];
    }
    const p: Record<string, unknown> = {};
    if (kv.from) p.from = kv.from;
    if (kv.to) p.to = kv.to;
    if (kv.cutoff) p.cutoff = kv.cutoff;
    if (kv.limit) p.dailyLimit = Number(kv.limit);
    if (kv.delay) p.delayMin = Number(kv.delay);
    return (await dzSave(p)).message;
  }
  const p = dzPanel() as any;
  const c = p.counters;
  return [
    `Дожим WABA: ${p.enabled ? "включён" : "выключен"}${p.reason ? `. ${p.reason}` : ""}`,
    `Шаблон: ${p.template.name || "не выбран"}. Вебхук Wazzup: ${p.webhook.on ? "стоит" : "не стоит"}.`,
    `Сегодня: кандидатов ${c.candidates}, отправлено ${c.sent}, ответили ${c.replied}, получили ссылку ${c.links}, вступили после дожима ${c.joinedAfter}.`,
    "Включить: /wa_dozhim on, выключить: /wa_dozhim off, тест на свой номер: /wa_dozhim_test 77011234567",
    "Настройки: /wa_dozhim tpls, /wa_dozhim tpl <часть названия>, /wa_dozhim set to=19:30 limit=90 delay=30, /wa_dozhim hook on|off",
  ].join("\n");
}
