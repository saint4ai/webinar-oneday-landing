/**
 * Мост WhatsApp ↔ бот Instagram AI-менеджера (docs/tasks/wa_bridge_1009.md, архитектура в
 * reels-montage-pipeline/automation/instagram/WHATSAPP_архитектура.md). Воронка, сообщества, дожим и Evolution остаются у нас,
 * личка номера и работа менеджера уходят в бот на ig.onai.academy. Здесь две стороны моста.
 *
 *   1. Вход: вебхук Evolution MESSAGES_UPSERT приходит в wa-assistant (handleWaHook), тот отдаёт тело сюда (bridgeTap). Каждое личное
 *      сообщение (включая свои: fromMe) уходит в POST WA_BRIDGE_URL с подписью X-Wa-Signature = hex(HMAC-SHA256(сырое тело, секрет)).
 *      Отдельно от ассистента и асинхронно: порядок сообщений одного чата сохраняется (очередь по jid), сбой моста ассистента не задевает.
 *      Группы, сообщества, рассылки и каналы не пересылаются. Голосовое уходит с base64 (до 10 МБ, файл берём у Evolution), фото, видео
 *      и файлы без base64; для фото base64 включается одной настройкой WA_BRIDGE_IMAGES=on (до 5 МБ).
 *      Ответ бота: 200 принято; 404 канал у бота выключен (не ошибка, без повторов и тревог); 403 неверная подпись; 5xx и сеть:
 *      два повтора через 1 и 3 секунды, дальше запись в журнал и тревога владельцам не чаще раза в час.
 *   2. Ответ: POST /api/wa/send (снаружи /workshop/api/wa/send). Проверки: канал включён, IP клиента, подпись, тело. Отправка через
 *      Evolution sendText на <номер>@s.whatsapp.net. Ключ key идемпотентный: он занят в памяти на время отправки (параллельный
 *      повтор ждёт и получает dup), в файл wa-bridge-sent.jsonl пишется только после успешной отправки и живёт 7 дней; при ошибке
 *      Evolution ключ не запоминается, повтор бота отправит сообщение заново.
 *
 * Выключатель: WA_BRIDGE=on в .env и перезапуск (по умолчанию выключен: ничего не пересылается, маршрут отвечает 404, вебхук Evolution
 * из-за моста не ставится). Секрет WA_BRIDGE_SECRET нигде не печатается и в журнал не попадает. Журнал DATA_DIR/wa-bridge.jsonl: строки
 * fwd (id, код, мс) и send (key, ok, id или ошибка), без текстов сообщений, без номеров и без секрета.
 *
 * С wa-assistant.ts связь односторонняя: мост импортирует оттуда хозяина (часы, очередь Evolution, тревоги), а тот про мост знает только
 * через aiBridgeLink. Пока в вебхуке мост нужен, вебхук Evolution остаётся поставленным, даже когда ассистента выключили командой /wa_ai off.
 */
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, writeFileSync } from "node:fs";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import * as evo from "./wa-evolution";
import { aiBridgeLink, aiHost, maskJid } from "./wa-assistant";

const env = (k: string) => (process.env[k] || "").trim();

// ───────────────────────── настройки ─────────────────────────

const MIN = 60_000;
const HOUR = 3600_000;
const DAY = 24 * HOUR;
/** Сколько помним ключи уже отправленных ответов. */
const SENT_KEEP_MS = 7 * DAY;
/** Журнал хранит записи не старше этого срока при сжатии. */
const JOURNAL_KEEP_MS = 14 * DAY;
const JOURNAL_COMPACT_BYTES = 4 * 1024 * 1024;
const JOURNAL_TAIL_BYTES = 2 * 1024 * 1024;
const AUDIO_MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const TEXT_MAX = 16_000;
const SEND_TEXT_MAX = 4000;
const SEND_BODY_MAX = 64 * 1024;

