#!/usr/bin/env node
/**
 * Снимки деки /montage из готовой сборки .next без запуска сервера.
 * Playwright перехватывает запросы к выдуманному адресу http://deck.offline и отдаёт файлы с диска:
 * ни один порт не открывается, localhost ведущего не трогаем (правило Александра 05.10: пока он смотрит, сервер не запускать).
 *
 *   WEBINAR_LOCAL=1 npx next build                        # сначала сборка (без сервера)
 *   node docs/deck-v2/shoot-offline.mjs                   # все слайды → docs/deck-v2/shots/<ключ>.jpg
 *   node docs/deck-v2/shoot-offline.mjs --only "10v,30"   # только эти ключи (в PowerShell список в кавычках)
 *   node docs/deck-v2/shoot-offline.mjs --film "01,38"    # кадры въезда: 150, 500, 1000, 2500 мс → film-<ключ>-<мс>.jpg (свои моменты: --film-ms "500,4000")
 *   node docs/deck-v2/shoot-offline.mjs --out <папка> --w 1920 --q 80   # полноразмерные кадры, например для партнёров
 *
 * Проверки на каждом слайде: зона камеры (правые 40%), текст и картинки за краем кадра, обрезанный текст, ошибки в консоли.
 * Браузер: CHROMIUM_PATH или Chrome по стандартному пути Windows, иначе Chromium из Playwright.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const DIST = process.env.NEXT_DIST_DIR || ".next"; // NEXT_DIST_DIR=.next-glass — снимать вторую сборку, не трогая основную
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const OUT = opt("--out") ?? join(here, "shots");
const WIDTH = Number(opt("--w") ?? 960); // ширина снимка: 960 для проверки, 1920 для выгрузки партнёрам
const QUALITY = Number(opt("--q") ?? 82);
const only = opt("--only")?.split(",").map((s) => s.trim());
const film = opt("--film")?.split(",").map((s) => s.trim()) ?? [];
// моменты кадров для --film, мс от входа на слайд; по умолчанию въезд, для карусели можно дальше: --film-ms "500,4000,7400,10800"
const FILM_MS = (opt("--film-ms") ?? "150,500,1000,2500").split(",").map(Number).sort((a, b) => a - b);
// --clips "10,20": видео этих слайдов для страницы партнёров (ролики и карусели в движении) → <out>/clips/<ключ>.mp4, длина --clip-ms
const clips = opt("--clips")?.split(",").map((s) => s.trim()) ?? [];
const CLIP_MS = Number(opt("--clip-ms") ?? 8000);
const RAW = join(OUT, "clips", "_raw");
if (clips.length) mkdirSync(RAW, { recursive: true });
const marks = []; // [ключ, начало в мс от старта записи, длина]
// слайды, где полный цикл длиннее обычного клипа: карусель кейсов 12 × 3,4 с, три переписки Direct по 4,2 с
const CLIP_LONG = { "08c": 41500, "10i": 13300 };
mkdirSync(OUT, { recursive: true });

if (!existsSync(join(ROOT, DIST + "/server/app/montage.html"))) {
  console.error("Нет сборки: сначала WEBINAR_LOCAL=1 npx next build");
  process.exit(1);
}

const deckSrc = readFileSync(join(ROOT, "components/montage-deck/MontageDeck.tsx"), "utf8");
const keys = [...deckSrc.slice(deckSrc.indexOf("const slides")).matchAll(/key="([^"]+)"/g)].map((m) => m[1]);

const TYPES = { ".js": "application/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm",
  ".json": "application/json", ".html": "text/html; charset=utf-8", ".rsc": "text/x-component", ".ico": "image/x-icon", ".txt": "text/plain" };

const missing = new Set();
function fileFor(pathname) {
  if (pathname === "/montage" || pathname === "/montage/") return join(ROOT, DIST + "/server/app/montage.html");
  if (pathname.startsWith("/_next/static/")) return join(ROOT, DIST + "/static", decodeURIComponent(pathname.slice("/_next/static/".length)));
  return join(ROOT, "public", decodeURIComponent(pathname));
}

const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
  ...(clips.length ? { recordVideo: { dir: RAW, size: { width: 1920, height: 1080 } } } : {}) });
await ctx.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.host !== "deck.offline") return route.abort();
  let file = fileFor(url.pathname);
  if (url.searchParams.has("_rsc")) file = join(ROOT, DIST + "/server/app/montage.rsc");
  if (!existsSync(file) || statSync(file).isDirectory()) { missing.add(url.pathname); return route.fulfill({ status: 404, body: "" }); }
  const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
  const buf = readFileSync(file);
  const range = route.request().headers()["range"];
  if (range && type.startsWith("video/")) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s), end = e ? Number(e) : buf.length - 1;
    return route.fulfill({ status: 206, headers: { "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${buf.length}`, "content-length": String(end - start + 1) }, body: buf.subarray(start, end + 1) });
  }
  return route.fulfill({ status: 200, headers: { "content-type": type, "accept-ranges": "bytes" }, body: buf });
});

const page = await ctx.newPage();
const t0 = Date.now(); // запись видео идёт с создания страницы
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 160)}`); });
await page.addInitScript(() => { try { localStorage.setItem("sd-speaker", "live"); } catch {} });
await page.goto("http://deck.offline/montage", { waitUntil: "load" });
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
await page.waitForTimeout(2500);

function checks() {
  const frame = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).containerType === "size");
  if (!frame) return { zone: ["рамка не найдена"], out: [], clip: [] };
  const slide = frame.querySelector(":scope > div.z-10") ?? frame;
  const fr = frame.getBoundingClientRect();
  const limit = fr.left + fr.width * 0.6 + 2;
  const zone = [], out = [], clip = [];
  for (const el of slide.querySelectorAll("*")) {
    if (el.closest("[data-deck-bg]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const media = /^(IMG|VIDEO|CANVAS|svg)$/.test(el.tagName);
    const paint = (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || cs.backgroundImage !== "none" || parseFloat(cs.borderRightWidth) > 0 || cs.boxShadow !== "none";
    const label = (el.textContent || el.getAttribute("src") || "").toString().trim().slice(0, 40);
    let clipped = false;
    for (let p = el.parentElement; p && p !== slide; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflow !== "visible" && p.getBoundingClientRect().right <= limit) { clipped = true; break; }
    }
    if ((text || media || paint) && !clipped && r.right > limit && r.left < fr.right && r.bottom > fr.top && r.top < fr.bottom)
      zone.push(`${el.tagName.toLowerCase()} → ${Math.round(((r.right - fr.left) / fr.width) * 100)}%  ${label}`);
    if ((text || media) && (r.left < fr.left - 2 || r.top < fr.top - 2 || r.bottom > fr.bottom + 2))
      out.push(`${el.tagName.toLowerCase()} за кадром (${Math.round(r.left - fr.left)},${Math.round(r.top - fr.top)} → ${Math.round(r.bottom - fr.top)})  ${label}`);
    if (text && (cs.overflow === "hidden" || cs.textOverflow === "ellipsis") && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2))
      clip.push(`текст обрезан ${el.scrollWidth}×${el.scrollHeight} > ${el.clientWidth}×${el.clientHeight}  ${label}`);
  }
  return { zone: zone.slice(0, 6), out: out.slice(0, 6), clip: clip.slice(0, 6) };
}

async function shot(name) {
  const png = await page.screenshot({ type: "png" });
  await sharp(png).resize({ width: WIDTH }).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(join(OUT, `${name}.jpg`));
}

const SLOW = { "09": 4200, "38": 3200, "39a": 3000 };
const last = only ? Math.max(...only.map((k) => keys.indexOf(k))) : keys.length - 1;
for (let i = 0; i <= last; i++) {
  const k = keys[i];
  const wanted = !only || only.includes(k);
  // с --only к нужному слайду прыгаем по адресу #N (SlideDeck читает номер при загрузке), а не пролистываем:
  // при частом листании переход SlideDeck (AnimatePresence mode="wait") иногда залипает на уходящем слайде
  if (only && !wanted) continue;
  errors.length = 0;
  if (only) {
    await page.goto(`http://deck.offline/montage?n=${i}#${i + 1}`, { waitUntil: "load" });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  } else if (i > 0) await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
  if (wanted && clips.includes(k)) {
    const len = CLIP_LONG[k] ?? CLIP_MS;
    marks.push([k, Date.now() - t0, len]);
    await page.waitForTimeout(len);
  } else if (wanted && film.includes(k)) {
    let prev = 0;
    for (const t of FILM_MS) { await page.waitForTimeout(t - prev); prev = t; await shot(`film-${k}-${t}`); }
  } else {
    await page.waitForTimeout(SLOW[k] ?? 2500);
  }
  if (!wanted) continue;
  if (!film.includes(k)) await shot(k);
  const c = await page.evaluate(checks);
  const flags = [...c.zone.map((z) => "⚠ зона камеры: " + z), ...c.out.map((z) => "⚠ " + z), ...c.clip.map((z) => "⚠ " + z), ...errors.map((e) => "✗ " + e)];
  console.log(`${flags.length ? "!" : "✓"} ${k}${flags.length ? "\n    " + flags.join("\n    ") : ""}`);
}
// /icon.svg и /favicon.ico в сборке отдаёт маршрут Next, здесь их нет: это не ошибка деки
const real = [...missing].filter((p) => !["/icon.svg", "/favicon.ico"].includes(p));
if (real.length) console.log("404 (нет файла):", real.join(", "));
const video = clips.length ? page.video() : null;
await ctx.close(); // файл записи дописывается при закрытии контекста
await browser.close();

// нарезка записи по слайдам: H.264 без звука, первый кадр — постер; полсекунды после перехода пропускаем, там въезд со сдвигом таймингов записи
if (video) {
  const { spawnSync } = await import("node:child_process");
  const raw = await video.path();
  const W = Math.min(WIDTH, 1920);
  for (const [k, ms, len] of marks) {
    const out = join(OUT, "clips", `${k}.mp4`);
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String((ms + 500) / 1000), "-t", String((len - 700) / 1000), "-i", raw,
      "-vf", `scale=${W}:-2:flags=lanczos,fps=30,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-movflags", "+faststart", "-an", out], { stdio: "inherit" });
    console.log(r.status === 0 ? `▶ clips/${k}.mp4  ${(statSync(out).size / 1048576).toFixed(2)} МБ` : `✗ clips/${k}.mp4 не нарезан`);
  }
}
