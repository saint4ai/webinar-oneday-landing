import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

// auditH1H2.mjs [port=3001] [outDir=/tmp/h1h2] [W=1920] [H=1080]
// Грузит /sales-deck ОДИН раз, идёт ArrowRight с counter-верификацией.
// По каждому слайду: меряет H1 + все текстовые узлы (клип / выход за кадр / заезд в зону спикера),
// снимает скриншот. Пишет audit.json. Один браузер, без перезагрузок страницы.
const port = process.argv[2] || "3001";
const outDir = process.argv[3] || "/tmp/h1h2";
const W = +(process.argv[4] || 1920);
const H = +(process.argv[5] || 1080);
mkdirSync(outDir, { recursive: true });

const PROBE = () => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  // рамка 16:9 = единственный элемент с container-type: size
  let frame = null;
  for (const el of document.querySelectorAll("div")) {
    if (getComputedStyle(el).containerType === "size") { frame = el; break; }
  }
  const fr = frame ? frame.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const zoneVar = getComputedStyle(document.documentElement).getPropertyValue("--sd-speaker-zone").trim();
  const zoneFrac = /(\d+(\.\d+)?)cqw/.test(zoneVar) ? parseFloat(RegExp.$1) / 100 : 0;
  const zonePx = zoneFrac * fr.width;
  const contentRightX = fr.left + fr.width - zonePx; // граница контент-зоны (левее зоны спикера)
  const frameRight = fr.left + fr.width;
  const frameBottom = fr.top + fr.height;

  const counterEl = [...document.querySelectorAll("div")].find((d) => /^\d{1,3}\s*\/\s*\d{2,}/.test(norm(d.innerText)));
  const counter = counterEl ? norm(counterEl.innerText) : "";
  const pos = counter ? parseInt(counter) : null;

  const measure = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize) || 0;
    let lh = parseFloat(cs.lineHeight);
    if (isNaN(lh) || !lh) lh = fs * 1.15;
    return {
      text: norm(el.textContent).slice(0, 60),
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute("class") || "").slice(0, 50),
      fs: Math.round(fs),
      lines: lh ? Math.round(el.clientHeight / lh) : 1,
      // клип: реальное содержимое шире/выше видимой области
      clipX: el.scrollWidth > el.clientWidth + 2,
      clipY: el.scrollHeight > el.clientHeight + 2,
      rRight: Math.round(r.right),
      rLeft: Math.round(r.left),
      // заезд в зону спикера (правее контент-границы)
      intrudePx: Math.round(r.right - contentRightX),
      zoneIntrude: r.right > contentRightX + 6,
      // выход за кадр
      overflowR: r.right > frameRight + 1,
      overflowL: r.left < fr.left - 1,
      overflowB: r.bottom > frameBottom + 1,
    };
  };

  // H1 (первый видимый)
  let h1 = null;
  for (const el of document.querySelectorAll("h1")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).opacity !== "0") { h1 = measure(el); break; }
  }

  // Все текстовые leaf-узлы (прямой текст, fs>=14, видимые) — для H2/подзаголовков/буллетов
  const offenders = [];
  for (const el of document.querySelectorAll("h1,h2,h3,h4,p,span,div,li,strong,em")) {
    const hasDirectText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasDirectText) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el);
    if (cs.opacity === "0" || cs.visibility === "hidden" || cs.display === "none") continue;
    const fs = parseFloat(cs.fontSize) || 0;
    if (fs < 14) continue;
    const txt = norm(el.textContent);
    if (/^\d{1,3}\s*\/\s*\d{2,}$/.test(txt)) continue; // счётчик
    const m = measure(el);
    if (m.clipX || m.clipY || m.zoneIntrude || m.overflowR || m.overflowL || m.overflowB) {
      const types = [];
      if (m.clipX) types.push("clipX");
      if (m.clipY) types.push("clipY");
      if (m.zoneIntrude) types.push(`zone+${m.intrudePx}`);
      if (m.overflowR) types.push("overflowR");
      if (m.overflowL) types.push("overflowL");
      if (m.overflowB) types.push("overflowB");
      offenders.push({ ...m, types });
    }
  }
  return { pos, counter, frame: { w: Math.round(fr.width), h: Math.round(fr.height), left: Math.round(fr.left) }, zonePx: Math.round(zonePx), contentRightX: Math.round(contentRightX), h1, offenders };
};

const browser = await chromium.launch();
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(`http://localhost:${port}/sales-deck#1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // total из счётчика
  const total = await page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const el = [...document.querySelectorAll("div")].find((d) => /^\d{1,3}\s*\/\s*\d{2,}/.test(norm(d.innerText)));
    return el ? parseInt(norm(el.innerText).split("/")[1]) : 0;
  });
  console.log("TOTAL", total);
  if (!total) throw new Error("счётчик не найден — нав сломана");

  for (let n = 1; n <= total; n++) {
    // counter-верификация: ждём пока счётчик == n
    let ok = false;
    for (let tries = 0; tries < 8; tries++) {
      const cur = await page.evaluate(() => {
        const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
        const el = [...document.querySelectorAll("div")].find((d) => /^\d{1,3}\s*\/\s*\d{2,}/.test(norm(d.innerText)));
        return el ? parseInt(norm(el.innerText)) : null;
      });
      if (cur === n) { ok = true; break; }
      if (cur !== null && cur < n) { await page.keyboard.press("ArrowRight"); }
      await page.waitForTimeout(450);
    }
    await page.waitForTimeout(1250); // reveal-анимации (clipPath/stagger)
    const data = await page.evaluate(PROBE);
    if (data.pos !== n) console.log(`WARN pos mismatch want ${n} got ${data.pos}`);
    await page.screenshot({ path: `${outDir}/h${String(n).padStart(3, "0")}.png` });
    results.push({ n, navOk: ok, ...data });
    const flag = data.h1 && (data.h1.clipX || data.h1.clipY || data.h1.zoneIntrude || data.h1.overflowR || data.h1.lines >= 4);
    console.log(`#${n} ${flag ? "⚠H1" : "  "} off:${data.offenders.length} h1:"${data.h1 ? data.h1.text.slice(0, 28) : "—"}"`);
    if (n < total) await page.keyboard.press("ArrowRight");
  }
  writeFileSync(`${outDir}/audit.json`, JSON.stringify({ total, W, H, results }, null, 2));
  console.log(`DONE ${results.length} slides -> ${outDir}/audit.json`);
} finally {
  await browser.close();
}
