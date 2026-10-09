/**
 * Тесты бота воркшопа (node:test). Запуск из корня репозитория, дважды: с TZ=UTC и TZ=America/Los_Angeles
 * (расчёты не должны зависеть от пояса процесса):
 *   npx esbuild form-api/tg.test.ts --bundle --platform=node --target=node20 --format=cjs --outfile=<tmp>/tg.test.js
 *   TZ=UTC node --test <tmp>/tg.test.js
 *   TZ=America/Los_Angeles node --test <tmp>/tg.test.js
 * Telegram подменён локальным сервером (TG_API_BASE), настоящих запросов нет.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addDays, assignStreamDay, atTime, dateLabel, dayKeyOf, dayWord, dayWordLower, isLive, isStreamDay,
  liveDayNow, nextStreamDay, setUtcOffsetMinutes, streamEnd, streamStart, type TimeCfg,
} from "./tg-time";
import { TgStore } from "./tg-store";
import {
  acquireSlot, activeSeries, applyOverrides, buildDayTable, buildKeyboard, buildSeriesText, buildStatsText, calendarDay,
  currentBizon, dayReportText, escapeHtml, expandText, getSeries, getStore, handleGo, handleTgWorkshop, handleTyClick,
  initTgWorkshop, makeGoToken, parseTyBody, pauseAll, payWarning, processUpdate, registerFire, reloadSeries, sendContent,
  seriesWarnings, tgHealth, validateSeries, verifyGoToken, visibleLength, type Links, type RenderCtx, type Series,
} from "./tg-workshop";
import {
  dailyReport, deliver, dueMessages, fireNow, firePlan, holdLock, inWindow, pickRecipients, planTime, releaseLock,
  resetTickErrors, tick, type Deps,
} from "./tg-scheduler";
import { TY_DAILY_CAP } from "./tg-store";
import { botCall } from "./tg-workshop";
import { appendFileSync } from "node:fs";
import { noteRuntime, resetRuntime, runtime } from "./tg-store";
import {
  adminKeyboard, assemble, classifyPayload, datePickerKeyboard, hostOf, MSG_LIMIT, parseAdminCb, placeOf, readJsonlCached,
  renderDailyReport, renderErrors, renderReport, renderUtmByDay, resetAdminCache, resolvePeriod,
} from "./tg-admin";
import { adminCtx } from "./tg-workshop";
import { adminDaily } from "./tg-scheduler";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import { adminAppIds, adminAppUrl, isAdminAppUser, privacyUrl } from "./tg-workshop";
import {
  buildErrors, buildLeads, buildSubscribers, buildSummary, handleAdminApp, handleAdminData, handleAdminLogin, handleTgSdk, INIT_MAX_AGE_SEC,
  LOGIN_MAX_FAILS, LOGIN_WINDOW_MS, loginLockedFor, noteLoginFail, pinMatches, resetAdminAppState, SESSION_TTL_MS, signSession,
  verifyInitData, verifySession, type ListQuery,
} from "./tg-miniapp";
import { periodFromDates } from "./tg-admin";

process.env.TG_WORKSHOP_BOT_TOKEN = "TESTTOKEN:abc123";
process.env.TG_WORKSHOP_WEBHOOK_SECRET = "test-webhook-secret-0123";
process.env.TG_GO_SECRET = "test-go-secret-9876543210";
process.env.TG_LINK_OWNER_IDS = "900,901";

/** Момент по часам Алматы (UTC+5, без перехода на лето). */
const alm = (y: number, m: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, m - 1, d, h - 5, mi, s);
const CFG: TimeCfg = { streamStart: "20:00", streamMinutes: 80, joinLiveMinutes: 40, firstDay: "2026-10-07" };
const D = "2026-10-06";
const iso = (ms: number) => new Date(ms).toISOString();
const tmp = () => mkdtempSync(join(tmpdir(), "tg-test-"));
const REPO = process.cwd();

// ───────────────────────── подставной Telegram ─────────────────────────

type Call = { method: string; body: Record<string, any> };
type Responder = (method: string, body: Record<string, any>) => { status?: number; json?: unknown; drop?: boolean; delay?: number } | null;

const fake = {
  server: null as Server | null,
  calls: [] as Call[],
  respond: null as Responder | null,
  async start() {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const method = (req.url || "").split("/").pop() || "";
        let body: Record<string, any> = {};
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch { /* multipart нам не нужен */ }
        this.calls.push({ method, body });
        const custom = this.respond?.(method, body);
        if (custom?.drop) {
          req.socket.destroy();
          return;
        }
        let status = 200;
        let out: unknown = { ok: true, result: true };
        if (custom) {
          status = custom.status ?? 200;
          out = custom.json;
        } else if (method === "sendPhoto") {
          out = { ok: true, result: { message_id: 1, photo: [{ file_id: "p-small", width: 90, height: 90 }, { file_id: "p-big", width: 800, height: 800 }] } };
        } else if (method === "sendVideo") {
          out = { ok: true, result: { message_id: 2, video: { file_id: "v-1", cover: [{ file_id: "c-small", width: 90, height: 160 }, { file_id: "c-big", width: 720, height: 1280 }] } } };
        } else if (method === "sendDocument") {
          out = { ok: true, result: { message_id: 4, document: { file_id: "d-1" } } };
        } else if (method === "sendMessage") {
          out = { ok: true, result: { message_id: 3 } };
        }
        const send = () => {
          if (res.destroyed) return;
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(out));
        };
        if (custom?.delay) setTimeout(send, custom.delay);
        else send();
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    process.env.TG_API_BASE = `http://127.0.0.1:${(this.server!.address() as { port: number }).port}`;
  },
  async stop() {
    await new Promise<void>((r) => this.server!.close(() => r()));
  },
  reset() {
    this.calls = [];
    this.respond = null;
  },
  of(method: string) {
    return this.calls.filter((c) => c.method === method);
  },
  /** Тексты всех sendMessage по chat_id. */
  texts(chat: number) {
    return this.of("sendMessage").filter((c) => c.body.chat_id === chat).map((c) => String(c.body.text));
  },
};

test.before(() => fake.start());
test.after(() => fake.stop());
test.beforeEach(() => {
  fake.reset();
  setUtcOffsetMinutes(300);
  resetTickErrors();
});

const waitFor = async (cond: () => boolean, ms = 3000) => {
  const t0 = Date.now();
  while (!cond() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 20));
  assert.ok(cond(), "дождались условия");
};

// ───────────────────────── серия для тестов ─────────────────────────

const seriesFile = join(REPO, "form-api", "tg-series.json");
const base = JSON.parse(readFileSync(seriesFile, "utf8"));
const msg = (id: string, at: string, extra: Record<string, unknown> = {}) => ({ id, at, audience: "all", text: `Текст ${id}`, ...extra });

function rawSeries(messages: unknown[], over: Record<string, unknown> = {}, links: Partial<Links> = {}) {
  // firstDay отодвинут назад: тесты живут в днях вокруг 6 октября
  return { ...base, firstDay: "2026-09-01", skipDays: [], ...over, links: { ...base.links, ...links }, messages };
}
function mkSeries(messages: unknown[], over: Record<string, unknown> = {}, links: Partial<Links> = {}): Series {
  return validateSeries(rawSeries(messages, over, links));
}

/** Свежее хранилище и серия из файла во временной папке; /reload читает этот файл. */
function boot(messages: unknown[] = [msg("m1", "19:50")], over: Record<string, unknown> = {}, links: Partial<Links> = {}) {
  const dir = tmp();
  const seriesPath = join(dir, "series.json");
  writeFileSync(seriesPath, JSON.stringify(rawSeries(messages, over, links)));
  process.env.TG_SERIES_FILE = seriesPath;
  delete process.env.TG_BOT;
  const store = initTgWorkshop({ dir, seriesFile: seriesPath });
  registerFire({ plan: firePlan, run: (id, now) => fireNow(id, now) });
  return { store, dir, seriesPath };
}

function sub(store: TgStore, chat: number, day: string, at: number, extra: { payload?: string; first?: string; username?: string } = {}) {
  store.recordEvent({
    type: "start", chat_id: chat, user_id: chat, username: extra.username, first_name: extra.first ?? `U${chat}`,
    payload: extra.payload ?? "", streamDay: day, ts: iso(at),
  });
}

const upd = (id: number, text: string, extra: Record<string, unknown> = {}) => ({
  message: { chat: { id, type: "private" }, from: { id, first_name: "Аня", username: `u${id}`, ...extra }, text },
});
const cb = (id: number, data: string, extra: Record<string, unknown> = {}) => ({
  callback_query: { id: `cb-${id}-${data}`, from: { id }, message: { chat: { id }, message_id: 77 }, data, ...extra },
});

// ───────────────────────── время ─────────────────────────

test("assignStreamDay: окно записи 40 минут после старта, дальше следующий день; переходы месяца и года", () => {
  const cfg = { ...CFG, firstDay: undefined };
  assert.equal(assignStreamDay(alm(2026, 10, 8, 12, 0), cfg), "2026-10-08");
  assert.equal(assignStreamDay(alm(2026, 10, 8, 19, 59, 59), cfg), "2026-10-08");
  assert.equal(assignStreamDay(alm(2026, 10, 8, 20, 0), cfg), "2026-10-08");          // эфир идёт: сегодняшний
  assert.equal(assignStreamDay(alm(2026, 10, 8, 20, 39, 59), cfg), "2026-10-08");     // последняя секунда окна
  assert.equal(assignStreamDay(alm(2026, 10, 8, 20, 40, 0), cfg), "2026-10-09");      // окно закрыто: завтра
  assert.equal(assignStreamDay(alm(2026, 10, 8, 21, 19, 59), cfg), "2026-10-09");
  assert.equal(assignStreamDay(alm(2026, 10, 8, 23, 59, 59), cfg), "2026-10-09");
  assert.equal(assignStreamDay(alm(2026, 10, 31, 21, 30), cfg), "2026-11-01");
  assert.equal(assignStreamDay(alm(2026, 12, 31, 22, 0), cfg), "2027-01-01");
  // 00:30 в Алматы это ещё 19:30 предыдущего дня по UTC: день считается по Алматы
  assert.equal(assignStreamDay(Date.UTC(2026, 9, 6, 19, 30), cfg), "2026-10-07");
  // joinLiveMinutes берётся из серии, по умолчанию 40
  assert.equal(assignStreamDay(alm(2026, 10, 8, 20, 50), { ...cfg, joinLiveMinutes: 60 }), "2026-10-08");
  assert.equal(assignStreamDay(alm(2026, 10, 8, 20, 50), { streamStart: "20:00", streamMinutes: 80 }), "2026-10-09");
});

test("firstDay и skipDays: день эфира не раньше firstDay и не из skipDays", () => {
  const cfg: TimeCfg = { ...CFG, skipDays: ["2026-10-09", "2026-10-10"] };
  // до запуска: любой день до 7 октября даёт 7 октября
  assert.equal(assignStreamDay(alm(2026, 10, 3, 12, 0), cfg), "2026-10-07");
  assert.equal(assignStreamDay(alm(2026, 10, 6, 21, 0), cfg), "2026-10-07");
  assert.equal(assignStreamDay(alm(2026, 10, 7, 12, 0), cfg), "2026-10-07");
  // 8 октября после окна: 9 и 10 пропущены, значит 11
  assert.equal(assignStreamDay(alm(2026, 10, 8, 21, 0), cfg), "2026-10-11");
  // сегодня из skipDays: сегодняшнего эфира нет
  assert.equal(assignStreamDay(alm(2026, 10, 9, 12, 0), cfg), "2026-10-11");
  assert.equal(isStreamDay("2026-10-06", cfg), false);
  assert.equal(isStreamDay("2026-10-07", cfg), true);
  assert.equal(isStreamDay("2026-10-09", cfg), false);
  assert.equal(nextStreamDay("2026-10-09", cfg), "2026-10-11");
  assert.equal(nextStreamDay("2026-09-01", cfg), "2026-10-07");
  // в день без эфира live не бывает
  assert.equal(liveDayNow(alm(2026, 10, 9, 20, 30), cfg), null);
  assert.equal(liveDayNow(alm(2026, 10, 8, 20, 30), cfg), "2026-10-08");
});

test("старт, конец эфира, isLive, liveDayNow", () => {
  assert.equal(streamStart(D, CFG), alm(2026, 10, 6, 20, 0));
  assert.equal(streamEnd(D, CFG), alm(2026, 10, 6, 21, 20));
  assert.equal(isLive(D, alm(2026, 10, 6, 19, 59, 59), CFG), false);
  assert.equal(isLive(D, alm(2026, 10, 6, 20, 0), CFG), true);
  assert.equal(isLive(D, alm(2026, 10, 6, 21, 19, 59), CFG), true);
  assert.equal(isLive(D, alm(2026, 10, 6, 21, 20), CFG), false);
  assert.equal(liveDayNow(alm(2026, 10, 8, 21, 0), CFG), "2026-10-08");
  assert.equal(liveDayNow(alm(2026, 10, 8, 21, 20), CFG), null);
});

test("пояс берётся из utcOffsetMinutes серии, а не из TZ процесса", () => {
  const now = Date.UTC(2026, 9, 6, 15, 30); // 20:30 в Алматы, 15:30 по UTC
  assert.equal(dayKeyOf(now), "2026-10-06");
  assert.equal(atTime("2026-10-06", "20:00"), Date.UTC(2026, 9, 6, 15, 0));
  setUtcOffsetMinutes(0);
  assert.equal(atTime("2026-10-06", "20:00"), Date.UTC(2026, 9, 6, 20, 0));
  setUtcOffsetMinutes(600);
  assert.equal(dayKeyOf(now), "2026-10-07"); // 01:30 следующего дня при +10
  // reloadSeries выставляет смещение из json
  const { seriesPath } = boot([msg("a", "10:00")], { utcOffsetMinutes: 300 });
  setUtcOffsetMinutes(0);
  reloadSeries(seriesPath);
  assert.equal(atTime("2026-10-06", "20:00"), Date.UTC(2026, 9, 6, 15, 0));
});

