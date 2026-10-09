/**
 * Сквозной тест пульта WhatsApp (node:test). Запуск из корня репозитория:
 *   npx --yes tsx --test form-api/wa-e2e.test.ts
 * Поднимается настоящий form-api (form-api/server.ts со всеми маршрутами, на свободном порту), подставные Evolution и
 * Telegram (wa-testkit.ts). Время модуля подменено: часы clock.t идут по сценарию без ожидания, к модулю идёт
 * не таймер, а прямые вызовы waTick и joinsTick. Все запросы к админке настоящие HTTP, с подписанной initData и паролем.
 *
 * Сценарий: вход (initData и пароль), QR до состояния open, отключение номера и повторное подключение, режим event на дату X,
 * «Создать сейчас», /api/whatsapp-link отдаёт ссылку нового сообщества, заявки на вступление и автоодобрение, прогрев в день X,
 * после 00:00 ссылка постоянная, переключение на daily и включение: в 20:00 создание, в 20:40 подмена ссылки.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer as createNetServer } from "node:net";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EVO_KEY, evo, INSTANCE_TOKEN, openai, OPENAI_KEY, PNG_B64, runWaPage, TPL_LINK, TPL_REMINDER, tg, wazzup, WZ_CHANNEL, WZ_KEY, WZ_SECRET, wzInbound } from "./wa-testkit";
import { aiFlush } from "./wa-assistant";
import { dzFlush } from "./wa-dozhim";
import { _waRt, joinsTick, resetWaGroups, waTick } from "./wa-groups";
import { setUtcOffsetMinutes } from "./tg-time";
import { readWhatsAppLink } from "../lib/whatsapp-link";

const BOT_TOKEN = "E2ETEST:bot-token-9f3a";
const ADMIN_ID = 789638302;
const STRANGER_ID = 424242;
const PIN = "4821";
const OWNER_CHAT = 900;
/** Постоянная ссылка, которую отдаёт сервер, когда подходящего сообщества нет (lib/whatsapp-link: фолбэк или файл). */
const PERMANENT = readWhatsAppLink();
const REPO = process.cwd();

/** Момент по часам Алматы (UTC+5). */
const alm = (y: number, m: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, m - 1, d, h - 5, mi, s);
const clock = { t: alm(2026, 10, 8, 12, 0, 0) };
const at = (d: number, h: number, mi = 0, s = 0) => (clock.t = alm(2026, 10, d, h, mi, s));

/** initData Telegram Web App, подписанная ботом по официальной схеме (так же её проверяет сервер). */
function initDataFor(userId: number, token = BOT_TOKEN, authDate = Math.floor(Date.now() / 1000)) {
  const params: Record<string, string> = { auth_date: String(authDate), query_id: "AAE-e2e", user: JSON.stringify({ id: userId, first_name: "Тест" }) };
  const check = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  return new URLSearchParams({ ...params, hash }).toString();
}

