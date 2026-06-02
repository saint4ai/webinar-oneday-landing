import { chromium } from "playwright";

// capMeasure.mjs <port> <hash> <boxSelector>
// Печатает центры всех absolute-детей диаграммы (относительно бокса) — чтобы ЧИСЛАМИ
// проверить, что центральная карточка совпадает по Y со средним веток (точка схода).
const port = process.argv[2] || "3001";
const hash = process.argv[3] || "58";
const sel = process.argv[4] || 'div[style*="220px"]';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`http://localhost:${port}/sales-deck#${hash}`, { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
const data = await p.evaluate((sel) => {
  const box = document.querySelector(sel);
  if (!box) return { error: "box not found: " + sel };
  const b = box.getBoundingClientRect();
  const kids = [...box.querySelectorAll(":scope > div")].map((d) => {
    const r = d.getBoundingClientRect();
    return {
      cx: Math.round(r.x + r.width / 2 - b.x),
      cy: Math.round(r.y + r.height / 2 - b.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      text: (d.textContent || "").replace(/\s+/g, " ").trim().slice(0, 22),
    };
  });
  // ветки = левые (cx маленький), центр = правый (cx большой)
  const sources = kids.filter((k) => k.cx < b.width * 0.45);
  const center = kids.filter((k) => k.cx >= b.width * 0.45).sort((a, z) => z.w - a.w)[0] || null;
  const meanSrcCy = sources.length ? Math.round(sources.reduce((s, k) => s + k.cy, 0) / sources.length) : null;
  return {
    box: { w: Math.round(b.width), h: Math.round(b.height) },
    sources,
    centerCard: center,
    convergenceY_meanOfSources: meanSrcCy,
    centerCardY: center ? center.cy : null,
    deltaY: center && meanSrcCy != null ? center.cy - meanSrcCy : null,
  };
}, sel);
console.log(JSON.stringify(data, null, 2));
await browser.close();
