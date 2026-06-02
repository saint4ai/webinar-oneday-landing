import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

/*
 * qa_audit.mjs — DOM-аудит слайдов БЕЗ скриншотов (в ~10× дешевле для CPU).
 * Грузит каждый слайд один раз в ОДНОМ браузере, измеряет геометрию текста,
 * печатает ТОЛЬКО проблемные слайды. Скриншотить потом — лишь помеченные.
 *
 * Usage: node qa_audit.mjs <port> <startHash> <endHash> [zoneFrac=0.7] [minFont=13] [W=1920] [H=1080] [outJson] [routeBase=/sales-deck]
 * Пример: node qa_audit.mjs 3001 1 183 0.7 13 1920 1080 _screenshots/audit.json
 */
const port = process.argv[2] || "3001";
const start = +(process.argv[3] || 1);
const end = +(process.argv[4] || start);
const zoneFrac = +(process.argv[5] || 0.7);
const minFont = +(process.argv[6] || 13);
const W = +(process.argv[7] || 1920);
const H = +(process.argv[8] || 1080);
const outJson = process.argv[9] || "";
const routeBase = process.argv[10] || "/sales-deck";
const settle = 1600; // мс на оседание анимаций — дешевле большого ожидания

const browser = await chromium.launch();
const report = [];
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (let h = start; h <= end; h++) {
    const errors = [];
    // фильтруем шум загрузки ресурсов (404 favicon/ассетов) — ловим только настоящие JS-ошибки
    const onMsg = (m) => { if (m.type() === "error" && !/failed to load resource|404|favicon/i.test(m.text())) errors.push(m.text().slice(0, 120)); };
    page.on("console", onMsg);
    // ?cap=<h> делает URL уникальным → реальный reload (hash-only goto = same-document, слайд не сменится)
    // robust: domcontentloaded + best-effort networkidle — на dev-сервере networkidle может зависнуть при HMR-рекомпиляции,
    // поэтому ловим таймаут и снимаем что отрендерилось (один зависший слайд не роняет весь прогон)
    try {
      await page.goto(`http://localhost:${port}${routeBase}?cap=${h}#${h}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForLoadState("networkidle", { timeout: 7000 }).catch(() => {});
    } catch { /* navigation timeout — продолжаем */ }
    await page.waitForTimeout(settle);
    const res = await page.evaluate(({ zoneFrac, minFont, W, H }) => {
      const zone = W * zoneFrac;
      const out = { textLen: 0, speaker: null, edge: [], clip: [], tiny: [], card: [] };
      let maxRight = 0, maxRightText = "";
      const els = [...document.querySelectorAll("h1,h2,h3,p,span,div,li,button,a")];
      for (const el of els) {
        const ownText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
        if (!ownText) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
        const fs = parseFloat(cs.fontSize) || 0;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue; // вне экрана
        const isMono = (cs.fontFamily || "").toLowerCase().includes("mono");
        const snip = ownText.slice(0, 38);
        out.textLen += ownText.length;
        if (fs > 0 && fs < minFont && !isMono) out.tiny.push({ t: snip, fs: Math.round(fs) });
        if (r.right > W + 2) out.edge.push({ t: snip, right: Math.round(r.right) });
        if (r.top < -2) out.clip.push({ t: snip, v: Math.round(r.top), side: "top" });
        if (r.bottom > H + 2) out.clip.push({ t: snip, v: Math.round(r.bottom), side: "bottom" });
        if (fs >= 14 && r.right > maxRight) { maxRight = r.right; maxRightText = snip; }
        if (el.scrollWidth > el.clientWidth + 2 && fs >= 11) out.card.push({ t: snip });
      }
      out.speaker = { zone: Math.round(zone), maxRight: Math.round(maxRight), text: maxRightText, intrudes: maxRight > zone };
      return out;
    }, { zoneFrac, minFont, W, H });
    page.off("console", onMsg);

    const flags = [];
    if (res.speaker.intrudes) flags.push(`SPEAKER(${res.speaker.maxRight}>${res.speaker.zone} "${res.speaker.text}")`);
    if (res.edge.length) flags.push(`EDGE(${res.edge.map((x) => `"${x.t}"@${x.right}`).join(", ")})`);
    if (res.clip.length) flags.push(`CLIP(${res.clip.map((x) => `${x.side}:"${x.t}"`).join(", ")})`);
    if (res.tiny.length) flags.push(`TINY(${res.tiny.slice(0, 6).map((x) => `${x.fs}px:"${x.t}"`).join(", ")})`);
    if (res.card.length) flags.push(`CARD_OVERFLOW(${res.card.slice(0, 6).map((x) => `"${x.t}"`).join(", ")})`);
    if (res.textLen < 40) flags.push(`BLANK?(len=${res.textLen})`);
    if (errors.length) flags.push(`CONSOLE_ERR(${errors.length})`);
    if (flags.length) report.push({ h, flags });
    console.log(`h${h}: ${flags.length ? flags.join(" | ") : "ok"}`);
  }
} finally {
  await browser.close();
}
console.log(`\n=== FLAGGED (${report.length}) ===`);
console.log(report.length ? report.map((r) => `h${r.h}: ${r.flags.join(" | ")}`).join("\n") : "проблем не найдено");
if (report.length) console.log(`\nскриншоть: node cap_batch.mjs ${port} ${report.map((r) => r.h).join(",")} _screenshots/flagged`);
if (outJson) { mkdirSync(outJson.replace(/\/[^/]+$/, "") || ".", { recursive: true }); writeFileSync(outJson, JSON.stringify(report, null, 2)); }
