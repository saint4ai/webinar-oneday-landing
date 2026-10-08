/**
 * WhatsApp-сообщества эфира вместо EasyBot. Включается только флагом WA_GROUPS=on, иначе ничего не стартует.
 *
 * Что делает модуль (подробно в docs/plans/wa-communities-plan.md и docs/tasks/wa_groups.md):
 *  - в 20:00 накануне эфира D создаёт сообщество эфира (запасной тип: обычная группа), сразу ставит настройки:
 *    писать только админам, добавлять участников только админам, вступление по заявке; берёт ссылку-приглашение,
 *    ставит аватарку, шлёт приветствие во вкладку объявлений;
 *  - ссылка на сайте (/api/whatsapp-link) ведёт в сообщество того дня, на который сейчас записывает бот
 *    (assignStreamDay): переключение в 20:40, на границе окна записи на идущий эфир;
 *  - раз в 15 или 30 секунд одобряет заявки на вступление и пишет журнал «кто вступил» (сырые атрибуты заявки);
 *  - по расписанию wa-series.json шлёт прогрев в день эфира D во вкладку объявлений;
 *  - около лимита участников открывает следующее сообщество того же эфира «(2)»;
 *  - защита номера: никаких личных сообщений и добавления людей (кроме WA_ADMIN_NUMBERS у запасного типа «группа»),
 *    паузы между отправками, не больше 3 новых сообществ в сутки, все запросы к Evolution строго по одному,
 *    пауза модуля и тревога владельцам в Telegram после 3 ошибок подряд, тревога раз в час при потере подключения.
 *
 * Состояние: DATA_DIR/wa-state.json (перезапись через temp и rename), журналы wa-journal.jsonl (отправки и события)
 * и wa-joins.jsonl (заявки и вступления). Токены и ключи в журналы не пишутся.
 * Настройки читаются лениво: loadEnv() в server.ts выполняется после импортов.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as evo from "./wa-evolution";
import { isValidWhatsAppLink } from "../lib/whatsapp-link";
import { DEFAULT_JOIN_MINUTES, addDays, assignStreamDay, atTime, dayKeyOf, dayWordLower, hhmmOf, isDayKey, isStreamDay, parseHHMM, type TimeCfg } from "./tg-time";
import { getSeries, notifyOwners, registerWa, registerWaReport, timeCfg, type WaReply } from "./tg-workshop";

const env = (k: string) => (process.env[k] || "").trim();

export const waEnabled = () => env("WA_GROUPS").toLowerCase() === "on";
/** Номера менеджера (Аяна) через запятую, только цифры: добавляются и становятся админами только у запасного типа «группа». */
export const adminNumbers = () => env("WA_ADMIN_NUMBERS").split(",").map((s) => s.replace(/\D/g, "")).filter((s) => s.length >= 10);

const MIN = 60_000;
const HOUR = 3600_000;
const TICK_MS = 30_000;
const JOINS_TICK_MS = 5_000;
const LOCK_STALE_MS = 3 * TICK_MS;

// ───────────────────────── расписание wa-series.json ─────────────────────────

export type Kind = "community" | "group";
export type WaMsg = {
  id: string;
  at: string;
  topic?: string;
  enabled?: boolean;
  text: string;
  media?: { type: "image" | "video"; url: string };
  poll?: { name: string; options: string[]; selectableCount?: number };
};
type Range = [number, number];
export type WaSeries = {
  version: string;
  timezone: string;
  streamStart: string;
  streamMinutes: number;
  joinLiveMinutes?: number;
  firstDay?: string;
  skipDays?: string[];
  graceMinutes: number;
  target: Kind;
  createCatchupHours: number;
  closeAt: string;
  maxNewPerDay: number;
  overflowAt: { community: number; group: number };
  memberCheckMinutes: number;
  captionLimit: number;
  pacing: { betweenSendsMs: Range; betweenStepsMs: Range };
  retry: { backoffSec: number[]; pauseAfter: number };
  /**
   * servingSec: интервал опроса заявок у сообщества, на которое сейчас ведёт ссылка; otherSec: у остальных.
   * Необязательный щадящий режим: idleSec и hotMinutes. Если заданы, то «горячий» интервал servingSec действует
   * hotMinutes минут после выдачи ссылки на сайте или после найденных заявок, а в остальное время опрос идёт реже, по idleSec.
   */
  joinPolling: { servingSec: Range; otherSec: Range; batch: number; keepAfterCloseMin: number; idleSec?: Range; hotMinutes?: number };
  alarms: { connectionEveryMinutes: number };
  name: string;
  description: string;
  welcome: string;
  avatar: string[];
  messages: WaMsg[];
};

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

function allStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => allStrings(v, out));
  else if (isObj(x)) Object.values(x).forEach((v) => allStrings(v, out));
  return out;
}

function range(x: unknown, where: string): Range {
  if (!Array.isArray(x) || x.length !== 2 || x.some((n) => typeof n !== "number" || n < 0) || x[0] > x[1]) throw new Error(`wa-series: ${where} должен быть парой [от, до] по возрастанию`);
  return [x[0], x[1]];
}

