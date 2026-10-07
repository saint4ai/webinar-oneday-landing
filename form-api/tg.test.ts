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
  for (const f of ["tg-time.ts", "tg-store.ts", "tg-workshop.ts", "tg-scheduler.ts", "tg-setup.ts", "tg-admin.ts"]) {
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
    [{ text: "Аяне", url: "{MANAGER}" }],
    [{ text: "WhatsApp", url: "{WHATSAPP_TEMPLATE}" }],
    [{ text: "Эфир", url: "{STREAM}" }, { text: "Кейсы", url: "{CASES}" }, { text: "Игра", url: "{GAME}" }],
    [{ text: "Я оплатил", callback: "paid" }],
    [{ text: "Мусор", url: "{UNKNOWN}" }],
  ];
  const kb = buildKeyboard(rows, ctxFor(sr))!;
  assert.deepEqual(kb.map((r) => r.map((b) => b.text)), [["Kaspi"], ["Россия"], ["Аяне"], ["WhatsApp"], ["Эфир", "Кейсы", "Игра"], ["Я оплатил"]]);
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
  assert.ok(sr.links.pay ? warn === "" : warn.includes("{PAY}"));
  assert.equal(warn.includes("PREPAY"), false);
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

  // 12:00: картинка, эфир сегодня, кнопок нет
  await processUpdate(upd(81, "/start"), alm(2026, 10, 6, 12, 0));
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].method, "sendPhoto");
  assert.equal(fake.calls[0].body.photo, base.welcome.media.url);
  assert.match(text(fake.calls[0]), /^Привет, Аня! /);
  assert.match(text(fake.calls[0]), /Эфир сегодня в 20:00/);
  assert.equal(fake.calls[0].body.reply_markup, undefined);
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
  assert.match(text(fake.calls[0]), /Эфир завтра в 20:00/);
  assert.equal(fake.calls[0].body.reply_markup, undefined);
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
  assert.match(String(fake.calls[0].body.caption), /Эфир завтра в 20:00/);
  fake.reset();
  await processUpdate(upd(86, "/start"), alm(2026, 10, 8, 21, 0));
  assert.equal(store.subs.get(86)!.streamDay, "2026-10-10"); // 9 октября пропущено
  assert.match(String(fake.calls[0].body.caption), /Эфир 10 октября в 20:00/);
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