test("dayWord, dateLabel: Сегодня, Завтра, дата; границы месяца и полуночи Алматы", () => {
  const now = alm(2026, 10, 6, 15, 0);
  assert.equal(dayWord("2026-10-06", now), "Сегодня");
  assert.equal(dayWord("2026-10-07", now), "Завтра");
  assert.equal(dayWord("2026-10-08", now), "8 октября");
  assert.equal(dayWordLower("2026-10-06", now), "сегодня");
  assert.equal(dayWordLower("2026-10-07", now), "завтра");
  assert.equal(dayWordLower("2026-10-08", now), "8 октября");
  assert.equal(dateLabel("2026-10-06"), "6 октября");
  const eom = alm(2026, 10, 31, 10, 0);
  assert.equal(dayWord("2026-11-01", eom), "Завтра");
  assert.equal(dayWord("2026-11-02", eom), "2 ноября");
  assert.equal(dayWord("2026-10-07", Date.UTC(2026, 9, 6, 19, 30)), "Сегодня");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("исходники tg-*.ts: без Intl, локальных геттеров Date, toLocale и длинного тире", () => {
  for (const f of ["tg-time.ts", "tg-store.ts", "tg-workshop.ts", "tg-scheduler.ts", "tg-setup.ts", "tg-admin.ts", "tg-miniapp.ts"]) {
    const p = join(REPO, "form-api", f);
    const src = readFileSync(p, "utf8");
    assert.equal(/\bIntl\./.test(src), false, `${f}: Intl`);
    assert.equal(/\.get(Hours|Date|Day|Month|FullYear|Minutes|Seconds|TimezoneOffset)\(/.test(src), false, `${f}: локальный геттер Date`);
    assert.equal(/toLocale\w*\(/.test(src), false, `${f}: toLocale`);
    assert.equal(src.includes("—"), false, `${f}: длинное тире`);
  }
});

// ───────────────────────── окно отправки ─────────────────────────

test("окно отправки: границы, опоздание, dayOffset, вчерашний день для сообщений следующего дня", () => {
  const sr = mkSeries([msg("a", "19:50"), msg("b", "20:00"), msg("c", "11:00", { dayOffset: 1, audience: "notClicked" })]);
  const plan = planTime(D, { at: "19:50" });
  assert.equal(plan, alm(2026, 10, 6, 19, 50));
  const g = sr.graceMinutes;
  assert.equal(g, 12);
  assert.equal(inWindow(plan - 1, plan, g), false);
  assert.equal(inWindow(plan, plan, g), true);
  assert.equal(inWindow(plan + g * 60_000, plan, g), true);
  assert.equal(inWindow(plan + g * 60_000 + 1, plan, g), false);
  assert.equal(planTime(D, { at: "11:00", dayOffset: 1 }), alm(2026, 10, 7, 11, 0));

  const ids = (now: number) => dueMessages(sr, now).map((d) => `${d.msg.id}@${d.day}`);
  assert.deepEqual(ids(alm(2026, 10, 6, 19, 55)), ["a@2026-10-06"]);
  assert.deepEqual(ids(alm(2026, 10, 6, 20, 1)), ["a@2026-10-06", "b@2026-10-06"]);
  assert.deepEqual(ids(alm(2026, 10, 6, 20, 40)), []);             // опоздали: «через час» не шлём
  assert.deepEqual(ids(alm(2026, 10, 7, 11, 5)), ["c@2026-10-06"]); // привязано к дню эфира D, то есть вчера
  const off = mkSeries([msg("x", "19:50", { enabled: false })]);
  assert.deepEqual(dueMessages(off, alm(2026, 10, 6, 19, 55)), []);
  // окно через полночь: сообщение 23:55 доживает до 00:07 следующих суток
  const late = mkSeries([msg("n", "23:55")]);
  assert.deepEqual(dueMessages(late, alm(2026, 10, 7, 0, 5)).map((d) => d.day), ["2026-10-06"]);
});

// ───────────────────────── подписчики и аудитории ─────────────────────────

test("получатели: аудитории, blocked, stop, registeredAt, уже получавшие, чужой день", () => {
  const { store } = boot();
  const plan = alm(2026, 10, 6, 19, 50);
  sub(store, 1, D, alm(2026, 10, 6, 10, 0));
  sub(store, 2, D, alm(2026, 10, 6, 19, 55));
  sub(store, 3, D, alm(2026, 10, 6, 10, 0));
  store.recordEvent({ type: "blocked", chat_id: 3, ts: iso(alm(2026, 10, 6, 11, 0)) });
  sub(store, 4, D, alm(2026, 10, 6, 10, 0));
  store.recordEvent({ type: "stop", chat_id: 4, ts: iso(alm(2026, 10, 6, 11, 0)) });
  sub(store, 5, D, alm(2026, 10, 6, 10, 0));
  store.recordClick(5, D, iso(alm(2026, 10, 6, 19, 51)));
  sub(store, 6, D, alm(2026, 10, 6, 10, 0));
  store.recordEvent({ type: "paid", chat_id: 6, by: "owner", ts: iso(alm(2026, 10, 6, 12, 0)) });
  sub(store, 7, "2026-10-07", alm(2026, 10, 6, 10, 0));

  const pick = (aud: string) => pickRecipients(store, { id: "t", at: "19:50", audience: aud as any, text: "x" }, D, { plan }).map((s) => s.chatId);
  assert.deepEqual(pick("all"), [1, 5, 6]);
  assert.deepEqual(pick("notClicked"), [1, 6]);
  assert.deepEqual(pick("clicked"), [5]);
  assert.deepEqual(pick("notPaid"), [1, 5]);
  assert.deepEqual(pickRecipients(store, { id: "t", at: "19:50", audience: "all", text: "x" }, D).map((s) => s.chatId), [1, 2, 5, 6]);
  store.recordSent({ msg: "t", day: D, chat_id: 1, ts: iso(plan), ok: true });
  store.recordSent({ msg: "t", day: D, chat_id: 5, ts: iso(plan), ok: false, err: "400 x" });
  assert.deepEqual(pick("all"), [6]);
});

test("клик привязан к дню D и пишется один раз на пару (чат, день)", () => {
  const { store } = boot();
  sub(store, 1, D, alm(2026, 10, 6, 10, 0));
  store.recordClick(1, "2026-10-05", iso(alm(2026, 10, 5, 20, 5)));
  assert.equal(store.audienceOk("notClicked", store.subs.get(1)!, D), true);
  assert.equal(store.audienceOk("clicked", store.subs.get(1)!, D), false);
  assert.equal(store.recordClick(1, D, iso(alm(2026, 10, 6, 20, 5))), true);
  assert.equal(store.recordClick(1, D, iso(alm(2026, 10, 6, 20, 6))), false);
  assert.equal(store.audienceOk("notClicked", store.subs.get(1)!, D), false);
  assert.equal(store.audienceOk("clicked", store.subs.get(1)!, D), true);
  const lines = readFileSync(join(store.dir, "tg-clicks.jsonl"), "utf8").trim().split("\n");
  assert.equal(lines.filter((l) => l.includes(`"day":"${D}"`)).length, 1);
});

test("аудитория clickedNotPaid: клик за день D и не оплатил", () => {
  const { store } = boot();
  const t0 = alm(2026, 10, 6, 10, 0);
  for (const c of [1, 2, 3, 4]) sub(store, c, D, t0);
  store.recordClick(1, D, iso(alm(2026, 10, 6, 20, 5)));                          // клик есть, не оплатил
  store.recordClick(2, D, iso(alm(2026, 10, 6, 20, 5)));                          // клик есть, оплатил
  store.recordEvent({ type: "paid", chat_id: 2, by: "self", ts: iso(alm(2026, 10, 6, 21, 30)) });
  store.recordEvent({ type: "paid", chat_id: 3, by: "owner", ts: iso(alm(2026, 10, 6, 21, 30)) }); // клика нет, оплатил
  store.recordClick(4, "2026-10-05", iso(alm(2026, 10, 5, 20, 5)));               // клик за другой день
  const ok = (chat: number, day = D) => store.audienceOk("clickedNotPaid", store.subs.get(chat)!, day);
  assert.equal(ok(1), true);
  assert.equal(ok(2), false);
  assert.equal(ok(3), false);
  assert.equal(ok(4), false);
  assert.equal(ok(1, "2026-10-05"), false); // клик 1 был за D, за другой день его нет
  const m = { id: "cnp", at: "10:30", dayOffset: 1, audience: "clickedNotPaid" as const, text: "x" };
  assert.deepEqual(pickRecipients(store, m, D, { plan: alm(2026, 10, 7, 10, 30) }).map((s) => s.chatId), [1]);
  // «Я уже оплатил(а)» убирает человека из дожима сразу
  store.recordEvent({ type: "paid", chat_id: 1, by: "self", ts: iso(alm(2026, 10, 7, 9, 0)) });
  assert.deepEqual(pickRecipients(store, m, D, { plan: alm(2026, 10, 7, 10, 30) }).map((s) => s.chatId), []);
});

test("хранилище: повторный /start по правилам, состояние после рестарта то же", async () => {
  const { store, dir } = boot();
  const now1 = alm(2026, 10, 6, 12, 0);
  await processUpdate(upd(50, "/start ty_5f0e0a3c-0000-4000-8000-000000000001"), now1);
  let s = store.subs.get(50)!;
  assert.equal(s.streamDay, D);
  assert.equal(s.payload, "ty_5f0e0a3c-0000-4000-8000-000000000001"); // payload хранится целиком
  assert.equal(s.registeredAt, now1);
  // повторный /start в тот же день: запись не сдвигается, метка не затирается
  await processUpdate(upd(50, "/start ig"), alm(2026, 10, 6, 15, 0));
  s = store.subs.get(50)!;
  assert.equal(s.streamDay, D);
  assert.equal(s.payload, "ty_5f0e0a3c-0000-4000-8000-000000000001");
  assert.equal(s.registeredAt, now1);
  // stop, потом /start: stop снят, запись свежая
  await processUpdate(upd(50, "/stop"), alm(2026, 10, 6, 16, 0));
  assert.equal(store.subs.get(50)!.stopped, true);
  await processUpdate(upd(50, "/start"), alm(2026, 10, 6, 17, 0));
  s = store.subs.get(50)!;
  assert.equal(s.stopped, false);
  assert.equal(s.registeredAt, alm(2026, 10, 6, 17, 0));
  // эфир прошёл: смена дня ставит registeredAt на время этого /start
  const later = alm(2026, 10, 6, 21, 30);
  await processUpdate(upd(50, "/start"), later);
  s = store.subs.get(50)!;
  assert.equal(s.streamDay, "2026-10-07");
  assert.equal(s.registeredAt, later);
  await processUpdate(upd(51, "/start"), alm(2026, 10, 6, 22, 0));
  assert.equal(store.subs.get(51)!.streamDay, "2026-10-07");

  store.recordClick(50, "2026-10-07", iso(alm(2026, 10, 7, 20, 1)));
  store.recordSent({ msg: "m1", day: D, chat_id: 50, ts: iso(alm(2026, 10, 6, 19, 50)), ok: true });
  store.setSeriesEnabled(true);
  store.setMedia("https://x/y.jpg", "FILEID");
  store.setOverride("m1", { at: "20:55", enabled: false });
  store.setBizon("https://start.bizon365.ru/room/1/x");
  store.markReported(D);
  store.recordTyClick("tg", "e-1", D, iso(now1));

  const again = new TgStore(dir);
  assert.equal(again.subs.size, 2);
  assert.deepEqual(again.subs.get(50), store.subs.get(50));
  assert.equal(again.hasClick(50, "2026-10-07"), true);
  assert.equal(again.hasSent("m1", D, 50), true);
  assert.equal(again.state.seriesEnabled, true);
  assert.equal(again.getMedia("https://x/y.jpg"), "FILEID");
  assert.deepEqual(again.state.overrides, { m1: { at: "20:55", enabled: false } });
  assert.equal(again.state.bizon, "https://start.bizon365.ru/room/1/x");
  assert.equal(again.isReported(D), true);
  assert.equal(again.tyCount(D, "tg"), 1);
  assert.deepEqual(again.dayMetrics("2026-10-07"), store.dayMetrics("2026-10-07"));
});

test("rejoin, paid, blocked/unblocked, неизвестные чужие апдейты", async () => {
  const { store } = boot();
  const now = alm(2026, 10, 7, 11, 5);
  sub(store, 60, D, alm(2026, 10, 6, 10, 0));
  await processUpdate(cb(60, "rejoin"), now);
  assert.equal(store.subs.get(60)!.streamDay, "2026-10-07");
  assert.equal(store.subs.get(60)!.registeredAt, now);
  assert.equal(fake.of("answerCallbackQuery").length, 1);
  assert.equal(fake.texts(60)[0], base.welcome.rejoinAck); // текст из json
  fake.reset();
  await processUpdate(cb(60, "paid"), now);
  await processUpdate(cb(60, "paid", { id: "another" }), now);
  assert.equal(store.subs.get(60)!.paid, true);
  assert.equal(fake.of("sendMessage").length, 1);
  assert.equal(fake.of("answerCallbackQuery").length, 2);
  // неизвестный callback тоже закрывается
  fake.reset();
  await processUpdate(cb(60, "mystery"), now);
  assert.equal(fake.of("answerCallbackQuery").length, 1);
  assert.equal(fake.of("sendMessage").length, 0);
  // my_chat_member: свой подписчик меняет состояние, незнакомый chat_id игнорируется
  await processUpdate({ my_chat_member: { chat: { id: 60, type: "private" }, new_chat_member: { status: "kicked" } } }, now);
  assert.equal(store.subs.get(60)!.blocked, true);
  await processUpdate({ my_chat_member: { chat: { id: 60, type: "private" }, new_chat_member: { status: "member" } } }, now);
  assert.equal(store.subs.get(60)!.blocked, false);
  await processUpdate({ my_chat_member: { chat: { id: 999, type: "private" }, new_chat_member: { status: "kicked" } } }, now);
  assert.equal(store.subs.has(999), false);
  // группы и каналы бот не обслуживает
  fake.reset();
  await processUpdate({ message: { chat: { id: -100, type: "supergroup" }, from: { id: 5 }, text: "/start" } }, now);
  assert.equal(store.subs.has(-100), false);
  assert.equal(fake.calls.length, 0);
});

// ───────────────────────── метрики по эфирам и отчёт ─────────────────────────

test("метрики эфира: записались (уникальные, история сохраняется), перешли, оплатили; таблица на 7 дней", () => {
  const { store } = boot();
  const t = (d: number, h = 10) => alm(2026, 10, d, h, 0);
  for (const c of [1, 2, 3]) sub(store, c, D, t(6));
  sub(store, 4, "2026-10-07", t(6));
  // 2 перезаписался на завтра: на 6 октября он всё равно считается записавшимся
  store.recordEvent({ type: "rejoin", chat_id: 2, streamDay: "2026-10-07", ts: iso(t(7, 11)) });
  // повторный /start в тот же день не удваивает
  sub(store, 1, D, t(6, 12));
  store.recordClick(1, D, iso(t(6, 20)));
  store.recordClick(2, D, iso(t(6, 20)));
  store.recordClick(4, D, iso(t(6, 20))); // 4 не записывался на 6 октября: не считается
  store.recordEvent({ type: "paid", chat_id: 1, by: "self", ts: iso(t(6, 21)) });
  store.recordEvent({ type: "paid", chat_id: 3, by: "owner", ts: iso(t(6, 21)) }); // вручную не считается
  assert.deepEqual(store.dayMetrics(D), { registered: 3, clicked: 2, paid: 1 });
  assert.deepEqual(store.dayMetrics("2026-10-07"), { registered: 2, clicked: 0, paid: 0 });
  assert.deepEqual(store.dayMetrics("2026-10-01"), { registered: 0, clicked: 0, paid: 0 });
  store.recordTyClick("tg", "a", D, iso(t(6)));
  store.recordTyClick("tg", "a", D, iso(t(6)));  // тот же eid: не удваивается
  store.recordTyClick("tg", "b", D, iso(t(6)));
  store.recordTyClick("wa", "", D, iso(t(6)));
  store.recordTyClick("wa", "", D, iso(t(6)));   // без eid считаем каждое
  assert.equal(store.tyCount(D, "tg"), 2);
  assert.equal(store.tyCount(D, "wa"), 2);
  assert.equal(dayReportText(store, D), "Эфир 6 октября: записались в бота 3, перешли по кнопке 2 (67%), со «Спасибо» нажали Telegram 2, WhatsApp 2.");
  assert.match(dayReportText(store, "2026-10-02"), /^Эфир 2 октября: записались в бота 0, перешли по кнопке 0 \(0%\)/);

  // таблица: 10 разных дней, видны последние 7, новые сверху
  for (let d = 1; d <= 9; d++) sub(store, 100 + d, `2026-10-0${d}`, t(1));
  const sr = mkSeries([msg("a", "10:00")]);
  const table = buildDayTable(store, sr, alm(2026, 10, 6, 15, 0));
  assert.equal(table.length, 7);
  assert.match(table[0], /^2026-10-09: записались 1, перешли 0 \(0%\), «Я уже оплатил\(а\)» 0$/);
  assert.match(table[3], /^2026-10-06:/);
  assert.match(table[3], /записались 4, перешли 2 \(50%\), «Я уже оплатил\(а\)» 1$/);
  assert.match(table[6], /^2026-10-03:/);
});

test("/stats: метки по префиксу ty_, клики «Спасибо», «Запустить» сегодня, таблица по эфирам", async () => {
  const { store } = boot();
  const now = alm(2026, 10, 6, 15, 0);
  sub(store, 5, D, alm(2026, 10, 6, 9, 0), { payload: "ty_aaaa" });
  sub(store, 6, D, alm(2026, 10, 6, 9, 5), { payload: "ty_bbbb" });
  sub(store, 7, D, alm(2026, 10, 5, 9, 0), { payload: "ig" });
  sub(store, 8, D, alm(2026, 10, 6, 10, 0));
  store.recordTyClick("tg", "", D, iso(now));
  store.recordTyClick("wa", "", D, iso(now));
  await processUpdate(upd(900, "/stats"), now);
  const text = fake.texts(900)[0];
  assert.match(text, /Подписчиков всего: 4/);
  assert.match(text, /По меткам: ty: 2, ig: 1, без метки: 1/);
  assert.match(text, /Сегодня на странице «Спасибо» нажали Telegram: 1, WhatsApp: 1/);
  assert.match(text, /Сегодня нажали «Запустить» в боте: 3 \(со страницы «Спасибо»: 2\)/);
  assert.match(text, /Последние эфиры/);
  assert.match(text, /2026-10-06: записались 4/);
  assert.equal(fake.of("sendMessage")[0].body.parse_mode, undefined);
  assert.equal(text.includes("—"), false);
});

test("итоговый отчёт: через 5 минут после конца эфира, один раз в день, от seriesEnabled не зависит", async () => {
  const { store, dir } = boot();
  for (const c of [1, 2, 3]) sub(store, c, D, alm(2026, 10, 6, 10, 0));
  store.recordClick(1, D, iso(alm(2026, 10, 6, 20, 5)));
  store.recordClick(2, D, iso(alm(2026, 10, 6, 20, 6)));
  store.recordTyClick("tg", "x", D, iso(alm(2026, 10, 6, 12, 0)));
  store.recordTyClick("wa", "y", D, iso(alm(2026, 10, 6, 12, 0)));
  assert.equal(store.state.seriesEnabled, false);

  assert.equal(await dailyReport(alm(2026, 10, 6, 21, 24, 59)), false); // конец 21:20, +5 мин = 21:25
  assert.equal(fake.calls.length, 0);
  assert.equal(await dailyReport(alm(2026, 10, 6, 21, 25, 0)), true);
  assert.deepEqual(fake.of("sendMessage").map((c) => c.body.chat_id), [900, 901]);
  assert.equal(fake.texts(900)[0], "Эфир 6 октября: записались в бота 3, перешли по кнопке 2 (67%), со «Спасибо» нажали Telegram 1, WhatsApp 1.");
  // второй раз за день не уходит, и после рестарта тоже
  fake.reset();
  assert.equal(await dailyReport(alm(2026, 10, 6, 22, 0)), false);
  assert.equal(fake.calls.length, 0);
  assert.equal(new TgStore(dir).isReported(D), true);
  // через тик: серия выключена, но отчёт за следующий день уходит
  sub(store, 4, "2026-10-07", alm(2026, 10, 7, 9, 0));
  await tick(alm(2026, 10, 7, 21, 26));
  assert.equal(fake.texts(900).filter((t) => t.startsWith("Эфир 7 октября")).length, 1);
  await tick(alm(2026, 10, 7, 21, 27));
  assert.equal(fake.texts(900).filter((t) => t.startsWith("Эфир 7 октября")).length, 1);
});

test("итоговый отчёт: день без эфира не отправляется, недоступные владельцы не отмечают день", async () => {
  const { store } = boot([msg("a", "10:00")], { skipDays: ["2026-10-06"] });
  assert.equal(await dailyReport(alm(2026, 10, 6, 21, 30)), false);
  assert.equal(fake.calls.length, 0);
  // Telegram не отвечает владельцам: отметки нет, повторим на следующем тике
  fake.respond = () => ({ status: 403, json: { ok: false, error_code: 403, description: "Forbidden" } });
  assert.equal(await dailyReport(alm(2026, 10, 7, 21, 30)), false);
  assert.equal(store.isReported("2026-10-07"), false);
  fake.respond = null;
  assert.equal(await dailyReport(alm(2026, 10, 7, 21, 31)), true);
  assert.equal(store.isReported("2026-10-07"), true);
  // окно 12 часов: назавтра днём уже не догоняем
  assert.equal(await dailyReport(alm(2026, 10, 9, 15, 0)), false);
});

// ───────────────────────── токен /api/go ─────────────────────────

test("токен перехода: подпись TG_GO_SECRET, подделка, чужой ключ, секрет вебхука не подходит", () => {
  const secret = process.env.TG_GO_SECRET!;
  const t = makeGoToken(12345, D);
  assert.match(t, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{12}$/);
  assert.deepEqual(verifyGoToken(t), { chatId: 12345, day: D });
  assert.deepEqual(verifyGoToken(makeGoToken(-1001, D, secret), secret), { chatId: -1001, day: D });
  assert.equal(verifyGoToken(t, "другой-секрет"), null);
  assert.equal(verifyGoToken(t, process.env.TG_WORKSHOP_WEBHOOK_SECRET!), null);
  const forged = Buffer.from(`99999:${D}`).toString("base64url") + "." + t.split(".")[1];
  assert.equal(verifyGoToken(forged), null);
  assert.equal(verifyGoToken(t.slice(0, -1) + (t.endsWith("A") ? "B" : "A")), null);
  for (const bad of ["", "bad", "a.b", ".", "....", "x".repeat(300)]) assert.equal(verifyGoToken(bad), null);
  assert.equal(makeGoToken(1, D, ""), "");
  // ключа нет: ссылок перехода нет вообще
  const saved = process.env.TG_GO_SECRET;
  delete process.env.TG_GO_SECRET;
  assert.equal(makeGoToken(1, D), "");
  assert.equal(verifyGoToken(t), null);
  process.env.TG_GO_SECRET = saved;
});

test("/api/go: клик один раз и только GET, битый токен ведёт на эфир без записи, ссылка берётся в момент клика", async () => {
  const { store } = boot();
  const server = createServer((req, res) => handleGo(req, res, (req.url || "").replace("/api/go/", "")));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const go = (path: string, method = "GET") => fetch(`http://127.0.0.1:${port}/api/go/${path}`, { method, redirect: "manual" });
  try {
    const bizon = base.links.bizon;
    const good = makeGoToken(777, D);
    const r1 = await go(good);
    assert.equal(r1.status, 302);
    assert.equal(r1.headers.get("location"), bizon);
    assert.equal(r1.headers.get("cache-control"), "no-store");
    assert.equal(store.hasClick(777, D), true);
    await go(good);
    await go(good);
    assert.equal(readFileSync(join(store.dir, "tg-clicks.jsonl"), "utf8").trim().split("\n").length, 1);

    const r2 = await go(makeGoToken(778, D, "чужой"));
    assert.equal(r2.status, 302);
    assert.equal(r2.headers.get("location"), bizon);
    assert.equal(store.hasClick(778, D), false);
    assert.equal((await go("bad")).headers.get("location"), bizon);
    const r4 = await go(makeGoToken(779, D), "HEAD");
    assert.equal(r4.status, 302);
    assert.equal(store.hasClick(779, D), false);
    // смена ссылки через state действует на следующий же клик
    store.setBizon("https://start.bizon365.ru/room/9/new");
    assert.equal((await go(makeGoToken(780, D))).headers.get("location"), "https://start.bizon365.ru/room/9/new");
    assert.equal(currentBizon(), "https://start.bizon365.ru/room/9/new");
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

// ───────────────────────── подстановки и кнопки ─────────────────────────

function ctxFor(sr: Series, extra: Partial<RenderCtx> = {}): RenderCtx {
  return { series: sr, now: alm(2026, 10, 6, 15, 0), chatId: 4242, firstName: "Аня", day: D, ...extra };
}

test("кнопки: пустой {PAY} выпадает, новые {PREPAY_KZ} и {PREPAY_INTL}, callback, STREAM с подписью, WhatsApp-шаблон", () => {
  const sr = mkSeries([], {}, { pay: "", prepayKz: "https://pay.kaspi.kz/pay/abc", prepayIntl: "https://pay.example.ru/x" });
  const rows = [
    [{ text: "Оплатить", url: "{PAY}" }],
    [{ text: "Kaspi", url: "{PREPAY_KZ}" }],
    [{ text: "Россия", url: "{PREPAY_INTL}" }],
    [{ text: "Менеджеру", url: "{MANAGER}" }],
    [{ text: "WhatsApp", url: "{WHATSAPP_TEMPLATE}" }],
    [{ text: "Эфир", url: "{STREAM}" }, { text: "Кейсы", url: "{CASES}" }, { text: "Игра", url: "{GAME}" }],
    [{ text: "Я оплатил", callback: "paid" }],
    [{ text: "Мусор", url: "{UNKNOWN}" }],
  ];
  const kb = buildKeyboard(rows, ctxFor(sr))!;
  assert.deepEqual(kb.map((r) => r.map((b) => b.text)), [["Kaspi"], ["Россия"], ["Менеджеру"], ["WhatsApp"], ["Эфир", "Кейсы", "Игра"], ["Я оплатил"]]);
  assert.equal(kb[0][0].url, "https://pay.kaspi.kz/pay/abc");
  assert.equal(kb[1][0].url, "https://pay.example.ru/x");
  assert.equal(kb[2][0].url, sr.links.manager);
  assert.equal(kb[3][0].url, `${sr.links.whatsapp}?text=${encodeURIComponent(sr.links.template)}`);
  const stream = kb[4][0].url!;
  assert.ok(stream.startsWith("https://onai.academy/workshop/api/go/"));
  assert.deepEqual(verifyGoToken(stream.split("/").pop()!), { chatId: 4242, day: D });
  assert.equal(kb[5][0].callback_data, "paid");
  assert.equal(kb[5][0].url, undefined);
  // оплата задана: кнопка появляется
  const paid = mkSeries([], {}, { pay: "https://pay.example/x" });
  assert.equal(buildKeyboard([[{ text: "Оплатить", url: "{PAY}" }]], ctxFor(paid))![0][0].url, "https://pay.example/x");
  // предпросмотр владельцу: пустые ссылки оплаты показаны кнопкой менеджера
  const empty = mkSeries([], {}, { pay: "", prepayKz: "", prepayIntl: "" });
  const prev = buildKeyboard([[{ text: "a", url: "{PAY}" }], [{ text: "b", url: "{PREPAY_KZ}" }], [{ text: "c", url: "{PREPAY_INTL}" }]], ctxFor(empty, { preview: true }))!;
  assert.equal(prev.length, 3);
  assert.ok(prev.every((r) => r[0].url === empty.links.manager));
  assert.equal(buildKeyboard([[{ text: "a", url: "{PAY}" }], [{ text: "b", url: "{PREPAY_KZ}" }]], ctxFor(empty)), undefined);
  // {STREAM} с liveDay ведёт на другой день, чем D
  const live = buildKeyboard([[{ text: "Эфир", url: "{STREAM}" }]], ctxFor(sr, { day: "2026-10-07", liveDay: D }))!;
  assert.deepEqual(verifyGoToken(live[0][0].url!.split("/").pop()!), { chatId: 4242, day: D });
});

test("экранирование: тело текста из json доверенный HTML, экранируются только подставляемые значения", () => {
  const sr = mkSeries([], {}, { template: "Привет <b>& «тест» 150 000 ₸ a<b" });
  const c = ctxFor(sr, { firstName: "<b>Боб</b> & Co" });
  assert.equal(expandText("{hi} Дальше", c), "Привет, &lt;b&gt;Боб&lt;/b&gt; &amp; Co! Дальше");
  assert.equal(expandText("{hi}", ctxFor(sr, { firstName: "  " })), "Привет!");
  assert.equal(expandText("{hi}", ctxFor(sr, { firstName: undefined })), "Привет!");
  // тело шаблона не трогаем: теги остаются, как написаны
  assert.equal(expandText("<b>жирный</b> и <code>код</code>", c), "<b>жирный</b> и <code>код</code>");
  assert.equal(expandText("<code>{TEMPLATE}</code>", c), "<code>Привет &lt;b&gt;&amp; «тест» 150 000 ₸ a&lt;b</code>");
  assert.equal(expandText("{dayWord}, {dayWordLower}, {dayWord}", ctxFor(sr)), "Сегодня, сегодня, Сегодня");
  assert.equal(expandText("{нет такого}", c), "{нет такого}");
  assert.equal(escapeHtml("a & b < c > d"), "a &amp; b &lt; c &gt; d");
});

test("длина подписи считается после разбора разметки", () => {
  assert.equal(visibleLength("<code>abc</code>"), 3);
  assert.equal(visibleLength("a &lt; b &amp; c"), 9);
  assert.equal(visibleLength("x".repeat(1024)), 1024);
});

// ───────────────────────── проверка серии ─────────────────────────

test("validateSeries: id, HH:MM, аудитории, плейсхолдеры, callback до 64 байт, длинное тире, HTML", () => {
  const ok = (m: Record<string, unknown>) => validateSeries(rawSeries([m]));
  const bad = (m: unknown[], re: RegExp, over: Record<string, unknown> = {}) => assert.throws(() => validateSeries(rawSeries(m, over)), re);
  assert.doesNotThrow(() => ok(msg("x", "10:00", { silent: true, audience: "clicked" })));
  assert.doesNotThrow(() => ok(msg("x", "10:00", { text: "<b>жирно</b> <code>{TEMPLATE}</code> &amp; ещё" })));
  bad([msg("x", "10:00"), msg("x", "11:00")], /повторяется/);
  bad([msg("a b", "10:00")], /нужен id/);
  bad([msg("x", "25:00")], /at не время/);
  bad([msg("x", "ab")], /at вида/);
  bad([msg("x", "10:00", { audience: "everyone" })], /audience/);
  bad([msg("x", "10:00", { silent: "yes" })], /silent/);
  bad([msg("x", "10:00", { text: "Привет, {name}" })], /неизвестная подстановка \{name\}/);
  bad([msg("x", "10:00", { buttons: [[{ text: "a", url: "{PREPAY}" }]] })], /неизвестная подстановка \{PREPAY\}/);
  bad([msg("x", "10:00", { buttons: [[{ text: "a", url: "http://plain.example" }]] })], /https/);
  bad([msg("x", "10:00", { buttons: [[{ text: "a" }]] })], /url или callback/);
  bad([msg("x", "10:00", { buttons: [[{ text: "a", callback: "я".repeat(33) }]] })], /длиннее 64 байт/);
  bad([msg("x", "10:00", { text: "Текст — с тире" })], /длинное тире/);
  bad([msg("x", "10:00", { text: "a < b" })], /лишний символ </);
  bad([msg("x", "10:00", { text: "Q&A" })], /голый &/);
  bad([msg("x", "10:00", { text: "<b>не закрыт" })], /не закрыт тег/);
  bad([msg("x", "10:00", { text: "<script>x</script>" })], /не поддерживает/);
  bad([msg("x", "10:00", { text: "<b>a</i>" })], /закрыт не там/);
  bad([msg("x", "10:00", { dayOffset: 9 })], /dayOffset/);
  bad([msg("x", "10:00")], /timezone/, { timezone: "UTC" });
  bad([msg("x", "10:00")], /firstDay/, { firstDay: "2026-13-40" });
  bad([msg("x", "10:00")], /skipDays/, { skipDays: ["завтра"] });
  bad([msg("x", "10:00")], /utcOffsetMinutes/, { utcOffsetMinutes: "5" });
  assert.throws(() => validateSeries({ ...rawSeries([msg("x", "10:00")]), links: { ...base.links, prepayKz: undefined } }), /links.prepayKz/);
  assert.throws(() => validateSeries({ ...rawSeries([msg("x", "10:00")]), welcome: { ...base.welcome, lateToday: "a — b" } }), /длинное тире/);
  // кнопки под приветствием (beforeButtons) проверяются так же, как кнопки сообщений; без них приветствие по-прежнему допустимо
  assert.throws(() => validateSeries({ ...rawSeries([msg("x", "10:00")]), welcome: { ...base.welcome, beforeButtons: [[{ text: "a" }]] } }), /welcome\.beforeButtons.*url или callback/);
  assert.throws(() => validateSeries({ ...rawSeries([msg("x", "10:00")]), welcome: { ...base.welcome, beforeButtons: [[{ text: "a", url: "http://plain.example" }]] } }), /https/);
  const { beforeButtons: _drop, ...welcomeNoButtons } = base.welcome;
  assert.doesNotThrow(() => validateSeries({ ...rawSeries([msg("x", "10:00")]), welcome: welcomeNoButtons }));
});

test("предупреждения: подпись с очень длинным именем больше 1024 будет разбита", () => {
  const sr = mkSeries([msg("long", "10:00", { text: "{hi} " + "я".repeat(960), media: { type: "photo", url: "https://onai.academy/x.jpg" } }), msg("ok", "10:00", { text: "коротко", media: { type: "photo", url: "https://onai.academy/y.jpg" } })]);
  const w = seriesWarnings(sr);
  assert.equal(w.length, 1);
  assert.match(w[0], /^long: подпись с длинным именем/);
  const ok = seriesWarnings(mkSeries([msg("a", "10:00")]));
  assert.deepEqual(ok.filter((x) => x.startsWith("a:")), []);
});

test("tg-series.json в репозитории: проходит проверку, нет длинного тире, ссылки оплаты разведены", () => {
  const raw = JSON.parse(readFileSync(seriesFile, "utf8"));
  const sr = validateSeries(raw);
  assert.ok(sr.messages.length > 0);
  assert.equal(sr.utcOffsetMinutes, 300);
  assert.equal(readFileSync(seriesFile, "utf8").includes("—"), false);
  for (const m of sr.messages) if (m.media) assert.match(m.media.url, /^https:\/\//);
  assert.equal("prepay" in sr.links, false);
  const warn = payWarning(sr);
  // лента v3.2 кнопки {PAY} («Оплатить всю сумму») не использует: тогда предупреждать не о чем,
  // а если кнопка {PAY} в серии появится при пустой links.pay, предупреждение обязано её назвать
  const usesPay = sr.messages.some((m) => m.enabled !== false && (m.buttons || []).some((row) => row.some((b) => b.url?.includes("{PAY}"))));
  assert.ok(sr.links.pay || !usesPay ? warn === "" : warn.includes("{PAY}"));
  assert.equal(warn.includes("PREPAY"), false);
  const withPay = validateSeries({ ...JSON.parse(readFileSync(seriesFile, "utf8")), links: { ...sr.links, pay: "" }, messages: [{ id: "p", at: "21:18", audience: "all", text: "x", buttons: [[{ text: "Оплатить", url: "{PAY}" }]] }] });
  assert.ok(payWarning(withPay).includes("{PAY}"), "кнопка {PAY} при пустой ссылке по-прежнему даёт предупреждение");
});

test("tg-series.json: воркшоп только про AI-монтаж, продаётся только Vibe Production (решение 08.10)", () => {
  const raw = JSON.parse(readFileSync(seriesFile, "utf8"));
  const sr = validateSeries(raw);
  const ids = sr.messages.map((m) => m.id);
  const byId = new Map(sr.messages.map((m) => [m.id, m]));
  // практики 2 и 3 и пакет двух курсов убраны
  for (const id of ["topic-p23", "offer-bundle-2145"]) assert.equal(ids.includes(id), false, id);
  // ни в текстах, ни в кнопках, ни в адресах картинок нет PRO, пакета, презентации по брифу, приложения из ТЗ, вайбкодинга
  const everything = JSON.stringify([raw.welcome, raw.messages]);
  const bad: RegExp[] = [
    /Vibe Coding/i, /\bPRO\b/, /(^|[^А-Яа-яЁё])ПРО([^А-Яа-яЁё]|$)/, /390 000/, /440 900/, /50 900/, /\$871/, /\$984/,
    /презентаци\S* по брифу/i, /приложени\S* из/i, /вайбкодинг/i, /практик\S* \d/i, /практик\S* из/i,
    /tg-dva/, /\/dva/, /Vibe-Coding-PRO/, /plus-PRO/, /offer-bundle/, /topic-p[23]/, /Три практики/i,
  ];
  for (const re of bad) assert.equal(re.test(everything), false, String(re));
  // имя менеджера нигде не пишем (Александр, 09.10): только «менеджер», он может смениться
  assert.equal(/Аян/.test(readFileSync(seriesFile, "utf8")), false, "в tg-series.json нет имени менеджера");
  assert.equal(raw.links.managerName, "менеджер");
  assert.equal(raw.welcome.other, "Этот бот не читает сообщения. Вопрос по эфиру, обучению или оплате? Напиши менеджеру: @futleid");
  assert.equal(raw.welcome.paidAck, "Спасибо! Больше не напоминаю про оплату. Пришли чек менеджеру @futleid: он проверит оплату и напишет, что дальше.");
  // PDF только один: презентация Vibe Production (файлом в 10:30 следующего дня)
  const decks = [...everything.matchAll(/assets\/decks\/[^"\\]+/g)].map((m) => m[0]);
  assert.ok(decks.length >= 1);
  for (const d of decks) assert.equal(d, "assets/decks/Vibe-Production.pdf", d);
  // в текстах только цены Vibe Production: 150 000, 250 000, 140 000 за игру, бронь 10 000 и рассрочка от 6 250
  for (const m of sr.messages) {
    for (const price of m.text.matchAll(/(\d{1,3}(?: \d{3})+) ₸/g)) {
      assert.ok(["150 000", "250 000", "140 000", "10 000", "6 250"].includes(price[1]), m.id + ": цена " + price[1]);
    }
  }
  // лента v3.3 (09.10): все карточки отдаются с новой версией в адресе, иначе бот пришлёт старую из кеша file_id
  assert.match(raw.welcome.media.url, /cover-bizon\.jpg\?v=0910a$/);
  const photos = sr.messages.filter((m) => m.media?.type === "photo");
  assert.ok(photos.length >= 15, "карточки есть почти у всех сообщений");
  // карточка 14:00 перерисована 09.10 (окно CapCut перечёркнуто), ей новая версия адреса 1009c; остальные 0910a
  for (const m of photos) {
    const ver = m.id === "warm-1400" ? "1009c" : "0910a";
    assert.match(m.media!.url, new RegExp("^https://onai\\.academy/workshop-montazh/assets/tg/[a-z0-9-]+\\.jpg\\?v=" + ver + "$"), m.id);
  }
  assert.equal(byId.get("warm-1400")!.media!.url, "https://onai.academy/workshop-montazh/assets/tg/warm-edits.jpg?v=1009c");
  // видео: прежний рилс 119K с прежними обложкой и размерами, рилс без лица в 16:00, остальные с размерами вертикального экрана
  assert.deepEqual(byId.get("warm-1200")!.media, {
    type: "video", url: "https://onai.academy/workshop-montazh/assets/tg/reel-119k.mp4", poster: "https://onai.academy/workshop-montazh/assets/tg/reel-119k.jpg", width: 720, height: 1280, duration: 68,
  });
  assert.deepEqual(byId.get("noface-1600")!.media, {
    type: "video", url: "https://onai.academy/workshop-montazh/assets/tg/noface-tokens.mp4?v=0910a", poster: "https://onai.academy/workshop-montazh/assets/tg/noface-tokens.jpg?v=0910a", width: 720, height: 1280, duration: 51,
  });
  assert.equal(byId.get("video-1730")!.media?.type, "video");
  // личное видео Александра 15:00 снято 09.10 (монтаж по рилсу «Одно слово в ссылке GitHub»): сообщение включено, видео 50 с
  assert.notEqual(byId.get("personal-1500")!.enabled, false);
  assert.match(String(byId.get("personal-1500")!.media?.url), /personal-1500\.mp4\?v=0909p$/);
  assert.equal(byId.get("personal-1500")!.media?.type, "video");
  // ни метки места под видео, ни пометок в квадратных скобках в начале текста для людей нет
  for (const m of sr.messages) assert.equal(/^\[/.test(m.text), false, m.id + ": метка [Видео ...] не идёт в подпись");
  // убранные из ленты сообщения
  for (const id of ["topic-p1", "topic-reel", "nudge-2030", "nudge-2050", "push-2130"]) assert.equal(byId.has(id), false, id);
  // шаблон для менеджера из оффера убран: ссылка на менеджера теперь кнопкой
  assert.equal(/\{TEMPLATE\}|<code>/.test(JSON.stringify(sr.messages)), false, "в сообщениях серии нет {TEMPLATE}");
  // аудитории: кнопка эфира и ссылка идут тем, кто ещё не перешёл; оффер и дожимы только тем, кто был на эфире и не оплатил
  for (const id of ["live-2000", "nudge-2010", "last-link-2015", "bonus-miss-2115", "next-day-1100", "replay-link-1950"]) assert.equal(byId.get(id)!.audience, "notClicked", id);
  for (const id of ["training-2058", "bonus-2115"]) assert.equal(byId.get(id)!.audience, "clicked", id);
  for (const id of ["offer-2118", "push-2230", "push-2330", "follow-1030", "follow-1500", "follow-2145"]) assert.equal(byId.get(id)!.audience, "clickedNotPaid", id);
  assert.equal(/₸/.test(raw.welcome.before), false, "в подтверждении записи цены нет");
  for (const m of sr.messages) {
    if (m.audience === "notClicked" || (m.dayOffset ?? 0) === 0 && m.at < "21:18") assert.equal(/₸/.test(m.text), false, m.id + ": цена до эфира или тем, кто не был на эфире");
  }
  assert.match(byId.get("next-day-1100")!.text, /Цену курса назову только участникам эфира\./);
  // подарок за покупку до конца дня из трёх частей назван целиком там, где его перечисляют (лента эфира 20:58, оффер, последний звонок, дожимы):
  // модуль 3 «AI-креатор», 6 месяцев доступа вместо 3 и модуль по рекламе через Claude с моим готовым AI-таргетологом
  for (const id of ["training-2058", "offer-2118", "push-2330", "follow-1030", "follow-2145"]) {
    const t = byId.get(id)!.text;
    assert.match(t, /AI-креатор/, id);
    assert.match(t, /6 месяцев доступа вместо 3/, id);
    assert.match(t, /модуль по рекламе через Claude с моим готовым AI-таргетологом/, id);
  }
  // бронь закрепляет цену и подарок: в оффере, рассрочке, последнем звонке и втором дожиме следующего дня
  assert.match(byId.get("offer-2118")!.text, /Как закрепить цену:/);
  assert.match(byId.get("offer-2118")!.text, /Бронь входит в цену\. Не подойдёт курс, бронь вернём\./);
  assert.match(byId.get("push-2230")!.text, /закрепит цену и весь подарок за покупку сегодня/);
  assert.match(byId.get("push-2330")!.text, /Закрепи всё бронью 10 000 ₸/);
  assert.match(byId.get("follow-1500")!.text, /весь подарок за покупку сегодня/);
  // расходы: нужна только Claude от $20 в месяц, прежнего «около $51 в месяц» нигде нет
  assert.match(byId.get("offer-2118")!.text, /Из подписок нужна только Claude, от \$20 в месяц\./);
  assert.equal(/\$51/.test(JSON.stringify([raw.welcome, raw.messages])), false, "«$51 в месяц» убрано");
  assert.equal(/Подписки на сервисы отдельно/.test(JSON.stringify(raw.messages)), false);
  // подпись оффера длиннее 1024 даже без имени: картинка и текст с кнопками идут двумя сообщениями (как бот делит длинное).
  // Остальные подписи, в том числе приветствие с самым длинным именем, влезают в 1024 и идут одним сообщением.
  assert.deepEqual(seriesWarnings(sr).map((w) => w.split(":")[0]), ["offer-2118"]);
  const offerLen = visibleLength(expandText(byId.get("offer-2118")!.text, ctxFor(sr)));
  assert.ok(offerLen > 1024 && offerLen < 4096, `оффер ${offerLen} знаков`);
});

test("tg-series.json: кнопки оплаты ведут прямо на бронь и менеджера, шаблона для менеджера нет (лента v3.3)", () => {
  const sr = validateSeries(JSON.parse(readFileSync(seriesFile, "utf8")));
  const byId = new Map(sr.messages.map((m) => [m.id, m]));
  const CHAT = "https://onai.academy/workshop-montazh/chat";
  const pay = [{ text: "Бронь через Kaspi", url: "{PREPAY_KZ}" }, { text: "Бронь из России и других стран", url: "{PREPAY_INTL}" }, { text: "Менеджер: рассрочка и вопросы", url: CHAT }];
  const paid = { text: "Я уже оплатил(а)", callback: "paid" };
  const flat = (id: string) => byId.get(id)!.buttons!.map((r) => r[0]);
  for (const id of ["offer-2118", "push-2330", "follow-1500", "follow-2145"]) assert.deepEqual(flat(id), [...pay, paid], id);
  // 10:30 следующего дня: картинка, а презентация кнопкой (Александр: картинка под каждым постом)
  assert.deepEqual(flat("follow-1030"), [{ text: "Скачать презентацию (PDF)", url: "https://onai.academy/workshop-montazh/assets/decks/Vibe-Production.pdf" }, ...pay, paid]);
  assert.deepEqual(flat("push-2230"), [...pay, { text: "Игра Token Runner", url: "{GAME}" }, paid]);
  // каждая кнопка в своём ряду, ни одна не выпадает из-за пустой ссылки
  for (const m of sr.messages) {
    if (!m.buttons) continue;
    assert.ok(m.buttons.every((r) => r.length === 1), `${m.id}: по одной кнопке в ряд`);
    assert.equal(buildKeyboard(m.buttons, ctxFor(sr))!.flat().length, m.buttons.flat().length, m.id);
  }
  // приветствие: бонусы за запись кнопками под текстом
  assert.deepEqual(sr.welcome.beforeButtons, [
    [{ text: "Забрать 30 хуков", url: "https://onai.academy/workshop-montazh/assets/bonus/30-hukov.pdf" }],
    [{ text: "Забрать карту референсов", url: "https://onai.academy/workshop-montazh/assets/bonus/karta-6-referensov.pdf" }],
  ]);
  // бонусы по слову ВАЙБ тем, кто смотрел по другой ссылке
  assert.deepEqual(flat("bonus-miss-2115").map((b) => b.text), ["Забрать в Telegram", "Забрать в WhatsApp"]);
});

test("tg-series.json: рилс 12:00 со ссылкой на пост, 14:00 про CapCut, чужих ссылок на рилсы нет (09.10)", () => {
  const raw = JSON.parse(readFileSync(seriesFile, "utf8"));
  const sr = validateSeries(raw);
  const byId = new Map(sr.messages.map((m) => [m.id, m]));
  const REEL = "https://www.instagram.com/p/Dc8YwYCt_E_/";
  // 12:00: счётчик 121 тысяча, прежнее видео, одна кнопка в своём ряду на пост рилса
  const w = byId.get("warm-1200")!;
  assert.ok(w.text.startsWith("Этот рилс набрал 121 тысячу просмотров. Монтировал его не человек, а ИИ-агент.\n\n"));
  assert.equal(/119 тысяч/.test(JSON.stringify(raw)), false, "старой цифры 119 тысяч нет");
  assert.equal(w.media?.type, "video");
  assert.deepEqual(w.buttons, [[{ text: "Смотреть рилс в Instagram", url: REEL }]]);
  assert.equal(buildKeyboard(w.buttons!, ctxFor(sr))!.flat().length, 1);
  // 14:00: CapCut не открывал, карточка с новой версией адреса
  const e = byId.get("warm-1400")!;
  assert.ok(e.text.startsWith("Я не открывал CapCut, чтобы смонтировать свои рилсы. Просто правил словами. Вот как это выглядит у меня.\n\n"));
  assert.ok(e.text.includes("«меня вообще не видно… подними меня выше»"));
  assert.equal(e.media?.url, "https://onai.academy/workshop-montazh/assets/tg/warm-edits.jpg?v=1009c");
  // ссылки на Instagram только из таблицы docs/mailings/reels-links-0910.md; в Telegram это кнопки, в тексте голых ссылок нет
  const known = new Set([REEL, "https://www.instagram.com/saint4ai/"]);
  const links = [...JSON.stringify([raw.welcome, raw.messages]).matchAll(/https:\/\/(?:www\.)?instagram\.com\/[^"\\\s]*/g)].map((x) => x[0]);
  assert.ok(links.includes(REEL) && links.includes("https://www.instagram.com/saint4ai/"), "в серии есть ссылка на рилс и на профиль");
  for (const u of links) assert.ok(known.has(u), "ссылка на Instagram не из таблицы: " + u);
  for (const m of sr.messages) assert.equal(/instagram\.com/.test(m.text), false, m.id + ": ссылка на Instagram идёт кнопкой, не текстом");
  // источник рассылок совпадает с лентой бота: те же тексты в Telegram, в WhatsApp тот же текст плюс строка со ссылкой на рилс
  const chain = JSON.parse(readFileSync(join(REPO, "docs", "mailings", "chain-v2.json"), "utf8"));
  const tg = new Map<string, any>(chain.telegram.map((m: any) => [m.id, m]));
  const wa = new Map<string, any>(chain.whatsapp.map((m: any) => [m.feed, m]));
  assert.equal(tg.get("warm-1200").text, w.text);
  assert.equal(tg.get("warm-1400").text, e.text);
  assert.deepEqual(tg.get("warm-1200").tgButtons, w.buttons);
  assert.equal(wa.get("edits-1400").text, e.text);
  const waReel: string = wa.get("reel-1200").text;
  const [first, ...rest] = w.text.split("\n\n");
  assert.equal(waReel, [first, "Рилс в Instagram: " + REEL, ...rest].join("\n\n"));
  for (const t of [waReel, wa.get("edits-1400").text, tg.get("warm-1200").text, tg.get("warm-1400").text]) {
    assert.equal(/—|Аян/.test(t), false);
  }
});

test("tg-series.json: файлы медиа включённых сообщений лежат в репозитории (карточки, которые ещё рисуются, перечислены)", () => {
  const sr = validateSeries(JSON.parse(readFileSync(seriesFile, "utf8")));
  // Карточки 09.10 дорисовывает второй исполнитель: пока файла нет, имя из серии обязано быть в этом списке.
  // Когда карточка появилась в workshop-montazh/assets/tg, её можно убрать отсюда (с ней тест тоже зелёный).
  const PENDING = new Set(["t-minus-30.jpg", "live-10.jpg", "bonus-got.jpg", "vaib.jpg", "installment.jpg", "again-today.jpg", "next-1030.jpg", "next-1500.jpg", "next-1950.jpg", "next-2145.jpg", "personal-1500.mp4", "personal-1500.jpg"]); // личное видео 15:00 лежит на сервере, в git его нет (файлы в рабочей папке воронки, не закоммичены)
  const missing: string[] = [];
  const check = (id: string, media?: { url: string; poster?: string }) => {
    for (const u of [media?.url, media?.poster]) {
      if (!u) continue;
      const rel = u.replace("https://onai.academy/", "").split("?")[0];
      if (!existsSync(join(REPO, rel)) && !PENDING.has(rel.split("/").pop() as string)) missing.push(`${id}: ${rel}`);
    }
  };
  check("welcome", sr.welcome.media);
  for (const m of sr.messages) if (m.enabled !== false) check(m.id, m.media);
  assert.deepEqual(missing, [], "файла нет в репозитории и в списке дорисовываемых");
});

test("tg-series.json: следующий день v3.3: дожим был-на-эфире-не-оплатил, зов и ссылка на повтор для не пришедших", () => {
  const raw = JSON.parse(readFileSync(seriesFile, "utf8"));
  const sr = validateSeries(raw);
  const byId = new Map(sr.messages.map((m) => [m.id, m]));
  const TG = "https://onai.academy/workshop-montazh/assets/tg/";
  const follow: Array<[string, string, unknown]> = [
    ["follow-1030", "10:30", { type: "photo", url: TG + "next-1030.jpg?v=0910a" }],
    ["follow-1500", "15:00", { type: "photo", url: TG + "next-1500.jpg?v=0910a" }],
    ["follow-2145", "21:45", { type: "photo", url: TG + "next-2145.jpg?v=0910a" }],
  ];
  for (const [id, at, media] of follow) {
    const m = byId.get(id)!;
    assert.ok(m, id);
    assert.equal(m.at, at);
    assert.equal(m.dayOffset, 1);
    assert.equal(m.audience, "clickedNotPaid");
    assert.notEqual(m.enabled, false);
    assert.deepEqual(m.media, media, id);
    const urls = m.buttons!.flat().map((b) => b.url).filter(Boolean) as string[];
    assert.ok(urls.includes("{PREPAY_KZ}"), `${id}: бронь через Kaspi`);
    assert.ok(urls.includes("{PREPAY_INTL}"), `${id}: бронь из России и других стран`);
    assert.ok(m.buttons!.flat().some((b) => b.callback === "paid"), `${id}: «Я уже оплатил(а)»`);
  }
  // подпись к файлу и к карточкам влезает в 1024 даже с самым длинным именем
  assert.deepEqual(seriesWarnings(sr).filter((w) => /^(follow-|next-|replay-)/.test(w)), []);
  // оба оффера действуют до 23:59 по Алматы следующего дня
  for (const id of ["follow-1030", "follow-2145"]) assert.match(byId.get(id)!.text, /23:59 по Алматы \(21:59 по Москве\)/);
  assert.match(byId.get("follow-1500")!.text, /до 23:59 сегодня/);

  // не пришедшим: 11:00 зов (без кнопки: ссылка придёт сама) и 19:50 ссылка на повтор
  const nd = byId.get("next-day-1100")!;
  assert.notEqual(nd.enabled, false);
  assert.equal(nd.audience, "notClicked");
  assert.equal(nd.dayOffset, 1);
  assert.equal(nd.at, "11:00");
  assert.equal(nd.buttons, undefined);
  assert.deepEqual(nd.media, { type: "photo", url: TG + "again-today.jpg?v=0910a" });
  assert.match(nd.text, /^Вчера не получилось попасть на эфир\? Сегодня в 20:00 по Алматы \(18:00 по Москве\) повтор\./);
  assert.match(nd.text, /Ссылка придёт сюда в 19:50\./);
  const rp = byId.get("replay-link-1950")!;
  assert.notEqual(rp.enabled, false);
  assert.equal(rp.audience, "notClicked");
  assert.equal(rp.dayOffset, 1);
  assert.equal(rp.at, "19:50");
  assert.deepEqual(rp.media, { type: "photo", url: TG + "next-1950.jpg?v=0910a" });
  assert.deepEqual(rp.buttons, [[{ text: "Открыть эфир", url: "{STREAM}" }]]);
  assert.match(rp.text, /^Через 10 минут повтор эфира «Вайб-продакшен»/);
});

// ───────────────────────── отправка: подпись, медиа, тишина, обход ошибок ─────────────────────────

test("подпись до 1024: одно сообщение; больше 1024: картинка отдельно, текст с кнопками следом", async () => {
  const { store } = boot();
  const sr = mkSeries([]);
  const media = { type: "photo" as const, url: "https://onai.academy/x/a.jpg" };
  const buttons = [[{ text: "Эфир", url: "{STREAM}" }]];
  const c = ctxFor(sr);

  let r = await sendContent({ media, text: "Короткий текст", buttons }, c);
  assert.equal(r.ok, true);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].method, "sendPhoto");
  assert.equal(fake.calls[0].body.caption, "Короткий текст");
  assert.equal(fake.calls[0].body.parse_mode, "HTML");
  assert.ok(fake.calls[0].body.reply_markup.inline_keyboard[0][0].url.includes("/api/go/"));
  assert.equal(store.getMedia(media.url), "p-big");
  fake.reset();
  await sendContent({ media, text: "Ещё раз", buttons }, c);
  assert.equal(fake.calls[0].body.photo, "p-big");

  fake.reset();
  const long = "я".repeat(1025);
  r = await sendContent({ media, text: long, buttons }, c);
  assert.equal(r.ok, true);
  assert.deepEqual(fake.calls.map((x) => x.method), ["sendPhoto", "sendMessage"]);
  assert.equal(fake.calls[0].body.caption, undefined);
  assert.equal(fake.calls[0].body.reply_markup, undefined);
  assert.equal(fake.calls[1].body.text, long);
  assert.equal(fake.calls[1].body.reply_markup.inline_keyboard[0][0].text, "Эфир");
  assert.deepEqual(fake.calls[1].body.link_preview_options, { is_disabled: true });
  fake.reset();
  await sendContent({ media, text: "я".repeat(1024) }, c);
  assert.deepEqual(fake.calls.map((x) => x.method), ["sendPhoto"]);
});

test("видео: supports_streaming и width, height, duration; обложка и file_id в кеше; silent даёт disable_notification", async () => {
  const { store } = boot();
  const sr = mkSeries([]);
  const media = { type: "video" as const, url: "https://onai.academy/x/r.mp4", poster: "https://onai.academy/x/r.jpg", width: 720, height: 1280, duration: 68 };
  await sendContent({ media, text: "Рилс", silent: true }, ctxFor(sr));
  const first = fake.calls[0];
  assert.equal(first.method, "sendVideo");
  assert.equal(first.body.video, media.url);
  assert.equal(first.body.cover, media.poster);
  assert.equal(first.body.supports_streaming, true);
  assert.equal(first.body.width, 720);
  assert.equal(first.body.height, 1280);
  assert.equal(first.body.duration, 68);
  assert.equal(first.body.disable_notification, true);
  assert.equal(store.getMedia(media.url), "v-1");
  assert.equal(store.getMedia(media.poster), "c-big");
  fake.reset();
  await sendContent({ media, text: "Рилс" }, ctxFor(sr));
  assert.equal(fake.calls[0].body.video, "v-1");
  assert.equal(fake.calls[0].body.cover, "c-big");
  assert.equal(fake.calls[0].body.disable_notification, undefined);
  fake.reset();
  await sendContent({ text: "Тихо", silent: true }, ctxFor(sr));
  assert.equal(fake.calls[0].body.disable_notification, true);
  assert.deepEqual(fake.calls[0].body.link_preview_options, { is_disabled: true });
  fake.reset();
  await sendContent({ media: { type: "photo", url: "https://onai.academy/x/b.jpg" }, text: "я".repeat(1100), silent: true }, ctxFor(sr));
  assert.deepEqual(fake.calls.map((x) => x.body.disable_notification), [true, true]);
});

test("протухший file_id (400): повтор по URL, новый file_id запоминается", async () => {
  const { store } = boot();
  const sr = mkSeries([]);
  const media = { type: "photo" as const, url: "https://onai.academy/x/old.jpg" };
  store.setMedia(media.url, "STALE");
  fake.respond = (method, body) => (method === "sendPhoto" && body.photo === "STALE" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: wrong file identifier" } } : null);
  const r = await sendContent({ media, text: "Текст" }, ctxFor(sr));
  assert.equal(r.ok, true);
  assert.deepEqual(fake.calls.map((c) => c.body.photo), ["STALE", media.url]);
  assert.equal(store.getMedia(media.url), "p-big");
});

test("медиа не ушло: тот же текст с кнопками обычным сообщением, владельцам одно предупреждение на медиа", async () => {
  boot();
  const sr = mkSeries([]);
  const media = { type: "photo" as const, url: "https://onai.academy/x/missing-1.jpg" };
  fake.respond = (method) => (method === "sendPhoto" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: failed to get HTTP URL content" } } : null);
  const buttons = [[{ text: "Эфир", url: "{STREAM}" }]];
  const r = await sendContent({ media, text: "Текст сообщения", buttons }, ctxFor(sr));
  assert.equal(r.ok, true);
  const mine = fake.of("sendMessage").filter((c) => c.body.chat_id === 4242);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].body.text, "Текст сообщения");
  assert.equal(mine[0].body.reply_markup.inline_keyboard[0][0].text, "Эфир");
  await waitFor(() => fake.texts(900).length >= 1 && fake.texts(901).length >= 1);
  assert.match(fake.texts(900)[0], /Не отправилась картинка или видео https:\/\/onai\.academy\/x\/missing-1\.jpg/);
  // тот же файл ещё раз: текст уходит, предупреждения нет
  await sendContent({ media, text: "Ещё" }, ctxFor(sr));
  await new Promise((r2) => setTimeout(r2, 150));
  assert.equal(fake.texts(900).length, 1);
  // человек заблокировал бота: второй отправки текстом нет
  fake.reset();
  fake.respond = () => ({ status: 403, json: { ok: false, error_code: 403, description: "Forbidden: bot was blocked by the user" } });
  const gone = await sendContent({ media: { type: "photo", url: "https://onai.academy/x/missing-2.jpg" }, text: "x" }, ctxFor(sr));
  assert.equal(gone.ok, false);
  assert.equal(fake.calls.length, 1);
});

test("документ (PDF): sendDocument с подписью и кнопками, file_id в кеше, длинная подпись делится как у фото", async () => {
  const { store } = boot();
  const sr = mkSeries([]);
  const media = { type: "document" as const, url: "https://onai.academy/x/deck.pdf" };
  const buttons = [[{ text: "Эфир", url: "{STREAM}" }], [{ text: "Я уже оплатил(а)", callback: "paid" }]];
  const c = ctxFor(sr);

  let r = await sendContent({ media, text: "Короткий текст", buttons, silent: true }, c);
  assert.equal(r.ok, true);
  assert.deepEqual(fake.calls.map((x) => x.method), ["sendDocument"]);
  const first = fake.calls[0].body;
  assert.equal(first.chat_id, 4242);
  assert.equal(first.document, media.url);
  assert.equal(first.caption, "Короткий текст");
  assert.equal(first.parse_mode, "HTML");
  assert.equal(first.disable_notification, true);
  assert.ok(first.reply_markup.inline_keyboard[0][0].url.includes("/api/go/"));
  assert.deepEqual(first.reply_markup.inline_keyboard[1], [{ text: "Я уже оплатил(а)", callback_data: "paid" }]);
  assert.equal(first.supports_streaming, undefined); // это не видео
  assert.equal(store.getMedia(media.url), "d-1");

  // второй раз файл уходит по file_id, без повторной загрузки по ссылке
  fake.reset();
  await sendContent({ media, text: "Ещё раз", buttons }, c);
  assert.equal(fake.calls[0].method, "sendDocument");
  assert.equal(fake.calls[0].body.document, "d-1");

  // протухший file_id (400): повтор по ссылке, новый file_id запоминается
  fake.reset();
  store.setMedia(media.url, "STALE");
  fake.respond = (method, body) => (method === "sendDocument" && body.document === "STALE" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: wrong file identifier" } } : null);
  r = await sendContent({ media, text: "Текст" }, c);
  assert.equal(r.ok, true);
  assert.deepEqual(fake.calls.map((x) => x.body.document), ["STALE", media.url]);
  assert.equal(store.getMedia(media.url), "d-1");

  // подпись длиннее 1024: файл отдельно, текст с кнопками следом; ровно 1024 влезает в подпись
  fake.reset();
  const long = "я".repeat(1025);
  r = await sendContent({ media, text: long, buttons }, c);
  assert.equal(r.ok, true);
  assert.deepEqual(fake.calls.map((x) => x.method), ["sendDocument", "sendMessage"]);
  assert.equal(fake.calls[0].body.caption, undefined);
  assert.equal(fake.calls[0].body.reply_markup, undefined);
  assert.equal(fake.calls[1].body.text, long);
  assert.equal(fake.calls[1].body.reply_markup.inline_keyboard[1][0].text, "Я уже оплатил(а)");
  fake.reset();
  await sendContent({ media, text: "я".repeat(1024) }, c);
  assert.deepEqual(fake.calls.map((x) => x.method), ["sendDocument"]);
});

test("документ не ушёл (Telegram не скачал файл): тот же текст с кнопками, mediaFallback, одно предупреждение про файл", async () => {
  boot();
  resetRuntime();
  const sr = mkSeries([]);
  const media = { type: "document" as const, url: "https://onai.academy/x/missing.pdf" };
  fake.respond = (method) => (method === "sendDocument" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: failed to get HTTP URL content" } } : null);
  const buttons = [[{ text: "Эфир", url: "{STREAM}" }], [{ text: "Я уже оплатил(а)", callback: "paid" }]];
  const r = await sendContent({ media, text: "Текст дожима", buttons }, ctxFor(sr));
  assert.equal(r.ok, true);
  const mine = fake.of("sendMessage").filter((c) => c.body.chat_id === 4242);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].body.text, "Текст дожима");
  assert.equal(mine[0].body.reply_markup.inline_keyboard[0][0].text, "Эфир");
  assert.deepEqual(mine[0].body.reply_markup.inline_keyboard[1], [{ text: "Я уже оплатил(а)", callback_data: "paid" }]);
  assert.equal(runtime.events.filter((e) => e.type === "mediaFallback").length, 1);
  assert.equal(runtime.events.find((e) => e.type === "mediaFallback")!.info, media.url);
  await waitFor(() => fake.texts(900).length >= 1 && fake.texts(901).length >= 1);
  assert.match(fake.texts(900)[0], /Не отправился файл https:\/\/onai\.academy\/x\/missing\.pdf/);
  // человек заблокировал бота: второй отправки текстом нет, в mediaFallback не считается
  fake.reset();
  fake.respond = () => ({ status: 403, json: { ok: false, error_code: 403, description: "Forbidden: bot was blocked by the user" } });
  const gone = await sendContent({ media: { type: "document", url: "https://onai.academy/x/missing-2.pdf" }, text: "x" }, ctxFor(sr));
  assert.equal(gone.ok, false);
  assert.equal(fake.calls.length, 1);
  assert.equal(runtime.events.filter((e) => e.type === "mediaFallback").length, 1);
});

test("media document: в серии только https и адрес на .pdf", () => {
  const withDoc = (url: unknown, type: string = "document") => () => mkSeries([msg("d", "10:00", { media: { type, url } })]);
  const good = "https://onai.academy/workshop-montazh/assets/decks/Vibe-Production.pdf";
  assert.equal(withDoc(good)().messages[0].media!.type, "document");
  assert.throws(withDoc("http://onai.academy/x/deck.pdf"), /media/);
  assert.throws(withDoc("https://onai.academy/x/deck.jpg"), /\.pdf/);
  assert.throws(withDoc("https://onai.academy/x/deck.pdf?v=2"), /\.pdf/);
  assert.throws(withDoc("https://onai.academy/x/deck.pdf.exe"), /\.pdf/);
  assert.throws(withDoc("https://onai.academy/x/deck"), /\.pdf/);
  assert.throws(withDoc(42), /media/);
  // фото с картинкой по-прежнему не обязано кончаться на .pdf, чужой тип не проходит
  assert.doesNotThrow(withDoc("https://onai.academy/x/a.jpg", "photo"));
  assert.throws(withDoc(good, "audio"), /media/);
});

test("сетевая ошибка: одна повторная попытка; 429: пауза и повтор", async () => {
  boot();
  const sr = mkSeries([]);
  let n = 0;
  fake.respond = (method) => (method === "sendMessage" && ++n === 1 ? { drop: true } : null);
  assert.equal((await sendContent({ text: "Привет" }, ctxFor(sr))).ok, true);
  assert.equal(fake.of("sendMessage").length, 2);

  fake.reset();
  n = 0;
  fake.respond = (method) => (method === "sendMessage" ? { drop: true } : null);
  const down = await sendContent({ text: "Привет" }, ctxFor(sr));
  assert.equal(down.ok, false);
  assert.equal(down.code, 0);
  assert.equal(fake.of("sendMessage").length, 2); // ровно одна повторная попытка

  fake.reset();
  n = 0;
  fake.respond = (method) => (method === "sendMessage" && ++n === 1 ? { status: 429, json: { ok: false, error_code: 429, description: "Too Many Requests", parameters: { retry_after: 0 } } } : null);
  assert.equal((await sendContent({ text: "Привет" }, ctxFor(sr))).ok, true);
  assert.equal(fake.of("sendMessage").length, 2);
});

test("общий ограничитель: интервал 50 мс, пауза всей очереди, приветствия обгоняют рассылку", async () => {
  await acquireSlot("hi"); // выравниваем окно
  const t0 = Date.now();
  await Promise.all([acquireSlot("hi"), acquireSlot("hi"), acquireSlot("hi"), acquireSlot("hi")]);
  assert.ok(Date.now() - t0 >= 4 * 45, `4 слота не быстрее ~200 мс, было ${Date.now() - t0}`);

  const order: string[] = [];
  await acquireSlot("hi");
  const all = [
    acquireSlot("lo").then(() => order.push("lo1")),
    acquireSlot("lo").then(() => order.push("lo2")),
    acquireSlot("lo").then(() => order.push("lo3")),
    acquireSlot("hi").then(() => order.push("hi")),
  ];
  await Promise.all(all);
  assert.equal(order[0], "hi");
  assert.deepEqual(order.slice(1), ["lo1", "lo2", "lo3"]);

  // пауза (как после 429) держит и «hi», и «lo»
  await acquireSlot("hi");
  pauseAll(0.2);
  const t1 = Date.now();
  await Promise.all([acquireSlot("hi"), acquireSlot("lo")]);
  assert.ok(Date.now() - t1 >= 400, `пауза держит очередь, было ${Date.now() - t1}`);
});

// ───────────────────────── доставка и планировщик ─────────────────────────

function fakeDeps(over: Partial<Deps> = {}) {
  let t = alm(2026, 10, 6, 19, 50);
  const sent: number[] = [];
  const deps: Deps = {
    now: () => t,
    send: async (s) => {
      sent.push(s.chatId);
      return { ok: true };
    },
    ...over,
  };
  return { deps, sent, setNow: (v: number) => void (t = v) };
}

test("deliver: запись в tg-sent сразу после ответа, без повторов, 403 и chat not found дают blocked, ошибка без ретрая", async () => {
  const { store } = boot();
  const m = { id: "d1", at: "19:50", audience: "all" as const, text: "x" };
  for (const id of [10, 11, 12, 13, 14]) sub(store, id, D, alm(2026, 10, 6, 10, 0));
  const calls: Record<number, number> = {};
  const f = fakeDeps({
    send: async (s) => {
      calls[s.chatId] = (calls[s.chatId] || 0) + 1;
      if (s.chatId === 11) return { ok: false, code: 403, error: "403 Forbidden: bot was blocked by the user" };
      if (s.chatId === 12) return { ok: false, code: 400, error: "400 Bad Request: chat not found" };
      if (s.chatId === 14) return { ok: false, code: 400, error: "400 Bad Request: something else" };
      return { ok: true };
    },
  });
  const rc = pickRecipients(store, m, D, { plan: alm(2026, 10, 6, 19, 50) });
  const st = await deliver(store, m, D, rc, {}, f.deps);
  assert.deepEqual(st, { ok: 2, failed: 3, blocked: 1, netFail: 0, skippedLate: 0 });
  assert.equal(store.subs.get(11)!.blocked, true);
  assert.equal(store.subs.get(12)!.blocked, true);   // чат не найден: тоже недоступен
  assert.equal(store.subs.get(14)!.blocked, false);
  assert.deepEqual(pickRecipients(store, m, D, { plan: alm(2026, 10, 6, 19, 50) }), []);
  assert.deepEqual(calls, { 10: 1, 11: 1, 12: 1, 13: 1, 14: 1 });
  const lines = readFileSync(join(store.dir, "tg-sent.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(lines.map((l) => l.ok), [true, false, false, true, false]);
  assert.match(lines[1].err, /403/);
  assert.equal(lines[0].msg, "d1");
  assert.equal(lines[0].day, D);
});

test("deliver: сетевые сбои считаются отдельно; после дедлайна окна оставшимся не шлём (skip late)", async () => {
  const { store } = boot();
  const m = { id: "d2", at: "19:50", audience: "all" as const, text: "x" };
  for (const id of [20, 21, 22]) sub(store, id, D, alm(2026, 10, 6, 10, 0));
  const plan = alm(2026, 10, 6, 19, 50);
  const f = fakeDeps({
    send: async () => {
      f.setNow(plan + 13 * 60_000);
      return { ok: true };
    },
  });
  const st = await deliver(store, m, D, pickRecipients(store, m, D, { plan }), { deadline: plan + 12 * 60_000 }, f.deps);
  assert.equal(st.ok, 1);
  assert.equal(st.skippedLate, 2);
  assert.equal(store.hasSent("d2", D, 21), false);
  const net = await deliver(store, m, D, pickRecipients(store, m, D, { plan }), {}, fakeDeps({ send: async () => ({ ok: false, code: 0, error: "0 timeout" }) }).deps);
  assert.equal(net.netFail, 2);
});

test("tick: выключенная серия не шлёт; включённая шлёт в окне; второй тик не стартует, пока идёт первый", async () => {
  const { store } = boot([msg("t1", "19:50"), msg("t2", "20:00", { audience: "notClicked" })]);
  sub(store, 30, D, alm(2026, 10, 6, 10, 0));
  sub(store, 31, D, alm(2026, 10, 6, 10, 0));
  store.recordClick(31, D, iso(alm(2026, 10, 6, 19, 51)));
  const f = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 6, 19, 55), f.deps), 0);
  assert.deepEqual(f.sent, []);
  store.setSeriesEnabled(true);
  assert.equal(await tick(alm(2026, 10, 6, 20, 40), f.deps), 0);
  assert.equal(await tick(alm(2026, 10, 6, 19, 55), f.deps), 2);
  assert.deepEqual(f.sent, [30, 31]);
  f.sent.length = 0;
  assert.equal(await tick(alm(2026, 10, 6, 20, 1), f.deps), 1);
  assert.deepEqual(f.sent, [30]);

  const { store: s2 } = boot([msg("t3", "19:50")]);
  sub(s2, 40, D, alm(2026, 10, 6, 10, 0));
  s2.setSeriesEnabled(true);
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => (release = r));
  const slow = fakeDeps({ send: async () => (await gate, { ok: true }) });
  const first = tick(alm(2026, 10, 6, 19, 55), slow.deps);
  await new Promise((r) => setImmediate(r));
  assert.equal(await tick(alm(2026, 10, 6, 19, 55), slow.deps), 0);
  release();
  assert.equal(await first, 1);
});

test("tick: вчерашний день эфира получает сообщение с dayOffset 1", async () => {
  const { store } = boot([msg("nd", "11:00", { dayOffset: 1, audience: "notClicked" })]);
  sub(store, 33, D, alm(2026, 10, 6, 10, 0));
  sub(store, 34, "2026-10-07", alm(2026, 10, 6, 10, 0)); // записан на сегодняшний эфир: не получает
  store.setSeriesEnabled(true);
  const f = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 7, 11, 5), f.deps), 1);
  assert.deepEqual(f.sent, [33]);
});

test("tick: дожим следующего дня идёт только кликнувшим неоплатившим; перешедшему по rejoin на сегодня вчерашний дожим не уходит", async () => {
  const { store } = boot([msg("f1", "10:30", { dayOffset: 1, audience: "clickedNotPaid" })]);
  const reg = alm(2026, 10, 6, 10, 0);
  for (const c of [70, 71, 72, 73, 74]) sub(store, c, D, reg);
  for (const c of [70, 71, 73, 74]) store.recordClick(c, D, iso(alm(2026, 10, 6, 20, 5)));
  store.recordEvent({ type: "paid", chat_id: 71, by: "self", ts: iso(alm(2026, 10, 6, 21, 30)) });   // был и оплатил
  // 72 клика не делал: на эфир не заходил
  store.recordEvent({ type: "rejoin", chat_id: 73, streamDay: "2026-10-07", ts: iso(alm(2026, 10, 7, 9, 0)) }); // был, но утром перешёл на сегодня
  store.recordEvent({ type: "blocked", chat_id: 74, ts: iso(alm(2026, 10, 7, 9, 30)) });              // был, но заблокировал бота
  store.setSeriesEnabled(true);
  const f = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 6, 10, 35), f.deps), 0);  // в сам день эфира дожима нет
  assert.equal(await tick(alm(2026, 10, 7, 10, 20), f.deps), 0);  // до окна
  assert.equal(await tick(alm(2026, 10, 7, 10, 35), f.deps), 1);
  assert.deepEqual(f.sent, [70]);
  assert.equal(await tick(alm(2026, 10, 7, 10, 36), f.deps), 0);  // повтора нет
  assert.equal(store.hasSent("f1", D, 70), true);
  assert.equal(store.hasSent("f1", D, 73), false);
  // выключенная серия дожим не шлёт: он не essential
  const { store: off } = boot([msg("f1", "10:30", { dayOffset: 1, audience: "clickedNotPaid" })]);
  sub(off, 70, D, reg);
  off.recordClick(70, D, iso(alm(2026, 10, 6, 20, 5)));
  const f2 = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 7, 10, 35), f2.deps), 0);
  assert.deepEqual(f2.sent, []);
});

test("серия из репозитория, следующий день: дожим только был-на-эфире-не-оплатил, зов в 11:00 и ссылка на повтор в 19:50 не пришедшим", async () => {
  const { store } = boot(base.messages);
  const reg = alm(2026, 10, 6, 10, 0);
  sub(store, 80, D, reg);   // записан, на эфир не пришёл, повтор откроет
  sub(store, 83, D, reg);   // записан, на эфир не пришёл, повтор не откроет
  sub(store, 81, D, reg);   // был на эфире, не оплатил
  sub(store, 82, D, reg);   // был на эфире, оплатил
  store.recordClick(81, D, iso(alm(2026, 10, 6, 20, 5)));
  store.recordClick(82, D, iso(alm(2026, 10, 6, 20, 5)));
  store.recordEvent({ type: "paid", chat_id: 82, by: "self", ts: iso(alm(2026, 10, 6, 21, 30)) });
  store.setSeriesEnabled(true);

  const log: string[] = [];
  const f = fakeDeps({
    send: async (s, m, day) => {
      log.push(`${m.id}@${day}:${s.chatId}`);
      // настоящая отправка (подставной Telegram): так видно файл, кнопки и ссылку эфира
      return sendContent({ media: m.media, text: m.text, buttons: m.buttons, silent: m.silent }, { series: activeSeries(), now: f.deps.now(), chatId: s.chatId, firstName: s.firstName, day }, { prio: "lo" });
    },
  });
  const run = async (now: number) => {
    f.setNow(now);
    return tick(now, f.deps);
  };
  const only = (re: RegExp) => log.filter((x) => re.test(x));
  const caption = (c: Call) => String(c.body.caption ?? c.body.text);
  const keys = (c: Call) => (c.body.reply_markup.inline_keyboard as Array<Array<{ text: string; url?: string }>>).map((r) => r[0]);

  // 10:30 следующего дня: карточка и презентация кнопкой тому, кто был на эфире и не оплатил
  assert.equal(await run(alm(2026, 10, 7, 10, 35)), 1);
  assert.deepEqual(log, [`follow-1030@${D}:81`]);
  const doc = fake.of("sendPhoto").filter((c) => String(c.body.photo).includes("next-1030.jpg"));
  assert.equal(doc.length, 1);
  assert.equal(doc[0].body.chat_id, 81);
  assert.equal(fake.of("sendDocument").length, 0, "PDF файлом больше не шлём");
  assert.match(String(doc[0].body.caption), /^Вчерашний эфир в одной презентации, и условия для участников ещё на день\./);
  assert.deepEqual(keys(doc[0]).map((b) => b.text), ["Скачать презентацию (PDF)", "Бронь через Kaspi", "Бронь из России и других стран", "Менеджер: рассрочка и вопросы", "Я уже оплатил(а)"]);
  assert.equal(keys(doc[0])[0].url, "https://onai.academy/workshop-montazh/assets/decks/Vibe-Production.pdf");
  assert.equal(keys(doc[0])[1].url, base.links.prepayKz);
  assert.equal(keys(doc[0])[2].url, base.links.prepayIntl);
  assert.equal(keys(doc[0])[3].url, "https://onai.academy/workshop-montazh/chat");

  // 11:00: пропустившим приходит зов на повтор (картинка с подписью, кнопок нет), был на эфире не получает
  log.length = 0;
  fake.reset();
  assert.equal(await run(alm(2026, 10, 7, 11, 5)), 2);
  assert.deepEqual(only(/next-day/), [`next-day-1100@${D}:80`, `next-day-1100@${D}:83`]);
  const calls = fake.of("sendPhoto").filter((c) => c.body.chat_id === 80);
  assert.equal(calls.length, 1);
  assert.match(caption(calls[0]), /^Вчера не получилось попасть на эфир\? Сегодня в 20:00 по Алматы \(18:00 по Москве\) повтор\./);
  assert.equal(calls[0].body.reply_markup, undefined);

  // 15:00: второй дожим только тому, кто был (вчерашний, для D)
  log.length = 0;
  fake.reset();
  assert.equal(await run(alm(2026, 10, 7, 15, 5)), 1);
  assert.deepEqual(only(/follow/), [`follow-1500@${D}:81`]);
  assert.equal(fake.of("sendDocument").length, 0, "второй дожим без файла: PDF ушёл в 10:30");
  const second = fake.of("sendPhoto").find((c) => c.body.chat_id === 81)!;
  assert.match(caption(second), /^Монтировать не нужно\. Лицо показывать не нужно\./);
  assert.equal(second.body.photo, "https://onai.academy/workshop-montazh/assets/tg/next-1500.jpg?v=0910a");
  assert.deepEqual(keys(second).map((b) => b.text), ["Бронь через Kaspi", "Бронь из России и других стран", "Менеджер: рассрочка и вопросы", "Я уже оплатил(а)"]);

  // 19:50 следующего дня: ссылка на повтор уходит всем, кто на вчерашний эфир не пришёл, и только им; ссылка ведёт на день D
  log.length = 0;
  fake.reset();
  assert.equal(await run(alm(2026, 10, 7, 19, 55)), 2);
  assert.deepEqual(only(/link-1950/), [`replay-link-1950@${D}:80`, `replay-link-1950@${D}:83`]);
  const replay = fake.of("sendPhoto").find((c) => c.body.chat_id === 80)!;
  assert.match(caption(replay), /^Через 10 минут повтор эфира «Вайб-продакшен»/);
  assert.equal(replay.body.photo, "https://onai.academy/workshop-montazh/assets/tg/next-1950.jpg?v=0910a");
  assert.deepEqual(keys(replay).map((b) => b.text), ["Открыть эфир"]);
  assert.deepEqual(verifyGoToken(keys(replay)[0].url!.split("/").pop()!), { chatId: 80, day: D });
  assert.equal(fake.of("sendPhoto").some((c) => c.body.chat_id === 81 || c.body.chat_id === 82), false, "был на эфире ссылку на повтор не получает");
  // тик в 19:56 ничего не дублирует
  assert.equal(await run(alm(2026, 10, 7, 19, 56)), 0);

  // он открывает повтор: переход по ссылке (handleGo) записывает клик за день D, и вечером он получает последний дожим как «был на эфире»
  store.recordClick(80, D, iso(alm(2026, 10, 7, 20, 2)));

  // 21:45: последний дожим вчерашнего дня: у кого есть клик за D и нет оплаты (81 и открывший повтор 80)
  log.length = 0;
  await run(alm(2026, 10, 7, 21, 45));
  assert.deepEqual(only(/follow/), [`follow-2145@${D}:80`, `follow-2145@${D}:81`]);
  // оплатившему, а также пропустившему и повтор не открывшему вчерашний дожим не шёл ни разу
  for (const id of ["follow-1030", "follow-1500", "follow-2145"]) {
    assert.equal(store.hasSent(id, D, 82), false, `${id} для оплатившего`);
    assert.equal(store.hasSent(id, D, 83), false, `${id} для не открывшего повтор`);
  }
  for (const id of ["follow-1030", "follow-1500"]) assert.equal(store.hasSent(id, D, 80), false, `${id} до клика по повтору`);

  // /series показывает аудиторию понятной подписью
  assert.match(buildSeriesText(store, activeSeries(), alm(2026, 10, 7, 22, 0)), /follow-2145 \(были на эфире, не оплатили\)/);
  assert.match(buildSeriesText(store, activeSeries(), alm(2026, 10, 7, 22, 0)), /replay-link-1950 \(не нажавшим\)/);
});

test("tick: tg-sent загружен до первого тика, повторный запуск на тех же данных ничего не дублирует", async () => {
  const { store, dir, seriesPath } = boot([msg("r1", "19:50")]);
  sub(store, 35, D, alm(2026, 10, 6, 10, 0));
  store.setSeriesEnabled(true);
  const f1 = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 6, 19, 55), f1.deps), 1);
  // «рестарт процесса»: данные читаются заново
  initTgWorkshop({ dir, seriesFile: seriesPath });
  const f2 = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 6, 19, 56), f2.deps), 0);
  assert.deepEqual(f2.sent, []);
});