/** Проверка расписания. Бросает Error с понятным текстом: модуль при этом не стартует, остальной сервис живёт. */
export function validateWaSeries(raw: unknown): WaSeries {
  if (!isObj(raw)) throw new Error("wa-series: корень должен быть объектом");
  for (const s of allStrings(raw)) if (s.includes(String.fromCharCode(0x2014))) throw new Error(`wa-series: длинное тире в «${s.slice(0, 50)}»`);
  if (raw.timezone !== "Asia/Almaty") throw new Error("wa-series: timezone должен быть Asia/Almaty");
  if (typeof raw.version !== "string") throw new Error("wa-series: нет version");
  for (const k of ["streamStart", "closeAt"]) {
    try {
      parseHHMM(String(raw[k]));
    } catch {
      throw new Error(`wa-series: ${k} вида HH:MM`);
    }
  }
  for (const k of ["streamMinutes", "graceMinutes", "createCatchupHours", "maxNewPerDay", "memberCheckMinutes", "captionLimit"]) {
    if (typeof raw[k] !== "number" || (raw[k] as number) <= 0) throw new Error(`wa-series: ${k} должен быть числом больше 0`);
  }
  if (raw.firstDay !== undefined && !isDayKey(raw.firstDay)) throw new Error("wa-series: firstDay вида YYYY-MM-DD");
  if (raw.skipDays !== undefined && (!Array.isArray(raw.skipDays) || !raw.skipDays.every(isDayKey))) throw new Error("wa-series: skipDays массив дней YYYY-MM-DD");
  if (raw.target !== "community" && raw.target !== "group") throw new Error("wa-series: target это community или group");
  const of = raw.overflowAt;
  if (!isObj(of) || typeof of.community !== "number" || typeof of.group !== "number" || of.community < 10 || of.group < 10) throw new Error("wa-series: overflowAt { community, group } числа");
  const pc = raw.pacing;
  if (!isObj(pc)) throw new Error("wa-series: нет pacing");
  range(pc.betweenSendsMs, "pacing.betweenSendsMs");
  range(pc.betweenStepsMs, "pacing.betweenStepsMs");
  const rt = raw.retry;
  if (!isObj(rt) || !Array.isArray(rt.backoffSec) || !rt.backoffSec.length || typeof rt.pauseAfter !== "number" || rt.pauseAfter < 1) throw new Error("wa-series: retry { backoffSec: [..], pauseAfter }");
  const jp = raw.joinPolling;
  if (!isObj(jp)) throw new Error("wa-series: нет joinPolling");
  range(jp.servingSec, "joinPolling.servingSec");
  range(jp.otherSec, "joinPolling.otherSec");
  if (jp.idleSec !== undefined) range(jp.idleSec, "joinPolling.idleSec");
  if (jp.hotMinutes !== undefined && (typeof jp.hotMinutes !== "number" || jp.hotMinutes <= 0)) throw new Error("wa-series: joinPolling.hotMinutes число больше 0");
  if (typeof jp.batch !== "number" || jp.batch < 1 || typeof jp.keepAfterCloseMin !== "number") throw new Error("wa-series: joinPolling.batch и keepAfterCloseMin числа");
  if (!isObj(raw.alarms) || typeof raw.alarms.connectionEveryMinutes !== "number") throw new Error("wa-series: alarms.connectionEveryMinutes число");
  for (const k of ["name", "description", "welcome"]) if (typeof raw[k] !== "string" || !raw[k]) throw new Error(`wa-series: ${k} нужен непустой текст`);
  if (!Array.isArray(raw.avatar) || !raw.avatar.every((u) => typeof u === "string" && /^https:\/\//.test(u))) throw new Error("wa-series: avatar массив https-ссылок");
  if (!Array.isArray(raw.messages) || !raw.messages.length) throw new Error("wa-series: messages должен быть непустым массивом");
  const ids = new Set<string>();
  for (const m of raw.messages) {
    if (!isObj(m) || typeof m.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(m.id)) throw new Error("wa-series: у сообщения нужен id из букв, цифр, _ и -");
    if (ids.has(m.id)) throw new Error(`wa-series: id «${m.id}» повторяется`);
    ids.add(m.id);
    try {
      parseHHMM(String(m.at));
    } catch {
      throw new Error(`wa-series: сообщение ${m.id}: at вида HH:MM`);
    }
    if (typeof m.text !== "string" || !m.text.trim()) throw new Error(`wa-series: сообщение ${m.id}: нужен текст`);
    if (m.media !== undefined) {
      if (!isObj(m.media) || (m.media.type !== "image" && m.media.type !== "video") || typeof m.media.url !== "string" || !/^https:\/\//.test(m.media.url)) {
        throw new Error(`wa-series: сообщение ${m.id}: media { type: image|video, url: https://... }`);
      }
    }
    if (m.poll !== undefined) {
      const p = m.poll;
      if (!isObj(p) || typeof p.name !== "string" || !p.name || !Array.isArray(p.options) || p.options.length < 2 || p.options.length > 10 || new Set(p.options).size !== p.options.length) {
        throw new Error(`wa-series: сообщение ${m.id}: poll { name, options: 2..10 разных }`);
      }
    }
  }
  return raw as unknown as WaSeries;
}

// ───────────────────────── состояние ─────────────────────────

export type Step = "announce" | "addMode" | "approval" | "link" | "avatar" | "welcome";

export type Target = {
  /** `${день}#${номер}`; номер 2 и дальше у сообществ-переполнений. */
  id: string;
  day: string;
  seq: number;
  kind: Kind;
  /** JID сообщества (или группы). */
  jid: string;
  /** Куда уходят сообщения: JID вкладки объявлений сообщества или сама группа. */
  sendJid: string;
  name: string;
  createdAt: number;
  /** Ссылка-приглашение https://chat.whatsapp.com/... Пока пусто, ссылка на сайт не переключается. */
  link: string;
  done: Partial<Record<Step, boolean>>;
  tries: Partial<Record<Step, number>>;
  avatarAt: number;
  members?: number;
  membersAt?: number;
};

export type State = {
  v: 1;
  targets: Target[];
  paused: boolean;
  pausedAt: number;
  pausedReason: string;
  failStreak: number;
  retryAt: number;
  /** Метки времени созданных сообществ (и неясных попыток) за последние 48 часов: лимит в сутки. */
  creations: number[];
  /** Создание, ответ на которое не получили: повторять вслепую нельзя, нужна проверка человеком. */
  pendingCreate: { day: string; seq: number; kind: Kind; at: number } | null;
  lastConnAlertAt: number;
  lastQrAt: number;
  capAlertDay: string;
  ownerJid: string;
  ownerAt: number;
};

const freshState = (): State => ({
  v: 1,
  targets: [],
  paused: false,
  pausedAt: 0,
  pausedReason: "",
  failStreak: 0,
  retryAt: 0,
  creations: [],
  pendingCreate: null,
  lastConnAlertAt: 0,
  lastQrAt: 0,
  capAlertDay: "",
  ownerJid: "",
  ownerAt: 0,
});

export type Deps = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  rand: () => number;
  /** Сообщение всем владельцам в Telegram. */
  notify: (text: string) => Promise<number>;
};

const defaultDeps: Deps = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  rand: () => Math.random(),
  notify: (text) => notifyOwners(text),
};

type Rt = {
  cfg: WaSeries;
  state: State;
  dir: string;
  deps: Deps;
  timeOverride?: TimeCfg;
  /** Ключи «сообщение:часть|день|цель» успешных отправок. */
  sent: Set<string>;
  /** Заявки, по которым уже писали строку «request»: ключ «сообщество|jid». */
  seenReq: Set<string>;
  /** Одобренные заявки: ключ «сообщество|jid». */
  approved: Set<string>;
  /** Сколько раз по заявке не получилось: после 3 больше не трогаем. */
  approveFails: Map<string, number>;
  joinedCount: Map<string, number>;
  joinNextAt: Map<string, number>;
  /** Когда последний раз выдали ссылку на сайте и когда последний раз видели заявки (для щадящего режима опроса). */
  lastServedAt: number;
  lastRequestsAt: number;
  joinFailStreak: number;
  joinAlertAt: number;
  conn: { state: string; at: number };
  chain: Promise<unknown>;
  ticking: boolean;
  joining: boolean;
  mediaWarned: Set<string>;
  lockedOutLogged: boolean;
};

let rt: Rt | null = null;
let initError = "";

const fJournal = (r: Rt) => join(r.dir, "wa-journal.jsonl");
const fJoins = (r: Rt) => join(r.dir, "wa-joins.jsonl");
const fState = (r: Rt) => join(r.dir, "wa-state.json");
const fLock = (r: Rt) => join(r.dir, "wa.lock");

const iso = (ms: number) => new Date(ms).toISOString();
const need = (): Rt => {
  if (!rt) throw new Error("wa-groups не инициализирован");
  return rt;
};

function append(file: string, row: unknown) {
  try {
    appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    console.error("[wa] не смог дописать %s:", file, (e as Error).message);
  }
}

function readJsonl<T>(file: string): T[] {
  if (!existsSync(file)) return [];
  const out: T[] = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      out.push(JSON.parse(s) as T);
    } catch {
      /* битую строку пропускаем */
    }
  }
  return out;
}

function save(r: Rt) {
  try {
    const tmp = `${fState(r)}.tmp.${process.pid}`;
    writeFileSync(tmp, JSON.stringify(r.state, null, 2) + "\n", "utf8");
    renameSync(tmp, fState(r));
  } catch (e) {
    console.error("[wa] не смог записать wa-state.json:", (e as Error).message);
  }
}

function loadState(r: Rt): State {
  const st = freshState();
  try {
    if (!existsSync(fState(r))) return st;
    const raw = JSON.parse(readFileSync(fState(r), "utf8")) as Partial<State>;
    const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
    const str = (x: unknown) => (typeof x === "string" ? x : "");
    st.targets = Array.isArray(raw.targets) ? raw.targets.filter((t) => t && typeof t.id === "string" && typeof t.jid === "string").map((t) => ({ ...t, done: t.done || {}, tries: t.tries || {} })) : [];
    st.paused = raw.paused === true;
    st.pausedAt = num(raw.pausedAt);
    st.pausedReason = str(raw.pausedReason);
    st.failStreak = num(raw.failStreak);
    st.retryAt = num(raw.retryAt);
    st.creations = Array.isArray(raw.creations) ? raw.creations.filter((x) => typeof x === "number") : [];
    st.pendingCreate = raw.pendingCreate && typeof raw.pendingCreate.day === "string" ? raw.pendingCreate : null;
    st.lastConnAlertAt = num(raw.lastConnAlertAt);
    st.lastQrAt = num(raw.lastQrAt);
    st.capAlertDay = str(raw.capAlertDay);
    st.ownerJid = str(raw.ownerJid);
    st.ownerAt = num(raw.ownerAt);
  } catch {
    console.warn("[wa] wa-state.json нечитаем, начинаю с пустого состояния");
  }
  return st;
}

// ───────────────────────── старт ─────────────────────────

function seriesPath(explicit?: string) {
  return explicit || env("WA_SERIES_FILE") || join(__dirname, "wa-series.json");
}

export type InitOpts = { dir?: string; seriesFile?: string; deps?: Partial<Deps>; timeCfg?: TimeCfg; kind?: Kind };

