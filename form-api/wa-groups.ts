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
 *    пауза модуля и тревога владельцам в Telegram после 3 ошибок подряд, тревога раз в час при потере подключения;
 *  - неясный исход отправки (таймаут, 5xx): часть помечается отправленной (unknown в журнале), сама не повторяется, владельцам тревога;
 *    вручную (/wa_send) её можно отправить ещё раз;
 *  - ночь по Алматы: по расписанию шлётся только то, что запланировано с 09:00 до 23:45; создание по догонялке и приветствие только с 09:00
 *    до 23:00 (ночное откладывается до 09:00); тревога о потере подключения с 23:00 до 09:00 не шлётся, утром одна сводная;
 *  - заявки: перед каждым пакетом считается заполнение (замер плюс одобренные после него), у лимита не одобряем и сразу открываем следующее;
 *  - ИИ-ассистент в личке номера (wa-assistant.ts, docs/tasks/wa_assistant.md): по умолчанию выключен, включается в пульте или /wa_ai on;
 *    вебхук Evolution и ответы идут через ту же очередь запросов, паузу модуля и проверку подключения;
 *  - дожим «не вступил в сообщество» через WABA Wazzup (wa-dozhim.ts, docs/tasks/wa_wazzup_dozhim.md): по умолчанию выключен; замер участников
 *    сообществ у Evolution, шаблон тем, кто записался (номер Казахстана) и не вступил, ответ на кнопку присылает ссылку (вебхук Wazzup);
 *  - пульт показывает статус подключения (waStatus: подключён, ждёт подключения, отключён с причиной, номер заблокирован, вышел из устройства,
 *    Evolution не отвечает; причина из fetchInstances) и подключает номер двумя способами: QR (waQr) и кодом по номеру телефона (waPairing).
 *
 * Два режима работы (переключаются в пульте админки, docs/tasks/wa_control_panel.md), состояние в wa-state.json:
 *  - daily: «Ежедневное создание» вкл/выкл (по умолчанию выкл: пока Александр не включил, ничего не создаётся);
 *    при вкл всё как описано выше;
 *  - event (живой эфир, однодневник): ежедневное создание выключено, задаются дата эфира, время старта и дата начала набора.
 *    Сообщество создаётся один раз: по кнопке «Создать сейчас» или само в дату начала набора. Всё время набора ссылка на сайте
 *    ведёт в него, прогрев идёт только в день эфира, после 00:00 режим завершён и ссылка снова постоянная.
 *  Режимы взаимоисключающие, уже созданные сообщества при переключении не трогаются.
 *
 * Состояние: DATA_DIR/wa-state.json (перезапись через temp и rename), журналы wa-journal.jsonl (отправки и события)
 * и wa-joins.jsonl (заявки и вступления). Токены и ключи в журналы не пишутся.
 * Настройки читаются лениво: loadEnv() в server.ts выполняется после импортов.
 */
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as evo from "./wa-evolution";
import { isValidWhatsAppLink } from "../lib/whatsapp-link";
import { DEFAULT_JOIN_MINUTES, addDays, assignStreamDay, atTime, dayKeyOf, dayWordLower, hhmmOf, isDayKey, isStreamDay, parseHHMM, type TimeCfg } from "./tg-time";
import { getSeries, getStore, notifyOwners, registerWa, registerWaReport, timeCfg, type WaReply } from "./tg-workshop";
import { aiCommand, aiInit, aiPanel, aiReset, aiTick, type AiHost, type AiState } from "./wa-assistant";
import { dzCommand, dzInit, dzPanel, dzReset, dzTick, freshDz, normalizeDz, type DzHost, type DzState } from "./wa-dozhim";
import { classifyPayload, readLeads } from "./tg-admin";

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
  /** Откуда сообщество: ежедневный режим (по умолчанию) или живой эфир. Живой эфир ссылкой в ежедневном режиме не раздаётся. */
  source?: "daily" | "event";
  /** Время старта эфира HH:MM, если оно не равно streamStart серии: по нему сдвигается расписание и подменяются часы в текстах. */
  start?: string;
};

export type Mode = "daily" | "event";

/** Живой эфир: дата эфира, время старта, день начала набора. Пустая дата значит «не задан». */
export type EventCfg = {
  date: string;
  start: string;
  recruitFrom: string;
  /** id созданного сообщества эфира (Target.id). */
  communityId?: string;
  /** Эфир прошёл (00:00 после дня эфира) или режим закрыт. */
  done?: boolean;
  doneAt?: number;
};

/** Постоянная ссылка для кнопки шаблона WABA (workshop-montazh/wa.html): переадресует в сообщество текущего набора. */
export const TEMPLATE_URL = "https://onai.academy/workshop-montazh/wa";

/** Во сколько по Алматы в день начала набора сообщество создаётся само (днём, а не среди ночи). */
export const EVENT_CREATE_AT = "10:00";

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
  /** С какого момента подключение открыто (замечено нами): для строки «подключён с» в пульте. 0, если не открыто. */
  connSince: number;
  /** Режим работы и его настройки. После первого включения: daily с выключенным созданием. */
  mode: Mode;
  daily: { enabled: boolean };
  event: EventCfg;
  /** ИИ-ассистент в личке (wa-assistant.ts): выключатель (по умолчанию выкл), секрет вебхука, стоит ли вебхук в Evolution. */
  assistant: AiState;
  /** Дожим «не вступил в сообщество» через WABA (wa-dozhim.ts): выключатель (по умолчанию выкл), шаблон, окно часов, лимит, вебхук. */
  dozhim: DzState;
};

const freshEvent = (): EventCfg => ({ date: "", start: "", recruitFrom: "" });

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
  connSince: 0,
  mode: "daily",
  daily: { enabled: false },
  event: freshEvent(),
  assistant: { enabled: false, hookOn: false, secret: "" },
  dozhim: freshDz(),
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
  /** Ключи «сообщение:часть|день|цель» успешных отправок и отправок с неясным исходом (unknown): вторые автоматически не повторяются. */
  sent: Set<string>;
  /** Часть ключей sent, у которых исход неясен (таймаут или 5xx): сообщение могло уйти, а могло и нет. Вручную (/wa_send) их можно отправить ещё раз. */
  unknown: Set<string>;
  /** Сколько заявок одобрено в сообществе после последнего обновления числа участников (members): вместе они дают оценку заполнения. */
  approvedSince: Map<string, number>;
  /** Сообщения, пропущенные из-за ночного времени: пишем в журнал по одному разу. */
  nightSkipped: Set<string>;
  /** С какого момента нет подключения к WhatsApp (0, если оно есть): для утренней сводной тревоги. */
  downSince: number;
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
  /** Вступившие по заявкам: цель, день (по Алматы), число. Для строки «вступили сегодня» в пульте. */
  joinedByDay: Map<string, Map<string, number>>;
  /** Имя профиля WhatsApp номера (из fetchInstances), для пульта. */
  profileName: string;
  /** Последний QR пульта: не дёргаем Evolution чаще раза в 10 секунд. */
  qrCache: { at: number; state: string; data: string } | null;
  qrJournalAt: number;
  /** Список групп номера: кеш на минуту, обновление не чаще раза в 20 секунд. */
  groupsCache: { at: number; items: PanelGroup[] } | null;
  groupsCallAt: number;
  /** Последний статус подключения для пульта (не чаще раза в 3 секунды опрашиваем Evolution). */
  statusCache: { at: number; value: WaStatus } | null;
  /** Последний код подключения по номеру: тот же номер не просим у Evolution чаще раза в 15 секунд. Сам номер не храним. */
  pairCache: { at: number; digits: string; code: string } | null;
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
    st.connSince = num(raw.connSince);
    st.mode = raw.mode === "event" ? "event" : "daily";
    st.daily = { enabled: raw.daily?.enabled === true };
    const ev = raw.event;
    if (ev && typeof ev === "object") {
      const day = (x: unknown) => (isDayKey(x) ? x : "");
      st.event = {
        date: day(ev.date),
        start: typeof ev.start === "string" && /^\d{1,2}:\d{2}$/.test(ev.start) ? ev.start : "",
        recruitFrom: day(ev.recruitFrom),
        ...(typeof ev.communityId === "string" && ev.communityId ? { communityId: ev.communityId } : {}),
        ...(ev.done === true ? { done: true, doneAt: num(ev.doneAt) } : {}),
      };
    }
    // Режимы взаимоисключающие: в живом эфире ежедневное создание всегда выключено.
    if (st.mode === "event") st.daily.enabled = false;
    const as = raw.assistant;
    if (as && typeof as === "object") st.assistant = { enabled: as.enabled === true, hookOn: as.hookOn === true, secret: typeof as.secret === "string" ? as.secret : "" };
    st.dozhim = normalizeDz(raw.dozhim);
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
    unknown: new Set(),
    approvedSince: new Map(),
    nightSkipped: new Set(),
    downSince: 0,
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
    joinedByDay: new Map(),
    profileName: "",
    qrCache: null,
    qrJournalAt: 0,
    groupsCache: null,
    groupsCallAt: 0,
    statusCache: null,
    pairCache: null,
  };
  r.state = loadState(r);
  if (!r.state.event.start) r.state.event.start = cfg.streamStart;
  for (const row of readJsonl<any>(fJournal(r))) {
    if (row?.ev !== "send" || !row.msg || !row.day || !row.target) continue;
    const key = sentKey(row.msg, row.part || "main", row.day, row.target);
    // Неясный исход (unknown) тоже считается отправленным: после рестарта автоматически не повторяем. Более поздняя удачная отправка (вручную) его снимает.
    if (row.ok) {
      r.sent.add(key);
      r.unknown.delete(key);
    } else if (row.unknown === true) {
      r.sent.add(key);
      r.unknown.add(key);
    }
  }
  for (const row of readJsonl<any>(fJoins(r))) {
    if (!row?.community || !row.jid) continue;
    const k = `${row.community}|${row.jid}`;
    if (row.ev === "request") r.seenReq.add(k);
    if (row.ev === "approve" && row.ok) {
      r.approved.add(k);
      if (row.target) {
        r.joinedCount.set(row.target, (r.joinedCount.get(row.target) || 0) + 1);
        const ms = Date.parse(String(row.ts || ""));
        if (Number.isFinite(ms)) {
          noteJoinedDay(r, row.target, dayKeyOf(ms));
          // Одобренные после последнего замера числа участников: нужны для оценки заполнения сообщества.
          const t = r.state.targets.find((x) => x.id === row.target);
          if (t?.membersAt && ms > t.membersAt) r.approvedSince.set(t.id, (r.approvedSince.get(t.id) || 0) + 1);
        }
      }
    }
  }
  rt = r;
  initError = "";
  aiInit(aiHostOf(r));
  dzInit(dzHostOf(r));
}

/** То, что модуль даёт ИИ-ассистенту: часы, очередь запросов к Evolution, состояние, тревоги, условия отправки. */
function aiHostOf(r: Rt): AiHost {
  return {
    dir: r.dir,
    now: () => r.deps.now(),
    rand: () => r.deps.rand(),
    alarm: (text) => alarm(r, text),
    notify: (text) => r.deps.notify(text),
    journal: (row) => journal(r, row),
    exclusive: (fn) => exclusive(r, fn),
    canSend: () =>
      r.state.paused
        ? { ok: false, why: "модуль на паузе" }
        : r.conn.state !== "open"
          ? { ok: false, why: `номер не подключён (${r.conn.state})` }
          : r.lockedOutLogged
            ? { ok: false, why: "данные держит другой процесс" }
            : { ok: true },
    state: () => r.state.assistant,
    patch: (p) => {
      Object.assign(r.state.assistant, p);
      save(r);
    },
    ignoreDigits: () => [...adminNumbers(), digitsOf(r.state.ownerJid)].filter(Boolean),
  };
}

/** То, что модуль даёт дожиму WABA: часы, очередь запросов к Evolution, состояние, цели, ссылки, заявки, связку с ботом. */
function dzHostOf(r: Rt): DzHost {
  const dayOf = (ts: number): string => {
    const ev = r.state.event;
    // Живой эфир: все заявки с начала набора относятся к дню эфира, сайт ведёт их в одно сообщество.
    if (r.state.mode === "event" && ev.date && !ev.done && ev.recruitFrom && ts >= atTime(ev.recruitFrom, "00:00")) return ev.date;
    return assignStreamDay(ts, tcfg(r));
  };
  return {
    dir: r.dir,
    now: () => r.deps.now(),
    rand: () => r.deps.rand(),
    sleep: (ms) => r.deps.sleep(ms),
    alarm: (text) => alarm(r, text),
    notify: (text) => r.deps.notify(text),
    journal: (row) => journal(r, row),
    exclusive: (fn) => exclusive(r, fn),
    state: () => r.state.dozhim,
    patch: (p) => {
      Object.assign(r.state.dozhim, p);
      save(r);
    },
    canRun: () =>
      r.state.paused
        ? { ok: false, why: "модуль на паузе" }
        : r.conn.state !== "open"
          ? { ok: false, why: `номер не подключён (${r.conn.state})` }
          : r.lockedOutLogged
            ? { ok: false, why: "данные держит другой процесс" }
            : { ok: true },
    timeCfg: () => tcfg(r),
    dayOf,
    targets: (now) => {
      const c = tcfg(r);
      const ev = r.state.event;
      let days: Set<string>;
      if (r.state.mode === "event") days = new Set(ev.date && !ev.done ? [ev.date] : []);
      else {
        const cur = assignStreamDay(now, c);
        days = new Set([dayKeyOf(now), cur, nextStreamAfter(r, cur)]);
      }
      return r.state.targets
        .filter((t) => days.has(t.day) && (r.state.mode === "event" ? t.source === "event" : t.source !== "event") && !!t.sendJid && now < closeAtOf(r, t.day))
        .map((t) => ({ id: t.id, day: t.day, sendJid: t.sendJid }));
    },
    noteMembers: (id, count, at) => {
      const t = r.state.targets.find((x) => x.id === id);
      if (!t) return;
      t.members = count;
      t.membersAt = at;
      // Свежий замер уже включает тех, кого одобрили раньше: счёт «одобрено после замера» начинается заново.
      r.approvedSince.set(id, 0);
      save(r);
    },
    linkFor: (day, now) => linkForDay(r, day, now),
    leads: () => {
      try {
        const x = readLeads({ store: getStore(), cfg: tcfg(r), now: r.deps.now() });
        return { leads: x.leads, error: x.error };
      } catch {
        return { leads: null, error: "хранилище бота не открыто" };
      }
    },
    linkedEids: () => {
      const out = new Set<string>();
      try {
        for (const sub of getStore().subs.values()) {
          const o = classifyPayload(sub.payload);
          if (o.eid) out.add(o.eid);
        }
      } catch {
        /* хранилище бота не открыто */
      }
      return out;
    },
    waUrl: TEMPLATE_URL,
  };
}