/** WA_BRIDGE=on: мост включён. Всё остальное, включая пустое значение, это «выключен». */
export const bridgeOn = () => env("WA_BRIDGE").toLowerCase() === "on";
const secret = () => env("WA_BRIDGE_SECRET");
const botUrl = () => env("WA_BRIDGE_URL") || "https://ig.onai.academy/wa/inbound";
const allowIps = () => (env("WA_BRIDGE_ALLOW_IP") || "188.137.233.28").split(",").map((s) => s.trim()).filter(Boolean);
/** Работает ли мост: включён и задан секрет (без секрета подпись невозможна, остаётся «выключен»). */
export const bridgeActive = () => bridgeOn() && !!secret();
const imagesOn = () => env("WA_BRIDGE_IMAGES").toLowerCase() === "on";
const timeoutMs = () => {
  const n = Number(env("WA_BRIDGE_TIMEOUT_MS"));
  return Number.isFinite(n) && n > 0 ? n : 10_000;
};
/** Паузы перед повторами пересылки, мс. По умолчанию 1 и 3 секунды. */
const retryDelays = (): number[] => {
  const raw = env("WA_BRIDGE_RETRY_MS");
  if (!raw) return [1000, 3000];
  const out = raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n >= 0);
  return out.length ? out : [1000, 3000];
};
const mediaRetryMs = () => {
  const n = Number(env("WA_BRIDGE_MEDIA_RETRY_MS"));
  return Number.isFinite(n) && n >= 0 && env("WA_BRIDGE_MEDIA_RETRY_MS") !== "" ? n : 2000;
};

// ───────────────────────── подпись ─────────────────────────

/** hex(HMAC-SHA256(сырое тело, секрет)). */
export function sign(raw: string | Buffer): string {
  return createHmac("sha256", secret()).update(raw).digest("hex");
}

/** Подпись верна: сравнение за постоянное время; пустой секрет, пустая и не-hex подпись неверны всегда. */
export function signatureOk(raw: Buffer, header: string | undefined): boolean {
  const key = secret();
  if (!key || !header || !/^[0-9a-f]{64}$/i.test(header)) return false;
  const expect = createHmac("sha256", key).update(raw).digest();
  return timingSafeEqual(Buffer.from(header, "hex"), expect);
}

// ───────────────────────── состояние ─────────────────────────

type Kind = "fwd_ok" | "fwd_off" | "fwd_err" | "fwd_nonum" | "snd_ok" | "snd_dup" | "snd_err";
type Ev = { t: number; k: Kind };
type SendOk = { ok: true; id: string };
type SendFail = { ok: false; error: string };

type St = {
  dir: string;
  sent: Map<string, { ts: number; id: string }>;
  inflight: Map<string, Promise<SendOk | SendFail>>;
  chains: Map<string, Promise<unknown>>;
  seen: Set<string>;
  events: Ev[];
  alarmAt: Map<string, number>;
  denyAt: Map<string, number>;
  lastFwd: { t: number; code: number; text: string } | null;
  lastIn: number;
  appends: number;
};

let S: St | null = null;

const host = () => aiHost();
const nowMs = () => host()?.now() ?? Date.now();
const dataDir = () => host()?.dir || env("DATA_DIR") || join(__dirname, "data");
const fSent = (dir: string) => join(dir, "wa-bridge-sent.jsonl");
const fJournal = (dir: string) => join(dir, "wa-bridge.jsonl");
const iso = (ms: number) => new Date(ms).toISOString();
const log = (msg: string, ...args: unknown[]) => console.log(`[wa-bridge] ${msg}`, ...args);

/** Из текстов ошибок убираем секрет моста и ключ Evolution. */
function scrub(s: string): string {
  let out = s;
  for (const k of [secret(), evo.evoKey()]) if (k) out = out.split(k).join("***");
  return out;
}
const clip = (s: unknown, n: number) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

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

function writeAtomic(file: string, rows: unknown[]) {
  const tmp = `${file}.tmp.${process.pid}`;
  writeFileSync(tmp, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""), "utf8");
  renameSync(tmp, file);
}

function append(file: string, row: unknown) {
  try {
    appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    console.error("[wa-bridge] не смог дописать %s:", file, (e as Error).message);
  }
}

const kindOfRow = (r: any): Kind | null => {
  if (r?.ev === "fwd") return r.ok ? "fwd_ok" : r.code === 404 ? "fwd_off" : "fwd_err";
  if (r?.ev === "send") return r.ok ? (r.dup ? "snd_dup" : "snd_ok") : "snd_err";
  return null;
};

