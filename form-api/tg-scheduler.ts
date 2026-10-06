/**
 * Планировщик серии бота воркшопа. Тик каждые 30 секунд. Серия идёт только при включённом
 * флаге seriesEnabled и наличии токена (приветствие от флага не зависит). Исключение:
 * сообщения с essential: true (ссылка на эфир) уходят и при выключенной серии. Итоговый отчёт
 * владельцам уходит независимо от флага.
 *
 * Для сообщения серии и дня эфира D плановое время = D + dayOffset, в `at` по Алматы.
 * Шлём, пока сейчас в окне [плановое, плановое + graceMinutes]. Опоздали сильнее:
 * пропускаем и пишем в лог `skip late`, «через час» в 20:40 не отправляем.
 *
 * Скорость исходящих (20 в секунду, приоритет приветствий, пауза на 429) держит общий
 * ограничитель в tg-workshop. Второй процесс не шлёт: его останавливает lock-файл data/scheduler.lock.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  activeSeries,
  botConfigured,
  botEnabled,
  dayReportText,
  getStore,
  noteSendResult,
  notifyOwners,
  ownerIds,
  registerFire,
  sendContent,
  timeCfg,
  type FirePlan,
  type SendResult,
  type Series,
  type SeriesMsg,
} from "./tg-workshop";
import type { Subscriber, TgStore } from "./tg-store";
import { addDays, atTime, dayKeyOf, isStreamDay, streamEnd } from "./tg-time";

const TICK_MS = 30_000;
const LOCK_STALE_MS = 3 * TICK_MS;
/** Итоговый отчёт: через 5 минут после конца эфира, в течение 12 часов, если процесс был недоступен. */
const REPORT_DELAY_MS = 5 * 60_000;
const REPORT_WINDOW_MS = 12 * 3600_000;

// ───────────────────────── чистые функции (их проверяют тесты) ─────────────────────────

/** Плановое время сообщения для дня эфира D. */
export function planTime(day: string, msg: { at: string; dayOffset?: number }): number {
  return atTime(addDays(day, msg.dayOffset ?? 0), msg.at);
}

/** Окно отправки: [плановое, плановое + grace] включительно. */
export function inWindow(now: number, plan: number, graceMinutes: number): boolean {
  return now >= plan && now <= plan + graceMinutes * 60_000;
}

export type Due = { msg: SeriesMsg; day: string; plan: number };

/** Дни эфира D, чьи сообщения могут попасть в окно сейчас: сегодня и вчера (для dayOffset 1), глубже при больших сдвигах. */
function candidateDays(sr: Series, now: number): string[] {
  const today = dayKeyOf(now);
  const back = Math.max(1, ...sr.messages.map((m) => m.dayOffset ?? 0));
  const out: string[] = [];
  for (let k = 0; k <= back; k++) out.push(addDays(today, -k));
  return out;
}

/** Какие пары (сообщение, день эфира D) сейчас в окне отправки. По возрастанию планового времени. */
export function dueMessages(sr: Series, now: number): Due[] {
  const out: Due[] = [];
  for (const day of candidateDays(sr, now)) {
    for (const msg of sr.messages) {
      if (msg.enabled === false) continue;
      const plan = planTime(day, msg);
      if (inWindow(now, plan, sr.graceMinutes)) out.push({ msg, day, plan });
    }
  }
  return out.sort((a, b) => a.plan - b.plan);
}

/**
 * Получатели сообщения за день D: записаны на D, не заблокировали и не отписались,
 * ещё не получали (msg, D), подходят по аудитории. Если задан plan, то ещё и записаны
 * до планового времени: тем, кто пришёл позже, прошлые сообщения не догоняем.
 */
export function pickRecipients(st: TgStore, msg: SeriesMsg, day: string, opts: { plan?: number } = {}): Subscriber[] {
  const out: Subscriber[] = [];
  for (const s of st.subs.values()) {
    if (s.streamDay !== day || !st.isActive(s)) continue;
    if (opts.plan !== undefined && !(s.registeredAt < opts.plan)) continue;
    if (st.hasSent(msg.id, day, s.chatId)) continue;
    if (!st.audienceOk(msg.audience, s, day)) continue;
    out.push(s);
  }
  return out.sort((a, b) => a.chatId - b.chatId);
}