test("lock-файл: второй процесс на тех же данных не шлёт; мёртвый или протухший замок забирается", async () => {
  const { store, dir } = boot([msg("l1", "19:50")]);
  sub(store, 36, D, alm(2026, 10, 6, 10, 0));
  store.setSeriesEnabled(true);
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 30000)"], { stdio: "ignore" });
  try {
    const lock = join(dir, "scheduler.lock");
    writeFileSync(lock, JSON.stringify({ pid: child.pid, ts: Date.now() }));
    const f = fakeDeps();
    assert.equal(holdLock(store), false);
    assert.equal(await tick(alm(2026, 10, 6, 19, 55), f.deps), 0);
    assert.deepEqual(f.sent, []);
    // отметка протухла (процесс завис или pid переиспользован): замок забираем
    writeFileSync(lock, JSON.stringify({ pid: child.pid, ts: Date.now() - 10 * 60_000 }));
    assert.equal(holdLock(store), true);
    assert.equal((JSON.parse(readFileSync(lock, "utf8")) as { pid: number }).pid, process.pid);
    // живой чужой процесс со свежей отметкой снова держит замок, потом умирает
    writeFileSync(lock, JSON.stringify({ pid: child.pid, ts: Date.now() }));
    assert.equal(await tick(alm(2026, 10, 6, 19, 55), f.deps), 0);
    const exited = new Promise((r) => child.once("exit", r));
    child.kill();
    await exited;
    assert.equal(await tick(alm(2026, 10, 6, 19, 56), f.deps), 1);
    assert.deepEqual(f.sent, [36]);
    releaseLock(store);
    assert.equal(existsSync(lock), false);
  } finally {
    child.kill();
  }
});

