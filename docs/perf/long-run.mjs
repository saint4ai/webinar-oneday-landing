#!/usr/bin/env node
/**
 * Замер долгого показа деки /montage (ТЗ docs/tasks/deck_perf_1009.md, этап 1 и повторный замер этапа 2).
 * Playwright + CDP: каждые 30 с снимает память, DOM, слушатели, видео, WebGL/canvas, rAF/таймеры, загрузку процессов;
 * на каждом слайде мерит нагрузку главного потока и GPU-процесса за окно удержания.
 *
 *   node docs/perf/long-run.mjs --label before --url http://localhost:3009/montage            # сценарий ТЗ: круг со стойкой 60 с на тяжёлых слайдах + два быстрых круга
 *   node docs/perf/long-run.mjs --label before-stand --stand 01 --minutes 5                    # стоять на одном слайде N минут
 *   node docs/perf/long-run.mjs --label quick --laps 1 --hold 2.5 --stand-s 0                  # быстрый прогон
 *
 * Только под замком C:\Проекты\_общее\heavy.ps1, строго один Chrome. Результат: docs/perf/data/<label>.json (+ сводка в консоль).
 * Браузер: Chrome по стандартному пути Windows (CHROMIUM_PATH), окно 1920×1080, звук выключен.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const LABEL = opt("--label", "run");
const URL_ = opt("--url", "http://localhost:3009/montage");
const HOLD = Number(opt("--hold", 4)); // пауза на слайде, с
const STAND_S = Number(opt("--stand-s", 60)); // стойка на тяжёлых слайдах (только круг 1), с
const LAPS = Number(opt("--laps", 3));
const SAMPLE_S = Number(opt("--sample-s", 30));
const STAND_KEY = opt("--stand"); // режим «стоять на одном слайде»
const STAND_MIN = Number(opt("--minutes", 5));
const MOUSE = args.includes("--mouse"); // водить мышью по экрану (как рука на трекпаде)
const DPR = Number(opt("--dpr", 1));
const LIMIT = Number(opt("--limit", 0)); // для проверки скрипта: только первые N слайдов
const W = Number(opt("--w", 1920)), H = Number(opt("--h", 1080));
const SETTLE = 1.6; // с от входа на слайд до начала окна замера: въезд слайда и пружины закончились

const deckSrc = readFileSync(join(ROOT, "components/montage-deck/MontageDeck.tsx"), "utf8");
const keys = [...deckSrc.slice(deckSrc.indexOf("const slides")).matchAll(/key="([^"]+)"/g)].map((m) => m[1]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const winChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const exe = process.env.CHROMIUM_PATH || (existsSync(winChrome) ? winChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const bcdp = await browser.newBrowserCDPSession();
await cdp.send("Performance.enable");

const consoleMsgs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleMsgs.push({ t: Date.now(), type: m.type(), text: m.text().slice(0, 300) }); });
page.on("pageerror", (e) => consoleMsgs.push({ t: Date.now(), type: "pageerror", text: String(e.message).slice(0, 300) }));
page.on("crash", () => consoleMsgs.push({ t: Date.now(), type: "CRASH", text: "страница упала" }));

// Обёртки до загрузки страницы: счётчики rAF, таймеров, canvas-контекстов, медиа-элементов, длинных задач
await page.addInitScript(() => {
  try { localStorage.setItem("sd-speaker", "live"); } catch {}
  const P = (window.__perf = {
    raf: { created: 0, fired: 0, pending: new Set() },
    iv: { created: 0, active: new Map() },
    to: { created: 0, active: new Set(), fast: 0 },
    ctx: { created: {}, lost: 0, canvases: [] },
    media: [], playCalls: 0,
    frames: 0, gap33: 0, gap50: 0, gap100: 0, maxGap: 0,
    longtasks: [], loaf: [], marks: [],
  });
  const _raf = window.requestAnimationFrame.bind(window), _caf = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    P.raf.created++;
    const id = _raf((t) => { P.raf.pending.delete(id); P.raf.fired++; cb(t); });
    P.raf.pending.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => { P.raf.pending.delete(id); _caf(id); };
  const _si = window.setInterval.bind(window), _ci = window.clearInterval.bind(window);
  window.setInterval = (fn, ms, ...a) => {
    const id = _si(fn, ms, ...a);
    P.iv.created++;
    let where = "";
    try { where = (new Error().stack || "").split("\n").slice(2, 4).join(" | ").replace(/\s+/g, " ").slice(0, 200); } catch {}
    P.iv.active.set(id, { ms, where });
    return id;
  };
  window.clearInterval = (id) => { P.iv.active.delete(id); _ci(id); };
  const _st = window.setTimeout.bind(window), _ct = window.clearTimeout.bind(window);
  window.setTimeout = (fn, ms, ...a) => {
    P.to.created++;
    if (!ms || ms < 20) P.to.fast++;
    const id = _st((...x) => { P.to.active.delete(id); if (typeof fn === "function") fn(...x); }, ms, ...a);
    P.to.active.add(id);
    return id;
  };
  window.clearTimeout = (id) => { P.to.active.delete(id); _ct(id); };
  const _gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...r) {
    const c = _gc.call(this, type, ...r);
    if (c) {
      P.ctx.created[type] = (P.ctx.created[type] || 0) + 1;
      P.ctx.canvases.push({ ref: new WeakRef(this), type });
      this.addEventListener("webglcontextlost", () => { P.ctx.lost++; });
    }
    return c;
  };
  const _ce = document.createElement.bind(document);
  document.createElement = (tag, o) => {
    const el = _ce(tag, o);
    if (/^(video|audio)$/i.test(tag)) P.media.push(new WeakRef(el));
    return el;
  };
  const _play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) { P.playCalls++; return _play.apply(this, a); };
  // кадры: свой rAF-цикл на неподменённом rAF
  let last = performance.now();
  const loop = (t) => {
    const g = t - last; last = t;
    P.frames++;
    if (g > P.maxGap) P.maxGap = g;
    if (g > 33.4) P.gap33++;
    if (g > 50) P.gap50++;
    if (g > 100) P.gap100++;
    _raf(loop);
  };
  _raf(loop);
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) P.longtasks.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const s = (e.scripts || []).slice().sort((a, b) => b.duration - a.duration)[0];
        P.loaf.push([Math.round(e.startTime), Math.round(e.duration), Math.round(e.blockingDuration || 0), s ? `${s.invokerType}:${(s.sourceFunctionName || s.invoker || "").slice(0, 60)}@${(s.sourceURL || "").split("/").pop().slice(0, 40)}:${s.sourceCharPosition}` : ""]);
      }
    }).observe({ type: "long-animation-frame", buffered: true });
  } catch {}
});

const startIdx = STAND_KEY ? keys.indexOf(STAND_KEY) : 0;
await page.goto(URL_ + "#" + (startIdx + 1), { waitUntil: "load" });
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
await sleep(2500);

// Информация о GPU
let gpuInfo = {};
try {
  const si = await bcdp.send("SystemInfo.getInfo");
  gpuInfo = { devices: si.gpu.devices.map((d) => `${d.vendorString} ${d.deviceString}`.trim()), feature: si.gpu.featureStatus ?? {} };
} catch (e) { gpuInfo = { err: String(e.message) }; }

const metricMap = (m) => Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));

/** Лёгкий снимок для окон по слайдам: накопленные времена процессов и счётчик кадров. */
async function light() {
  const [m, pi, pg] = await Promise.all([
    cdp.send("Performance.getMetrics"),
    bcdp.send("SystemInfo.getProcessInfo"),
    page.evaluate(() => ({ now: performance.now(), frames: __perf.frames, g33: __perf.gap33, g50: __perf.gap50, g100: __perf.gap100, raf: __perf.raf.fired })),
  ]);
  const mm = metricMap(m);
  const cpu = {};
  for (const p of pi.processInfo) cpu[p.type] = (cpu[p.type] ?? 0) + p.cpuTime;
  return { wall: Date.now(), task: mm.TaskDuration, script: mm.ScriptDuration, layout: mm.LayoutDuration, style: mm.RecalcStyleDuration, cpu, ...pg };
}
const diff = (a, b) => {
  const dt = (b.wall - a.wall) / 1000;
  const pct = (x) => Math.round((x / dt) * 1000) / 10;
  const cpu = {};
  for (const k of Object.keys(b.cpu)) cpu[k] = pct(b.cpu[k] - (a.cpu[k] ?? 0));
  const fr = b.frames - a.frames;
  return { sec: Math.round(dt * 10) / 10, mainPct: pct(b.task - a.task), scriptPct: pct(b.script - a.script), layoutPct: pct(b.layout - a.layout), stylePct: pct(b.style - a.style),
    cpuPct: cpu, fps: Math.round((fr / dt) * 10) / 10,
    msPerFrame: fr ? { main: Math.round(((b.task - a.task) * 1000 / fr) * 100) / 100, gpu: Math.round((((b.cpu.GPU ?? 0) - (a.cpu.GPU ?? 0)) * 1000 / fr) * 100) / 100, renderer: Math.round((((b.cpu.renderer ?? 0) - (a.cpu.renderer ?? 0)) * 1000 / fr) * 100) / 100 } : null, gap33: b.g33 - a.g33, gap50: b.g50 - a.g50, gap100: b.g100 - a.g100, rafPerFrame: fr ? Math.round(((b.raf - a.raf) / fr) * 100) / 100 : 0 };
};