// ───────────────────────── lock-файл: один планировщик на данные ─────────────────────────

const lockPath = (st: TgStore) => join(st.dir, "scheduler.lock");

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

let lockedOutLogged = false;

/**
 * Взять или продлить lock (pid и время). Занят, если его держит другой живой процесс и отметка
 * свежая (не старше трёх тиков). Мёртвый pid или старая отметка: забираем себе.
 * Каждый тик продлевает отметку, поэтому pid, переиспользованный системой, замок не удержит.
 */
export function holdLock(st: TgStore): boolean {
  const f = lockPath(st);
  try {
    if (existsSync(f)) {
      const cur = JSON.parse(readFileSync(f, "utf8")) as { pid?: number; ts?: number };
      if (cur.pid && cur.pid !== process.pid && Date.now() - (cur.ts || 0) < LOCK_STALE_MS && pidAlive(cur.pid)) {
        if (!lockedOutLogged) console.warn("[tg-sched] данные держит другой процесс (pid %d), этот не шлёт", cur.pid);
        lockedOutLogged = true;
        return false;
      }
    }
    lockedOutLogged = false;
    writeFileSync(f, JSON.stringify({ pid: process.pid, ts: Date.now() }), "utf8");
    return true;
  } catch (e) {
    // Диск не даёт писать замок: лучше работать, чем молча замолчать (дубли исключает tg-sent.jsonl).
    console.error("[tg-sched] lock-файл недоступен:", (e as Error).message);
    return true;
  }
}

export function releaseLock(st: TgStore) {
  try {
    const f = lockPath(st);
    if (existsSync(f) && (JSON.parse(readFileSync(f, "utf8")) as { pid?: number }).pid === process.pid) unlinkSync(f);
  } catch {
    /* не страшно */
  }
}

// ───────────────────────── отправка ─────────────────────────

export type Deps = {
  send: (s: Subscriber, msg: SeriesMsg, day: string) => Promise<SendResult>;
  now: () => number;
};

const defaultDeps: Deps = {
  send: (s, msg, day) =>
    sendContent(
      { media: msg.media, text: msg.text, buttons: msg.buttons, silent: msg.silent },
      { series: activeSeries(), now: Date.now(), chatId: s.chatId, firstName: s.firstName, day },
      // Рассылка идёт в очереди «lo»: приветствия новым людям обгоняют её.
      { prio: "lo" },
    ),
  now: () => Date.now(),
};

/** Пары «сообщение|день|чат», которые прямо сейчас отправляются: плановая и ручная отправка не задвоят. */
const inflight = new Set<string>();

export type DeliverStats = { ok: number; failed: number; blocked: number; netFail: number; skippedLate: number };

/**
 * Отправить сообщение получателям по очереди. Скорость и 429 держит общий ограничитель.
 * Строка в tg-sent.jsonl пишется сразу после ответа API. 403 и «chat not found»: событие
 * blocked. Прочие ошибки пишем с ok:false и больше не повторяем. deadline (мс) задан у плановой
 * отправки: после него стоп.
 */
export async function deliver(
  st: TgStore,
  msg: SeriesMsg,
  day: string,
  rcpts: Subscriber[],
  opts: { deadline?: number } = {},
  deps: Deps = defaultDeps,
): Promise<DeliverStats> {
  const stats: DeliverStats = { ok: 0, failed: 0, blocked: 0, netFail: 0, skippedLate: 0 };
  for (let i = 0; i < rcpts.length; i++) {
    const s = rcpts[i];
    if (opts.deadline !== undefined && deps.now() > opts.deadline) {
      stats.skippedLate = rcpts.length - i;
      console.warn("[tg-sched] skip late msg=%s day=%s: окно закрылось, не успели %d", msg.id, day, stats.skippedLate);
      break;
    }
    const key = `${msg.id}|${day}|${s.chatId}`;
    if (inflight.has(key) || st.hasSent(msg.id, day, s.chatId)) continue;
    inflight.add(key);
    try {
      let r: SendResult;
      try {
        r = await deps.send(s, msg, day);
      } catch (e) {
        r = { ok: false, code: 0, error: `exception ${(e as Error)?.message || e}` };
      }
      st.recordSent({ msg: msg.id, day, chat_id: s.chatId, ts: new Date(deps.now()).toISOString(), ok: r.ok, ...(r.ok ? {} : { err: r.error }) });
      if (r.ok) stats.ok++;
      else {
        stats.failed++;
        if (r.code === 403) stats.blocked++;
        if (!r.code || r.code >= 500) stats.netFail++;
        noteSendResult(s.chatId, r, deps.now());
        console.warn("[tg-sched] msg=%s day=%s chat=%d не ушло: %s", msg.id, day, s.chatId, r.error);
      }
    } finally {
      inflight.delete(key);
    }
  }
  return stats;
}

