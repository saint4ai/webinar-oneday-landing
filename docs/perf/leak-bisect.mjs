#!/usr/bin/env node
/**
 * Откуда растёт память рендерера между кругами: крутим небольшие группы слайдов много раз и после каждого прохода
 * (с принудительной сборкой мусора) смотрим private-память процессов рендерера и GPU.
 *
 *   node docs/perf/leak-bisect.mjs --url http://localhost:3009/montage --label leak-before --cycles 8 --hold 1.8
 *
 * Только под замком heavy.ps1, один Chrome.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const URL_ = opt("--url", "http://localhost:3009/montage");
const LABEL = opt("--label", "leak");
const CYCLES = Number(opt("--cycles", 8));
const HOLD = Number(opt("--hold", 1.8));
const GROUPS = {
  "простые стёкла 02-07": ["02", "03", "04", "05", "06", "07"],
  "тоннель обложки 01 и финал 59": ["01", "59"],
  "главы с холстом 11 pr 33 51": ["11", "pr", "33", "51"],
  "ленты рилсов 10 10v 14 22r": ["10", "10v", "14", "22r"],
  "каруселька картинок car, кейсы 08c": ["car", "08c"],
};
const only = opt("--groups")?.split(",").map((s) => s.trim());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const bcdp = await browser.newBrowserCDPSession();
if (args.includes("--block-mp4")) await ctx.route("**/*.mp4", (r) => r.abort()); // проверка: течёт ли память без видео
if (args.includes("--block-img")) await ctx.route(/\.(jpg|jpeg|png|webp)(\?|$)/, (r) => r.abort()); // и без картинок

function mem(pids) {
  try {
    const out = execFileSync("powershell.exe", ["-NoProfile", "-Command", `Get-Process -Id ${pids.join(",")} -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id) $($_.WorkingSet64) $($_.PrivateMemorySize64)" }`], { encoding: "utf8", timeout: 15000 });
    const r = {};
    for (const l of out.split(/\r?\n/)) { const [id, ws, pv] = l.trim().split(" ").map(Number); if (id) r[id] = { ws, pv }; }
    return r;
  } catch { return {}; }
}
async function snapshot(cdp) {
  await cdp.send("HeapProfiler.collectGarbage").catch(() => {});
  await sleep(700);
  const pi = (await bcdp.send("SystemInfo.getProcessInfo")).processInfo;
  const m = mem(pi.map((p) => p.id));
  const by = {};
  for (const p of pi) if (m[p.id]) { by[p.type] ??= { ws: 0, pv: 0 }; by[p.type].ws += m[p.id].ws; by[p.type].pv += m[p.id].pv; }
  return { rendererPv: Math.round((by.renderer?.pv ?? 0) / 1048576), rendererWs: Math.round((by.renderer?.ws ?? 0) / 1048576), gpuPv: Math.round((by.GPU?.pv ?? 0) / 1048576), gpuWs: Math.round((by.GPU?.ws ?? 0) / 1048576) };
}

const deckSrc = (await import("node:fs")).readFileSync(join(here, "..", "..", "components/montage-deck/MontageDeck.tsx"), "utf8");
const keys = [...deckSrc.slice(deckSrc.indexOf("const slides")).matchAll(/key="([^"]+)"/g)].map((m) => m[1]);
const result = [];
for (const [name, list] of Object.entries(GROUPS)) {
  if (only && !only.some((o) => name.includes(o))) continue;
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.addInitScript(() => { try { localStorage.setItem("sd-speaker", "live"); } catch {} });
  await page.goto(`${URL_}#${keys.indexOf(list[0]) + 1}`, { waitUntil: "load" });
  await sleep(2000);
  const series = [await snapshot(cdp)];
  for (let c = 0; c < CYCLES; c++) {
    for (const k of list) {
      // переход листанием стрелкой: клавиши до нужного слайда
      const want = keys.indexOf(k) + 1;
      for (let guard = 0; guard < 80; guard++) {
        const h = Number((await page.evaluate(() => location.hash)).slice(1));
        if (h === want) break;
        await page.keyboard.press(h < want ? "ArrowRight" : "ArrowLeft");
        await sleep(h < want ? 60 : 60);
      }
      await sleep(HOLD * 1000);
    }
    series.push(await snapshot(cdp));
  }
  const first = series[1], last = series[series.length - 1];
  console.log(`${name}: private рендерера ${series.map((s) => s.rendererPv).join(" → ")} МБ; GPU ${series.map((s) => s.gpuPv).join(" → ")} МБ; прирост за проход (со 2-го по последний): рендерер ${((last.rendererPv - first.rendererPv) / Math.max(1, series.length - 2)).toFixed(1)} МБ, GPU ${((last.gpuPv - first.gpuPv) / Math.max(1, series.length - 2)).toFixed(1)} МБ`);
  result.push({ name, list, series });
  await page.close();
}
mkdirSync(join(here, "data"), { recursive: true });
writeFileSync(join(here, "data", `${LABEL}.json`), JSON.stringify(result));
await browser.close();
