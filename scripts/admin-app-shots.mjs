/**
 * admin-app-shots.mjs: снимки мини-приложения админки воркшопа (Playwright, 390x844).
 *
 * Берёт собранный form-api/dist/server.js, поднимает его на порту 4111 с тестовыми ключами и выдуманными данными
 * (имена и телефоны ненастоящие), подставляет вместо telegram-web-app.js свой Telegram WebApp с initData,
 * подписанной тестовым токеном бота, и снимает экраны в docs/reports/admin-app-1007/.
 * Реальный Telegram не трогается (TG_API_BASE указывает на закрытый порт), настоящих ключей и пароля тут нет.
 *
 * Запуск из корня репозитория после сборки dist:
 *   node scripts/admin-app-shots.mjs
 * Одновременно с другими тяжёлыми задачами не запускать (замок C:\Проекты\_общее\heavy.ps1).
 */
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "reports", "admin-app-1007");
const PORT = 4111;
const BASE = `http://127.0.0.1:${PORT}`;
const BOT_TOKEN = "1234567890:TEST-token-for-screenshots-only";
const PIN = "test-pin-4821";
const SECRET = "test-secret-for-screenshots-0123456789";
const USER_ID = 789638302;

// ───────── выдуманные данные ─────────

function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const OFFSET = 5 * 3600e3;
const dayKey = (ms) => new Date(ms + OFFSET).toISOString().slice(0, 10);
const addDay = (d, n) => dayKey(Date.parse(`${d}T12:00:00Z`) - OFFSET + n * 86400e3 + OFFSET);
const at = (d, h, m) => Date.parse(`${d}T00:00:00Z`) - OFFSET + (h * 60 + m) * 60e3;

const FIRST = ["Айгерим", "Данияр", "Мадина", "Ерлан", "Алия", "Ильяс", "Динара", "Тимур", "Салтанат", "Арман", "Жанар", "Руслан", "Камила", "Нурлан", "Асель", "Бауыржан", "Мария", "Андрей", "Ольга", "Сергей", "Гульнара", "Максат", "Аружан", "Виктор"];
const LAST = ["Сериков", "Ахметова", "Нурпеисов", "Каримова", "Омаров", "Жумабаева", "Ибраев", "Султанова", "Петров", "Смирнова", "Касымов", "Тулегенова", "Иванов", "Абдрахманова", "Бекова", "Ким"];
const PLACES = ["hero", "hero", "popup", "popup", "dock", "header", "final", "program"];