test("tick: три тика с работой и сбоем сети подряд дают одно предупреждение владельцам", async () => {
  const { store } = boot([msg("e1", "19:50"), msg("e2", "20:00"), msg("e3", "20:10"), msg("e4", "20:20")]);
  sub(store, 37, D, alm(2026, 10, 6, 10, 0));
  store.setSeriesEnabled(true);
  const down = fakeDeps({ send: async () => ({ ok: false, code: 0, error: "0 timeout" }) });
  await tick(alm(2026, 10, 6, 19, 55), down.deps);
  await tick(alm(2026, 10, 6, 19, 56), down.deps); // пустой тик серию не обнуляет
  await tick(alm(2026, 10, 6, 20, 5), down.deps);
  assert.equal(fake.texts(900).length, 0);
  await tick(alm(2026, 10, 6, 20, 15), down.deps);
  await waitFor(() => fake.texts(900).length === 1 && fake.texts(901).length === 1);
  assert.match(fake.texts(900)[0], /Планировщик серии: 3 тика подряд с ошибкой/);
  await tick(alm(2026, 10, 6, 20, 25), down.deps);
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(fake.texts(900).length, 1);
});

// ───────────────────────── вебхук и приветствие ─────────────────────────

async function startWebhook() {
  const server = createServer((req, res) => void handleTgWorkshop(req, res));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { server, url: `http://127.0.0.1:${(server.address() as { port: number }).port}/api/tg-workshop` };
}

test("вебхук: секрет, лимит 64 КБ (больше: 200 и выбрасываем), 200 сразу, дубли update_id, мусор", async () => {
  const { store } = boot();
  const { server, url } = await startWebhook();
  const secret = process.env.TG_WORKSHOP_WEBHOOK_SECRET!;
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
  const auth = { "x-telegram-bot-api-secret-token": secret };
  try {
    const u = { update_id: 424242, message: { chat: { id: 80, type: "private" }, from: { id: 80, first_name: "Оля" }, text: "/start site" } };
    assert.equal((await post(u)).status, 401);
    assert.equal((await post(u, { "x-telegram-bot-api-secret-token": "wrong" })).status, 401);
    assert.equal(store.subs.size, 0);
    // слишком большое тело: 200 и выброшено
    const huge = { ...u, update_id: 424243, message: { ...u.message, text: "/start " + "x".repeat(70_000) } };
    assert.equal((await post(huge, auth)).status, 200);
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(store.subs.size, 0);
    // тело чуть меньше 64 КБ принимается
    const ok = await post(u, auth);
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { ok: true });
    await waitFor(() => fake.calls.length > 0);
    assert.equal(store.subs.get(80)!.payload, "site");
    // На /start бот в вечернее окно эфира шлёт два сообщения (приветствие и «эфир идёт»): даём второму дойти, иначе счёт зависит от времени суток.
    await new Promise((r) => setTimeout(r, 300));
    const callsAfterFirst = fake.calls.length;
    // тот же update_id ещё раз (Telegram повторил доставку): не обрабатывается
    assert.equal((await post(u, auth)).status, 200);
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(fake.calls.length, callsAfterFirst);
    assert.equal((await post("не json", auth)).status, 200);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test("приветствие: до эфира, во время окна, после окна при идущем эфире (lateToday), после конца", async () => {
  const { store } = boot();
  const text = (c: Call) => String(c.body.caption ?? c.body.text);

  // 12:00: картинка, эфир сегодня, под текстом кнопки бонусов за запись
  await processUpdate(upd(81, "/start"), alm(2026, 10, 6, 12, 0));
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].method, "sendPhoto");
  assert.equal(fake.calls[0].body.photo, base.welcome.media.url);
  assert.match(text(fake.calls[0]), /^Привет, Аня! /);
  assert.match(text(fake.calls[0]), /на бесплатный эфир «Вайб-продакшен»: сегодня в 20:00 по Алматы \(18:00 по Москве\)\./);
  assert.deepEqual(fake.calls[0].body.reply_markup.inline_keyboard.map((r: any[]) => r[0].text), ["Забрать 30 хуков", "Забрать карту референсов"]);
  assert.equal(store.subs.get(81)!.streamDay, D);

  // 20:30 внутри окна 40 минут: сегодняшний эфир идёт, welcome.live с кнопкой
  fake.reset();
  await processUpdate(upd(82, "/start"), alm(2026, 10, 6, 20, 30));
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].method, "sendMessage");
  assert.equal(store.subs.get(82)!.streamDay, D);
  const liveBtn = (fake.calls[0].body as any).reply_markup.inline_keyboard[0][0] as { url: string };
  assert.deepEqual(verifyGoToken(liveBtn.url.split("/").pop() as string), { chatId: 82, day: D });
  assert.match(text(fake.calls[0]), /уже идёт/);

  // 20:50: окно закрыто, но эфир идёт: день завтра, обычное приветствие и отдельное сообщение lateToday
  fake.reset();
  await processUpdate(upd(83, "/start"), alm(2026, 10, 6, 20, 50));
  assert.equal(store.subs.get(83)!.streamDay, "2026-10-07");
  assert.deepEqual(fake.calls.map((c) => c.method), ["sendPhoto", "sendMessage"]);
  assert.match(text(fake.calls[0]), /на бесплатный эфир «Вайб-продакшен»: завтра в 20:00 по Алматы/);
  assert.equal(fake.calls[0].body.reply_markup.inline_keyboard.length, 2, "бонусы за запись кнопками");
  assert.equal(fake.calls[1].body.text, base.welcome.lateToday);
  const late = fake.calls[1].body.reply_markup.inline_keyboard[0][0];
  assert.equal(late.text, "Открыть эфир");
  assert.deepEqual(verifyGoToken(late.url.split("/").pop() as string), { chatId: 83, day: D }); // ссылка на сегодняшний эфир

  // 21:30: эфир закончился, только приветствие на завтра
  fake.reset();
  await processUpdate(upd(84, "/start"), alm(2026, 10, 6, 21, 30));
  assert.equal(store.subs.get(84)!.streamDay, "2026-10-07");
  assert.deepEqual(fake.calls.map((c) => c.method), ["sendPhoto"]);

  // человек записан на сегодня и жмёт /start в середине эфира: день прежний, live
  fake.reset();
  await processUpdate(upd(81, "/start"), alm(2026, 10, 6, 20, 55));
  assert.equal(store.subs.get(81)!.streamDay, D);
  assert.deepEqual(fake.calls.map((c) => c.method), ["sendMessage"]);
});

test("firstDay: до запуска /start записывает на первый день эфира", async () => {
  const { store } = boot([msg("a", "10:00")], { firstDay: "2026-10-07", skipDays: ["2026-10-09"] });
  await processUpdate(upd(85, "/start"), alm(2026, 10, 6, 12, 0));
  assert.equal(store.subs.get(85)!.streamDay, "2026-10-07");
  assert.match(String(fake.calls[0].body.caption), /на бесплатный эфир «Вайб-продакшен»: завтра в 20:00 по Алматы/);
  fake.reset();
  await processUpdate(upd(86, "/start"), alm(2026, 10, 8, 21, 0));
  assert.equal(store.subs.get(86)!.streamDay, "2026-10-10"); // 9 октября пропущено
  assert.match(String(fake.calls[0].body.caption), /на бесплатный эфир «Вайб-продакшен»: 10 октября в 20:00 по Алматы/);
  // /calendar идёт по тому же правилу
  assert.equal(calendarDay(alm(2026, 10, 8, 21, 0)), "2026-10-10");
  assert.equal(calendarDay(alm(2026, 10, 8, 20, 39)), "2026-10-08");
  assert.equal(calendarDay(alm(2026, 10, 8, 20, 40)), "2026-10-10");
  assert.equal(calendarDay(alm(2026, 10, 1, 12, 0)), "2026-10-07");
});

test("приветствие: бот заблокирован сразу после /start (403) помечает blocked", async () => {
  const { store } = boot();
  fake.respond = () => ({ status: 403, json: { ok: false, error_code: 403, description: "Forbidden: bot was blocked by the user" } });
  await processUpdate(upd(87, "/start"), alm(2026, 10, 6, 12, 10));
  assert.equal(store.subs.get(87)!.blocked, true);
});

test("welcome.other: раз в 10 минут на человека, во время эфира вместо него welcome.live с кнопкой", async () => {
  boot();
  const now = alm(2026, 10, 6, 11, 0);
  await processUpdate(upd(555, "привет"), now);
  await processUpdate(upd(555, "а ещё"), now + 9 * 60_000);
  assert.equal(fake.texts(555).length, 1);
  assert.equal(fake.texts(555)[0], base.welcome.other);
  await processUpdate(upd(555, "и ещё"), now + 10 * 60_000);
  assert.equal(fake.texts(555).length, 2);
  // во время эфира
  fake.reset();
  await processUpdate(upd(556, "эй"), alm(2026, 10, 6, 20, 30));
  assert.equal(fake.texts(556).length, 1);
  assert.match(fake.texts(556)[0], /уже идёт/);
  assert.deepEqual(verifyGoToken(fake.of("sendMessage")[0].body.reply_markup.inline_keyboard[0][0].url.split("/").pop() as string), { chatId: 556, day: D });
});

test("TG_BOT=off и ошибка серии: бот выключен, процесс живёт, переход в эфир и приём кликов работают", async () => {
  const dir = tmp();
  process.env.TG_BOT = "off";
  try {
    initTgWorkshop({ dir, seriesFile: join(dir, "нет-такого.json") });
    assert.equal(tgHealth().configured, false);
    assert.equal(tgHealth().error, "off");
  } finally {
    delete process.env.TG_BOT;
  }
  // файла нет
  const s1 = initTgWorkshop({ dir: tmp(), seriesFile: join(dir, "нет-такого.json") });
  assert.equal(s1.subs.size, 0);
  assert.equal(tgHealth().configured, false);
  assert.match(String(tgHealth().error), /ENOENT|no such file/i);
  // файл битый
  const broken = join(dir, "broken.json");
  writeFileSync(broken, JSON.stringify({ ...rawSeries([msg("a", "10:00"), msg("a", "11:00")]) }));
  initTgWorkshop({ dir: tmp(), seriesFile: broken });
  assert.equal(tgHealth().configured, false);
  assert.match(String(tgHealth().error), /повторяется/);
  // апдейты при выключенном боте игнорируются, вебхук всё равно отвечает 200
  const { server, url } = await startWebhook();
  try {
    const r = await fetch(url, { method: "POST", headers: { "x-telegram-bot-api-secret-token": process.env.TG_WORKSHOP_WEBHOOK_SECRET!, "content-type": "application/json" }, body: JSON.stringify(upd(88, "/start")) });
    assert.equal(r.status, 200);
    await new Promise((r2) => setTimeout(r2, 150));
    assert.equal(fake.calls.length, 0);
    assert.equal(getStore().subs.size, 0);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
  // переход в эфир: без серии берётся запасная ссылка, клик не пишется
  const go = createServer((req, res) => handleGo(req, res, (req.url || "").replace("/api/go/", "")));
  await new Promise<void>((r) => go.listen(0, "127.0.0.1", r));
  try {
    const port = (go.address() as { port: number }).port;
    const resp = await fetch(`http://127.0.0.1:${port}/api/go/${makeGoToken(5, D)}`, { redirect: "manual" });
    assert.equal(resp.status, 302);
    assert.match(String(resp.headers.get("location")), /^https:\/\/start\.bizon365\.ru\//);
    assert.equal(getStore().hasClick(5, D), false);
  } finally {
    await new Promise<void>((r) => go.close(() => r()));
  }
  assert.throws(() => getSeries(), /серия не загружена/);
});

// ───────────────────────── команды владельцев ─────────────────────────

test("команды владельцев: чужим молчание, обычный текст получает ответ, пустой список владельцев не пускает никого", async () => {
  const { store } = boot([msg("c1", "12:00"), msg("c2", "14:00", { audience: "notPaid" })]);
  const now = alm(2026, 10, 6, 11, 0);
  sub(store, 5, D, alm(2026, 10, 6, 9, 0), { payload: "ty", username: "Sasha" });
  sub(store, 6, D, alm(2026, 10, 6, 9, 0), { payload: "ty" });
  for (const c of ["/stats", "/series_on", "/series", "/paid 5", "/at c1 13:00", "/off c1", "/on c1", "/bizon https://x.bizon365.ru/a", "/fire c1", "/reload", "/preview"]) {
    await processUpdate(upd(555, c), now);
  }
  assert.equal(fake.calls.length, 0);
  assert.equal(store.state.seriesEnabled, false);
  assert.deepEqual(store.state.overrides, {});

  await processUpdate(upd(900, "/series_on"), now);
  assert.equal(store.state.seriesEnabled, true);
  await processUpdate(upd(900, "/series"), now);
  assert.match(fake.texts(900)[1], /12:00 c1 \(все\): отправлено 0 из 2/);
  assert.match(fake.texts(900)[1], /14:00 c2 \(не оплатившим\)/);
  await processUpdate(upd(900, "/paid @sasha"), now);
  assert.equal(store.subs.get(5)!.paid, true);
  fake.reset();
  await processUpdate(upd(900, "/paid 999"), now);
  assert.match(fake.texts(900)[0], /Не нашёл/);
  await processUpdate(upd(901, "/stats@workshop_aiprod_bot"), now);
  assert.equal(fake.texts(901).length, 1);
  assert.match(buildStatsText(getStore(), activeSeries(), now), /Оплатили \(всего\): 1/);
  assert.match(buildSeriesText(getStore(), activeSeries(), now), /отправлено 0 из 2/);

  // пустой TG_LINK_OWNER_IDS: никто не владелец
  const saved = process.env.TG_LINK_OWNER_IDS;
  process.env.TG_LINK_OWNER_IDS = "";
  fake.reset();
  await processUpdate(upd(900, "/stats"), now);
  assert.equal(fake.calls.length, 0);
  process.env.TG_LINK_OWNER_IDS = saved;
});

test("/at, /off, /on: правки расписания в state, итоговое расписание в /series, переживают /reload", async () => {
  const { store } = boot([msg("f1", "12:00"), msg("f2", "14:00")]);
  const now = alm(2026, 10, 6, 11, 0);
  const say = async (t: string) => {
    fake.reset();
    await processUpdate(upd(900, t), now);
    return fake.texts(900)[0];
  };
  assert.match(await say("/at f1 20:55"), /Время «f1» теперь 20:55 \(в json 12:00\)/);
  assert.match(await say("/at f1 9:05"), /теперь 09:05/);
  assert.match(await say("/at f1 25:00"), /Время вида HH:MM/);
  assert.match(await say("/at nope 10:00"), /Формат/);
  assert.match(await say("/at f1"), /Формат/);
  assert.match(await say("/off f2"), /«f2» выключено/);
  assert.deepEqual(store.state.overrides, { f1: { at: "09:05" }, f2: { enabled: false } });
  const sr = activeSeries();
  assert.equal(sr.messages.find((m) => m.id === "f1")!.at, "09:05");
  assert.equal(sr.messages.find((m) => m.id === "f2")!.enabled, false);
  assert.equal(getSeries().messages.find((m) => m.id === "f1")!.at, "12:00"); // json не тронут
  const list = await say("/series");
  assert.match(list, /09:05 f1 \(все\) \[время изменено, в json 12:00\]/);
  assert.match(list, /14:00 f2 \(все\) \[выключено\]/);
  // планировщик берёт итоговое расписание
  assert.deepEqual(dueMessages(activeSeries(), alm(2026, 10, 6, 9, 10)).map((d) => d.msg.id), ["f1"]);
  assert.deepEqual(dueMessages(activeSeries(), alm(2026, 10, 6, 14, 5)).map((d) => d.msg.id), []);
  // /reload правки не сбрасывает
  assert.match(await say("/reload"), /Серия перечитана/);
  assert.equal(activeSeries().messages.find((m) => m.id === "f1")!.at, "09:05");
  assert.match(await say("/on f2"), /«f2» включено/);
  assert.match(await say("/at f1 reset"), /вернул как в json: 12:00/);
  assert.deepEqual(store.state.overrides, { f2: { enabled: true } });
  assert.equal(applyOverrides(getSeries(), { f1: { at: "01:02" } }).messages[0].at, "01:02");
});

test("/bizon: только https://*.bizon365.ru, ссылка в state, переход берёт её в момент клика", async () => {
  const { store } = boot();
  const say = async (t: string) => {
    fake.reset();
    await processUpdate(upd(900, t), alm(2026, 10, 6, 11, 0));
    return fake.texts(900)[0];
  };
  assert.match(await say("/bizon"), /Ссылка эфира сейчас: https:\/\/start\.bizon365\.ru\/room\/196985\//);
  for (const bad of ["http://start.bizon365.ru/room/1", "https://evil.example/room/1", "https://bizon365.ru.evil.example/x", "https://start.bizon365.ru", "не ссылка"]) {
    assert.match(await say(`/bizon ${bad}`), /Нужна ссылка вида/);
  }
  assert.equal(store.state.bizon, "");
  assert.match(await say("/bizon https://start.bizon365.ru/room/777/zzz"), /Ссылка эфира обновлена/);
  assert.equal(store.state.bizon, "https://start.bizon365.ru/room/777/zzz");
  assert.equal(currentBizon(), "https://start.bizon365.ru/room/777/zzz");
});

test("/series_on: предупреждение о пустой ссылке {PAY} (ссылки предоплаты не в счёт), серия включается в любом случае", async () => {
  const withPay = [msg("p1", "21:18", { buttons: [[{ text: "Оплатить", url: "{PAY}" }], [{ text: "Kaspi", url: "{PREPAY_KZ}" }]] }), msg("p2", "21:30", { buttons: [[{ text: "Оплатить", url: "{PAY}" }]] })];
  const { store } = boot(withPay, {}, { pay: "", prepayKz: "", prepayIntl: "" });
  await processUpdate(upd(900, "/series_on"), alm(2026, 10, 6, 11, 0));
  const t = fake.texts(900)[0];
  assert.equal(store.state.seriesEnabled, true);
  assert.match(t, /^Серия включена\./);
  assert.match(t, /links\.pay пуст, кнопки \{PAY\} выпадут в сообщениях: p1, p2/);
  assert.equal(t.includes("PREPAY"), false);
  // ссылка задана: предупреждения нет
  const { store: s2 } = boot(withPay, {}, { pay: "https://pay.example/x" });
  fake.reset();
  await processUpdate(upd(900, "/series_on"), alm(2026, 10, 6, 11, 0));
  assert.equal(fake.texts(900)[0], "Серия включена. Сообщения уходят по расписанию.");
  assert.equal(s2.state.seriesEnabled, true);
  assert.equal(payWarning(mkSeries([msg("z", "10:00")], {}, { pay: "" })), "");
});

test("/reload: сначала проверка, при ошибке старая серия остаётся; предупреждения про длинные подписи", async () => {
  const { seriesPath } = boot([msg("r1", "12:00")]);
  const say = async (t: string) => {
    fake.reset();
    await processUpdate(upd(900, t), alm(2026, 10, 6, 11, 0));
    return fake.texts(900)[0];
  };
  const ver = getSeries().version;
  writeFileSync(seriesPath, JSON.stringify(rawSeries([msg("r1", "12:00"), msg("r1", "13:00")], { version: "bad" })));
  assert.match(await say("/reload"), /Не принял серию, работаю на прежней: серия: id «r1» повторяется/);
  assert.equal(getSeries().version, ver);
  writeFileSync(seriesPath, JSON.stringify(rawSeries([msg("r1", "12:00", { text: "Тире — тут" })], { version: "bad2" })));
  assert.match(await say("/reload"), /длинное тире/);
  assert.equal(getSeries().version, ver);
  writeFileSync(seriesPath, "{не json");
  assert.match(await say("/reload"), /Не принял серию/);
  writeFileSync(seriesPath, JSON.stringify(rawSeries([msg("r1", "12:00"), msg("r2", "13:00", { text: "{hi} " + "я".repeat(960), media: { type: "photo", url: "https://onai.academy/x/long.jpg" } })], { version: "good" })));
  const ok = await say("/reload");
  assert.match(ok, /Серия перечитана: версия good, сообщений 2\./);
  assert.match(ok, /r2: подпись с длинным именем/);
  assert.equal(getSeries().version, "good");
});

test("/fire: сначала превью и число получателей, рассылка только по кнопке «Отправить» от владельца", async () => {
  const { store } = boot([msg("f1", "21:03", { text: "Что сейчас на эфире", buttons: [[{ text: "Смотреть", url: "{STREAM}" }]] }), msg("f2", "21:10", { enabled: false })]);
  sub(store, 70, D, alm(2026, 10, 6, 12, 0));
  sub(store, 71, D, alm(2026, 10, 6, 20, 30)); // записан позже планового: при /fire тоже получает
  const now = alm(2026, 10, 6, 20, 55);
  const say = async (t: string) => {
    fake.reset();
    await processUpdate(upd(900, t), now);
    return fake.texts(900).at(-1)!;
  };
  assert.match(await say("/fire"), /Укажи id/);
  assert.match(await say("/fire нет-такого"), /Нет сообщения/);
  assert.match(await say("/fire f1"), /Серия выключена/);
  store.setSeriesEnabled(true);
  assert.match(await say("/fire f2"), /выключено/);

  // шаг 1: владелец видит сообщение как получатель и кнопку подтверждения, людям ничего не ушло
  fake.reset();
  await processUpdate(upd(900, "/fire f1"), now);
  assert.deepEqual(fake.texts(900), ["Что сейчас на эфире", "Получателей: 2. Отправить «f1» сейчас?"]);
  assert.deepEqual(fake.of("sendMessage")[1].body.reply_markup.inline_keyboard, [[{ text: "Отправить", callback_data: "fire:f1" }]]);
  assert.deepEqual([...fake.texts(70), ...fake.texts(71)], []);
  assert.equal(store.hasSent("f1", D, 70), false);

  // нажатие чужого человека ничего не запускает, но кнопка закрывается
  fake.reset();
  await processUpdate(cb(555, "fire:f1"), now);
  assert.equal(fake.of("answerCallbackQuery").length, 1);
  assert.equal(fake.texts(70).length + fake.texts(71).length, 0);
  assert.equal(store.hasSent("f1", D, 70), false);

  // шаг 2: владелец нажимает «Отправить»
  fake.reset();
  await processUpdate(cb(900, "fire:f1"), now);
  assert.deepEqual(fake.texts(70), ["Что сейчас на эфире"]);
  assert.deepEqual(fake.texts(71), ["Что сейчас на эфире"]);
  assert.equal(fake.of("editMessageReplyMarkup").length, 1);
  assert.match(fake.texts(900).at(-1)!, /«f1» отправлено: 2, ошибок: 0/);
  assert.equal(store.hasSent("f1", D, 70), true);
  // повтор: некому, и плановая отправка 21:03 ничего не шлёт
  assert.match(await say("/fire f1"), /Некому отправлять/);
  const f = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 6, 21, 4), f.deps), 0);
});

