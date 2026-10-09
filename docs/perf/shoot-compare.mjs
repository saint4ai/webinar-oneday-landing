#!/usr/bin/env node
/**
 * Снимки всех слайдов /montage для сравнения «до и после» (ТЗ docs/tasks/deck_perf_1009.md, этап 2).
 * Как docs/deck-v2/shoot-offline.mjs: сервер не нужен, Playwright подменяет http://deck.offline файлами из готовой сборки.
 * Отличия: на каждый слайд свежая загрузка по адресу #N, одинаковая задержка, видео ставятся на паузу на одной секунде,
 * бесконечные CSS-анимации замораживаются на одном и том же времени (иначе тоннель обложки и свечение каждый раз в другой фазе).
 *
 *   node docs/perf/shoot-compare.mjs --dist .next-perf --out <папка> [--only "01,02"] [--settle 3000]
 *   node docs/perf/shoot-compare.mjs --compare <папкаA> <папкаB> [--noise <папкаA2>]   # попарная разница пикселей → JSON и таблица
 *
 * Только под замком heavy.ps1, один Chrome за раз.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, statSync, writeFileSync, openSync, readSync, closeSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const deckSrc = readFileSync(join(ROOT, "components/montage-deck/MontageDeck.tsx"), "utf8");
const keys = [...deckSrc.slice(deckSrc.indexOf("const slides")).matchAll(/key="([^"]+)"/g)].map((m) => m[1]);

// ───────────── режим сравнения ─────────────
if (args.includes("--compare")) {
  const ci = args.indexOf("--compare");
  const A = args[ci + 1], B = args[ci + 2];
  const N = opt("--noise");
  const THR = 28; // порог разницы по каналу из 255: ниже шум сжатия и сглаживания
  const read = async (dir, k) => sharp(join(dir, k + ".png")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const diff = async (da, db, k) => {
    const a = await read(da, k), b = await read(db, k);
    const { width, height } = a.info;
    let big = 0, sum = 0;
    const out = Buffer.alloc(width * height);
    for (let p = 0, q = 0; p < a.data.length; p += 3, q++) {
      const d = Math.max(Math.abs(a.data[p] - b.data[p]), Math.abs(a.data[p + 1] - b.data[p + 1]), Math.abs(a.data[p + 2] - b.data[p + 2]));
      sum += d;
      if (d > THR) { big++; out[q] = 255; } else out[q] = Math.min(255, d * 4);
    }
    return { pct: Math.round((big / (width * height)) * 10000) / 100, mean: Math.round((sum / (width * height)) * 100) / 100, mask: out, width, height };
  };
  const rows = [];
  for (const k of keys) {
    if (!existsSync(join(A, k + ".png")) || !existsSync(join(B, k + ".png"))) continue;
    const d = await diff(A, B, k);
    let noise = null;
    if (N && existsSync(join(N, k + ".png"))) { const n = await diff(A, N, k); noise = { pct: n.pct, mean: n.mean }; }
    rows.push({ key: k, pct: d.pct, mean: d.mean, noisePct: noise?.pct ?? null, noiseMean: noise?.mean ?? null });
    if (d.pct > 0.05) {
      mkdirSync(join(B, "_diff"), { recursive: true });
      await sharp(d.mask, { raw: { width: d.width, height: d.height, channels: 1 } }).resize({ width: 960 }).png().toFile(join(B, "_diff", k + ".png"));
    }
  }
  writeFileSync(join(B, "_compare.json"), JSON.stringify(rows, null, 1));
  console.log("слайд | разных пикселей %, средняя разница | шум (A против A2)");
  for (const r of rows) console.log(`${r.key.padEnd(5)} ${String(r.pct).padStart(6)}%  ${String(r.mean).padStart(6)}  |  ${r.noisePct != null ? `${r.noisePct}% ${r.noiseMean}` : "-"}`);
  process.exit(0);
}

// ───────────── режим съёмки ─────────────
const DIST = opt("--dist", ".next-perf");
const OUT = opt("--out");
if (!OUT) { console.error("нужен --out <папка>"); process.exit(1); }
const only = opt("--only")?.split(",").map((s) => s.trim());
const SETTLE = Number(opt("--settle", 3000));
const NOANIM = args.includes("--noanim"); // выключить покачивание объектов и дрейф свечения: остаются только статические различия
const VTIME = args.includes("--vtime"); // виртуальное время для всего, что считается в JS (ленты, холсты, Motion): кадры двух сборок сравниваются в одну и ту же миллисекунду
mkdirSync(OUT, { recursive: true });
if (!existsSync(join(ROOT, DIST + "/server/app/montage.html"))) { console.error("Нет сборки", DIST); process.exit(1); }

const TYPES = { ".js": "application/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".mp4": "video/mp4", ".webm": "video/webm",
  ".json": "application/json", ".html": "text/html; charset=utf-8", ".rsc": "text/x-component", ".ico": "image/x-icon", ".txt": "text/plain" };
const missing = new Set();
function fileFor(pathname) {
  if (pathname === "/montage" || pathname === "/montage/") return join(ROOT, DIST + "/server/app/montage.html");
  if (pathname.startsWith("/_next/static/")) return join(ROOT, DIST + "/static", decodeURIComponent(pathname.slice("/_next/static/".length)));
  return join(ROOT, "public", decodeURIComponent(pathname));
}
const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--mute-audio"] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await ctx.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.host !== "deck.offline") return route.abort();
  let file = fileFor(url.pathname);
  if (url.searchParams.has("_rsc")) file = join(ROOT, DIST + "/server/app/montage.rsc");
  if (!existsSync(file) || statSync(file).isDirectory()) { missing.add(url.pathname); return route.fulfill({ status: 404, body: "" }); }
  const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
  if (type.startsWith("video/")) {
    // видео отдаём кусками по 4 МБ, не читая файл целиком (видеоурок весит 933 МБ)
    const size = statSync(file).size;
    const range = route.request().headers()["range"];
    const [s0, e0] = (range ?? "bytes=0-").replace("bytes=", "").split("-");
    const start = Number(s0 || 0), end = Math.min(e0 ? Number(e0) : size - 1, start + 4 * 1048576 - 1, size - 1);
    const fd = openSync(file, "r");
    const chunk = Buffer.alloc(end - start + 1);
    readSync(fd, chunk, 0, chunk.length, start);
    closeSync(fd);
    return route.fulfill({ status: 206, headers: { "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(chunk.length) }, body: chunk });
  }
  return route.fulfill({ status: 200, headers: { "content-type": type }, body: readFileSync(file) });
});
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem("sd-speaker", "live"); } catch {} });
if (VTIME) {
  await page.addInitScript(() => {
    let T = 0;
    performance.now = () => T;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf(() => cb(T));
    window.__step = async (to, dt = 16.7) => { while (T < to) { T = Math.min(to, T + dt); await new Promise((r) => raf(() => r())); } };
  });
}
const SLOW = { "09": 4200, "38": 3200, "39a": 3000 };
const freeze = (t) => {
  // CSS-анимации и WAAPI: бесконечные ставим на паузу в одну точку времени, остальные не трогаем
  for (const a of document.getAnimations()) {
    let inf = false;
    try { inf = a.effect.getComputedTiming().iterations === Infinity; } catch {}
    if (inf) { a.pause(); a.currentTime = t; }
  }
  return Promise.all([...document.querySelectorAll("video")].map((v) => new Promise((res) => {
    v.pause();
    const done = () => res();
    if (v.readyState < 1) { v.addEventListener("loadedmetadata", () => { v.currentTime = 1; v.addEventListener("seeked", done, { once: true }); setTimeout(done, 1500); }, { once: true }); setTimeout(done, 1500); return; }
    v.addEventListener("seeked", done, { once: true });
    v.currentTime = 1;
    setTimeout(done, 1500);
  })));
};
for (let i = 0; i < keys.length; i++) {
  const k = keys[i];
  if (only && !only.includes(k)) continue;
  await page.goto(`http://deck.offline/montage?n=${i}#${i + 1}`, { waitUntil: "load" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" + (NOANIM ? " img[src*='/montage/lego/'], img[src*='/montage/px/'], [style*='px-bob'] { transform: none !important; animation: none !important; } [data-deck-bg] [style*='radial-gradient(34% 42%'] { transform: none !important; animation: none !important; }" : "") });
  const settle = SLOW[k] ?? SETTLE;
  if (VTIME) {
    await page.waitForTimeout(1500);
    await page.evaluate((t) => window.__step(t), settle);
    await page.waitForTimeout(900);
  } else await page.waitForTimeout(settle);
  await page.evaluate(freeze, settle);
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(OUT, k + ".png"), type: "png" });
  console.log("✓", k);
}
const real = [...missing].filter((p) => !["/icon.svg", "/favicon.ico"].includes(p));
if (real.length) console.log("404 (нет файла):", real.join(", "));
await browser.close();