function seed(dir, now) {
  const r = rng(20261007);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const today = dayKey(now);
  const leads = [];
  const subs = [];
  const sent = [];
  const clicks = [];
  const ty = [];
  let chat = 700100000;
  for (let back = 13; back >= 0; back--) {
    const d = addDay(today, -back);
    const count = back === 0 ? 17 : 14 + Math.floor(r() * 30);
    const maxMs = back === 0 ? now : at(d, 23, 40);
    for (let i = 0; i < count; i++) {
      const ts = Math.min(maxMs - 60e3, at(d, 8, 0) + Math.floor(r() * (maxMs - at(d, 8, 0))));
      const roll = r();
      const utm = roll < 0.5 ? { utm_source: "instagram", utm_medium: "paid_social", utm_campaign: pick(["efir_0710", "efir_0710", "reels_montazh"]) }
        : roll < 0.65 ? { utm_source: "saint4aibio" }
        : roll < 0.75 ? { utm_source: "youtube", utm_medium: "organic" }
        : roll < 0.9 ? { utm_referrer: pick(["https://l.instagram.com/?u=x", "instagram.com", "https://t.me/saint4ai"]) }
        : {};
      const id = `lead-${d}-${i}`;
      const eventId = `ev${d.replace(/-/g, "")}${i}`;
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const phone = `+7 7${pick(["01", "02", "05", "07", "75", "77"])} 555 ${String(Math.floor(r() * 100)).padStart(2, "0")} ${String(Math.floor(r() * 100)).padStart(2, "0")}`;
      leads.push({ kind: "capture", id, eventId, name, phone, source: `efir-1-okt-${pick(PLACES)}`, utm, ts: new Date(ts).toISOString() });
      if (r() < 0.62) {
        chat++;
        const fromTy = r() < 0.55;
        const hour = Number(new Date(ts + OFFSET).toISOString().slice(11, 13));
        subs.push({
          type: "start", chat_id: chat, user_id: chat, username: r() < 0.6 ? `user_${chat % 100000}` : undefined, first_name: name.split(" ")[0], language_code: "ru",
          payload: `${fromTy ? "ty" : "pp"}_${eventId}`, streamDay: hour >= 20 ? addDay(d, 1) : d, ts: new Date(ts + 120e3).toISOString(),
        });
        if (r() < 0.7) ty.push({ ch: r() < 0.62 ? "tg" : "wa", eid: eventId, day: d, ts: new Date(ts + 60e3).toISOString(), src: fromTy ? "ty" : "pp" });
      } else if (r() < 0.5) {
        ty.push({ ch: "wa", eid: eventId, day: d, ts: new Date(ts + 60e3).toISOString(), src: "ty" });
      }
    }
    for (let i = 0; i < 2 + Math.floor(r() * 3); i++) {
      chat++;
      const ts = at(d, 9, 0) + Math.floor(r() * 36e5 * 10);
      subs.push({ type: "start", chat_id: chat, user_id: chat, username: `twogis_${chat % 10000}`, first_name: pick(FIRST), language_code: "ru", payload: pick(["2gis", "2gis_card"]), streamDay: d, ts: new Date(Math.min(ts, maxMs)).toISOString() });
    }
    if (r() < 0.8) {
      chat++;
      subs.push({ type: "start", chat_id: chat, user_id: chat, first_name: pick(FIRST), language_code: "ru", payload: "", streamDay: d, ts: new Date(at(d, 13, 10)).toISOString() });
    }
  }
  const events = [...subs];
  for (const s of subs) {
    if (Date.parse(s.ts) > now) continue;
    if (r() < 0.38) clicks.push({ chat_id: s.chat_id, day: s.streamDay, ts: new Date(at(s.streamDay, 20, 5 + Math.floor(r() * 20))).toISOString() });
    if (r() < 0.07) events.push({ type: "paid", chat_id: s.chat_id, by: "self", ts: new Date(at(s.streamDay, 21, 10)).toISOString() });
    if (r() < 0.04) events.push({ type: "blocked", chat_id: s.chat_id, ts: new Date(Math.min(now, at(s.streamDay, 12, 3))).toISOString() });
  }
  for (const s of subs) {
    if (at(s.streamDay, 12, 0) > now) continue;
    for (const [msg, hh, mm] of [["warm-1200", 12, 0], ["warm-1700", 17, 0], ["link-1950", 19, 50], ["live-2000", 20, 0], ["topic-p1", 20, 15]]) {
      if (at(s.streamDay, hh, mm) > now) continue;
      const bad = r() < 0.03;
      sent.push({ msg, day: s.streamDay, chat_id: s.chat_id, ts: new Date(at(s.streamDay, hh, mm) + 5e3).toISOString(), ok: !bad, ...(bad ? { err: r() < 0.7 ? "403 Forbidden: bot was blocked by the user" : "400 Bad Request: chat not found" } : {}) });
    }
  }
  const jl = (rows) => rows.map((x) => JSON.stringify(x)).join("\n") + "\n";
  const data = join(dir, "data");
  mkdirSync(data, { recursive: true });
  writeFileSync(join(dir, "leads.jsonl"), jl(leads));
  writeFileSync(join(data, "tg-subscribers.jsonl"), jl(events));
  writeFileSync(join(data, "tg-sent.jsonl"), jl(sent));
  writeFileSync(join(data, "tg-clicks.jsonl"), jl(clicks));
  writeFileSync(join(data, "ty-clicks.jsonl"), jl(ty));
  writeFileSync(join(data, "tg-state.json"), JSON.stringify({ seriesEnabled: true, media: {}, overrides: {}, bizon: "", reported: [], adminReported: [], adminSince: 0 }));
  console.log(`данные: заявок ${leads.length}, подписчиков ${subs.length}, отправок ${sent.length}, кликов ${clicks.length}`);
  return { data };
}

