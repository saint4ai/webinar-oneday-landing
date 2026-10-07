// Сборка PDF-гайдов: Playwright Chromium, альбомный A4, одна секция = одна страница.
// Запуск: node docs/guides/html/build.mjs [gaid-virusny-rils|kontent-plan|30-hukov|all]
// Потом: python docs/guides/html/qa.py  (проверка pypdf, текст, ссылки, превью JPG)
import { chromium } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../../../workshop-montazh/assets/bonus");
const GUIDES = { "gaid-virusny-rils": "gaid-virusny-rils.html", "kontent-plan": "kontent-plan.html", "30-hukov": "30-hukov.html" };
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