/** Загрузить расписание и состояние. Бросает ошибку, если расписание не прошло проверку. Таймеры не запускает. */
export function initWaGroups(opts: InitOpts = {}): void {
  const cfg = validateWaSeries(JSON.parse(readFileSync(seriesPath(opts.seriesFile), "utf8")));
  const kindEnv = env("WA_TARGET").toLowerCase();
  if (kindEnv === "group" || kindEnv === "community") cfg.target = kindEnv;
  if (opts.kind) cfg.target = opts.kind;
  const dir = opts.dir || env("DATA_DIR") || join(__dirname, "data");
  mkdirSync(dir, { recursive: true });
  const r: Rt = {
    cfg,
    state: freshState(),
    dir,
    deps: { ...defaultDeps, ...(opts.deps || {}) },
    timeOverride: opts.timeCfg,
    sent: new Set(),
    seenReq: new Set(),
    approved: new Set(),
    approveFails: new Map(),
    joinedCount: new Map(),
    joinNextAt: new Map(),
    lastServedAt: 0,
    lastRequestsAt: 0,
    joinFailStreak: 0,
    joinAlertAt: 0,
    conn: { state: "unknown", at: 0 },
    chain: Promise.resolve(),
    ticking: false,
    joining: false,
    mediaWarned: new Set(),
    lockedOutLogged: false,
  };
  r.state = loadState(r);
  for (const row of readJsonl<any>(fJournal(r))) {
    if (row?.ev === "send" && row.ok && row.msg && row.day && row.target) r.sent.add(sentKey(row.msg, row.part || "main", row.day, row.target));
  }
  for (const row of readJsonl<any>(fJoins(r))) {
    if (!row?.community || !row.jid) continue;
    const k = `${row.community}|${row.jid}`;
    if (row.ev === "request") r.seenReq.add(k);
    if (row.ev === "approve" && row.ok) {
      r.approved.add(k);
      if (row.target) r.joinedCount.set(row.target, (r.joinedCount.get(row.target) || 0) + 1);
    }
  }
  rt = r;
  initError = "";
}

/** Остановить и забыть модуль (для тестов и перезагрузки). */
export function resetWaGroups(): void {
  if (rt) releaseLock(rt);
  rt = null;
  initError = "";
}

/** Для тестов: текущее состояние и настройки. */
export const _waRt = () => rt;

/**
 * Запуск из server.ts. Без WA_GROUPS=on ничего не делает: ни файлов, ни таймеров, ни запросов.
 * Возвращает функцию остановки.
 */
export function startWaGroups(opts: InitOpts = {}): () => void {
  if (!waEnabled()) return () => {};
  if (!evo.evoKey()) {
    initError = "нет EVOLUTION_API_KEY";
    console.error("[wa] WA_GROUPS=on, но нет EVOLUTION_API_KEY: модуль не запущен");
    return () => {};
  }
  try {
    initWaGroups(opts);
  } catch (e) {
    initError = (e as Error).message;
    console.error("[wa] модуль не запущен: %s", initError);
    return () => {};
  }
  const r = need();
  registerWa((cmd, args, now) => waCommand(cmd, args, now));
  registerWaReport((day) => waReportLine(day));
  const main = setInterval(() => void waTick(), TICK_MS);
  const joins = setInterval(() => void joinsTick(), JOINS_TICK_MS);
  const first = setTimeout(() => void waTick(), 5000);
  const onExit = () => releaseLock(r);
  process.on("exit", onExit);
  console.log("[wa] запущен: тип %s, расписание %s, сообщений %d, тик %d с", r.cfg.target, r.cfg.version, r.cfg.messages.length, TICK_MS / 1000);
  return () => {
    clearInterval(main);
    clearInterval(joins);
    clearTimeout(first);
    process.off("exit", onExit);
    registerWa(null);
    registerWaReport(null);
    releaseLock(r);
  };
}

/** Блок waGroups для /health: без ключей и ссылок. */
export function waHealth() {
  if (!waEnabled()) return { enabled: false };
  if (!rt) return { enabled: true, running: false, ...(initError ? { error: initError } : {}) };
  return {
    enabled: true,
    running: true,
    paused: rt.state.paused,
    connection: rt.conn.state,
    targets: rt.state.targets.length,
    failStreak: rt.state.failStreak,
  };
}

// ───────────────────────── время ─────────────────────────

function tcfg(r: Rt): TimeCfg {
  if (r.timeOverride) return r.timeOverride;
  // Время эфира, firstDay и skipDays берём у бота, чтобы день записи там и тут считался одинаково.
  try {
    return timeCfg(getSeries());
  } catch {
    return {
      streamStart: r.cfg.streamStart,
      streamMinutes: r.cfg.streamMinutes,
      joinLiveMinutes: r.cfg.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES,
      firstDay: r.cfg.firstDay,
      skipDays: r.cfg.skipDays,
    };
  }
}

/** Конец рассылки сообщества эфира D: closeAt следующего дня (00:00 дня D+1). */
export const closeAtOf = (r: Rt, day: string) => atTime(addDays(day, 1), r.cfg.closeAt);

/**
 * Когда создавать сообщество эфира X: в старт эфира предыдущего дня эфира (обычно накануне в 20:00).
 * Перед первым днём и после перерыва берём календарную вчера.
 */
export function createAtOf(r: Rt, day: string): number {
  const c = tcfg(r);
  let p = addDays(day, -1);
  for (let i = 0; i < 30; i++) {
    if (isStreamDay(p, c)) return atTime(p, c.streamStart);
    p = addDays(p, -1);
  }
  return atTime(addDays(day, -1), c.streamStart);
}

const ddmm = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
const nameOf = (r: Rt, day: string, seq: number) => r.cfg.name.replace("{date}", ddmm(day)) + (seq > 1 ? ` (${seq})` : "");

// ───────────────────────── цели рассылки ─────────────────────────

const isReady = (t: Target) => (t.kind === "community" ? !!(t.done.announce && t.done.addMode && t.done.approval && t.done.link) : !!(t.done.announce && t.done.link));

/** Цели дня, от нового к старому (последнее переполнение первым). */
const targetsOf = (r: Rt, day: string) => r.state.targets.filter((t) => t.day === day).sort((a, b) => b.seq - a.seq);

/** Цель, на которую сейчас ведёт ссылка: готовое сообщество дня, на который записывает бот (assignStreamDay). */
function servingTarget(r: Rt, now: number): Target | null {
  const day = assignStreamDay(now, tcfg(r));
  return targetsOf(r, day).find((t) => isReady(t) && t.link && now < closeAtOf(r, t.day)) ?? null;
}

/**
 * Ссылка для сайта. null: модуль выключен или подходящего сообщества нет, тогда server.ts отдаёт старую ссылку.
 * Никогда не бросает.
 */
export function waGroupLink(now: number = Date.now(), served = true): string | null {
  try {
    if (!rt) return null;
    const t = servingTarget(rt, now);
    if (!t || !isValidWhatsAppLink(t.link)) return null;
    if (served) {
      // Ссылку только что отдали человеку: заявка появится в ближайшие минуты, опрос ускоряем.
      rt.lastServedAt = now;
      const soon = now + 15_000;
      const cur = rt.joinNextAt.get(t.id);
      if (cur !== undefined && cur > soon) rt.joinNextAt.set(t.id, soon);
    }
    return t.link;
  } catch {
    return null;
  }
}

// ───────────────────────── общие помощники ─────────────────────────

const between = (r: Rt, rg: Range) => Math.round(rg[0] + r.deps.rand() * (rg[1] - rg[0]));
const pause = (r: Rt, rg: Range) => r.deps.sleep(between(r, rg));
const sentKey = (msg: string, part: string, day: string, target: string) => `${msg}:${part}|${day}|${target}`;

/** Все запросы к Evolution идут по одному: общая очередь. */
function exclusive<T>(r: Rt, fn: () => Promise<T>): Promise<T> {
  const next = r.chain.then(fn, fn);
  r.chain = next.then(() => undefined, () => undefined);
  return next;
}

function journal(r: Rt, row: Record<string, unknown>) {
  append(fJournal(r), { ts: iso(r.deps.now()), ...row });
}

async function alarm(r: Rt, text: string) {
  journal(r, { ev: "alarm", text });
  console.warn("[wa] тревога: %s", text);
  try {
    await r.deps.notify(text);
  } catch {
    /* Telegram недоступен: тревога осталась в журнале и логе */
  }
}

function pauseModule(r: Rt, now: number, reason: string, text: string) {
  r.state.paused = true;
  r.state.pausedAt = now;
  r.state.pausedReason = reason.slice(0, 200);
  save(r);
  journal(r, { ev: "pause", reason: r.state.pausedReason });
  return alarm(r, text);
}

function noteOk(r: Rt) {
  if (r.state.failStreak || r.state.retryAt) {
    r.state.failStreak = 0;
    r.state.retryAt = 0;
    save(r);
  }
}