test("/preview: все сообщения серии владельцу по порядку, пустая оплата показана кнопкой менеджера", async () => {
  boot([msg("v1", "12:00"), msg("v2", "13:00", { buttons: [[{ text: "Оплатить", url: "{PAY}" }]] })], {}, { pay: "" });
  await processUpdate(upd(900, "/preview"), alm(2026, 10, 6, 11, 0));
  await waitFor(() => fake.texts(900).length >= 4, 8000);
  const texts = fake.texts(900);
  assert.match(texts[0], /Предпросмотр серии: 2 сообщений/);
  assert.equal(texts[1], "Текст v1");
  assert.equal(texts[2], "Текст v2");
  assert.equal(fake.of("sendMessage")[2].body.reply_markup.inline_keyboard[0][0].url, base.links.manager);
  assert.equal(texts[3], "Предпросмотр закончен.");
});

// ───────────────────────── обязательные сообщения (essential) ─────────────────────────

test("essential: при выключенной серии идут только обязательные сообщения, окно, аудитория и журнал как у обычных", async () => {
  const { store } = boot([
    msg("link", "19:50", { essential: true }),
    msg("live", "20:00", { essential: true, audience: "notClicked" }),
    msg("topic", "20:05"),
  ]);
  sub(store, 90, D, alm(2026, 10, 6, 10, 0));
  sub(store, 91, D, alm(2026, 10, 6, 10, 0));
  sub(store, 92, D, alm(2026, 10, 6, 19, 58)); // записался после 19:50: ссылку «link» не догоняем
  store.recordClick(91, D, iso(alm(2026, 10, 6, 19, 51)));
  assert.equal(store.state.seriesEnabled, false);
  const f = fakeDeps();
  const ids: string[] = [];
  f.deps.send = async (s, m) => (f.sent.push(s.chatId), ids.push(`${m.id}:${s.chatId}`), { ok: true });
  // окно link: оба старых подписчика получают, поздний нет
  assert.equal(await tick(alm(2026, 10, 6, 19, 55), f.deps), 2);
  assert.deepEqual(ids, ["link:90", "link:91"]);
  // 20:01: live (notClicked) только тем, кто не нажимал; topic без essential молчит
  ids.length = 0;
  assert.equal(await tick(alm(2026, 10, 6, 20, 1), f.deps), 2);
  assert.deepEqual(ids, ["live:90", "live:92"]);
  assert.equal(await tick(alm(2026, 10, 6, 20, 6), f.deps), 0); // topic не essential
  // журнал отправленных ведётся, повтор не шлёт
  assert.equal(store.hasSent("link", D, 90), true);
  assert.equal(await tick(alm(2026, 10, 6, 19, 56), f.deps), 0);
  // серия включена: topic тоже идёт
  store.setSeriesEnabled(true);
  ids.length = 0;
  assert.equal(await tick(alm(2026, 10, 6, 20, 6), f.deps), 3);
  assert.deepEqual(ids.sort(), ["topic:90", "topic:91", "topic:92"]);
});

test("essential: проверка поля в /reload, строка в /series; без обязательных сообщений серия выключена и ничего не идёт", async () => {
  const { seriesPath, store } = boot([msg("a", "19:50"), msg("b", "20:00", { essential: true })]);
  sub(store, 93, D, alm(2026, 10, 6, 10, 0));
  const say = async (t: string) => {
    fake.reset();
    await processUpdate(upd(900, t), alm(2026, 10, 6, 11, 0));
    return fake.texts(900)[0];
  };
  const list = await say("/series");
  assert.match(list, /20:00 b \(все\) \[обязательное, идёт без \/series_on\]: отправлено 0 из 1/);
  assert.doesNotMatch(list.split("\n").find((l) => l.startsWith("19:50 a")) ?? "", /обязательное/);
  // /reload отвергает не-булево значение и оставляет прежнюю серию
  const ver = getSeries().version;
  writeFileSync(seriesPath, JSON.stringify(rawSeries([msg("a", "19:50", { essential: "да" })], { version: "bad-essential" })));
  assert.match(await say("/reload"), /Не принял серию, работаю на прежней: .*essential должен быть true или false/);
  assert.equal(getSeries().version, ver);
  writeFileSync(seriesPath, JSON.stringify(rawSeries([msg("a", "19:50", { essential: true })], { version: "ok-essential" })));
  assert.match(await say("/reload"), /Серия перечитана: версия ok-essential/);
  // без обязательных сообщений тик при выключенной серии ничего не делает
  const { store: s2 } = boot([msg("a", "19:50")]);
  sub(s2, 94, D, alm(2026, 10, 6, 10, 0));
  const f = fakeDeps();
  assert.equal(await tick(alm(2026, 10, 6, 19, 55), f.deps), 0);
  assert.deepEqual(f.sent, []);
});

test("tg-series.json: essential у ссылки, старта и бонусов принимается проверкой", () => {
  const sr = validateSeries(JSON.parse(readFileSync(seriesFile, "utf8")));
  const essential = sr.messages.filter((m) => m.essential).map((m) => m.id);
  assert.deepEqual(essential, ["link-1950", "live-2000", "bonus-2115"]);
});

// ───────────────────────── таймаут медиа ─────────────────────────

test("медиа по URL: таймаут (по умолчанию 60 с) без повторов, после таймаута уходит только текст; обычный вызов по-прежнему 10 с", async () => {
  boot();
  const sr = mkSeries([]);
  process.env.TG_MEDIA_TIMEOUT_MS = "300";
  try {
    const media = { type: "video" as const, url: "https://onai.academy/x/slow.mp4", poster: "https://onai.academy/x/slow.jpg" };
    // Telegram «качает» дольше таймаута: sendVideo уходит ровно один раз (иначе видео на 13 МБ ушло бы дважды)
    fake.respond = (method) => (method === "sendVideo" ? { delay: 1500, json: { ok: true, result: { video: { file_id: "late" } } } } : null);
    const t0 = Date.now();
    const r = await sendContent({ media, text: "Подпись" }, ctxFor(sr));
    assert.ok(Date.now() - t0 < 1400, "таймаут сработал раньше ответа");
    assert.equal(fake.of("sendVideo").length, 1);
    assert.equal(fake.of("sendMessage").filter((c) => c.body.chat_id === 4242).length, 1); // текстовая замена
    assert.equal(r.ok, true);
    assert.equal(getStore().getMedia(media.url), undefined);
  } finally {
    delete process.env.TG_MEDIA_TIMEOUT_MS;
  }
  // сброс сокета по ходу запроса (не отказ соединения): медиа тоже не повторяется
  fake.reset();
  fake.respond = (method) => (method === "sendPhoto" ? { drop: true } : null);
  await sendContent({ media: { type: "photo", url: "https://onai.academy/x/drop.jpg" }, text: "Т" }, ctxFor(sr));
  assert.equal(fake.of("sendPhoto").length, 1);
  // а обычный текст при сбросе сокета, как раньше, повторяется один раз
  await new Promise((r) => setTimeout(r, 300)); // предупреждения владельцам о медиа уже ушли
  fake.reset();
  fake.respond = (method) => (method === "sendMessage" ? { drop: true } : null);
  await sendContent({ text: "Привет" }, ctxFor(sr));
  assert.equal(fake.of("sendMessage").filter((c) => c.body.chat_id === 4242).length, 2);
  // по file_id (быстрый вызов) таймаут обычный: 60 с применяются только к URL
  assert.equal(Number(process.env.TG_MEDIA_TIMEOUT_MS) || 60_000, 60_000);
});

test("отказ соединения помечен connectFail (его можно повторять), таймаут и сброс сокета нет", async () => {
  const closed = createServer();
  await new Promise<void>((r) => closed.listen(0, "127.0.0.1", r));
  const port = (closed.address() as { port: number }).port;
  await new Promise<void>((r) => closed.close(() => r()));
  const saved = process.env.TG_API_BASE;
  process.env.TG_API_BASE = `http://127.0.0.1:${port}`;
  try {
    const refused = await botCall("sendMessage", { chat_id: 1, text: "x" }, 2000);
    assert.equal(refused.ok, false);
    assert.equal(!refused.ok && refused.code, 0);
    assert.equal(!refused.ok && refused.connectFail, true);
  } finally {
    process.env.TG_API_BASE = saved;
  }
  fake.respond = () => ({ delay: 1000, json: { ok: true, result: true } });
  const slow = await botCall("sendMessage", { chat_id: 1, text: "x" }, 150);
  assert.equal(!slow.ok && slow.description, "timeout");
  assert.equal(!slow.ok && slow.connectFail, undefined);
  fake.respond = () => ({ drop: true });
  const dropped = await botCall("sendMessage", { chat_id: 1, text: "x" }, 2000);
  assert.equal(!dropped.ok && dropped.connectFail, undefined);
});

// ───────────────────────── клики со страницы «Спасибо» ─────────────────────────

test("POST /api/ty-click: text/plain и форма, ch=tg|wa, eid необязателен, всегда 204", async () => {
  const { store } = boot();
  const server = createServer((req, res) => void handleTyClick(req, res));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/ty-click`;
  const today = dayKeyOf(Date.now());
  try {
    const eid = "0b7f1c2e-4d2a-4b7e-9f10-aaaaaaaaaaaa";
    const post = (body: string, type: string) => fetch(url, { method: "POST", headers: { "Content-Type": type }, body });
    const r1 = await post(`ch=tg&eid=${eid}`, "text/plain;charset=UTF-8");
    assert.equal(r1.status, 204);
    assert.equal(await r1.text(), "");
    assert.equal((await post(`ch=tg&eid=${eid}`, "application/x-www-form-urlencoded")).status, 204); // тот же посетитель
    assert.equal((await post("ch=wa", "text/plain")).status, 204);
    assert.equal((await post(JSON.stringify({ ch: "wa", eid: "ffff-1" }), "application/json")).status, 204);
    assert.equal((await post("ch=sms&eid=1", "text/plain")).status, 204); // неизвестный канал: 204, но не пишем
    assert.equal((await post("мусор", "text/plain")).status, 204);
    assert.equal((await post("ch=tg&" + "x".repeat(5000), "text/plain")).status, 204); // слишком большое тело
    await waitFor(() => store.tyCount(today, "wa") === 2);
    assert.equal(store.tyCount(today, "tg"), 1);
    const lines = readFileSync(join(store.dir, "ty-clicks.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.deepEqual(lines.map((l) => l.ch), ["tg", "tg", "wa", "wa"]);
    assert.equal(lines[0].eid, eid);
    assert.equal(lines[2].eid, "");
    // клики видны в /stats
    await processUpdate(upd(900, "/stats"), Date.now());
    assert.match(fake.texts(900)[0], /Сегодня на странице «Спасибо» нажали Telegram: 1, WhatsApp: 2/);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
  assert.deepEqual(parseTyBody("ch=tg&eid=bad id!"), { ch: "tg", eid: "" });
  assert.equal(parseTyBody("ch=xx"), null);
});

test("/api/ty-click: потолок 5000 записей в сутки (дальше 204 без записи), множество дублей сбрасывается раз в сутки", async () => {
  const { store, dir } = boot();
  const today = dayKeyOf(Date.now());
  for (let i = 0; i < TY_DAILY_CAP; i++) assert.equal(store.recordTyClick(i % 2 ? "tg" : "wa", `e-${i}`, today, iso(Date.now())), true);
  assert.equal(store.recordTyClick("tg", "e-over", today, iso(Date.now())), false);
  assert.equal(store.tyCount(today, "tg") + store.tyCount(today, "wa"), TY_DAILY_CAP);
  const linesBefore = readFileSync(join(dir, "ty-clicks.jsonl"), "utf8").trim().split("\n").length;
  assert.equal(linesBefore, TY_DAILY_CAP);
  // по HTTP: 204 и ничего не записано
  const server = createServer((req, res) => void handleTyClick(req, res));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/ty-click`;
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: "ch=tg&eid=late-1" });
    assert.equal(r.status, 204);
    await new Promise((r2) => setTimeout(r2, 100));
    assert.equal(readFileSync(join(dir, "ty-clicks.jsonl"), "utf8").trim().split("\n").length, TY_DAILY_CAP);
    assert.equal(store.tyCount(today, "tg") + store.tyCount(today, "wa"), TY_DAILY_CAP);
  } finally {
    await new Promise<void>((r2) => server.close(() => r2()));
  }
  // потолок на сутки: новый день снова принимает
  assert.equal(store.recordTyClick("tg", "next-1", addDays(today, 1), iso(Date.now())), true);
  // множество дублей хранит только текущий день
  assert.equal(store.tyKeySize(), 1);
  const s2 = boot().store;
  s2.recordTyClick("tg", "a", "2026-10-06", iso(Date.now()));
  s2.recordTyClick("tg", "b", "2026-10-06", iso(Date.now()));
  assert.equal(s2.tyKeySize(), 2);
  s2.recordTyClick("tg", "a", "2026-10-07", iso(Date.now()));
  assert.equal(s2.tyKeySize(), 1);
  s2.recordTyClick("tg", "a", "2026-10-07", iso(Date.now())); // дубль внутри дня по-прежнему не считается
  assert.equal(s2.tyCount("2026-10-07", "tg"), 1);
  assert.equal(s2.tyCount("2026-10-06", "tg"), 2);
  // после рестарта счётчик суток и множество восстанавливаются из файла
  const again = new TgStore(s2.dir);
  assert.equal(again.tyKeySize(), 1);
  assert.equal(again.recordTyClick("tg", "x", "2026-10-07", iso(Date.now())), true);
});

test("/health: блок tgBot без секретов", () => {
  boot();
  const h = tgHealth();
  assert.deepEqual(Object.keys(h).sort(), ["configured", "seriesEnabled", "subscribers"]);
  assert.equal(h.configured, true);
  const saved = process.env.TG_GO_SECRET;
  delete process.env.TG_GO_SECRET;
  assert.equal(tgHealth().configured, false); // без ключа ссылок перехода бот не настроен
  process.env.TG_GO_SECRET = saved;
  assert.equal(JSON.stringify(tgHealth()).includes("TESTTOKEN"), false);
});

test("atTime, streamStart и dayWord согласованы со смещением из серии", () => {
  assert.equal(atTime(D, "20:00"), streamStart(D, CFG));
  assert.equal(atTime("2026-10-07", "00:00"), alm(2026, 10, 7, 0, 0));
});

// ───────────────────────── админка: аналитика, меню, ежедневный отчёт ─────────────────────────

test.beforeEach(() => {
  resetAdminCache();
  resetRuntime();
  delete process.env.LEADS_LOG_PATH;
});

const SECRET_NAME = "Секретное Имя";
const SECRET_PHONE = "+77011112233";

type LeadSpec = { id: string; iso: string; eventId?: string; source?: string; utm?: Record<string, string> };
const leadRow = (l: LeadSpec) => ({ kind: "capture", id: l.id, eventId: l.eventId, name: SECRET_NAME, phone: SECRET_PHONE, source: l.source ?? "efir-1-okt-hero", utm: l.utm, ts: l.iso });

/** Журнал заявок во временной папке: LEADS_LOG_PATH указывает на него. */
function writeLeads(dir: string, rows: unknown[]): string {
  const f = join(dir, "leads.jsonl");
  writeFileSync(f, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  process.env.LEADS_LOG_PATH = f;
  return f;
}

const NOW = alm(2026, 10, 7, 18, 0);
const TODAY = "2026-10-07";

/** Набор данных: 7 заявок (1 вчера, 6 сегодня), подписчики с метками pp, ty, 2gis, прямой, клики и рассылка. */
function adminScenario() {
  const { store, dir } = boot([msg("warm-1200", "12:00")]);
  const utmIg = { utm_source: "Instagram", utm_medium: "paid_social", utm_campaign: "efir_0710" };
  writeLeads(dir, [
    leadRow({ id: "l1", iso: "2026-10-06T18:59:59.000Z", eventId: "E0", source: "efir-1-okt-dock", utm: utmIg }), // 23:59:59 вчера по Алматы
    leadRow({ id: "l2", iso: "2026-10-06T19:00:00.000Z", eventId: "E1", source: "efir-1-okt-hero", utm: utmIg }), // 00:00:00 сегодня
    leadRow({ id: "l2", iso: "2026-10-06T19:00:00.000Z", eventId: "E1", source: "efir-1-okt-hero", utm: utmIg }), // дубль
    { kind: "supabase_insert_failed", id: "l2", reason: "no_config", ts: "2026-10-06T19:00:01.000Z" },
    leadRow({ id: "l3", iso: "2026-10-07T05:00:00.000Z", eventId: "E2", source: "efir-1-okt-popup", utm: { utm_source: "saint4aibio" } }),
    leadRow({ id: "l4", iso: "2026-10-07T06:00:00.000Z", eventId: "E3", source: "efir-1-okt-hero", utm: { utm_referrer: "https://l.instagram.com/?u=x" } }),
    leadRow({ id: "l5", iso: "2026-10-07T07:00:00.000Z", eventId: "E4", source: "efir-1-okt-dock", utm: { utm_referrer: "instagram.com" } }),
    leadRow({ id: "l6", iso: "2026-10-07T07:30:00.000Z", eventId: "E5", source: "efir-1-okt-header" }),
    leadRow({ id: "l7", iso: "2026-10-07T08:00:00.000Z", eventId: "E6", source: "efir-1-okt-final", utm: { gclid: "abc" } }),
  ]);
  const at = (h: number, m = 0) => alm(2026, 10, 7, h, m);
  sub(store, 5551234501, TODAY, at(6), { payload: "pp_E1", first: SECRET_NAME });
  sub(store, 5551234502, TODAY, at(7), { payload: "ty_E2" });
  sub(store, 5551234503, TODAY, at(8), { payload: "2gis" });
  sub(store, 5551234504, TODAY, at(9), { payload: "2gis_card" });
  sub(store, 5551234505, TODAY, at(10), { payload: "" });
  sub(store, 5551234506, TODAY, at(11), { payload: "pp" });
  sub(store, 5551234507, TODAY, at(12), { payload: "ty_unknownEid" });
  sub(store, 5551234508, "2026-10-06", alm(2026, 10, 6, 20, 0), { payload: "pp_E0" }); // вчера
  store.recordTyClick("tg", "E1", TODAY, iso(at(7)), "pp");
  store.recordTyClick("tg", "E2", TODAY, iso(at(8)), "ty");
  store.recordTyClick("wa", "E1", TODAY, iso(at(9)), "pp");
  store.recordClick(5551234501, TODAY, iso(at(17)));
  store.recordEvent({ type: "paid", chat_id: 5551234501, by: "self", ts: iso(at(17, 30)) });
  for (const c of [1, 2, 3]) store.recordSent({ msg: "warm-1200", day: TODAY, chat_id: 5551234500 + c, ts: iso(at(12, 1)), ok: true });
  store.recordSent({ msg: "warm-1200", day: TODAY, chat_id: 5551234504, ts: iso(at(12, 1)), ok: false, err: "403 Forbidden: bot was blocked by the user" });
  store.recordSent({ msg: "link-1950", day: TODAY, chat_id: 5551234505, ts: iso(at(17, 50)), ok: false, err: "400 Bad Request: chat not found" });
  store.recordEvent({ type: "blocked", chat_id: 5551234504, ts: iso(at(12, 1)) });
  return { store, dir };
}

test("периоды: границы дней по Алматы (23:59:59 и 00:00:00), сегодня, вчера, 7 и 30 дней, дата, весь период", () => {
  adminScenario();
  const ctx = adminCtx(NOW);
  const today = renderReport(ctx, "t");
  const yest = renderReport(ctx, "y");
  assert.match(today, /^<b>Сегодня, 7 октября<\/b>/);
  assert.match(today, /<b>Заявки с сайта: 6<\/b>/);        // 00:00:00 вчера по UTC, 7 октября по Алматы
  assert.match(yest, /^<b>Вчера, 6 октября<\/b>/);
  assert.match(yest, /<b>Заявки с сайта: 1<\/b>/);         // 23:59:59 6 октября по Алматы
  assert.match(renderReport(ctx, "2026-10-06"), /<b>Заявки с сайта: 1<\/b>/);
  assert.match(renderReport(ctx, "7"), /<b>Заявки с сайта: 7<\/b>/);
  assert.match(renderReport(ctx, "30"), /^<b>30 дней: 8 сентября - 7 октября<\/b>/);
  assert.match(renderReport(ctx, "all"), /^<b>Весь период: 6 октября - 7 октября<\/b>/);
  // сам расчёт периодов
  const p7 = resolvePeriod("7", NOW);
  assert.deepEqual([p7.from, p7.to, p7.days.length], ["2026-10-01", "2026-10-07", 7]);
  assert.equal(resolvePeriod("30", NOW).days.length, 30);
  assert.deepEqual(resolvePeriod("2026-10-03", NOW).days, ["2026-10-03"]);
  assert.equal(resolvePeriod("мусор", NOW).key, "t");
  // полночь по Алматы: 23:59:59 ещё «сегодня» 7-го, секундой позже уже 8-е
  assert.equal(resolvePeriod("t", alm(2026, 10, 7, 23, 59, 59)).from, "2026-10-07");
  assert.equal(resolvePeriod("t", alm(2026, 10, 8, 0, 0, 0)).from, "2026-10-08");
  assert.equal(resolvePeriod("y", alm(2026, 10, 8, 0, 0, 0)).from, "2026-10-07");
  // 00:30 по Алматы это ещё 19:30 предыдущих суток по UTC
  assert.equal(resolvePeriod("t", Date.UTC(2026, 9, 7, 19, 30)).from, "2026-10-08");
  assert.equal(resolvePeriod("t", Date.UTC(2026, 9, 7, 18, 59, 59)).from, "2026-10-07");
});

test("связка pp_ и ty_ с eventId заявки, прямой /start, метки источников, доля «заявка → бот»", () => {
  adminScenario();
  const r = renderReport(adminCtx(NOW), "t");
  assert.match(r, /<b>Бот: новых подписчиков 7<\/b>/);
  assert.match(r, /Откуда: окно на сайте 2, «Спасибо» 2, прямой \/start 1, метки: 2gis 2/);
  // pp_E1 -> заявка с utm_source instagram, ty_E2 -> saint4aibio; pp без номера и ty_unknownEid заявку не нашли
  assert.match(r, /По UTM заявки: instagram 1, saint4aibio 1, заявка не найдена 2/);
  assert.match(r, /Заявка → бот: 2 из 6 \(33%\)/);
  // вчерашний подписчик с pp_E0 в сегодняшний отчёт не попал, во вчерашний попал вместе со своей заявкой
  const y = renderReport(adminCtx(NOW), "y");
  assert.match(y, /<b>Бот: новых подписчиков 1<\/b>/);
  assert.match(y, /Заявка → бот: 1 из 1 \(100%\)/);
});

test("группировка UTM: источник / канал / кампания, без UTM по referrer, топ-8 и «прочие»", () => {
  adminScenario();
  const r = renderReport(adminCtx(NOW), "t");
  assert.match(r, /Место на странице: hero 2, dock 1, final 1, header 1, popup 1/);
  assert.match(r, /UTM: instagram \/ paid_social \/ efir_0710 1; saint4aibio 1\n/);
  assert.match(r, /Без UTM: google \(gclid\) 1, instagram\.com 1, l\.instagram\.com 1, прямой заход 1/);
  assert.match(renderReport(adminCtx(NOW), "7"), /По дням: 06\.10 1, 07\.10 6/);
  // 10 разных кампаний: показаны 8 и «прочие»
  const { dir } = boot();
  const rows = Array.from({ length: 10 }, (_, i) => leadRow({ id: `c${i}`, iso: iso(alm(2026, 10, 7, 9, i)), eventId: `X${i}`, utm: { utm_source: "ads", utm_medium: "cpc", utm_campaign: `camp${String(i).padStart(2, "0")}` } }));
  rows.push(leadRow({ id: "c-extra", iso: iso(alm(2026, 10, 7, 10, 0)), eventId: "Xe", utm: { utm_source: "ads", utm_medium: "cpc", utm_campaign: "camp00" } }));
  writeLeads(dir, rows);
  const r2 = renderReport(adminCtx(NOW), "t");
  const utmLine = r2.split("\n").find((l) => l.startsWith("UTM:")) as string;
  assert.equal(utmLine.split(";").length, 9); // 8 меток и «прочие»
  assert.match(utmLine, /^UTM: ads \/ cpc \/ camp00 2; /);
  assert.match(utmLine, /; прочие 2$/);
  // источник в разном регистре и с пробелами склеивается
  const { dir: d3 } = boot();
  writeLeads(d3, [leadRow({ id: "a", iso: iso(alm(2026, 10, 7, 9, 0)), utm: { utm_source: " Instagram " } }), leadRow({ id: "b", iso: iso(alm(2026, 10, 7, 9, 1)), utm: { utm_source: "instagram" } })]);
  assert.match(renderReport(adminCtx(NOW), "t"), /UTM: instagram 2\n/);
});

test("метка 2gis: любой payload кроме pp_ и ty_ это источник до первого «_», виден в отчёте и в таблице UTM по дням", () => {
  assert.deepEqual(classifyPayload("2gis"), { kind: "tag", eid: "", tag: "2gis" });
  assert.deepEqual(classifyPayload("2GIS_card_1"), { kind: "tag", eid: "", tag: "2gis" });
  assert.deepEqual(classifyPayload("ppc_google"), { kind: "tag", eid: "", tag: "ppc" });
  assert.deepEqual(classifyPayload("pp_abc-1"), { kind: "pp", eid: "abc-1", tag: "" });
  assert.deepEqual(classifyPayload("ty"), { kind: "ty", eid: "", tag: "" });
  assert.deepEqual(classifyPayload(""), { kind: "direct", eid: "", tag: "" });
  adminScenario();
  const ctx = adminCtx(NOW);
  assert.match(renderReport(ctx, "t"), /метки: 2gis 2/);
  const table = renderUtmByDay(ctx, "t");
  assert.match(table, /<pre>/);
  assert.match(table, /2gis/);
  assert.match(table, /0\(2\)/); // заявок нет, оба дошли до бота
  assert.match(table, /сразу в бота/);
});

test("кнопки после заявки: Telegram и WhatsApp с разбивкой окно и страница (поле src), без src только итоги", () => {
  adminScenario();
  const r = renderReport(adminCtx(NOW), "t");
  assert.match(r, /<b>Кнопки после заявки<\/b>\nTelegram 2 \(окно 1, страница 1\), WhatsApp 1 \(окно 1, страница 0\)/);
  const { store } = boot();
  store.recordTyClick("tg", "", TODAY, iso(NOW));
  assert.match(renderReport(adminCtx(NOW), "t"), /Telegram 1, WhatsApp 0\n/);
  assert.doesNotMatch(renderReport(adminCtx(NOW), "t"), /окно/);
  // клик со страницы пишет src в журнал
  assert.deepEqual(parseTyBody("ch=tg&eid=abc&src=pp"), { ch: "tg", eid: "abc", src: "pp" });
  assert.deepEqual(parseTyBody("ch=wa&src=zzz"), { ch: "wa", eid: "" });
  assert.deepEqual(parseTyBody(JSON.stringify({ ch: "tg", src: "ty" })), { ch: "tg", eid: "", src: "ty" });
});

test("эфиры и рассылка в отчёте: записались, перешли, оплатили, отправлено, ошибки, заблокировали", () => {
  adminScenario();
  const r = renderReport(adminCtx(NOW), "t");
  assert.match(r, /<b>Эфиры<\/b>\n07\.10: записались 7, перешли 1 \(14%\), «Я уже оплатил\(а\)» 1/);
  assert.match(r, /<b>Рассылка<\/b>: отправлено 3, ошибок 2, заблокировали бота 1\nwarm-1200 3 \(ошибок 1\), link-1950 0 \(ошибок 1\)/);
});

test("отчёты без имён, телефонов и chat_id; пользовательские метки экранируются", () => {
  const { dir } = adminScenario();
  writeLeads(dir, [leadRow({ id: "x", iso: iso(alm(2026, 10, 7, 9, 0)), eventId: "Ex", utm: { utm_source: "<b>evil</b>&co", utm_campaign: "a<script>" } })]);
  const ctx = adminCtx(NOW);
  for (const text of [renderReport(ctx, "t"), renderUtmByDay(ctx, "t"), renderErrors(ctx, "t"), renderDailyReport(ctx, "2026-10-07")]) {
    assert.equal(text.includes(SECRET_NAME), false);
    assert.equal(text.includes("Секретное"), false);
    assert.equal(text.includes("77011112233"), false);
    assert.equal(/55512345\d\d/.test(text), false);
    assert.equal(text.includes("\u2014"), false);
    assert.equal(text.includes("<script>"), false);
    assert.equal(text.includes("<b>evil"), false);
  }
  assert.match(renderReport(ctx, "t"), /&lt;b&gt;evil&lt;\/b&gt;&amp;co/);
  // таблица: в <pre> тоже экранировано, тег закрыт
  const t = renderUtmByDay(ctx, "t");
  assert.match(t, /<pre>[\s\S]*<\/pre>$/);
  assert.match(t, /&lt;b&gt;ev/);
});

test("«UTM по дням»: топ-4 источника по заявкам и в скобках дошедшие до бота, «прочие», итоги, ширина колонок", () => {
  const { dir } = boot([msg("a", "10:00")]);
  const rows: unknown[] = [];
  let n = 0;
  const add = (day: number, src: string, count: number, linked = 0) => {
    for (let i = 0; i < count; i++) rows.push(leadRow({ id: `u${n}`, iso: iso(alm(2026, 10, day, 9, i)), eventId: `EV${n++}`, utm: src ? { utm_source: src } : undefined }));
    return linked;
  };
  add(6, "instagram", 5);
  add(7, "instagram", 3);
  add(7, "saint4aibio", 4);
  add(7, "", 2);
  add(7, "vk", 1);
  add(7, "yandex", 1);
  add(7, "tiktok", 1);
  writeLeads(dir, rows);
  const store = getStore();
  // первые два заявки instagram 6 октября и одна saint4aibio 7 октября дошли до бота
  sub(store, 71, "2026-10-07", alm(2026, 10, 6, 12, 0), { payload: "pp_EV0" });
  sub(store, 72, "2026-10-07", alm(2026, 10, 6, 12, 1), { payload: "ty_EV1" });
  sub(store, 73, "2026-10-07", alm(2026, 10, 7, 12, 0), { payload: "pp_EV9" });
  sub(store, 74, "2026-10-07", alm(2026, 10, 7, 13, 0), { payload: "2gis" });
  const out = renderUtmByDay(adminCtx(NOW), "7");
  const pre = (out.match(/<pre>([\s\S]*)<\/pre>/) as RegExpMatchArray)[1].split("\n");
  assert.match(out, /^<b>UTM по дням, 7 дней: 1 октября - 7 октября<\/b>/);
  assert.equal(pre.length, 1 + 7 + 1); // шапка, 7 дней, итого
  assert.match(pre[0], /^дата\s+instagram\s+saint4aibio\s+без метки\s+2gis\s+прочие\s+всего$/);
  const row = (d: string) => pre.find((l) => l.startsWith(d)) as string;
  assert.match(row("06.10"), /^06\.10\s+5\(2\)\s+\.\s+\.\s+\.\s+\.\s+5\(2\)$/);
  assert.match(row("07.10"), /^07\.10\s+3\(0\)\s+4\(1\)\s+2\(0\)\s+0\(1\)\s+3\(0\)\s+12\(2\)$/);
  assert.match(row("01.10"), /^01\.10\s+\.\s+\.\s+\.\s+\.\s+\.\s+\.$/);
  assert.match(pre[pre.length - 1], /^итого\s+8\(2\)\s+4\(1\)\s+2\(0\)\s+0\(1\)\s+3\(0\)\s+17\(4\)$/);
  // колонки ровные: у всех строк «всего» начинается с одной позиции
  const starts = new Set(pre.map((l) => l.search(/\S+$/)));
  assert.equal(starts.size, 1);
});

test("длина сообщений не больше 4096 на больших данных; таблица по дням режется с пометкой", () => {
  const { dir } = boot([msg("a", "10:00")]);
  const rows: unknown[] = [];
  const store = getStore();
  const srcs = ["instagram", "saint4aibio", "google", "yandex", "tiktok", "vk", "facebook", "telegram", "2gis", "youtube"];
  for (let d = 0; d < 120; d++) {
    const day = addDays("2026-06-10", d);
    for (let k = 0; k < 6; k++) {
      const ts = atTime(day, "10:00") + k * 60_000;
      rows.push({ kind: "capture", id: `${d}-${k}`, eventId: `ev-${d}-${k}`, source: "efir-1-okt-hero", utm: { utm_source: srcs[(d + k) % srcs.length], utm_medium: "m" + (k % 3), utm_campaign: "kampaniya_" + ((d * 7 + k) % 40) }, ts: iso(ts) });
    }
    if (d % 3 === 0) sub(store, 9000 + d, day, atTime(day, "11:00"), { payload: `pp_ev-${d}-0` });
    store.recordSent({ msg: "m" + (d % 25), day, chat_id: 9000 + d, ts: iso(atTime(day, "12:00")), ok: d % 5 !== 0, ...(d % 5 === 0 ? { err: "400 Bad Request: ошибка номер " + d } : {}) });
  }
  writeLeads(dir, rows);
  const ctx = adminCtx(alm(2026, 10, 7, 18, 0));
  for (const key of ["t", "y", "7", "30", "all", "2026-07-01"]) {
    for (const f of [renderReport, renderUtmByDay, renderErrors]) {
      const text = f(ctx, key);
      assert.ok(text.length <= 4096, `${f.name} ${key}: ${text.length}`);
      assert.ok(text.length > 20);
    }
  }
  const table = renderUtmByDay(ctx, "all");
  assert.match(table, /показаны последние \d+ дн\. из \d+/);
  assert.ok(table.length <= MSG_LIMIT);
  assert.match(table, /<\/pre>$/);
  assert.match(table, /итого/);
  // assemble режет блоки по строкам и пишет пометку
  const big = assemble("<b>Шапка</b>", ["a\n".repeat(50), Array.from({ length: 400 }, (_, i) => `строка ${i}`).join("\n")]);
  assert.ok(big.length <= 4096);
  assert.match(big, /часть отчёта не поместилась/);
});

test("ошибки: неудачные отправки по тексту, последние 10 с временем и id сообщения, блокировки, счётчики процесса, версия", async () => {
  adminScenario();
  const store = getStore();
  for (let i = 0; i < 12; i++) store.recordSent({ msg: `m${i}`, day: TODAY, chat_id: 5551230000 + i, ts: iso(alm(2026, 10, 7, 13, i)), ok: false, err: "500 Internal error" });
  noteRuntime("skipLate", { msg: "live-2000", info: "3" });
  noteRuntime("tickError", { info: "boom" });
  // подмена медиа на текст и отказ вебхука по секрету: реальные пути кода
  fake.respond = (method) => (method === "sendPhoto" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: failed to get HTTP URL content" } } : null);
  await sendContent({ media: { type: "photo", url: "https://onai.academy/x/err.jpg" }, text: "Т" }, ctxFor(mkSeries([])));
  const { server, url } = await startWebhook();
  try {
    for (const secret of [undefined, "wrong", "wrong2"]) await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(secret ? { "x-telegram-bot-api-secret-token": secret } : {}) }, body: "{}" });
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
  // предупреждения владельцам о подмене медиа уходят асинхронно: дожидаемся, чтобы они не попали в следующий тест
  await waitFor(() => fake.texts(900).some((x) => x.startsWith("Не отправилась картинка")) && fake.texts(901).some((x) => x.startsWith("Не отправилась картинка")));
  assert.equal(runtime.webhookRejected, 3);
  const text = renderErrors(adminCtx(NOW), "t");
  assert.match(text, /^<b>Ошибки, Сегодня, 7 октября<\/b>/);
  assert.match(text, /<b>Неудачные отправки: 14<\/b> \(из 17\)/);
  assert.match(text, /12 x 500 Internal error/);
  assert.match(text, /1 x 403 Forbidden: bot was blocked by the user/);
  assert.match(text, /<b>Последние 10<\/b>/);
  const lastLines = text.split("\n").slice(text.split("\n").indexOf("<b>Последние 10</b>") + 1, text.split("\n").indexOf("<b>Последние 10</b>") + 11);
  assert.equal(lastLines[0], "07.10 17:50 link-1950: 400 Bad Request: chat not found"); // новее сверху
  assert.equal(lastLines[1], "07.10 13:11 m11: 500 Internal error");
  assert.equal(lastLines.filter((l) => /^07\.10 \d\d:\d\d m\d+: 500 Internal error$/.test(l)).length, 9);
  assert.match(text, /<b>Заблокировали бота<\/b>: 1/);
  assert.match(text, /Пропуски по опозданию планировщика: 1 \(live-2000\)/);
  assert.match(text, /Медиа заменено текстом: 1/);
  assert.match(text, /Сбои тиков планировщика: 1/);
  assert.match(text, /Отказы вебхука по секрету: 3/);
  assert.match(text, /Версия: dev, процесс работает/);
  assert.equal(/55512300\d\d/.test(text), false); // чаты не показываются
});