// ───────────────────────── тик ─────────────────────────

let running = false;
/** Пары (msg|день), про которые уже написали skip late: в лог один раз за жизнь процесса. */
const lateLogged = new Set<string>();
let errStreak = 0;
let errAlerted = false;

/** Сообщения, чьё окно уже закрылось, а получатели остались: фиксируем в логе, что пропустили. */
function logLate(st: TgStore, sr: Series, now: number) {
  for (const day of candidateDays(sr, now)) {
    for (const msg of sr.messages) {
      if (msg.enabled === false) continue;
      const plan = planTime(day, msg);
      const key = `${msg.id}|${day}`;
      if (now <= plan + sr.graceMinutes * 60_000 || lateLogged.has(key)) continue;
      const n = pickRecipients(st, msg, day, { plan }).length;
      if (n > 0) {
        lateLogged.add(key);
        console.warn("[tg-sched] skip late msg=%s day=%s: окно закрылось, не получили %d", msg.id, day, n);
      }
    }
  }
}

/**
 * Три тика подряд с ошибкой (исключение или все отправки упёрлись в сеть): одно предупреждение
 * владельцам. Считаются только тики с работой: пустые тики между рассылками серию не обнуляют.
 */
function noteTickResult(ok: boolean, why: string) {
  if (ok) {
    errStreak = 0;
    errAlerted = false;
    return;
  }
  errStreak++;
  console.error("[tg-sched] тик с ошибкой (%d подряд): %s", errStreak, why);
  if (errStreak >= 3 && !errAlerted) {
    errAlerted = true;
    void notifyOwners(`Планировщик серии: ${errStreak} тика подряд с ошибкой. Последняя: ${why}. Проверь pm2 logs workshop-form.`);
  }
}

/** Для тестов: сбросить счётчик ошибок тиков. */
export function resetTickErrors() {
  errStreak = 0;
  errAlerted = false;
}

/**
 * Итог эфира владельцам: через 5 минут после его конца, один раз за день (отметка в tg-state.json),
 * от флага seriesEnabled не зависит. Не дошло ни до одного владельца: отметки нет, повторим на следующем тике.
 */
export async function dailyReport(now: number = Date.now()): Promise<boolean> {
  const st = getStore();
  const cfg = timeCfg(activeSeries());
  const today = dayKeyOf(now);
  for (const day of [addDays(today, -1), today]) {
    if (!isStreamDay(day, cfg) || st.isReported(day)) continue;
    const at = streamEnd(day, cfg) + REPORT_DELAY_MS;
    if (now < at || now > at + REPORT_WINDOW_MS) continue;
    if (!ownerIds().length) return false;
    if ((await notifyOwners(dayReportText(st, day))) > 0) {
      st.markReported(day);
      return true;
    }
  }
  return false;
}