/** Неудача: повтор позже с паузой, после pauseAfter подряд пауза модуля и тревога. */
async function noteFail(r: Rt, what: string, err: string) {
  const now = r.deps.now();
  r.state.failStreak++;
  console.warn("[wa] ошибка %d подряд: %s: %s", r.state.failStreak, what, err);
  journal(r, { ev: "fail", n: r.state.failStreak, what, err });
  if (r.state.failStreak >= r.cfg.retry.pauseAfter) {
    await pauseModule(r, now, `${what}: ${err}`, `WhatsApp-модуль на паузе: ${r.state.failStreak} ошибки подряд. Последняя: ${what}: ${err}. Проверь /wa, потом /wa_resume.`);
    return;
  }
  const b = r.cfg.retry.backoffSec;
  r.state.retryAt = now + b[Math.min(r.state.failStreak - 1, b.length - 1)] * 1000;
  save(r);
}

/**
 * Исход неясен: запрос мог выполниться. Это любой отказ, кроме «соединение не установлено» и ответа 4xx
 * (обрыв после отправки, таймаут, 5xx).
 */
const ambiguous = (f: evo.EvoFail) => !f.connectFail && (f.status === 0 || f.status >= 500);

// ───────────────────────── блокировка: один процесс на данные ─────────────────────────

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/**
 * Пробный запуск при выкладке (порт 4011) и второй процесс не должны слать и создавать: замок с pid и отметкой
 * времени, как у планировщика бота. Каждый тик продлевает отметку.
 */
export function holdLock(r: Rt): boolean {
  const f = fLock(r);
  try {
    if (existsSync(f)) {
      const cur = JSON.parse(readFileSync(f, "utf8")) as { pid?: number; ts?: number };
      if (cur.pid && cur.pid !== process.pid && Date.now() - (cur.ts || 0) < LOCK_STALE_MS && pidAlive(cur.pid)) {
        if (!r.lockedOutLogged) console.warn("[wa] данные держит другой процесс (pid %d), этот не работает", cur.pid);
        r.lockedOutLogged = true;
        return false;
      }
    }
    r.lockedOutLogged = false;
    writeFileSync(f, JSON.stringify({ pid: process.pid, ts: Date.now() }), "utf8");
    return true;
  } catch (e) {
    console.error("[wa] замок недоступен:", (e as Error).message);
    return true;
  }
}

export function releaseLock(r: Rt) {
  try {
    const f = fLock(r);
    if (existsSync(f) && (JSON.parse(readFileSync(f, "utf8")) as { pid?: number }).pid === process.pid) unlinkSync(f);
  } catch {
    /* не страшно */
  }
}

// ───────────────────────── подключение ─────────────────────────

/** Проверка connectionState. Не open (или Evolution не отвечает): ничего не шлём, тревога не чаще раза в указанный срок. */
async function checkConnection(r: Rt, now: number): Promise<boolean> {
  const c = await evo.connectionState();
  const st = c.ok ? c.data.state : "unreachable";
  r.conn = { state: st, at: now };
  if (st === "open") {
    if (!r.state.ownerJid || now - r.state.ownerAt > HOUR) {
      const i = await evo.fetchInstance();
      if (i.ok && i.data.ownerJid) {
        r.state.ownerJid = i.data.ownerJid;
        r.state.ownerAt = now;
        save(r);
      }
    }
    return true;
  }
  if (now - r.state.lastConnAlertAt >= r.cfg.alarms.connectionEveryMinutes * MIN) {
    r.state.lastConnAlertAt = now;
    save(r);
    await alarm(r, `WhatsApp не подключён (состояние: ${st}). Рассылка, создание сообществ и одобрение заявок остановлены. /wa_qr пришлёт QR для подключения.`);
  }
  return false;
}

// ───────────────────────── создание сообщества ─────────────────────────

const dayCreations = (r: Rt, now: number) => r.state.creations.filter((t) => now - t < 24 * HOUR).length;
const capReached = (r: Rt, now: number) => dayCreations(r, now) >= r.cfg.maxNewPerDay;

function noteCreation(r: Rt, now: number) {
  r.state.creations = [...r.state.creations.filter((t) => now - t < 48 * HOUR), now];
}

/** Дни эфира, для которых пора создавать сообщество и которых ещё нет: окно [createAt, createAt + догонка). */
function dueCreateDays(r: Rt, now: number): string[] {
  const out: string[] = [];
  const c = tcfg(r);
  const today = dayKeyOf(now);
  for (let i = 0; i < 14; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c) || r.state.targets.some((t) => t.day === day)) continue;
    const at = createAtOf(r, day);
    if (now >= at && now < at + r.cfg.createCatchupHours * HOUR && now < closeAtOf(r, day)) out.push(day);
  }
  return out;
}

type CreateResult = { ok: true; target: Target } | { ok: false; error: string };

/** Создать сообщество (или группу) эфира day с номером seq и сохранить. Настройки и ссылка ставятся следом (setupSteps). */
async function createTarget(r: Rt, day: string, seq: number, now: number): Promise<CreateResult> {
  const kind = r.cfg.target;
  const name = nameOf(r, day, seq);
  let created: { jid: string; sendJid: string };
  if (kind === "group" && !adminNumbers().length) {
    await noteFail(r, `создание ${name}`, "для обычной группы нужен хотя бы один номер в WA_ADMIN_NUMBERS");
    return { ok: false, error: "нет WA_ADMIN_NUMBERS" };
  }
  r.state.pendingCreate = { day, seq, kind, at: now };
  save(r);
  const res =
    kind === "community"
      ? await evo.communityCreate({ subject: name, description: r.cfg.description, approvalRequired: true })
      : await evo.groupCreate({ subject: name, description: r.cfg.description, participants: adminNumbers() });
  if (!res.ok) {
    if (ambiguous(res)) {
      // Запрос мог выполниться: вслепую не повторяем, чтобы не наплодить сообществ.
      noteCreation(r, now);
      await pauseModule(
        r,
        now,
        `создание ${name}: ${res.error}`,
        `WhatsApp-модуль на паузе: при создании «${name}» не пришёл чёткий ответ (${res.error}). Возможно, оно уже создано: проверь список чатов на телефоне. Если создано, удали лишнее; потом /wa_resume, а /wa_new создаст заново.`,
      );
      return { ok: false, error: res.error };
    }
    r.state.pendingCreate = null;
    save(r);
    await noteFail(r, `создание ${name}`, res.error);
    return { ok: false, error: res.error };
  }
  created =
    kind === "community"
      ? { jid: (res.data as evo.CreatedCommunity).communityJid, sendJid: (res.data as evo.CreatedCommunity).announcementJid }
      : { jid: (res.data as { groupJid: string }).groupJid, sendJid: (res.data as { groupJid: string }).groupJid };
  const t: Target = {
    id: `${day}#${seq}`,
    day,
    seq,
    kind,
    jid: created.jid,
    sendJid: created.sendJid,
    name,
    createdAt: now,
    link: "",
    // У обычной группы нет режима «по заявке» и «админы добавляют»: эти шаги считаются сделанными.
    done: kind === "group" ? { addMode: true, approval: true } : {},
    tries: {},
    avatarAt: 0,
  };
  r.state.targets.push(t);
  r.state.pendingCreate = null;
  noteCreation(r, now);
  save(r);
  journal(r, { ev: "create", target: t.id, day, kind, jid: t.jid, sendJid: t.sendJid, name });
  console.log("[wa] создано %s %s (%s)", kind === "community" ? "сообщество" : "группа", t.id, name);
  noteOk(r);
  return { ok: true, target: t };
}

const welcomeText = (r: Rt, t: Target, now: number) => r.cfg.welcome.replace("{dayWordLower}", dayWordLower(t.day, now)).replace("{date}", ddmm(t.day));

/**
 * Довести цель до готовности: настройки, ссылка, аватарка, приветствие. Шаги по порядку с паузой между ними,
 * каждый запоминается в done, чтобы после сбоя не повторять сделанное. Возвращает false, если пришлось остановиться.
 * Критичные шаги (настройки, ссылка, приветствие) при неудаче считаются ошибкой подряд, аватарка нет: она косметика.
 */