function procMem(ids) {
  try {
    const out = execFileSync("powershell.exe", ["-NoProfile", "-Command", `Get-Process -Id ${ids.join(",")} -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id) $($_.WorkingSet64) $($_.PrivateMemorySize64)" }`], { encoding: "utf8", timeout: 15000 });
    const r = {};
    for (const line of out.split(/\r?\n/)) { const [id, ws, pv] = line.trim().split(" ").map(Number); if (id) r[id] = { ws, pv }; }
    return r;
  } catch { return {}; }
}

/** Полный снимок раз в SAMPLE_S: память (до и после сборки мусора), DOM, слушатели, видео, контексты, таймеры, процессы. */
const samples = [];
let sampling = false;
const t0 = Date.now();
let curSlide = { key: "", lap: 0 };
async function sample(tag = "", gc = false) {
  if (sampling) return;
  sampling = true;
  try {
    const m1 = metricMap(await cdp.send("Performance.getMetrics"));
    const pg = await page.evaluate(() => {
      const P = __perf;
      const vids = [...document.querySelectorAll("video")];
      const media = P.media.map((w) => w.deref()).filter(Boolean);
      const detached = media.filter((v) => !v.isConnected);
      const canv = P.ctx.canvases.map((c) => ({ el: c.ref.deref(), type: c.type })).filter((c) => c.el);
      const gl = canv.filter((c) => /webgl/.test(c.type));
      const nowAnim = document.getAnimations();
      return {
        now: performance.now(),
        videos: { inDoc: vids.length, playing: vids.filter((v) => !v.paused && !v.ended).length, withSrc: vids.filter((v) => v.getAttribute("src")).length,
          detachedAlive: detached.length, detachedWithSrc: detached.filter((v) => v.getAttribute("src") || v.currentSrc).length, detachedPlaying: detached.filter((v) => !v.paused).length },
        ctx: { created: { ...P.ctx.created }, lost: P.ctx.lost, liveGL: gl.filter((c) => c.el.isConnected).length, aliveGL: gl.length, live2d: canv.filter((c) => c.type === "2d" && c.el.isConnected).length, alive2d: canv.filter((c) => c.type === "2d").length },
        raf: { created: P.raf.created, fired: P.raf.fired, pending: P.raf.pending.size },
        iv: { created: P.iv.created, active: P.iv.active.size, list: [...P.iv.active.values()].map((x) => `${x.ms}ms ${x.where}`).slice(0, 6) },
        to: { created: P.to.created, active: P.to.active.size, fast: P.to.fast },
        anims: { all: nowAnim.length, running: nowAnim.filter((a) => a.playState === "running").length },
        frames: P.frames, g33: P.gap33, g50: P.gap50, g100: P.gap100, maxGap: Math.round(P.maxGap), playCalls: P.playCalls,
        domNodes: document.getElementsByTagName("*").length,
        hash: location.hash,
      };
    });
    const pi = (await bcdp.send("SystemInfo.getProcessInfo")).processInfo;
    const mem = procMem(pi.map((p) => p.id));
    const memBy = {};
    for (const p of pi) { const x = mem[p.id]; if (x) { memBy[p.type] ??= { ws: 0, pv: 0 }; memBy[p.type].ws += x.ws; memBy[p.type].pv += x.pv; } }
    // сборку мусора принудительно зовём только на концах кругов: иначе она прячет накопление нативной памяти у отсоединённых видео
    let m2 = null;
    if (gc) { await cdp.send("HeapProfiler.collectGarbage").catch(() => {}); m2 = metricMap(await cdp.send("Performance.getMetrics")); }
    const cpu = {};
    for (const p of pi) cpu[p.type] = (cpu[p.type] ?? 0) + p.cpuTime;
    samples.push({
      tag, tSec: Math.round((Date.now() - t0) / 1000), slide: curSlide.key, lap: curSlide.lap,
      heapMB: Math.round(m1.JSHeapUsedSize / 1048576 * 10) / 10, heapGcMB: m2 ? Math.round(m2.JSHeapUsedSize / 1048576 * 10) / 10 : null, heapTotalMB: Math.round(m1.JSHeapTotalSize / 1048576),
      nodes: m1.Nodes, listeners: m1.JSEventListeners, documents: m1.Documents, frames: m1.Frames,
      layoutCount: m1.LayoutCount, recalcCount: m1.RecalcStyleCount, taskSec: Math.round(m1.TaskDuration * 100) / 100, scriptSec: Math.round(m1.ScriptDuration * 100) / 100,
      cpuSec: Object.fromEntries(Object.entries(cpu).map(([k, v]) => [k, Math.round(v * 100) / 100])),
      memMB: Object.fromEntries(Object.entries(memBy).map(([k, v]) => [k, { ws: Math.round(v.ws / 1048576), pv: Math.round(v.pv / 1048576) }])),
      ...pg,
    });
    const s = samples[samples.length - 1];
    log(`[sample ${s.tSec}s] слайд ${s.slide} круг ${s.lap}: heap ${s.heapMB}${s.heapGcMB != null ? "→" + s.heapGcMB : ""} МБ, рендерер ${s.memMB.renderer?.pv ?? "?"} МБ, узлов ${s.nodes}, слушателей ${s.listeners}, видео ${s.videos.inDoc}/${s.videos.playing} играют, отсоединённых ${s.videos.detachedAlive}, GL ${s.ctx.liveGL}/${s.ctx.aliveGL}, rAF в ожидании ${s.raf.pending}, интервалов ${s.iv.active}, анимаций ${s.anims.running}`);
    await saveOut(false);
  } catch (e) {
    log("ошибка снимка:", e.message);
  } finally { sampling = false; }
}