/** Остановить и забыть модуль (для тестов и перезагрузки). */
export function resetWaGroups(): void {
  if (rt) releaseLock(rt);
  rt = null;
  initError = "";
  aiReset();
  dzReset();
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
  const dozhim = setInterval(() => void dzTick(), TICK_MS);
  const first = setTimeout(() => void waTick(), 5000);
  const onExit = () => releaseLock(r);
  process.on("exit", onExit);
  console.log(
    "[wa] запущен: тип %s, режим %s%s, расписание %s, сообщений %d, тик %d с",
    r.cfg.target,
    r.state.mode === "event" ? "живой эфир" : "ежедневный",
    r.state.mode === "daily" ? (r.state.daily.enabled ? " (создание вкл)" : " (создание выкл)") : "",
    r.cfg.version,
    r.cfg.messages.length,
    TICK_MS / 1000,
  );
  return () => {
    clearInterval(main);
    clearInterval(joins);
    clearInterval(dozhim);
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
  // Публичный /health: только признак ошибки запуска. Текст initError (пути, детали расписания) виден в админке и в логах.
  if (!rt) return { enabled: true, running: false, ...(initError ? { error: "init" } : {}) };
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

// ───────────────────────── время старта живого эфира ─────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");
const minsOf = (hhmm: string) => {
  const p = parseHHMM(hhmm);
  return p.h * 60 + p.m;
};
const hhmmFrom = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};
/** Время старта, нормализованное до HH:MM (9:00 -> 09:00). */
export const normHHMM = (s: string) => hhmmFrom(minsOf(s));

/** Сдвиг старта эфира относительно времени, под которое написана серия (streamStart), в минутах. */
const startShift = (r: Rt, start?: string) => (start ? minsOf(start) - minsOf(r.cfg.streamStart) : 0);

/**
 * Сообщение привязано к старту эфира, если его время не позже конца эфира серии (до оффера включительно):
 * такие сдвигаются вместе со стартом. Дожим и «последние 30 минут» привязаны к 23:59, а не к старту, они остаются на месте.
 */
const followsStart = (r: Rt, m: WaMsg) => minsOf(m.at) <= minsOf(r.cfg.streamStart) + r.cfg.streamMinutes;

/** Сообщения, которые не могут уйти раньше оффера того же дня: дожим и «последние 30 минут». */
const AFTER_OFFER = new Set(["push", "last-call"]);
const OFFER_ID = "offer";

/** Время сообщения без поправки на оффер: время дня эфира плюс сдвиг старта, если старт не 20:00. */
function shiftedPlan(r: Rt, t: { day: string; start?: string }, m: WaMsg): number {
  const base = atTime(t.day, m.at);
  const d = startShift(r, t.start);
  return d && followsStart(r, m) ? base + d * MIN : base;
}

/**
 * Плановое время сообщения для цели: время дня эфира плюс сдвиг старта, если старт не 20:00.
 * Дожим (push) и last-call никогда не раньше планового времени оффера того же дня: оффер сдвигается вместе со стартом, они нет.
 */
function planOf(r: Rt, t: { day: string; start?: string }, m: WaMsg): number {
  const own = shiftedPlan(r, t, m);
  if (!AFTER_OFFER.has(m.id)) return own;
  const offer = r.cfg.messages.find((x) => x.id === OFFER_ID);
  return offer ? Math.max(own, shiftedPlan(r, t, offer)) : own;
}

// ───────────────────────── ночное время ─────────────────────────

/** Рассылка по расписанию: плановое время сообщения от 09:00 до 23:45 по Алматы. Раньше и позже не шлём (старый сохранённый старт эфира). */
const SEND_FROM = 9 * 60;
const SEND_TO = 23 * 60 + 45;
/** Создание и приветствие по догонялке (не по кнопке): только днём, с 09:00 до 23:00 по Алматы. Ночное откладывается до 09:00. */
const DAY_FROM = 9 * 60;
const DAY_TO = 23 * 60;

const minuteOfDay = (ms: number) => minsOf(hhmmOf(ms));
const sendableTime = (ms: number) => minuteOfDay(ms) >= SEND_FROM && minuteOfDay(ms) <= SEND_TO;
const daytime = (ms: number) => minuteOfDay(ms) >= DAY_FROM && minuteOfDay(ms) < DAY_TO;

/** Сколько миллисекунд между from и to приходится на дневные часы (с 09:00 до 23:00 по Алматы). */
function daytimeMs(from: number, to: number): number {
  if (to <= from) return 0;
  let total = 0;
  let day = dayKeyOf(from);
  const last = dayKeyOf(to);
  for (let i = 0; i < 400 && day <= last; i++, day = addDays(day, 1)) {
    const a = Math.max(from, atTime(day, hhmmFrom(DAY_FROM)));
    const b = Math.min(to, atTime(day, hhmmFrom(DAY_TO)));
    if (b > a) total += b - a;
  }
  return total;
}

/**
 * Часы в текстах серии написаны под старт в 20:00 по Алматы (18:00 по Москве). Если старт другой, подставляем его:
 * «20:00» на новое время, «18:00 по Москве» на московское (Алматы минус 2 часа). Остальные числа (23:59 и т.д.) не трогаем.
 */
function retime(r: Rt, start: string | undefined, text: string): string {
  if (!start || start === r.cfg.streamStart) return text;
  const base = r.cfg.streamStart;
  const baseMsk = hhmmFrom(minsOf(base) - 120);
  const msk = hhmmFrom(minsOf(start) - 120);
  return text.split(`${baseMsk} по Москве`).join(`${msk} по Москве`).split(base).join(start);
}

/** Сообщение серии таким, как оно уйдёт в цель: часы в тексте и в вопросе опроса подогнаны под её старт. */
function effMsg(r: Rt, t: { start?: string }, m: WaMsg): WaMsg {
  if (!t.start || t.start === r.cfg.streamStart) return m;
  return { ...m, text: retime(r, t.start, m.text), ...(m.poll ? { poll: { ...m.poll, name: retime(r, t.start, m.poll.name) } } : {}) };
}

// ───────────────────────── цели рассылки ─────────────────────────

const isReady = (t: Target) => (t.kind === "community" ? !!(t.done.announce && t.done.addMode && t.done.approval && t.done.link) : !!(t.done.announce && t.done.link));

/** Цели дня, от нового к старому (последнее переполнение первым). */
const targetsOf = (r: Rt, day: string) => r.state.targets.filter((t) => t.day === day).sort((a, b) => b.seq - a.seq);

/**
 * Цель, на которую сейчас ведёт ссылка.
 *  - daily: готовое сообщество дня, на который записывает бот (assignStreamDay); сообщества живого эфира тут не раздаются;
 *  - event: готовое сообщество эфира весь период набора, до 00:00 после дня эфира; пока его нет, ссылка постоянная.
 */
function servingTarget(r: Rt, now: number): Target | null {
  if (r.state.mode === "event") {
    const ev = r.state.event;
    if (!ev.date || ev.done) return null;
    return targetsOf(r, ev.date).find((t) => isReady(t) && t.link && now < closeAtOf(r, t.day)) ?? null;
  }
  const day = assignStreamDay(now, tcfg(r));
  return targetsOf(r, day).find((t) => t.source !== "event" && isReady(t) && t.link && now < closeAtOf(r, t.day)) ?? null;
}

/**
 * Ссылка для сайта. null: модуль выключен или подходящего сообщества нет, тогда server.ts отдаёт старую ссылку.
 * Никогда не бросает.
 */
export function waGroupLink(now?: number, served = true): string | null {
  try {
    if (!rt) return null;
    if (now === undefined) now = rt.deps.now();
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

/**
 * Ссылка сообщества дня D (для ответа на кнопку шаблона): тот же выбор, что у ссылки на сайте, только для заданного дня.
 * null: готового сообщества этого дня нет, тогда дожим даёт постоянный адрес /wa.
 */
function linkForDay(r: Rt, day: string, now: number): string | null {
  const ok = (t: Target) => isReady(t) && !!t.link && isValidWhatsAppLink(t.link) && now < closeAtOf(r, t.day);
  const list = targetsOf(r, day);
  const t = r.state.mode === "event" ? (day === r.state.event.date ? list.find((x) => x.source === "event" && ok(x)) : undefined) : list.find((x) => x.source !== "event" && ok(x));
  return t ? t.link : null;
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

/**
 * Записать состояние подключения. Заодно ведём «подключён с»: момент, когда мы увидели переход в open (после close, connecting
 * или отсутствия инстанса). Первое наблюдение после запуска модуля или после недоступности Evolution срока не сбрасывает.
 */
function setConn(r: Rt, st: string, now: number) {
  const prev = r.conn.state;
  r.conn = { state: st, at: now };
  if (st === "open") {
    // Подключились: выданный код подключения больше не нужен и повторно не отдаётся.
    r.pairCache = null;
    if (!r.state.connSince || prev === "close" || prev === "connecting" || prev === "absent") {
      r.state.connSince = now;
      save(r);
    }
  } else if (st !== "unreachable" && r.state.connSince) {
    r.state.connSince = 0;
    save(r);
  }
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
  const prev = r.conn.state;
  setConn(r, st, now);
  // Смену состояния подключения пишем в журнал (в пульте видно, когда номер отвалился и вернулся). Первый тик после старта: только если не open.
  if (st !== prev && (prev !== "unknown" || st !== "open")) journal(r, { ev: "conn", state: st, prev });
  if (st === "open") r.downSince = 0;
  else if (!r.downSince) r.downSince = now;
  if (st === "open") {
    if (!r.state.ownerJid || now - r.state.ownerAt > HOUR) {
      const i = await evo.fetchInstance();
      if (i.ok && i.data.ownerJid) {
        r.state.ownerJid = i.data.ownerJid;
        r.state.ownerAt = now;
        r.profileName = i.data.profileName;
        save(r);
      }
    }
    return true;
  }
  // С 23:00 до 09:00 по Алматы тревогу не шлём (владельцы спят): первый тик после 09:00 присылает одну сводную, дальше раз в положенный срок.
  // Потеря и возврат подключения при этом остаются в журнале (строки conn).
  if (daytime(now) && now - r.state.lastConnAlertAt >= r.cfg.alarms.connectionEveryMinutes * MIN) {
    r.state.lastConnAlertAt = now;
    save(r);
    const since = r.downSince && now - r.downSince >= 30 * MIN ? ` Подключения нет с ${when(r.downSince)}.` : "";
    await alarm(r, `WhatsApp не подключён (состояние: ${st}).${since} Рассылка, создание сообществ и одобрение заявок остановлены. /wa_qr пришлёт QR для подключения.`);
  }
  return false;
}

// ───────────────────────── создание сообщества ─────────────────────────

const dayCreations = (r: Rt, now: number) => r.state.creations.filter((t) => now - t < 24 * HOUR).length;
const capReached = (r: Rt, now: number) => dayCreations(r, now) >= r.cfg.maxNewPerDay;

function noteCreation(r: Rt, now: number) {
  r.state.creations = [...r.state.creations.filter((t) => now - t < 48 * HOUR), now];
}

/**
 * Окно создания сообщества, назначенного на момент at: открыто с at, пока не прошло createCatchupHours дневных часов.
 * Ночные часы (с 23:00 до 09:00 по Алматы) в окно не входят: опоздавшее ночью создание переносится на 09:00, а не пропадает.
 */
const createWindowOpen = (r: Rt, at: number, now: number) => now >= at && daytimeMs(at, now) < r.cfg.createCatchupHours * HOUR;

/** Дни эфира, для которых пора создавать сообщество и которых ещё нет: окно [createAt, createAt + догонка), создаём только днём. */
function dueCreateDays(r: Rt, now: number): string[] {
  const out: string[] = [];
  if (!daytime(now)) return out;
  const c = tcfg(r);
  const today = dayKeyOf(now);
  for (let i = 0; i < 14; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c) || r.state.targets.some((t) => t.day === day)) continue;
    if (createWindowOpen(r, createAtOf(r, day), now) && now < closeAtOf(r, day)) out.push(day);
  }
  return out;
}

/** Когда само создаётся сообщество живого эфира: день начала набора в EVENT_CREATE_AT по Алматы. */
export const eventCreateAt = (r: Rt) => atTime(r.state.event.recruitFrom, EVENT_CREATE_AT);

/** Сообщество живого эфира, созданное или принятое под дату эфира (самое новое из переполнений). */
const eventTarget = (r: Rt): Target | null => (r.state.event.date ? targetsOf(r, r.state.event.date)[0] ?? null : null);

/** Живой эфир ждёт создания: режим event, дата и начало набора заданы, сообщества ещё нет, эфир не закончился. Само создаётся только днём. */
function eventDue(r: Rt, now: number): boolean {
  const ev = r.state.event;
  if (r.state.mode !== "event" || ev.done || !ev.date || !ev.recruitFrom) return false;
  if (eventTarget(r)) return false;
  return now >= eventCreateAt(r) && now < closeAtOf(r, ev.date) && daytime(now);
}

/** Дни, для которых пора создавать сообщество: в ежедневном режиме при включённом создании по расписанию, в живом эфире день эфира. */
function dueCreates(r: Rt, now: number): string[] {
  if (r.state.mode === "event") return eventDue(r, now) ? [r.state.event.date] : [];
  return r.state.daily.enabled ? dueCreateDays(r, now) : [];
}

/** Эфир прошёл (00:00 после дня эфира): режим завершён, возвращаемся к ежедневному с выключенным созданием, ссылка снова постоянная. */
function finishEventIfOver(r: Rt, now: number): boolean {
  const ev = r.state.event;
  if (r.state.mode !== "event" || ev.done || !ev.date || now < closeAtOf(r, ev.date)) return false;
  ev.done = true;
  ev.doneAt = now;
  r.state.mode = "daily";
  r.state.daily.enabled = false;
  save(r);
  journal(r, { ev: "event_done", date: ev.date, target: ev.communityId || "" });
  console.log("[wa] живой эфир %s завершён, режим вернулся на ежедневный (создание выключено)", ev.date);
  return true;
}

/** Если под дату эфира уже есть сообщество (создали или принятое), запомнить его id в настройках эфира. */
function syncEventCommunity(r: Rt) {
  const ev = r.state.event;
  if (r.state.mode !== "event" || !ev.date || ev.done) return;
  const t = eventTarget(r);
  if (t && ev.communityId !== t.id) {
    ev.communityId = t.id;
    save(r);
  }
}

type CreateResult = { ok: true; target: Target } | { ok: false; error: string };

/** Создать сообщество (или группу) эфира day с номером seq и сохранить. Настройки и ссылка ставятся следом (setupSteps). */
async function createTarget(r: Rt, day: string, seq: number, now: number, opts: { source?: "daily" | "event"; start?: string } = {}): Promise<CreateResult> {
  const kind = r.cfg.target;
  const name = nameOf(r, day, seq);
  const description = retime(r, opts.start, r.cfg.description);
  let created: { jid: string; sendJid: string };
  // Последний рубеж против дубля: сообщество с таким id уже есть (другой путь успел раньше), второго не открываем.
  if (r.state.targets.some((x) => x.id === `${day}#${seq}`)) return { ok: false, error: "сообщество уже есть" };
  if (kind === "group" && !adminNumbers().length) {
    await noteFail(r, `создание ${name}`, "для обычной группы нужен хотя бы один номер в WA_ADMIN_NUMBERS");
    return { ok: false, error: "нет WA_ADMIN_NUMBERS" };
  }
  r.state.pendingCreate = { day, seq, kind, at: now };
  save(r);
  const res =
    kind === "community"
      ? await evo.communityCreate({ subject: name, description, approvalRequired: true })
      : await evo.groupCreate({ subject: name, description, participants: adminNumbers() });
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
    ...(opts.source === "event" ? { source: "event" as const } : {}),
    ...(opts.start && opts.start !== r.cfg.streamStart ? { start: opts.start } : {}),
  };
  r.state.targets.push(t);
  r.state.pendingCreate = null;
  noteCreation(r, now);
  save(r);
  journal(r, { ev: "create", target: t.id, day, kind, jid: t.jid, sendJid: t.sendJid, name, ...(t.source ? { source: t.source } : {}) });
  console.log("[wa] создано %s %s (%s)", kind === "community" ? "сообщество" : "группа", t.id, name);
  noteOk(r);
  return { ok: true, target: t };
}

const welcomeText = (r: Rt, t: Target, now: number) => retime(r, t.start, r.cfg.welcome.replace("{dayWordLower}", dayWordLower(t.day, now)).replace("{date}", ddmm(t.day)));

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
    // Приветствие ночью не шлём: оно уйдёт на ближайшем тике после 09:00 по Алматы.
    if (s === "welcome" && ((t.tries.welcome || 0) >= 3 || !isReady(t) || !daytime(now))) continue;
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

/**
 * Все части сообщения отправлены. Часть с неясным исходом (unknown) для плановой рассылки считается отправленной (повторять нельзя),
 * а при strict (ручная отправка, строка итогов) нет: её можно отправить ещё раз и нельзя назвать доставленной.
 */
const isDone = (r: Rt, m: WaMsg, t: Target, strict = false) =>
  partsOf(r, m).every((p) => {
    const k = sentKey(m.id, p, t.day, t.id);
    return r.sent.has(k) && !(strict && r.unknown.has(k));
  });

/** Исход отправки неясен: таймаут, 5xx или обрыв связи после отправки. Запрос мог выполниться, поэтому повторять его самим нельзя. */
const unclearSend = (f: evo.EvoFail) => ambiguous(f) && f.error !== "no_api_key";

type PartRes = { ok: true } | { ok: false; error: string; unknown?: boolean };

/**
 * Отправить одну часть и записать строку журнала. Уже отправленную часть не повторяет.
 * Таймаут или 5xx: часть помечается отправленной с неясным исходом (unknown: true в журнале, переживает рестарт),
 * автоматически не повторяется, владельцам уходит тревога. Вручную (manual) такую часть отправить ещё раз можно.
 */
async function sendPart(r: Rt, t: Target, msgId: string, part: string, run: () => Promise<evo.EvoResult<evo.SentMsg>>, manual: boolean, extra: Record<string, unknown> = {}): Promise<PartRes> {
  const key = sentKey(msgId, part, t.day, t.id);
  if (r.sent.has(key) && !(manual && r.unknown.has(key))) return { ok: true };
  const x = await run();
  const unknown = !x.ok && unclearSend(x);
  journal(r, {
    ev: "send",
    msg: msgId,
    part,
    day: t.day,
    target: t.id,
    jid: t.sendJid,
    ok: x.ok,
    ...(x.ok ? { mid: x.data.messageId } : { err: x.error }),
    ...(unknown ? { unknown: true } : {}),
    ...(manual ? { manual: true } : {}),
    ...extra,
  });
  if (x.ok) {
    r.sent.add(key);
    r.unknown.delete(key);
    return { ok: true };
  }
  if (unknown) {
    r.sent.add(key);
    r.unknown.add(key);
    await alarm(
      r,
      msgId === "welcome"
        ? `Не уверен, что приветствие ушло в «${t.name}». Проверь в WhatsApp.`
        : `Не уверен, что ушло ${msgId} в «${t.name}». Проверь в WhatsApp, при необходимости /wa_send ${msgId}`,
    );
    return { ok: false, error: x.error, unknown: true };
  }
  return { ok: false, error: x.error };
}

/** Отправить сообщение серии в цель: картинка или видео с подписью (или текст), отдельный текст, опрос. Возвращает false при первой неудаче. */
async function sendMessageTo(r: Rt, t: Target, base: WaMsg, manual: boolean): Promise<boolean> {
  const m = effMsg(r, t, base);
  let first = true;
  for (const part of partsOf(r, m)) {
    const key = sentKey(m.id, part, t.day, t.id);
    if (r.sent.has(key) && !(manual && r.unknown.has(key))) continue;
    if (!first) await pause(r, r.cfg.pacing.betweenStepsMs);
    first = false;
    let res: PartRes;
    if (part === "poll") {
      const p = m.poll as NonNullable<WaMsg["poll"]>;
      res = await sendPart(r, t, m.id, part, () => evo.sendPoll(t.sendJid, { name: p.name, values: p.options, selectableCount: p.selectableCount ?? 1 }), manual);
    } else if (part === "text") {
      res = await sendPart(r, t, m.id, part, () => evo.sendText(t.sendJid, m.text), manual);
    } else if (m.media) {
      const media = m.media;
      const caption = m.text.length <= r.cfg.captionLimit ? m.text : undefined;
      res = await sendPart(r, t, m.id, part, () => evo.sendMedia(t.sendJid, { mediatype: media.type, url: media.url, caption }), manual);
      if (!res.ok && !res.unknown) {
        // Картинка явно не ушла (ответ 4xx): тот же текст обычным сообщением, владельцам одно предупреждение на файл.
        // При таймауте или 5xx текст вместо картинки не шлём: она могла уйти, было бы два сообщения.
        console.warn("[wa] медиа %s не ушло (%s), шлю текстом", media.url, res.error);
        if (!r.mediaWarned.has(media.url)) {
          r.mediaWarned.add(media.url);
          void alarm(r, `Не отправилась картинка или видео ${media.url}: ${res.error}. Шлю тот же текст без неё. Проверь, что файл выложен на сайт.`);
        }
        const fb = await sendPart(r, t, m.id, part, () => evo.sendText(t.sendJid, m.text), manual, { fallback: "text" });
        if (fb.ok || fb.unknown) res = fb;
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

/** Запись в журнал о сообщении, не ушедшем из-за ночного времени: один раз на сообщение и цель. */
function noteNightSkip(r: Rt, t: Target, msg: WaMsg, plan: number) {
  const key = `${msg.id}|${t.day}|${t.id}`;
  if (r.nightSkipped.has(key)) return;
  r.nightSkipped.add(key);
  journal(r, { ev: "skip", msg: msg.id, day: t.day, target: t.id, reason: "night", plan: hhmmOf(plan) });
  console.warn("[wa] «%s» в %s пропущено: плановое время %s вне окна 09:00 до 23:45", msg.id, t.id, hhmmOf(plan));
}

/** Сообщения, которые сейчас в окне отправки: [плановое время дня эфира, плюс grace], не раньше создания цели. */
export function dueSends(r: Rt, now: number): Due[] {
  const out: Due[] = [];
  for (const t of r.state.targets) {
    if (!isReady(t) || now >= closeAtOf(r, t.day)) continue;
    for (const msg of r.cfg.messages) {
      if (msg.enabled === false) continue;
      const plan = planOf(r, t, msg);
      if (now < plan || now > plan + r.cfg.graceMinutes * MIN) continue;
      // Прошлые сообщения новому сообществу не досылаем.
      if (plan < t.createdAt) continue;
      if (isDone(r, msg, t)) continue;
      // Ночью (плановое время раньше 09:00 или позже 23:45 по Алматы) не шлём: пропуск остаётся в журнале, тревоги нет.
      if (!sendableTime(plan)) {
        noteNightSkip(r, t, msg, plan);
        continue;
      }
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
    if (n !== undefined) {
      t.members = n;
      // Свежий замер уже включает тех, кого одобрили раньше: счёт «одобрено после замера» начинается заново.
      r.approvedSince.set(t.id, 0);
    }
  } else {
    console.warn("[wa] число участников %s не получено: %s", t.id, x.error);
  }
  save(r);
  return x.ok;
}

/** Оценка числа участников: последний замер плюс одобренные после него заявки. */
const heldMembers = (r: Rt, t: Target) => (t.members ?? 0) + (r.approvedSince.get(t.id) || 0);

/**
 * Открыть следующее сообщество того же эфира («(2)»). Один раз: только у самого нового сообщества дня, пока день не закрыт.
 * Лимит новых сообществ в сутки и пауза модуля действуют; при исчерпанном лимите владельцам одна тревога в день.
 */
async function openNext(r: Rt, t: Target, now: number, members: number) {
  if (r.state.paused || r.state.pendingCreate || r.deps.now() < r.state.retryAt) return;
  if (targetsOf(r, t.day)[0].id !== t.id || now >= closeAtOf(r, t.day)) return;
  const limit = r.cfg.overflowAt[t.kind];
  if (capReached(r, now)) {
    if (r.state.capAlertDay !== dayKeyOf(now)) {
      r.state.capAlertDay = dayKeyOf(now);
      save(r);
      await alarm(r, `В «${t.name}» уже ${members} участников, а лимит ${r.cfg.maxNewPerDay} новых сообществ в сутки исчерпан. Следующее не открыто, ссылка прежняя. Открыть вручную: /wa_new.`);
    }
    return;
  }
  await pause(r, r.cfg.pacing.betweenStepsMs);
  const c = await createTarget(r, t.day, t.seq + 1, r.deps.now(), { source: t.source ?? "daily", start: t.start });
  if (!c.ok) return;
  await alarm(r, `В «${t.name}» ${members} участников из ${limit}. Открыто следующее: «${c.target.name}», ссылка на сайте переключится на него, как только оно будет готово.`);
  await pause(r, r.cfg.pacing.betweenStepsMs);
  await setupSteps(r, c.target);
}

async function runMemberChecks(r: Rt, now: number) {
  const t = servingTarget(r, now);
  if (!t || r.state.paused) return;
  await refreshMembers(r, t, now);
  if (t.members === undefined) return;
  const held = heldMembers(r, t);
  if (held < r.cfg.overflowAt[t.kind]) return;
  await openNext(r, t, now, held);
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
      // Вебхук ассистента приводим в порядок и на паузе, и без подключения: он нужен только Evolution, не WhatsApp.
      try {
        await aiTick(now);
      } catch (e) {
        console.error("[wa] вебхук ассистента:", (e as Error)?.message || e);
      }
      // Конец живого эфира и привязка найденного сообщества не требуют WhatsApp: делаем их, даже если модуль на паузе.
      finishEventIfOver(r, now);
      syncEventCommunity(r);
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
      for (const day of dueCreates(r, now)) {
        if (r.state.paused || r.deps.now() < r.state.retryAt) break;
        if (capReached(r, now)) {
          if (r.state.capAlertDay !== dayKeyOf(now)) {
            r.state.capAlertDay = dayKeyOf(now);
            save(r);
            await alarm(r, `Лимит ${r.cfg.maxNewPerDay} новых сообществ в сутки исчерпан, сообщество эфира ${ddmm(day)} не создано. Создать вручную позже: /wa_new.`);
          }
          break;
        }
        const ev = r.state.mode === "event" ? r.state.event : null;
        const c = await createTarget(r, day, 1, r.deps.now(), ev ? { source: "event", start: ev.start } : {});
        if (!c.ok) break;
        created++;
        syncEventCommunity(r);
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

/** Запомнить вступление по заявке за день (по Алматы): из этого считается «вступили сегодня» в пульте. */
function noteJoinedDay(r: Rt, target: string, day: string) {
  let m = r.joinedByDay.get(target);
  if (!m) r.joinedByDay.set(target, (m = new Map()));
  m.set(day, (m.get(day) || 0) + 1);
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
  const waiting = reqs.map((q) => q.jid).filter((jid) => !r.approved.has(`${t.jid}|${jid}`) && (r.approveFails.get(`${t.jid}|${jid}`) || 0) < 3);
  if (!waiting.length) {
    r.joinFailStreak = 0;
    return 0;
  }
  // Перед каждым пакетом считаем заполнение: замер участников плюс одобренные после него. Лимит достигнут: не одобряем, сразу открываем
  // следующее сообщество (ждать пятиминутного замера нельзя, в большой день за это время набегают сотни человек).
  const limit = r.cfg.overflowAt[t.kind];
  const room = limit - heldMembers(r, t);
  if (room <= 0) {
    await openNext(r, t, now, heldMembers(r, t));
    return 0;
  }
  const todo = waiting.slice(0, Math.min(room, r.cfg.joinPolling.batch));
  const d = await evo.communityDecide(t.jid, todo, "approve");
  if (!d.ok) {
    // Сбой самого Evolution (таймаут, 5xx, сеть, ключ, частота) не вина людей: счётчик отказов не трогаем, заявки уйдут в следующий пакет.
    // Явный отказ на весь пакет (400, 404, 422) может вызвать один «ядовитый» номер: считаем попытку каждому, иначе очередь встанет навсегда.
    if (d.status >= 400 && d.status < 500 && ![401, 403, 408, 429].includes(d.status)) {
      for (const jid of todo) r.approveFails.set(`${t.jid}|${jid}`, (r.approveFails.get(`${t.jid}|${jid}`) || 0) + 1);
    }
    append(fJoins(r), { ts: iso(r.deps.now()), ev: "approve_error", community: t.jid, target: t.id, count: todo.length, err: d.error });
    await softJoinFail(r, now, `одобрение заявок ${t.id}: ${d.error}`);
    return 0;
  }
  r.joinFailStreak = 0;
  let n = 0;
  let full = false;
  for (const x of normalizeDecisions(d.data, todo)) {
    const k = `${t.jid}|${x.jid}`;
    append(fJoins(r), { ts: iso(r.deps.now()), ev: "approve", community: t.jid, target: t.id, day: t.day, jid: x.jid, ok: x.ok, status: x.status });
    if (x.ok) {
      r.approved.add(k);
      r.joinedCount.set(t.id, (r.joinedCount.get(t.id) || 0) + 1);
      r.approvedSince.set(t.id, (r.approvedSince.get(t.id) || 0) + 1);
      noteJoinedDay(r, t.id, dayKeyOf(r.deps.now()));
      n++;
    } else if (LIMIT_REFUSAL.test(x.status)) {
      // Отказ из-за лимита сообщества: заявку в новое сообщество не перенести, а повтор после замера возможен, поэтому в отказы не считаем.
      full = true;
    } else {
      r.approveFails.set(k, (r.approveFails.get(k) || 0) + 1);
    }
  }
  if (full) {
    // WhatsApp говорит «полно»: считаем сообщество заполненным до следующего замера и сразу открываем следующее.
    t.members = Math.max(t.members ?? 0, limit);
    t.membersAt = r.deps.now();
    r.approvedSince.set(t.id, 0);
    save(r);
    await openNext(r, t, r.deps.now(), t.members);
  }
  return n;
}

/** Статус отказа по человеку, означающий «в сообществе нет места» (419 у WhatsApp, либо слова full и limit в тексте). */
const LIMIT_REFUSAL = /^419$|full|limit/i;

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
  if (m < 90) return `через ${m} мин`;
  // Дальше двух суток считаем днями: «через 117 ч 20 мин» читается плохо.
  if (m >= 2880) return `через ${Math.floor(m / 1440)} дн. ${Math.floor((m % 1440) / 60)} ч`;
  return `через ${Math.floor(m / 60)} ч ${m % 60} мин`;
};

export type NextMsg = { plan: number; id: string; topic: string; day: string };

/**
 * Ближайшее сообщение расписания по сообществам, которые есть или будут. Ежедневный режим: ближайшие дни эфира, где уже есть
 * сообщество или создание включено. Живой эфир: только день эфира, со сдвигом по времени старта.
 */
function nextMessage(r: Rt, now: number): NextMsg | null {
  let best: NextMsg | null = null;
  const consider = (day: string, start?: string) => {
    for (const m of r.cfg.messages) {
      if (m.enabled === false) continue;
      const plan = planOf(r, { day, start }, m);
      if (plan >= now && plan < closeAtOf(r, day) && sendableTime(plan) && (!best || plan < best.plan)) best = { plan, id: m.id, topic: m.topic || m.id, day };
    }
  };
  if (r.state.mode === "event") {
    const ev = r.state.event;
    if (ev.date && !ev.done) consider(ev.date, eventTarget(r)?.start ?? (ev.start && ev.start !== r.cfg.streamStart ? ev.start : undefined));
    return best;
  }
  const c = tcfg(r);
  const today = dayKeyOf(now);
  for (let i = 0; i < 4; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c)) continue;
    const ts = targetsOf(r, day).filter((t) => t.source !== "event");
    if (!ts.length && !r.state.daily.enabled) continue;
    consider(day, ts[0]?.start);
  }
  return best;
}

function nextMessageText(r: Rt, now: number): string {
  const b = nextMessage(r, now);
  return b ? `${hhmmOf(b.plan)} ${b.id} (эфир ${ddmm(b.day)}), ${inText(b.plan - now)}` : "нет";
}

function targetLine(r: Rt, label: string, day: string, now: number): string {
  const ts = [...targetsOf(r, day)].reverse().filter((t) => r.state.mode === "event" || t.source !== "event");
  const at = createAtOf(r, day);
  if (!ts.length) return r.state.daily.enabled ? `${label} ${ddmm(day)}: пока нет, создам в ${hhmmOf(at)} ${ddmm(dayKeyOf(at))}` : `${label} ${ddmm(day)}: пока нет, ежедневное создание выключено`;
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
    setConn(r, c.ok ? c.data.state : "unreachable", now);
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
  const ev = r.state.event;
  const lines = [
    `WhatsApp-модуль: ${r.state.paused ? `на паузе (${r.state.pausedReason || "причина не записана"})` : "работает"}, тип ${r.cfg.target === "community" ? "сообщество" : "группа"}`,
    r.state.mode === "event"
      ? `Режим: живой эфир${ev.date ? ` ${ddmm(ev.date)} в ${ev.start}, набор с ${ddmm(ev.recruitFrom)}` : ", дата эфира не задана"}`
      : `Режим: ежедневный, создание ${r.state.daily.enabled ? "включено" : "выключено"}`,
    `Подключение: ${conn}${conn === "open" ? `, ${number}` : ""}`,
    ...(r.state.mode === "event"
      ? [ev.date ? (eventTarget(r) ? targetLine(r, "Сообщество эфира", ev.date, now) : `Сообщество эфира ${ddmm(ev.date)}: пока нет, создам ${ddmm(ev.recruitFrom)} в ${EVENT_CREATE_AT}`) : "Сообщество эфира: пока нет"]
      : [targetLine(r, "Эфир", cur, now), targetLine(r, "Следующий эфир", next, now)]),
    `Ссылка на сайте сейчас: ${link ?? "старая постоянная (подходящего сообщества нет)"}`,
    `Ближайшее сообщение: ${nextMessageText(r, now)}`,
    `Новых сообществ за сутки: ${dayCreations(r, now)} из ${r.cfg.maxNewPerDay}`,
    `Ошибок подряд: ${r.state.failStreak} из ${r.cfg.retry.pauseAfter}`,
    // Строка про ассистента только когда он включён: при выключенном вывод /wa прежний.
    ...(r.state.assistant.enabled ? ["ИИ-ассистент в личке: включён (/wa_ai покажет счётчики за сегодня)"] : []),
    ...(r.state.dozhim.enabled ? ["Дожим WABA: включён (/wa_dozhim покажет счётчики за сегодня)"] : []),
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

function cmdPause(r: Rt, now: number, by: "bot" | "panel" = "bot"): WaReply {
  if (r.state.paused) return { text: "Модуль уже на паузе." };
  r.state.paused = true;
  r.state.pausedAt = now;
  r.state.pausedReason = by === "panel" ? "вручную, из пульта" : "вручную, /wa_pause";
  save(r);
  journal(r, { ev: "pause", reason: r.state.pausedReason });
  return { text: by === "panel" ? "Пауза включена: рассылка, создание и одобрение заявок остановлены." : "Пауза включена: рассылка, создание и одобрение заявок остановлены. Вернуть: /wa_resume." };
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

/** Результат действия из пульта или команды: ok, короткий код причины для интерфейса и текст по-русски. */
export type Act = { ok: boolean; code?: string; message: string };
const fail = (code: string, message: string): Act => ({ ok: false, code, message });

/**
 * Проверки перед ручным созданием сообщества эфира: режим, дата, неподтверждённое создание, пауза, уже созданное, лимит в сутки.
 * null: создавать можно. Вызывается дважды: сразу (быстрый ответ) и первой строкой внутри очереди exclusive: пока запрос ждал очередь,
 * тик или другой вызов мог уже создать сообщество, и без повтора проверок получилось бы второе сообщество того же эфира.
 */
function eventCreateCheck(r: Rt, now: number): Act | null {
  const ev = r.state.event;
  if (r.state.mode !== "event") return fail("wrong_mode", "Сейчас включён ежедневный режим. Переключись на живой эфир.");
  if (!ev.date) return fail("no_event", "Сначала задай дату эфира и сохрани.");
  if (ev.done || now >= closeAtOf(r, ev.date)) return fail("over", `Эфир ${ddmm(ev.date)} уже закончился. Задай новую дату.`);
  if (r.state.pendingCreate) return fail("pending", "Прошлое создание не подтверждено. Проверь телефон и сними паузу (она обнулит ожидание).");
  if (r.state.paused) return fail("paused", "Модуль на паузе. Сначала сними паузу.");
  const existing = eventTarget(r);
  if (existing) {
    syncEventCommunity(r);
    return { ok: true, code: "exists", message: `Для эфира ${ddmm(ev.date)} сообщество уже есть: «${existing.name}»${existing.link ? `, ссылка ${existing.link}` : ", ссылка ещё не готова"}.` };
  }
  if (capReached(r, now)) return fail("cap", `Лимит ${r.cfg.maxNewPerDay} новых сообществ в сутки исчерпан. Подожди.`);
  return null;
}

/**
 * Создать сообщество живого эфира сейчас (кнопка «Создать сейчас», в режиме event команда /wa_new делает то же).
 * Защита номера та же: пауза, неподтверждённое создание, лимит в сутки, подключение, пауза между шагами.
 */
async function eventCreateNow(r: Rt, now: number): Promise<Act> {
  const early = eventCreateCheck(r, now);
  if (early) return early;
  return exclusive(r, async () => {
    const late = eventCreateCheck(r, Math.max(now, r.deps.now()));
    if (late) return late;
    const ev = r.state.event;
    if (!(await checkConnection(r, now))) return fail("no_connection", `WhatsApp не подключён (${r.conn.state}). Подключи номер по QR.`);
    const res = await createTarget(r, ev.date, 1, r.deps.now(), { source: "event", start: ev.start });
    if (!res.ok) return fail("create_failed", r.state.paused ? "Создание не подтверждено, модуль на паузе. Подробности в тревоге в Telegram." : `Не создалось: ${res.error}`);
    syncEventCommunity(r);
    await pause(r, r.cfg.pacing.betweenStepsMs);
    const done = await setupSteps(r, res.target);
    const t = res.target;
    return { ok: true, code: isReady(t) ? "created" : "building", message: `Создано: «${t.name}». ${isReady(t) ? `Ссылка: ${t.link}. На сайте она действует до 00:00 после эфира.` : done ? "Достраивается." : "Настройки не закончены, модуль повторит на ближайших тиках."}` };
  });
}

/** Проверки перед /wa_new для дня day (неподтверждённое создание, пауза, уже созданное, лимит). null: можно. Повторяются внутри очереди exclusive. */
function cmdNewCheck(r: Rt, day: string, now: number): WaReply | null {
  if (r.state.pendingCreate) return { text: "Прошлое создание не подтверждено. Проверь телефон и сделай /wa_resume." };
  if (r.state.paused) return { text: "Модуль на паузе. Сначала /wa_resume." };
  const existing = targetsOf(r, day)[0];
  if (existing) return { text: `Для эфира ${ddmm(day)} сообщество уже есть: «${existing.name}»${existing.link ? `, ссылка ${existing.link}` : ", ссылка ещё не готова"}.` };
  if (capReached(r, now)) return { text: `Лимит ${r.cfg.maxNewPerDay} новых сообществ в сутки исчерпан. Подожди.` };
  return null;
}

/** /wa_new [YYYY-MM-DD]: создать сообщество ближайшего эфира, для которого его ещё нет, вручную сейчас. В режиме живого эфира то же, что «Создать сейчас». */
async function cmdNew(r: Rt, args: string, now: number): Promise<WaReply> {
  if (r.state.mode === "event") return { text: (await eventCreateNow(r, now)).message };
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
  const early = cmdNewCheck(r, day, now);
  if (early) return early;
  return exclusive(r, async () => {
    // Пока запрос ждал очередь, тик или другой вызов мог создать сообщество этого эфира: проверяем заново.
    const late = cmdNewCheck(r, day, Math.max(now, r.deps.now()));
    if (late) return late;
    if (!(await checkConnection(r, now))) return { text: `WhatsApp не подключён (${r.conn.state}). /wa_qr пришлёт QR.` };
    const res = await createTarget(r, day, 1, r.deps.now());
    if (!res.ok) return { text: r.state.paused ? "Создание не подтверждено, модуль на паузе. Подробности в тревоге выше." : `Не создалось: ${res.error}` };
    await pause(r, r.cfg.pacing.betweenStepsMs);
    const done = await setupSteps(r, res.target);
    const t = res.target;
    return { text: `Создано: «${t.name}». ${isReady(t) ? `Ссылка: ${t.link}. На сайте переключится по расписанию (в ${hhmmOf(atTime(addDays(day, -1), c.streamStart) + (c.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES) * MIN)} накануне эфира).` : done ? "Достраивается." : "Настройки не закончены, модуль повторит на ближайших тиках."}` };
  });
}

/**
 * Готовые сообщества, куда идёт ручная отправка «сейчас». Ежедневный режим: сообщества сегодняшнего эфира (кроме живого эфира).
 * Живой эфир: сообщества его даты, в любой день до 00:00 после эфира.
 */
function currentTargets(r: Rt, now: number): { day: string; list: Target[] } {
  const day = r.state.mode === "event" ? r.state.event.date : dayKeyOf(now);
  const list = day
    ? [...targetsOf(r, day)].reverse().filter((t) => (r.state.mode === "event" ? true : t.source !== "event") && isReady(t) && now < closeAtOf(r, t.day))
    : [];
  return { day, list };
}

type SendRes = { ok: boolean; code?: string; text: string; sent: number; skipped: number; failed: number; targets: number };

/** Отправить сообщение серии вручную во все готовые сообщества текущего эфира. Уже ушедшее не повторяется. */
async function sendSeries(r: Rt, id: string, now: number): Promise<SendRes> {
  const ids = r.cfg.messages.map((m) => m.id).join(", ");
  const zero = { sent: 0, skipped: 0, failed: 0, targets: 0 };
  if (!id) return { ok: false, code: "no_id", text: `Укажи id сообщения: /wa_send morning. Список: ${ids}`, ...zero };
  const msg = r.cfg.messages.find((m) => m.id === id);
  if (!msg) return { ok: false, code: "bad_id", text: `Нет сообщения «${id}». Список: ${ids}`, ...zero };
  if (r.state.paused) return { ok: false, code: "paused", text: "Модуль на паузе. Сначала /wa_resume.", ...zero };
  const { day, list: targets } = currentTargets(r, now);
  if (!targets.length) {
    const text = r.state.mode === "event" ? (day ? `Для эфира (${ddmm(day)}) нет готового сообщества.` : "Живой эфир не задан, сообщества нет.") : `Для сегодняшнего эфира (${ddmm(dayKeyOf(now))}) нет готового сообщества.`;
    return { ok: false, code: "no_target", text, ...zero };
  }
  return exclusive(r, async () => {
    if (!(await checkConnection(r, now))) return { ok: false, code: "no_connection", text: `WhatsApp не подключён (${r.conn.state}). Ничего не отправлено.`, ...zero, targets: targets.length };
    let ok = 0;
    let skipped = 0;
    let failed = 0;
    let first = true;
    for (const t of targets) {
      // Часть с неясным исходом (таймаут, 5xx) вручную можно отправить ещё раз: поэтому она не считается «уже было».
      if (isDone(r, msg, t, true)) {
        skipped++;
        continue;
      }
      if (r.state.paused) break;
      if (!first) await pause(r, r.cfg.pacing.betweenSendsMs);
      first = false;
      if (await sendMessageTo(r, t, msg, true)) ok++;
      else failed++;
    }
    return { ok: failed === 0, code: failed ? "partial" : "sent", text: `«${id}»: отправлено ${ok}, уже было ${skipped}, не ушло ${failed} (сообществ ${r.state.mode === "event" ? "эфира" : "сегодня"}: ${targets.length}).`, sent: ok, skipped, failed, targets: targets.length };
  });
}

/** /wa_send <id>: отправить сообщение серии вручную во все готовые сообщества текущего эфира. */
async function cmdSend(r: Rt, args: string, now: number): Promise<WaReply> {
  return { text: (await sendSeries(r, args.split(/\s+/)[0], now)).text };
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
    if (cmd === "wa_ai" || cmd === "wa_ai_test") return { text: await aiCommand(cmd, args) };
    if (cmd === "wa_dozhim" || cmd === "wa_dozhim_test") return { text: await dzCommand(cmd, args) };
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
  const done = ts.reduce((s, t) => s + r.cfg.messages.filter((m) => m.enabled !== false && isDone(r, m, t, true)).length, 0);
  return `WhatsApp: вступили по заявкам ${joined}, сообщений серии ушло ${done} из ${total}.`;
}

// ───────────────────────── пульт: действия ─────────────────────────
// Всё, что делает пульт админки (form-api/wa-admin.ts), живёт здесь: те же правила защиты номера, что у команд бота.
// Каждая функция возвращает Act или данные, не бросает. now необязателен: по умолчанию часы модуля (в тестах подменены).

const MODULE_OFF = fail("module_off", "Модуль WhatsApp не запущен: на сервере нет WA_GROUPS=on или он не стартовал (см. /api/health).");
const clock = (r: Rt, now?: number) => now ?? r.deps.now();
const when = (ms: number) => `${ddmm(dayKeyOf(ms))} в ${hhmmOf(ms)}`;

/** Переключить режим. Режимы взаимоисключающие: уходя в живой эфир, ежедневное создание выключается. Созданное не трогается. */
export function waSetMode(mode: unknown, nowArg?: number): Act {
  const r = rt;
  if (!r) return MODULE_OFF;
  if (mode !== "daily" && mode !== "event") return fail("bad_request", "Режим: daily или event.");
  if (r.state.mode === mode) return { ok: true, code: "same", message: "Этот режим уже включён." };
  r.state.mode = mode;
  if (mode === "event") {
    r.state.daily.enabled = false;
    // Прошлый, уже завершённый эфир на экране не нужен: форма начинается с чистого листа.
    if (r.state.event.done) r.state.event = { ...freshEvent(), start: r.cfg.streamStart };
  }
  save(r);
  journal(r, { ev: "mode", mode, by: "panel" });
  return {
    ok: true,
    message:
      mode === "event"
        ? "Включён живой эфир. Ежедневное создание выключено. Созданные сообщества продолжают работать, но ссылка на сайте теперь ведёт в сообщество живого эфира."
        : "Включён ежедневный режим. Создание сообществ выключено, пока не включишь его переключателем. Сообщество живого эфира продолжает работать.",
  };
}

/** Ежедневное создание: вкл или выкл. Только в ежедневном режиме. */
export function waSetDaily(enabled: unknown, nowArg?: number): Act {
  const r = rt;
  if (!r) return MODULE_OFF;
  if (typeof enabled !== "boolean") return fail("bad_request", "Нужно true или false.");
  // Выключить можно всегда: в живом эфире оно и так выключено.
  if (!enabled && r.state.mode !== "daily") return { ok: true, code: "same", message: "Ежедневное создание уже выключено." };
  if (r.state.mode !== "daily") return fail("wrong_mode", "Ежедневное создание включается только в ежедневном режиме. Сначала переключи режим.");
  if (r.state.daily.enabled === enabled) return { ok: true, code: "same", message: enabled ? "Ежедневное создание уже включено." : "Ежедневное создание уже выключено." };
  r.state.daily.enabled = enabled;
  save(r);
  journal(r, { ev: "daily", enabled, by: "panel" });
  const now = clock(r, nowArg);
  if (!enabled) return { ok: true, message: "Ежедневное создание выключено: новые сообщества не создаются. Созданные работают до конца." };
  const nx = nextDailyCreate(r, now);
  return { ok: true, message: nx ? `Ежедневное создание включено. Ближайшее сообщество, эфир ${ddmm(nx.day)}, создам ${when(nx.at)}.` : "Ежедневное создание включено." };
}

/** Допустимый старт живого эфира: с 18:00 до 21:00 по Алматы. Раньше утренние сообщения серии уходят до 09:00, позже оффер встаёт позже дожима. */
const START_MIN = 18 * 60;
const START_MAX = 21 * 60;

/** Сохранить настройки живого эфира: дата эфира, время старта, день начала набора. Только в режиме event, пока сообщество не создано. */
export function waSetEvent(p: { date?: unknown; start?: unknown; recruitFrom?: unknown }, nowArg?: number): Act {
  const r = rt;
  if (!r) return MODULE_OFF;
  if (r.state.mode !== "event") return fail("wrong_mode", "Настройки живого эфира доступны в режиме «Живой эфир». Сначала переключи режим.");
  const now = clock(r, nowArg);
  const today = dayKeyOf(now);
  const cur = r.state.event;
  if (!cur.done && cur.communityId && eventTarget(r)) return fail("locked", "Сообщество этого эфира уже создано, даты и время не меняются. Нажми «Сбросить эфир» и задай новый.");
  if (!isDayKey(p.date)) return fail("bad_date", "Укажи дату эфира.");
  if (p.date < today) return fail("bad_date", "Дата эфира уже прошла.");
  if (p.date > addDays(today, 90)) return fail("bad_date", "Эфир дальше чем через 90 дней: проверь дату.");
  let start: string;
  try {
    start = normHHMM(String(p.start || r.cfg.streamStart));
  } catch {
    return fail("bad_start", "Время старта вида 20:00.");
  }
  if (minsOf(start) < START_MIN || minsOf(start) > START_MAX) return fail("bad_start", "Старт эфира от 18:00 до 21:00 по Алматы: серия написана под вечерний эфир, утренние сообщения не должны уходить до 09:00.");
  if (!isDayKey(p.recruitFrom)) return fail("bad_recruit", "Укажи день начала набора.");
  if (p.recruitFrom > p.date) return fail("bad_recruit", "Набор не может начаться позже дня эфира.");
  if (p.recruitFrom < addDays(p.date, -30)) return fail("bad_recruit", "Набор длиннее 30 дней: проверь дату.");
  r.state.event = { date: p.date, start, recruitFrom: p.recruitFrom };
  syncEventCommunity(r);
  save(r);
  journal(r, { ev: "event_set", date: p.date, start, recruitFrom: p.recruitFrom, by: "panel" });
  const at = eventCreateAt(r);
  const text = eventTarget(r)
    ? `Сохранено. Для эфира ${ddmm(p.date)} сообщество уже есть, ссылка на сайте ведёт в него.`
    : now >= at
      ? daytime(now)
        ? `Сохранено: эфир ${ddmm(p.date)} в ${start}. Набор уже идёт, сообщество создам в ближайшие 30 секунд.`
        : `Сохранено: эфир ${ddmm(p.date)} в ${start}. Набор уже идёт, но сейчас ночь: сообщество создам после 09:00 по Алматы (или нажми «Создать сейчас»).`
      : `Сохранено: эфир ${ddmm(p.date)} в ${start}. Сообщество создам ${when(at)}, ссылка на сайте поведёт в него сразу после этого.`;
  return { ok: true, message: text };
}

/** Забыть настройки живого эфира. Созданные сообщества остаются и работают, но ссылка на сайте возвращается на постоянную. */
export function waEventReset(): Act {
  const r = rt;
  if (!r) return MODULE_OFF;
  r.state.event = { ...freshEvent(), start: r.cfg.streamStart };
  save(r);
  journal(r, { ev: "event_reset", by: "panel" });
  return { ok: true, message: "Настройки эфира сброшены. Созданное сообщество продолжает работать, ссылка на сайте снова постоянная." };
}

/** Кнопка «Создать сейчас» (живой эфир). */
export async function waEventCreateNow(nowArg?: number): Promise<Act> {
  const r = rt;
  if (!r) return MODULE_OFF;
  try {
    return await eventCreateNow(r, clock(r, nowArg));
  } catch (e) {
    return fail("internal", `Ошибка: ${(e as Error)?.message || e}`);
  }
}

/** Кнопка «Создать сообщество следующего эфира сейчас» (ежедневный режим): то же, что /wa_new без даты. */
export async function waDailyCreateNow(nowArg?: number): Promise<Act> {
  const r = rt;
  if (!r) return MODULE_OFF;
  if (r.state.mode !== "daily") return fail("wrong_mode", "Сейчас включён живой эфир: используй «Создать сейчас» в его настройках.");
  const text = (await cmdNew(r, "", clock(r, nowArg))).text;
  return { ok: /^Создано:/.test(text) || /сообщество уже есть/.test(text), message: text };
}

export function waPause(nowArg?: number): Act {
  const r = rt;
  if (!r) return MODULE_OFF;
  const was = r.state.paused;
  const reply = cmdPause(r, clock(r, nowArg), "panel");
  return { ok: true, code: was ? "same" : "paused", message: reply.text };
}

export function waResume(): Act {
  const r = rt;
  if (!r) return MODULE_OFF;
  return { ok: true, message: cmdResume(r).text };
}

/** Отправить сообщение серии в текущее сообщество прямо сейчас (с подтверждением в пульте). */
export async function waSendSeries(id: unknown, nowArg?: number): Promise<Act & { sent: number; skipped: number; failed: number; targets: number }> {
  const r = rt;
  if (!r) return { ...MODULE_OFF, sent: 0, skipped: 0, failed: 0, targets: 0 };
  if (typeof id !== "string" || !id) return { ...fail("bad_request", "Выбери сообщение серии."), sent: 0, skipped: 0, failed: 0, targets: 0 };
  const x = await sendSeries(r, id, clock(r, nowArg));
  return { ok: x.ok, code: x.code, message: x.text, sent: x.sent, skipped: x.skipped, failed: x.failed, targets: x.targets };
}

// ───────────────────────── пульт: подключение номера ─────────────────────────

export type ConnInfo = { state: string; number: string; profile: string };
const numberOf = (r: Rt) => (r.state.ownerJid ? `+${r.state.ownerJid.replace(/[:@].*$/, "")}` : "");

/** Состояние подключения у Evolution прямо сейчас (не чаще раза в 3 секунды). Номер и имя профиля, когда open. */
export async function waConnection(nowArg?: number): Promise<(Act & Partial<ConnInfo>) | ({ ok: true } & ConnInfo)> {
  const r = rt;
  if (!r) return MODULE_OFF;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    if (r.conn.at && now - r.conn.at < 3000 && r.conn.state !== "open") return { ok: true as const, state: r.conn.state, number: "", profile: "" };
    const cs = await evo.connectionState();
    if (!cs.ok) {
      setConn(r, "unreachable", now);
      return fail("evolution", `Evolution не отвечает: ${cs.error}`);
    }
    setConn(r, cs.data.state, now);
    if (cs.data.state === "open") await refreshOwner(r, now);
    return { ok: true as const, state: cs.data.state, number: cs.data.state === "open" ? numberOf(r) : "", profile: cs.data.state === "open" ? r.profileName : "" };
  });
}

async function refreshOwner(r: Rt, now: number) {
  const i = await evo.fetchInstance();
  if (i.ok && i.data.ownerJid) {
    r.state.ownerJid = i.data.ownerJid;
    r.state.ownerAt = now;
    r.profileName = i.data.profileName;
    save(r);
  }
}

const cleanQr = (x: unknown) => (typeof x === "string" ? x.replace(/^data:image\/\w+;base64,/, "") : "");

/**
 * QR для подключения номера. Нет инстанса: создаём и берём QR из ответа, есть: connect. Картинка 10 секунд берётся из кеша,
 * чтобы пульт, обновляющий её каждые 15 до 20 секунд, не дёргал Evolution лишний раз. Ключ Evolution в ответ не попадает.
 */
export async function waQr(nowArg?: number): Promise<(Act & { state?: string }) | { ok: true; state: string; qr: string | null; number?: string; profile?: string; message?: string }> {
  const r = rt;
  if (!r) return MODULE_OFF;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const cs = await evo.connectionState();
    if (!cs.ok) return fail("evolution", `Evolution не отвечает: ${cs.error}`);
    const st = cs.data.state;
    setConn(r, st, now);
    if (st === "open") {
      r.qrCache = null;
      await refreshOwner(r, now);
      return { ok: true as const, state: "open", qr: null, number: numberOf(r), profile: r.profileName };
    }
    const shown = st === "absent" ? "connecting" : st;
    if (r.qrCache && now - r.qrCache.at < 10_000 && r.qrCache.state === shown) return { ok: true as const, state: shown, qr: r.qrCache.data };
    let qr: unknown;
    if (st === "absent") {
      const c = await evo.createInstance();
      if (!c.ok) return fail("evolution", `Не удалось создать подключение: ${c.error}`);
      qr = c.data?.qrcode?.base64;
    } else {
      const c = await evo.connectInstance();
      if (!c.ok) return fail("evolution", `Не удалось запросить QR: ${c.error}`);
      qr = c.data?.base64;
    }
    const b64 = cleanQr(qr);
    if (!b64 || !/^[A-Za-z0-9+/=]+$/.test(b64) || b64.length > 400_000) return { ok: true as const, state: shown, qr: null, message: "QR готовится, он появится через несколько секунд." };
    const data = `data:image/png;base64,${b64}`;
    r.qrCache = { at: now, state: shown, data };
    if (now - r.qrJournalAt > 5 * MIN) {
      r.qrJournalAt = now;
      journal(r, { ev: "qr", by: "panel" });
    }
    return { ok: true as const, state: shown, qr: data };
  });
}

/** Отвязать номер (DELETE /instance/logout). Рассылка и создание встанут сами: без подключения модуль ничего не шлёт. */
export async function waLogout(nowArg?: number): Promise<Act> {
  const r = rt;
  if (!r) return MODULE_OFF;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const x = await evo.logoutInstance();
    if (!x.ok) return fail("evolution", `Не получилось отключить номер: ${x.error}`);
    setConn(r, "close", now);
    r.statusCache = null;
    r.pairCache = null;
    r.state.ownerJid = "";
    r.state.ownerAt = 0;
    r.profileName = "";
    r.qrCache = null;
    // Отключили сами: тревога о потере подключения придёт не раньше чем через положенный срок.
    r.state.lastConnAlertAt = now;
    save(r);
    journal(r, { ev: "logout", by: "panel" });
    return { ok: true, message: "Номер отключён. Рассылка и создание сообществ остановлены, пока не подключишь номер заново по QR." };
  });
}

// ───────────────────────── пульт: статус подключения ─────────────────────────

/** Номер с закрытой серединой: 77085834575 -> 7708***4575. Целиком номер в ответы нового статуса и в журнал не попадает. */
export const maskNumber = (digits: string) => (digits.length >= 9 ? `${digits.slice(0, 4)}***${digits.slice(-4)}` : digits ? "***" : "");

export type WaStatus = {
  /** connected: подключён; waiting: ждёт QR или кода; disconnected: отключён с причиной; banned: заблокирован; logged_out: вышел из устройства; unreachable: Evolution молчит. */
  kind: "connected" | "waiting" | "disconnected" | "banned" | "logged_out" | "unreachable";
  /** Цвет блока: ok зелёный, wait жёлтый, bad красный. */
  tone: "ok" | "wait" | "bad";
  title: string;
  detail: string;
  /** Состояние у Evolution как есть: open, connecting, close, absent, unreachable. */
  state: string;
  /** Номер в виде 7708***4575, только когда подключён. */
  number: string;
  profile: string;
  /** «08.10 в 14:30»: с какого времени подключён (когда мы это увидели). */
  since: string;
  /** Код отключения Baileys (401, 403 и так далее) из Evolution, если есть. */
  reasonCode: number | null;
  /** Причина словами, если номер отключён. */
  reason: string;
  at: number;
  /** Когда проверили, HH:MM по Алматы. */
  checked: string;
};

/** Коды отключения Baileys (DisconnectReason) и коды, после которых Evolution 2.3.7 сам не переподключается (401, 403, 402, 406). */
const DISCONNECT_REASON: Record<number, string> = {
  401: "номер вышел из связанных устройств (loggedOut)",
  402: "WhatsApp отказал в подключении (код 402)",
  403: "WhatsApp закрыл доступ номеру (forbidden)",
  406: "WhatsApp отказал в подключении (код 406)",
  408: "WhatsApp не ответил вовремя (timedOut)",
  411: "рассинхрон устройств (multideviceMismatch)",
  428: "соединение закрыто (connectionClosed)",
  440: "сессию открыли на другом устройстве (connectionReplaced)",
  500: "сессия повреждена (badSession)",
  515: "нужен перезапуск (restartRequired)",
};
const NO_RECONNECT = new Set([401, 402, 403, 406]);
/** Явные признаки блокировки в записанной причине отключения (кроме кода 403). */
const BAN_RE = /\bban(ned)?\b|temporar\w*[ _-]ban|\bblocked\b|suspend|account[ _-]?(restricted|disabled)/i;

/** Короткий текст ответа WhatsApp из записанного lastDisconnect (error.output.payload.message). Длинные числа закрываются. */
function disconnectMessage(raw: string): string {
  let o: any = raw;
  for (let i = 0; i < 2 && typeof o === "string" && o; i++) {
    try {
      o = JSON.parse(o);
    } catch {
      break;
    }
  }
  const m = o?.error?.output?.payload?.message ?? o?.error?.message ?? o?.message ?? "";
  return typeof m === "string" ? m.replace(/\d{8,}/g, "***").replace(/\s+/g, " ").trim().slice(0, 100) : "";
}

/** Статус словами по состоянию подключения и данным инстанса. Без запросов, чистая функция от входа. */
function describeStatus(r: Rt, state: string, info: evo.InstanceInfo | null, infoErr: string, now: number, evoErr = ""): WaStatus {
  const base = { state, number: "", profile: "", since: "", reasonCode: null as number | null, reason: "", at: now, checked: hhmmOf(now) };
  if (state === "unreachable") {
    return { ...base, kind: "unreachable", tone: "bad", title: "Evolution не отвечает", detail: `WhatsApp-сервис (Evolution) не ответил: ${clip(evoErr, 120)}. Рассылка, создание сообществ и одобрение заявок стоят, пока он не вернётся. Проверь сервер.` };
  }
  if (state === "open") {
    const owner = info?.ownerJid || r.state.ownerJid;
    return {
      ...base,
      kind: "connected",
      tone: "ok",
      title: "Подключён",
      detail: "Номер на связи. Рассылка и одобрение заявок работают.",
      number: maskNumber(digitsOf(owner)),
      profile: clip(info?.profileName || r.profileName, 60),
      since: r.state.connSince ? when(r.state.connSince) : "",
    };
  }
  if (state === "absent") {
    return { ...base, kind: "waiting", tone: "wait", title: "Ждёт подключения", detail: "Подключение ещё не создано. Нажми «Подключить по QR» или введи номер телефона и получи код." };
  }
  if (state === "connecting") {
    const paired = !!info?.ownerJid;
    return {
      ...base,
      kind: "waiting",
      tone: "wait",
      title: "Ждёт подключения",
      detail: paired ? "Номер уже привязан, идёт переподключение. Если статус не меняется больше минуты, подключи номер заново." : "QR или код ещё не введены. Отсканируй QR или введи код на телефоне.",
    };
  }
  if (state !== "close") {
    return { ...base, kind: "disconnected", tone: "bad", title: "Отключён", detail: `Evolution назвал состояние «${clip(state, 30)}». Нажми «Проверить сейчас», если статус не меняется, подключи номер заново.`, reason: "состояние неизвестно" };
  }
  // close: причина из записи об отключении
  if (!info) {
    return { ...base, kind: "disconnected", tone: "bad", title: "Отключён", detail: `Причину узнать не удалось: ${clip(infoErr, 100) || "Evolution не отдал данные инстанса"}. Подключи номер заново.`, reason: "причина неизвестна" };
  }
  const code = info.disconnectionReasonCode;
  const ms = info.disconnectionAt ? Date.parse(info.disconnectionAt) : NaN;
  const at = Number.isFinite(ms) ? ` (${when(ms)})` : "";
  const msg = disconnectMessage(info.disconnectionObject);
  const tail = msg ? ` Ответ WhatsApp: ${msg}.` : "";
  if (code === 403 || BAN_RE.test(info.disconnectionObject)) {
    return {
      ...base,
      kind: "banned",
      tone: "bad",
      title: "Номер заблокирован WhatsApp",
      detail: `WhatsApp закрыл доступ этому номеру${code ? ` (код ${code})` : ""}${at}. Рассылка и создание сообществ остановлены. Скорее всего, этот номер уже не подключить: нужен другой номер или обращение в поддержку WhatsApp.${tail}`,
      reasonCode: code,
      reason: "заблокирован",
    };
  }
  if (code === 401) {
    return {
      ...base,
      kind: "logged_out",
      tone: "bad",
      title: "Номер вышел из устройства (logout), нужно подключить заново",
      detail: `Сессию завершили${at}: номер убрали из связанных устройств на телефоне или вышли через logout. Подключи его заново: по QR или по номеру телефона.${tail}`,
      reasonCode: code,
      reason: "logout (401)",
    };
  }
  const why = code === null ? "причина не записана" : DISCONNECT_REASON[code] || `код ${code}`;
  const hint =
    code !== null && NO_RECONNECT.has(code)
      ? "Evolution сам не переподключится: подключи номер заново."
      : code === null
        ? "Если Evolution не вернул подключение сам, подключи номер заново."
        : "Evolution пробует переподключиться сам; если статус не меняется, подключи номер заново.";
  return { ...base, kind: "disconnected", tone: "bad", title: "Отключён", detail: `Причина: ${why}${at}. ${hint}${tail}`, reasonCode: code, reason: why };
}

/**
 * Статус WhatsApp для пульта: состояние подключения у Evolution и, если номер не подключён, причина отключения
 * (GET /instance/fetchInstances: disconnectionReasonCode, disconnectionObject, disconnectionAt). Не чаще раза в 3 секунды.
 * Недоступность Evolution это тоже статус («Evolution не отвечает»), а не ошибка запроса. Ключ и номер целиком в ответ не попадают.
 */
export async function waStatus(nowArg?: number): Promise<Act | ({ ok: true } & WaStatus)> {
  const r = rt;
  if (!r) return MODULE_OFF;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const cached = r.statusCache;
    if (cached && now - cached.at < 3000) return { ok: true as const, ...cached.value };
    const cs = await evo.connectionState();
    let value: WaStatus;
    if (!cs.ok) {
      setConn(r, "unreachable", now);
      value = describeStatus(r, "unreachable", null, "", now, cs.error);
    } else {
      const st = cs.data.state;
      setConn(r, st, now);
      let info: evo.InstanceInfo | null = null;
      let infoErr = "";
      if (st !== "absent") {
        const i = await evo.fetchInstance();
        if (i.ok) info = i.data;
        else infoErr = i.error;
      }
      if (st === "open" && info?.ownerJid) {
        r.state.ownerJid = info.ownerJid;
        r.state.ownerAt = now;
        r.profileName = info.profileName;
        save(r);
      }
      value = describeStatus(r, st, info, infoErr, now);
    }
    r.statusCache = { at: now, value };
    return { ok: true as const, ...value };
  });
}