async function setupSteps(r: Rt, t: Target): Promise<boolean> {
  const order: Step[] = t.kind === "community" ? ["announce", "addMode", "approval", "link", "avatar", "welcome"] : ["announce", "link", "avatar", "welcome"];
  let first = true;
  for (const s of order) {
    if (t.done[s]) continue;
    const now = r.deps.now();
    if (r.state.paused || now < r.state.retryAt) return false;
    if (now >= closeAtOf(r, t.day)) return true;
    if (s === "avatar" && ((t.tries.avatar || 0) >= 3 || now - t.avatarAt < 5 * MIN)) continue;
    if (s === "welcome" && ((t.tries.welcome || 0) >= 3 || !isReady(t))) continue;
    if (!first) await pause(r, r.cfg.pacing.betweenStepsMs);
    first = false;
    t.tries[s] = (t.tries[s] || 0) + 1;
    let err = "";
    if (s === "announce") {
      const x = t.kind === "community" ? await evo.communitySetting(t.jid, "announcement") : await evo.groupSetting(t.jid, "announcement");
      err = x.ok ? "" : x.error;
    } else if (s === "addMode") {
      const x = await evo.communityMemberAddMode(t.jid, "admin_add");
      err = x.ok ? "" : x.error;
    } else if (s === "approval") {
      const x = await evo.communityJoinApproval(t.jid, "on");
      err = x.ok ? "" : x.error;
    } else if (s === "link") {
      const x = t.kind === "community" ? await evo.communityInvite(t.jid) : await evo.groupInvite(t.jid);
      if (!x.ok) err = x.error;
      else if (!isValidWhatsAppLink(x.data.inviteUrl)) err = "ссылка-приглашение не похожа на chat.whatsapp.com";
      else t.link = x.data.inviteUrl;
    } else if (s === "avatar") {
      t.avatarAt = now;
      for (const url of r.cfg.avatar) {
        const x = await evo.updatePicture(t.jid, url);
        if (x.ok) {
          err = "";
          break;
        }
        err = x.error;
      }
    } else if (s === "welcome") {
      const x = await sendPart(r, t, "welcome", "main", () => evo.sendText(t.sendJid, welcomeText(r, t, now)), false);
      err = x.ok ? "" : x.error;
    }
    if (!err) {
      t.done[s] = true;
      save(r);
      journal(r, { ev: "step", target: t.id, step: s });
      if (s !== "avatar") noteOk(r);
      continue;
    }
    save(r);
    if (s === "avatar") {
      console.warn("[wa] аватарка %s не поставилась (%d из 3): %s", t.id, t.tries.avatar, err);
      if ((t.tries.avatar || 0) >= 3) await alarm(r, `Не удалось поставить аватарку сообществу «${t.name}»: ${err}. Сообщество работает без неё. Проверь, что wa-avatar.jpg выложен на сайт.`);
      continue;
    }
    await noteFail(r, `${t.id}: шаг ${s}`, err);
    return false;
  }
  return true;
}

// ───────────────────────── отправка сообщений ─────────────────────────

/** Части сообщения: основная (картинка с подписью или текст), текст отдельно (если подпись длиннее лимита), опрос. */
function partsOf(r: Rt, m: WaMsg): string[] {
  const parts = ["main"];
  if (m.media && m.text.length > r.cfg.captionLimit) parts.push("text");
  if (m.poll) parts.push("poll");
  return parts;
}

const isDone = (r: Rt, m: WaMsg, t: Target) => partsOf(r, m).every((p) => r.sent.has(sentKey(m.id, p, t.day, t.id)));

/** Отправить одну часть и записать строку журнала. Уже отправленную часть не повторяет. */
async function sendPart(r: Rt, t: Target, msgId: string, part: string, run: () => Promise<evo.EvoResult<evo.SentMsg>>, manual: boolean, extra: Record<string, unknown> = {}): Promise<{ ok: true } | { ok: false; error: string; timeout?: boolean }> {
  const key = sentKey(msgId, part, t.day, t.id);
  if (r.sent.has(key)) return { ok: true };
  const x = await run();
  journal(r, {
    ev: "send",
    msg: msgId,
    part,
    day: t.day,
    target: t.id,
    jid: t.sendJid,
    ok: x.ok,
    ...(x.ok ? { mid: x.data.messageId } : { err: x.error }),
    ...(manual ? { manual: true } : {}),
    ...extra,
  });
  if (x.ok) {
    r.sent.add(key);
    return { ok: true };
  }
  return { ok: false, error: x.error, ...(x.timeout ? { timeout: true } : {}) };
}

/** Отправить сообщение серии в цель: картинка или видео с подписью (или текст), отдельный текст, опрос. Возвращает false при первой неудаче. */
async function sendMessageTo(r: Rt, t: Target, m: WaMsg, manual: boolean): Promise<boolean> {
  let first = true;
  for (const part of partsOf(r, m)) {
    if (r.sent.has(sentKey(m.id, part, t.day, t.id))) continue;
    if (!first) await pause(r, r.cfg.pacing.betweenStepsMs);
    first = false;
    let res: { ok: true } | { ok: false; error: string; timeout?: boolean };
    if (part === "poll") {
      const p = m.poll as NonNullable<WaMsg["poll"]>;
      res = await sendPart(r, t, m.id, part, () => evo.sendPoll(t.sendJid, { name: p.name, values: p.options, selectableCount: p.selectableCount ?? 1 }), manual);
    } else if (part === "text") {
      res = await sendPart(r, t, m.id, part, () => evo.sendText(t.sendJid, m.text), manual);
    } else if (m.media) {
      const media = m.media;
      const caption = m.text.length <= r.cfg.captionLimit ? m.text : undefined;
      res = await sendPart(r, t, m.id, part, () => evo.sendMedia(t.sendJid, { mediatype: media.type, url: media.url, caption }), manual);
      if (!res.ok && !res.timeout) {
        // Картинка не ушла: тот же текст обычным сообщением, владельцам одно предупреждение на файл.
        console.warn("[wa] медиа %s не ушло (%s), шлю текстом", media.url, res.error);
        if (!r.mediaWarned.has(media.url)) {
          r.mediaWarned.add(media.url);
          void alarm(r, `Не отправилась картинка или видео ${media.url}: ${res.error}. Шлю тот же текст без неё. Проверь, что файл выложен на сайт.`);
        }
        const fb = await sendPart(r, t, m.id, part, () => evo.sendText(t.sendJid, m.text), manual, { fallback: "text" });
        if (fb.ok) res = fb;
      }
    } else {
      res = await sendPart(r, t, m.id, part, () => evo.sendText(t.sendJid, m.text), manual);
    }
    if (!res.ok) {
      await noteFail(r, `отправка «${m.id}» в ${t.id}`, res.error);
      return false;
    }
    noteOk(r);
  }
  return true;
}

export type Due = { t: Target; msg: WaMsg; plan: number };

/** Сообщения, которые сейчас в окне отправки: [плановое время дня эфира, плюс grace], не раньше создания цели. */
export function dueSends(r: Rt, now: number): Due[] {
  const out: Due[] = [];
  for (const t of r.state.targets) {
    if (!isReady(t) || now >= closeAtOf(r, t.day)) continue;
    for (const msg of r.cfg.messages) {
      if (msg.enabled === false) continue;
      const plan = atTime(t.day, msg.at);
      if (now < plan || now > plan + r.cfg.graceMinutes * MIN) continue;
      // Прошлые сообщения новому сообществу не досылаем.
      if (plan < t.createdAt) continue;
      if (isDone(r, msg, t)) continue;
      out.push({ t, msg, plan });
    }
  }
  return out.sort((a, b) => a.plan - b.plan || a.t.day.localeCompare(b.t.day) || a.t.seq - b.t.seq);
}

async function runSends(r: Rt, now: number): Promise<number> {
  let sent = 0;
  let first = true;
  for (const d of dueSends(r, now)) {
    if (r.state.paused || r.deps.now() < r.state.retryAt) break;
    // Между отправками пауза 4 до 9 секунд со случайным разбросом.
    if (!first) await pause(r, r.cfg.pacing.betweenSendsMs);
    first = false;
    if (!(await sendMessageTo(r, d.t, d.msg, false))) break;
    sent++;
  }
  return sent;
}

// ───────────────────────── переполнение ─────────────────────────

/** Число участников из ответа info патча или findGroupInfos: size на верхнем уровне, размер вкладки объявлений среди привязанных групп, длина списка. */
export function extractMembers(info: any, announcementJid: string): number | undefined {
  const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : typeof x === "string" && /^\d+$/.test(x) ? Number(x) : undefined);
  const found: number[] = [];
  const add = (x: unknown) => {
    const n = num(x);
    if (n !== undefined) found.push(n);
  };
  add(info?.size);
  add(info?.membersCount);
  add(info?.participantsCount);
  if (Array.isArray(info?.participants)) add(info.participants.length);
  for (const key of ["linkedGroups", "groups", "subGroups"]) {
    const list = info?.[key];
    if (!Array.isArray(list)) continue;
    for (const g of list) {
      if (g && (g.id === announcementJid || g.jid === announcementJid || g.isCommunityAnnounce === true)) {
        add(g.size);
        if (Array.isArray(g.participants)) add(g.participants.length);
      }
    }
  }
  return found.length ? Math.max(...found) : undefined;
}