const slides = []; // по слайдам и кругам
let heavyKeys = new Set();
const t00 = Date.now();
async function probe() {
  return page.evaluate(() => {
    const root = document.querySelector(".montage-deck");
    const all = root.querySelectorAll("*");
    let bf = 0, w3d = 0, wc = 0, blur = 0, mask = 0, filt = 0;
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.backdropFilter && cs.backdropFilter !== "none") bf++;
      if (cs.transformStyle === "preserve-3d") w3d++;
      if (cs.willChange && cs.willChange !== "auto") wc++;
      if (cs.filter && cs.filter !== "none") { filt++; if (cs.filter.includes("blur")) blur++; }
      if ((cs.maskImage && cs.maskImage !== "none") || (cs.webkitMaskImage && cs.webkitMaskImage !== "none")) mask++;
    }
    const an = document.getAnimations();
    const inf = an.filter((a) => { try { return a.effect.getComputedTiming().iterations === Infinity; } catch { return false; } }).length;
    const vids = [...root.querySelectorAll("video")];
    return { nodes: all.length, video: vids.length, videoPlaying: vids.filter((v) => !v.paused).length, canvas: root.querySelectorAll("canvas").length, img: root.querySelectorAll("img").length,
      backdrop: bf, preserve3d: w3d, willChange: wc, blurFilter: blur, filter: filt, mask, infAnim: inf, anims: an.length, rafPending: __perf.raf.pending.size };
  });
}