const PAIR_MIN_GAP_MS = 15_000;
/** Сколько секунд живёт код подключения по номеру (около минуты). */
const PAIR_TTL_SEC = 60;

/**
 * Код для подключения по номеру телефона: пульт показывает его, человек вводит на телефоне (Связанные устройства, Привязать по номеру).
 * Инстанса нет: POST /instance/create с number. Инстанс закрыт: GET /instance/connect?number=. У инстанса в состоянии connecting
 * Evolution отдаёт прежний QR без кода, поэтому ещё не привязанную попытку сначала закрываем (logout), а привязанный номер
 * (идёт переподключение) не трогаем. Номер в логи и журнал не пишем, в ответе он закрыт (7708***4575).
 */
export async function waPairing(numberRaw: unknown, nowArg?: number): Promise<Act | { ok: true; state: string; pairingCode: string; number: string; ttlSec: number; cached: boolean; message?: string }> {
  const r = rt;
  if (!r) return MODULE_OFF;
  const text = typeof numberRaw === "number" ? String(numberRaw) : typeof numberRaw === "string" ? numberRaw : "";
  const digits = /^[\d\s+()-]+$/.test(text) ? text.replace(/\D/g, "") : "";
  if (digits.length < 11 || digits.length > 15) return fail("bad_number", "Номер: только цифры, от 11 до 15, с кодом страны.");
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const pc = r.pairCache;
    if (pc && pc.digits === digits && now - pc.at < PAIR_MIN_GAP_MS) {
      const left = Math.ceil((PAIR_MIN_GAP_MS - (now - pc.at)) / 1000);
      return { ok: true as const, state: "connecting", pairingCode: pc.code, number: maskNumber(digits), ttlSec: PAIR_TTL_SEC, cached: true, message: `Код ещё действует. Новый можно получить через ${left} с.` };
    }
    const cs = await evo.connectionState();
    if (!cs.ok) {
      setConn(r, "unreachable", now);
      return fail("evolution", `Evolution не отвечает: ${cs.error}`);
    }
    const st = cs.data.state;
    setConn(r, st, now);
    r.statusCache = null;
    if (st === "open") return fail("connected", "Номер уже подключён. Чтобы подключить другой, сначала отключи этот.");
    const codeOf = (x: unknown) => String(x ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    let code = "";
    if (st === "absent") {
      const c = await evo.createInstance(digits);
      if (!c.ok) return fail("evolution", `Не удалось создать подключение: ${c.error}`);
      code = codeOf(c.data?.qrcode?.pairingCode);
    } else {
      if (st === "connecting") {
        const i = await evo.fetchInstance();
        if (i.ok && i.data.ownerJid) return fail("reconnecting", "Номер уже привязан, идёт переподключение. Подожди минуту и нажми «Проверить сейчас».");
        // Попытка по QR ещё никем не завершена: закрываем её, иначе Evolution вернёт прежний QR без кода. Сбой тут не страшен.
        await evo.logoutInstance();
      }
      for (let attempt = 0; attempt < 3 && !code; attempt++) {
        // Код Evolution выдаёт на событие QR после старта сокета: если его ещё нет, подождём и спросим снова.
        if (attempt) await r.deps.sleep(2500);
        const c = await evo.connectInstance(digits);
        if (!c.ok) return fail("evolution", `Не удалось запросить код: ${c.error}`);
        if (c.data?.instance?.state === "open") return { ok: true as const, state: "open", pairingCode: "", number: maskNumber(digits), ttlSec: 0, cached: false };
        code = codeOf(c.data?.pairingCode);
      }
    }
    if (code.length !== 8) return fail("no_code", "Evolution не выдал код. Подожди несколько секунд и нажми «Новый код».");
    r.qrCache = null;
    r.pairCache = { at: now, digits, code };
    journal(r, { ev: "pair", by: "panel" });
    return { ok: true as const, state: "connecting", pairingCode: code, number: maskNumber(digits), ttlSec: PAIR_TTL_SEC, cached: false };
  });
}

