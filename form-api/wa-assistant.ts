/**
 * ИИ-ассистент на номере WhatsApp сообществ воркшопа (docs/tasks/wa_assistant.md).
 *
 * Что делает: отвечает людям в личке от имени ассистента Александра. Первым не пишет никогда. Группы, сообщества, рассылки,
 * статусы, свои сообщения, реакции и системные события игнорирует.
 *
 *   вебхук Evolution MESSAGES_UPSERT -> POST /api/wa-hook (только 127.0.0.1 и общий секрет в заголовке X-Wa-Hook-Secret)
 *   -> пачка сообщений человека ждёт 8 секунд тишины -> модель OpenAI (gpt-5.6-luna) -> проверка ответа -> пауза 2-5 с и
 *   «печатает…» (параметр delay у sendText) -> один ответ на всю пачку.
 *
 * Защита номера: не больше 30 ответов человеку и 400 ответов номеру в сутки (по Алматы), сверх лимита молчим и шлём владельцам
 * одну тревогу. Ответ с ценой, чужой ссылкой, номером телефона или кейсом не уходит: второй запрос модели с замечанием,
 * потом безопасная заготовка. Передача менеджеру (метка [[МЕНЕДЖЕР: …]] в ответе модели или контакт менеджера в тексте): ассистент молчит
 * с этим человеком 12 часов, владельцам уходит тревога с кратким пересказом.
 *
 * Данные: DATA_DIR/wa-assistant.jsonl (только текст, последние 16 сообщений на человека). Выключатель, секрет вебхука и
 * признак «вебхук стоит» лежат в wa-state.json (блок assistant, пишет wa-groups). В журнал модуля и в логи номера идут только
 * маскированными (7708***4575). Ключ OPENAI_API_KEY нигде не печатается. Выключенный ассистент не ставит вебхук и не ходит в OpenAI.
 *
 * С wa-groups.ts связь односторонняя: он передаёт сюда «хозяина» (AiHost) с часами, очередью запросов к Evolution и состоянием,
 * а этот файл сам wa-groups не импортирует.
 */
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, writeFileSync } from "node:fs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import * as evo from "./wa-evolution";
import { dayKeyOf, hhmmOf } from "./tg-time";

const env = (k: string) => (process.env[k] || "").trim();

// ───────────────────────── настройки ─────────────────────────

const MIN = 60_000;
const HOUR = 3600_000;
const DAY = 24 * HOUR;
/** Последних сообщений на человека в истории. */
export const HISTORY = 16;
/** Ответов одному человеку в сутки. */
export const LIMIT_PERSON = 30;
/** Ответов номеру в сутки. */
export const LIMIT_TOTAL = 400;
/** После передачи менеджеру молчим с человеком столько. */
export const SILENCE_MS = 12 * HOUR;
/** Тишина после последнего сообщения пачки. Александр 09.10.2026: «случайная задержка около десяти секунд», за неё
 * два-три сообщения человека склеиваются в один ответ. Середина 10 с, разброс ниже. */
