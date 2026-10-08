// Рендер картинок серии, обложки Bizon, аватарки и контактного листа.
// Запуск: node docs/tg-media/render.mjs [cover|cards|avatar|bizon|og|contact|sheet|all]
// sheet: лист превью всех карточек по 280 px (без браузера), docs/reports/tg-media-1009/preview-sheet.jpg
// Нужен Chromium Playwright: npx playwright install chromium
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, statSync, writeFileSync, existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
// TG_OUT: снять карточки в другую папку (для проб), не трогая готовые файлы
const outDir = process.env.TG_OUT || join(root, "workshop-montazh/assets/tg");
const reportDir = join(root, process.env.TG_REPORT || "docs/reports/tg-media-1009");
const imgDir = join(root, "workshop-montazh/assets/img");
mkdirSync(outDir, { recursive: true });
mkdirSync(reportDir, { recursive: true });

// topic-p2, topic-p3 и offer-bundle с 08.10.2026 не используются (воркшоп только про AI-монтаж, продаётся только Vibe Production):
// шаблоны убраны из card.html, готовые файлы остаются в assets/tg/
const CARD_IDS = [
  // день эфира, по времени сообщений (лента v3.3, imgHook у каждого сообщения)
  "reg-bonus", "warm-edits", "warm-cases", "live-bonus", "t-minus-30", "t-minus-10", "live-now", "live-10", "topic-p1",
  "training", "bonus-got", "vaib", "offer", "installment", "last-call",
  // следующий день (повтор эфира в 20:00): 10:30, 11:00, 15:00, 19:50, 21:45; *-wa: отдельные карточки для WhatsApp-группы
  "next-1030", "next-1030-wa", "again-today", "next-1500", "next-1950", "next-2145", "next-2145-wa",
];
// размеры, отличные от карточки 1080x1350 (сейчас таких нет: у видео свои обложки)
const CARD_SIZE = {};
// предел веса jpg карточки: 250 КБ (ТЗ 09.10.2026)
const CARD_MAX = 250 * 1024;
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
  let sub = "4:4:4";
  for (;;) {
    buf = await sharp(pngBuf).jpeg({ quality: q, mozjpeg: true, chromaSubsampling: sub }).toBuffer();
    if (!maxBytes || buf.length <= maxBytes) break;
    if (q > 80) q -= 2;
    else if (sub === "4:4:4") sub = "4:2:0"; // цвет в карточках плавный, 4:2:0 почти не виден
    else if (q > 66) q -= 2;
    else break;
  }
  writeFileSync(file, buf);
  return { q, bytes: buf.length, sub };
}

// режим sheet собирается без браузера (только sharp), остальные запускают один Chromium
const browser = what === "sheet" ? null : await chromium.launch();
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
    // data-edge: текст не должен уходить правее 1000 px (поле 80 px с каждой стороны)
    document.querySelectorAll("[data-edge]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > 1002) bad.push(`${el.className} вылез вправо до ${Math.round(r.right)}`);
    });
    // заголовок не должен переноситься сам: высота = число строк (<br>) x кегль x 1.1
    document.querySelectorAll(".h").forEach((el) => {
      const lines = el.innerHTML.split(/<br\s*\/?>/i).length;
      const lh = parseFloat(getComputedStyle(el).fontSize) * 1.1;
      if (el.getBoundingClientRect().height > lines * lh + 4) bad.push(`заголовок перенёсся сам: ${Math.round(el.getBoundingClientRect().height / lh)} строк вместо ${lines}`);
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
    const [cw, ch] = CARD_SIZE[id] || [1080, 1350];
    const { png, overflow } = await shoot("card.html", `?id=${id}`, cw, ch);
    const r = await toJpg(png, join(outDir, `${id}.jpg`), { quality: 90, maxBytes: CARD_MAX });
    // превью шириной 540, как в чате Telegram
    const prev = await sharp(png).resize(540, Math.round((540 * ch) / cw), { kernel: "lanczos3" }).jpeg({ quality: 92 }).toBuffer();
    writeFileSync(join(reportDir, `${id}-540.jpg`), prev);
    log.push(`${id}.jpg ${cw}x${ch} q${r.q} ${r.sub} ${r.bytes} B (${Math.round(r.bytes / 1024)} КБ), проверка: ${overflow.join("; ") || "нет замечаний"}`);
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
    ...CARD_IDS.map((id) => [`${id}.jpg`, ...(CARD_SIZE[id] || [1080, 1350])]),
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

if (what === "sheet") {
  // Лист превью: все карточки сеткой, каждая уменьшена до 280 px по ширине (так их видно в ленте чата).
  // Читаем готовые jpg из outDir, браузер не нужен.
  const W = 280, GAP = 22, COLS = 6, CAP = 44, CELL_H = Math.round((W * 1350) / 1080);
  const ids = CARD_IDS.filter((id) => existsSync(join(outDir, id + ".jpg")));
  const rows = Math.ceil(ids.length / COLS);
  const comps = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], file = join(outDir, id + ".jpg");
    const x = GAP + (i % COLS) * (W + GAP), y = GAP + Math.floor(i / COLS) * (CELL_H + CAP + GAP);
    const meta = await sharp(file).metadata();
    const h = Math.round((W * meta.height) / meta.width);
    // обложка 9:16 выше карточки: вписываем её в высоту ячейки
    const k = h > CELL_H ? CELL_H / h : 1;
    const buf = await sharp(file).resize(Math.round(W * k), Math.round(h * k), { kernel: "lanczos3" }).png().toBuffer();
    comps.push({ input: buf, left: x + Math.round((W - Math.round(W * k)) / 2), top: y });
    const kb = Math.round(statSync(file).size / 1024);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${CAP}"><text x="0" y="22" font-size="18" font-weight="700" fill="#FBF3E4" font-family="Arial, sans-serif">${id}</text><text x="0" y="40" font-size="14" fill="#9d8f7e" font-family="Arial, sans-serif">${meta.width}x${meta.height}, ${kb} KB</text></svg>`;
    comps.push({ input: Buffer.from(svg), left: x, top: y + CELL_H + 6 });
  }
  const sw = GAP + COLS * (W + GAP), sh = GAP + rows * (CELL_H + CAP + GAP);
  const sheet = await sharp({ create: { width: sw, height: sh, channels: 3, background: "#3a342f" } }).composite(comps).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(join(reportDir, "preview-sheet.jpg"), sheet);
  log.push(`preview-sheet.jpg ${sw}x${sh}, ${ids.length} карточек, ${Math.round(sheet.length / 1024)} КБ`);
}

if (browser) await browser.close();
console.log(log.join("\n"));
