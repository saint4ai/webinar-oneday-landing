/**
 * Хранилище бота воркшопа: папка DATA_DIR, только дописывание строк JSONL.
 * При старте файлы читаются целиком и состояние собирается в памяти.
 *
 *   tg-subscribers.jsonl  события подписчиков (start, blocked, unblocked, stop, paid, rejoin)
 *   tg-sent.jsonl         что и кому отправили: { msg, day, chat_id, ts, ok, err? }
 *   tg-clicks.jsonl       переходы в эфир: { chat_id, day, ts }
 *   ty-clicks.jsonl       клики по кнопкам на странице «Спасибо»: { ch, eid, day, ts }
 *   tg-state.json         флаг серии, кеш file_id, правки расписания, ссылка эфира
 *                         (перезапись через temp + rename)
 *
 * Состояние подписчика получается только из событий (applyEvent), поэтому
 * после рестарта оно ровно такое же, как было до него.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Subscriber = {
  chatId: number;
  userId: number;
  username: string;
  firstName: string;
  languageCode: string;
  /** Метка источника из /start <payload>, первая непустая. */
  payload: string;
  /** День эфира D (YYYY-MM-DD по Алматы), на который человек записан. */
  streamDay: string;
  /** Когда (мс) человек записался на текущий streamDay. Прошлые сообщения серии ему не досылаем. */
  registeredAt: number;
  firstStartAt: number;
  blocked: boolean;
  stopped: boolean;
  paid: boolean;
};

export type SubEvent =
  | {
      type: "start";
      chat_id: number;
      user_id: number;
      username?: string;
      first_name?: string;
      language_code?: string;
      payload: string;
      streamDay: string;
      ts: string;
    }
  | { type: "blocked" | "unblocked" | "stop"; chat_id: number; ts: string }
  | { type: "paid"; chat_id: number; by: "self" | "owner"; ts: string }
  | { type: "rejoin"; chat_id: number; streamDay: string; ts: string };

/** Кому адресовано сообщение серии: всем, нажавшим / не нажавшим ссылку на эфир (за день D), не оплатившим. */
export type Audience = "all" | "clicked" | "notClicked" | "notPaid";

export type SentEntry = { msg: string; day: string; chat_id: number; ts: string; ok: boolean; err?: string };

/** Правка расписания владельцем (/at, /off, /on): поверх tg-series.json, переживает /reload. */
export type Override = { at?: string; enabled?: boolean };
export type Overrides = Record<string, Override>;

export type StoreState = {
  seriesEnabled: boolean;
  /** url картинки или видео -> file_id Telegram, чтобы не загружать файл заново на каждого. */
  media: Record<string, string>;
  overrides: Overrides;
  /** Ссылка эфира, заданная командой /bizon. Пусто: берём links.bizon из серии. */
  bizon: string;
  /** Дни эфира, по которым итоговый отчёт владельцам уже ушёл (последние 30). */
  reported: string[];
  /** Дни, за которые утренний админ-отчёт уже ушёл (последние 30). */
  adminReported: string[];
  /** Когда планировщик впервые увидел функцию админ-отчёта (мс). Отчёты за время до этого не догоняем. */
  adminSince: number;
};

/** События процесса, которых нет в файлах: считаются в памяти с момента запуска (для экрана «Ошибки»). */
export type RuntimeEventType = "skipLate" | "mediaFallback" | "tickError";
export type RuntimeEvent = { type: RuntimeEventType; ts: number; msg?: string; info?: string };
export const runtime = {
  startedAt: Date.now(),
  /** Отказы вебхука по секрету. */
  webhookRejected: 0,
  events: [] as RuntimeEvent[],
};
export function noteRuntime(type: RuntimeEventType, extra: { msg?: string; info?: string } = {}) {
  runtime.events.push({ type, ts: Date.now(), ...extra });
  if (runtime.events.length > 500) runtime.events.splice(0, runtime.events.length - 500);
}
export function resetRuntime() {
  runtime.startedAt = Date.now();
  runtime.webhookRejected = 0;
  runtime.events.length = 0;
}