// ───────────────────────── пульт: группы и сообщества номера ─────────────────────────

export type PanelGroup = {
  id: string;
  name: string;
  size: number | null;
  /** community: сообщество; announce: вкладка объявлений сообщества; subgroup: группа внутри сообщества; group: обычная группа. */
  type: "community" | "announce" | "subgroup" | "group";
  typeLabel: string;
  /** owner: создатель; admin; member; unknown: роль не определена. */
  role: "owner" | "admin" | "member" | "unknown";
  roleLabel: string;
  /** Писать могут только админы. */
  announceOnly: boolean;
  /** Создано этим модулем. */
  ours: boolean;
};

const digitsOf = (x: unknown) => (typeof x === "string" ? x.replace(/[:@].*$/, "").replace(/\D/g, "") : "");

/** Роль номера в группе: создатель по полю owner или superadmin, админ, участник; без списка участников не определить. */
function roleOfGroup(g: any, me: string): PanelGroup["role"] {
  if (!me) return "unknown";
  if (digitsOf(g?.owner) === me) return "owner";
  if (!Array.isArray(g?.participants)) return "unknown";
  const mine = g.participants.find((p: any) => [p?.id, p?.jid, p?.phoneNumber, p?.lid].some((x) => digitsOf(x) === me));
  if (!mine) return "unknown";
  return mine.admin === "superadmin" ? "owner" : mine.admin ? "admin" : "member";
}