/** Один тик. Пока не закончился предыдущий, новый не стартует. Возвращает число успешных отправок серии. */
export async function tick(now: number = Date.now(), deps: Deps = defaultDeps): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    if (!botEnabled() || !botConfigured()) return 0;
    const st = getStore();
    if (!holdLock(st)) return 0;
    try {
      await dailyReport(now);
    } catch (e) {
      console.error("[tg-sched] отчёт не ушёл:", (e as Error)?.message || e);
    }
    // Серия выключена: идут только обязательные сообщения (essential), остальное молчит.
    const full = activeSeries();
    const sr: Series = st.state.seriesEnabled ? full : { ...full, messages: full.messages.filter((m) => m.essential) };
    if (!sr.messages.length) return 0;
    logLate(st, sr, now);
    let sent = 0;
    let worked = false;
    let netDown = "";
    for (const d of dueMessages(sr, now)) {
      const rcpts = pickRecipients(st, d.msg, d.day, { plan: d.plan });
      if (!rcpts.length) continue;
      worked = true;
      console.log("[tg-sched] msg=%s day=%s получателей=%d", d.msg.id, d.day, rcpts.length);
      const r = await deliver(st, d.msg, d.day, rcpts, { deadline: d.plan + sr.graceMinutes * 60_000 }, deps);
      sent += r.ok;
      console.log("[tg-sched] msg=%s day=%s ушло=%d ошибок=%d заблокировали=%d", d.msg.id, d.day, r.ok, r.failed, r.blocked);
      if (r.ok === 0 && r.failed > 0 && r.netFail === r.failed) netDown = "Telegram не отвечает или отвечает ошибками 5xx";
    }
    if (worked) noteTickResult(!netDown, netDown);
    return sent;
  } catch (e) {
    noteTickResult(false, (e as Error)?.message || String(e));
    return 0;
  } finally {
    running = false;
  }
}

// ───────────────────────── /fire ─────────────────────────

/**
 * Шаг 1 команды /fire: можно ли отправить сообщение сейчас и сколько человек его получат.
 * Серия выключена, сообщение выключено или получателей нет: нельзя.
 */
export function firePlan(id: string, now: number = Date.now()): FirePlan {
  const st = getStore();
  const msg = activeSeries().messages.find((m) => m.id === id);
  if (!msg) return { ok: false, error: `Нет сообщения «${id}». Список: /series` };
  if (!st.state.seriesEnabled) return { ok: false, error: "Серия выключена, массовая отправка закрыта. Включи командой /series_on." };
  if (msg.enabled === false) return { ok: false, error: `Сообщение «${id}» выключено (enabled: false в json или /off). Включи: /on ${id}` };
  const day = addDays(dayKeyOf(now), -(msg.dayOffset ?? 0));
  const count = pickRecipients(st, msg, day).length;
  if (!count) return { ok: false, error: `Некому отправлять: все, кому «${id}» положено на сегодня, уже получили его, или таких нет.` };
  return { ok: true, day, msg, count };
}

/**
 * Шаг 2 /fire, по кнопке «Отправить»: отправить сообщение сейчас всем, кому оно положено на
 * сегодня, и пометить отправленным (запись в tg-sent.jsonl), чтобы плановая отправка не повторилась.
 * Условие «записан до планового времени» тут не действует: «плановое» время это сейчас.
 */
export async function fireNow(id: string, now: number = Date.now(), deps: Deps = defaultDeps): Promise<string> {
  const p = firePlan(id, now);
  if (!p.ok) return p.error;
  const st = getStore();
  const rcpts = pickRecipients(st, p.msg, p.day);
  const r = await deliver(st, p.msg, p.day, rcpts, {}, deps);
  return `«${id}» отправлено: ${r.ok}, ошибок: ${r.failed} (из них заблокировали бота: ${r.blocked}), получателей было: ${rcpts.length}.`;
}

/** Запустить планировщик. Возвращает функцию остановки. */
export function startScheduler(): () => void {
  registerFire({ plan: firePlan, run: (id, now) => fireNow(id, now) });
  if (!botEnabled() || !botConfigured()) {
    console.log("[tg-sched] бот выключен или нет токена, секрета вебхука, TG_GO_SECRET: планировщик не запущен");
    return () => {};
  }
  const st = getStore();
  const timer = setInterval(() => void tick(), TICK_MS);
  // Сразу после старта: если рестарт пришёлся на окно отправки, не ждём 30 секунд.
  const first = setTimeout(() => void tick(), 3000);
  const onExit = () => releaseLock(st);
  process.on("exit", onExit);
  console.log("[tg-sched] запущен, тик %d с", TICK_MS / 1000);
  return () => {
    clearInterval(timer);
    clearTimeout(first);
    process.off("exit", onExit);
    releaseLock(st);
  };
}