/** Обновить число участников цели. Не чаще раза в memberCheckMinutes, force не отменяет этого правила. */
async function refreshMembers(r: Rt, t: Target, now: number): Promise<boolean> {
  if (t.membersAt && now - t.membersAt < r.cfg.memberCheckMinutes * MIN) return false;
  const x = t.kind === "community" ? await evo.communityInfo(t.jid) : await evo.groupInfo(t.jid);
  t.membersAt = now;
  if (x.ok) {
    const n = extractMembers(x.data, t.sendJid);
    if (n !== undefined) t.members = n;
  } else {
    console.warn("[wa] число участников %s не получено: %s", t.id, x.error);
  }
  save(r);
  return x.ok;
}

async function runMemberChecks(r: Rt, now: number) {
  const t = servingTarget(r, now);
  if (!t || r.state.paused) return;
  await refreshMembers(r, t, now);
  const limit = r.cfg.overflowAt[t.kind];
  // Следующее открываем один раз: только у самого нового сообщества дня.
  if (t.members === undefined || t.members < limit || targetsOf(r, t.day)[0].id !== t.id) return;
  if (capReached(r, now)) {
    if (r.state.capAlertDay !== dayKeyOf(now)) {
      r.state.capAlertDay = dayKeyOf(now);
      save(r);
      await alarm(r, `В «${t.name}» уже ${t.members} участников, а лимит ${r.cfg.maxNewPerDay} новых сообществ в сутки исчерпан. Следующее не открыто, ссылка прежняя. Открыть вручную: /wa_new.`);
    }
    return;
  }
  await pause(r, r.cfg.pacing.betweenStepsMs);
  const c = await createTarget(r, t.day, t.seq + 1, r.deps.now());
  if (!c.ok) return;
  await alarm(r, `В «${t.name}» ${t.members} участников из ${limit}. Открыто следующее: «${c.target.name}», ссылка на сайте переключится на него, как только оно будет готово.`);
  await pause(r, r.cfg.pacing.betweenStepsMs);
  await setupSteps(r, c.target);
}

// ───────────────────────── тик ─────────────────────────

export type TickInfo = { skipped?: "lock" | "paused" | "no_connection" | "backoff" | "busy"; sent: number; created: number };

/** Один тик: подключение, отправка по расписанию, достройка, создание, проверка переполнения. Тик не бросает. */
export async function waTick(): Promise<TickInfo> {
  const r = rt;
  if (!r) return { sent: 0, created: 0 };
  if (r.ticking) return { skipped: "busy", sent: 0, created: 0 };
  r.ticking = true;
  try {
    return await exclusive(r, async () => {
      const now = r.deps.now();
      if (!holdLock(r)) return { skipped: "lock" as const, sent: 0, created: 0 };
      if (r.state.paused) return { skipped: "paused" as const, sent: 0, created: 0 };
      if (!(await checkConnection(r, now))) return { skipped: "no_connection" as const, sent: 0, created: 0 };
      if (now < r.state.retryAt) return { skipped: "backoff" as const, sent: 0, created: 0 };
      const sent = await runSends(r, now);
      let created = 0;
      // Достроить то, что не дошло раньше (ссылка, настройки, приветствие).
      for (const t of r.state.targets) {
        if (r.state.paused || r.deps.now() < r.state.retryAt) break;
        if (r.deps.now() >= closeAtOf(r, t.day)) continue;
        const incomplete = !isReady(t) || (!t.done.welcome && (t.tries.welcome || 0) < 3) || (!t.done.avatar && (t.tries.avatar || 0) < 3);
        if (incomplete) await setupSteps(r, t);
      }
      if (r.state.pendingCreate) return { sent, created, skipped: "paused" as const };
      for (const day of dueCreateDays(r, now)) {
        if (r.state.paused || r.deps.now() < r.state.retryAt) break;
        if (capReached(r, now)) {
          if (r.state.capAlertDay !== dayKeyOf(now)) {
            r.state.capAlertDay = dayKeyOf(now);
            save(r);
            await alarm(r, `Лимит ${r.cfg.maxNewPerDay} новых сообществ в сутки исчерпан, сообщество эфира ${ddmm(day)} не создано. Создать вручную позже: /wa_new.`);
          }
          break;
        }
        const c = await createTarget(r, day, 1, r.deps.now());
        if (!c.ok) break;
        created++;
        await pause(r, r.cfg.pacing.betweenStepsMs);
        await setupSteps(r, c.target);
      }
      await runMemberChecks(r, now);
      return { sent, created };
    });
  } catch (e) {
    console.error("[wa] тик упал:", (e as Error)?.stack || e);
    return { sent: 0, created: 0 };
  } finally {
    r.ticking = false;
  }
}

// ───────────────────────── заявки на вступление ─────────────────────────

export type JoinRequest = { jid: string; raw: Record<string, unknown> };

/** Список заявок из ответа патча: массив атрибутов или объект с массивом requests, participants или list. Атрибуты сохраняем как пришли. */
export function normalizeRequests(data: unknown): JoinRequest[] {
  const list = Array.isArray(data) ? data : isObj(data) ? ((data.requests ?? data.participants ?? data.list ?? []) as unknown) : [];
  if (!Array.isArray(list)) return [];
  const out: JoinRequest[] = [];
  for (const x of list) {
    const raw = typeof x === "string" ? { jid: x } : isObj(x) ? (isObj(x.attrs) ? (x.attrs as Record<string, unknown>) : x) : null;
    if (!raw) continue;
    const jid = String(raw.jid ?? raw.id ?? raw.participant ?? "");
    if (jid) out.push({ jid, raw });
  }
  return out;
}

/** Телефон из заявки, если WhatsApp его отдал: поля phone_number, phoneNumber, pn. */
const phoneOf = (raw: Record<string, unknown>): string => {
  for (const k of ["phone_number", "phoneNumber", "phone", "pn", "pn_jid"]) {
    const v = raw[k];
    if (typeof v === "string" && /\d{7,}/.test(v)) return v.replace(/@.*/, "").replace(/\D/g, "");
  }
  return "";
};

/** Результаты решения: массив { jid, status } или объект с таким массивом; без разбора считаем успешным весь пакет (HTTP 2xx). */
function normalizeDecisions(data: unknown, asked: string[]): Array<{ jid: string; ok: boolean; status: string }> {
  const list = Array.isArray(data) ? data : isObj(data) ? ((data.results ?? data.participants ?? data.updated ?? null) as unknown) : null;
  if (Array.isArray(list) && list.length) {
    const byJid = new Map<string, { jid: string; ok: boolean; status: string }>();
    for (const x of list) {
      if (!isObj(x)) continue;
      const jid = String(x.jid ?? "");
      const status = String(x.status ?? "200");
      if (jid) byJid.set(jid, { jid, ok: status === "200" || status === "ok", status });
    }
    return asked.map((jid) => byJid.get(jid) ?? { jid, ok: false, status: "нет в ответе" });
  }
  return asked.map((jid) => ({ jid, ok: true, status: "200" }));
}

function nextJoinDelay(r: Rt, serving: boolean, now: number) {
  const jp = r.cfg.joinPolling;
  if (!serving) return between(r, jp.otherSec) * 1000;
  const hot = !jp.idleSec || jp.hotMinutes === undefined || now - Math.max(r.lastServedAt, r.lastRequestsAt) < jp.hotMinutes * MIN;
  return between(r, hot ? jp.servingSec : (jp.idleSec as Range)) * 1000;
}