export type TyChannel = "tg" | "wa";

/** Потолок записей кликов «Спасибо» в сутки: защита диска от накрутки. */
export const TY_DAILY_CAP = 5000;

/**
 * Применить событие к карте подписчиков. Одна и та же функция работает и при
 * живой записи, и при чтении файла со старта: так состояние не расходится.
 */
export function applyEvent(subs: Map<number, Subscriber>, ev: SubEvent): void {
  const ts = Date.parse(ev.ts);
  const s = subs.get(ev.chat_id);
  switch (ev.type) {
    case "start": {
      if (!s) {
        subs.set(ev.chat_id, {
          chatId: ev.chat_id,
          userId: ev.user_id,
          username: ev.username || "",
          firstName: ev.first_name || "",
          languageCode: ev.language_code || "",
          payload: ev.payload || "",
          streamDay: ev.streamDay,
          registeredAt: ts,
          firstStartAt: ts,
          blocked: false,
          stopped: false,
          paid: false,
        });
        return;
      }
      // Свежая запись, если сменился день или человек возвращается после stop/блокировки.
      // Простой повторный /start в тот же день запись не сдвигает.
      const fresh = s.streamDay !== ev.streamDay || s.stopped || s.blocked;
      s.userId = ev.user_id;
      s.username = ev.username || s.username;
      s.firstName = ev.first_name || s.firstName;
      s.languageCode = ev.language_code || s.languageCode;
      if (!s.payload && ev.payload) s.payload = ev.payload;
      s.streamDay = ev.streamDay;
      s.stopped = false;
      s.blocked = false;
      if (fresh) s.registeredAt = ts;
      return;
    }
    case "blocked":
      if (s) s.blocked = true;
      return;
    case "unblocked":
      if (s) s.blocked = false;
      return;
    case "stop":
      if (s) s.stopped = true;
      return;
    case "paid":
      if (s) s.paid = true;
      return;
    case "rejoin":
      if (s) {
        s.streamDay = ev.streamDay;
        s.registeredAt = ts;
      }
      return;
  }
}

/** Прочитать JSONL: битые строки пропускаем и считаем. */
function readJsonl<T>(file: string): { rows: T[]; bad: number } {
  const rows: T[] = [];
  let bad = 0;
  if (!existsSync(file)) return { rows, bad };
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      rows.push(JSON.parse(s) as T);
    } catch {
      bad++;
    }
  }
  return { rows, bad };
}

export class TgStore {
  readonly dir: string;
  readonly subs = new Map<number, Subscriber>();
  /** Ключи «сообщение|день|чат» по всем попыткам отправки, включая неудачные: повторов нет. */
  private readonly sent = new Set<string>();
  /** То же только для успешных отправок (для /series). */
  private readonly sentOk = new Set<string>();
  /** Ключи «чат|день» по переходам в эфир. */
  private readonly clicks = new Set<string>();
  /** Клики на «Спасибо»: сколько за день по каналу, плюс ключи «день|канал|eid» против дублей. */
  private readonly tyCounts = new Map<string, number>();
  /** Ключи дублей живут только в пределах одного дня: при смене дня множество сбрасывается, память не растёт. */
  private tyKeys = new Set<string>();
  private tyKeysDay = "";
  /** Сколько строк за день записано в ty-clicks.jsonl (потолок TY_DAILY_CAP). */
  private readonly tyTotals = new Map<string, number>();
  /** Кто записывался на эфир дня D (по событиям start и rejoin): день остаётся в истории, даже если человек потом перезаписался. */
  private readonly regDays = new Map<string, Set<number>>();
  /** Кто нажал «Я уже оплатил(а)» сам, по дню эфира, на который был записан в тот момент. */
  private readonly paidDays = new Map<string, Set<number>>();
  state: StoreState = { seriesEnabled: false, media: {}, overrides: {}, bizon: "", reported: [], adminReported: [], adminSince: 0 };