const ROLE_LABEL: Record<PanelGroup["role"], string> = { owner: "создатель", admin: "админ", member: "участник", unknown: "роль не определена" };
const TYPE_LABEL: Record<PanelGroup["type"], string> = { community: "сообщество", announce: "вкладка объявлений", subgroup: "группа в сообществе", group: "группа" };

function groupView(r: Rt, g: any): PanelGroup {
  const type: PanelGroup["type"] = g?.isCommunity === true ? "community" : g?.isCommunityAnnounce === true ? "announce" : g?.linkedParent ? "subgroup" : "group";
  const role = roleOfGroup(g, digitsOf(r.state.ownerJid));
  const id = String(g?.id || "");
  const size = typeof g?.size === "number" && Number.isFinite(g.size) ? g.size : Array.isArray(g?.participants) ? g.participants.length : null;
  return {
    id,
    name: String(g?.subject || "без названия").slice(0, 120),
    size,
    type,
    typeLabel: TYPE_LABEL[type],
    role,
    roleLabel: ROLE_LABEL[role],
    announceOnly: g?.announce === true,
    ours: r.state.targets.some((t) => t.jid === id || t.sendJid === id),
  };
}

const GROUPS_CACHE_MS = 60_000;
const GROUPS_MIN_GAP_MS = 20_000;

