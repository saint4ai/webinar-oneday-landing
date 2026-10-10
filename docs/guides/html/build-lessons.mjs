// Сборка PDF-раздаток к урокам: Playwright Chromium, альбомный A4, одна секция = одна страница.
// Запуск: node docs/guides/html/build-lessons.mjs [all|<имя раздела>|общий|extra|all-extra] [--shots <папка>]
//   без аргументов: общий PDF и PDF каждого раздела основного пакета, затем дополнения (docs/guides/out/lessons/)
//   extra: только дополнения (общий Vibe-Production-dopolneniya.pdf и по файлу на раздел); all-extra: только общий файл дополнений
//   --shots <папка>: дополнительно снимки страниц общего файла в PNG (для просмотра вёрстки; у дополнений файлы x01.png…)
// Перед запуском взять общий замок тяжёлых процессов (heavy.ps1 take), после сборки снять (release).
// Потом: python docs/guides/html/qa-lessons.py  (pypdf, текст, ссылки, превью JPG и лист-превью)
import { chromium } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const lessonsDir = join(here, "lessons");
const outDir = join(here, "../out/lessons");
mkdirSync(outDir, { recursive: true });

const manifest = JSON.parse(readFileSync(join(lessonsDir, "manifest.json"), "utf8"));
const args = process.argv.slice(2);
const shotsIdx = args.indexOf("--shots");
const shotsDir = shotsIdx >= 0 ? args[shotsIdx + 1] : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });
const pos = args.filter((a, i) => !a.startsWith("--") && !(shotsIdx >= 0 && i === shotsIdx + 1));
const want = pos[0] || "all";

const mainJobs = [{ file: "all", pdf: "Vibe-Production-razdatki.pdf" }, ...manifest.sections.map((s) => ({ file: s.file, pdf: `${s.file}.pdf` }))];
// дополнения: свои HTML и PDF, в общий файл основного пакета не входят
const extraJobs = manifest.extra ? [{ file: "all-extra", pdf: `${manifest.extra.all}.pdf` }, ...manifest.extra.sections.map((s) => ({ file: s.file, pdf: `${s.file}.pdf` }))] : [];
const jobs = [...mainJobs, ...extraJobs];
const todo = want === "all" ? jobs : want === "общий" ? [jobs[0]] : want === "extra" ? extraJobs : jobs.filter((j) => j.file === want);
if (!todo.length) { console.log("нет такого раздела: " + want); process.exit(2); }

