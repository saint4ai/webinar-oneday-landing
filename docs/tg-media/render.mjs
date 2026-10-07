// Рендер картинок серии, обложки Bizon, аватарки и контактного листа.
// Запуск: node docs/tg-media/render.mjs [cover|cards|avatar|bizon|og|contact|all]
// Нужен Chromium Playwright: npx playwright install chromium
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, statSync, writeFileSync, existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const outDir = join(root, "workshop-montazh/assets/tg");
const reportDir = join(root, "docs/reports/tg-media-1006");
const imgDir = join(root, "workshop-montazh/assets/img");
mkdirSync(outDir, { recursive: true });
mkdirSync(reportDir, { recursive: true });

const CARD_IDS = [
  "warm-edits", "warm-cases", "topic-p1", "topic-p2", "topic-p3", "training", "offer",
  // карточки рассылки: до эфира, в эфире, последний звонок
  "reg-bonus", "live-bonus", "t-minus-10", "live-now", "last-call",
];
const what = process.argv[2] || "all";
// Третий аргумент: снять только перечисленные карточки, остальные не перезаписывать.
// Пример: node docs/tg-media/render.mjs cards reg-bonus,live-bonus
const onlyIds = process.argv[3] ? process.argv[3].split(",").map((s) => s.trim()).filter(Boolean) : null;
if (onlyIds) {
  const unknown = onlyIds.filter((id) => !CARD_IDS.includes(id));
  if (unknown.length) throw new Error("Неизвестные id карточек: " + unknown.join(", "));
}

const fileUrl = (name, query = "") => pathToFileURL(join(here, name)).href + query;

async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.waitForTimeout(250);
}