/** Состояние моста: при первом обращении (и при смене каталога данных) читает файлы. Это же «восстановление после рестарта». */
function st(): St {
  const dir = dataDir();
  if (S && S.dir === dir) return S;
  mkdirSync(dir, { recursive: true });
  const now = nowMs();
  const s: St = { dir, sent: new Map(), inflight: new Map(), chains: new Map(), seen: new Set(), events: [], alarmAt: new Map(), denyAt: new Map(), lastFwd: null, lastIn: 0, appends: 0 };
  // Ключи отправленных ответов: последние 7 дней. Устаревшие и повторы убираем из файла сразу.
  try {
    const rows: any[] = [];
    if (existsSync(fSent(dir))) {
      for (const line of readFileSync(fSent(dir), "utf8").split("\n")) {
        try {
          if (line.trim()) rows.push(JSON.parse(line));
        } catch {
          /* битую строку пропускаем */
        }
      }
    }
    for (const r of rows) if (typeof r?.key === "string" && typeof r?.ts === "number" && now - r.ts < SENT_KEEP_MS) s.sent.set(r.key, { ts: r.ts, id: String(r.id || "") });
    if (rows.length !== s.sent.size) writeAtomic(fSent(dir), [...s.sent].map(([key, v]) => ({ ts: v.ts, key, id: v.id })));
  } catch (e) {
    console.error("[wa-bridge] не смог прочитать wa-bridge-sent.jsonl:", (e as Error).message);
  }
  // Журнал: счётчики за сутки и последний ответ бота; раздулся, значит оставляем хвост за 14 дней.
  try {
    if (existsSync(fJournal(dir)) && statSync(fJournal(dir)).size > JOURNAL_COMPACT_BYTES) compactJournal(dir, now);
    for (const r of readTail(fJournal(dir), JOURNAL_TAIL_BYTES)) {
      const t = Date.parse(String(r?.ts || ""));
      const k = kindOfRow(r);
      if (!Number.isFinite(t) || !k) continue;
      if (now - t < DAY) {
        s.events.push({ t, k });
        if (r.ev === "fwd" && r.nonum) s.events.push({ t, k: "fwd_nonum" });
      }
      if (r.ev === "fwd") s.lastFwd = { t, code: Number(r.code) || 0, text: "" };
      if (r.ev === "send") s.lastIn = Math.max(s.lastIn, t);
    }
  } catch (e) {
    console.error("[wa-bridge] не смог прочитать wa-bridge.jsonl:", (e as Error).message);
  }
  S = s;
  return s;
}

function compactJournal(dir: string, now: number) {
  const keep = readTail(fJournal(dir), JOURNAL_TAIL_BYTES).filter((r) => now - Date.parse(String(r?.ts || "")) < JOURNAL_KEEP_MS);
  writeAtomic(fJournal(dir), keep);
}

function journal(s: St, row: Record<string, unknown>) {
  append(fJournal(s.dir), { ts: iso(nowMs()), ...row });
  if (++s.appends % 500 === 0) {
    try {
      if (statSync(fJournal(s.dir)).size > JOURNAL_COMPACT_BYTES) compactJournal(s.dir, nowMs());
    } catch {
      /* не страшно: сожмём при следующем запуске */
    }
  }
}

function noteEvent(s: St, k: Kind) {
  const t = nowMs();
  s.events.push({ t, k });
  if (s.events.length > 20_000 || (s.events.length && t - s.events[0].t > DAY + HOUR)) s.events = s.events.filter((e) => t - e.t < DAY);
}

/** Тревога владельцам: не чаще раза в час на ключ. Тексты без номеров и без секрета. */
async function alarmOnce(s: St, key: string, text: string) {
  const t = nowMs();
  if (t - (s.alarmAt.get(key) || 0) < HOUR) return;
  s.alarmAt.set(key, t);
  const h = host();
  try {
    if (h) await h.alarm(text);
    else console.warn("[wa-bridge] тревога: %s", text);
  } catch {
    /* Telegram недоступен: тревога осталась в журнале модуля */
  }
}

// ───────────────────────── разбор события Evolution ─────────────────────────

export type Media = { type: "audio" | "image" | "video" | "document"; mime?: string; base64?: string; seconds?: number };
export type Inbound = { source: "wa-bridge"; jid: string; number: string; name: string; id: string; ts: number; fromMe: boolean; text: string; media: Media | null };