async function goto(i) {
  // переход листанием стрелкой, как на эфире; если слайд залип на предыдущем (AnimatePresence), нажимаем ещё раз
  const want = `#${i + 1}`;
  for (let a = 0; a < 3; a++) {
    const h = await page.evaluate(() => location.hash);
    if (h === want) return true;
    if (i === 0) await page.keyboard.press("Home"); else await page.keyboard.press("ArrowRight");
    await sleep(350);
  }
  return (await page.evaluate(() => location.hash)) === want;
}

let mouseOn = false;
async function mouseLoop() {
  let a = 0;
  while (mouseOn) {
    a += 0.35;
    await page.mouse.move(W * (0.35 + 0.25 * Math.sin(a)), H * (0.5 + 0.3 * Math.cos(a * 0.8))).catch(() => {});
    await sleep(40);
  }
}

const sampler = setInterval(() => sample(), SAMPLE_S * 1000);
await sample("start");
if (MOUSE) { mouseOn = true; mouseLoop(); }

async function visit(i, lap, holdS, doProbe) {
  const key = keys[i];
  curSlide = { key, lap };
  await page.evaluate(([k, l]) => __perf.marks.push([Math.round(performance.now()), k, l]), [key, lap]);
  const ok = await goto(i);
  const tIn = Date.now();
  await sleep(SETTLE * 1000);
  const a = await light();
  const pr = doProbe ? await probe() : null;
  const left = holdS * 1000 - (Date.now() - tIn) - 80;
  if (left > 0) await sleep(left);
  const b = await light();
  const rec = { key, idx: i, lap, ok, holdS, ...diff(a, b), probe: pr };
  slides.push(rec);
  return rec;
}

