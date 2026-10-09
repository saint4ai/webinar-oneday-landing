#!/usr/bin/env node
/**
 * A/B на живой странице: что именно стоит нагрузки. На выбранных слайдах включаем и выключаем отдельные приёмы оформления
 * инжектированным CSS (backdrop-filter, дрейф свечения фона, покачивание объектов, маски) и меряем затраты на кадр.
 *
 *   node docs/perf/ab.mjs --url http://localhost:3009/montage --slides "02,10,35,41" --label ab-before
 *
 * Только под замком heavy.ps1, один Chrome. Результат: docs/perf/data/<label>.json
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const URL_ = opt("--url", "http://localhost:3009/montage");
const LABEL = opt("--label", "ab");
const WIN = Number(opt("--win", 3)); // секунд на окно замера
const deckSrc = readFileSync(join(ROOT, "components/montage-deck/MontageDeck.tsx"), "utf8");
const keys = [...deckSrc.slice(deckSrc.indexOf("const slides")).matchAll(/key="([^"]+)"/g)].map((m) => m[1]);
const slidesWanted = opt("--slides", "02,10,35,41").split(",").map((s) => s.trim());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CONFIGS = {
  "база": "",
  "база + мышь ходит": "@@mouse",
  "без backdrop-filter": "*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }",
  "без дрейфа свечения": "[data-deck-bg] [style*='radial-gradient(34% 42%'] { transform: none !important; animation: none !important; }",
  "дрейф ступенями 12 Гц": "[data-deck-bg] [style*='radial-gradient(34% 42%'] { animation-timing-function: steps(84, end) !important; }",
  "без покачивания объектов": "img[src*='/montage/lego/'], img[src*='/montage/px/'] { transform: none !important; animation: none !important; }",
  "без масок": "[data-deck-bg], [data-deck-bg] * { -webkit-mask-image: none !important; mask-image: none !important; }",
  "без will-change": "* { will-change: auto !important; }",
  "всё сразу": "*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; will-change: auto !important; } [data-deck-bg] [style*='radial-gradient(34% 42%'] { transform: none !important; animation: none !important; } img[src*='/montage/lego/'], img[src*='/montage/px/'] { transform: none !important; animation: none !important; }",
};

const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
const VW = Number(opt("--w", 1920)), VH = Number(opt("--h", 1080));
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: Number(opt("--dpr", 1)) });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const bcdp = await browser.newBrowserCDPSession();
await cdp.send("Performance.enable");
await page.addInitScript(() => {
  try { localStorage.setItem("sd-speaker", "live"); } catch {}
  window.__f = 0;
  const loop = () => { window.__f++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
const mm = (m) => Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
async function light() {
  const [m, pi, f] = await Promise.all([cdp.send("Performance.getMetrics"), bcdp.send("SystemInfo.getProcessInfo"), page.evaluate(() => window.__f)]);
  const cpu = {};
  for (const p of pi.processInfo) cpu[p.type] = (cpu[p.type] ?? 0) + p.cpuTime;
  return { wall: Date.now(), task: mm(m).TaskDuration, cpu, frames: f };
}
const res = [];
for (const key of slidesWanted) {
  const i = keys.indexOf(key);
  if (i < 0) continue;
  await page.goto(`${URL_}?n=${i}#${i + 1}`, { waitUntil: "load" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await sleep(2500);
  for (const [name, cssRaw] of Object.entries(CONFIGS)) {
    const mouse = cssRaw === "@@mouse";
    const css = mouse ? "" : cssRaw;
    await page.evaluate((c) => {
      document.getElementById("ab")?.remove();
      const s = document.createElement("style"); s.id = "ab"; s.textContent = c; document.head.appendChild(s);
    }, css);
    let moving = mouse;
    const mover = (async () => { let ang = 0; while (moving) { ang += 0.35; await page.mouse.move(VW * (0.35 + 0.25 * Math.sin(ang)), VH * (0.5 + 0.3 * Math.cos(ang * 0.8))).catch(() => {}); await sleep(33); } })();
    await sleep(900);
    const a = await light();
    await sleep(WIN * 1000);
    const b = await light();
    moving = false; await mover;
    const dt = (b.wall - a.wall) / 1000, fr = b.frames - a.frames;
    const pct = (x) => +((x / dt) * 100).toFixed(1);
    const r = { slide: key, cfg: name, mainPct: pct(b.task - a.task), gpuPct: pct((b.cpu.GPU ?? 0) - (a.cpu.GPU ?? 0)), rendPct: pct((b.cpu.renderer ?? 0) - (a.cpu.renderer ?? 0)), fps: Math.round(fr / dt), mainMs: +(((b.task - a.task) * 1000) / fr).toFixed(2), gpuMs: +((((b.cpu.GPU ?? 0) - (a.cpu.GPU ?? 0)) * 1000) / fr).toFixed(2), rendMs: +((((b.cpu.renderer ?? 0) - (a.cpu.renderer ?? 0)) * 1000) / fr).toFixed(2) };
    res.push(r);
    console.log(`${key.padEnd(4)} ${name.padEnd(26)} fps ${String(r.fps).padStart(4)}  | за секунду: main ${r.mainPct}%  GPU ${r.gpuPct}%  renderer ${r.rendPct}%  | на кадр: main ${r.mainMs} мс  GPU ${r.gpuMs}  renderer ${r.rendMs}`);
  }
}
mkdirSync(join(here, "data"), { recursive: true });
writeFileSync(join(here, "data", `${LABEL}.json`), JSON.stringify(res));
await browser.close();