/** Личный чат: цифры@s.whatsapp.net или цифры@lid. Группы (@g.us, сообщества), @broadcast, @newsletter и прочее не подходят. */
const PERSON = /^(\d{5,20})(?::\d+)?@(s\.whatsapp\.net|lid)$/;
/** Настоящий телефон: 10-15 цифр, в виде JID или просто цифрами. */
const PHONE = /^(\d{10,15})(?::\d+)?(?:@s\.whatsapp\.net)?$/;
const WRAPPERS = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "documentWithCaptionMessage"];
const MEDIA_NODES: Array<[string, Media["type"]]> = [
  ["audioMessage", "audio"],
  ["imageMessage", "image"],
  ["videoMessage", "video"],
  ["ptvMessage", "video"],
  ["documentMessage", "document"],
];

function unwrap(m: any): any {
  let cur = m;
  for (let i = 0; i < 4 && cur && typeof cur === "object"; i++) {
    let inner: any = null;
    for (const w of WRAPPERS) if (cur[w]?.message) inner = cur[w].message;
    if (!inner) break;
    cur = inner;
  }
  return cur;
}

function secondsOf(ts: unknown): number {
  let n = 0;
  if (typeof ts === "number") n = ts;
  else if (typeof ts === "string") n = Number(ts);
  else if (ts && typeof ts === "object") n = Number((ts as any).low ?? (ts as any).toString?.());
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n > 1e12 ? n / 1000 : n);
}

const numOf = (x: unknown): number => {
  const n = typeof x === "object" && x ? Number((x as any).low ?? (x as any).toString?.()) : Number(x);
  return Number.isFinite(n) ? n : 0;
};

function cleanMime(x: unknown, fallback: string): string {
  const s = String(x || "").split(";")[0].trim().toLowerCase();
  return /^[a-z]+\/[a-z0-9.+-]+$/.test(s) ? s : fallback;
}

/** Телефон человека. Для @s.whatsapp.net это сам JID. У @lid Evolution 2.3.7 сам подменяет remoteJid на телефон, если WhatsApp его отдал
 *  (remoteJidAlt); иначе ищем в key.remoteJidAlt, key.senderPn, data.senderPn. Не нашёлся: пустая строка (бот тогда не отвечает). */
function phoneOf(jid: string, key: any, d: any): string {
  const own = jid.endsWith("@s.whatsapp.net") ? PHONE.exec(jid) : null;
  if (own) return own[1];
  if (jid.endsWith("@s.whatsapp.net")) return "";
  for (const c of [key?.remoteJidAlt, key?.senderPn, d?.senderPn, d?.remoteJidAlt]) {
    const x = PHONE.exec(String(c || ""));
    if (x) return x[1];
  }
  return "";
}

/**
 * Одно событие messages.upsert (data из тела вебхука) в то, что уходит боту. null: не личный чат, нет содержимого (реакция, правка,
 * системное, стикер, контакт, геометка). Сообщение без id не бывает: берём хеш от чата, времени и текста.
 */
export function toInbound(d: any): (Inbound & { _node?: any; _raw?: any }) | null {
  const key = d?.key;
  if (!key || typeof key !== "object") return null;
  const person = PERSON.exec(String(key.remoteJid || ""));
  if (!person) return null;
  const jid = `${person[1]}@${person[2]}`;
  const m = unwrap(d.message);
  if (!m || typeof m !== "object") return null;
  const clipText = (s: string) => s.replace(/\u0000/g, "").trim().slice(0, TEXT_MAX);
  let text = "";
  for (const v of [m.conversation, m.extendedTextMessage?.text, m.buttonsResponseMessage?.selectedDisplayText, m.templateButtonReplyMessage?.selectedDisplayText, m.listResponseMessage?.title]) {
    if (typeof v === "string" && v.trim()) {
      text = clipText(v);
      break;
    }
  }
  let media: Media | null = null;
  let node: any = null;
  if (!text) {
    for (const [field, type] of MEDIA_NODES) {
      if (!m[field] || typeof m[field] !== "object") continue;
      node = m[field];
      media = { type };
      text = typeof node.caption === "string" ? clipText(node.caption) : "";
      break;
    }
  } else {
    // Текст с вложением бывает только как подпись; обычное сообщение медиа не несёт.
    for (const [field, type] of MEDIA_NODES) if (m[field] && typeof m[field] === "object") (node = m[field]), (media = { type });
  }
  if (!text && !media) return null;
  const fromMe = key.fromMe === true;
  const ts = secondsOf(d.messageTimestamp) || Math.floor(nowMs() / 1000);
  const id = typeof key.id === "string" && key.id ? key.id.slice(0, 100) : createHash("sha1").update(`${jid}|${ts}|${text}`).digest("hex");
  // pushName у своих сообщений это имя нашего номера, а не человека: имя собеседника не выдаём.
  const name = !fromMe && typeof d.pushName === "string" ? d.pushName.replace(/\u0000/g, "").trim().slice(0, 100) : "";
  return { source: "wa-bridge", jid, number: phoneOf(jid, key, d), name, id, ts, fromMe, text, media, _node: node, _raw: d };
}

