#!/usr/bin/env node
/**
 * Обложка и финал (тоннель из 34 карточек и 17 видео): что именно держит память и GPU.
 * Каждый вариант идёт в свежем Chrome (память GPU-процесса не откатывается назад), стиль вставляется до первой отрисовки.
 *   node docs/perf/tunnel-ab.mjs --url http://localhost:3009/montage --label tunnel-ab
 * Только под замком heavy.ps1.
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
const LABEL = opt("--label", "tunnel-ab");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CONFIGS = {
  "база": "",
  "без видео (элементы скрыты, src снят)": "@@novideo",
  "без теней карточек": "[style*='ct-fly'] { box-shadow: none !important; }",
  "без will-change": "* { will-change: auto !important; }",
  "без вращения сцены": "[style*='ct-spin'] { animation: none !important; }",
  "без пульса света": "[style*='ct-pulse'] { animation: none !important; }",
  "без маски": "[style*='#000 50%'] { -webkit-mask-image: none !important; mask-image: none !important; }",
  "без бликов и теней и will-change": "[style*='ct-fly'] { box-shadow: none !important; will-change: auto !important; } [style*='ct-fly'] > div:last-child { display: none !important; }",
  "карточки без анимации полёта": "[style*='ct-fly'] { animation: none !important; transform: none !important; }",
};
const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);

function mem(pids) {
  const out = execFileSync("powershell.exe", ["-NoProfile", "-Command", `Get-Process -Id ${pids.join(",")} -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id) $($_.PrivateMemorySize64)" }`], { encoding: "utf8", timeout: 15000 });
  const m = {};
  for (const l of out.split(/\r?\n/)) { const [id, pv] = l.trim().split(" ").map(Number); if (id) m[id] = pv; }
  return m;
}
const res = [];
for (const [name, css0] of Object.entries(CONFIGS)) {
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const bcdp = await browser.newBrowserCDPSession();
  await cdp.send("Performance.enable");
  const noVideo = css0 === "@@novideo";
  if (noVideo) await ctx.route("**/*.mp4", (r) => r.abort());
  await page.addInitScript((css) => {
    try { localStorage.setItem("sd-speaker", "live"); } catch {}
    window.__f = 0; const l = () => { window.__f++; requestAnimationFrame(l); }; requestAnimationFrame(l);
    if (css) { const s = document.createElement("style"); s.textContent = css; document.documentElement.appendChild(s); }
  }, noVideo ? "" : css0);
  await page.goto(URL_ + "#1", { waitUntil: "load" });
  await sleep(5000);
  const m0 = async () => {
    const [m, pi, f] = await Promise.all([cdp.send("Performance.getMetrics"), bcdp.send("SystemInfo.getProcessInfo"), page.evaluate(() => window.__f)]);
    const cpu = {}; for (const p of pi.processInfo) cpu[p.type] = (cpu[p.type] ?? 0) + p.cpuTime;
    return { wall: Date.now(), task: Object.fromEntries(m.metrics.map((x) => [x.name, x.value])).TaskDuration, cpu, frames: f, pids: pi.processInfo };
  };
  const a = await m0(); await sleep(4000); const b = await m0();
  const fr = b.frames - a.frames, dt = (b.wall - a.wall) / 1000;
  const mm = mem(b.pids.map((p) => p.id));
  const by = {}; for (const p of b.pids) if (mm[p.id]) by[p.type] = (by[p.type] ?? 0) + mm[p.id];
  const r = { cfg: name, fps: Math.round(fr / dt), gpuMsFrame: +(((b.cpu.GPU - a.cpu.GPU) * 1000) / fr).toFixed(2), gpuPct: +(((b.cpu.GPU - a.cpu.GPU) / dt) * 100).toFixed(0), mainMsFrame: +(((b.task - a.task) * 1000) / fr).toFixed(2), rendMB: Math.round((by.renderer ?? 0) / 1048576), gpuMB: Math.round((by.GPU ?? 0) / 1048576) };
  res.push(r);
  console.log(`${name.padEnd(40)} fps ${String(r.fps).padStart(4)}  GPU ${r.gpuMsFrame} мс/кадр (${r.gpuPct}% ядра)  main ${r.mainMsFrame} мс/кадр  | память: рендерер ${r.rendMB} МБ, GPU ${r.gpuMB} МБ`);
  await browser.close();
}
mkdirSync(join(here, "data"), { recursive: true });
writeFileSync(join(here, "data", `${LABEL}.json`), JSON.stringify(res));
