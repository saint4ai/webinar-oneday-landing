#!/usr/bin/env node
/**
 * Одинаково ли двигаются покачивание объекта (Px) и дрейф свечения фона до и после замены framer-motion на CSS:
 * снимаем смещение каждые ~16 мс от появления элемента на слайде 02. Запуск на каждой сборке отдельно:
 *   node docs/perf/motion-equiv.mjs --url http://localhost:3009/montage --label before
 * Сравнение двух файлов: node docs/perf/motion-equiv.mjs --compare before after
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
if (args.includes("--compare")) {
  const i = args.indexOf("--compare");
  const A = JSON.parse(readFileSync(join(here, "data", `motion-${args[i + 1]}.json`), "utf8")), B = JSON.parse(readFileSync(join(here, "data", `motion-${args[i + 2]}.json`), "utf8"));
  const at = (s, t) => { let best = s[0]; for (const x of s) if (Math.abs(x.t - t) < Math.abs(best.t - t)) best = x; return best; };
  let maxBob = 0, maxX = 0, maxY = 0, n = 0;
  for (let t = 1500; t <= 4500; t += 100) {
    const a = at(A, t), b = at(B, t);
    maxBob = Math.max(maxBob, Math.abs(a.bob - b.bob)); maxX = Math.max(maxX, Math.abs(a.dx - b.dx)); maxY = Math.max(maxY, Math.abs(a.dy - b.dy)); n++;
    if (t % 500 === 0) console.log(`t=${t} мс: покачивание ${a.bob.toFixed(2)}% → ${b.bob.toFixed(2)}%, дрейф x ${a.dx.toFixed(2)}% → ${b.dx.toFixed(2)}%, y ${a.dy.toFixed(2)}% → ${b.dy.toFixed(2)}%`);
  }
  console.log(`наибольшее расхождение за ${n} точек: покачивание ${maxBob.toFixed(2)} п.п. высоты (амплитуда 4), дрейф x ${maxX.toFixed(2)} п.п., y ${maxY.toFixed(2)} п.п. (амплитуды 2,2 и 1,6)`);
  process.exit(0);
}
const URL_ = opt("--url", "http://localhost:3009/montage"), LABEL = opt("--label", "x");
const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--mute-audio"] });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await page.addInitScript(() => { try { localStorage.setItem("sd-speaker", "live"); } catch {} });
await page.goto(URL_ + "?n=1#2", { waitUntil: "load" });
const series = await page.evaluate(() => new Promise((resolve) => {
  const out = []; let t0 = 0;
  const num = (m) => { const r = /matrix\(([^)]+)\)/.exec(m); return r ? r[1].split(",").map(Number) : null; };
  const tick = () => {
    const lego = document.querySelector('img[src*="/montage/lego/"]');
    const glow = document.querySelector("[data-deck-bg] [style*='radial-gradient(34% 42%']");
    if (lego && glow) {
      if (!t0) t0 = performance.now();
      // у новой сборки двигается обёртка, у старой сама картинка
      const bobEl = getComputedStyle(lego).animationName !== "none" ? lego : lego.parentElement && getComputedStyle(lego.parentElement).animationName !== "none" ? lego.parentElement : lego;
      const m = num(getComputedStyle(bobEl).transform), g = num(getComputedStyle(glow).transform);
      const h = bobEl.getBoundingClientRect().height / (num(getComputedStyle(bobEl).transform) ? 1 : 1);
      const gw = glow.offsetWidth, gh = glow.offsetHeight;
      out.push({ t: performance.now() - t0, bob: m ? (m[5] / lego.offsetHeight) * 100 : 0, dx: g ? (g[4] / gw) * 100 : 0, dy: g ? (g[5] / gh) * 100 : 0 });
    }
    if (!t0 || performance.now() - t0 < 5000) requestAnimationFrame(tick); else resolve(out);
  };
  requestAnimationFrame(tick);
}));
mkdirSync(join(here, "data"), { recursive: true });
writeFileSync(join(here, "data", `motion-${LABEL}.json`), JSON.stringify(series));
console.log(LABEL, "точек:", series.length);
await browser.close();