/** Опросить заявки одного сообщества и одобрить новые. Сбой не пауза модуля, а мягкий счётчик с тревогой раз в час. */
async function pollJoins(r: Rt, t: Target, now: number): Promise<number> {
  const list = await evo.communityRequests(t.jid);
  if (!list.ok) {
    await softJoinFail(r, now, `список заявок ${t.id}: ${list.error}`);
    return 0;
  }
  const reqs = normalizeRequests(list.data);
  if (reqs.length) r.lastRequestsAt = now;
  for (const q of reqs) {
    const k = `${t.jid}|${q.jid}`;
    if (r.seenReq.has(k)) continue;
    r.seenReq.add(k);
    append(fJoins(r), { ts: iso(now), ev: "request", community: t.jid, target: t.id, day: t.day, jid: q.jid, phone: phoneOf(q.raw), raw: q.raw });
  }
  const todo = reqs.map((q) => q.jid).filter((jid) => !r.approved.has(`${t.jid}|${jid}`) && (r.approveFails.get(`${t.jid}|${jid}`) || 0) < 3).slice(0, r.cfg.joinPolling.batch);
  if (!todo.length) {
    r.joinFailStreak = 0;
    return 0;
  }
  const d = await evo.communityDecide(t.jid, todo, "approve");
  if (!d.ok) {
    for (const jid of todo) r.approveFails.set(`${t.jid}|${jid}`, (r.approveFails.get(`${t.jid}|${jid}`) || 0) + 1);
    append(fJoins(r), { ts: iso(r.deps.now()), ev: "approve_error", community: t.jid, target: t.id, count: todo.length, err: d.error });
    await softJoinFail(r, now, `одобрение заявок ${t.id}: ${d.error}`);
    return 0;
  }
  r.joinFailStreak = 0;
  let n = 0;
  for (const x of normalizeDecisions(d.data, todo)) {
    const k = `${t.jid}|${x.jid}`;
    append(fJoins(r), { ts: iso(r.deps.now()), ev: "approve", community: t.jid, target: t.id, day: t.day, jid: x.jid, ok: x.ok, status: x.status });
    if (x.ok) {
      r.approved.add(k);
      r.joinedCount.set(t.id, (r.joinedCount.get(t.id) || 0) + 1);
      n++;
    } else {
      r.approveFails.set(k, (r.approveFails.get(k) || 0) + 1);
    }
  }
  return n;
}

async function softJoinFail(r: Rt, now: number, what: string) {
  r.joinFailStreak++;
  console.warn("[wa] заявки, ошибка %d подряд: %s", r.joinFailStreak, what);
  if (r.joinFailStreak >= 5 && now - r.joinAlertAt >= HOUR) {
    r.joinAlertAt = now;
    await alarm(r, `WhatsApp: заявки на вступление не одобряются (${r.joinFailStreak} ошибок подряд). Последняя: ${what}. Люди ждут подтверждения.`);
  }
}

/** Цели, которые пора опросить: готовые сообщества до closeAt плюс час. Сервируемое опрашивается чаще остальных. */
export async function joinsTick(): Promise<number> {
  const r = rt;
  if (!r || r.joining || r.state.paused || r.conn.state !== "open") return 0;
  r.joining = true;
  try {
    return await exclusive(r, async () => {
      const now = r.deps.now();
      if (r.state.paused || r.conn.state !== "open" || !holdLock(r)) return 0;
      const serving = servingTarget(r, now);
      let n = 0;
      for (const t of r.state.targets) {
        if (t.kind !== "community" || !isReady(t)) continue;
        if (now >= closeAtOf(r, t.day) + r.cfg.joinPolling.keepAfterCloseMin * MIN) continue;
        if (now < (r.joinNextAt.get(t.id) || 0)) continue;
        n += await pollJoins(r, t, now);
        r.joinNextAt.set(t.id, r.deps.now() + nextJoinDelay(r, serving?.id === t.id, r.deps.now()));
      }
      return n;
    });
  } catch (e) {
    console.error("[wa] заявки, тик упал:", (e as Error)?.message || e);
    return 0;
  } finally {
    r.joining = false;
  }
}

// ───────────────────────── команды владельцев ─────────────────────────

const agoText = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 90 ? `${s} с назад` : s < 5400 ? `${Math.round(s / 60)} мин назад` : `${Math.round(s / 3600)} ч назад`;
};
const inText = (ms: number) => {
  const m = Math.max(0, Math.round(ms / MIN));
  return m < 90 ? `через ${m} мин` : `через ${Math.floor(m / 60)} ч ${m % 60} мин`;
};

/** Ближайшее сообщение расписания по сообществам, которые есть или будут: время, id, день эфира. */
function nextMessageText(r: Rt, now: number): string {
  const c = tcfg(r);
  const today = dayKeyOf(now);
  let best: { plan: number; id: string; day: string } | null = null;
  for (let i = 0; i < 4; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c)) continue;
    for (const m of r.cfg.messages) {
      if (m.enabled === false) continue;
      const plan = atTime(day, m.at);
      if (plan >= now && (!best || plan < best.plan)) best = { plan, id: m.id, day };
    }
  }
  return best ? `${hhmmOf(best.plan)} ${best.id} (эфир ${ddmm(best.day)}), ${inText(best.plan - now)}` : "нет";
}

function targetLine(r: Rt, label: string, day: string, now: number): string {
  const ts = [...targetsOf(r, day)].reverse();
  const at = createAtOf(r, day);
  if (!ts.length) return `${label} ${ddmm(day)}: пока нет, создам в ${hhmmOf(at)} ${ddmm(dayKeyOf(at))}`;
  return ts
    .map((t) => {
      const mem = t.members === undefined ? "участников не проверяли" : `участников ${t.members} (${agoText(now - (t.membersAt || now))})`;
      const joined = t.kind === "community" ? `, вступили по заявкам ${r.joinedCount.get(t.id) || 0}` : "";
      return `${label} ${ddmm(day)}: «${t.name}», ${isReady(t) ? "готово" : "достраивается"}, ${mem}${joined}`;
    })
    .join("\n");
}

export type { WaReply };

/** /wa: состояние для владельца. Подключение проверяет заново, участников берёт из кеша (обновляются не чаще раза в 5 минут). */
async function cmdStatus(r: Rt, now: number): Promise<WaReply> {
  const conn = await exclusive(r, async () => {
    const c = await evo.connectionState();
    r.conn = { state: c.ok ? c.data.state : "unreachable", at: now };
    if (r.conn.state === "open" && !r.state.ownerJid) {
      const i = await evo.fetchInstance();
      if (i.ok && i.data.ownerJid) {
        r.state.ownerJid = i.data.ownerJid;
        r.state.ownerAt = now;
        save(r);
      }
    }
    // Число участников обновляем по правилу «не чаще раза в 5 минут».
    if (r.conn.state === "open" && !r.state.paused) {
      const s = servingTarget(r, now);
      if (s) await refreshMembers(r, s, now);
    }
    return r.conn.state;
  });
  const today = dayKeyOf(now);
  const c = tcfg(r);
  // «Текущий» эфир: сегодняшний, если сегодня эфир; иначе ближайший. Идут его сообщения и работает его сообщество.
  const cur = isStreamDay(today, c) ? today : assignStreamDay(now, c);
  const next = nextStreamAfter(r, cur);
  const number = r.state.ownerJid ? `+${r.state.ownerJid.replace(/@.*/, "")}` : "номер неизвестен";
  const link = waGroupLink(now, false);
  const lines = [
    `WhatsApp-модуль: ${r.state.paused ? `на паузе (${r.state.pausedReason || "причина не записана"})` : "работает"}, тип ${r.cfg.target === "community" ? "сообщество" : "группа"}`,
    `Подключение: ${conn}${conn === "open" ? `, ${number}` : ""}`,
    targetLine(r, "Эфир", cur, now),
    targetLine(r, "Следующий эфир", next, now),
    `Ссылка на сайте сейчас: ${link ?? "старая постоянная (подходящего сообщества нет)"}`,
    `Ближайшее сообщение: ${nextMessageText(r, now)}`,
    `Новых сообществ за сутки: ${dayCreations(r, now)} из ${r.cfg.maxNewPerDay}`,
    `Ошибок подряд: ${r.state.failStreak} из ${r.cfg.retry.pauseAfter}`,
  ];
  return { text: lines.join("\n") };
}

/** День эфира, следующий после day (с учётом firstDay и skipDays). */
function nextStreamAfter(r: Rt, day: string): string {
  const c = tcfg(r);
  let d = addDays(day, 1);
  for (let i = 0; i < 400 && !isStreamDay(d, c); i++) d = addDays(d, 1);
  return d;
}