/**
 * Группы и сообщества, в которых состоит номер. Список из Evolution (fetchAllGroups), кеш на минуту, ручное обновление не чаще
 * раза в 20 секунд. Людей из списка участников не сохраняем и не отдаём: он нужен только для роли номера.
 */
export async function waGroups(force = false, nowArg?: number): Promise<Act & { items: PanelGroup[]; at: number; cached: boolean }> {
  const r = rt;
  if (!r) return { ...MODULE_OFF, items: [], at: 0, cached: false };
  const now = clock(r, nowArg);
  const c = r.groupsCache;
  if (c && (!force ? now - c.at < GROUPS_CACHE_MS : now - r.groupsCallAt < GROUPS_MIN_GAP_MS)) return { ok: true, message: "", items: c.items, at: c.at, cached: true };
  return exclusive(r, async () => {
    r.groupsCallAt = now;
    const cs = await evo.connectionState();
    if (!cs.ok) return { ...fail("evolution", `Evolution не отвечает: ${cs.error}`), items: c?.items ?? [], at: c?.at ?? 0, cached: !!c };
    setConn(r, cs.data.state, now);
    if (cs.data.state !== "open") return { ...fail("no_connection", `WhatsApp не подключён (${cs.data.state}). Подключи номер по QR.`), items: c?.items ?? [], at: c?.at ?? 0, cached: !!c };
    if (!r.state.ownerJid) await refreshOwner(r, now);
    let res = await evo.fetchAllGroups(true);
    // Тяжёлый ответ не прошёл (таймаут на больших группах): список без участников, роль тогда не определится.
    if (!res.ok) res = await evo.fetchAllGroups(false);
    if (!res.ok) return { ...fail("evolution", `Список групп не получен: ${res.error}`), items: c?.items ?? [], at: c?.at ?? 0, cached: !!c };
    const rank = (g: PanelGroup) => (g.type === "community" ? 0 : g.type === "announce" ? 1 : g.type === "subgroup" ? 2 : 3);
    const items = res.data
      .slice(0, 300)
      .map((g) => groupView(r, g))
      .filter((g) => g.id)
      .sort((a, b) => rank(a) - rank(b) || (b.size ?? -1) - (a.size ?? -1) || a.name.localeCompare(b.name));
    r.groupsCache = { at: now, items };
    return { ok: true, message: "", items, at: now, cached: false };
  });
}