// ───────────────────────── файлы вложений ─────────────────────────

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Голосовое (и фото, если WA_BRIDGE_IMAGES=on) в base64 у Evolution. Нет файла или он больше лимита: уходит без base64. */
async function attachFile(m: Inbound & { _node?: any; _raw?: any }, s: St): Promise<void> {
  const media = m.media;
  const node = m._node;
  if (!media || !node) return;
  if (media.type === "audio") {
    media.mime = cleanMime(node.mimetype, "audio/ogg");
    const sec = numOf(node.seconds);
    if (sec > 0) media.seconds = Math.round(sec);
  } else if (media.type === "image") {
    if (!imagesOn()) return;
    media.mime = cleanMime(node.mimetype, "image/jpeg");
  } else return;
  const limit = media.type === "audio" ? AUDIO_MAX_BYTES : IMAGE_MAX_BYTES;
  const declared = numOf(node.fileLength);
  if (declared > limit) {
    journal(s, { ev: "media", id: m.id, type: media.type, ok: false, error: "больше лимита" });
    return;
  }
  let err = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await wait(mediaRetryMs());
    const r = await evo.mediaBase64(m._raw.key, m._raw.message);
    if (r.ok) {
      const size = Math.floor((r.data.base64.length * 3) / 4);
      if (size > limit) {
        journal(s, { ev: "media", id: m.id, type: media.type, ok: false, error: "больше лимита" });
        return;
      }
      media.base64 = r.data.base64;
      media.mime = cleanMime(r.data.mimetype, media.mime || "");
      return;
    }
    err = r.error;
  }
  journal(s, { ev: "media", id: m.id, type: media.type, ok: false, error: clip(scrub(err), 120) });
}

// ───────────────────────── пересылка в бота ─────────────────────────

type BotRes = { status: number; text: string; error?: string };

async function postBot(raw: string): Promise<BotRes> {
  try {
    const res = await fetch(botUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Wa-Signature": sign(raw) },
      body: raw,
      signal: AbortSignal.timeout(timeoutMs()),
    });
    const text = clip(await res.text(), 120);
    return { status: res.status, text };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const why = err?.name === "TimeoutError" || err?.name === "AbortError" ? "timeout" : String(err?.cause?.code || err?.message || err);
    return { status: 0, text: "", error: clip(scrub(why), 80) };
  }
}

