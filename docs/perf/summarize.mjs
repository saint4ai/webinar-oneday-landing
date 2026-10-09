#!/usr/bin/env node
/**
 * Сводка замера из docs/perf/data/<label>.json в markdown-таблицы для отчёта.
 *   node docs/perf/summarize.mjs before [after]
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const load = (l) => JSON.parse(readFileSync(join(here, "data", l + ".json"), "utf8"));
const labels = process.argv.slice(2);
const f1 = (x) => (x == null ? "-" : (Math.round(x * 10) / 10).toString());

for (const label of labels) {
  const d = load(label);
  console.log(`\n## ${label}: ${d.totalSec} с, окно ${d.viewport.join("×")}, тяжёлых слайдов ${d.heavy.length}: ${d.heavy.join(" ")}`);
  console.log(`GPU: ${(d.gpu.devices ?? []).join(", ")}; compositing ${d.gpu.feature?.gpu_compositing}`);

  // 1) снимки раз в 30 с
  console.log("\n| с | круг | слайд | heap МБ | heap после GC | узлов DOM | слушателей | видео в DOM / играют / отсоед. | GL | canvas 2d | rAF ждут | интервалов | активных анимаций | renderer МБ (private) | GPU-процесс МБ | главный поток % за окно | пересчётов стиля в с | раскладок в с | длинных задач за окно |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  let prev = null;
  for (const s of d.samples) {
    let busy = "-", lt = "-", rc = "-", lc = "-";
    if (prev) {
      const dt = s.tSec - prev.tSec;
      busy = dt > 0 ? f1(((s.taskSec - prev.taskSec) / dt) * 100) : "-";
      rc = dt > 5 ? Math.round((s.recalcCount - prev.recalcCount) / dt) : "-";
      lc = dt > 5 ? Math.round((s.layoutCount - prev.layoutCount) / dt) : "-";
      const t0 = prev.now, t1 = s.now;
      lt = String(d.longtasks.filter(([st]) => st >= t0 && st < t1).length);
    }
    console.log(`| ${s.tSec} | ${s.lap} | ${s.slide || "-"} | ${s.heapMB} | ${s.heapGcMB ?? ""} | ${s.nodes} | ${s.listeners} | ${s.videos.inDoc} / ${s.videos.playing} / ${s.videos.detachedAlive} | ${s.ctx.liveGL}/${s.ctx.aliveGL} | ${s.ctx.live2d} | ${s.raf.pending} | ${s.iv.active} | ${s.anims.running} | ${s.memMB.renderer?.pv ?? "?"} | ${s.memMB.GPU?.pv ?? "?"} | ${busy} | ${rc} | ${lc} | ${lt} |`);
    prev = s;
  }

  // 2) концы кругов
  console.log("\nКонцы кругов (после принудительной сборки мусора):");
  console.log("| круг | heap МБ | узлов DOM | слушателей | renderer МБ | GPU МБ | отсоединённых видео | документов |");
  console.log("|---|---|---|---|---|---|---|---|");
  for (const s of d.samples.filter((x) => x.tag.startsWith("конец круга"))) {
    console.log(`| ${s.tag.replace("конец круга ", "")} | ${s.heapGcMB} | ${s.nodes} | ${s.listeners} | ${s.memMB.renderer?.pv ?? "?"} | ${s.memMB.GPU?.pv ?? "?"} | ${s.videos.detachedAlive} | ${s.documents} |`);
  }

  // 3) нагрузка по слайдам (круг 1, окно после въезда)
  const lap = (n) => d.slides.filter((x) => x.lap === n);
  const l1 = lap(1), l2 = lap(2), l3 = lap(3);
  const byKey = (arr) => Object.fromEntries(arr.map((x) => [x.key, x]));
  const m2 = byKey(l2), m3 = byKey(l3);
  console.log("\nЗатраты на кадр по слайдам (круг 1; окно ~2,3 с после въезда). main: главный поток, GPU: процесс GPU (CPU-время), мс на кадр; fps в headless без вертикальной синхронизации:");
  console.log("| слайд | fps | main мс/кадр | GPU мс/кадр | renderer мс/кадр | круг 2: main / GPU | круг 3: main / GPU | узлов | backdrop | will-change | видео | canvas | бесконечных анимаций |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const x of l1) {
    const a = m2[x.key], b = m3[x.key], p = x.probe ?? {};
    console.log(`| ${x.key}${x.heavy ? " ★" : ""} | ${f1(x.fps)} | ${x.msPerFrame?.main ?? "-"} | ${x.msPerFrame?.gpu ?? "-"} | ${x.msPerFrame?.renderer ?? "-"} | ${a?.msPerFrame ? a.msPerFrame.main + " / " + a.msPerFrame.gpu : "-"} | ${b?.msPerFrame ? b.msPerFrame.main + " / " + b.msPerFrame.gpu : "-"} | ${p.nodes ?? "-"} | ${p.backdrop ?? "-"} | ${p.willChange ?? "-"} | ${p.video ?? "-"} | ${p.canvas ?? "-"} | ${p.infAnim ?? "-"} |`);
  }
  const avg = (arr, f) => (arr.length ? arr.reduce((s, x) => s + f(x), 0) / arr.length : 0);
  const ok = (x) => x.msPerFrame;
  console.log(`\nСреднее по слайдам: круг 1 main ${f1(avg(l1.filter(ok), (x) => x.msPerFrame.main))} мс/кадр, GPU ${f1(avg(l1.filter(ok), (x) => x.msPerFrame.gpu))}; круг 2 main ${f1(avg(l2.filter(ok), (x) => x.msPerFrame.main))}, GPU ${f1(avg(l2.filter(ok), (x) => x.msPerFrame.gpu))}; круг 3 main ${f1(avg(l3.filter(ok), (x) => x.msPerFrame.main))}, GPU ${f1(avg(l3.filter(ok), (x) => x.msPerFrame.gpu))}`);

  // 4) стойки 60 с
  console.log("\nСтойка 60 с на тяжёлых слайдах:");
  console.log("| слайд | fps | main мс/кадр | GPU мс/кадр | renderer мс/кадр | кадров дольше 50 мс | дольше 100 мс |");
  console.log("|---|---|---|---|---|---|---|");
  for (const x of l1.filter((y) => y.stand)) console.log(`| ${x.key} | ${f1(x.stand.fps)} | ${x.stand.msPerFrame?.main} | ${x.stand.msPerFrame?.gpu} | ${x.stand.msPerFrame?.renderer} | ${x.stand.gap50} | ${x.stand.gap100} |`);

  // 5) длинные задачи
  const marks = d.marks; // [t, key, lap]
  const slideAt = (t) => { let r = ["?", 0]; for (const m of marks) { if (m[0] <= t) r = [m[1], m[2]]; else break; } return r; };
  const sampleTimes = d.samples.map((s) => s.now);
  const lts = d.longtasks.filter(([st]) => !sampleTimes.some((t) => st >= t - 200 && st <= t + 2500));
  const over200 = lts.filter(([, du]) => du > 200);
  console.log(`\nДлинные задачи (>50 мс, без окон снимков): всего ${lts.length}, дольше 200 мс: ${over200.length}, максимум ${lts.length ? Math.max(...lts.map((x) => x[1])) : 0} мс`);
  const per = {};
  for (const [st, du] of lts) { const [k] = slideAt(st); per[k] ??= { n: 0, max: 0 }; per[k].n++; per[k].max = Math.max(per[k].max, du); }
  console.log("| слайд (на котором случилась) | задач | максимум мс |");
  console.log("|---|---|---|");
  for (const [k, v] of Object.entries(per).sort((a, b) => b[1].max - a[1].max).slice(0, 15)) console.log(`| ${k} | ${v.n} | ${v.max} |`);
  const loaf = d.loaf.filter(([st]) => !sampleTimes.some((t) => st >= t - 200 && st <= t + 2500)).sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log("\nСамые долгие кадры (long-animation-frame): время мс, длительность мс, блокировка мс, главный скрипт");
  for (const l of loaf) console.log(`- ${slideAt(l[0]).join("/круг ")}: ${l[1]} мс (блок ${l[2]}) ${l[3]}`);

  // 6) консоль
  const cs = d.console.filter((m) => !/preloaded using link preload/.test(m.text));
  console.log(`\nКонсоль (ошибки и предупреждения, кроме preload): ${cs.length}`);
  for (const m of cs.slice(0, 10)) console.log(`- ${m.type}: ${m.text.slice(0, 200)}`);
  const webglWarn = d.console.filter((m) => /Too many active WebGL contexts/i.test(m.text)).length;
  console.log(`«Too many active WebGL contexts»: ${webglWarn}`);
}