// ───────────────────────── пульт: данные для экрана ─────────────────────────

/** Последние строки jsonl-файла без чтения всего файла. */
function readJsonlTail<T>(file: string, maxBytes = 256 * 1024): T[] {
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
    const out: T[] = [];
    for (const line of text.split("\n")) {
      const s = line.trim();
      if (!s) continue;
      try {
        out.push(JSON.parse(s) as T);
      } catch {
        /* битую строку пропускаем */
      }
    }
    return out;
  } catch {
    return [];
  }
}

export type JournalRow = { ts: number; t: string; kind: "ok" | "error" | "info"; text: string };

const JOURNAL_EVENTS = new Set(["create", "send", "skip", "fail", "pause", "resume", "alarm", "mode", "daily", "event_set", "event_reset", "event_done", "logout", "qr", "pair", "conn", "ai_on", "ai_off", "ai_handoff", "ai_skip", "dz_on", "dz_off", "dz_hook", "dz_save", "dz_tpl"]);
const stampOf = (ms: number) => `${ddmm(dayKeyOf(ms))} ${hhmmOf(ms)}`;
const clip = (s: unknown, n = 160) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Последние события модуля простыми словами: создание, отправки, ошибки, паузы, смена режима. Без ключей и токенов (их в журнал не пишут). */
function journalView(r: Rt, limit = 20): JournalRow[] {
  const nameOfTarget = (id: unknown) => r.state.targets.find((t) => t.id === id)?.name || String(id || "");
  const topicOf = (id: unknown) => (id === "welcome" ? "приветствие" : r.cfg.messages.find((m) => m.id === id)?.topic || String(id || ""));
  const rows = readJsonlTail<any>(fJournal(r)).filter((x) => x && JOURNAL_EVENTS.has(x.ev));
  return rows
    .slice(-limit)
    .reverse()
    .map((x): JournalRow => {
      const ts = Date.parse(String(x.ts || "")) || 0;
      let kind: JournalRow["kind"] = "info";
      let text = "";
      switch (x.ev) {
        case "create":
          kind = "ok";
          text = `Создано «${nameOfTarget(x.target) || x.name}»`;
          break;
        case "send": {
          const part = x.part === "poll" ? ", опрос" : x.part === "text" ? ", текст" : "";
          kind = x.ok ? "ok" : "error";
          text = x.ok
            ? `Отправлено «${topicOf(x.msg)}»${part} в ${nameOfTarget(x.target)}${x.manual ? " (вручную)" : ""}`
            : x.unknown
              ? `Неясно, ушло ли «${topicOf(x.msg)}»${part} в ${nameOfTarget(x.target)}: ${clip(x.err, 100)}. Повторно не отправляется, проверь в WhatsApp`
              : `Не ушло «${topicOf(x.msg)}»${part} в ${nameOfTarget(x.target)}: ${clip(x.err, 100)}`;
          break;
        }
        case "skip":
          text = `Пропущено «${topicOf(x.msg)}» в ${nameOfTarget(x.target)}: плановое время ${x.plan} вне окна от 09:00 до 23:45`;
          break;
        case "fail":
          kind = "error";
          text = `Ошибка ${x.n} подряд: ${clip(x.what, 80)}: ${clip(x.err, 100)}`;
          break;
        case "pause":
          kind = "error";
          text = `Пауза: ${clip(x.reason, 120)}`;
          break;
        case "resume":
          text = "Пауза снята";
          break;
        case "alarm":
          kind = "error";
          text = `Тревога: ${clip(x.text, 140)}`;
          break;
        case "mode":
          text = x.mode === "event" ? "Режим: живой эфир" : "Режим: ежедневный";
          break;
        case "daily":
          text = `Ежедневное создание: ${x.enabled ? "включено" : "выключено"}`;
          break;
        case "event_set":
          text = `Живой эфир: ${ddmm(String(x.date))} в ${x.start}, набор с ${ddmm(String(x.recruitFrom))}`;
          break;
        case "event_reset":
          text = "Настройки живого эфира сброшены";
          break;
        case "event_done":
          text = `Живой эфир ${ddmm(String(x.date))} завершён, ссылка снова постоянная`;
          break;
        case "logout":
          kind = "error";
          text = "Номер отключён";
          break;
        case "qr":
          text = "Запрошен QR для подключения номера";
          break;
        case "pair":
          text = "Запрошен код для подключения номера по телефону";
          break;
        case "conn":
          kind = x.state === "open" ? "ok" : "error";
          text = x.state === "open" ? "WhatsApp подключён" : `Подключение: ${x.state}`;
          break;
        case "ai_on":
          kind = "ok";
          text = "ИИ-ассистент включён";
          break;
        case "ai_off":
          text = "ИИ-ассистент выключен";
          break;
        case "ai_handoff":
          text = `ИИ-ассистент передал ${clip(x.who, 24)} Аяне: ${clip(x.why, 100)}. Молчит с ним 12 часов`;
          break;
        case "ai_skip":
          text = `ИИ-ассистент не ответил ${clip(x.who, 24)}: ${clip(x.why, 60)}`;
          break;
        case "dz_on":
          kind = "ok";
          text = "Дожим WABA включён";
          break;
        case "dz_off":
          text = "Дожим WABA выключен";
          break;
        case "dz_hook":
          kind = x.on ? "ok" : "info";
          text = x.on ? "Вебхук Wazzup поставлен" : "Вебхук Wazzup снят";
          break;
        case "dz_save":
          text = `Настройки дожима WABA сохранены: шаблон «${clip(x.template, 60)}»`;
          break;
        case "dz_tpl":
          text = `Шаблон WABA «${clip(x.name, 60)}»: статус ${clip(x.status, 30) || "не указан"}`;
          break;
      }
      return { ts, t: ts ? stampOf(ts) : "", kind, text };
    });
}