async function forward(m: Inbound & { _node?: any; _raw?: any }): Promise<void> {
  const s = st();
  await attachFile(m, s);
  const { _node, _raw, ...body } = m;
  void _node;
  void _raw;
  const raw = JSON.stringify(body);
  const t0 = Date.now();
  const delays = retryDelays();
  let res: BotRes = { status: 0, text: "" };
  let tries = 0;
  for (;;) {
    tries++;
    res = await postBot(raw);
    // Повторяем только 5xx и сетевую ошибку. 200, 404, 403 и прочие 4xx повторов не получают.
    if (!(res.status === 0 || res.status >= 500) || tries > delays.length) break;
    await wait(delays[tries - 1]);
  }
  const ms = Date.now() - t0;
  const ok = res.status === 200;
  const off = res.status === 404;
  const nonum = !m.number;
  journal(s, { ev: "fwd", id: m.id, ok, code: res.status, ms, tries, fromMe: m.fromMe, ...(m.media ? { media: m.media.type, b64: !!m.media.base64 } : {}), ...(nonum ? { nonum: true } : {}), ...(res.error ? { err: res.error } : {}), ...(off ? { off: true } : {}) });
  noteEvent(s, ok ? "fwd_ok" : off ? "fwd_off" : "fwd_err");
  if (nonum) noteEvent(s, "fwd_nonum");
  s.lastFwd = { t: nowMs(), code: res.status, text: res.error || res.text };
  if (ok || off) return;
  log("не переслано (%s): %s", maskJid(m.jid), res.status ? `код ${res.status}` : res.error);
  const why = res.status === 403 ? "бот отклонил подпись (403), проверьте WA_BRIDGE_SECRET с обеих сторон" : res.status ? `бот ответил кодом ${res.status}` : `бот не отвечает (${res.error || "сеть"})`;
  await alarmOnce(s, "fwd", `Мост WhatsApp в бота: сообщение не переслано, ${why}. Попыток ${tries}. Следующая тревога об этом не раньше чем через час.`);
}

/** Поставить сообщение в очередь своего чата: сообщения одного человека уходят по порядку, разных людей параллельно. */
function enqueue(m: Inbound & { _node?: any; _raw?: any }) {
  const s = st();
  const prev = s.chains.get(m.jid) ?? Promise.resolve();
  const next: Promise<unknown> = prev
    .then(() => forward(m))
    .catch((e) => console.error("[wa-bridge] пересылка упала:", scrub(String((e as Error)?.message || e)).slice(0, 160)))
    .finally(() => {
      if (s.chains.get(m.jid) === next) s.chains.delete(m.jid);
    });
  s.chains.set(m.jid, next);
}

/** Тело вебхука Evolution от wa-assistant. Возвращается сразу, пересылка идёт в фоне; ошибки не выходят наружу. */
export function bridgeTap(body: any): void {
  if (!bridgeActive()) return;
  try {
    const ev = String(body?.event || "").toLowerCase().replace(/_/g, ".");
    if (ev !== "messages.upsert") return;
    if (body?.instance && String(body.instance) !== evo.evoInstance()) return;
    const list = Array.isArray(body?.data) ? body.data : body?.data ? [body.data] : [];
    const s = st();
    for (const d of list) {
      const m = toInbound(d);
      if (!m) continue;
      // Evolution может повторить вебхук: одно и то же сообщение боту дважды не шлём.
      const dedupe = `${m.jid}|${m.id}`;
      if (s.seen.has(dedupe)) continue;
      s.seen.add(dedupe);
      if (s.seen.size > 5000) s.seen.delete(s.seen.values().next().value as string);
      enqueue(m);
    }
  } catch (e) {
    console.error("[wa-bridge] не разобрал вебхук:", scrub(String((e as Error)?.message || e)).slice(0, 160));
  }
}

/** Для тестов: дождаться всей поставленной в очередь пересылки. */
export async function bridgeIdle(): Promise<void> {
  for (let i = 0; i < 50; i++) {
    const s = S;
    if (!s || !s.chains.size) return;
    await Promise.allSettled([...s.chains.values()]);
  }
}

// ───────────────────────── POST /api/wa/send ─────────────────────────

const LOCAL = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const normIp = (ip: string) => ip.trim().replace(/^::ffff:/i, "");

/**
 * IP клиента. Соединение пришло с 127.0.0.1 (nginx): X-Real-IP, иначе X-Forwarded-For. Иначе адрес сокета, заголовкам не верим.
 * В X-Forwarded-For берём ПОСЛЕДНИЙ адрес: его дописал наш nginx, а первый клиент может подделать. Если адрес один, это то же самое.
 */
export function clientIp(req: Pick<IncomingMessage, "socket" | "headers">): string {
  const sock = req.socket.remoteAddress || "";
  if (!LOCAL.has(sock)) return normIp(sock);
  const one = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h) || "";
  const real = one(req.headers["x-real-ip"]).trim();
  if (real) return normIp(real);
  const xff = one(req.headers["x-forwarded-for"]).split(",").map((x) => x.trim()).filter(Boolean);
  if (xff.length) return normIp(xff[xff.length - 1]);
  return normIp(sock);
}