let PORT = 0;
const base = () => `http://127.0.0.1:${PORT}`;
type Resp = { status: number; json: any; text: string; headers: Headers };
async function call(method: "GET" | "POST", path: string, o: { init?: string | null; token?: string | null; body?: unknown } = {}): Promise<Resp> {
  const headers: Record<string, string> = {};
  if (o.init) headers["X-Tg-Init-Data"] = o.init;
  if (o.token) headers["Authorization"] = `Bearer ${o.token}`;
  if (o.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(base() + path, { method, headers, body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* не JSON */
  }
  return { status: res.status, json, text, headers: res.headers };
}

let server: import("node:http").Server;
let dataDir = "";
let token = "";
const init = () => initDataFor(ADMIN_ID);
const wa = (method: "GET" | "POST", path: string, body?: unknown) => call(method, `/api/admin/wa/${path}`, { init: init(), token, body });
const link = async () => (await call("GET", "/api/whatsapp-link")).json.link as string;

const waPageHtml = readFileSync(join(REPO, "workshop-montazh", "wa.html"), "utf8");
/**
 * Страница workshop-montazh/wa.html (кнопка шаблона WABA) против настоящего сервера: nginx отдаёт /workshop/api/* на form-api как /api/*.
 * Проверяет, куда она переадресует, и что переход ушёл в журнал переходов с каналом wa-template.
 */
async function pageGoes(expected: string, label: string) {
  const r = await runWaPage(waPageHtml, (u, init) => fetch(base() + String(u).replace(/^\/workshop/, ""), init));
  assert.deepEqual([r.url, r.href, r.replaces], [expected, expected, 1], label);
  for (const [u, body] of r.beacons) assert.equal((await fetch(base() + u.replace(/^\/workshop/, ""), { method: "POST", body })).status, 204);
  return r;
}
const tyLines = () => readFileSync(join(dataDir, "ty-clicks.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
/** Все ответы сценария, чтобы в конце проверить, что в них нет ключа и токена инстанса. */
const seen: string[] = [];
const keep = (r: Resp) => (seen.push(r.text), r);

test.before(async () => {
  await tg.start();
  await evo.start();
  await openai.start();
  evo.state = "absent"; // инстанса нет: первое подключение с создания
  dataDir = mkdtempSync(join(tmpdir(), "wa-e2e-"));
  const tgSeries = JSON.parse(readFileSync(join(REPO, "form-api", "tg-series.json"), "utf8"));
  tgSeries.firstDay = "2026-09-01";
  tgSeries.skipDays = [];
  writeFileSync(join(dataDir, "tg-series.json"), JSON.stringify(tgSeries));
  PORT = await new Promise<number>((resolve) => {
    const s = createNetServer().listen(0, "127.0.0.1", () => {
      const p = (s.address() as { port: number }).port;
      s.close(() => resolve(p));
    });
  });
  Object.assign(process.env, {
    PORT: String(PORT),
    DATA_DIR: dataDir,
    FORM_API_ENV: join(dataDir, "нет.env"),
    TG_SERIES_FILE: join(dataDir, "tg-series.json"),
    TG_WORKSHOP_BOT_TOKEN: BOT_TOKEN,
    TG_WORKSHOP_WEBHOOK_SECRET: "e2e-hook-secret-0123456",
    TG_GO_SECRET: "e2e-go-secret-0123456789",
    TG_LINK_OWNER_IDS: String(OWNER_CHAT),
    ADMIN_APP_IDS: String(ADMIN_ID),
    ADMIN_APP_PIN: PIN,
    ADMIN_APP_SECRET: "e2e-session-secret-0123456789",
    WA_GROUPS: "on",
    EVOLUTION_API_KEY: EVO_KEY,
  });
  delete process.env.TG_BOT;
  delete process.env.WA_TARGET;
  delete process.env.WA_ADMIN_NUMBERS;
  delete process.env.WA_SERIES_FILE;
  setUtcOffsetMinutes(300);

  // Настоящий server.ts. Таймеры планировщика и модуля на время загрузки гасим: ходом времени управляет тест, а не часы компьютера.
  const realInterval = globalThis.setInterval;
  const realTimeout = globalThis.setTimeout;
  (globalThis as any).setInterval = () => ({ ref() {}, unref() {} });
  (globalThis as any).setTimeout = ((fn: any, ms?: number, ...a: any[]) => (typeof ms === "number" && ms === 5000 ? { ref() {}, unref() {} } : realTimeout(fn, ms, ...a))) as typeof setTimeout;
  try {
    ({ server } = await import("./server"));
  } finally {
    globalThis.setInterval = realInterval;
    globalThis.setTimeout = realTimeout;
  }
  await new Promise<void>((resolve) => (server.listening ? resolve() : server.once("listening", () => resolve())));
  const r = _waRt();
  assert.ok(r, "модуль WhatsApp запущен вместе с сервером");
  r.deps.now = () => clock.t;
  r.deps.sleep = async () => {};
  r.deps.rand = () => 0.5;
});

test.after(async () => {
  resetWaGroups();
  server?.closeAllConnections();
  await new Promise<void>((r) => server.close(() => r()));
  await tg.stop();
  await evo.stop();
  await openai.stop();
  assert.deepEqual(evo.violations, [], "защита номера: ни одного сообщения людям и добавления участников");
});

test("доступ: без initData, чужой аккаунт, неверный пароль, без токена сессии; страница отдаётся со вкладкой WhatsApp", async () => {
  // страница
  const page = await call("GET", "/api/admin-app");
  assert.equal(page.status, 200);
  assert.match(page.text, /\['wa', 'WhatsApp'\]/, "вкладка есть");
  assert.match(page.headers.get("content-security-policy") || "", /img-src 'self' data:/, "QR-картинке data: разрешён");
  assert.equal(page.text.includes(EVO_KEY), false);
  // без initData и без сессии
  assert.equal((await call("GET", "/api/admin/wa/state")).status, 403);
  assert.equal((await call("POST", "/api/admin/wa/logout", { body: { confirm: true } })).status, 403);
  // чужой аккаунт с настоящей подписью
  const stranger = initDataFor(STRANGER_ID);
  assert.equal((await call("POST", "/api/admin/login", { body: { initData: stranger, pin: PIN } })).status, 403);
  assert.equal((await call("GET", "/api/admin/wa/state", { init: stranger, token: "x.y" })).status, 403);
  // подделанная подпись и устаревшая initData
  assert.equal((await call("GET", "/api/admin/wa/state", { init: initDataFor(ADMIN_ID, "OTHER:token") })).status, 403);
  assert.equal((await call("GET", "/api/admin/wa/state", { init: initDataFor(ADMIN_ID, BOT_TOKEN, Math.floor(Date.now() / 1000) - 3 * 86400) })).status, 403);
  // initData верна, но сессии нет
  assert.equal((await call("GET", "/api/admin/wa/state", { init: init() })).status, 401);
  assert.equal((await call("GET", "/api/admin/wa/state", { init: init(), token: "fake.session-token" })).status, 401);
  // неверный пароль, потом верный
  const bad = await call("POST", "/api/admin/login", { body: { initData: init(), pin: "0000" } });
  assert.deepEqual([bad.status, bad.json.error], [401, "bad_pin"]);
  const ok = await call("POST", "/api/admin/login", { body: { initData: init(), pin: PIN } });
  assert.equal(ok.status, 200);
  token = ok.json.token;
  assert.ok(token.length > 20);
  assert.equal((await wa("GET", "state")).status, 200);
});

test("пульт: состояние по умолчанию: ежедневный режим, создание выключено, подключения ещё нет", async () => {
  const r = keep(await wa("GET", "state"));
  assert.equal(r.headers.get("cache-control"), "no-store");
  const s = r.json;
  assert.deepEqual([s.ok, s.enabled, s.running, s.mode, s.daily.enabled, s.module.paused, s.conn.state], [true, true, true, "daily", false, false, "unknown"]);
  assert.equal(s.link.kind, "permanent");
  assert.equal(await link(), PERMANENT, "модуль включён, сообщества нет: постоянная ссылка");
  await pageGoes(PERMANENT, "кнопка шаблона без сообщества ведёт на постоянную");
  assert.equal(s.series.length, 22, "18 сообщений дня эфира и 4 на следующий день (лента v3.3)");
  assert.deepEqual(s.journal, []);
  // создавать нечего: тик в 20:00 ничего не делает при выключенном создании
  at(8, 20, 0, 0);
  assert.equal((await waTick()).created, 0);
  at(8, 12, 0, 0);
});

test("QR до состояния open: инстанса нет, создаётся; повторные запросы и проверка подключения; после сканирования номер и имя", async () => {
  const q1 = keep(await wa("POST", "qr", {}));
  assert.equal(q1.status, 200);
  assert.equal(q1.json.state, "connecting");
  assert.equal(q1.json.qr, `data:image/png;base64,${PNG_B64}`);
  assert.equal(evo.of("/instance/create").length, 1);
  // пульт обновляет QR каждые 15 до 20 секунд, проверяя подключение чаще
  clock.t += 4000;
  const c1 = keep(await wa("GET", "connection"));
  assert.deepEqual([c1.json.state, c1.json.number], ["connecting", ""]);
  clock.t += 14_000;
  const q2 = keep(await wa("POST", "qr", {}));
  assert.equal(q2.json.state, "connecting");
  assert.equal(evo.of("/instance/connect/").length, 1, "второй QR берётся у существующего инстанса");
  assert.equal(evo.of("/instance/create").length, 1);
  // человек отсканировал QR
  evo.scan();
  clock.t += 4000;
  const c2 = keep(await wa("GET", "connection"));
  assert.deepEqual([c2.json.state, c2.json.number, c2.json.profile], ["open", "+77001112233", "Тест"]);
  const q3 = keep(await wa("POST", "qr", {}));
  assert.deepEqual([q3.json.state, q3.json.qr, q3.json.number], ["open", null, "+77001112233"]);
  const s = (await wa("GET", "state")).json;
  assert.deepEqual([s.conn.state, s.conn.number, s.conn.profile], ["open", "+77001112233", "Тест"]);
  assert.ok(s.journal.some((j: any) => /Запрошен QR/.test(j.text)));
  assert.equal(evo.calls.every((c) => c.key === EVO_KEY), true, "к Evolution все запросы с ключом, в браузер он не уходит");
});

test("отключение номера: без подтверждения 400, с подтверждением Evolution получает logout, затем номер подключается снова", async () => {
  assert.equal((await wa("POST", "logout", {})).status, 400);
  assert.equal(evo.logouts, 0);
  const out = keep(await wa("POST", "logout", { confirm: true }));
  assert.equal(out.status, 200, out.text);
  assert.equal(evo.logouts, 1);
  assert.deepEqual(evo.seq().filter((x) => x.includes("logout")), ["DELETE /instance/logout"]);
  const s = (await wa("GET", "state")).json;
  assert.deepEqual([s.conn.state, s.conn.number], ["close", ""]);
  assert.ok(s.journal.some((j: any) => j.text === "Номер отключён"));
  // без подключения модуль ничего не делает; через час владельцу уходит напоминание в Telegram
  tg.reset();
  clock.t += 70 * 60_000;
  assert.equal((await waTick()).skipped, "no_connection");
  assert.ok(tg.texts(OWNER_CHAT).some((t) => /WhatsApp не подключён \(состояние: close\)/.test(t)), "тревога дошла до подставного Telegram");
  // подключаем заново по QR
  const q = keep(await wa("POST", "qr", {}));
  assert.equal(q.json.state, "close");
  assert.ok(q.json.qr);
  evo.scan();
  clock.t += 5000;
  assert.equal((await wa("GET", "connection")).json.state, "open");
  at(8, 12, 0, 0);
  await waTick(); // тик возвращает модуль в рабочее состояние
});

test("статус WhatsApp и код по номеру через настоящий сервер: доступ, состояния, причина отключения, номер закрыт, подключение по коду", async () => {
  // без initData и без сессии статус и код недоступны
  assert.equal((await call("GET", "/api/admin/wa/status")).status, 403);
  assert.equal((await call("GET", "/api/admin/wa/status", { init: init() })).status, 401);
  assert.equal((await call("POST", "/api/admin/wa/pairing", { init: init(), body: { number: "447911123456" } })).status, 401);
  assert.equal((await call("POST", "/api/admin/wa/pairing", { body: { number: "447911123456" } })).status, 403);
  // подключён: номер с закрытой серединой
  clock.t += 5000;
  const ok = keep(await wa("GET", "status"));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "no-store");
  assert.deepEqual([ok.json.ok, ok.json.kind, ok.json.tone, ok.json.title, ok.json.number, ok.json.profile], [true, "connected", "ok", "Подключён", "7700***2233", "Тест"]);
  assert.equal(ok.text.includes("77001112233"), false);
  // вышел из устройства
  evo.disconnectWith(401, "Logged Out");
  clock.t += 5000;
  const out = keep(await wa("GET", "status"));
  assert.deepEqual([out.status, out.json.kind, out.json.title, out.json.reasonCode], [200, "logged_out", "Номер вышел из устройства (logout), нужно подключить заново", 401]);
  // заблокирован
  evo.disconnectWith(403, "Forbidden");
  clock.t += 5000;
  const ban = keep(await wa("GET", "status"));
  assert.deepEqual([ban.json.kind, ban.json.title], ["banned", "Номер заблокирован WhatsApp"]);
  // экран получает последний статус вместе с остальным состоянием
  assert.equal((await wa("GET", "state")).json.status.kind, "banned");
  // Evolution молчит: тоже статус, ответ 200
  const savedUrl = process.env.EVOLUTION_URL;
  process.env.EVOLUTION_URL = "http://127.0.0.1:1";
  clock.t += 5000;
  const down = keep(await wa("GET", "status"));
  process.env.EVOLUTION_URL = savedUrl;
  assert.deepEqual([down.status, down.json.ok, down.json.kind, down.json.title], [200, true, "unreachable", "Evolution не отвечает"]);
  // код по номеру: плохие номера 400, хороший отдаёт код и закрытый номер
  const callsBefore = evo.calls.length;
  for (const bad of [undefined, "", "abc", "12345", "1".repeat(16)]) {
    const r = keep(await wa("POST", "pairing", { number: bad }));
    assert.deepEqual([r.status, r.json.code], [400, "bad_number"], String(bad));
  }
  assert.equal(evo.calls.length, callsBefore, "плохой номер до Evolution не доходит");
  clock.t += 5000;
  const code = keep(await wa("POST", "pairing", { number: "447911123456" }));
  assert.equal(code.status, 200, code.text);
  assert.deepEqual([code.json.state, code.json.pairingCode, code.json.number, code.json.ttlSec], ["connecting", "PC013456", "4479***3456", 60]);
  assert.equal(code.text.includes("447911123456"), false, "номер в ответе закрыт");
  assert.equal(evo.of("/instance/connect/").at(-1)!.query.get("number"), "447911123456");
  assert.equal((await wa("GET", "status")).json.kind, "waiting");
  // человек ввёл код на телефоне
  evo.scan();
  clock.t += 5000;
  const done = keep(await wa("GET", "status"));
  assert.deepEqual([done.json.kind, done.json.number], ["connected", "7700***2233"]);
  const again = keep(await wa("POST", "pairing", { number: "447911123456" }));
  assert.deepEqual([again.status, again.json.code], [409, "connected"], "подключённому номеру код не нужен");
  assert.ok((await wa("GET", "state")).json.journal.some((j: any) => j.text === "Запрошен код для подключения номера по телефону"));
  await waTick();
});

test("защита действий: переключение режима, создание и отправка не принимаются без подтверждения; ежедневное в живом эфире закрыто", async () => {
  assert.equal((await wa("POST", "mode", { mode: "event" })).status, 400);
  assert.equal((await wa("POST", "mode", { mode: "weekly", confirm: true })).status, 400);
  assert.equal((await wa("POST", "daily", { enabled: true })).status, 400, "включение создания только с подтверждением");
  assert.equal((await wa("POST", "daily/create", {})).status, 400);
  assert.equal((await wa("POST", "event/create", {})).status, 400);
  assert.equal((await wa("POST", "event/reset", {})).status, 400);
  assert.equal((await wa("POST", "send", { id: "offer" })).status, 400);
  assert.equal((await wa("POST", "nope", { confirm: true })).status, 404);
  assert.equal((await wa("GET", "nope")).status, 404);
  assert.equal(evo.of("/community/create").length, 0);
  assert.equal(evo.of("/message/").length, 0);
  // режим event: ежедневное создание выключается и больше не включается
  const m = keep(await wa("POST", "mode", { mode: "event", confirm: true }));
  assert.equal(m.status, 200, m.text);
  assert.equal((await wa("GET", "state")).json.mode, "event");
  assert.equal((await wa("POST", "daily", { enabled: true, confirm: true })).status, 409);
  assert.equal((await wa("POST", "daily/create", { confirm: true })).status, 409);
  // выключить можно без подтверждения
  assert.equal((await wa("POST", "daily", { enabled: false })).status, 200);
});

test("режим event на 12 октября: настройки проверяются, «Создать сейчас» создаёт сообщество, /api/whatsapp-link отдаёт его ссылку", async () => {
  at(8, 12, 0, 0);
  // кривые настройки
  assert.equal((await wa("POST", "event", { date: "2026-10-07", start: "20:00", recruitFrom: "2026-10-07" })).status, 400);
  assert.equal((await wa("POST", "event", { date: "2026-10-12", start: "09:00", recruitFrom: "2026-10-09" })).status, 400);
  assert.equal((await wa("POST", "event", { date: "2026-10-12", start: "20:00", recruitFrom: "2026-10-13" })).status, 400);
  const set = keep(await wa("POST", "event", { date: "2026-10-12", start: "20:00", recruitFrom: "2026-10-09" }));
  assert.equal(set.status, 200, set.text);
  assert.match(set.json.message, /Сообщество создам 09\.10 в 10:00/);
  let s = (await wa("GET", "state")).json;
  assert.deepEqual([s.event.date, s.event.start, s.event.recruitFrom, s.event.status, s.event.locked], ["2026-10-12", "20:00", "2026-10-09", "scheduled", false]);
  assert.equal(await link(), PERMANENT, "до создания ссылка постоянная");

  evo.calls = [];
  const made = keep(await wa("POST", "event/create", { confirm: true }));
  assert.equal(made.status, 200, made.text);
  assert.equal(made.json.code, "created");
  assert.equal(evo.of("/community/create").length, 1);
  assert.equal(evo.of("/community/create")[0].body.subject, "Вайб-продакшен · эфир 12.10");
  s = (await wa("GET", "state")).json;
  const card = s.current.cards[0];
  assert.deepEqual([card.name, card.ready, card.onSite, card.source], ["Вайб-продакшен · эфир 12.10", true, true, "event"]);
  assert.match(card.link, /^https:\/\/chat\.whatsapp\.com\/INV/);
  assert.equal(await link(), card.link, "ссылка на сайте теперь ведёт в сообщество эфира");
  assert.notEqual(card.link, PERMANENT);
  await pageGoes(card.link, "режим event: кнопка шаблона ведёт в сообщество эфира");
  assert.ok(tyLines().some((x) => x.ch === "wa-template"), "переход записан в журнал переходов с каналом wa-template");
  assert.deepEqual([...new Set(tyLines().map((x) => x.ch))], ["wa-template"]);
  assert.deepEqual([s.link.kind, s.event.status, s.event.locked], ["event", "recruiting", true]);
  // повторная кнопка не создаёт второе, даты закреплены
  evo.calls = [];
  assert.equal((await wa("POST", "event/create", { confirm: true })).json.code, "exists");
  assert.equal(evo.of("/community/create").length, 0);
  assert.equal((await wa("POST", "event", { date: "2026-10-13", start: "20:00", recruitFrom: "2026-10-09" })).status, 409);
  assert.ok((await wa("GET", "state")).json.journal.some((j: any) => j.kind === "ok" && j.text === "Создано «Вайб-продакшен · эфир 12.10»"));
});

test("заявки на вступление: симуляция заявок, автоодобрение, журнал, счётчик «вступили сегодня» в пульте", async () => {
  const t = _waRt()!.state.targets.find((x) => x.day === "2026-10-12")!;
  at(9, 11, 0, 0);
  evo.members.set(t.jid, 37);
  await waTick(); // подключение, участники
  evo.requests.set(t.jid, [
    { jid: "55501234567@lid", phone_number: "77010000001", request_method: "invite_link" },
    { jid: "77010000002@s.whatsapp.net", request_method: "invite_link" },
    { jid: "77010000003@s.whatsapp.net", request_method: "invite_link" },
  ]);
  evo.calls = [];
  assert.equal(await joinsTick(), 3, "три заявки одобрены сами");
  assert.deepEqual(evo.of("/community/requests")[1].body.participants.length, 3);
  assert.equal(evo.of("/community/requests")[1].body.action, "approve");
  clock.t += 2 * 60_000;
  await waTick(); // обновление числа участников
  const s = keep(await wa("GET", "state")).json;
  const card = s.current.cards[0];
  assert.deepEqual([card.joinedToday, card.joinedTotal, card.members], [3, 3, 37]);
  // люди ничего не получают лично: ни одного сообщения не в группу, ни одного добавления
  assert.deepEqual(evo.violations, []);
});

test("ссылка весь период набора; прогрев только в день эфира; офферы после эфира до 00:00; после 00:00 ссылка постоянная", async () => {
  const state = () => _waRt()!.state;
  const t = state().targets.find((x) => x.day === "2026-10-12")!;
  for (const [d, h, mi] of [[9, 10, 5], [10, 12, 0], [10, 20, 45], [11, 20, 41], [12, 8, 0]] as number[][]) {
    at(d, h, mi, 0);
    assert.equal(await link(), t.link, `ссылка ${d}.10 в ${h}:${String(mi).padStart(2, "0")}`);
  }
  // 10 и 11 октября: серия молчит
  for (const [d, h, mi] of [[10, 11, 30], [10, 12, 30], [11, 11, 30], [11, 20, 0]] as number[][]) {
    evo.calls = [];
    at(d, h, mi, 5);
    assert.equal((await waTick()).sent, 0, `${d}.10 ${h}:${mi}`);
    assert.equal(evo.of("/message/").length, 0);
  }
  // день эфира 12 октября: 11:30 картинка и опрос в сообщество эфира
  evo.calls = [];
  at(12, 11, 30, 5);
  assert.equal((await waTick()).sent, 1);
  assert.equal(evo.of("/message/sendMedia")[0].body.number, t.sendJid);
  assert.deepEqual(evo.of("/message/sendPoll")[0].body.values, ["Буду", "Постараюсь", "Не успеваю"]);
  // ручная отправка из пульта: подтверждение обязательно, выбранное сообщение уходит в сообщество эфира один раз
  evo.calls = [];
  at(12, 12, 0, 0);
  const sent = keep(await wa("POST", "send", { id: "reg-bonus", confirm: true }));
  assert.equal(sent.status, 200, sent.text);
  assert.deepEqual([sent.json.sent, sent.json.targets], [1, 1]);
  assert.equal(evo.of("/message/sendMedia")[0].body.number, t.sendJid);
  assert.equal((await wa("POST", "send", { id: "reg-bonus", confirm: true })).json.skipped, 1);
  at(12, 12, 30, 5);
  evo.calls = [];
  await waTick();
  assert.equal(evo.of("/message/").length, 0, "плановое 12:30 не дублирует отправленное вручную");
  // группы и сообщества номера
  const g = keep(await wa("GET", "groups"));
  assert.equal(g.status, 200, g.text);
  assert.deepEqual(g.json.items.map((x: any) => [x.name, x.role, x.size]), [["Воркшоп Вайб-продакшен (общий чат)", "admin", 487], ["Архив эфиров", "owner", 52]]);
  assert.equal(g.text.includes("77015556677"), false, "участников наружу не отдаём");
  // офферы после эфира: ссылки и тренинг уходят в своё время (оффер следом, а не одной пачкой с ними)
  at(12, 20, 15, 5);
  await waTick();
  at(12, 20, 58, 5);
  await waTick();
  at(12, 21, 20, 5);
  evo.calls = [];
  await waTick();
  // оффер длиннее лимита подписи: картинка без подписи, текст отдельным сообщением
  assert.equal(evo.of("/message/sendMedia")[0].body.caption, undefined);
  assert.match(evo.of("/message/sendText")[0].body.text, /Цена для участников эфира: курс Vibe Production/);
  at(12, 23, 59, 0);
  assert.equal(await link(), t.link, "до 00:00 ссылка ещё на сообществе эфира");
  // после 00:00 ссылка постоянная, режим завершён
  at(13, 0, 0, 0);
  assert.equal(await link(), PERMANENT);
  await pageGoes(PERMANENT, "после 00:00 кнопка шаблона ведёт на постоянную");
  evo.calls = [];
  at(13, 0, 0, 5);
  await waTick();
  assert.equal(evo.of("/message/").length, 0, "после 00:00 рассылка закрыта");
  const s = keep(await wa("GET", "state")).json;
  assert.deepEqual([s.mode, s.daily.enabled, s.event.status, s.link.kind], ["daily", false, "done", "permanent"]);
  assert.ok(s.journal.some((j: any) => /Живой эфир 12\.10 завершён/.test(j.text)));
});

test("daily: включили (с подтверждением), в 20:00 создаётся сообщество, до 20:40 ссылка прежняя, в 20:40 подмена; пауза и возобновление", async () => {
  assert.equal(_waRt()!.state.daily.enabled, false);
  at(13, 12, 0, 0);
  const on = keep(await wa("POST", "daily", { enabled: true, confirm: true }));
  assert.equal(on.status, 200, on.text);
  assert.match(on.json.message, /эфир 14\.10, создам 13\.10 в 20:00/);
  assert.equal(JSON.parse(readFileSync(join(dataDir, "wa-state.json"), "utf8")).daily.enabled, true, "в wa-state.json записано");
  // пауза: тик ничего не создаёт
  assert.equal((await wa("POST", "pause", {})).status, 200);
  at(13, 20, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).skipped, "paused");
  assert.equal(evo.of("/community/create").length, 0);
  assert.equal((await wa("POST", "resume", {})).status, 200);
  // 19:59:50 ещё рано, в 20:00 создание
  at(13, 19, 59, 50);
  assert.equal((await waTick()).created, 0);
  evo.calls = [];
  at(13, 20, 0, 0);
  assert.equal((await waTick()).created, 1);
  assert.equal(evo.of("/community/create")[0].body.subject, "Вайб-продакшен · эфир 14.10");
  const t = _waRt()!.state.targets.find((x) => x.day === "2026-10-14")!;
  assert.equal(t.source, undefined, "ежедневное сообщество без пометки живого эфира");
  // до 20:40 записывают на идущий эфир 13-го: сообщества 13-го нет, ссылка постоянная; в 20:40 подмена на сообщество 14-го
  at(13, 20, 39, 59);
  assert.equal(await link(), PERMANENT);
  await pageGoes(PERMANENT, "до 20:40 кнопка шаблона ведёт на постоянную");
  at(13, 20, 40, 0);
  assert.equal(await link(), t.link, "в 20:40 ссылка на сайте переключилась");
  await pageGoes(t.link, "режим daily: кнопка шаблона ведёт в новое сообщество");
  const s = keep(await wa("GET", "state")).json;
  assert.deepEqual([s.mode, s.daily.enabled, s.link.kind], ["daily", true, "daily"]);
  assert.deepEqual([s.next.cards[0].name, s.next.cards[0].onSite, s.next.cards[0].link], ["Вайб-продакшен · эфир 14.10", true, t.link], "следующее сообщество видно в пульте, на него ведёт ссылка сайта");
  assert.deepEqual(s.current.cards, [], "сообщества на сегодняшний эфир нет");
  // выключили: новые не создаются, а ссылка и прогрев созданного работают
  assert.equal((await wa("POST", "daily", { enabled: false })).status, 200);
  at(14, 20, 0, 0);
  assert.equal((await waTick()).created, 0);
  assert.equal(evo.of("/community/create").length, 1);
});

test("итог: ключ Evolution и токен инстанса не попали ни в один ответ, ни в состояние и журналы; защита номера цела", () => {
  const files = readdirSync(dataDir).filter((f) => f.startsWith("wa")).map((f) => readFileSync(join(dataDir, f), "utf8")).join("\n");
  const all = seen.join("\n") + files;
  assert.equal(all.includes(EVO_KEY), false);
  assert.equal(all.includes(INSTANCE_TOKEN), false);
  assert.equal(all.includes(BOT_TOKEN), false);
  assert.equal(files.includes(PNG_B64), false, "QR на диск не пишется");
  assert.equal(all.includes("447911123456"), false, "номер, по которому просили код, нигде не лежит целиком");
  assert.equal(/PC\d{2}4575/.test(files), false, "код подключения на диск не пишется");
  assert.ok(seen.some((x) => x.includes(PNG_B64)), "а в ответ пульту QR попадает: он для того и нужен");
  assert.deepEqual(evo.violations, []);
  for (const c of evo.of("/message/")) assert.ok(String(c.body.number).endsWith("@g.us"), "сообщения только в группы");
});

test("ИИ-ассистент через настоящий сервер: /api/wa-hook (127.0.0.1, секрет, прокси) и маршруты пульта ai/toggle, ai/test, ai/number только под сессией админки", async () => {
  openai.reset();
  process.env.OPENAI_API_KEY = OPENAI_KEY;
  process.env.WA_AI_QUIET_MS = "100000";
  evo.state = "open";
  evo.scan();
  await waTick();
  evo.allowDirect = true;
  evo.directs.length = 0;
  const secretOf = () => (_waRt()!.state as any).assistant.secret as string;
  const hookCall = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base()}/api/wa-hook`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }).then(async (r) => (await r.arrayBuffer(), r.status));
  const msg = (id: string, text: string) => ({ event: "messages.upsert", instance: "workshop", data: { key: { remoteJid: "77015556677@s.whatsapp.net", fromMe: false, id }, message: { conversation: text }, messageTimestamp: Math.floor(clock.t / 1000) } });

  // доступ: без сессии админки 403; включение без подтверждения 400
  assert.equal((await call("POST", "/api/admin/wa/ai/toggle", { body: { enabled: true, confirm: true } })).status, 403);
  assert.equal((await call("POST", "/api/admin/wa/ai/test", { body: { question: "привет" } })).status, 403);
  assert.equal((await call("GET", "/api/admin/wa/ai/number?id=abc")).status, 403);
  assert.equal((await wa("POST", "ai/toggle", { enabled: true })).status, 400);
  assert.equal(JSON.stringify(evo.webhook), "null", "без подтверждения вебхук не ставится");
  // выключенный ассистент: секрета ещё нет, вебхук закрыт
  assert.equal(await hookCall(msg("E0", "Привет")), 401);

  // включили из пульта: вебхук стоит в Evolution с секретом, ключи в ответ пульту не попадают
  const on = keep(await wa("POST", "ai/toggle", { enabled: true, confirm: true }));
  assert.equal(on.status, 200, on.text);
  assert.equal(evo.webhook?.enabled, true);
  assert.equal(evo.webhook?.headers?.["X-Wa-Hook-Secret"], secretOf());
  const secret = secretOf();

  // вебхук: секрет и локальный адрес
  assert.equal(await hookCall(msg("E1", "Привет")), 401, "без секрета");
  assert.equal(await hookCall(msg("E1", "Привет"), { "X-Wa-Hook-Secret": "wrong" }), 401, "чужой секрет");
  assert.equal(await hookCall(msg("E1", "Привет"), { "X-Wa-Hook-Secret": secret, "X-Forwarded-For": "203.0.113.9" }), 403, "через прокси");
  assert.equal((await fetch(`${base()}/api/wa-hook`, { headers: { "X-Wa-Hook-Secret": secret } })).status, 404, "только POST");
  assert.equal(openai.calls.length, 0);
  assert.equal(await hookCall(msg("E1", "Когда эфир?"), { "X-Wa-Hook-Secret": secret }), 200);
  await aiFlush();
  assert.equal(evo.directs.length, 1);
  assert.equal(evo.directs[0].to, "77015556677@s.whatsapp.net");

  // пульт: состояние с блоком ассистента, проверка вопроса, номер по id
  const st = keep(await wa("GET", "state")).json;
  assert.deepEqual([st.assistant.enabled, st.assistant.counters.replies, st.assistant.dialogs[0].who], [true, 1, "7701***6677"]);
  assert.equal(JSON.stringify(st).includes("77015556677"), false);
  clock.t += 5000;
  const t = keep(await wa("POST", "ai/test", { question: "Что будет на эфире?" }));
  assert.deepEqual([t.status, t.json.verdict], [200, "ok"]);
  assert.equal(evo.directs.length, 1, "проверка в WhatsApp не отправляет");
  assert.equal((await wa("POST", "ai/test", { question: "" })).status, 400);
  const num = keep(await wa("GET", `ai/number?id=${st.assistant.dialogs[0].id}`));
  assert.deepEqual([num.status, num.json.number], [200, "+77015556677"]);
  assert.equal((await wa("GET", "ai/number?id=nope")).status, 404);

  // выключили: вебхук снят, больше никому не отвечаем
  assert.equal((await wa("POST", "ai/toggle", { enabled: false })).status, 200);
  assert.equal(evo.webhook?.enabled, false);
  const calls = openai.calls.length;
  assert.equal(await hookCall(msg("E2", "Ещё вопрос"), { "X-Wa-Hook-Secret": secret }), 200);
  await aiFlush();
  assert.equal(evo.directs.length, 1);
  assert.equal(openai.calls.length, calls);
  assert.equal(seen.join("\n").includes(OPENAI_KEY) || seen.join("\n").includes(secret), false, "ни ключа OpenAI, ни секрета вебхука в ответах пульта");
  evo.allowDirect = false;
});

test("дожим WABA через настоящий сервер: маршруты пульта только под сессией админки и с подтверждением, вебхук Wazzup с секретом в адресе, тест и ответ на кнопку присылают ссылку", async () => {
  await wazzup.start();
  const saved = { ...process.env };
  Object.assign(process.env, { WAZZUP_API_KEY: WZ_KEY, WAZZUP_CHANNEL_ID: WZ_CHANNEL, WAZZUP_HOOK_SECRET: WZ_SECRET, WAZZUP_HOOK_URL: `${base()}/api/wazzup-hook` });
  const dump: string[] = [];
  const dz = async (method: "GET" | "POST", path: string, body?: unknown) => {
    const r = await wa(method, `dozhim/${path}`, body);
    dump.push(r.text);
    return r;
  };
  const hookUrl = (secret: string) => `${base()}/api/wazzup-hook?s=${secret}`;
  try {
    // доступ: без сессии админки все пять маршрутов закрыты
    for (const [m, path] of [["GET", "templates"], ["POST", "toggle"], ["POST", "save"], ["POST", "hook"], ["POST", "test"]] as const) {
      assert.equal((await call(m, `/api/admin/wa/dozhim/${path}`, { body: m === "POST" ? { enabled: false, on: false, confirm: true, number: "77011234567" } : undefined })).status, 403, path);
      assert.equal((await call(m, `/api/admin/wa/dozhim/${path}`, { init: init(), body: m === "POST" ? { confirm: true } : undefined })).status, 401, path);
    }
    assert.equal(wazzup.calls.length, 0, "без сессии Wazzup не трогаем");

    // шаблоны: только одобренные; выбрали запасной
    const tpl = await dz("GET", "templates");
    assert.equal(tpl.status, 200, tpl.text);
    assert.deepEqual(tpl.json.items.map((t: any) => t.id), [TPL_REMINDER, TPL_LINK], "основной на модерации не предлагается");
    assert.equal(tpl.text.includes(WZ_KEY), false);
    const sv = await dz("POST", "save", { templateId: TPL_REMINDER, delayMin: 30, from: "09:00", to: "21:00", cutoff: "19:30", dailyLimit: 200 });
    assert.equal(sv.status, 200, sv.text);
    assert.equal((await dz("POST", "save", { templateId: "нет-такого" })).status, 404);
    assert.equal((await dz("POST", "save", { delayMin: -5 })).status, 400);

    // состояние пульта содержит блок дожима
    clock.t += 5000;
    const st0 = (await wa("GET", "state")).json.dozhim;
    assert.deepEqual([st0.available, st0.enabled, st0.template.id, st0.canEnable], [true, false, TPL_REMINDER, true]);

    // включение и вебхук только с подтверждением
    assert.equal((await dz("POST", "toggle", { enabled: true })).status, 400);
    assert.equal((await dz("POST", "hook", { on: true })).status, 400);
    assert.equal((await dz("POST", "test", { number: "77011234567" })).status, 400);
    assert.equal(wazzup.sent.length + wazzup.of("PATCH", "/v3/webhooks").length, 0);
    const on = await dz("POST", "toggle", { enabled: true, confirm: true });
    assert.equal(on.status, 200, on.text);
    const hk = await dz("POST", "hook", { on: true, confirm: true });
    assert.equal(hk.status, 200, hk.text);
    // Wazzup проверил адрес тестовым POST на настоящий сервер и получил 200; в ответе пульту секрета нет
    assert.equal(wazzup.hooks.webhooksUri, hookUrl(WZ_SECRET));
    assert.equal(hk.text.includes(WZ_SECRET), false);

    // адрес вебхука: только POST и только с верным секретом
    assert.equal((await fetch(hookUrl(WZ_SECRET))).status, 405);
    assert.equal((await fetch(hookUrl("wrong"), { method: "POST", body: "{}" })).status, 403);
    assert.equal((await fetch(`${base()}/api/wazzup-hook`, { method: "POST", body: "{}" })).status, 403);
    assert.equal((await fetch(hookUrl(WZ_SECRET), { method: "POST", body: JSON.stringify({ test: true }) })).status, 200);

    // тестовая отправка и ответ на кнопку
    clock.t += 15_000;
    const t = await dz("POST", "test", { number: "8 701 123 45 67", confirm: true });
    assert.equal(t.status, 200, t.text);
    assert.equal(t.text.includes("77011234567"), false, "номер в ответе закрыт");
    assert.match(t.json.message, /7701\*\*\*4567/);
    assert.equal(wazzup.sent.length, 1);
    assert.deepEqual([wazzup.sent[0].chatId, wazzup.sent[0].templateId], ["77011234567", TPL_REMINDER]);
    wazzup.windows.add("77011234567");
    const reply = async (text: string, messageId: string) => {
      const r = await fetch(hookUrl(WZ_SECRET), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wzInbound({ chatId: "77011234567", text, messageId })) });
      assert.equal(r.status, 200);
      await dzFlush();
    };
    await reply("Да, буду вовремя", "e2e-1");
    const links = wazzup.sent.filter((x) => x.text !== undefined);
    assert.equal(links.length, 1);
    assert.match(links[0].text!, /^Вот ссылка на сообщество участников, ссылка на эфир придёт туда в 19:50: https:\/\/(chat\.whatsapp\.com\/\S+|onai\.academy\/workshop-montazh\/wa)$/);
    await reply("Да, буду вовремя", "e2e-1");
    await reply("Спасибо", "e2e-2");
    assert.equal(wazzup.sent.filter((x) => x.text !== undefined).length, 1, "ссылка одна, дубль messageId без повтора");
    // чужая переписка номера: ни ответа, ни записи
    wazzup.windows.add("77090000001");
    const calls = wazzup.calls.length;
    const foreign = await fetch(hookUrl(WZ_SECRET), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wzInbound({ chatId: "77090000001", text: "Нет", messageId: "e2e-f1" })) });
    assert.equal(foreign.status, 200);
    await dzFlush();
    assert.equal(wazzup.calls.length, calls);

    // пульт после сценария: счётчики и закрытые номера, секретов нет
    const st1 = await wa("GET", "state");
    dump.push(JSON.stringify({ dozhim: st1.json.dozhim, journal: st1.json.journal }));
    assert.equal(st1.json.dozhim.enabled, true);
    assert.equal(st1.json.dozhim.webhook.on, true);
    assert.equal(st1.json.dozhim.recent[0].who, "7701***4567");
    assert.equal(st1.json.dozhim.recent[0].test, true);
    assert.ok(st1.json.journal.some((j: any) => j.text === "Дожим WABA включён"));
    assert.ok(st1.json.journal.some((j: any) => j.text === "Вебхук Wazzup поставлен"));

    // выключили и сняли вебхук: больше ничего не обрабатывается
    assert.equal((await dz("POST", "toggle", { enabled: false })).status, 200);
    assert.equal((await dz("POST", "hook", { on: false })).status, 200);
    assert.equal(wazzup.hooks.webhooksUri, "");
    const n = wazzup.calls.length;
    await reply("Пришлите ссылку", "e2e-3");
    assert.equal(wazzup.calls.length, n, "выключен и вебхук снят: ответ не обрабатывается");
    const all = dump.join("\n");
    assert.equal(all.includes(WZ_KEY) || all.includes(WZ_SECRET) || /\b77\d{9}\b/.test(all), false, "ни ключа Wazzup, ни секрета вебхука, ни полных номеров в ответах пульта");
  } finally {
    await wazzup.stop();
    for (const k of ["WAZZUP_API_KEY", "WAZZUP_CHANNEL_ID", "WAZZUP_HOOK_SECRET", "WAZZUP_HOOK_URL", "WAZZUP_API_URL"]) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
});
