#!/usr/bin/env node
/**
 * funnel-check.mjs: проверка воронки воркшопа на проде (лендинг, «Спасибо», form-api, переадресация).
 *
 * Запускать после каждого деплоя воронки (лендинга, thank-you, form-api, nginx):
 *   node scripts/funnel-check.mjs
 *   node scripts/funnel-check.mjs --base=https://onai.academy   (по умолчанию)
 *
 * Node 20+, только fetch, без секретов и без записи данных (одни GET-запросы).
 * Печатает таблицу PASS/FAIL, при любом FAIL код выхода 1.
 */

const arg = process.argv.slice(2).find((a) => a.startsWith("--base="));
const BASE = (arg ? arg.slice(7) : process.env.FUNNEL_BASE || "https://onai.academy").replace(/\/+$/, "");
const TIMEOUT_MS = 15000;
// Код приглашения в группу WhatsApp, который стоит сейчас в хранилище ссылки и на «Спасибо».
// Сменили группу через бота: поправьте здесь или передайте --wa-code=... (или FUNNEL_WA_CODE).
const waArg = process.argv.slice(2).find((a) => a.startsWith("--wa-code="));
const WA_CODE = waArg ? waArg.slice(10) : process.env.FUNNEL_WA_CODE || "IfLyJvWLo7HDq5yleoKCzz";

const rows = [];
const add = (name, pass, detail = "") => rows.push({ name, pass: !!pass, detail: String(detail) });

async function get(path, opts = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": "funnel-check/1.0", accept: "*/*" },
    ...opts,
  });
  const text = opts.redirect === "manual" ? "" : await res.text();
  return { res, text, url: res.url };
}

// Каждая проверка ловит свои ошибки: упавшая сеть даёт FAIL, а не обрыв всего прогона.
async function check(name, fn) {
  try {
    const out = await fn();
    add(name, out.pass, out.detail);
  } catch (e) {
    add(name, false, "ошибка запроса: " + (e && e.cause && e.cause.code ? e.cause.code : e.message));
  }
}

let landing = "";
let thanks = "";

await check("1. Лендинг /workshop-montazh/ отвечает 200 и подключает efir.js", async () => {
  const { res, text } = await get("/workshop-montazh/");
  landing = text;
  const efir = /efir\.js\?v=\d+/.test(text); // с меткой версии: встроенный браузер Instagram кэширует скрипт
  return { pass: res.status === 200 && efir, detail: `HTTP ${res.status}, efir.js?v=: ${efir}` };
});

await check("2. «Спасибо»: 200, кнопка бота и группа WhatsApp, без EasyBot", async () => {
  const { res, text } = await get("/workshop-montazh/thank-you.html");
  thanks = text;
  const tg = text.includes("t.me/workshop_aiprod_bot?start=");
  const wa = text.includes("chat.whatsapp.com");
  const easy = /easybot/i.test(text);
  const efir = /efir\.js\?v=\d+/.test(text);
  return { pass: res.status === 200 && tg && wa && !easy && efir, detail: `HTTP ${res.status}, бот: ${tg}, WhatsApp: ${wa}, easybot: ${easy}, efir.js?v=: ${efir}` };
});

await check("3. /workshop/api/whatsapp-link отдаёт группу с кодом " + WA_CODE.slice(0, 4) + "...", async () => {
  const { res, text } = await get("/workshop/api/whatsapp-link");
  let link = "";
  try { link = JSON.parse(text).link || ""; } catch {}
  const m = link.match(/^https:\/\/chat\.whatsapp\.com\/([^/?#\s]+)/);
  const code = m ? m[1] : "";
  return { pass: res.status === 200 && code === WA_CODE, detail: `HTTP ${res.status}, ссылка chat.whatsapp.com: ${!!m}, код совпадает: ${code === WA_CODE}` };
});

await check("4. /workshop/api/health: funnel=thank-you, бот настроен (tgBot.configured)", async () => {
  const { res, text } = await get("/workshop/api/health");
  let j = {};
  try { j = JSON.parse(text); } catch {}
  const funnel = j.funnel === "thank-you";
  const bot = !!j.tgBot && j.tgBot.configured === true;
  return {
    pass: res.status === 200 && funnel && bot,
    detail: `HTTP ${res.status}, funnel=${JSON.stringify(j.funnel)}, tgBot.configured=${JSON.stringify(j.tgBot && j.tgBot.configured)}, серия: ${JSON.stringify(j.tgBot && j.tgBot.seriesEnabled)}, version=${JSON.stringify(j.version)}`,
  };
});

await check("5. /workshop/thank-you ведёт на /workshop-montazh/thank-you.html (meta refresh)", async () => {
  // Старая Next-страница заменена крошечной: meta refresh и location.replace на новый адрес.
  // Редиректы nginx (например, слэш в конце) идём следом, а страницу проверяем по содержимому.
  const { res, text, url } = await get("/workshop/thank-you");
  const meta = /<meta[^>]+http-equiv=["']refresh["'][^>]*url=\/workshop-montazh\/thank-you\.html/i.test(text);
  const js = text.includes("location.replace") && text.includes("/workshop-montazh/thank-you.html");
  const nextPage = /__next|_next\/static/i.test(text); // старая страница Next с автопереходом в WhatsApp
  return { pass: res.status === 200 && meta && !nextPage, detail: `HTTP ${res.status}, адрес: ${url.replace(BASE, "")}, meta refresh: ${meta}, location.replace: ${js}, старая Next-страница: ${nextPage}` };
});

await check("6. В index.html и thank-you.html нет easybot и edbot", async () => {
  if (!landing) landing = (await get("/workshop-montazh/")).text;
  if (!thanks) thanks = (await get("/workshop-montazh/thank-you.html")).text;
  const re = /easybot|edbot/i;
  const a = re.test(landing);
  const b = re.test(thanks);
  return { pass: !a && !b && landing.length > 0 && thanks.length > 0, detail: `index: ${a ? "найдено" : "чисто"}, thank-you: ${b ? "найдено" : "чисто"}` };
});

await check("7. /workshop/api/go/bad отвечает 302 на start.bizon365.ru", async () => {
  // redirect: "manual", чтобы увидеть сам 302, а не страницу эфира, на которую он ведёт
  const { res } = await get("/workshop/api/go/bad", { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  let host = "";
  try { host = new URL(loc).hostname; } catch {}
  return { pass: res.status === 302 && host === "start.bizon365.ru", detail: `HTTP ${res.status}, location: ${loc || "нет"}` };
});

// Таблица
const w = Math.max(...rows.map((r) => r.name.length));
console.log(`\nПроверка воронки: ${BASE}\n`);
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name.padEnd(w)}  ${r.detail}`);
}
const failed = rows.filter((r) => !r.pass).length;
console.log(`\nИтого: ${rows.length - failed} PASS, ${failed} FAIL`);
// Не process.exit(): на Windows он может оборвать закрывающиеся соединения (assertion в libuv). Код выхода ставим и даём процессу завершиться.
process.exitCode = failed ? 1 : 0;