  private readonly fSubs: string;
  private readonly fSent: string;
  private readonly fClicks: string;
  private readonly fTy: string;
  private readonly fState: string;

  constructor(dir: string) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
    this.fSubs = join(dir, "tg-subscribers.jsonl");
    this.fSent = join(dir, "tg-sent.jsonl");
    this.fClicks = join(dir, "tg-clicks.jsonl");
    this.fTy = join(dir, "ty-clicks.jsonl");
    this.fState = join(dir, "tg-state.json");
    this.load();
  }

  private load() {
    const evs = readJsonl<SubEvent>(this.fSubs);
    for (const ev of evs.rows) {
      if (ev && typeof ev.chat_id === "number" && typeof ev.ts === "string") {
        this.track(ev);
        applyEvent(this.subs, ev);
      }
    }
    const sent = readJsonl<SentEntry>(this.fSent);
    for (const e of sent.rows) {
      if (!e || !e.msg) continue;
      this.sent.add(TgStore.sentKey(e.msg, e.day, e.chat_id));
      if (e.ok) this.sentOk.add(TgStore.sentKey(e.msg, e.day, e.chat_id));
    }
    const clicks = readJsonl<{ chat_id: number; day: string }>(this.fClicks);
    for (const c of clicks.rows) if (c && c.day) this.clicks.add(TgStore.clickKey(c.chat_id, c.day));
    const ty = readJsonl<{ ch: TyChannel; eid?: string; day: string }>(this.fTy);
    for (const c of ty.rows) if (c && c.day && (c.ch === "tg" || c.ch === "wa")) this.countTy(c.ch, c.eid || "", c.day);
    try {
      if (existsSync(this.fState)) {
        const st = JSON.parse(readFileSync(this.fState, "utf8")) as Partial<StoreState>;
        const obj = (x: unknown) => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, never>) : {});
        this.state = {
          seriesEnabled: st.seriesEnabled === true,
          media: obj(st.media) as Record<string, string>,
          overrides: obj(st.overrides) as Overrides,
          bizon: typeof st.bizon === "string" ? st.bizon : "",
          reported: Array.isArray(st.reported) ? st.reported.filter((x) => typeof x === "string") : [],
          adminReported: Array.isArray(st.adminReported) ? st.adminReported.filter((x) => typeof x === "string") : [],
          adminSince: typeof st.adminSince === "number" ? st.adminSince : 0,
        };
      }
    } catch {
      console.warn("[tg-store] tg-state.json нечитаем, беру значения по умолчанию");
    }
    const bad = evs.bad + sent.bad + clicks.bad + ty.bad;
    console.log(
      "[tg-store] подписчиков=%d, отправок=%d, переходов=%d, битых строк=%d, серия=%s",
      this.subs.size,
      this.sent.size,
      this.clicks.size,
      bad,
      this.state.seriesEnabled ? "включена" : "выключена",
    );
  }

  /** Дописать строку в JSONL. Сбой диска не должен ронять бота: логируем и идём дальше. */
  private append(file: string, row: unknown) {
    try {
      appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
    } catch (e) {
      console.error("[tg-store] не смог дописать %s:", file, (e as Error).message);
    }
  }

  static sentKey(msg: string, day: string, chatId: number) {
    return `${msg}|${day}|${chatId}`;
  }
  static clickKey(chatId: number, day: string) {
    return `${chatId}|${day}`;
  }

  recordEvent(ev: SubEvent) {
    this.append(this.fSubs, ev);
    this.track(ev);
    applyEvent(this.subs, ev);
  }

  /** Метрики по дням эфира копятся из событий, поэтому после рестарта восстанавливаются тем же проходом. */
  private track(ev: SubEvent) {
    const add = (m: Map<string, Set<number>>, day: string, chat: number) => {
      let s = m.get(day);
      if (!s) m.set(day, (s = new Set()));
      s.add(chat);
    };
    if (ev.type === "start" || ev.type === "rejoin") add(this.regDays, ev.streamDay, ev.chat_id);
    else if (ev.type === "paid" && ev.by === "self") {
      const day = this.subs.get(ev.chat_id)?.streamDay;
      if (day) add(this.paidDays, day, ev.chat_id);
    }
  }

  /** Дни эфира, на которые кто-то записывался. */
  regDayKeys(): string[] {
    return [...this.regDays.keys()];
  }

  /** chat_id всех, кто записывался на эфир дня D (по start и rejoin). Для мини-приложения админки. */
  registeredOn(day: string): number[] {
    return [...(this.regDays.get(day) ?? [])];
  }

  /**
   * Метрики эфира дня D: записались (уникальные chat_id с этим днём), из них перешли по кнопке
   * эфира (уникальные, /api/go), из них нажали «Я уже оплатил(а)».
   */
  dayMetrics(day: string): { registered: number; clicked: number; paid: number } {
    const reg = this.regDays.get(day);
    if (!reg) return { registered: 0, clicked: 0, paid: 0 };
    let clicked = 0;
    let paid = 0;
    const paidSet = this.paidDays.get(day);
    for (const chat of reg) {
      if (this.clicks.has(TgStore.clickKey(chat, day))) clicked++;
      if (paidSet?.has(chat)) paid++;
    }
    return { registered: reg.size, clicked, paid };
  }

  isReported(day: string): boolean {
    return this.state.reported.includes(day);
  }

  markReported(day: string) {
    if (this.isReported(day)) return;
    this.state.reported = [...this.state.reported, day].slice(-30);
    this.saveState();
  }

  setAdminSince(ms: number) {
    this.state.adminSince = ms;
    this.saveState();
  }

  isAdminReported(day: string): boolean {
    return this.state.adminReported.includes(day);
  }

  markAdminReported(day: string) {
    if (this.isAdminReported(day)) return;
    this.state.adminReported = [...this.state.adminReported, day].slice(-30);
    this.saveState();
  }

  /** Пути журналов: их читает админ-аналитика (tg-admin) с кешем по mtime. */
  paths() {
    return { subs: this.fSubs, sent: this.fSent, clicks: this.fClicks, ty: this.fTy };
  }

  recordSent(e: SentEntry) {
    this.append(this.fSent, e);
    this.sent.add(TgStore.sentKey(e.msg, e.day, e.chat_id));
    if (e.ok) this.sentOk.add(TgStore.sentKey(e.msg, e.day, e.chat_id));
  }

  hasSent(msg: string, day: string, chatId: number): boolean {
    return this.sent.has(TgStore.sentKey(msg, day, chatId));
  }

  /** Клик по переходу в эфир. Пара (chat_id, день) пишется один раз. Возвращает true, если запись новая. */
  recordClick(chatId: number, day: string, ts: string): boolean {
    const key = TgStore.clickKey(chatId, day);
    if (this.clicks.has(key)) return false;
    this.append(this.fClicks, { chat_id: chatId, day, ts });
    this.clicks.add(key);
    return true;
  }

  private countTy(ch: TyChannel, eid: string, day: string) {
    this.tyTotals.set(day, (this.tyTotals.get(day) || 0) + 1);
    if (eid) {
      if (day !== this.tyKeysDay) {
        this.tyKeys = new Set();
        this.tyKeysDay = day;
      }
      const k = `${day}|${ch}|${eid}`;
      if (this.tyKeys.has(k)) return;
      this.tyKeys.add(k);
    }
    const c = `${day}|${ch}`;
    this.tyCounts.set(c, (this.tyCounts.get(c) || 0) + 1);
  }

  /**
   * Клик по кнопке Telegram или WhatsApp на странице «Спасибо». Повтор того же eid за день не
   * считается. Потолок TY_DAILY_CAP записей в сутки: дальше ничего не пишем и возвращаем false.
   */
  recordTyClick(ch: TyChannel, eid: string, day: string, ts: string, src = ""): boolean {
    if ((this.tyTotals.get(day) || 0) >= TY_DAILY_CAP) return false;
    this.append(this.fTy, { ch, eid, day, ts, ...(src ? { src } : {}) });
    this.countTy(ch, eid, day);
    return true;
  }

  /** Размер множества ключей против дублей (для проверки, что оно не растёт между днями). */
  tyKeySize(): number {
    return this.tyKeys.size;
  }

  tyCount(day: string, ch: TyChannel): number {
    return this.tyCounts.get(`${day}|${ch}`) || 0;
  }

  /** Сколько человек впервые нажали «Запустить» в день D и сколько из них пришли с метки prefix. */
  startedOn(day: string, dayOfMs: (ms: number) => string, prefix = "ty"): { total: number; fromPrefix: number } {
    let total = 0;
    let fromPrefix = 0;
    for (const s of this.subs.values()) {
      if (dayOfMs(s.firstStartAt) !== day) continue;
      total++;
      if (s.payload === prefix || s.payload.startsWith(prefix + "_")) fromPrefix++;
    }
    return { total, fromPrefix };
  }

  hasClick(chatId: number, day: string): boolean {
    return this.clicks.has(TgStore.clickKey(chatId, day));
  }

  /** Сколько разных людей перешли в эфир дня D. */
  clickedCount(day: string): number {
    let n = 0;
    for (const s of this.subs.values()) if (this.clicks.has(TgStore.clickKey(s.chatId, day))) n++;
    return n;
  }

  /** Сколько человек получили сообщение msg за день D (успешно). Для /series. */
  sentCount(msg: string, day: string): number {
    let n = 0;
    for (const s of this.subs.values()) if (this.sentOk.has(TgStore.sentKey(msg, day, s.chatId))) n++;
    return n;
  }

  /** Найти подписчика по chat_id или @username (без учёта регистра). */
  find(query: string): Subscriber | undefined {
    const q = query.trim();
    if (/^-?\d+$/.test(q)) return this.subs.get(Number(q));
    const name = q.replace(/^@/, "").toLowerCase();
    if (!name) return undefined;
    for (const s of this.subs.values()) if (s.username.toLowerCase() === name) return s;
    return undefined;
  }

  isActive(s: Subscriber): boolean {
    return !s.blocked && !s.stopped;
  }

  /** Подходит ли подписчик под аудиторию сообщения для дня D. */
  audienceOk(aud: Audience, s: Subscriber, day: string): boolean {
    if (aud === "clicked") return this.clicks.has(TgStore.clickKey(s.chatId, day));
    if (aud === "notClicked") return !this.clicks.has(TgStore.clickKey(s.chatId, day));
    if (aud === "notPaid") return !s.paid;
    return true;
  }

  private saveState() {
    try {
      const tmp = `${this.fState}.tmp.${process.pid}`;
      writeFileSync(tmp, JSON.stringify(this.state, null, 2) + "\n", "utf8");
      renameSync(tmp, this.fState);
    } catch (e) {
      console.error("[tg-store] не смог записать tg-state.json:", (e as Error).message);
    }
  }

  setSeriesEnabled(v: boolean) {
    this.state.seriesEnabled = v;
    this.saveState();
  }

  /** Правка расписания: at строкой HH:MM или enabled; null снимает поле. Пустая правка удаляется. */
  setOverride(id: string, patch: { at?: string | null; enabled?: boolean | null }) {
    const cur: Override = { ...(this.state.overrides[id] || {}) };
    if (patch.at !== undefined) {
      if (patch.at === null) delete cur.at;
      else cur.at = patch.at;
    }
    if (patch.enabled !== undefined) {
      if (patch.enabled === null) delete cur.enabled;
      else cur.enabled = patch.enabled;
    }
    if (Object.keys(cur).length) this.state.overrides[id] = cur;
    else delete this.state.overrides[id];
    this.saveState();
  }

  setBizon(url: string) {
    this.state.bizon = url;
    this.saveState();
  }

  getMedia(key: string): string | undefined {
    return this.state.media[key];
  }

  setMedia(key: string, fileId: string) {
    this.state.media[key] = fileId;
    this.saveState();
  }

  dropMedia(key: string) {
    delete this.state.media[key];
    this.saveState();
  }
}