async function cmdQr(r: Rt, now: number): Promise<WaReply> {
  const wait = r.state.lastQrAt + MIN - now;
  if (wait > 0) return { text: `QR можно запрашивать раз в минуту, подожди ещё ${Math.ceil(wait / 1000)} с.` };
  r.state.lastQrAt = now;
  save(r);
  return exclusive(r, async () => {
    const cs = await evo.connectionState();
    if (!cs.ok) return { text: `Evolution не отвечает: ${cs.error}` };
    if (cs.data.state === "open") {
      const i = await evo.fetchInstance();
      return { text: `WhatsApp уже подключён${i.ok && i.data.ownerJid ? `, номер +${i.data.ownerJid.replace(/@.*/, "")}` : ""}. QR не нужен.` };
    }
    let qr: any;
    if (cs.data.state === "absent") {
      const c = await evo.createInstance();
      if (!c.ok) return { text: `Не удалось создать подключение: ${c.error}` };
      qr = c.data?.qrcode;
    } else {
      const c = await evo.connectInstance();
      if (!c.ok) return { text: `Не удалось запросить QR: ${c.error}` };
      qr = c.data;
    }
    if (!qr?.base64) {
      await r.deps.sleep(3000);
      const again = await evo.connectInstance();
      if (again.ok) qr = again.data;
    }
    const b64 = typeof qr?.base64 === "string" ? qr.base64.replace(/^data:image\/\w+;base64,/, "") : "";
    if (!b64) return { text: "QR пока не готов. Подожди минуту и повтори /wa_qr." };
    journal(r, { ev: "qr" });
    return {
      text: "QR для подключения. На телефоне с отдельной SIM: WhatsApp, Связанные устройства, Привязать устройство, навести камеру. Держится около минуты, не пересылай его никому.",
      photo: { data: Buffer.from(b64, "base64"), caption: "QR для подключения WhatsApp" },
    };
  });
}

function cmdPause(r: Rt, now: number): WaReply {
  if (r.state.paused) return { text: "Модуль уже на паузе." };
  r.state.paused = true;
  r.state.pausedAt = now;
  r.state.pausedReason = "вручную, /wa_pause";
  save(r);
  journal(r, { ev: "pause", reason: r.state.pausedReason });
  return { text: "Пауза включена: рассылка, создание и одобрение заявок остановлены. Вернуть: /wa_resume." };
}

function cmdResume(r: Rt): WaReply {
  const was = r.state.paused;
  r.state.paused = false;
  r.state.pausedReason = "";
  r.state.failStreak = 0;
  r.state.retryAt = 0;
  r.state.pendingCreate = null;
  save(r);
  journal(r, { ev: "resume" });
  return { text: was ? "Пауза снята, счётчик ошибок обнулён. Модуль работает на ближайшем тике (до 30 секунд)." : "Модуль и так не на паузе. Счётчик ошибок обнулён." };
}

/** /wa_new [YYYY-MM-DD]: создать сообщество ближайшего эфира, для которого его ещё нет, вручную сейчас. */
async function cmdNew(r: Rt, args: string, now: number): Promise<WaReply> {
  if (r.state.paused) return { text: "Модуль на паузе. Сначала /wa_resume." };
  if (r.state.pendingCreate) return { text: "Прошлое создание не подтверждено. Проверь телефон и сделай /wa_resume." };
  const c = tcfg(r);
  const arg = args.trim();
  let day: string;
  if (arg) {
    if (!isDayKey(arg) || !isStreamDay(arg, c)) return { text: "Нужна дата эфира вида 2026-10-12, и в этот день должен быть эфир." };
    day = arg;
  } else {
    day = dayKeyOf(now);
    for (let i = 0; i < 400 && (!isStreamDay(day, c) || r.state.targets.some((t) => t.day === day)); i++) day = addDays(day, 1);
  }
  // Без даты создаём не дальше завтрашнего эфира, с датой не дальше трёх дней вперёд.
  if (arg && day > addDays(dayKeyOf(now), 3)) return { text: `Эфир ${ddmm(day)} слишком далеко: сообщество можно создать не раньше чем за три дня до него.` };
  if (!arg && day > addDays(dayKeyOf(now), 1)) return { text: `Сообщества на ближайшие эфиры уже есть. Следующий без сообщества: ${ddmm(day)}. Если нужно создать раньше срока, укажи дату: /wa_new ${day}` };
  const existing = targetsOf(r, day)[0];
  if (existing) return { text: `Для эфира ${ddmm(day)} сообщество уже есть: «${existing.name}»${existing.link ? `, ссылка ${existing.link}` : ", ссылка ещё не готова"}.` };
  if (capReached(r, now)) return { text: `Лимит ${r.cfg.maxNewPerDay} новых сообществ в сутки исчерпан. Подожди.` };
  return exclusive(r, async () => {
    if (!(await checkConnection(r, now))) return { text: `WhatsApp не подключён (${r.conn.state}). /wa_qr пришлёт QR.` };
    const res = await createTarget(r, day, 1, r.deps.now());
    if (!res.ok) return { text: r.state.paused ? "Создание не подтверждено, модуль на паузе. Подробности в тревоге выше." : `Не создалось: ${res.error}` };
    await pause(r, r.cfg.pacing.betweenStepsMs);
    const done = await setupSteps(r, res.target);
    const t = res.target;
    return { text: `Создано: «${t.name}». ${isReady(t) ? `Ссылка: ${t.link}. На сайте переключится по расписанию (в ${hhmmOf(atTime(addDays(day, -1), c.streamStart) + (c.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES) * MIN)} накануне эфира).` : done ? "Достраивается." : "Настройки не закончены, модуль повторит на ближайших тиках."}` };
  });
}

/** /wa_send <id>: отправить сообщение серии вручную во все готовые сообщества сегодняшнего эфира. Уже ушедшее не повторяется. */
async function cmdSend(r: Rt, args: string, now: number): Promise<WaReply> {
  const id = args.split(/\s+/)[0];
  if (!id) return { text: `Укажи id сообщения: /wa_send morning. Список: ${r.cfg.messages.map((m) => m.id).join(", ")}` };
  const msg = r.cfg.messages.find((m) => m.id === id);
  if (!msg) return { text: `Нет сообщения «${id}». Список: ${r.cfg.messages.map((m) => m.id).join(", ")}` };
  if (r.state.paused) return { text: "Модуль на паузе. Сначала /wa_resume." };
  const today = dayKeyOf(now);
  const targets = [...targetsOf(r, today)].reverse().filter((t) => isReady(t) && now < closeAtOf(r, t.day));
  if (!targets.length) return { text: `Для сегодняшнего эфира (${ddmm(today)}) нет готового сообщества.` };
  return exclusive(r, async () => {
    if (!(await checkConnection(r, now))) return { text: `WhatsApp не подключён (${r.conn.state}). Ничего не отправлено.` };
    let ok = 0;
    let skipped = 0;
    let failed = 0;
    let first = true;
    for (const t of targets) {
      if (isDone(r, msg, t)) {
        skipped++;
        continue;
      }
      if (r.state.paused) break;
      if (!first) await pause(r, r.cfg.pacing.betweenSendsMs);
      first = false;
      if (await sendMessageTo(r, t, msg, true)) ok++;
      else failed++;
    }
    return { text: `«${id}»: отправлено ${ok}, уже было ${skipped}, не ушло ${failed} (сообществ сегодня: ${targets.length}).` };
  });
}

/** Обработчик команд /wa*, который tg-workshop вызывает для владельцев. Не бросает. */
export async function waCommand(cmd: string, args: string, now: number): Promise<WaReply> {
  const r = rt;
  if (!r) return { text: "Модуль WhatsApp не запущен (нет WA_GROUPS=on или ошибка запуска, см. /api/health)." };
  try {
    if (cmd === "wa") return await cmdStatus(r, now);
    if (cmd === "wa_qr") return await cmdQr(r, now);
    if (cmd === "wa_pause") return cmdPause(r, now);
    if (cmd === "wa_resume") return cmdResume(r);
    if (cmd === "wa_new") return await cmdNew(r, args, now);
    if (cmd === "wa_send") return await cmdSend(r, args, now);
    return { text: "Неизвестная команда WhatsApp." };
  } catch (e) {
    console.error("[wa] команда %s упала:", cmd, (e as Error)?.stack || e);
    return { text: `Ошибка команды: ${(e as Error)?.message || e}` };
  }
}

/** Строка для итогового отчёта эфира: сообщества дня, вступившие по заявкам, отправлено сообщений. Пусто, если данных нет. */
export function waReportLine(day: string): string {
  const r = rt;
  if (!r) return "";
  const ts = targetsOf(r, day);
  if (!ts.length) return "";
  const joined = ts.reduce((s, t) => s + (r.joinedCount.get(t.id) || 0), 0);
  const total = r.cfg.messages.filter((m) => m.enabled !== false).length * ts.length;
  const done = ts.reduce((s, t) => s + r.cfg.messages.filter((m) => m.enabled !== false && isDone(r, m, t)).length, 0);
  return `WhatsApp: вступили по заявкам ${joined}, сообщений серии ушло ${done} из ${total}.`;
}

/** Для тестов: чистые функции расписания. */
export const _internals = { createAtOf, servingTarget, dueCreateDays, isReady, partsOf, closeAtOf, nameOf, targetsOf };