/** Ближайшее создание в ежедневном режиме при включённом создании. */
function nextDailyCreate(r: Rt, now: number): { day: string; at: number } | null {
  if (r.state.mode !== "daily" || !r.state.daily.enabled) return null;
  const c = tcfg(r);
  const today = dayKeyOf(now);
  for (let i = 0; i < 14; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c) || r.state.targets.some((t) => t.day === day)) continue;
    const at = createAtOf(r, day);
    if ((now < at || createWindowOpen(r, at, now)) && now < closeAtOf(r, day)) return { day, at };
  }
  return null;
}

type Card = {
  id: string;
  name: string;
  day: string;
  dayLabel: string;
  kind: Kind;
  source: "daily" | "event";
  ready: boolean;
  link: string;
  onSite: boolean;
  members: number | null;
  membersAgo: string;
  joinedToday: number;
  joinedTotal: number;
};

function cardOf(r: Rt, t: Target, now: number, serving: Target | null): Card {
  return {
    id: t.id,
    name: t.name,
    day: t.day,
    dayLabel: ddmm(t.day),
    kind: t.kind,
    source: t.source ?? "daily",
    ready: isReady(t),
    link: isReady(t) ? t.link : "",
    onSite: serving?.id === t.id,
    members: t.members ?? null,
    membersAgo: t.membersAt ? agoText(now - t.membersAt) : "",
    joinedToday: r.joinedByDay.get(t.id)?.get(dayKeyOf(now)) ?? 0,
    joinedTotal: r.joinedCount.get(t.id) ?? 0,
  };
}

/** Всё для экрана «WhatsApp»: из памяти и файлов, без запросов к Evolution (подключение, QR и группы запрашиваются отдельно). */
export function waPanel(nowArg?: number): Record<string, unknown> {
  const r = rt;
  if (!r) return waEnabled() ? { ok: true, enabled: true, running: false, error: initError || "модуль не запущен" } : { ok: true, enabled: false };
  const now = clock(r, nowArg);
  const today = dayKeyOf(now);
  const c = tcfg(r);
  const st = r.state;
  const ev = st.event;
  const serving = servingTarget(r, now);
  const link = waGroupLink(now, false);
  const evTarget = eventTarget(r);
  const startEff = ev.start || r.cfg.streamStart;
  const eventStart = st.mode === "event" ? (evTarget?.start ?? (startEff !== r.cfg.streamStart ? startEff : undefined)) : undefined;

  // Статус живого эфира словами.
  let evStatus = "unset";
  let evText = "Эфир не задан. Укажи дату, время старта и день начала набора, потом сохрани.";
  if (ev.done) {
    evStatus = "done";
    evText = `Эфир ${ddmm(ev.date)} завершён${ev.doneAt ? ` (${when(ev.doneAt)})` : ""}. Ссылка на сайте снова постоянная.`;
  } else if (ev.date) {
    const startAt = atTime(ev.date, startEff);
    if (st.mode !== "event") {
      evStatus = "inactive";
      evText = `Эфир ${ddmm(ev.date)} сохранён, но сейчас включён ежедневный режим.`;
    } else if (!evTarget) {
      if (now < eventCreateAt(r)) {
        evStatus = "scheduled";
        evText = `Сообщество будет создано ${when(eventCreateAt(r))}. Ссылка на сайте поведёт в него сразу после этого.`;
      } else {
        evStatus = "creating";
        evText = st.paused
          ? "Время создания наступило, но модуль на паузе. Сними паузу."
          : !daytime(now)
            ? "Время создания наступило, но сейчас ночь: сообщество создам после 09:00 по Алматы или нажми «Создать сейчас»."
            : "Время создания наступило: сообщество создаётся (до 30 секунд) или нажми «Создать сейчас».";
      }
    } else if (now < startAt) {
      evStatus = "recruiting";
      evText = "Идёт набор: ссылка на сайте ведёт в сообщество эфира.";
    } else if (now < startAt + r.cfg.streamMinutes * MIN) {
      evStatus = "live";
      evText = "Эфир идёт. Ссылка на сайте всё ещё ведёт в сообщество.";
    } else {
      evStatus = "after";
      evText = `Эфир закончился. Офферы серии действуют до 00:00, потом режим завершится и ссылка вернётся на постоянную.`;
    }
  }

  // «Вступили N из M записавшихся на этот день» (замер участников и заявки, wa-dozhim.ts); без замера N не известно.
  const dz = dzPanel(now) as { days?: Array<{ day: string; applied: number; joined: number | null; measured: string }> };
  const signupsOf = (day: string) => dz.days?.find((x) => x.day === day) ?? null;
  // Текущее и следующее сообщество.
  const cardsOf = (day: string) => [...targetsOf(r, day)].reverse().filter((t) => st.mode === "event" || t.source !== "event").map((t) => cardOf(r, t, now, serving));
  let current: Record<string, unknown> | null = null;
  let next: Record<string, unknown> | null = null;
  if (st.mode === "event") {
    if (ev.date) {
      const cards = cardsOf(ev.date);
      current = { title: "Сообщество живого эфира", day: ev.date, dayLabel: ddmm(ev.date), cards, pending: cards.length ? "" : evText, signups: signupsOf(ev.date) };
    }
  } else {
    const cur = isStreamDay(today, c) ? today : assignStreamDay(now, c);
    const nxt = nextStreamAfter(r, cur);
    const pend = (day: string) => (r.state.daily.enabled ? `Будет создано ${when(createAtOf(r, day))}.` : "Ежедневное создание выключено, сообщество не создаётся.");
    const mk = (title: string, day: string) => {
      const cards = cardsOf(day);
      return { title, day, dayLabel: ddmm(day), cards, pending: cards.length ? "" : pend(day), signups: signupsOf(day) };
    };
    current = mk("Эфир", cur);
    next = mk("Следующий эфир", nxt);
  }

  // Серия: время и текст такими, какими они уйдут в сообщество (со сдвигом старта живого эфира).
  const series = r.cfg.messages.map((m) => {
    const e = effMsg(r, { start: eventStart }, m);
    return { id: m.id, at: hhmmOf(planOf(r, { day: "2000-01-01", start: eventStart }, m)), topic: m.topic || m.id, text: e.text, media: m.media?.type ?? null, poll: m.poll ? m.poll.name : null, enabled: m.enabled !== false };
  });
  const nm = nextMessage(r, now);
  const targets = currentTargets(r, now).list;
  // Переходы по постоянной ссылке из кнопки шаблона WABA (страница workshop-montazh/wa.html) за сегодня.
  let templateClicks = 0;
  try {
    templateClicks = getStore().tyCount(today, "wa-template");
  } catch {
    /* хранилище бота не открыто */
  }

  return {
    ok: true,
    enabled: true,
    running: true,
    now,
    today,
    updated: hhmmOf(now),
    tz: "Asia/Almaty",
    module: {
      paused: st.paused,
      pausedReason: st.pausedReason,
      failStreak: st.failStreak,
      failMax: r.cfg.retry.pauseAfter,
      creationsToday: dayCreations(r, now),
      creationsMax: r.cfg.maxNewPerDay,
      pendingCreate: !!st.pendingCreate,
      kind: r.cfg.target,
    },
    conn: { state: r.conn.state, at: r.conn.at, ago: r.conn.at ? agoText(now - r.conn.at) : "", number: r.conn.state === "open" ? numberOf(r) : "", profile: r.conn.state === "open" ? r.profileName : "" },
    /** Последний статус подключения из памяти (без запроса к Evolution): пульт показывает его сразу, пока приходит свежий. */
    status: r.statusCache ? r.statusCache.value : null,
    mode: st.mode,
    daily: { enabled: st.daily.enabled, next: (() => { const n = nextDailyCreate(r, now); return n ? { day: n.day, dayLabel: ddmm(n.day), at: n.at, text: when(n.at) } : null; })() },
    event: {
      date: ev.date,
      dateLabel: ev.date ? ddmm(ev.date) : "",
      start: startEff,
      startDefault: r.cfg.streamStart,
      recruitFrom: ev.recruitFrom,
      recruitLabel: ev.recruitFrom ? ddmm(ev.recruitFrom) : "",
      createTime: EVENT_CREATE_AT,
      createAt: ev.recruitFrom ? eventCreateAt(r) : 0,
      status: evStatus,
      statusText: evText,
      locked: !!(ev.communityId && evTarget),
      hasCommunity: !!evTarget,
      done: !!ev.done,
    },
    link: {
      url: link ?? "",
      kind: link ? (st.mode === "event" ? "event" : "daily") : "permanent",
      text: link ? (st.mode === "event" ? "Ссылка на сайте ведёт в сообщество живого эфира." : "Ссылка на сайте ведёт в сообщество ближайшего набора.") : "Ссылка на сайте постоянная: подходящего сообщества нет.",
      /** Постоянная ссылка для кнопки шаблона WABA: страница переадресует туда же, куда ведёт сайт, а при сбое на постоянную. */
      templateUrl: TEMPLATE_URL,
      templateClicksToday: templateClicks,
    },
    current,
    next,
    nextMessage: nm ? { id: nm.id, topic: nm.topic, at: hhmmOf(nm.plan), dayLabel: ddmm(nm.day), inText: inText(nm.plan - now) } : null,
    sendTo: targets.map((t) => t.name),
    series,
    assistant: aiPanel(now),
    dozhim: dzPanel(now),
    journal: journalView(r, 20),
  };
}

/** Для тестов: чистые функции расписания. */
export const _internals = { createAtOf, servingTarget, dueCreateDays, isReady, partsOf, closeAtOf, nameOf, targetsOf, planOf, retime, effMsg, eventCreateAt, eventTarget, nextMessage };