const quietMs = () => {
  const n = Number(env("WA_AI_QUIET_MS"));
  return Number.isFinite(n) && n >= 0 && env("WA_AI_QUIET_MS") !== "" ? n : 10_000;
};
/** Разброс тишины в обе стороны: WA_AI_QUIET_JITTER_MS, по умолчанию 20% тишины (при 10 с окно 8–12 с). */
const jitterMs = () => {
  const n = Number(env("WA_AI_QUIET_JITTER_MS"));
  return Number.isFinite(n) && n >= 0 && env("WA_AI_QUIET_JITTER_MS") !== "" ? n : Math.round(quietMs() * 0.2);
};
/** Тишина с разбросом для одной пачки: новое случайное значение на каждое сообщение, не меньше нуля. */
export function quietWithJitter(rand: () => number = Math.random): number {
  return Math.max(0, quietMs() + Math.round((rand() * 2 - 1) * jitterMs()));
}
const timeoutMs = () => {
  const n = Number(env("WA_AI_TIMEOUT_MS"));
  return Number.isFinite(n) && n > 0 ? n : 30_000;
};
/** Входящее старше этого срока (догрузка истории после переподключения) не считается: старым сообщениям не отвечаем. */
const STALE_MS = 15 * MIN;
/** Пауза перед ответом, мс. */
const PAUSE_MS: [number, number] = [2000, 5000];
const MAX_TEXT = 1500;
/** Сколько файла переписки читаем при старте и во что сжимаем, когда он раздулся. */
const FILE_TAIL_BYTES = 3 * 1024 * 1024;
const FILE_COMPACT_BYTES = 6 * 1024 * 1024;
const MODEL = () => env("WA_AI_MODEL") || "gpt-5.6-luna";
const openaiBase = () => (env("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/+$/, "");
const apiKey = () => env("OPENAI_API_KEY");
const promptDir = () => env("WA_AI_DIR") || join(__dirname, "wa-assistant");
/** Куда Evolution шлёт вебхук. Порт тот же, что у form-api. */
export const hookUrl = () => env("WA_HOOK_URL") || `http://127.0.0.1:${env("PORT") || "4010"}/api/wa-hook`;

export const SAFE_FALLBACK = "Подскажет менеджер школы: https://onai.academy/workshop-montazh/chat";
export const MEDIA_PHRASE = "Напишите, пожалуйста, текстом.";

export type AiState = { enabled: boolean; hookOn: boolean; secret: string };
export type AiAct = { ok: boolean; code?: string; message: string };
const fail = (code: string, message: string): AiAct => ({ ok: false, code, message });

export type AiHost = {
  dir: string;
  now: () => number;
  rand: () => number;
  /** Тревога владельцам: строка в журнале модуля плюс Telegram. В тексте нет полных номеров. */
  alarm: (text: string) => Promise<void>;
  /** Сообщение владельцам в Telegram без записи в журнал (в нём бывает полный номер). */
  notify: (text: string) => Promise<unknown>;
  journal: (row: Record<string, unknown>) => void;
  /** Общая очередь запросов к Evolution: строго по одному. */
  exclusive: <T>(fn: () => Promise<T>) => Promise<T>;
  /** Можно ли сейчас слать: модуль не на паузе, номер подключён, данные держит этот процесс. */
  canSend: () => { ok: true } | { ok: false; why: string };
  state: () => AiState;
  patch: (p: Partial<AiState>) => void;
  /** Номера (цифры), которым не отвечаем: менеджер и сам номер ассистента. */
  ignoreDigits: () => string[];
};

// ───────────────────────── проверка ответа ─────────────────────────

/** Разрешённые адреса: хост и путь без схемы. После адреса допустимы только «/», «?» и «#». */
const ALLOWED_LINKS = ["onai.academy/workshop-montazh", "wa.me/77085834575", "t.me/futleid", "t.me/workshop_aiprod_bot"];
/** Разрешённые имена пользователей (@ник). Остальные в ответе не нужны: так ассистент не повторит чужое. */
const ALLOWED_HANDLES = new Set(["@futleid", "@workshop_aiprod_bot", "@saint4ai"]);
const AYANA_RE = /wa\.me\/77085834575|t\.me\/futleid|@futleid/i;

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'«»]+/giu;
const BARE_RE = /(?<![\p{L}\p{N}_@./-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?![\p{L}\p{N}-])(?:[/?#][^\s<>"'«»]*)?/giu;
const TIME_RE = /(?<!\d)\d{1,2}[:.]\d{2}(?!\d)/g;

function allowedLink(candidate: string): boolean {
  let s = candidate.trim().replace(/[.,;:!?)\]}»"'…]+$/u, "").toLowerCase();
  if (s.startsWith("http://")) return false;
  s = s.replace(/^https:\/\//, "").replace(/^www\./, "");
  if (/^[a-z][a-z0-9+.-]*:\/\//.test(s)) return false;
  return ALLOWED_LINKS.some((p) => s === p || s.startsWith(`${p}/`) || s.startsWith(`${p}?`) || s.startsWith(`${p}#`));
}

/** Слова про цену. Рядом с числом (в пределах 30 знаков) это называние цены. */
const PRICE_WORD = /(?<![\p{L}])(?:рассрочк\p{L}*|стоит|стоят|стоимост\p{L}*|цен(?:а|ы|у|е|ой)(?![\p{L}])|предоплат\p{L}*|бронь|брони|скидк\p{L}*|обойд\p{L}*|заплат\p{L}*)/giu;
const CURRENCY_AFTER = /\d\s*(?:[.,]\d+\s*)?(?:₸|\$|€|₽|тенге|тг(?![\p{L}])|usd|kzt|rub|руб|доллар|евро|сом(?![\p{L}])|сум(?![\p{L}])|тыс\p{L}*|млн|миллион\p{L}*|[kк](?![\p{L}]))/iu;
const CURRENCY_BEFORE = /(?:₸|\$|€|₽)\s*\d/u;
const BIG_NUMBER = /\d{1,3}(?:[\u00a0\u202f ]\d{3})+|\d{5,}/u;
const FORBIDDEN = /the\s*one\s*system|onesystem|erickson|эриксон|жумабае|аян[аеуыо]/iu;

export type Reason = "price" | "link" | "forbidden" | "phone" | "handle" | "long" | "empty";
export const REASON_TEXT: Record<Reason, string> = {
  price: "в ответе цена, сумма, рассрочка или условия оплаты с цифрами",
  link: "в ответе ссылка или адрес не из списка разрешённых",
  forbidden: "в ответе упомянуты клиенты школы или кейсы",
  phone: "в ответе номер телефона или длинное число",
  handle: "в ответе имя пользователя не из списка разрешённых",
  long: "ответ слишком длинный",
  empty: "ответ пустой",
};
/** Длиннее этого ответ не уходит (в промпте просим до 350, запас на живую речь). */
const MAX_REPLY = 600;

/** Проверка ответа перед отправкой. Пустой список значит «можно слать». */
export function checkReply(text: string): Reason[] {
  const out = new Set<Reason>();
  if (!text.trim()) return ["empty"];
  if (text.length > MAX_REPLY) out.add("long");
  if (FORBIDDEN.test(text)) out.add("forbidden");
  // Ссылки: разрешённые вырезаем, любая другая (с https:// или голый адрес) бракует ответ.
  let rest = text;
  const judge = (m: string) => {
    if (!allowedLink(m)) out.add("link");
    return " ";
  };
  rest = rest.replace(URL_RE, judge).replace(BARE_RE, judge);
  if (/(?<![\p{L}])(?:mailto|tel|sms|javascript|data|ftp|file):/iu.test(rest) || /(?<!\d)\d{1,3}(?:\.\d{1,3}){3}(?!\d)/.test(rest)) out.add("link");
  for (const h of rest.match(/@[A-Za-z0-9_]{3,}/g) || []) if (!ALLOWED_HANDLES.has(h.toLowerCase())) out.add("handle");
  // Цифры: время (20:00) не считаем.
  const plain = rest.replace(TIME_RE, " ");
  for (const m of plain.match(/\+?\d[\d\s().-]{7,}\d/g) || []) if (m.replace(/\D/g, "").length >= 9) out.add("phone");
  if (CURRENCY_AFTER.test(plain) || CURRENCY_BEFORE.test(plain) || BIG_NUMBER.test(plain)) out.add("price");
  for (const m of plain.matchAll(PRICE_WORD)) {
    const i = m.index ?? 0;
    if (/\d/.test(plain.slice(Math.max(0, i - 30), i + m[0].length + 30))) {
      out.add("price");
      break;
    }
  }
  return [...out];
}

const EMOJI = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu;

export type Cleaned = { text: string; mark: boolean; summary: string };

/**
 * Привести ответ модели к виду для WhatsApp: убрать служебную метку передачи [[МЕНЕДЖЕР: суть]], разметку, длинные тире,
 * лишние эмодзи (остаётся первый). Метка нужна коду, человек её не видит.
 */
export function cleanReply(raw: string): Cleaned {
  let mark = false;
  let summary = "";
  const take = (_m: string, inner: string) => {
    const x = /^\s*(?:МЕНЕДЖЕР|АЯНА|ПЕРЕДАНО МЕНЕДЖЕРУ|ПЕРЕДАНО АЯНЕ)\s*:?\s*([\s\S]*)$/iu.exec(inner);
    if (x) {
      mark = true;
      summary = x[1].trim();
    }
    return "";
  };
  let t = raw.replace(/\[\[([^\]]*)\]\]/g, take).replace(/\[\s*(МЕНЕДЖЕР|АЯНА|ПЕРЕДАНО МЕНЕДЖЕРУ|ПЕРЕДАНО АЯНЕ)\s*:([^\]]*)\]/giu, (_m, _a, s: string) => {
    mark = true;
    summary = summary || s.trim();
    return "";
  });
  t = t
    .replace(/\s+[\u2014\u2013]\s+/g, ", ")
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, "$1$2")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/`+/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "");
  let seen = 0;
  t = t.replace(EMOJI, (m) => (++seen === 1 ? m : ""));
  t = t.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text: t, mark, summary };
}

// ───────────────────────── разбор входящего ─────────────────────────

export type Incoming = { jid: string; mid: string; kind: "text" | "media"; text: string; ts: number };

/** JID человека в личке: цифры@s.whatsapp.net или цифры@lid. Группы, рассылки, статусы и прочее дают null. */
export function personJid(remoteJid: unknown): string | null {
  const m = /^(\d{5,20})(?::\d+)?@(s\.whatsapp\.net|lid)$/.exec(String(remoteJid || ""));
  return m ? `${m[1]}@${m[2]}` : null;
}

function unwrap(m: any): any {
  let cur = m;
  for (let i = 0; i < 4 && cur && typeof cur === "object"; i++) {
    const inner = cur.ephemeralMessage?.message ?? cur.viewOnceMessage?.message ?? cur.viewOnceMessageV2?.message ?? cur.documentWithCaptionMessage?.message ?? cur.editedMessage?.message;
    if (!inner) break;
    cur = inner;
  }
  return cur;
}

function seconds(ts: unknown): number {
  let n = 0;
  if (typeof ts === "number") n = ts;
  else if (typeof ts === "string") n = Number(ts);
  else if (ts && typeof ts === "object") n = Number((ts as any).low ?? (ts as any).toString?.());
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n > 1e12 ? n / 1000 : n;
}

/**
 * Одно событие messages.upsert (data из тела вебхука) в то, на что отвечаем. null: свои сообщения, не личка, реакции, системные,
 * стикеры, контакты, геометки и прочее без текста. Голосовые, фото, видео и файлы без подписи дают kind "media".
 */
export function classifyIncoming(d: any): Incoming | null {
  const key = d?.key;
  if (!key || typeof key !== "object" || key.fromMe === true) return null;
  const jid = personJid(key.remoteJid);
  if (!jid) return null;
  const m = unwrap(d.message);
  if (!m || typeof m !== "object") return null;
  const mid = typeof key.id === "string" ? key.id.slice(0, 80) : "";
  const ts = seconds(d.messageTimestamp) * 1000;
  const clip = (s: string) => s.replace(/\u0000/g, "").trim().slice(0, MAX_TEXT);
  // Текст, который человек видит у себя в чате: обычное сообщение, ответ на сообщение или нажатая кнопка быстрого ответа.
  const plain =
    typeof m.conversation === "string"
      ? m.conversation
      : typeof m.extendedTextMessage?.text === "string"
        ? m.extendedTextMessage.text
        : typeof m.buttonsResponseMessage?.selectedDisplayText === "string"
          ? m.buttonsResponseMessage.selectedDisplayText
          : typeof m.templateButtonReplyMessage?.selectedDisplayText === "string"
            ? m.templateButtonReplyMessage.selectedDisplayText
            : typeof m.listResponseMessage?.title === "string"
              ? m.listResponseMessage.title
              : "";
  if (plain) return clip(plain) ? { jid, mid, kind: "text", text: clip(plain), ts } : null;
  const media: Array<[string, string]> = [
    ["audioMessage", "[голосовое сообщение]"],
    ["ptvMessage", "[видео]"],
    ["imageMessage", "[фото]"],
    ["videoMessage", "[видео]"],
    ["documentMessage", "[файл]"],
  ];
  for (const [k, label] of media) {
    if (!m[k] || typeof m[k] !== "object") continue;
    const caption = typeof m[k].caption === "string" ? clip(m[k].caption) : "";
    return caption ? { jid, mid, kind: "text", text: caption, ts } : { jid, mid, kind: "media", text: label, ts };
  }
  return null;
}

// ───────────────────────── состояние ─────────────────────────

type Row = { ts: number; jid: string; role: "user" | "assistant"; text: string; mid?: string; via?: string };
type Convo = { jid: string; rows: Row[]; silencedUntil: number; lastAt: number };
type Pending = { texts: string[]; timer: ReturnType<typeof setTimeout> | null; firstAt: number };
type DayStats = { replies: number; handoffs: number; rejected: number; fallbacks: number; errors: number; dialogs: Set<string>; per: Map<string, number> };

type Ai = {
  host: AiHost;
  file: string;
  convos: Map<string, Convo>;
  pending: Map<string, Pending>;
  inflight: Set<string>;
  running: Set<Promise<unknown>>;
  seen: Set<string>;
  stats: Map<string, DayStats>;
  alarmAt: Map<string, number>;
  lastHookAt: number;
  hookTryAt: number;
  hookAssertAt: number;
  hookFails: number;
  toggling: boolean;
  testAt: number[];
  skipNoteAt: number;
};

let A: Ai | null = null;
const need = (): Ai => {
  if (!A) throw new Error("ассистент WhatsApp не инициализирован");
  return A;
};

/** Номер для журнала, логов и пульта: 7708***4575. */
export const maskJid = (jid: string) => {
  const d = jid.replace(/[:@].*$/, "").replace(/\D/g, "");
  const tag = jid.endsWith("@lid") ? " (lid)" : "";
  return (d.length >= 9 ? `${d.slice(0, 4)}***${d.slice(-4)}` : d ? "***" : "") + tag;
};
const idOf = (jid: string) => createHash("sha256").update(`wa-ai|${jid}`).digest("hex").slice(0, 12);
const clipText = (s: unknown, n: number) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const scrub = (s: string) => {
  let out = s;
  for (const k of [apiKey(), evo.evoKey(), A?.host.state().secret || "", env("WA_HOOK_SECRET")]) if (k) out = out.split(k).join("***");
  return out;
};
const log = (msg: string, ...args: unknown[]) => console.log(`[wa-ai] ${msg}`, ...args);

function statsOf(a: Ai, day: string): DayStats {
  let s = a.stats.get(day);
  if (!s) {
    s = { replies: 0, handoffs: 0, rejected: 0, fallbacks: 0, errors: 0, dialogs: new Set(), per: new Map() };
    a.stats.set(day, s);
    // Держим три дня: сегодня и два прошлых.
    for (const k of [...a.stats.keys()].sort().slice(0, -3)) a.stats.delete(k);
  }
  return s;
}

function convoOf(a: Ai, jid: string): Convo {
  let c = a.convos.get(jid);
  if (!c) {
    c = { jid, rows: [], silencedUntil: 0, lastAt: 0 };
    a.convos.set(jid, c);
  }
  return c;
}

function rememberMid(a: Ai, mid: string) {
  if (!mid) return;
  a.seen.add(mid);
  if (a.seen.size > 5000) a.seen.delete(a.seen.values().next().value as string);
}

function append(a: Ai, row: Record<string, unknown>) {
  try {
    appendFileSync(a.file, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    console.error("[wa-ai] не смог дописать wa-assistant.jsonl:", (e as Error).message);
  }
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
    let text = buf.toString("utf8");
    if (start > 0) text = text.slice(text.indexOf("\n") + 1);
    const out: any[] = [];
    for (const line of text.split("\n")) {
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

/** Применить строку файла к памяти (при старте и при записи). */
function apply(a: Ai, row: any) {
  const ts = typeof row?.ts === "number" ? row.ts : Date.parse(String(row?.ts || ""));
  const jid = typeof row?.jid === "string" ? row.jid : "";
  if (!Number.isFinite(ts) || !jid) return;
  const day = dayKeyOf(ts);
  if (row.role === "user" || row.role === "assistant") {
    const c = convoOf(a, jid);
    c.rows.push({ ts, jid, role: row.role, text: String(row.text || ""), ...(row.mid ? { mid: String(row.mid) } : {}), ...(row.via ? { via: String(row.via) } : {}) });
    if (c.rows.length > HISTORY) c.rows.splice(0, c.rows.length - HISTORY);
    c.lastAt = Math.max(c.lastAt, ts);
    const s = statsOf(a, day);
    if (row.role === "user") {
      s.dialogs.add(jid);
      if (row.mid) rememberMid(a, String(row.mid));
    } else {
      s.replies++;
      s.per.set(jid, (s.per.get(jid) || 0) + 1);
    }
  } else if (row.ev === "handoff") {
    statsOf(a, day).handoffs++;
    const c = convoOf(a, jid);
    c.silencedUntil = Math.max(c.silencedUntil, ts + SILENCE_MS);
  } else if (row.ev === "reject") statsOf(a, day).rejected++;
  else if (row.ev === "fallback") statsOf(a, day).fallbacks++;
  else if (row.ev === "error") statsOf(a, day).errors++;
}

/** Подключить ассистента к модулю: прочитать файл переписки, восстановить историю, паузы и счётчики за сегодня. */
export function aiInit(host: AiHost): void {
  aiReset();
  mkdirSync(host.dir, { recursive: true });
  const a: Ai = {
    host,
    file: join(host.dir, "wa-assistant.jsonl"),
    convos: new Map(),
    pending: new Map(),
    inflight: new Set(),
    running: new Set(),
    seen: new Set(),
    stats: new Map(),
    alarmAt: new Map(),
    lastHookAt: 0,
    hookTryAt: 0,
    hookAssertAt: 0,
    hookFails: 0,
    toggling: false,
    testAt: [],
    skipNoteAt: 0,
  };
  // Файл растёт на сотни байт на сообщение. Раздулся: оставляем хвост, всё нужное (16 сообщений, паузы, счётчики дня) в нём.
  try {
    if (existsSync(a.file) && statSync(a.file).size > FILE_COMPACT_BYTES) {
      const keep = readTail(a.file, 2 * 1024 * 1024);
      const tmp = `${a.file}.tmp.${process.pid}`;
      writeFileSync(tmp, keep.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
      renameSync(tmp, a.file);
    }
  } catch (e) {
    console.error("[wa-ai] не смог сжать wa-assistant.jsonl:", (e as Error).message);
  }
  const from = host.now() - 30 * DAY;
  for (const row of readTail(a.file, FILE_TAIL_BYTES)) if ((typeof row?.ts === "number" ? row.ts : Date.parse(String(row?.ts || ""))) >= from) apply(a, row);
  A = a;
}

/** Остановить таймеры и забыть ассистента (тесты, перезагрузка модуля). */
export function aiReset(): void {
  if (A) for (const p of A.pending.values()) if (p.timer) clearTimeout(p.timer);
  A = null;
}

export const aiActive = () => !!A;

// ───────────────────────── файлы промпта ─────────────────────────

let cache: { key: string; system: string } | null = null;

/** prompt.md и knowledge.md читаются при каждом ответе, если файлы изменились: правка базы вступает в силу без перезапуска. */
function loadSystem(): { ok: true; system: string } | { ok: false; error: string } {
  const dir = promptDir();
  try {
    const f1 = join(dir, "prompt.md");
    const f2 = join(dir, "knowledge.md");
    const key = `${dir}|${statSync(f1).mtimeMs}|${statSync(f2).mtimeMs}`;
    if (cache?.key === key) return { ok: true, system: cache.system };
    const prompt = readFileSync(f1, "utf8").trim();
    const knowledge = readFileSync(f2, "utf8").trim();
    if (!prompt || !knowledge) return { ok: false, error: "prompt.md или knowledge.md пустой" };
    cache = { key, system: `${prompt}\n\n# База знаний\n\n${knowledge}` };
    return { ok: true, system: cache.system };
  } catch {
    return { ok: false, error: `нет файлов prompt.md и knowledge.md в ${dir}` };
  }
}

/** Можно ли включать: есть ключ OpenAI, файлы промпта и ключ Evolution. Причину показывает пульт. */
function prerequisites(): { ok: true } | { ok: false; reason: string } {
  if (!apiKey()) return { ok: false, reason: "Нет ключа OPENAI_API_KEY в .env на сервере: ассистент не стартует." };
  const f = loadSystem();
  if (!f.ok) return { ok: false, reason: `Ассистент не стартует: ${f.error}.` };
  if (!evo.evoKey()) return { ok: false, reason: "Нет EVOLUTION_API_KEY: ассистент не стартует." };
  return { ok: true };
}

// ───────────────────────── модель ─────────────────────────

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
type ModelRes = { ok: true; text: string } | { ok: false; error: string };

/** Один вызов OpenAI chat/completions. Без temperature (модели с рассуждениями его не принимают). Таймаут 30 секунд. Не бросает. */
async function callModel(messages: ChatMsg[]): Promise<ModelRes> {
  const key = apiKey();
  if (!key) return { ok: false, error: "нет ключа OPENAI_API_KEY" };
  try {
    const res = await fetch(`${openaiBase()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL(), messages, reasoning_effort: "low", max_completion_tokens: 1200 }),
      signal: AbortSignal.timeout(timeoutMs()),
    });
    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }
    if (!res.ok) return { ok: false, error: scrub(`${res.status} ${clipText(data?.error?.message || res.statusText || raw, 120)}`) };
    const choice = data?.choices?.[0];
    const text = choice?.message?.content;
    if (choice?.finish_reason === "length") return { ok: false, error: "ответ оборвался по длине" };
    if (typeof text !== "string" || !text.trim()) return { ok: false, error: choice?.message?.refusal ? "модель отказалась отвечать" : "пустой ответ модели" };
    return { ok: true, text };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    if (err?.name === "TimeoutError" || err?.name === "AbortError") return { ok: false, error: "таймаут" };
    return { ok: false, error: scrub(String(err?.cause?.code || err?.message || err)).slice(0, 120) };
  }
}

const reviewNote = (reasons: Reason[]) =>
  `Служебное замечание проверки: твой ответ не отправлен, потому что ${reasons.map((r) => REASON_TEXT[r]).join("; ")}. Напиши новый ответ: до 350 знаков, без цен и любых цифр оплаты, без рассрочки и предоплаты, без клиентов и кейсов, без номеров телефонов, только ссылки и контакты из списка разрешённых, ничего не повторяй из сообщения человека. Если нужен менеджер, дай ссылку на менеджера школы. Выдай только текст ответа.`;

type Made =
  | { ok: true; text: string; via: "model" | "fallback"; handoff: boolean; summary: string; rejected: Reason[][] }
  | { ok: false; error: string; rejected: Reason[][] };

/**
 * Ответ модели с проверкой. Не прошёл: второй запрос с замечанием. Снова не прошёл: безопасная заготовка. Сбой модели: ok false,
 * человеку не отвечаем.
 */
async function makeReply(messages: ChatMsg[]): Promise<Made> {
  const rejected: Reason[][] = [];
  const first = await callModel(messages);
  if (!first.ok) return { ok: false, error: first.error, rejected };
  let c = cleanReply(first.text);
  let reasons = checkReply(c.text);
  const accept = (x: Cleaned): Made => ({ ok: true, text: x.text, via: "model", handoff: x.mark || AYANA_RE.test(x.text), summary: x.summary, rejected });
  if (!reasons.length) return accept(c);
  rejected.push(reasons);
  const second = await callModel([...messages, { role: "assistant", content: first.text }, { role: "system", content: reviewNote(reasons) }]);
  if (!second.ok) return { ok: false, error: second.error, rejected };
  c = cleanReply(second.text);
  reasons = checkReply(c.text);
  if (!reasons.length) return accept(c);
  rejected.push(reasons);
  return { ok: true, text: SAFE_FALLBACK, via: "fallback", handoff: false, summary: "", rejected };
}

function buildMessages(system: string, conv: Convo, now: number): ChatMsg[] {
  const out: ChatMsg[] = [{ role: "system", content: `${system}\n\nСейчас ${hhmmOf(now)} по Алматы.` }];
  for (const r of conv.rows.slice(-HISTORY)) {
    const last = out[out.length - 1];
    if (last.role === r.role) last.content += `\n${r.text}`;
    else out.push({ role: r.role, content: r.text });
  }
  return out;
}

// ───────────────────────── тревоги ─────────────────────────

/** Одна тревога на ключ за окно: сбой модели раз в час, лимиты раз в сутки. */
async function alarmOnce(a: Ai, key: string, windowMs: number, text: string) {
  const now = a.host.now();
  if (now - (a.alarmAt.get(key) || 0) < windowMs) return;
  a.alarmAt.set(key, now);
  try {
    await a.host.alarm(text);
  } catch {
    /* Telegram недоступен: тревога осталась в журнале */
  }
}

// ───────────────────────── входящие ─────────────────────────

function schedule(a: Ai, jid: string) {
  const p = a.pending.get(jid);
  if (!p) return;
  if (p.timer) clearTimeout(p.timer);
  // Тишина считается от последнего сообщения, но человек, который пишет без пауз, не должен ждать ответа бесконечно:
  // пачка закрывается не позже чем через минуту после первого сообщения.
  const cap = Number(env("WA_AI_MAX_WAIT_MS")) || Math.max(60_000, quietMs());
  const wait = Math.min(quietWithJitter(), Math.max(0, p.firstAt + cap - Date.now()));
  p.timer = setTimeout(() => runBatch(a, jid), wait);
  p.timer.unref?.();
}

function runBatch(a: Ai, jid: string): Promise<void> {
  const p = a.pending.get(jid);
  if (!p) return Promise.resolve();
  if (p.timer) {
    clearTimeout(p.timer);
    p.timer = null;
  }
  // Предыдущий ответ этому человеку ещё в работе: ждём ещё одну тишину, а не отвечаем параллельно.
  if (a.inflight.has(jid)) {
    p.firstAt = Date.now();
    schedule(a, jid);
    return Promise.resolve();
  }
  a.pending.delete(jid);
  a.inflight.add(jid);
  const job = answer(a, jid, p)
    .catch((e) => console.error("[wa-ai] ответ упал:", scrub(String((e as Error)?.message || e)).slice(0, 200)))
    .finally(() => {
      a.inflight.delete(jid);
      a.running.delete(job);
    });
  a.running.add(job);
  return job;
}

function ingest(a: Ai, inc: Incoming) {
  const now = a.host.now();
  const st = a.host.state();
  if (!st.enabled) return;
  if (inc.ts && now - inc.ts > STALE_MS) return;
  if (a.host.ignoreDigits().includes(inc.jid.replace(/@.*$/, ""))) return;
  if (inc.mid) {
    if (a.seen.has(inc.mid)) return;
    rememberMid(a, inc.mid);
  }
  const row: Row = { ts: now, jid: inc.jid, role: "user", text: inc.text, ...(inc.mid ? { mid: inc.mid } : {}) };
  append(a, row);
  apply(a, row);
  const conv = convoOf(a, inc.jid);
  // Молчим с человеком после передачи менеджеру: сообщение остаётся в истории, ответа не будет.
  if (conv.silencedUntil > now) return;
  let p = a.pending.get(inc.jid);
  if (!p) {
    p = { texts: [], timer: null, firstAt: Date.now() };
    a.pending.set(inc.jid, p);
  }
  if (inc.kind === "text") p.texts.push(inc.text);
  schedule(a, inc.jid);
}

async function answer(a: Ai, jid: string, p: Pending): Promise<void> {
  const h = a.host;
  const now0 = h.now();
  if (!h.state().enabled) return;
  const can = h.canSend();
  if (!can.ok) {
    if (now0 - a.skipNoteAt > HOUR) {
      a.skipNoteAt = now0;
      h.journal({ ev: "ai_skip", who: maskJid(jid), why: can.why });
    }
    return;
  }
  const conv = convoOf(a, jid);
  if (conv.silencedUntil > now0) return;
  const day = dayKeyOf(now0);
  const s = statsOf(a, day);
  if (s.replies >= LIMIT_TOTAL) {
    await alarmOnce(a, `total:${day}`, DAY, `ИИ-ассистент WhatsApp: сегодня уже ${LIMIT_TOTAL} ответов с номера, это предел защиты. До завтра людям не отвечаю.`);
    return;
  }
  if ((s.per.get(jid) || 0) >= LIMIT_PERSON) {
    await alarmOnce(a, `person:${day}`, DAY, `ИИ-ассистент WhatsApp: человек ${maskJid(jid)} получил ${LIMIT_PERSON} ответов за сутки. Ему до завтра не отвечаю.`);
    return;
  }

  let text = MEDIA_PHRASE;
  let via = "media";
  let handoff = false;
  let summary = "";
  if (!p.texts.length) {
    // Фразу «Напишите текстом» человек уже получил и ничего текстом не прислал: второй раз её не шлём.
    const lastBot = [...conv.rows].reverse().find((r) => r.role === "assistant");
    if (lastBot?.text === MEDIA_PHRASE) return;
  } else {
    const sys = loadSystem();
    if (!sys.ok) {
      await alarmOnce(a, "files", HOUR, `ИИ-ассистент WhatsApp не может ответить: ${sys.error}.`);
      return;
    }
    const made = await makeReply(buildMessages(sys.system, conv, now0));
    for (const reasons of made.rejected) {
      append(a, { ts: h.now(), jid, ev: "reject", reasons });
      statsOf(a, day).rejected++;
    }
    if (!made.ok) {
      append(a, { ts: h.now(), jid, ev: "error", error: clipText(made.error, 120) });
      statsOf(a, day).errors++;
      log("модель не ответила (%s): %s", maskJid(jid), made.error);
      await alarmOnce(a, "openai", HOUR, `ИИ-ассистент WhatsApp: модель не ответила (${made.error}). Человеку ничего не отправлено. Следующая тревога об этом не раньше чем через час.`);
      return;
    }
    text = made.text;
    via = made.via;
    handoff = made.handoff;
    summary = made.summary;
    if (made.via === "fallback") {
      append(a, { ts: h.now(), jid, ev: "fallback" });
      statsOf(a, day).fallbacks++;
    }
  }

  // Модель отвечала долго: за это время ассистента могли выключить, а человека передать менеджеру.
  if (!h.state().enabled || convoOf(a, jid).silencedUntil > h.now()) return;
  const can2 = h.canSend();
  if (!can2.ok) return;

  const delay = PAUSE_MS[0] + Math.round(h.rand() * (PAUSE_MS[1] - PAUSE_MS[0]));
  const sent = await h.exclusive(() => evo.sendText(jid, text, { delay }));
  if (!sent.ok) {
    append(a, { ts: h.now(), jid, ev: "error", error: clipText(sent.error, 120) });
    statsOf(a, day).errors++;
    log("не отправилось (%s): %s", maskJid(jid), sent.error);
    await alarmOnce(a, "send", HOUR, `ИИ-ассистент WhatsApp: ответ человеку ${maskJid(jid)} не отправился (${clipText(sent.error, 100)}). Следующая тревога об этом не раньше чем через час.`);
    return;
  }
  const ts = h.now();
  const row: Row = { ts, jid, role: "assistant", text, via };
  append(a, row);
  apply(a, row);
  log("ответ ушёл: %s, %s", maskJid(jid), via);

  if (handoff) {
    const last = [...conv.rows].reverse().find((r) => r.role === "user")?.text || "";
    const why = clipText(stripLinks(summary) || stripLinks(last), 200);
    append(a, { ts, jid, ev: "handoff", summary: why });
    apply(a, { ts, jid, ev: "handoff" });
    h.journal({ ev: "ai_handoff", who: maskJid(jid), why: clipText(why, 120) });
    try {
      await h.notify(
        `ИИ-ассистент WhatsApp передал человека менеджеру: +${jid.replace(/[:@].*$/, "")}${jid.endsWith("@lid") ? " (внутренний ID WhatsApp, не телефон)" : ""}.\nСуть: ${why || "не указана"}.\nАссистент молчит с ним 12 часов.`,
      );
    } catch {
      /* Telegram недоступен: запись осталась в журнале */
    }
  }
}

/** Ссылки и адреса из чужого текста в тревогу не несём: владелец может нажать на фишинг. */
function stripLinks(s: string): string {
  return s.replace(URL_RE, "[ссылка]").replace(BARE_RE, "[адрес]");
}

// ───────────────────────── вебхук Evolution ─────────────────────────

const LOCAL_ADDR = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
/** Через nginx снаружи запрос тоже приходит с 127.0.0.1, но с этими заголовками. Evolution звонит напрямую и без них. */
const PROXY_HEADERS = ["x-forwarded-for", "x-real-ip", "forwarded", "x-forwarded-host", "x-forwarded-proto"];

const hashOf = (s: string) => createHash("sha256").update(s).digest();

function hookSecret(): string {
  return env("WA_HOOK_SECRET") || A?.host.state().secret || "";
}

function hookAuth(req: IncomingMessage): 0 | 401 | 403 {
  if (!LOCAL_ADDR.has(req.socket.remoteAddress || "") || PROXY_HEADERS.some((h) => req.headers[h] !== undefined)) return 403;
  const secret = hookSecret();
  const got = req.headers["x-wa-hook-secret"];
  const provided = Array.isArray(got) ? got[0] : got;
  if (!secret || !provided || !timingSafeEqual(hashOf(secret), hashOf(provided))) return 401;
  return 0;
}

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

/** Тело вебхука Evolution: { event, instance, data, … }. Принимаем messages.upsert нашего инстанса. */
function ingestPayload(a: Ai, body: any) {
  const ev = String(body?.event || "").toLowerCase().replace(/_/g, ".");
  if (ev !== "messages.upsert") return;
  if (body?.instance && String(body.instance) !== evo.evoInstance()) return;
  const list = Array.isArray(body?.data) ? body.data : body?.data ? [body.data] : [];
  for (const d of list) {
    const inc = classifyIncoming(d);
    if (inc) ingest(a, inc);
  }
}

/** POST /api/wa-hook. Отвечает сразу (Evolution повторяет запрос при ошибке до десяти раз), разбор идёт после ответа. */
export async function handleWaHook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
    res.end(payload);
  };
  const bad = hookAuth(req);
  if (bad) {
    req.resume();
    return send(bad, { ok: false });
  }
  const raw = await readLimited(req, 512 * 1024);
  const a = A;
  if (a) a.lastHookAt = a.host.now();
  send(200, { ok: true });
  if (!a || raw === null || !a.host.state().enabled) return;
  try {
    ingestPayload(a, JSON.parse(raw));
  } catch (e) {
    console.error("[wa-ai] не разобрал вебхук:", scrub(String((e as Error)?.message || e)).slice(0, 120));
  }
}

/** Для тестов и проверок: разобрать тело вебхука без HTTP. */
export function aiHookBody(body: unknown): void {
  const a = A;
  if (a && a.host.state().enabled) ingestPayload(a, body);
}

/** Для тестов: обработать все накопленные пачки сразу, не дожидаясь тишины, и дождаться ответов. */
export async function aiFlush(): Promise<void> {
  const a = A;
  if (!a) return;
  for (let i = 0; i < 40; i++) {
    for (const jid of [...a.pending.keys()]) void runBatch(a, jid);
    if (a.running.size) await Promise.allSettled([...a.running]);
    if (!a.pending.size && !a.running.size) return;
    if (!a.running.size) await new Promise((r) => setTimeout(r, 5));
  }
}

// ───────────────────────── вебхук: установка и снятие ─────────────────────────

const hookArgs = (on: boolean) => ({ url: hookUrl(), enabled: on, events: ["MESSAGES_UPSERT"], headers: { "X-Wa-Hook-Secret": hookSecret() } });

/** Общий секрет вебхука: из WA_HOOK_SECRET, иначе случайный, он живёт в wa-state.json и в Evolution. В пульт и в логи не попадает. */
function ensureSecret(a: Ai): string {
  const cur = a.host.state().secret;
  if (cur || env("WA_HOOK_SECRET")) return cur;
  const secret = randomBytes(24).toString("hex");
  a.host.patch({ secret });
  return secret;
}

/**
 * Согласовать вебхук Evolution с настройкой. Зовётся из тика модуля (внутри очереди запросов, поэтому напрямую, без exclusive).
 * Включён и всё есть: вебхук стоит, раз в 6 часов подтверждаем его (Evolution могли переустановить). Выключен или ключа нет:
 * вебхук снят. Выключенный ассистент без вебхука не делает ни одного запроса.
 */
export async function aiTick(now: number): Promise<void> {
  const a = A;
  if (!a) return;
  const st = a.host.state();
  const want = st.enabled && prerequisites().ok;
  if (want === st.hookOn && !(want && now - a.hookAssertAt >= 6 * HOUR)) return;
  if (now - a.hookTryAt < MIN) return;
  a.hookTryAt = now;
  if (want) ensureSecret(a);
  const r = await evo.setWebhook(hookArgs(want));
  if (r.ok) {
    a.hookFails = 0;
    a.hookAssertAt = now;
    if (want !== st.hookOn) {
      a.host.patch({ hookOn: want });
      a.host.journal({ ev: want ? "ai_on" : "ai_off", by: "tick" });
    }
    return;
  }
  a.hookFails++;
  log("вебхук Evolution не %s: %s", want ? "поставился" : "снялся", r.error);
  if (a.hookFails >= 3) await alarmOnce(a, "hook", HOUR, `ИИ-ассистент WhatsApp: вебхук Evolution ${want ? "не ставится" : "не снимается"} (${clipText(r.error, 100)}). Проверь, что Evolution отвечает.`);
}

// ───────────────────────── пульт и команды ─────────────────────────

const ddmm = (ms: number) => {
  const d = dayKeyOf(ms);
  return `${d.slice(8, 10)}.${d.slice(5, 7)}`;
};
const agoText = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 90 ? `${s} с назад` : s < 5400 ? `${Math.round(s / 60)} мин назад` : `${Math.round(s / 3600)} ч назад`;
};

/** Блок «ИИ-ассистент» для пульта: выключатель, причина, счётчики за сегодня, последние 20 диалогов (номера закрыты). */
export function aiPanel(nowArg?: number): Record<string, unknown> {
  const a = A;
  if (!a) return { available: false };
  const now = nowArg ?? a.host.now();
  const st = a.host.state();
  const s = statsOf(a, dayKeyOf(now));
  const pre = prerequisites();
  let reason = "";
  if (!pre.ok) reason = pre.reason;
  else if (st.enabled) {
    const can = a.host.canSend();
    if (!can.ok) reason = `Сейчас не отвечает: ${can.why}.`;
    else if (!st.hookOn) reason = "Вебхук в Evolution ещё не поставлен, повторю в ближайшую минуту.";
    else if (!a.lastHookAt) reason = "Вебхук стоит, но сообщений от Evolution с момента запуска ещё не было.";
  }
  const dialogs = [...a.convos.values()]
    .filter((c) => c.rows.length)
    .sort((x, y) => y.lastAt - x.lastAt)
    .slice(0, 20)
    .map((c) => {
      const lastUser = [...c.rows].reverse().find((r) => r.role === "user");
      const lastBot = [...c.rows].reverse().find((r) => r.role === "assistant");
      return {
        id: idOf(c.jid),
        who: maskJid(c.jid),
        at: `${ddmm(c.lastAt)} ${hhmmOf(c.lastAt)}`,
        last: clipText(lastUser?.text, 140),
        reply: clipText(lastBot?.text, 200),
        answered: !!lastBot && (!lastUser || lastBot.ts >= lastUser.ts),
        handoff: c.silencedUntil > now,
      };
    });
  return {
    available: true,
    enabled: st.enabled,
    hookOn: st.hookOn,
    canEnable: pre.ok,
    reason,
    model: MODEL(),
    counters: { dialogs: s.dialogs.size, replies: s.replies, handoffs: s.handoffs, rejected: s.rejected },
    limits: { person: LIMIT_PERSON, total: LIMIT_TOTAL },
    lastHook: a.lastHookAt ? agoText(now - a.lastHookAt) : "",
    dialogs,
  };
}

/** Полный номер по id диалога из пульта: отдаётся только по нажатию. */
export function aiNumber(id: unknown): AiAct & { number?: string } {
  const a = A;
  if (!a) return fail("module_off", "Модуль WhatsApp не запущен.");
  const c = typeof id === "string" ? [...a.convos.values()].find((x) => idOf(x.jid) === id) : undefined;
  if (!c) return fail("not_found", "Диалог не найден.");
  const digits = c.jid.replace(/[:@].*$/, "");
  return { ok: true, message: c.jid.endsWith("@lid") ? "Это внутренний ID WhatsApp, а не телефон." : "Номер человека.", number: c.jid.endsWith("@lid") ? `${digits} (lid)` : `+${digits}` };
}

const MODULE_OFF = fail("module_off", "Модуль WhatsApp не запущен: на сервере нет WA_GROUPS=on или он не стартовал (см. /api/health).");

/**
 * Включить или выключить ассистента. Включение: проверка ключа и файлов, потом вебхук в Evolution; не поставился, значит остаётся
 * выключенным. Выключение: ассистент замолкает сразу, потом вебхук снимается (не вышло: снимет ближайший тик модуля).
 */
export async function aiSetEnabled(on: unknown): Promise<AiAct> {
  const a = A;
  if (!a) return MODULE_OFF;
  if (typeof on !== "boolean") return fail("bad_request", "Нужно true или false.");
  if (a.toggling) return fail("busy", "Предыдущее переключение ещё идёт, подожди несколько секунд.");
  a.toggling = true;
  try {
    const st = a.host.state();
    if (on) {
      if (st.enabled && st.hookOn) return { ok: true, code: "same", message: "ИИ-ассистент уже включён." };
      const pre = prerequisites();
      if (!pre.ok) return fail("no_key", `${pre.reason} Ассистент не включён.`);
      ensureSecret(a);
      const r = await a.host.exclusive(() => evo.setWebhook(hookArgs(true)));
      if (!r.ok) return fail("evolution", `Не удалось поставить вебхук в Evolution: ${clipText(r.error, 120)}. Ассистент не включён.`);
      a.host.patch({ enabled: true, hookOn: true });
      a.hookAssertAt = a.host.now();
      a.hookFails = 0;
      a.host.journal({ ev: "ai_on", by: "panel" });
      log("включён");
      return { ok: true, message: "ИИ-ассистент включён. Он отвечает только тем, кто написал номеру в личку. Первым никому не пишет." };
    }
    if (!st.enabled && !st.hookOn) return { ok: true, code: "same", message: "ИИ-ассистент уже выключен." };
    a.host.patch({ enabled: false });
    for (const p of a.pending.values()) if (p.timer) clearTimeout(p.timer);
    a.pending.clear();
    a.host.journal({ ev: "ai_off", by: "panel" });
    log("выключен");
    if (st.hookOn) {
      a.hookTryAt = a.host.now();
      const r = await a.host.exclusive(() => evo.setWebhook(hookArgs(false)));
      if (r.ok) a.host.patch({ hookOn: false });
      else return { ok: true, code: "hook_pending", message: `ИИ-ассистент выключен и не отвечает. Вебхук в Evolution снять не вышло (${clipText(r.error, 100)}), повторю сам в течение минуты.` };
    }
    return { ok: true, message: "ИИ-ассистент выключен. Вебхук в Evolution снят, запросов к OpenAI нет." };
  } finally {
    a.toggling = false;
  }
}

export type AiTestResult = AiAct & { reply?: string; verdict?: "ok" | "fallback"; reasons?: string[]; handoff?: boolean };

/**
 * Проверить ассистента: вопрос, ответ модели через ту же проверку, без отправки в WhatsApp и без записи в историю и счётчики.
 * Работает и при выключенном ассистенте (иначе его нечем проверить перед включением). Не чаще раза в 3 секунды и 20 раз в час.
 */
export async function aiTest(question: unknown): Promise<AiTestResult> {
  const a = A;
  if (!a) return MODULE_OFF;
  const q = typeof question === "string" ? question.replace(/\u0000/g, "").trim().slice(0, 1000) : "";
  if (!q) return fail("bad_request", "Напиши вопрос, например: сколько стоит обучение?");
  const pre = prerequisites();
  if (!pre.ok) return fail("no_key", pre.reason);
  const now = a.host.now();
  a.testAt = a.testAt.filter((t) => now - t < HOUR);
  if (a.testAt.length && now - a.testAt[a.testAt.length - 1] < 3000) return fail("rate", "Слишком часто, подожди пару секунд.");
  if (a.testAt.length >= 20) return fail("rate", "Проверок за час уже 20. Подожди, чтобы не тратить деньги на модель.");
  a.testAt.push(now);
  const sys = loadSystem();
  if (!sys.ok) return fail("no_key", `Ассистент не стартует: ${sys.error}.`);
  const made = await makeReply([
    { role: "system", content: `${sys.system}\n\nСейчас ${hhmmOf(now)} по Алматы.` },
    { role: "user", content: q },
  ]);
  if (!made.ok) return fail("model", `Модель не ответила: ${made.error}.`);
  const reasons = made.rejected.flat().map((r) => REASON_TEXT[r]);
  return {
    ok: true,
    message: made.via === "fallback" ? "Ответ модели не прошёл проверку дважды, человеку ушла бы безопасная заготовка." : "Ответ прошёл проверку.",
    reply: made.text,
    verdict: made.via === "fallback" ? "fallback" : "ok",
    reasons: [...new Set(reasons)],
    handoff: made.handoff,
  };
}

/** Команды владельца /wa_ai и /wa_ai_test. */
export async function aiCommand(cmd: string, args: string): Promise<string> {
  if (!A) return MODULE_OFF.message;
  if (cmd === "wa_ai_test") {
    const r = await aiTest(args);
    if (!r.ok) return r.message;
    return `Ответ ассистента (в WhatsApp не отправлялся):\n${r.reply}\n\n${r.message}${r.reasons?.length ? `\nОтклонялось проверкой: ${r.reasons.join("; ")}.` : ""}${r.handoff ? "\nПередача менеджеру: да." : ""}`;
  }
  const arg = args.trim().toLowerCase();
  if (arg === "on" || arg === "off") return (await aiSetEnabled(arg === "on")).message;
  const p = aiPanel() as any;
  const c = p.counters;
  return [
    `ИИ-ассистент WhatsApp: ${p.enabled ? "включён" : "выключен"}${p.reason ? `. ${p.reason}` : ""}`,
    `Сегодня: диалогов ${c.dialogs}, ответов ${c.replies}, передано менеджеру ${c.handoffs}, отклонено проверкой ${c.rejected}.`,
    "Включить: /wa_ai on, выключить: /wa_ai off, проверить ответ без отправки: /wa_ai_test вопрос",
  ].join("\n");
}

/** Для тестов. */
export const _ai = { classifyIncoming, personJid, checkReply, cleanReply, allowedLink, loadSystem, idOf };