function readBytes(req: IncomingMessage, max: number): Promise<Buffer | null> {
  return new Promise((resolve) => {
    let size = 0;
    let over = false;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > max) over = true;
      else chunks.push(c);
    });
    req.on("end", () => resolve(over ? null : Buffer.concat(chunks)));
    req.on("error", () => resolve(null));
  });
}

/** Отказ в журнал, но не чаще раза в минуту на причину: сканирование журнал не раздувает. */
function deny(s: St, why: string, ip: string) {
  const t = nowMs();
  if (t - (s.denyAt.get(why) || 0) < MIN) return;
  s.denyAt.set(why, t);
  journal(s, { ev: "deny", why, ip: clip(ip, 45) });
}

async function sendReply(s: St, number: string, text: string): Promise<SendOk | SendFail> {
  const h = host();
  const can = h?.canSend();
  if (can && !can.ok) return { ok: false, error: can.why };
  const run = () => evo.sendText(`${number}@s.whatsapp.net`, text);
  const r = await (h ? h.exclusive(run) : run());
  if (!r.ok) return { ok: false, error: clip(scrub(r.error), 160) };
  return { ok: true, id: r.data.messageId };
}

/** Забыть ключи старше 7 дней и переписать файл (раз в 200 записей). */
function pruneSent(s: St) {
  const t = nowMs();
  for (const [k, v] of s.sent) if (t - v.ts >= SENT_KEEP_MS) s.sent.delete(k);
  try {
    writeAtomic(fSent(s.dir), [...s.sent].map(([key, v]) => ({ ts: v.ts, key, id: v.id })));
  } catch (e) {
    console.error("[wa-bridge] не смог сжать wa-bridge-sent.jsonl:", (e as Error).message);
  }
}

export async function handleWaSend(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const reply = (status: number, body: unknown) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
    res.end(payload);
  };
  if (!bridgeActive()) {
    req.resume();
    return reply(404, { ok: false, error: "off" });
  }
  const s = st();
  const ip = clientIp(req);
  if (!allowIps().includes(ip)) {
    req.resume();
    deny(s, "ip", ip);
    return reply(403, { ok: false, error: "forbidden" });
  }
  const bytes = await readBytes(req, SEND_BODY_MAX);
  if (bytes === null) return reply(413, { ok: false, error: "too_large" });
  const sigHeader = req.headers["x-wa-signature"];
  if (!signatureOk(bytes, Array.isArray(sigHeader) ? sigHeader[0] : sigHeader)) {
    deny(s, "sig", ip);
    return reply(403, { ok: false, error: "forbidden" });
  }
  s.lastIn = nowMs();
  let b: any = null;
  try {
    b = JSON.parse(bytes.toString("utf8"));
  } catch {
    b = null;
  }
  const number = typeof b?.number === "string" ? b.number : "";
  const text = typeof b?.text === "string" ? b.text : "";
  const key = typeof b?.key === "string" ? b.key : "";
  if (!/^\d{10,15}$/.test(number)) return reply(400, { ok: false, error: "bad_number" });
  if (!text.trim() || text.length > SEND_TEXT_MAX) return reply(400, { ok: false, error: "bad_text" });
  if (!/^[A-Za-z0-9_.:-]{8,128}$/.test(key)) return reply(400, { ok: false, error: "bad_key" });

  const t0 = Date.now();
  for (let guard = 0; guard < 5; guard++) {
    if (s.sent.has(key)) {
      journal(s, { ev: "send", key, ok: true, dup: true });
      noteEvent(s, "snd_dup");
      return reply(200, { ok: true, dup: true });
    }
    const running = s.inflight.get(key);
    if (running) {
      // Параллельный повтор того же ключа ждёт первую отправку: удалась, значит dup; не удалась, пробуем сами.
      await running.catch(() => undefined);
      continue;
    }
    const job = sendReply(s, number, text);
    s.inflight.set(key, job);
    let r: SendOk | SendFail;
    try {
      r = await job;
    } catch (e) {
      r = { ok: false, error: clip(scrub(String((e as Error)?.message || e)), 160) };
    } finally {
      s.inflight.delete(key);
    }
    const ms = Date.now() - t0;
    if (r.ok) {
      const ts = nowMs();
      s.sent.set(key, { ts, id: r.id });
      append(fSent(s.dir), { ts, key, id: r.id });
      if (s.sent.size % 200 === 0) pruneSent(s);
      journal(s, { ev: "send", key, ok: true, id: r.id, ms });
      noteEvent(s, "snd_ok");
      log("ответ ушёл: %s", maskJid(`${number}@s.whatsapp.net`));
      return reply(200, { ok: true, id: r.id });
    }
    journal(s, { ev: "send", key, ok: false, error: r.error, ms });
    noteEvent(s, "snd_err");
    log("ответ не ушёл (%s): %s", maskJid(`${number}@s.whatsapp.net`), r.error);
    await alarmOnce(s, "send", `Мост WhatsApp в бота: ответ человеку не отправился (${clip(r.error, 100)}). Бот повторит сам. Следующая тревога об этом не раньше чем через час.`);
    return reply(502, { ok: false, error: r.error });
  }
  return reply(502, { ok: false, error: "busy" });
}