// ───────── подставной Telegram WebApp ─────────

function signInit(fields) {
  const keys = Object.keys(fields).sort();
  const dcs = keys.map((k) => `${k}=${fields[k]}`).join("\n");
  const hash = createHmac("sha256", createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest()).update(dcs).digest("hex");
  return [...keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(fields[k])}`), `hash=${hash}`].join("&");
}
const INIT = signInit({
  auth_date: String(Math.floor(Date.now() / 1000)),
  query_id: "AAH-shots",
  user: JSON.stringify({ id: USER_ID, first_name: "Александр", username: "saint4ai", language_code: "ru" }),
});
const THEMES = {
  light: { bg_color: "#ffffff", text_color: "#000000", hint_color: "#999999", link_color: "#2481cc", button_color: "#2481cc", button_text_color: "#ffffff", secondary_bg_color: "#efeff3", section_bg_color: "#ffffff" },
  dark: { bg_color: "#18222d", text_color: "#ffffff", hint_color: "#7d8b99", link_color: "#6ab3f3", button_color: "#2f6ea5", button_text_color: "#ffffff", secondary_bg_color: "#101921", section_bg_color: "#18222d" },
};
const fakeWebApp = (scheme) =>
  `window.Telegram={WebApp:{initData:${JSON.stringify(INIT)},initDataUnsafe:{},colorScheme:${JSON.stringify(scheme)},themeParams:${JSON.stringify(THEMES[scheme])},ready(){},expand(){},setHeaderColor(){},setBackgroundColor(){},onEvent(){},offEvent(){}}};`;

// ───────── сервер ─────────

async function startServer(dir, data) {
  const env = {
    ...process.env, PORT: String(PORT), DATA_DIR: data, LEADS_LOG_PATH: join(dir, "leads.jsonl"), FORM_API_ENV: join(dir, "нет.env"),
    TG_SERIES_FILE: join(ROOT, "form-api", "tg-series.json"), TG_API_BASE: "http://127.0.0.1:1", TG_WORKSHOP_BOT_TOKEN: BOT_TOKEN,
    TG_WORKSHOP_WEBHOOK_SECRET: "shots-hook-secret-123456", TG_GO_SECRET: "shots-go-secret-1234567", TG_LINK_OWNER_IDS: "",
    ADMIN_APP_PIN: PIN, ADMIN_APP_SECRET: SECRET, ADMIN_APP_IDS: String(USER_ID),
  };
  delete env.ADMIN_APP_HTML;
  delete env.TG_BOT;
  const child = spawn(process.execPath, [join(ROOT, "form-api", "dist", "server.js")], { env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 40 && !/listening on/.test(log); i++) await new Promise((r) => setTimeout(r, 200));
  if (!/listening on/.test(log)) throw new Error("сервер не поднялся: " + log.slice(-300));
  return { child, log: () => log };
}

// ───────── снимки ─────────

const problems = [];
let allow401 = 0;

async function newPage(browser, scheme) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, locale: "ru-RU", timezoneId: "Asia/Almaty", isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) => route.fulfill({ contentType: "application/javascript", body: fakeWebApp(scheme) }));
  page.on("console", (m) => {
    if (!["error", "warning"].includes(m.type())) return;
    // неверный пароль на экране входа отвечает 401, браузер пишет его в консоль: так и задумано
    if (allow401 > 0 && m.text().includes("status of 401")) { allow401--; return; }
    problems.push(`console ${m.type()}: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${String(e).slice(0, 200)}`));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => console.error("CSP: " + e.violatedDirective + " " + e.blockedURI));
  });
  return { page, ctx };
}

async function shot(page, name, full = false) {
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (overflow.sw > overflow.cw) problems.push(`${name}: страница шире экрана (${overflow.sw} > ${overflow.cw})`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: full });
  console.log(`снимок ${name}.png${full ? " (вся страница)" : ""}, ширина ${overflow.sw}/${overflow.cw}`);
}

async function run() {
  mkdirSync(OUT, { recursive: true });
  const dir = mkdtempSync(join(tmpdir(), "admin-shots-"));
  const { data } = seed(dir, Date.now());
  const srv = await startServer(dir, data);
  const browser = await chromium.launch();
  try {
    // светлая тема
    const { page, ctx } = await newPage(browser, "light");
    await page.goto(`${BASE}/api/admin-app`);
    await page.waitForSelector("#login-form");
    await shot(page, "01-vhod");
    await page.fill("#pin", "0000");
    allow401 = 1;
    await page.click("#login-btn");
    await page.waitForFunction(() => document.getElementById("login-err").textContent.length > 0);
    await shot(page, "02-vhod-oshibka");
    await page.fill("#pin", PIN);
    await page.click("#login-btn");
    await page.waitForSelector(".stat");
    await page.click("#chips button:has-text('7 дней')");
    await page.waitForSelector(".chart .bar");
    await shot(page, "03-svodka");
    await shot(page, "03-svodka-polnaya", true);
    await page.click("#tabs button:has-text('Источники')");
    await page.waitForSelector("tr.click");
    await shot(page, "04-istochniki");
    await shot(page, "04-istochniki-polnaya", true);
    // нажатие на строку источника открывает регистрации с этой меткой
    await page.click("tr.click >> nth=0");
    await page.waitForSelector(".row");
    await shot(page, "05-registracii");
    await page.selectOption("select[aria-label='Метка источника']", "");
    await page.waitForSelector(".row");
    await page.fill(".search", "ай");
    await page.waitForTimeout(700);
    await page.waitForSelector(".row");
    await shot(page, "05b-registracii-poisk");
    await page.click("#tabs button:has-text('Подписчики')");
    await page.waitForSelector(".row");
    await shot(page, "06-podpischiki");
    await page.click("#tabs button:has-text('Эфиры')");
    await page.waitForSelector(".kv");
    await shot(page, "07-efiry", true);
    await page.click("#tabs button:has-text('Ошибки')");
    await page.waitForSelector(".kv");
    await shot(page, "08-oshibki", true);
    // день эфира, период «Даты», сегодня по часам
    await page.click("#tabs button:has-text('Сводка')");
    await page.click("#basis button[data-basis=stream]");
    await page.waitForSelector(".stat");
    await page.click("#chips button:has-text('Сегодня')");
    await page.waitForSelector(".chart .grid", { state: "attached" });
    await shot(page, "09-svodka-segodnya-den-efira", true);
    await page.click("#chips button:has-text('Даты')");
    await shot(page, "10-daty");
    // сессия переживает перезагрузку в том же окне (sessionStorage)
    await page.reload();
    await page.waitForSelector(".stat");
    await ctx.close();

    // тёмная тема
    const dark = await newPage(browser, "dark");
    await dark.page.goto(`${BASE}/api/admin-app`);
    await dark.page.waitForSelector("#login-form");
    await shot(dark.page, "11-vhod-temnaya");
    await dark.page.fill("#pin", PIN);
    await dark.page.click("#login-btn");
    await dark.page.waitForSelector(".stat");
    await dark.page.click("#chips button:has-text('7 дней')");
    await dark.page.waitForSelector(".chart .bar");
    await shot(dark.page, "12-svodka-temnaya");
    await shot(dark.page, "12-svodka-temnaya-polnaya", true);
    await dark.page.click("#tabs button:has-text('Регистрации')");
    await dark.page.waitForSelector(".row");
    await shot(dark.page, "13-registracii-temnaya");
    await dark.ctx.close();
  } finally {
    await browser.close();
    srv.child.kill();
  }
  const leaked = /Тест|\+7 7\d\d 555/.test(srv.log()) || srv.log().includes(PIN) || srv.log().includes(INIT);
  if (leaked) problems.push("в логе сервера нашлись телефон, пароль или initData");
  console.log(problems.length ? "\nПроблемы:\n" + problems.join("\n") : "\nПроблем не найдено: без ошибок консоли, CSP-нарушений и горизонтальной прокрутки.");
  process.exitCode = problems.length ? 1 : 0;
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
