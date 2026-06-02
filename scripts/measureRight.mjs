import { chromium } from "playwright";

// measureRight.mjs <port> <hash> <text1|text2|...>
// Печатает right-edge каждого элемента, чей textContent содержит подстроку.
// Граница зоны спикера при 1920 = 1344px (правые 30%). right > 1344 → заезд.
const port = process.argv[2] || "3001";
const hash = process.argv[3] || "166";
const needles = (process.argv[4] || "$500").split("|");

const ZONE = 1920 * 0.7; // 1344
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`http://localhost:${port}/sales-deck#${hash}`, { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
const data = await p.evaluate(({ needles, ZONE }) => {
  const out = [];
  const all = [...document.querySelectorAll("h1,div,span,p,a")];
  for (const n of needles) {
    // самый глубокий (минимальный) элемент с этим текстом
    const matches = all.filter((e) => (e.textContent || "").includes(n) && e.children.length <= 3);
    const el = matches.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length)[0];
    if (!el) { out.push({ needle: n, found: false }); continue; }
    const r = el.getBoundingClientRect();
    out.push({ needle: n, left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), intrudes: r.right > ZONE });
  }
  return { zoneStart: ZONE, items: out };
}, { needles, ZONE });
console.log(JSON.stringify(data, null, 2));
await browser.close();