test("меню /admin и /stats: только владельцам, кнопки периода, редактирование того же сообщения, чужим ничего", async () => {
  adminScenario();
  const now = NOW;
  // чужой: молчание и на команду, и на кнопку (кнопка только закрывается)
  await processUpdate(upd(555, "/admin"), now);
  await processUpdate(upd(555, "/stats"), now);
  assert.equal(fake.calls.length, 0);
  await processUpdate(cb(555, "adm:p:t"), now);
  await processUpdate(cb(555, "adm:u:7", { id: "x2" }), now);
  await processUpdate(cb(555, "adm:e:y", { id: "x3" }), now);
  await processUpdate(cb(555, "adm:d", { id: "x4" }), now);
  assert.deepEqual(fake.calls.map((c) => c.method), ["answerCallbackQuery", "answerCallbackQuery", "answerCallbackQuery", "answerCallbackQuery"]);

  // владелец: /admin и /stats открывают одно меню
  fake.reset();
  await processUpdate(upd(900, "/admin"), now);
  await processUpdate(upd(900, "/stats"), now);
  const menus = fake.of("sendMessage");
  assert.equal(menus.length, 2);
  for (const mnu of menus) {
    assert.equal(mnu.body.parse_mode, undefined);
    const labels = (mnu.body.reply_markup.inline_keyboard as Array<Array<{ text: string; callback_data: string }>>).flat().map((b) => b.text);
    assert.deepEqual(labels, ["Сегодня", "Вчера", "7 дней", "30 дней", "Дата…"]);
    assert.match(String(mnu.body.text), /Подписчиков всего: 8/);
    assert.match(String(mnu.body.text), /Выбери период для отчёта:/);
  }
  const cbs = (menus[0].body.reply_markup.inline_keyboard as Array<Array<{ callback_data: string }>>).flat().map((b) => b.callback_data);
  assert.deepEqual(cbs, ["adm:p:t", "adm:p:y", "adm:p:7", "adm:p:30", "adm:d"]);
  for (const c of cbs) assert.ok(Buffer.byteLength(c) <= 64);

  // кнопка периода редактирует то же сообщение, не шлёт новое
  fake.reset();
  await processUpdate(cb(900, "adm:p:t", { id: "o1" }), now);
  assert.deepEqual(fake.calls.map((c) => c.method), ["answerCallbackQuery", "editMessageText"]);
  const ed = fake.of("editMessageText")[0].body;
  assert.equal(ed.message_id, 77);
  assert.equal(ed.chat_id, 900);
  assert.equal(ed.parse_mode, "HTML");
  assert.match(String(ed.text), /^<b>Сегодня, 7 октября<\/b>/);
  assert.deepEqual((ed.reply_markup.inline_keyboard as Array<Array<{ text: string }>>).map((r) => r.map((b) => b.text)), [["UTM по дням", "Ошибки"], ["Обновить", "← Период"]]);
  assert.deepEqual(ed.link_preview_options, { is_disabled: true });
  // «UTM по дням» и «Ошибки» тоже правят сообщение, «Обновить» повторяет экран, «← Период» возвращает меню
  for (const [data, re, btns] of [
    ["adm:u:t", /^<b>UTM по дням, Сегодня, 7 октября<\/b>/, ["Отчёт", "Ошибки"]],
    ["adm:e:t", /^<b>Ошибки, Сегодня, 7 октября<\/b>/, ["Отчёт", "UTM по дням"]],
  ] as const) {
    fake.reset();
    await processUpdate(cb(900, data, { id: data }), now);
    const body = fake.of("editMessageText")[0].body;
    assert.match(String(body.text), re);
    assert.deepEqual((body.reply_markup.inline_keyboard as Array<Array<{ text: string }>>)[0].map((b) => b.text), [...btns]);
    assert.equal((body.reply_markup.inline_keyboard as Array<Array<{ text: string; callback_data: string }>>)[1][0].callback_data, data);
  }
  fake.reset();
  await processUpdate(cb(900, "adm:m", { id: "m" }), now);
  const back = fake.of("editMessageText")[0].body;
  assert.equal(back.parse_mode, undefined);
  assert.match(String(back.text), /Выбери период для отчёта:/);

  // выбор даты: последние 14 дней дд.мм и «Весь период»
  fake.reset();
  await processUpdate(cb(900, "adm:d", { id: "d" }), now);
  const kb = fake.of("editMessageText")[0].body.reply_markup.inline_keyboard as Array<Array<{ text: string; callback_data: string }>>;
  const dayBtns = kb.flat().filter((b) => /^\d\d\.\d\d$/.test(b.text));
  assert.equal(dayBtns.length, 14);
  assert.deepEqual([dayBtns[0].text, dayBtns[0].callback_data, dayBtns[13].text, dayBtns[13].callback_data], ["07.10", "adm:p:2026-10-07", "24.09", "adm:p:2026-09-24"]);
  assert.ok(kb.flat().some((b) => b.text === "Весь период" && b.callback_data === "adm:p:all"));
  // выбранная дата открывает отчёт за этот день
  fake.reset();
  await processUpdate(cb(900, "adm:p:2026-10-06", { id: "dd" }), now);
  assert.match(String(fake.of("editMessageText")[0].body.text), /^<b>6 октября<\/b>/);
  // сообщение уже нельзя править: отчёт приходит новым; «не изменилось» молча
  fake.reset();
  fake.respond = (method) => (method === "editMessageText" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: message to edit not found" } } : null);
  await processUpdate(cb(900, "adm:p:7", { id: "n1" }), now);
  assert.equal(fake.of("sendMessage").length, 1);
  assert.equal(fake.of("sendMessage")[0].body.parse_mode, "HTML");
  fake.reset();
  fake.respond = (method) => (method === "editMessageText" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: message is not modified" } } : null);
  await processUpdate(cb(900, "adm:p:7", { id: "n2" }), now);
  assert.equal(fake.of("sendMessage").length, 0);
  // мусорный callback владельца: только закрытие кнопки
  fake.reset();
  await processUpdate(cb(900, "adm:p:2026-13-45", { id: "bad" }), now);
  await processUpdate(cb(900, "adm:x", { id: "bad2" }), now);
  assert.deepEqual(fake.calls.map((c) => c.method), ["answerCallbackQuery", "answerCallbackQuery"]);
  assert.equal(parseAdminCb("adm:p:all")?.period, "all");
  assert.equal(parseAdminCb("adm:p:2026-02-30"), null);
  assert.equal(parseAdminCb("fire:x"), null);
  assert.equal(adminKeyboard("t", "p").flat().length, 4);
  assert.equal(datePickerKeyboard(NOW).flat().length, 16);
});

test("заявки недоступны: нет файла или ошибка чтения не роняют бота, остальные блоки отчёта на месте", async () => {
  const { dir } = adminScenario();
  process.env.LEADS_LOG_PATH = join(dir, "нет-такого-файла.jsonl");
  const ctx = adminCtx(NOW);
  const r = renderReport(ctx, "t");
  assert.match(r, /<b>Заявки с сайта<\/b>: заявки недоступны \(файл заявок не найден\)/);
  assert.match(r, /<b>Бот: новых подписчиков 7<\/b>/);
  assert.match(r, /<b>Рассылка<\/b>/);
  assert.doesNotMatch(r, /Заявка → бот/);
  assert.match(renderUtmByDay(ctx, "t"), /Заявки недоступны/);
  assert.match(renderDailyReport(ctx, "2026-10-07"), /Заявки недоступны\./);
  // путь, который нельзя прочитать как файл (родитель сам файл)
  process.env.LEADS_LOG_PATH = join(dir, "series.json", "leads.jsonl");
  assert.match(renderReport(ctx, "t"), /заявки недоступны/);
  // и через кнопку: бот отвечает, а не молчит
  fake.reset();
  await processUpdate(cb(900, "adm:p:t", { id: "u1" }), NOW);
  assert.match(String(fake.of("editMessageText")[0].body.text), /заявки недоступны/);
});

test("кеш чтения файлов: без изменений отдаётся из кеша, добавленное дочитывается, неполная строка ждёт, усечение читается заново", () => {
  const dir = tmp();
  const f = join(dir, "log.jsonl");
  writeFileSync(f, '{"a":1}\n{"a":2}\n');
  const r1 = readJsonlCached(f);
  assert.equal(r1.rows.length, 2);
  const r2 = readJsonlCached(f);
  assert.equal(r2.rows, r1.rows); // тот же массив: файл не перечитывался
  appendFileSync(f, '{"a":3}\n{"a":4');
  const r3 = readJsonlCached(f);
  assert.equal(r3.rows.length, 3);       // последняя строка без \n ещё не дописана
  assert.equal(r3.rows, r1.rows);        // дочитано в тот же массив
  appendFileSync(f, '}\nбитая строка\n{"a":5}\n');
  const r4 = readJsonlCached(f);
  assert.deepEqual(r4.rows.map((r) => r.a), [1, 2, 3, 4, 5]);
  writeFileSync(f, '{"a":9}\n');          // файл стал меньше: читаем заново
  assert.deepEqual(readJsonlCached(f).rows.map((r) => r.a), [9]);
  assert.equal(readJsonlCached(join(dir, "none.jsonl")).missing, true);
  // отчёт видит заявки, дописанные после первого чтения
  const { dir: d2 } = boot();
  const lf = writeLeads(d2, [leadRow({ id: "a", iso: iso(alm(2026, 10, 7, 9, 0)) })]);
  assert.match(renderReport(adminCtx(NOW), "t"), /Заявки с сайта: 1/);
  appendFileSync(lf, JSON.stringify(leadRow({ id: "b", iso: iso(alm(2026, 10, 7, 9, 5)) })) + "\n");
  assert.match(renderReport(adminCtx(NOW), "t"), /Заявки с сайта: 2/);
  assert.equal(hostOf("https://www.L.Instagram.com/path?x=1"), "l.instagram.com");
  assert.equal(hostOf("instagram.com"), "instagram.com");
  assert.equal(hostOf("мусор"), "");
  assert.equal(placeOf("efir-1-okt-popup"), "popup");
  assert.equal(placeOf(""), "не указано");
});

test("/help: владельцу справка по всем командам, остальным обычный ответ бота", async () => {
  boot();
  const now = alm(2026, 10, 7, 11, 0);
  await processUpdate(upd(900, "/help"), now);
  const help = fake.texts(900)[0];
  for (const cmd of ["/admin", "/series", "/preview", "/fire", "/at", "/off", "/on", "/bizon", "/paid", "/reload", "/series_on", "/series_off"]) {
    assert.ok(help.includes(cmd), `в справке нет ${cmd}`);
  }
  assert.equal(help.includes("\u2014"), false);
  assert.ok(help.length < 1500);
  assert.equal(fake.of("sendMessage")[0].body.parse_mode, undefined);
  fake.reset();
  await processUpdate(upd(555, "/help"), now);
  assert.equal(fake.texts(555)[0], base.welcome.other); // чужому как любой другой текст
});

// ───────────────────────── ежедневный админ-отчёт ─────────────────────────

test("ежедневный отчёт: в 09:00 за вчера, один раз в сутки, после рестарта не дублируется, от seriesEnabled не зависит", async () => {
  const { store, dir, seriesPath } = boot([msg("a", "10:00")]);
  writeLeads(dir, [leadRow({ id: "d1", iso: iso(alm(2026, 10, 7, 12, 0)), eventId: "D1", utm: { utm_source: "instagram", utm_medium: "paid_social", utm_campaign: "efir_0710" } }), leadRow({ id: "d2", iso: iso(alm(2026, 10, 7, 13, 0)), eventId: "D2" })]);
  sub(store, 61, "2026-10-07", alm(2026, 10, 7, 14, 0), { payload: "pp_D1" });
  sub(store, 62, "2026-10-07", alm(2026, 10, 7, 15, 0), { payload: "2gis" });
  store.recordClick(61, "2026-10-07", iso(alm(2026, 10, 7, 20, 5)));
  assert.equal(store.state.seriesEnabled, false);
  // первый запуск функции только запоминает момент: старые дни не догоняются
  assert.equal(await adminDaily(alm(2026, 10, 8, 8, 0)), false);
  assert.equal(store.state.adminSince, alm(2026, 10, 8, 8, 0));
  assert.equal(await adminDaily(alm(2026, 10, 8, 8, 59, 59)), false);
  assert.equal(fake.calls.length, 0);
  assert.equal(await adminDaily(alm(2026, 10, 8, 9, 0)), true);
  assert.deepEqual(fake.of("sendMessage").map((c) => c.body.chat_id), [900, 901]);
  const text = String(fake.of("sendMessage")[0].body.text);
  assert.match(text, /^<b>Итоги за вчера, 7 октября<\/b>/);
  assert.match(text, /Заявок: 2\. Топ UTM: instagram \/ paid_social \/ efir_0710 1; без UTM: прямой заход 1/);
  assert.match(text, /В боте новых: 2 \(окно 1, «Спасибо» 0, прямой 0, 2gis 1\)\. Заявка → бот: 1 из 2 \(50%\)/);
  assert.match(text, /Эфир: записались 2, перешли 1 \(50%\)/);
  assert.match(text, /Ошибок отправки нет\./);
  assert.equal(fake.of("sendMessage")[0].body.parse_mode, "HTML");
  assert.deepEqual(fake.of("sendMessage")[0].body.reply_markup.inline_keyboard, [[{ text: "Подробнее", callback_data: "adm:p:2026-10-07" }, { text: "Ошибки", callback_data: "adm:e:2026-10-07" }]]);
  assert.ok(text.length < 1200);
  assert.equal(text.includes("\u2014"), false);
  assert.equal(store.isAdminReported("2026-10-07"), true);
  // в тот же день второй раз не уходит
  fake.reset();
  assert.equal(await adminDaily(alm(2026, 10, 8, 9, 5)), false);
  assert.equal(await adminDaily(alm(2026, 10, 8, 21, 0)), false);
  assert.equal(fake.calls.length, 0);
  // рестарт: отметка и момент старта читаются из tg-state.json
  initTgWorkshop({ dir, seriesFile: seriesPath });
  assert.equal(getStore().isAdminReported("2026-10-07"), true);
  assert.equal(await adminDaily(alm(2026, 10, 8, 9, 10)), false);
  assert.equal(fake.calls.length, 0);
  // кнопка «Подробнее» открывает полный отчёт за тот день
  await processUpdate(cb(900, "adm:p:2026-10-07", { id: "more" }), alm(2026, 10, 8, 9, 20));
  assert.match(String(fake.of("editMessageText")[0].body.text), /^<b>7 октября<\/b>/);
});

test("ежедневный отчёт: пропуск до суток догоняется, старше суток нет; нет доставки владельцам: отметки нет", async () => {
  const { store } = boot([msg("a", "10:00")]);
  writeLeads(getStore().dir, []);
  await adminDaily(alm(2026, 10, 8, 8, 0)); // момент старта
  assert.equal(await adminDaily(alm(2026, 10, 8, 9, 0)), true);
  fake.reset();
  // процесс «лежал» с 9 по 20 часов 9 октября: отчёт за 8-е (был назначен на 09:00) догоняется
  assert.equal(await adminDaily(alm(2026, 10, 9, 20, 0)), true);
  assert.equal(store.isAdminReported("2026-10-08"), true);
  assert.match(String(fake.of("sendMessage")[0].body.text), /^<b>Итоги за вчера, 8 октября<\/b>/);
  // 10-го отчёта нет, процесс вернулся 11-го в 10:00: отчёт за 10-е старше суток, за 9-е и подавно
  fake.reset();
  assert.equal(await adminDaily(alm(2026, 10, 11, 10, 0)), true);
  assert.equal(store.isAdminReported("2026-10-10"), true);
  assert.equal(store.isAdminReported("2026-10-09"), false);
  assert.equal(fake.of("sendMessage").length, 2);
  // Telegram не доставил ни одному владельцу: не отмечаем, повторим на следующем тике
  fake.reset();
  fake.respond = () => ({ status: 403, json: { ok: false, error_code: 403, description: "Forbidden" } });
  assert.equal(await adminDaily(alm(2026, 10, 12, 9, 0)), false);
  assert.equal(store.isAdminReported("2026-10-11"), false);
  fake.respond = null;
  assert.equal(await adminDaily(alm(2026, 10, 12, 9, 1)), true);
  assert.equal(store.isAdminReported("2026-10-11"), true);
  // владельцев нет: ничего не шлём
  const saved = process.env.TG_LINK_OWNER_IDS;
  process.env.TG_LINK_OWNER_IDS = "";
  fake.reset();
  assert.equal(await adminDaily(alm(2026, 10, 13, 9, 0)), false);
  assert.equal(fake.calls.length, 0);
  process.env.TG_LINK_OWNER_IDS = saved;
});

test("ежедневный отчёт: время из adminDailyReportAt, идёт из tick(), отчёт после эфира в 21:25 остаётся", async () => {
  const { store, dir } = boot([msg("a", "10:00")], { adminDailyReportAt: "07:30" });
  writeLeads(dir, []);
  sub(store, 63, "2026-10-07", alm(2026, 10, 7, 10, 0));
  const f = fakeDeps();
  // старый отчёт после эфира в 21:25 работает независимо и как раньше
  assert.equal(await dailyReport(alm(2026, 10, 7, 21, 25)), true);
  assert.equal(fake.texts(900).filter((t) => t.startsWith("Эфир 7 октября: записались в бота 1")).length, 1);
  const daily = () => fake.texts(900).filter((t) => t.startsWith("<b>Итоги за вчера")).length;
  await tick(alm(2026, 10, 8, 7, 0), f.deps);           // первый тик: старт функции
  await tick(alm(2026, 10, 8, 7, 29, 59), f.deps);
  assert.equal(daily(), 0);
  await tick(alm(2026, 10, 8, 7, 30), f.deps);
  assert.equal(daily(), 1);
  assert.equal(fake.texts(900).filter((t) => t.startsWith("<b>Итоги за вчера, 7 октября")).length, 1);
  await tick(alm(2026, 10, 8, 7, 31), f.deps);
  assert.equal(daily(), 1);
  // неверное время в серии отвергается при проверке
  assert.throws(() => validateSeries(rawSeries([msg("a", "10:00")], { adminDailyReportAt: "9 утра" })), /adminDailyReportAt вида HH:MM/);
  assert.throws(() => validateSeries(rawSeries([msg("a", "10:00")], { adminDailyReportAt: 900 })), /adminDailyReportAt/);
  assert.doesNotThrow(() => validateSeries(rawSeries([msg("a", "10:00")], { adminDailyReportAt: "09:00" })));
  assert.equal(validateSeries(rawSeries([msg("a", "10:00")])).adminDailyReportAt, undefined); // по умолчанию 09:00 берёт планировщик
});

// ───────────────────────── мини-приложение админки (Telegram Mini App) ─────────────────────────

const APP_PIN = "test-pin-4821";
const APP_SECRET = "test-app-secret-0123456789abcdef";
process.env.ADMIN_APP_PIN = APP_PIN;
process.env.ADMIN_APP_SECRET = APP_SECRET;
process.env.ADMIN_APP_IDS = "900"; // 900 админ приложения; 901 тоже владелец бота, но в приложение не допущен
const BOT_TOKEN = process.env.TG_WORKSHOP_BOT_TOKEN as string;
const PAGE_FILE = join(REPO, "form-api", "admin-app.html");
const LQ: ListQuery = { q: "", utm: "", inbot: "", flag: "", offset: 0, limit: 50 };

/** initData по официальной схеме Telegram, собранная независимо от кода сервера. */
function signInit(fields: Record<string, string>, token = BOT_TOKEN, order: "asc" | "desc" = "asc"): string {
  const keys = Object.keys(fields).sort();
  const dcs = keys.map((k) => `${k}=${fields[k]}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(dcs).digest("hex");
  const ordered = order === "asc" ? keys : [...keys].reverse();
  return [...ordered.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(fields[k])}`), `hash=${hash}`].join("&");
}
const userJson = (id: number) => JSON.stringify({ id, first_name: "Александр", username: "saint4ai", language_code: "ru" });
const initFor = (id: number, o: { ageSec?: number; now?: number; token?: string } = {}) => {
  const now = o.now ?? Date.now();
  return signInit({ auth_date: String(Math.floor(now / 1000) - (o.ageSec ?? 0)), query_id: "AAHdF6IQAAAAAN0XohDhrOrc", user: userJson(id) }, o.token);
};

test("initData: верная подпись, подделка, чужой токен, старый auth_date, будущее, мусор, порядок полей", () => {
  const now = Math.floor(Date.now() / 1000) * 1000; // целые секунды: граница в 24 часа проверяется точно
  assert.deepEqual(verifyInitData(initFor(900, { now }), BOT_TOKEN, now), { ok: true, userId: 900, authDate: Math.floor(now / 1000) });
  // порядок полей в строке не важен, дополнительные поля входят в подпись
  const base = { auth_date: String(Math.floor(now / 1000)), query_id: "Q", user: userJson(900), start_param: "x y" };
  assert.equal(verifyInitData(signInit(base, BOT_TOKEN, "desc"), BOT_TOKEN, now).ok, true);
  // подделка: user.id заменён при прежней подписи; поле дописано; подпись испорчена; чужой токен бота
  const p = new URLSearchParams(initFor(900, { now }));
  p.set("user", userJson(901));
  assert.deepEqual(verifyInitData(p.toString(), BOT_TOKEN, now), { ok: false, reason: "hash" });
  const q = new URLSearchParams(initFor(900, { now }));
  q.set("start_param", "evil");
  assert.deepEqual(verifyInitData(q.toString(), BOT_TOKEN, now), { ok: false, reason: "hash" });
  const good = initFor(900, { now });
  assert.deepEqual(verifyInitData(good.slice(0, -1) + (good.endsWith("0") ? "1" : "0"), BOT_TOKEN, now), { ok: false, reason: "hash" });
  assert.deepEqual(verifyInitData(good, "123:OTHER", now), { ok: false, reason: "hash" });
  assert.deepEqual(verifyInitData(initFor(900, { now, token: "123:OTHER" }), BOT_TOKEN, now), { ok: false, reason: "hash" });
  // мусор и пустое
  for (const bad of ["", "hash=abc", "auth_date=1&user=%7B%7D", "x".repeat(9000)]) assert.equal(verifyInitData(bad, BOT_TOKEN, now).ok, false, bad.slice(0, 20));
  assert.equal(verifyInitData(good, "", now).ok, false);
  const noHash = new URLSearchParams(good);
  noHash.delete("hash");
  assert.deepEqual(verifyInitData(noHash.toString(), BOT_TOKEN, now), { ok: false, reason: "format" });
  // auth_date: ровно 24 часа ещё можно, на секунду старше нельзя; будущее до 5 минут терпим
  assert.equal(INIT_MAX_AGE_SEC, 86400);
  assert.equal(verifyInitData(initFor(900, { now, ageSec: INIT_MAX_AGE_SEC }), BOT_TOKEN, now).ok, true);
  assert.deepEqual(verifyInitData(initFor(900, { now, ageSec: INIT_MAX_AGE_SEC + 1 }), BOT_TOKEN, now), { ok: false, reason: "expired" });
  assert.equal(verifyInitData(initFor(900, { now, ageSec: -200 }), BOT_TOKEN, now).ok, true);
  assert.deepEqual(verifyInitData(initFor(900, { now, ageSec: -400 }), BOT_TOKEN, now), { ok: false, reason: "expired" });
  // нет пользователя, id не число
  const noUser = signInit({ auth_date: String(Math.floor(now / 1000)), query_id: "Q" });
  assert.deepEqual(verifyInitData(noUser, BOT_TOKEN, now), { ok: false, reason: "user" });
  const strId = signInit({ auth_date: String(Math.floor(now / 1000)), user: JSON.stringify({ id: "900" }) });
  assert.deepEqual(verifyInitData(strId, BOT_TOKEN, now), { ok: false, reason: "user" });
  // сравнение подписи за константное время
  assert.match(readFileSync(join(REPO, "form-api", "tg-miniapp.ts"), "utf8"), /timingSafeEqual\(given, want\)/);
});

test("токен сессии: подпись, срок 12 часов, чужой user.id, подделка", () => {
  const now = Date.now();
  const t = signSession(900, now, APP_SECRET);
  assert.equal(SESSION_TTL_MS, 12 * 3600 * 1000);
  assert.equal(verifySession(t, 900, now, APP_SECRET), true);
  assert.equal(verifySession(t, 901, now, APP_SECRET), false);
  assert.equal(verifySession(t, 900, now + SESSION_TTL_MS - 1, APP_SECRET), true);
  assert.equal(verifySession(t, 900, now + SESSION_TTL_MS, APP_SECRET), false);
  assert.equal(verifySession(t, 900, now, "другой-ключ-0123456789abcdef"), false);
  const [payload, sig] = t.split(".");
  const evil = Buffer.from(JSON.stringify({ u: 900, e: now + 10 * SESSION_TTL_MS })).toString("base64url");
  assert.equal(verifySession(`${evil}.${sig}`, 900, now, APP_SECRET), false);
  assert.equal(verifySession(`${payload}.${sig.slice(0, -2)}AA`, 900, now, APP_SECRET), false);
  for (const bad of ["", "мусор", "a.b", ".", `${payload}.`, "x".repeat(500)]) assert.equal(verifySession(bad, 900, now, APP_SECRET), false);
  assert.equal(verifySession(t, 900, now, ""), false);
});

test("пароль: сравнение без утечки длины, лимит 5 ошибок за 10 минут на user.id", () => {
  resetAdminAppState();
  assert.equal(pinMatches(APP_PIN, APP_PIN), true);
  assert.equal(pinMatches(` ${APP_PIN} `, APP_PIN), true);
  for (const bad of ["", "153", APP_PIN + "0", APP_PIN.slice(0, -1), "x".repeat(200), 4821, null, undefined]) assert.equal(pinMatches(bad, APP_PIN), false);
  assert.equal(pinMatches(APP_PIN, ""), false);
  const t0 = 1_000_000_000_000;
  assert.equal(LOGIN_MAX_FAILS, 5);
  assert.equal(loginLockedFor(900, t0), 0);
  for (let i = 1; i <= 5; i++) assert.equal(noteLoginFail(900, t0 + i * 1000), 5 - i);
  assert.ok(loginLockedFor(900, t0 + 6000) > 0);
  assert.equal(loginLockedFor(901, t0 + 6000), 0); // чужой user.id не затронут
  // блок держится, пока первая из пяти ошибок не выйдет из окна в 10 минут
  assert.ok(loginLockedFor(900, t0 + 1000 + LOGIN_WINDOW_MS - 1) > 0);
  assert.equal(loginLockedFor(900, t0 + 1000 + LOGIN_WINDOW_MS), 0);
  resetAdminAppState();
});

// ── HTTP: те же маршруты, что в server.ts ──

async function startAdminApi() {
  process.env.ADMIN_APP_HTML = PAGE_FILE;
  const server = createServer((req, res) => {
    const url = (req.url || "").split("?")[0].replace(/\/+$/, "") || "/";
    const method = req.method || "GET";
    if ((method === "GET" || method === "HEAD") && url === "/api/admin-app") return handleAdminApp(req, res);
    if ((method === "GET" || method === "HEAD") && url === "/api/tg-web-app.js") return handleTgSdk(req, res);
    if (method === "POST" && url === "/api/admin/login") return void handleAdminLogin(req, res);
    if (method === "GET" && url.startsWith("/api/admin/")) return handleAdminData(req, res, url);
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { server, base: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
}
const stopAdminApi = (s: Server) => new Promise<void>((r) => s.close(() => r()));
const readJson = async (r: Response) => ({ status: r.status, headers: r.headers, body: (await r.json()) as any });

function captureLogs() {
  const out: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  for (const k of ["log", "warn", "error", "info"] as const) console[k] = (...a: unknown[]) => void out.push(a.map(String).join(" "));
  return { out, restore: () => Object.assign(console, orig) };
}

test("страница: HTML отдаётся, CSP только свой origin (script-src без telegram.org), nonce другой на каждый запрос, no-store", async () => {
  const { server, base } = await startAdminApi();
  try {
    const a = await fetch(`${base}/api/admin-app`);
    const html = await a.text();
    assert.equal(a.status, 200);
    assert.match(a.headers.get("content-type") || "", /^text\/html/);
    assert.equal(a.headers.get("cache-control"), "no-store");
    assert.equal(a.headers.get("x-content-type-options"), "nosniff");
    const csp = a.headers.get("content-security-policy") || "";
    const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1] || "";
    assert.ok(nonce.length >= 16);
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /connect-src 'self'/);
    // script-src только свой nonce: https://telegram.org там не нужен (скрипт Telegram отдаём сами)
    assert.match(csp, /script-src 'nonce-[^']+'(;|$)/);
    assert.equal(/script-src[^;]*telegram\.org/.test(csp), false, csp);
    // единственные внешние адреса в CSP: кто может встраивать страницу (frame-ancestors)
    const hosts = [...csp.matchAll(/https?:\/\/([^\s;]+)/g)].map((m) => m[1]);
    assert.ok(hosts.length > 0 && hosts.every((h) => h === "telegram.org" || h === "*.telegram.org"), hosts.join(","));
    assert.match(csp, /frame-ancestors https:\/\/telegram\.org https:\/\/\*\.telegram\.org/);
    assert.equal(/unsafe-eval/.test(csp), false);
    assert.equal(html.includes("__NONCE__"), false);
    assert.ok(html.includes(`nonce="${nonce}"`));
    assert.ok(html.includes("Админка воркшопа"));
    const b = await fetch(`${base}/api/admin-app`);
    await b.text();
    assert.notEqual(/script-src 'nonce-([^']+)'/.exec(b.headers.get("content-security-policy") || "")?.[1], nonce);
    const head = await fetch(`${base}/api/admin-app`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    // файла страницы нет рядом с тестовым бандлом: 404 вместо падения
    process.env.ADMIN_APP_HTML = join(tmp(), "нет.html");
    const miss = await fetch(`${base}/api/admin-app`);
    assert.ok(miss.status === 404 || miss.status === 200);
  } finally {
    process.env.ADMIN_APP_HTML = PAGE_FILE;
    await stopAdminApi(server);
  }
});

test("скрипт Telegram со своего адреса: 200, application/javascript, WebApp внутри, HEAD без тела", async () => {
  const { server, base } = await startAdminApi();
  try {
    const r = await fetch(`${base}/api/tg-web-app.js`);
    const js = await r.text();
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type") || "", /^application\/javascript/);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("cache-control"), "public, max-age=86400");
    assert.equal(Number(r.headers.get("content-length")), Buffer.byteLength(js));
    assert.ok(js.length > 20000, String(js.length));
    assert.ok(js.includes("WebApp"));
    const head = await fetch(`${base}/api/tg-web-app.js`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.match(head.headers.get("content-type") || "", /^application\/javascript/);
    assert.equal(Number(head.headers.get("content-length")), Buffer.byteLength(js));
    assert.equal(await head.text(), "");
  } finally {
    await stopAdminApi(server);
  }
});

test("регрессия на причину: каждый <script src> в отданном HTML со своего origin и с nonce, чужих адресов нет", async () => {
  const { server, base } = await startAdminApi();
  try {
    const html = await fetch(`${base}/api/admin-app`).then((r) => r.text());
    const nonce = /<script nonce="([^"]+)"/.exec(html)?.[1] || "";
    assert.ok(nonce.length >= 16);
    const withSrc = [...html.matchAll(/<script\b([^>]*\bsrc\s*=[^>]*)>/g)].map((m) => m[1]);
    assert.ok(withSrc.length >= 1);
    for (const attrs of withSrc) {
      const src = /\bsrc="([^"]*)"/.exec(attrs)?.[1] ?? "";
      assert.ok(src.length > 0 && !src.includes("://") && !src.startsWith("//"), `чужой адрес скрипта: ${src}`);
      assert.ok(attrs.includes(`nonce="${nonce}"`), `у скрипта ${src} нет nonce`);
    }
    // относительный путь со страницы /workshop/api/admin-app даёт /workshop/api/tg-web-app.js
    assert.ok(withSrc.some((a) => a.includes('src="tg-web-app.js"')));
    assert.equal(new URL("tg-web-app.js", "https://onai.academy/workshop/api/admin-app").pathname, "/workshop/api/tg-web-app.js");
  } finally {
    await stopAdminApi(server);
  }
});