const browser = await chromium.launch();
let bad = 0;
for (const job of todo) {
  const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });
  await page.goto(pathToFileURL(join(lessonsDir, `${job.file}.html`)).href, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.waitForTimeout(1200);

  const issues = await page.evaluate(() => {
    const out = [];
    const tagOf = (el) => `${el.tagName.toLowerCase()}.${(el.className && el.className.baseVal === undefined ? el.className : "").toString().split(" ").filter(Boolean).join(".")}`;
    const txt = (el) => (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34);
    // шрифты и картинки
    for (const f of ["700 20px Unbounded", "600 16px Manrope"]) if (!document.fonts.check(f)) out.push(`шрифт не загружен: ${f}`);
    for (const im of document.images) if (!im.naturalWidth) out.push(`картинка не загрузилась: ${im.getAttribute("src")}`);
    document.querySelectorAll(".page").forEach((pg, pi) => {
      const pr = pg.getBoundingClientRect();
      const cover = pg.classList.contains("cover");
      if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) {
        out.push(`стр.${pi + 1}: scroll ${pg.scrollWidth}x${pg.scrollHeight} > ${pg.clientWidth}x${pg.clientHeight}`);
        // кто вылез за край страницы (включая рисунки и свечение)
        pg.querySelectorAll("*").forEach((el) => { const r = el.getBoundingClientRect(); if (r.width && (r.bottom > pr.bottom - 4 || r.right > pr.right + 1) && !el.closest(".glow,.bleed")) out.push(`   за краем: ${tagOf(el)} низ ${Math.round(r.bottom - pr.top)} право ${Math.round(r.right - pr.left)} «${txt(el)}»`); });
      }
      pg.querySelectorAll("*").forEach((el) => {
        if (el.closest(".foot,.bleed,.glow,svg")) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const cs = getComputedStyle(el);
        const tag = tagOf(el);
        // граница контента: подвал и поля
        if (!cover && r.bottom > pr.bottom - 56) out.push(`стр.${pi + 1}: ${tag} заходит на подвал (низ ${Math.round(r.bottom - pr.top)} из ${Math.round(pr.height)}) «${txt(el)}»`);
        if (!cover && (r.right > pr.right - 40 || r.left < pr.left + 40)) out.push(`стр.${pi + 1}: ${tag} у края (${Math.round(r.left - pr.left)}..${Math.round(r.right - pr.left)}) «${txt(el)}»`);
        if (cover && (r.right > pr.right - 20 || r.left < pr.left + 40)) out.push(`стр.${pi + 1}: ${tag} у края обложки (${Math.round(r.left - pr.left)}..${Math.round(r.right - pr.left)}) «${txt(el)}»`);
        // обрезка содержимого внутри блока
        if (el.scrollWidth > el.clientWidth + 1 && cs.overflow !== "visible" && !el.classList.contains("res") && !el.classList.contains("nb")) out.push(`стр.${pi + 1}: ${tag} обрезан по ширине «${txt(el)}»`);
        if (el.scrollHeight > el.clientHeight + 2 && cs.overflow !== "visible" && !el.classList.contains("nb")) out.push(`стр.${pi + 1}: ${tag} обрезан по высоте «${txt(el)}»`);
        // потомок вылез из родителя (текст за рамкой карточки)
        if (!el.classList.contains("ov") && cs.position !== "absolute") {
          for (const c of el.children) {
            if (c.closest("svg") && c.tagName.toLowerCase() !== "svg") continue;
            const ccs = getComputedStyle(c);
            if (c.classList.contains("ov") || ccs.position === "absolute" || ccs.display === "inline") continue;
            const cr = c.getBoundingClientRect();
            if (!cr.width || !cr.height) continue;
            const tol = 2;
            if (cr.right > r.right + tol || cr.left < r.left - tol || cr.bottom > r.bottom + tol || cr.top < r.top - tol)
              out.push(`стр.${pi + 1}: ${tagOf(c)} вылез из ${tag} (${Math.round(cr.left - r.left)},${Math.round(cr.top - r.top)} ${Math.round(cr.width)}x${Math.round(cr.height)} в ${Math.round(r.width)}x${Math.round(r.height)}) «${txt(c)}»`);
          }
        }
        // мелкий текст
        let own = ""; for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent;
        if (own.trim().length > 1) {
          const fs = parseFloat(cs.fontSize);
          if (fs < 12) out.push(`стр.${pi + 1}: шрифт ${fs}px меньше 12 «${txt(el)}»`);
        }
      });
    });
    return out;
  });
  if (issues.length) { bad += issues.length; console.log(`[${job.file}] проверка вёрстки (${issues.length}):\n  ` + [...new Set(issues)].slice(0, 400).join("\n  ")); }
  else console.log(`[${job.file}] вёрстка: переполнений нет`);

  if (args.includes("--dump") && (job.file === "all" || job.file === "all-extra")) {
    const dump = await page.evaluate(() => [...document.querySelectorAll(".page")].map((pg, i) => {
      const parts = [];
      const walk = (el, d) => { for (const c of el.children) { if (c.classList.contains("foot") || c.classList.contains("glow")) continue; const r = c.getBoundingClientRect(); const cn = (c.className.baseVal === undefined ? c.className : "").toString().split(" ")[0] || c.tagName.toLowerCase(); parts.push(`${"  ".repeat(d)}${cn} ${Math.round(r.height)}`); if (c.classList.contains("bd") && d < 1) walk(c, d + 1); } };
      walk(pg, 0);
      return `p${i + 1} (${Math.round(pg.querySelector(".foot") ? pg.querySelector(".foot").getBoundingClientRect().top - pg.getBoundingClientRect().top : 0)}): ` + parts.join(" | ");
    }));
    console.log(dump.join("\n"));
  }
  if (shotsDir && (job.file === "all" || job.file === "all-extra")) {
    const secs = await page.$$(".page");
    const pre = job.file === "all" ? "p" : "x";
    for (let i = 0; i < secs.length; i++) await secs[i].screenshot({ path: join(shotsDir, `${pre}${String(i + 1).padStart(2, "0")}.png`) });
    console.log(`снимки страниц: ${secs.length} в ${shotsDir}`);
  }

  await page.pdf({
    path: join(outDir, job.pdf),
    width: "297mm", height: "210mm", printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" }, preferCSSPageSize: false,
  });
  await page.close();
}
await browser.close();
console.log(bad ? `замечаний: ${bad}` : "замечаний нет");