// ───────────────────────── команда владельца и запуск ─────────────────────────

const agoText = (ms: number) => {
  const sec = Math.max(0, Math.round(ms / 1000));
  return sec < 90 ? `${sec} с назад` : sec < 5400 ? `${Math.round(sec / 60)} мин назад` : `${Math.round(sec / 3600)} ч назад`;
};

/** Текст команды /wa_bridge: состояние, счётчики за сутки, последний ответ бота. Секрет и адреса людей не показываются. */
export function bridgeStatusText(): string {
  const on = bridgeOn();
  const hasSecret = !!secret();
  if (!on) return "Мост WhatsApp в бота: выключен (WA_BRIDGE не on). Включается только в .env на сервере и перезапуском form-api.";
  const head = hasSecret ? "включён" : "включён в .env, но нет WA_BRIDGE_SECRET: пересылка и ответы не работают";
  if (!hasSecret) return `Мост WhatsApp в бота: ${head}.`;
  const s = st();
  const t = nowMs();
  const count = (k: Kind) => s.events.filter((e) => e.k === k && t - e.t < DAY).length;
  let hostName = "";
  try {
    hostName = new URL(botUrl()).host;
  } catch {
    hostName = "адрес бота задан неверно";
  }
  const hook = host()?.state().hookOn;
  return [
    `Мост WhatsApp в бота: ${head}.`,
    `Бот: ${hostName}`,
    `За сутки в бота: переслано ${count("fwd_ok")}, ошибок ${count("fwd_err")}, бот выключил канал (404) ${count("fwd_off")}, без телефона (lid) ${count("fwd_nonum")}.`,
    `За сутки от бота: отправлено ${count("snd_ok")}, повторов ${count("snd_dup")}, ошибок ${count("snd_err")}.`,
    `Последний ответ бота: ${s.lastFwd ? `${s.lastFwd.code || "нет связи"}${s.lastFwd.text ? ` ${s.lastFwd.text}` : ""}, ${agoText(t - s.lastFwd.t)}` : "ещё не было"}.`,
    `Последний запрос от бота: ${s.lastIn ? agoText(t - s.lastIn) : "ещё не было"}.`,
    `Вебхук Evolution: ${hook === undefined ? "модуль WhatsApp не запущен" : hook ? "стоит" : "не стоит"}.`,
  ].join("\n");
}

/** Запуск из server.ts: подписывает мост на вебхук Evolution. Выключенный мост ничего не пересылает и вебхук не просит. */
export function startWaBridge(): void {
  aiBridgeLink({ tap: bridgeTap, wantsHook: bridgeActive });
  if (!bridgeOn()) return;
  if (!secret()) console.error("[wa-bridge] WA_BRIDGE=on, но нет WA_BRIDGE_SECRET: мост не работает");
  else log("включён, бот %s", (() => { try { return new URL(botUrl()).host; } catch { return "?"; } })());
}

/** Для тестов: забыть состояние в памяти (так выглядит перезапуск процесса) и снять подписку. */
export function bridgeReset(unlink = false): void {
  S = null;
  if (unlink) aiBridgeLink(null);
}

export const _bridge = { toInbound, clientIp, sign, signatureOk, phoneOf };