test("admin-app.html: без длинного тире, без innerHTML, скрипты и стили по nonce, внешних адресов нет", () => {
  const html = readFileSync(PAGE_FILE, "utf8");
  assert.equal(html.includes("—"), false, "длинное тире");
  assert.equal(html.includes("–"), false, "среднее тире");
  assert.equal(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/.test(html), false);
  assert.equal(/\sstyle\s*=/.test(html), false, "inline-стили в разметке");
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 2);
  assert.ok(scripts.some((s) => s.includes('src="tg-web-app.js"') && s.includes('nonce="__NONCE__"')));
  assert.ok(scripts.every((s) => s.includes('nonce="__NONCE__"')));
  assert.ok([...html.matchAll(/<style\b([^>]*)>/g)].every((m) => m[1].includes('nonce="__NONCE__"')));
  // внешних адресов ноль: единственное вхождение http(s) это пространство имён SVG (xmlns), оно ничего не загружает
  const hosts = new Set([...html.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]));
  assert.deepEqual([...hosts].sort(), ["www.w3.org"]);
  assert.equal(/telegram\.org/.test(html), false);
  // тема Telegram и ширина экрана
  assert.match(html, /themeParams/);
  assert.match(html, /name="viewport"/);
});

test("admin-app.html: экран входа с цифровой клавиатурой, 12 кнопок data-key, поле пароля без системной клавиатуры", () => {
  const html = readFileSync(PAGE_FILE, "utf8");
  const keys = [...html.matchAll(/<button\b[^>]*\bdata-key="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  assert.equal(keys.length, 12);
  assert.deepEqual([...keys].sort(), ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "clear"]);
  for (const m of html.matchAll(/<button\b[^>]*\bdata-key="[^"]+"[^>]*>/g)) assert.match(m[0], /type="button"/, "кнопка клавиатуры не должна отправлять форму");
  assert.match(html, /data-key="back"[^>]*aria-label="Удалить цифру"/);
  const pin = /<input\b[^>]*\bid="pin"[^>]*>/.exec(html)?.[0] || "";
  assert.match(pin, /inputmode="none"/);
  assert.match(pin, /maxlength="8"/);
  assert.match(pin, /autocomplete="off"/);
  assert.equal(/\son(click|keydown|input|submit)\s*=/.test(html), false, "инлайн-обработчики в разметке");
});

test("вход: initData, чужой user.id, пароль, лимит попыток, no-store, в логах нет пароля и данных", async () => {
  resetAdminAppState();
  const { server, base } = await startAdminApi();
  const cap = captureLogs();
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }).then(readJson);
  try {
    const init = initFor(900);
    // нет initData, подделка, старая, чужой токен бота, чужой user.id: везде один и тот же 403 без подробностей
    const denies = [
      await post({ pin: APP_PIN }),
      await post({ initData: "hash=" + "0".repeat(64), pin: APP_PIN }),
      await post({ initData: initFor(900, { ageSec: INIT_MAX_AGE_SEC + 60 }), pin: APP_PIN }),
      await post({ initData: initFor(900, { token: "1:EVIL" }), pin: APP_PIN }),
      await post({ initData: initFor(901), pin: APP_PIN }),
      await post({ initData: initFor(5), pin: APP_PIN }),
      await post("не json"),
    ];
    for (const d of denies) {
      assert.equal(d.status, 403);
      assert.deepEqual(d.body, { ok: false, error: "forbidden" });
      assert.equal(d.headers.get("cache-control"), "no-store");
    }
    // неверный пароль: 401 и сколько осталось
    const lefts: number[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await post({ initData: init, pin: "000" + i });
      assert.equal(r.status, 401);
      assert.equal(r.headers.get("cache-control"), "no-store");
      lefts.push(r.body.left);
    }
    assert.deepEqual(lefts, [4, 3, 2, 1, 0]);
    // шестая попытка, даже с верным паролем: 429 с Retry-After
    const locked = await post({ initData: init, pin: APP_PIN });
    assert.equal(locked.status, 429);
    assert.equal(locked.body.error, "too_many");
    assert.ok(Number(locked.headers.get("retry-after")) > 0 && locked.body.retryAfter > 0);
    assert.equal(locked.body.token, undefined);
    // чужой user.id блок не затрагивает: 901 не админ, ему по-прежнему 403, а не 429
    assert.equal((await post({ initData: initFor(901), pin: "x" })).status, 403);
    // после снятия блокировки верный пароль даёт токен; initData можно прислать заголовком
    resetAdminAppState();
    const ok = await post({ pin: APP_PIN }, { "X-Tg-Init-Data": init });
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get("cache-control"), "no-store");
    assert.equal(verifySession(ok.body.token, 900, Date.now(), APP_SECRET), true);
    assert.ok(Math.abs(ok.body.expiresAt - (Date.now() + SESSION_TTL_MS)) < 5000);
    assert.match(ok.body.meta.today, /^\d{4}-\d{2}-\d{2}$/);
    // успешный вход обнуляет счётчик ошибок
    await post({ initData: init, pin: "bad" });
    await post({ initData: init, pin: APP_PIN });
    assert.equal((await post({ initData: init, pin: "bad" })).body.left, 4);
    // логи: ни пароля, ни initData, ни токена
    const logs = cap.out.join("\n");
    assert.ok(logs.length > 0);
    for (const secret of [APP_PIN, init, ok.body.token, "hash=", APP_SECRET, BOT_TOKEN]) assert.equal(logs.includes(secret), false, `в логах: ${secret.slice(0, 12)}`);
  } finally {
    cap.restore();
    resetAdminAppState();
    await stopAdminApi(server);
  }
});

