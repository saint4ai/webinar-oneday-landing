// Сборка PDF-гайдов: Playwright Chromium, альбомный A4, одна секция = одна страница.
// Запуск: node docs/guides/html/build.mjs [karta-6-referensov|gaid-virusny-rils|kontent-plan|30-hukov|all]
// Только под замком: powershell -NoProfile -File C:\Проекты\_общее\heavy.ps1 take -who "<сессия>" -what "PDF гайдов воркшопа"
// Потом: python docs/guides/html/qa.py  (pypdf: текст, ссылки, артефакты PDF; превью рисует PyMuPDF, не Chrome)
import { chromium } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../../../workshop-montazh/assets/bonus");
const GUIDES = { "karta-6-referensov": "karta-6-referensov.html", "gaid-virusny-rils": "gaid-virusny-rils.html", "kontent-plan": "kontent-plan.html", "30-hukov": "30-hukov.html" };
const arg = process.argv[2] || "all";
const names = arg === "all" ? Object.keys(GUIDES) : [arg];

const browser = await chromium.launch();
let bad = 0;
for (const name of names) {
  const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });
  await page.goto(pathToFileURL(join(here, GUIDES[name])).href, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.waitForTimeout(1500);

  // проверка вёрстки: ничего не вылезает за поля страницы и не заходит на подвал
  const issues = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".page").forEach((pg, pi) => {
      const pr = pg.getBoundingClientRect();
      if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) out.push(`стр.${pi + 1}: scroll ${pg.scrollWidth}x${pg.scrollHeight} > ${pg.clientWidth}x${pg.clientHeight}`);
      pg.querySelectorAll("*").forEach((el) => {
        if (el.closest(".foot,.bleed,.glow,svg")) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const tag = `${el.tagName.toLowerCase()}.${(el.className && el.className.baseVal === undefined ? el.className : "").toString().split(" ")[0]}`;
        if (!pg.classList.contains("cover") && r.bottom > pr.bottom - 56) out.push(`стр.${pi + 1}: ${tag} заходит на подвал (низ ${Math.round(r.bottom - pr.top)} из ${Math.round(pr.height)}) «${(el.textContent || "").trim().slice(0, 30)}»`);
        if (r.right > pr.right - 40 || r.left < pr.left + 40) out.push(`стр.${pi + 1}: ${tag} у края (${Math.round(r.left - pr.left)}..${Math.round(r.right - pr.left)}) «${(el.textContent || "").trim().slice(0, 30)}»`);
        if (!el.classList.contains("nb") && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible") out.push(`стр.${pi + 1}: ${tag} обрезан по ширине «${(el.textContent || "").trim().slice(0, 30)}»`);
      });
    });
    return out;
  });
  // проверка артефактов PDF (09.10.2026): тени, фильтры, размытие, прозрачность и градиенты Chrome кладёт в PDF
  // растровыми кусками с маской, а часть просмотрщиков на телефоне рисует их тёмными прямоугольниками
  const arts = await page.evaluate(() => {
    const out = [];
    const nm = (el) => {
      const c = el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className;
      const pg = el.closest(".page");
      const pi = pg ? [...document.querySelectorAll(".page")].indexOf(pg) + 1 : 0;
      return `стр.${pi}: ${el.tagName.toLowerCase()}${c ? "." + String(c).trim().split(/\s+/).join(".") : ""} «${(el.textContent || "").trim().slice(0, 24)}»`;
    };
    const alpha = (v) => { const m = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(v); return m ? parseFloat(m[4]) : 1; };
    document.querySelectorAll("body *").forEach((el) => {
      if (["SCRIPT", "STYLE"].includes(el.tagName)) return;
      const cs = getComputedStyle(el);
      const bad = [];
      if (cs.boxShadow !== "none") bad.push("box-shadow");
      if (cs.textShadow !== "none") bad.push("text-shadow");
      if (cs.filter !== "none") bad.push("filter");
      if ((cs.backdropFilter || "none") !== "none") bad.push("backdrop-filter");
      if (cs.mixBlendMode !== "normal") bad.push("mix-blend-mode");
      if (parseFloat(cs.opacity) < 1) bad.push(`opacity ${cs.opacity}`);
      if (parseFloat(cs.fillOpacity) < 1) bad.push("fill-opacity");
      if (parseFloat(cs.strokeOpacity) < 1) bad.push("stroke-opacity");
      if (/gradient/.test(cs.backgroundImage)) bad.push("CSS-градиент");
      for (const k of ["color", "backgroundColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor"]) {
        if (k.startsWith("border") && parseFloat(cs[k.replace("Color", "Width")]) === 0) continue;
        const a = alpha(cs[k]);
        if (a > 0 && a < 1) { bad.push(`полупрозрачный ${k} ${cs[k]}`); break; }
      }
      if (bad.length) out.push(`${nm(el)}: ${bad.join(", ")}`);
    });
    document.querySelectorAll("svg linearGradient,svg radialGradient,svg filter,svg mask").forEach((el) => out.push(`${nm(el.closest("svg"))}: SVG ${el.tagName}`));
    return out;
  });
  if (arts.length) { bad += arts.length; console.log(`[${name}] артефакты PDF (${arts.length}):\n  ` + [...new Set(arts)].slice(0, 80).join("\n  ")); }
  else console.log(`[${name}] артефакты PDF: нет (ни теней, ни фильтров, ни прозрачности)`);

  if (issues.length) { bad += issues.length; console.log(`[${name}] проверка вёрстки:\n  ` + [...new Set(issues)].slice(0, 60).join("\n  ")); }
  else console.log(`[${name}] вёрстка: переполнений нет`);

  await page.pdf({
    path: join(outDir, `${name}.pdf`),
    width: "297mm", height: "210mm", printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" }, preferCSSPageSize: false,
  });
  await page.close();
}
await browser.close();
console.log(bad ? `замечаний: ${bad}` : "замечаний нет");
if (bad) process.exitCode = 1;
