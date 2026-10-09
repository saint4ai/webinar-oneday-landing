#!/usr/bin/env node
/**
 * Проверка замены маски-сетки фона (mask-image: fisheye-grid.svg) на обычную картинку-фон:
 * 1) насколько отличается кадр (разница пикселей), 2) во сколько раз падает стоимость кадра.
 *   node docs/perf/grid-test.mjs --url http://localhost:3009/montage --slide 41
 * Только под замком heavy.ps1.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const URL_ = opt("--url", "http://localhost:3009/montage");
const slides = opt("--slide", "41").split(",");
const deckSrc = readFileSync(join(ROOT, "components/montage-deck/MontageDeck.tsx"), "utf8");
const keys = [...deckSrc.slice(deckSrc.indexOf("const slides")).matchAll(/key="([^"]+)"/g)].map((m) => m[1]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// сетка с цветом #FBF3E4 и прозрачностью 0.5 * 0.07 вместо currentColor + маски
const svg = readFileSync(join(ROOT, "public/montage/fisheye-grid.svg"), "utf8").replace('stroke="currentColor"', 'stroke="#FBF3E4"').replace('opacity="0.5"', 'opacity="0.035"');
const MODE = opt("--mode", "svg"); // svg — векторный фон, png — растровая картинка 2400×1500
let dataUri = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
if (MODE === "png") {
  const png = await sharp(Buffer.from(svg), { density: 108 }).resize(2400, 1500).png({ compressionLevel: 9 }).toBuffer();
  console.log("png байт:", png.length);
  dataUri = "data:image/png;base64," + png.toString("base64");
}
const CSS = `[data-deck-bg] > div[style*='fisheye'] { -webkit-mask-image: none !important; mask-image: none !important; background-color: transparent !important; opacity: 1 !important; background-image: url("${dataUri}") !important; background-size: cover !important; background-position: center !important; }`;

const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--mute-audio"] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const bcdp = await browser.newBrowserCDPSession();
await cdp.send("Performance.enable");
await page.addInitScript(() => { try { localStorage.setItem("sd-speaker", "live"); } catch {} window.__f = 0; const l = () => { window.__f++; requestAnimationFrame(l); }; requestAnimationFrame(l); });
const mm = (m) => Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
async function light() {
  const [m, pi, f] = await Promise.all([cdp.send("Performance.getMetrics"), bcdp.send("SystemInfo.getProcessInfo"), page.evaluate(() => window.__f)]);
  const cpu = {}; for (const p of pi.processInfo) cpu[p.type] = (cpu[p.type] ?? 0) + p.cpuTime;
  return { wall: Date.now(), task: mm(m).TaskDuration, cpu, frames: f };
}
async function cost() {
  const a = await light(); await sleep(3000); const b = await light();
  const fr = b.frames - a.frames;
  return { fps: Math.round(fr / ((b.wall - a.wall) / 1000)), gpuMs: +(((b.cpu.GPU - a.cpu.GPU) * 1000) / fr).toFixed(2), mainMs: +(((b.task - a.task) * 1000) / fr).toFixed(2) };
}
for (const key of slides) {
  const i = keys.indexOf(key);
  await page.goto(`${URL_}?n=${i}#${i + 1}`, { waitUntil: "load" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await sleep(2500);
  // замораживаем бесконечные CSS-анимации в одной точке, чтобы кадры сравнивались честно
  const freeze = () => page.evaluate(() => { for (const a of document.getAnimations()) { let inf = false; try { inf = a.effect.getComputedTiming().iterations === Infinity; } catch {} if (inf) { a.pause(); a.currentTime = 3000; } } });
  const c0 = await cost();
  await page.evaluate((c) => { document.getElementById("ab")?.remove(); }, CSS);
  await freeze(); await sleep(300);
  const shotA = await page.screenshot({ type: "png" });
  await page.reload({ waitUntil: "load" }); await sleep(2500);
  await page.evaluate((c) => { const s = document.createElement("style"); s.id = "ab"; s.textContent = c; document.head.appendChild(s); }, CSS);
  const c1 = await cost();
  await freeze(); await sleep(300);
  const shotB = await page.screenshot({ type: "png" });
  const A = await sharp(shotA).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(shotB).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let max = 0, sum = 0, big = 0, n = A.info.width * A.info.height;
  for (let p = 0; p < A.data.length; p += 3) { const d = Math.max(Math.abs(A.data[p] - B.data[p]), Math.abs(A.data[p + 1] - B.data[p + 1]), Math.abs(A.data[p + 2] - B.data[p + 2])); if (d > max) max = d; sum += d; if (d > 4) big++; }
  console.log(`слайд ${key}: маска → картинка | кадр: fps ${c0.fps} → ${c1.fps}, GPU ${c0.gpuMs} → ${c1.gpuMs} мс/кадр, main ${c0.mainMs} → ${c1.mainMs} | разница: максимум ${max} из 255, среднее ${(sum / n).toFixed(3)}, пикселей с разницей больше 4: ${(big / n * 100).toFixed(3)}%`);
}
await browser.close();