test("приложение не настроено (нет пароля, ключа сессий или токена бота): 503, а не открытая дверь", async () => {
  const { server, base } = await startAdminApi();
  try {
    for (const key of ["ADMIN_APP_PIN", "ADMIN_APP_SECRET", "TG_WORKSHOP_BOT_TOKEN"]) {
      const saved = process.env[key];
      delete process.env[key];
      const r = await fetch(`${base}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: initFor(900), pin: APP_PIN }) });
      assert.equal(r.status, 503, key);
      assert.equal(r.headers.get("cache-control"), "no-store");
      assert.equal((await fetch(`${base}/api/admin/summary`)).status, 503, key);
      process.env[key] = saved;
    }
    // слишком короткий ключ сессий считается ненастроенным
    const savedSecret = process.env.ADMIN_APP_SECRET;
    process.env.ADMIN_APP_SECRET = "short";
    assert.equal((await fetch(`${base}/api/admin/summary`)).status, 503);
    process.env.ADMIN_APP_SECRET = savedSecret;
    // список допущенных пуст: никому
    const savedIds = process.env.ADMIN_APP_IDS;
    process.env.ADMIN_APP_IDS = "";
    assert.equal((await fetch(`${base}/api/admin/summary`)).status, 503);
    process.env.ADMIN_APP_IDS = savedIds;
  } finally {
    await stopAdminApi(server);
  }
});

test("ADMIN_APP_IDS: по умолчанию Александр, список через запятую, пустой никого не пускает", () => {
  const saved = process.env.ADMIN_APP_IDS;
  delete process.env.ADMIN_APP_IDS;
  assert.deepEqual(adminAppIds(), ["789638302"]);
  assert.equal(isAdminAppUser(789638302), true);
  assert.equal(isAdminAppUser(900), false);
  process.env.ADMIN_APP_IDS = " 1 , 2,,";
  assert.deepEqual(adminAppIds(), ["1", "2"]);
  process.env.ADMIN_APP_IDS = "";
  assert.deepEqual(adminAppIds(), []);
  assert.equal(isAdminAppUser(undefined), false);
  process.env.ADMIN_APP_IDS = saved;
});

// ── данные ──

const at7 = (h: number, m = 0) => alm(2026, 10, 7, h, m);
const leadRow2 = (id: string, isoTs: string, name: string, phone: string, x: { eventId?: string; source?: string; utm?: Record<string, string> } = {}) => ({
  kind: "capture", id, name, phone, eventId: x.eventId, source: x.source ?? "efir-1-okt-hero", utm: x.utm, ts: isoTs,
});
const IG = { utm_source: "Instagram", utm_medium: "paid_social", utm_campaign: "efir_0710" };
const IG_KEY = "instagram / paid_social / efir_0710";

/** Четыре заявки с разными именами и телефонами и четыре подписчика: для поиска и фильтров. */
function filterScenario() {
  const { store, dir } = boot([msg("warm-1200", "12:00")]);
  writeLeads(dir, [
    leadRow2("a1", iso(at7(10, 0)), "Анна Петрова", "+7 701 111 22 33", { eventId: "A", utm: IG }),
    leadRow2("a2", iso(at7(10, 5)), "Борис", "+7 702 222 33 44", { eventId: "B", utm: IG, source: "efir-1-okt-popup" }),
    leadRow2("a3", iso(at7(10, 10)), "Виктор Анненков", "8 (705) 555-66-77", { eventId: "C", utm: { utm_referrer: "https://l.instagram.com/?u=1" }, source: "efir-1-okt-dock" }),
    leadRow2("a4", iso(at7(10, 15)), "Галина", "+7 777 000 11 22", { eventId: "D" }),
  ]);
  sub(store, 11, TODAY, at7(10, 30), { payload: "pp_A", first: "Анна", username: "anna_p" });
  sub(store, 12, TODAY, at7(11, 0), { payload: "ty_C", first: "Виктор" });
  sub(store, 13, TODAY, at7(12, 0), { payload: "2gis", first: "Игорь", username: "igor2gis" });
  sub(store, 14, "2026-10-08", at7(13, 0), { payload: "", first: "Дарья", username: "dasha" }); // записана на завтрашний эфир
  return { store, dir };
}

test("сводка: карточки, прошлый период, по часам, источники, эфиры считаются теми же правилами, что отчёт в чате", () => {
  adminScenario();
  const ctx = adminCtx(NOW);
  const day = resolvePeriod("t", NOW);
  const s = buildSummary(ctx, day, "reg");
  assert.equal(s.ok, true);
  assert.deepEqual(s.meta, { today: "2026-10-07", updated: "18:00", tz: "Asia/Almaty" });
  assert.deepEqual([s.period.from, s.period.to, s.period.days], ["2026-10-07", "2026-10-07", 1]);
  assert.deepEqual([s.prevPeriod.from, s.prevPeriod.to], ["2026-10-06", "2026-10-06"]);
  // то же, что в отчёте чата: заявки 6, в боте 7, заявка → бот 2 из 6 (33%), TG 2, WA 1, перешли 1, оплатили 1, заблокировали 1
  assert.deepEqual(s.cards, { leads: 6, bot: 7, reached: 2, conv: 33, wa: 1, tg: 2, clicked: 1, paid: 1, blocked: 1 });
  assert.match(renderReport(ctx, "t"), /Заявка → бот: 2 из 6 \(33%\)/);
  // прошлый такой же период: вчера 1 заявка, дошла до бота, 1 подписчик
  assert.deepEqual(s.prev, { leads: 1, bot: 1, reached: 1, conv: 100, wa: 0, tg: 0, clicked: 0, paid: 0, blocked: 0 });
  // по дням эфира: записались на 7 октября 7, перешли 1, оплатили 1; прошлый день: 1
  const st = buildSummary(ctx, day, "stream");
  assert.deepEqual([st.cards.bot, st.cards.clicked, st.cards.paid, st.prev.bot], [7, 1, 1, 1]);
  assert.equal(st.basis, "stream");
  // один день: по часам Алматы, заявки в 00:00, 10:00, 11:00, 12:00 (две), 13:00
  assert.equal(s.hourly?.length, 24);
  assert.deepEqual(s.hourly?.filter((r) => r.leads).map((r) => [r.h, r.leads]), [[0, 1], [10, 1], [11, 1], [12, 2], [13, 1]]);
  assert.deepEqual(s.daily.map((r) => [r.day, r.leads, r.reached, r.conv, r.bot, r.tg, r.wa]), [["2026-10-07", 6, 2, 33, 7, 2, 1]]);
  // несколько дней: без почасовых данных, по строке на день
  const w = buildSummary(ctx, resolvePeriod("7", NOW), "reg");
  assert.equal(w.hourly, null);
  assert.equal(w.daily.length, 7);
  assert.deepEqual(w.daily.slice(-2).map((r) => [r.day, r.leads, r.bot]), [["2026-10-06", 1, 1], ["2026-10-07", 6, 7]]);
  assert.deepEqual(w.prevPeriod, { from: "2026-09-24", to: "2026-09-30", label: "24 сентября - 30 сентября" });
  // источники: UTM, без метки по referrer, метка бота вне сайта
  const src = Object.fromEntries(s.sources.map((r) => [r.key, r]));
  assert.equal(s.sources.length, 7);
  assert.deepEqual([src[IG_KEY].kind, src[IG_KEY].leads, src[IG_KEY].bot, src[IG_KEY].pct], ["utm", 1, 1, 100]);
  assert.deepEqual([src["saint4aibio"].leads, src["saint4aibio"].bot], [1, 1]);
  const li = src["без метки: l.instagram.com"];
  assert.deepEqual([li.kind, li.leads, li.bot, li.pct], ["none", 1, 0, 0]);
  assert.ok(src["без метки: google (gclid)"] && src["без метки: прямой заход"] && src["без метки: instagram.com"]);
  assert.deepEqual(src["2gis"], { key: "2gis", label: "метка бота: 2gis", kind: "tag", leads: 0, bot: 2, pct: 0 });
  // эфиры: записались, перешли, оплатили, какие сообщения серии ушли
  assert.equal(s.streams.length, 1);
  const e = s.streams[0] as any;
  assert.deepEqual([e.day, e.registered, e.clicked, e.pct, e.paid, e.sentOk, e.sentBad], ["2026-10-07", 7, 1, 14, 1, 3, 2]);
  assert.deepEqual(e.messages.map((m: any) => [m.id, m.at, m.ok, m.bad]), [["warm-1200", "12:00", 3, 1], ["link-1950", "", 0, 1]]);
  assert.deepEqual(s.totals, { subscribers: 8, active: 7, paid: 1 }); // один из восьми заблокировал бота
  // имена и телефоны в сводку не попадают
  const json = JSON.stringify(s);
  assert.equal(json.includes(SECRET_NAME), false);
  assert.equal(json.includes("7011112233"), false);
});

test("сводка: заявки недоступны не роняют бота, период из дат, лишний диапазон отвергается", () => {
  const { dir } = adminScenario();
  process.env.LEADS_LOG_PATH = join(dir, "нет-такого-файла.jsonl");
  const s = buildSummary(adminCtx(NOW), resolvePeriod("t", NOW), "reg");
  assert.equal(s.leadsOk, false);
  assert.match(s.leadsError, /файл заявок не найден/);
  assert.equal(s.cards.leads, 0);
  assert.equal(s.cards.bot, 7);
  assert.equal(periodFromDates("2026-10-01", "2026-10-07")?.days.length, 7);
  assert.equal(periodFromDates("2026-10-07", "2026-10-07")?.label, "7 октября");
  assert.equal(periodFromDates("2026-10-08", "2026-10-07"), null);
  assert.equal(periodFromDates("2026-13-01", "2026-13-02"), null);
  assert.equal(periodFromDates("2025-01-01", "2026-10-07"), null); // больше 366 дней
  assert.equal(periodFromDates("2025-10-06", "2026-10-07"), null); // 367 дней
  assert.equal(periodFromDates("2025-10-07", "2026-10-07")?.days.length, 366);
});

test("регистрации: поиск по имени и телефону, фильтры по UTM и «в боте», подгрузка по 50", () => {
  filterScenario();
  const ctx = adminCtx(NOW);
  const day = resolvePeriod("t", NOW);
  const ids = (q: Partial<ListQuery>) => buildLeads(ctx, day, { ...LQ, ...q }).items.map((i) => i.id);
  assert.deepEqual(ids({}), ["a4", "a3", "a2", "a1"]); // новые сверху
  const first = buildLeads(ctx, day, LQ).items[3];
  assert.deepEqual([first.name, first.phone, first.t, first.place, first.utm, first.inBot], ["Анна Петрова", "+7 701 111 22 33", "07.10 10:00", "hero", IG_KEY, true]);
  // имя без учёта регистра, часть слова
  assert.deepEqual(ids({ q: "АНН" }), ["a3", "a1"]);
  assert.deepEqual(ids({ q: "борис" }), ["a2"]);
  // телефон: цифры, с пробелами и скобками, формат ввода не важен; одна цифра в поиск по телефону не идёт
  assert.deepEqual(ids({ q: "7011" }), ["a1"]);
  assert.deepEqual(ids({ q: "+7 701 111" }), ["a1"]);
  assert.deepEqual(ids({ q: "555-66" }), ["a3"]);
  assert.deepEqual(ids({ q: "8 (705)" }), ["a3"]);
  assert.deepEqual(ids({ q: "7" }), []);
  assert.deepEqual(ids({ q: "нет такого" }), []);
  // UTM: точная метка без учёта регистра; «без метки» все без UTM; конкретный referrer
  assert.deepEqual(ids({ utm: IG_KEY }), ["a2", "a1"]);
  assert.deepEqual(ids({ utm: "Instagram / Paid_Social / EFIR_0710" }), ["a2", "a1"]);
  assert.deepEqual(ids({ utm: "без метки" }), ["a4", "a3"]);
  assert.deepEqual(ids({ utm: "без метки: l.instagram.com" }), ["a3"]);
  assert.deepEqual(ids({ utm: "instagram" }), []); // метка целиком, не часть
  // в боте и не в боте, вместе с поиском
  assert.deepEqual(ids({ inbot: "1" }), ["a3", "a1"]);
  assert.deepEqual(ids({ inbot: "0" }), ["a4", "a2"]);
  assert.deepEqual(ids({ inbot: "1", q: "анн", utm: "без метки" }), ["a3"]);
  // подгрузка: 120 заявок, страницы по 50
  const { dir } = boot();
  const many = Array.from({ length: 120 }, (_, i) => leadRow2(`p${i}`, iso(at7(1, 0) + i * 60_000), `Клиент ${i}`, `+7 700 000 ${String(i).padStart(4, "0")}`));
  writeLeads(dir, many);
  const p1 = buildLeads(adminCtx(NOW), day, LQ);
  assert.deepEqual([p1.items.length, p1.total, p1.hasMore, p1.items[0].id], [50, 120, true, "p119"]);
  const p3 = buildLeads(adminCtx(NOW), day, { ...LQ, offset: 100 });
  assert.deepEqual([p3.items.length, p3.hasMore, p3.items[19].id], [20, false, "p0"]);
  assert.equal(new Set([...p1.items, ...buildLeads(adminCtx(NOW), day, { ...LQ, offset: 50 }).items, ...p3.items].map((i) => i.id)).size, 120);
});

test("подписчики: период по дню регистрации и по дню эфира, откуда пришёл, фильтры и поиск", () => {
  const { store } = filterScenario();
  store.recordClick(11, TODAY, iso(at7(17)));
  store.recordEvent({ type: "paid", chat_id: 11, by: "self", ts: iso(at7(17, 30)) });
  store.recordEvent({ type: "paid", chat_id: 12, by: "owner", ts: iso(at7(18, 0)) });
  store.recordEvent({ type: "blocked", chat_id: 13, ts: iso(at7(17, 40)) });
  const ctx = adminCtx(NOW);
  const day = resolvePeriod("t", NOW);
  const idOf = (name: string) => ({ "Анна": 11, "Виктор": 12, "Игорь": 13, "Дарья": 14 } as Record<string, number>)[name];
  const ids = (q: Partial<ListQuery>, basis: "reg" | "stream" = "reg", p = day) => buildSubscribers(ctx, p, basis, { ...LQ, ...q }).items.map((i) => idOf(i.name));
  // день регистрации 7 октября: все четверо, новые сверху
  assert.deepEqual(ids({}), [14, 13, 12, 11]);
  // день эфира 7 октября: Дарья записана на 8-е, её нет; на 8-е она одна
  assert.deepEqual(ids({}, "stream"), [13, 12, 11]);
  assert.deepEqual(ids({}, "stream", resolvePeriod("2026-10-08", NOW)), [14]);
  const row = (name: string) => buildSubscribers(ctx, day, "reg", LQ).items.find((i) => i.name === name) as any;
  const a = row("Анна");
  assert.deepEqual([a.origin, a.kind, a.src, a.clicked, a.paid, a.username, a.dayLabel], ["окно на сайте", "pp", IG_KEY, true, true, "anna_p", "07.10"]);
  const v = row("Виктор");
  assert.deepEqual([v.origin, v.src, v.paid, v.clicked], ["страница «Спасибо»", "без метки: l.instagram.com", true, false]);
  const i = row("Игорь");
  assert.deepEqual([i.origin, i.tag, i.blocked], ["метка: 2gis", "2gis", true]);
  assert.equal(row("Дарья").origin, "прямой /start");
  assert.equal(row("Дарья").dayLabel, "08.10");
  // фильтры: метка бота, метка заявки, без метки, имя и @username, флаги
  assert.deepEqual(ids({ utm: "2gis" }), [13]);
  assert.deepEqual(ids({ utm: IG_KEY }), [11]);
  assert.deepEqual(ids({ utm: "без метки" }), [12]);
  assert.deepEqual(ids({ q: "@igor" }), [13]);
  assert.deepEqual(ids({ q: "АННА" }), [11]);
  assert.deepEqual(ids({ flag: "clicked" }), [11]);
  assert.deepEqual(ids({ flag: "noclick" }), [14, 13, 12]);
  assert.deepEqual(ids({ flag: "paid" }), [12, 11]);
  assert.deepEqual(ids({ flag: "blocked" }), [13]);
  const page = buildSubscribers(ctx, day, "reg", { ...LQ, limit: 2 });
  assert.deepEqual([page.items.length, page.total, page.hasMore], [2, 4, true]);
});

test("ошибки: неудачные отправки, группы, последние, заблокировали, счётчики процесса, версия; номера чатов затираются", () => {
  const { store } = adminScenario();
  store.recordSent({ msg: "warm-1200", day: TODAY, chat_id: 5551234509, ts: iso(at7(19, 0)), ok: false, err: "400 Bad Request: chat 5551234509 not found" });
  noteRuntime("skipLate", { msg: "link-1950" });
  noteRuntime("mediaFallback", { info: "x" });
  runtime.webhookRejected = 3;
  const e = buildErrors(adminCtx(NOW), resolvePeriod("t", NOW));
  assert.deepEqual([e.sentTotal, e.sentOk, e.failed, e.blocked], [6, 3, 3, 1]);
  assert.deepEqual(e.runtime, { skipLate: 1, skipLateIds: ["link-1950"], mediaFallback: 1, tickError: 0, webhookRejected: 3 });
  assert.ok(e.groups.some((g) => g.text === "400 Bad Request: chat # not found" && g.n === 1));
  assert.equal(e.last[0].err, "400 Bad Request: chat # not found"); // самая свежая сверху
  assert.deepEqual(Object.keys(e.last[0]), ["t", "msg", "err"]);
  assert.match(e.last[0].t, /^07\.10 \d\d:\d\d$/);
  assert.match(e.uptime, /ч/);
  assert.ok(e.version.length > 0 && e.uptimeSec >= 0);
  assert.equal(JSON.stringify(e).includes("5551234509"), false);
});

// ── данные по HTTP: три слоя доступа ──

test("данные: initData на каждый запрос, токен сессии, чужой user.id, срок токена и initData, no-store, период и лимиты", async () => {
  resetAdminAppState();
  adminScenario();
  const { server, base } = await startAdminApi();
  const q = "from=2026-10-07&to=2026-10-07";
  const get = (path: string, headers: Record<string, string> = {}) => fetch(`${base}${path}`, { headers }).then(readJson);
  const init = initFor(900);
  const token = signSession(900, Date.now(), APP_SECRET);
  const auth = { "X-Tg-Init-Data": init, Authorization: `Bearer ${token}` };
  const cap = captureLogs();
  try {
    for (const ep of ["summary", "leads", "subscribers", "errors"]) {
      const none = await get(`/api/admin/${ep}?${q}`);
      assert.equal(none.status, 403, ep); // нет initData
      assert.deepEqual(none.body, { ok: false, error: "forbidden" });
      assert.equal((await get(`/api/admin/${ep}?${q}`, { "X-Tg-Init-Data": init })).status, 401, ep); // initData есть, токена нет
      assert.equal((await get(`/api/admin/${ep}?${q}`, { Authorization: `Bearer ${token}` })).status, 403, ep); // токен есть, initData нет
      const ok = await get(`/api/admin/${ep}?${q}`, auth);
      assert.equal(ok.status, 200, ep);
      assert.equal(ok.headers.get("cache-control"), "no-store", ep);
      assert.equal(ok.body.ok, true);
    }
    // 401 и 403 тоже no-store и без подробностей
    const e401 = await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": init });
    assert.equal(e401.headers.get("cache-control"), "no-store");
    assert.deepEqual(e401.body, { ok: false, error: "session" });
    // токен другого пользователя, просроченный, подделанный, без Bearer
    assert.equal((await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": init, Authorization: `Bearer ${signSession(901, Date.now(), APP_SECRET)}` })).status, 401);
    assert.equal((await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": init, Authorization: `Bearer ${signSession(900, Date.now() - SESSION_TTL_MS - 1000, APP_SECRET)}` })).status, 401);
    assert.equal((await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": init, Authorization: `Bearer ${token}x` })).status, 401);
    assert.equal((await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": init, Authorization: token })).status, 401);
    // чужой user.id (владелец бота, но не админ приложения), старая и поддельная initData: 403 даже с верным токеном
    assert.equal((await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": initFor(901), Authorization: `Bearer ${token}` })).status, 403);
    assert.equal((await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": initFor(900, { ageSec: INIT_MAX_AGE_SEC + 5 }), Authorization: `Bearer ${token}` })).status, 403);
    assert.equal((await get(`/api/admin/summary?${q}`, { "X-Tg-Init-Data": initFor(900, { token: "1:EVIL" }), Authorization: `Bearer ${token}` })).status, 403);
    // период: плохие даты 400, неизвестный раздел 404, явные даты и ключи периода
    assert.equal((await get("/api/admin/summary?from=2026-13-40&to=2026-13-41", auth)).status, 400);
    assert.equal((await get("/api/admin/summary?from=2026-10-09&to=2026-10-07", auth)).status, 400);
    assert.equal((await get("/api/admin/zzz", auth)).status, 404);
    assert.equal((await get("/api/admin/summary?period=7", auth)).body.period.days, 7);
    assert.equal((await get("/api/admin/summary", auth)).body.period.days, 1); // по умолчанию сегодня
    // данные возвращаются: сводка с карточками, регистрации с именами и телефонами для админа
    const sum = await get(`/api/admin/summary?${q}&basis=stream`, auth);
    assert.deepEqual([sum.body.basis, sum.body.cards.leads, sum.body.cards.bot], ["stream", 6, 7]);
    const leads = await get(`/api/admin/leads?${q}&limit=500`, auth);
    assert.equal(leads.body.total, 6);
    assert.ok(leads.body.items.length <= 100);
    assert.equal((await get(`/api/admin/leads?${q}`, auth)).body.items.length, 6); // без limit: страница по 50, а не одна запись
    assert.equal((await get(`/api/admin/leads?${q}&limit=2&offset=4`, auth)).body.items.length, 2);
    assert.equal((await get(`/api/admin/leads?${q}&limit=0`, auth)).body.items.length, 1); // нижняя граница 1
    assert.ok(leads.body.items.every((i: any) => i.name === SECRET_NAME && i.phone === SECRET_PHONE));
    assert.equal((await get(`/api/admin/leads?${q}&inbot=1`, auth)).body.total, 2);
    assert.equal((await get(`/api/admin/leads?${q}&q=${encodeURIComponent("нет такого")}`, auth)).body.total, 0);
    assert.equal((await get(`/api/admin/subscribers?${q}&flag=clicked`, auth)).body.total, 1);
    assert.equal((await get(`/api/admin/errors?${q}`, auth)).body.failed, 2);
    // в логах нет ни телефонов, ни имён, ни initData, ни токена
    const logs = cap.out.join("\n");
    for (const secret of [SECRET_PHONE, "77011112233", SECRET_NAME, init, token, "hash="]) assert.equal(logs.includes(secret), false, `в логах: ${secret.slice(0, 10)}`);
  } finally {
    cap.restore();
    await stopAdminApi(server);
  }
});

test("бот выключен (серия не загружена): данные отвечают 503, процесс жив", async () => {
  resetAdminAppState();
  const { server, base } = await startAdminApi();
  try {
    const auth = { "X-Tg-Init-Data": initFor(900), Authorization: `Bearer ${signSession(900, Date.now(), APP_SECRET)}` };
    process.env.TG_BOT = "off";
    initTgWorkshop({ dir: tmp() });
    const off = await fetch(`${base}/api/admin/summary`, { headers: auth }).then(readJson);
    assert.equal(off.status, 503);
    assert.equal(off.body.error, "bot_off");
    assert.equal(off.headers.get("cache-control"), "no-store");
  } finally {
    delete process.env.TG_BOT;
    await stopAdminApi(server);
  }
});

// ── кнопка в боте: /app и tg-setup ──

test("/app: кнопка web_app у администратора, отказ другому владельцу, тишина для чужих", async () => {
  boot();
  assert.equal(adminAppUrl(), "https://onai.academy/workshop/api/admin-app");
  await processUpdate(upd(900, "/app"), NOW);
  const mine = fake.of("sendMessage").filter((c) => c.body.chat_id === 900);
  assert.equal(mine.length, 1);
  assert.deepEqual(mine[0].body.reply_markup.inline_keyboard, [[{ text: "Открыть админку", web_app: { url: "https://onai.academy/workshop/api/admin-app" } }]]);
  fake.reset();
  await processUpdate(upd(901, "/app"), NOW); // владелец бота, но не в ADMIN_APP_IDS
  assert.deepEqual(fake.texts(901), ["Админка недоступна для этого аккаунта."]);
  assert.equal(fake.of("sendMessage")[0].body.reply_markup, undefined);
  fake.reset();
  await processUpdate(upd(5, "/app"), NOW); // не владелец: как у остальных команд, молчим
  assert.equal(fake.calls.length, 0);
  // команда есть в справке
  fake.reset();
  await processUpdate(upd(900, "/help"), NOW);
  assert.match(fake.texts(900)[0], /\/app: мини-приложение админки/);
  // адрес можно переопределить
  process.env.ADMIN_APP_URL = "https://example.test/admin";
  fake.reset();
  await processUpdate(upd(900, "/app"), NOW);
  assert.equal(fake.of("sendMessage")[0].body.reply_markup.inline_keyboard[0][0].web_app.url, "https://example.test/admin");
  delete process.env.ADMIN_APP_URL;
});

// ── /privacy: ссылка на политику для всех ──

test("/privacy: ссылка на политику и обычному человеку, и владельцу; адрес переопределяется", async () => {
  boot();
  const line = "Политика конфиденциальности: https://onai.academy/workshop-montazh/privacy";
  assert.equal(privacyUrl(), "https://onai.academy/workshop-montazh/privacy");
  await processUpdate(upd(5, "/privacy"), NOW); // не владелец
  assert.deepEqual(fake.texts(5), [line]);
  fake.reset();
  await processUpdate(upd(900, "/privacy"), NOW); // владелец
  assert.deepEqual(fake.texts(900), [line]);
  fake.reset();
  process.env.PRIVACY_URL = "https://example.test/p";
  await processUpdate(upd(5, "/privacy"), NOW);
  assert.deepEqual(fake.texts(5), ["Политика конфиденциальности: https://example.test/p"]);
  delete process.env.PRIVACY_URL;
});

function buildBundle(entry: string, outfile: string) {
  const esbuildBin = join(REPO, "node_modules", "esbuild", "bin", "esbuild");
  execFileSync(process.execPath, [esbuildBin, entry, "--bundle", "--platform=node", "--target=node20", "--format=cjs", `--outfile=${outfile}`, "--log-level=error"], { cwd: REPO, stdio: "pipe" });
}

/** Окружение дочернего процесса: текущее плюс правки; undefined убирает переменную. */
function childEnv(over: Record<string, string | undefined>): NodeJS.ProcessEnv {
  const e: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...process.env, ...over })) if (v !== undefined) e[k] = v;
  return e;
}

function runNode(file: string, env: Record<string, string | undefined>): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], { env: childEnv(env), stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out }));
  });
}

test("tg-setup: шаг setChatMenuButton ставит «Админка» только чатам из ADMIN_APP_IDS, токен не печатается", async () => {
  const dir = tmp();
  const out = join(dir, "tg-setup.js");
  buildBundle("form-api/tg-setup.ts", out);
  const env = { FORM_API_ENV: join(dir, "нет.env"), BOT_AVATAR_FILE: join(dir, "нет.jpg") };
  const menu = () => fake.of("setChatMenuButton").map((c) => c.body);

  fake.reset();
  const r1 = await runNode(out, { ...env, ADMIN_APP_IDS: "900,901" });
  assert.deepEqual(menu().map((b) => b.chat_id), [900, 901]);
  for (const b of menu()) assert.deepEqual(b.menu_button, { type: "web_app", text: "Админка", web_app: { url: "https://onai.academy/workshop/api/admin-app" } });
  assert.match(r1.out, /OK\s+6\/7 setChatMenuButton 900 «Админка»/);
  assert.equal(r1.out.includes(BOT_TOKEN), false);
  // порядок шагов: кнопка после команд и до итоговой проверки вебхука
  const order = fake.calls.map((c) => c.method);
  assert.ok(order.indexOf("setMyCommands") < order.indexOf("setChatMenuButton") && order.indexOf("setChatMenuButton") < order.indexOf("getWebhookInfo"));

  // не задан: по умолчанию Александр, одному чату
  fake.reset();
  await runNode(out, { ...env, ADMIN_APP_IDS: undefined });
  assert.deepEqual(menu().map((b) => b.chat_id), [789638302]);

  // пустой список: никому, шаг не падает
  fake.reset();
  const r3 = await runNode(out, { ...env, ADMIN_APP_IDS: "" });
  assert.equal(menu().length, 0);
  assert.match(r3.out, /6\/7 setChatMenuButton: ADMIN_APP_IDS пуст/);

  // Telegram отказал: FAIL в отчёте шага и код выхода 1, остальные шаги выполнены
  fake.reset();
  fake.respond = (method) => (method === "setChatMenuButton" ? { status: 400, json: { ok: false, error_code: 400, description: "Bad Request: chat not found" } } : null);
  const r4 = await runNode(out, { ...env, ADMIN_APP_IDS: "900" });
  assert.match(r4.out, /FAIL\s+6\/7 setChatMenuButton 900/);
  assert.equal(r4.code, 1);
  assert.ok(fake.of("getWebhookInfo").length === 1);
});

test("дым-тест на порту 4110: страница отдаётся, вход по подставной initData с тестовым токеном проходит, данные возвращаются", async () => {
  const dir = tmp();
  const bundle = join(dir, "server.js");
  buildBundle("form-api/server.ts", bundle);
  copyFileSync(PAGE_FILE, join(dir, "admin-app.html"));
  copyFileSync(seriesFile, join(dir, "tg-series.json"));
  // данные: две заявки и два подписчика, записанные тем же хранилищем, что у бота
  const data = join(dir, "data");
  const st = new TgStore(data);
  sub(st, 21, TODAY, at7(10, 30), { payload: "pp_S1", first: "Тест Один", username: "t_one" });
  sub(st, 22, TODAY, at7(11, 0), { payload: "2gis", first: "Тест Два" });
  const leadsFile = join(dir, "leads.jsonl");
  writeFileSync(leadsFile, [
    leadRow2("s1", iso(at7(10, 0)), "Тест Один", "+7 700 111 11 11", { eventId: "S1", utm: IG }),
    leadRow2("s2", iso(at7(10, 5)), "Тест Три", "+7 700 333 33 33"),
  ].map((r) => JSON.stringify(r)).join("\n") + "\n");
  const child = spawn(process.execPath, [bundle], {
    // страница и серия лежат рядом с бандлом, как на сервере; Telegram подменён подставным сервером этого теста
    env: childEnv({
      PORT: "4110", DATA_DIR: data, LEADS_LOG_PATH: leadsFile, FORM_API_ENV: join(dir, "нет.env"), TG_SERIES_FILE: undefined, ADMIN_APP_HTML: undefined,
      TG_BOT: undefined, TG_WORKSHOP_BOT_TOKEN: BOT_TOKEN, TG_WORKSHOP_WEBHOOK_SECRET: "smoke-hook-secret-123456", TG_GO_SECRET: "smoke-go-secret-1234567",
      TG_LINK_OWNER_IDS: "900", ADMIN_APP_PIN: APP_PIN, ADMIN_APP_SECRET: APP_SECRET, ADMIN_APP_IDS: "900",
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const base = "http://127.0.0.1:4110";
  try {
    await waitFor(() => /listening on/.test(log), 8000);
    // старое осталось на месте
    const health = await fetch(`${base}/api/health`).then(readJson);
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, true);
    assert.equal((await fetch(`${base}/api/go/bad`, { redirect: "manual" })).status, 302);
    // страница с CSP, найденная рядом с бандлом
    const page = await fetch(`${base}/api/admin-app`);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.ok(html.includes("Админка воркшопа") && !html.includes("__NONCE__"));
    assert.equal(/script-src[^;]*telegram\.org/.test(page.headers.get("content-security-policy") || ""), false);
    // скрипт Telegram со своего адреса, из бандла
    const sdk = await fetch(`${base}/api/tg-web-app.js`);
    assert.equal(sdk.status, 200);
    assert.match(sdk.headers.get("content-type") || "", /^application\/javascript/);
    assert.ok((await sdk.text()).includes("WebApp"));
    assert.equal((await fetch(`${base}/api/tg-web-app.js`, { method: "HEAD" })).status, 200);
    // вход: подставная initData, подписанная тестовым токеном бота
    const init = initFor(900);
    const jsonPost = (body: unknown) => fetch(`${base}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal((await jsonPost({ initData: initFor(900, { token: "9:НЕТ" }), pin: APP_PIN })).status, 403);
    const wrong = await jsonPost({ initData: init, pin: "0000" }).then(readJson);
    assert.deepEqual([wrong.status, wrong.body.left], [401, 4]);
    const login = await jsonPost({ initData: init, pin: APP_PIN }).then(readJson);
    assert.equal(login.status, 200);
    const auth = { "X-Tg-Init-Data": init, Authorization: `Bearer ${login.body.token}` };
    // данные возвращаются
    const q = "from=2026-10-07&to=2026-10-07";
    const sum = await fetch(`${base}/api/admin/summary?${q}`, { headers: auth }).then(readJson);
    assert.equal(sum.status, 200);
    assert.equal(sum.headers.get("cache-control"), "no-store");
    assert.deepEqual([sum.body.cards.leads, sum.body.cards.bot, sum.body.cards.reached], [2, 2, 1]);
    const leads = await fetch(`${base}/api/admin/leads?${q}`, { headers: auth }).then(readJson);
    assert.deepEqual(leads.body.items.map((i: any) => i.name), ["Тест Три", "Тест Один"]);
    const subs = await fetch(`${base}/api/admin/subscribers?${q}`, { headers: auth }).then(readJson);
    assert.equal(subs.body.total, 2);
    assert.equal((await fetch(`${base}/api/admin/errors?${q}`, { headers: auth })).status, 200);
    assert.equal((await fetch(`${base}/api/admin/summary?${q}`)).status, 403);
    // в логах процесса ни пароля, ни телефонов, ни initData
    for (const secret of [APP_PIN, "700 111 11 11", "7001111111", init, login.body.token, "Тест Один"]) assert.equal(log.includes(secret), false, `в логе: ${secret.slice(0, 10)}`);
  } finally {
    child.kill();
    await new Promise((r) => child.on("close", r));
  }
});


// ── Telegram для связи в заявке: необязательное поле, телефон обязателен ──

import { normalizeTelegram, packUtm, unpackUtm } from "../lib/leads/telegram-nick";
import { addWorkshopLeadTelegramNote, createWorkshopLead } from "../lib/amocrm/client";
import { pushLeadToAmo } from "../lib/leads/process";

test("Telegram в заявке: @ник, t.me/ник и https://t.me/ник приводятся к нику, мусор даёт пустую строку", () => {
  for (const ok of ["nick_01", "@nick_01", "  @nick_01  ", "t.me/nick_01", "https://t.me/nick_01", "http://t.me/nick_01/", "https://www.t.me/nick_01", "https://telegram.me/nick_01", "t.me/@nick_01", "https://t.me/nick_01?start=x"]) {
    assert.equal(normalizeTelegram(ok), "nick_01", ok);
  }
  assert.equal(normalizeTelegram("@Nick_01"), "Nick_01"); // регистр не трогаем
  assert.equal(normalizeTelegram(" @ n i c k 1 "), "nick1"); // пробелы внутри убираются
  assert.equal(normalizeTelegram("@" + "a".repeat(32)), "a".repeat(32));
  for (const bad of ["", "   ", "@", "@abc", "t.me/", "@" + "a".repeat(33), "@ник_кириллицей", "@nick-dash", "https://t.me/+AbCdEfGh1234", "https://example.com/nick", "<b>nick</b>", "nick@mail.ru", "+77011112233", "tg://resolve?domain=nick", null, undefined, 42, {}, ["nick_01"]]) {
    assert.equal(normalizeTelegram(bad), "", String(bad));
  }
  assert.equal(normalizeTelegram("x".repeat(100000)), ""); // длинная строка не ломает и не проходит
});

test("Telegram в заявке: ник едет в utm строки Supabase и возвращается обратно, чужой ключ telegram из меток вычищается", () => {
  assert.deepEqual(packUtm({ utm_source: "ig" }, "nick_01"), { utm_source: "ig", telegram: "nick_01" });
  assert.deepEqual(packUtm(undefined, "nick_01"), { telegram: "nick_01" });
  assert.equal(packUtm(undefined, undefined), null); // метки пустые и ника нет: null, как раньше
  assert.deepEqual(packUtm({ utm_source: "ig", telegram: "forged" }, undefined), { utm_source: "ig" });
  assert.deepEqual(unpackUtm({ utm_source: "ig", telegram: "nick_01" }), { utm: { utm_source: "ig" }, telegram: "nick_01" });
  assert.deepEqual(unpackUtm({ telegram: "nick_01" }), { telegram: "nick_01" });
  assert.deepEqual(unpackUtm({ telegram: "<b>x</b>" }), {});
  assert.deepEqual(unpackUtm(null), {});
});

test("регистрации в админке: @ник виден рядом с телефоном, без Telegram поле пустое, мусор из журнала не попадает", () => {
  const { dir } = boot();
  writeLeads(dir, [
    { ...leadRow2("t1", iso(at7(10, 0)), "Анна", "+7 701 111 22 33"), telegram: "anna_p" },
    leadRow2("t2", iso(at7(10, 5)), "Борис", "+7 702 222 33 44"),
    { ...leadRow2("t3", iso(at7(10, 10)), "Виктор", "+7 705 555 66 77"), telegram: "<img src=x onerror=1>" },
  ]);
  const items = buildLeads(adminCtx(NOW), resolvePeriod("t", NOW), LQ).items;
  assert.deepEqual(items.map((i) => [i.id, i.telegram]), [["t3", ""], ["t2", ""], ["t1", "anna_p"]]);
  // страница показывает ник текстом (не разметкой) рядом с телефоном
  const page = readFileSync(PAGE_FILE, "utf8");
  assert.ok(page.includes("it.telegram ? h('span', { class: 'tgn', text: '@' + it.telegram }) : null"));
});

/** Подменяет fetch и console на время теста amoCRM: запросы записываются, ответы задаёт respond. */
async function withFakeAmo<T>(
  respond: (url: string, init: RequestInit) => { status?: number; json?: unknown } | Error,
  run: (calls: { url: string; init: RequestInit }[], logs: string[]) => Promise<T>,
): Promise<T> {
  const realFetch = globalThis.fetch;
  const { log, error, warn } = console;
  const calls: { url: string; init: RequestInit }[] = [];
  const logs: string[] = [];
  const grab = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
  const savedEnv = { t: process.env.AMOCRM_ACCESS_TOKEN, d: process.env.AMOCRM_DOMAIN };
  process.env.AMOCRM_ACCESS_TOKEN = "test-amo-token";
  process.env.AMOCRM_DOMAIN = "amo-test";
  globalThis.fetch = (async (input: unknown, init: RequestInit = {}) => {
    const url = String(input);
    if (!url.includes("amocrm.ru")) return realFetch(input as string, init);
    calls.push({ url, init });
    const r = respond(url, init);
    if (r instanceof Error) throw r;
    return new Response(JSON.stringify(r.json ?? {}), { status: r.status ?? 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  console.log = console.error = console.warn = grab;
  try {
    return await run(calls, logs);
  } finally {
    globalThis.fetch = realFetch;
    Object.assign(console, { log, error, warn });
    if (savedEnv.t === undefined) delete process.env.AMOCRM_ACCESS_TOKEN;
    else process.env.AMOCRM_ACCESS_TOKEN = savedEnv.t;
    if (savedEnv.d === undefined) delete process.env.AMOCRM_DOMAIN;
    else process.env.AMOCRM_DOMAIN = savedEnv.d;
  }
}

test("amoCRM: с Telegram сделка получает примечание «Telegram для связи», без Telegram запрос один, сбой примечания сделку не ломает", async () => {
  const base = { name: "Анна", phone: "+7 701 111 22 33", source: "efir-1-okt-popup" };
  const ok = (url: string) => (url.endsWith("/leads/complex") ? { json: [{ id: 555, contact_id: 7 }] } : { json: {} });
  // с ником
  await withFakeAmo(ok, async (calls, logs) => {
    const r = await createWorkshopLead({ ...base, telegram: "anna_p" });
    assert.deepEqual(r, { ok: true, leadId: 555 });
    assert.deepEqual(calls.map((c) => c.url), ["https://amo-test.amocrm.ru/api/v4/leads/complex", "https://amo-test.amocrm.ru/api/v4/leads/555/notes"]);
    assert.deepEqual(JSON.parse(String(calls[1].init.body)), [{ note_type: "common", params: { text: "Telegram для связи: @anna_p" } }]);
    // сам запрос создания сделки ник не несёт: он идёт отдельным примечанием
    assert.equal(String(calls[0].init.body).includes("anna_p"), false);
    // в логах только факт, что Telegram указан
    assert.equal(logs.some((l) => l.includes("anna_p")), false);
    assert.ok(logs.some((l) => /Telegram указан/.test(l)));
  });
  // без ника: примечания нет
  await withFakeAmo(ok, async (calls) => {
    assert.deepEqual(await createWorkshopLead(base), { ok: true, leadId: 555 });
    assert.equal(calls.length, 1);
  });
  // примечание не прошло (500) или запрос упал: сделка всё равно создана, повторного создания не будет
  for (const fail of [{ status: 500 }, new Error("сеть")]) {
    await withFakeAmo((url) => (url.endsWith("/leads/complex") ? { json: [{ id: 556, contact_id: 8 }] } : fail), async (calls, logs) => {
      assert.deepEqual(await createWorkshopLead({ ...base, telegram: "anna_p" }), { ok: true, leadId: 556 });
      assert.equal(calls.length, 2);
      assert.equal(logs.some((l) => l.includes("anna_p")), false);
    });
  }
  // отдельный вызов без ника или без токена ничего не отправляет
  await withFakeAmo(ok, async (calls) => {
    assert.equal(await addWorkshopLeadTelegramNote(1, ""), false);
    delete process.env.AMOCRM_ACCESS_TOKEN;
    assert.equal(await addWorkshopLeadTelegramNote(1, "anna_p"), false);
    assert.equal(calls.length, 0);
  });
});

test("amoCRM: дедупликация по телефону работает как раньше; найденной сделке примечание с Telegram добавляется, дубля сделки нет", async () => {
  const lead = { id: "L1", name: "Анна", phone: "+7 701 111 22 33", source: "efir-1-okt-popup" };
  const found = (url: string) =>
    url.includes("/leads?query=") ? { json: { _embedded: { leads: [{ id: 777, pipeline_id: 10882150, created_at: Math.floor(Date.now() / 1000) - 60 }] } } } : { json: {} };
  await withFakeAmo(found, async (calls) => {
    const r = await pushLeadToAmo({ ...lead, telegram: "anna_p" }, { probeFirst: true });
    assert.deepEqual(r, { ok: true, leadId: 777, adopted: true });
    assert.equal(calls.some((c) => c.url.endsWith("/leads/complex")), false); // сделку не создавали
    const note = calls.find((c) => c.url.endsWith("/leads/777/notes"));
    assert.ok(note);
    assert.equal(JSON.parse(String(note.init.body))[0].params.text, "Telegram для связи: @anna_p");
  });
  await withFakeAmo(found, async (calls) => {
    assert.equal((await pushLeadToAmo(lead, { probeFirst: true })).ok, true);
    assert.equal(calls.length, 1); // только проба, без примечания
  });
  // обычная отправка без пробы: сделка создаётся, примечание следом
  await withFakeAmo((url) => (url.endsWith("/leads/complex") ? { json: [{ id: 888, contact_id: 9 }] } : { json: {} }), async (calls) => {
    assert.deepEqual(await pushLeadToAmo({ ...lead, telegram: "anna_p" }, { probeFirst: false }), { ok: true, leadId: 888 });
    assert.deepEqual(calls.map((c) => c.url.split("/api/v4")[1]), ["/leads/complex", "/leads/888/notes"]);
  });
});

test("POST /api/lead на порту 4112: без Telegram заявка проходит как раньше, ник в журнале нормализован, мусор отбрасывается, в логе ника нет", async () => {
  const dir = tmp();
  const bundle = join(dir, "server.js");
  buildBundle("form-api/server.ts", bundle);
  copyFileSync(seriesFile, join(dir, "tg-series.json"));
  const wal = join(dir, "leads.jsonl");
  const child = spawn(process.execPath, [bundle], {
    env: childEnv({
      PORT: "4112", DATA_DIR: join(dir, "data"), LEADS_LOG_PATH: wal, FORM_API_ENV: join(dir, "нет.env"), TG_SERIES_FILE: undefined, ADMIN_APP_HTML: undefined,
      TG_BOT: undefined, TG_WORKSHOP_BOT_TOKEN: BOT_TOKEN, TG_WORKSHOP_WEBHOOK_SECRET: "lead-hook-secret-123456", TG_GO_SECRET: "lead-go-secret-12345678",
      TG_LINK_OWNER_IDS: "900", SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined, AMOCRM_ACCESS_TOKEN: undefined, META_CAPI_TOKEN: undefined,
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const base = "http://127.0.0.1:4112";
  const post = (body: Record<string, unknown>) =>
    fetch(`${base}/api/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Анна", phone: "+7 701 111 22 33", consent: true, source: "efir-1-okt-popup", ...body }),
    }).then(readJson);
  try {
    await waitFor(() => /listening on/.test(log), 8000);
    const cases: [string, Record<string, unknown>, string][] = [
      ["без поля telegram", {}, ""],
      ["пустая строка", { telegram: "" }, ""],
      ["@nick", { telegram: "@anna_nick" }, "anna_nick"],
      ["t.me/nick", { telegram: "t.me/boris_nick" }, "boris_nick"],
      ["https://t.me/nick", { telegram: "https://t.me/viktor_nick" }, "viktor_nick"],
      ["мусор", { telegram: "!!! не ник ???" }, ""],
      ["не строка", { telegram: { x: 1 } }, ""],
    ];
    for (const [label, extra] of cases) {
      const r = await post({ ...extra, eventId: `ev-${label}` });
      assert.equal(r.status, 200, label);
      assert.equal(r.body.ok, true, label);
    }
    // без телефона заявка по-прежнему отклоняется, Telegram его не заменяет
    assert.equal((await post({ phone: "", telegram: "@anna_nick" })).status, 422);
    const rows = readFileSync(wal, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.kind === "capture");
    assert.equal(rows.length, cases.length);
    cases.forEach(([label, , want], i) => {
      assert.equal(rows[i].telegram, want || undefined, label);
      assert.equal(rows[i].phone, "+7 701 111 22 33");
    });
    assert.equal("telegram" in rows[0], false); // без ника ключа нет, строка журнала как раньше
    // лог: факт «Telegram указан» есть, самих ников нет
    await waitFor(() => (log.match(/\[lead\]/g) || []).length >= cases.length, 5000);
    assert.equal((log.match(/tg=yes/g) || []).length, 3);
    assert.equal((log.match(/tg=no/g) || []).length, 4);
    for (const nick of ["anna_nick", "boris_nick", "viktor_nick"]) assert.equal(log.includes(nick), false, nick);
  } finally {
    child.kill();
    await new Promise((r) => child.on("close", r));
  }
});