async function toJpg(pngBuf, file, { quality = 88, maxBytes = 0 } = {}) {
  let q = quality;
  let buf;
  for (;;) {
    buf = await sharp(pngBuf).jpeg({ quality: q, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
    if (!maxBytes || buf.length <= maxBytes || q <= 80) break;
    q -= 2;
  }
  writeFileSync(file, buf);
  return { q, bytes: buf.length };
}

const browser = await chromium.launch();
const log = [];

async function shoot(name, query, w, h, scale = 1) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  await page.goto(fileUrl(name, query));
  await ready(page);
  const info = await page.evaluate(() => {
    // проверка: ничего из .fit-блоков не вылезло за свои рамки
    // data-fit="w": только по ширине (заголовок: запас шрифта по высоте не считается вылезанием)
    const bad = [];
    document.querySelectorAll("[data-fit]").forEach((el) => {
      const widthOnly = el.dataset.fit === "w";
      if (el.scrollWidth > el.clientWidth + 1 || (!widthOnly && el.scrollHeight > el.clientHeight + 1)) bad.push(el.className || el.tagName);
    });
    return bad;
  });
  const png = await page.screenshot({ type: "png" });
  await ctx.close();
  return { png, overflow: info };
}

if (what === "cover" || what === "all") {
  const { png, overflow } = await shoot("cover-bizon.html", "", 1920, 1080);
  writeFileSync(join(outDir, "cover-bizon.png"), await sharp(png).png({ compressionLevel: 9 }).toBuffer());
  const r = await toJpg(png, join(outDir, "cover-bizon.jpg"), { quality: 90 });
  // превью 853x480 так, как покажет Bizon
  const prev = await sharp(png).resize(853, 480, { kernel: "lanczos3" }).jpeg({ quality: 92 }).toBuffer();
  writeFileSync(join(reportDir, "cover-bizon-853x480.jpg"), prev);
  log.push(`cover-bizon.jpg q${r.q} ${r.bytes} B, overflow: ${overflow.join(",") || "нет"}`);
}

if (what === "cards" || what === "all") {
  for (const id of onlyIds || CARD_IDS) {
    const { png, overflow } = await shoot("card.html", `?id=${id}`, 1080, 1350);
    const r = await toJpg(png, join(outDir, `${id}.jpg`), { quality: 88, maxBytes: 450 * 1024 });
    // превью 540x675, как в чате Telegram
    const prev = await sharp(png).resize(540, 675, { kernel: "lanczos3" }).jpeg({ quality: 92 }).toBuffer();
    writeFileSync(join(reportDir, `${id}-540x675.jpg`), prev);
    log.push(`${id}.jpg q${r.q} ${r.bytes} B, overflow: ${overflow.join(",") || "нет"}`);
  }
}

if (what === "avatar" || what === "all") {
  const { png } = await shoot("avatar.html", "", 640, 640);
  const r = await toJpg(png, join(outDir, "avatar.jpg"), { quality: 92 });
  log.push(`avatar.jpg q${r.q} ${r.bytes} B`);
}

if (what === "bizon" || what === "all") {
  // фон комнаты эфира: один шаблон 1920x1080, вторая версия 2560x1440 снимается с масштабом 4/3
  const lim = 690 * 1000;
  const a = await shoot("bizon-bg.html", "", 1920, 1080, 1);
  const r1 = await toJpg(a.png, join(outDir, "bizon-bg-1920x1080.jpg"), { quality: 90, maxBytes: lim });
  const b = await shoot("bizon-bg.html", "", 1920, 1080, 4 / 3);
  const r2 = await toJpg(b.png, join(outDir, "bizon-bg-2560x1440.jpg"), { quality: 90, maxBytes: lim });
  log.push(`bizon-bg-1920x1080.jpg q${r1.q} ${r1.bytes} B; bizon-bg-2560x1440.jpg q${r2.q} ${r2.bytes} B`);
  // превью комнаты: фон + обложка 1180x664 + колонка чата 360x664
  const p = await shoot("bizon-bg-preview.html", "", 1920, 1080, 1);
  const rp = await toJpg(p.png, join(reportDir, "bizon-bg-preview.jpg"), { quality: 90 });
  log.push(`bizon-bg-preview.jpg q${rp.q} ${rp.bytes} B`);
}

if (what === "og" || what === "all") {
  // og:image лендинга (эфир каждый день): 1200x630, до 300 КБ, плюс контрольные превью
  const { png } = await shoot("og-daily.html", "", 1200, 630);
  const r = await toJpg(png, join(imgDir, "og-cover-daily.jpg"), { quality: 90, maxBytes: 300 * 1000 });
  const prev = await sharp(png).resize(600, 315, { kernel: "lanczos3" }).jpeg({ quality: 92 }).toBuffer();
  writeFileSync(join(reportDir, "og-cover-daily-600x315.jpg"), prev);
  const sq = await sharp(png).extract({ left: 285, top: 0, width: 630, height: 630 }).jpeg({ quality: 92 }).toBuffer();
  writeFileSync(join(reportDir, "og-cover-daily-630x630.jpg"), sq);
  log.push(`og-cover-daily.jpg q${r.q} ${r.bytes} B`);
}

if (what === "contact" || what === "all") {
  const items = [
    ["cover-bizon.jpg", 1920, 1080],
    ...CARD_IDS.map((id) => [`${id}.jpg`, 1080, 1350]),
    ["avatar.jpg", 640, 640],
  ].filter(([f]) => existsSync(join(outDir, f)));
  const cells = items
    .map(([f, w, h]) => {
      const kb = Math.round(statSync(join(outDir, f)).size / 1024);
      return `<figure class="${f.startsWith("cover") ? "wide" : f.startsWith("avatar") ? "sq" : ""}"><img src="${pathToFileURL(join(outDir, f)).href}"><figcaption>${f}<span>${w}×${h} · ${kb} КБ</span></figcaption></figure>`;
    })
    .join("");
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><link rel="stylesheet" href="base.css"><style>
  body{overflow:visible;width:2000px;padding:48px;background:#14100E}
  h1{font-family:'Unbounded';font-weight:700;font-size:34px;color:#E3C07B;margin-bottom:6px}
  p{font-size:20px;color:rgba(251,243,228,.7);margin-bottom:34px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:34px 30px;align-items:start}
  figure{display:block}
  figure.wide{grid-column:span 2}
  figure img{width:100%;display:block;border-radius:14px;border:1px solid rgba(227,192,123,.28)}
  figure.sq img{width:50%}
  figcaption{margin-top:10px;font-weight:700;font-size:22px;color:var(--cream)}
  figcaption span{display:block;font-weight:500;font-size:18px;color:rgba(251,243,228,.6);margin-top:2px}
  </style></head><body><h1>Серия воркшопа: картинки и обложка</h1><p>workshop-montazh/assets/tg/ · контактный лист для просмотра</p><div class="grid">${cells}</div></body></html>`;
  writeFileSync(join(here, "_contact.html"), html);
  const ctx = await browser.newContext({ viewport: { width: 2096, height: 1200 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(fileUrl("_contact.html"));
  await ready(page);
  const png = await page.screenshot({ type: "png", fullPage: true });
  await ctx.close();
  const r = await toJpg(png, join(reportDir, "contact.jpg"), { quality: 88 });
  log.push(`contact.jpg q${r.q} ${r.bytes} B`);
}

await browser.close();
console.log(log.join("\n"));