/** Сохранение результата: после каждого снимка и в конце. Если прогон прервут (замок нужен другой сессии), накопленное останется в файле (partial: true). */
async function saveOut(isFinal = false) {
  let final = { longtasks: [], loaf: [], marks: [] };
  try { final = await page.evaluate(() => ({ longtasks: __perf.longtasks, loaf: __perf.loaf, marks: __perf.marks })); } catch {}
  const out = {
    label: LABEL, partial: !isFinal, url: URL_, viewport: [W, H, DPR], hold: HOLD, standS: STAND_S, laps: LAPS, sampleS: SAMPLE_S, keys, heavy: [...heavyKeys], startedAt: new Date(t0).toISOString(),
    totalSec: Math.round((Date.now() - t00) / 1000), gpu: gpuInfo, samples, slides, longtasks: final.longtasks, loaf: final.loaf, marks: final.marks, console: consoleMsgs,
  };
  mkdirSync(join(here, "data"), { recursive: true });
  writeFileSync(join(here, "data", `${LABEL}.json`), JSON.stringify(out));
}

if (STAND_KEY) {
  const i = keys.indexOf(STAND_KEY);
  await visit(i, 1, 6, true);
  const a = await light();
  await sleep(STAND_MIN * 60 * 1000);
  const b = await light();
  slides.push({ key: STAND_KEY, idx: i, lap: "stand", ...diff(a, b) });
} else {
  for (let lap = 1; lap <= LAPS; lap++) {
    log(`=== круг ${lap} ===`);
    for (let i = 0; i < (LIMIT || keys.length); i++) {
      const key = keys[i];
      // круг 1: определяем тяжёлые слайды (видео, canvas, 3D-тоннель, ленты на rAF) и стоим на них STAND_S секунд
      let hold = HOLD;
      if (lap === 1) {
        const rec = await visit(i, lap, HOLD, true);
        const p = rec.probe;
        const heavy = p.video > 0 || p.canvas > 0 || p.preserve3d > 3 || p.willChange > 3;
        rec.heavy = heavy;
        if (heavy) {
          heavyKeys.add(key);
          if (STAND_S > HOLD) {
            const a = await light();
            await sleep((STAND_S - HOLD) * 1000);
            const b = await light();
            const stand = diff(a, b);
            rec.stand = stand;
            log(`  ${key}: стойка ${STAND_S} с, главный поток ${stand.mainPct}%, GPU ${stand.cpuPct.gpu ?? "?"}%, fps ${stand.fps}`);
          }
        }
      } else {
        await visit(i, lap, hold, false);
      }
    }
    await sample(`конец круга ${lap}`, true);
  }
}
mouseOn = false;
clearInterval(sampler);
await sleep(300);
await sample("end", true);

await saveOut(true);
log(`готово за ${Math.round((Date.now() - t00) / 1000)} с, слайдов-записей ${slides.length} → docs/perf/data/${LABEL}.json`);
await browser.close();
process.exit(0);
