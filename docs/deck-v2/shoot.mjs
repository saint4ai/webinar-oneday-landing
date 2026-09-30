#!/usr/bin/env node
/**
 * Скриншоты деки эфира для проверки без запуска.
 *
 *   npx next dev -p 3001            # или ./webinar.sh
 *   node docs/deck-v2/shoot.mjs                     # все слайды
 *   node docs/deck-v2/shoot.mjs --only 01,11,22r    # только эти ключи
 *   node docs/deck-v2/shoot.mjs --fx                # стенд эффектов /montage-fx
 *   node docs/deck-v2/shoot.mjs --templates         # витрина шаблонов /montage/templates → shots/tpl-<ключ>.jpg
 *
 * Кадр 1920×1080, листание — keydown ArrowRight на document, 2,5 с после листания (09 — 4,2 с: стопка плит досыпается).
 * Результат: docs/deck-v2/shots/<ключ слайда>.jpg шириной 960.
 * Заодно проверка зоны камеры: всё, что рисуется правее 60% кадра вне фона слайда ([data-deck-bg]), печатается списком.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const out = join(here, "shots");
mkdirSync(out, { recursive: true });

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const BASE = opt("--base") ?? "http://localhost:3001";
const only = opt("--only")?.split(",").map((s) => s.trim());
const fxMode = args.includes("--fx");
const tplMode = args.includes("--templates");
const WAIT = Number(opt("--wait") ?? 2500);
// Слайды с длинным «вау»: снимаем конечное состояние, а не середину анимации
const SLOW = { "09": 4200, "38": 3200, "39a": 3000, price: 3200 };

// Порядок слайдов берём из MontageDeck.tsx: ключи идут в том же порядке, что и в массиве slides
const deckSrc = readFileSync(join(root, tplMode ? "components/montage-deck/TemplatesDeck.tsx" : "components/montage-deck/MontageDeck.tsx"), "utf8");
const PATH = tplMode ? "/montage/templates" : "/montage";
const PREFIX = tplMode ? "tpl-" : "";
const keys = [...deckSrc.slice(deckSrc.indexOf("const slides")).matchAll(/key="([^"]+)"/g)].map((m) => m[1]);

// Значок Next в dev-режиме не должен попадать в кадр
const HIDE_DEV = "nextjs-portal { display: none !important; }";

async function save(page, name) {
  const png = await page.screenshot({ type: "png" });
  await sharp(png).resize({ width: 960 }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(out, `${name}.jpg`));
}

/** Что рисуется в зоне камеры: элементы вне [data-deck-bg] с текстом, картинкой, фоном, рамкой или тенью правее 60% кадра. */
function zoneCheck() {
  const frame = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).containerType === "size");
  if (!frame) return ["рамка не найдена"];
  const slide = frame.querySelector(":scope > div.z-10") ?? frame;
  const fr = frame.getBoundingClientRect();
  const limit = fr.left + fr.width * 0.6 + 2;
  const bad = [];
  for (const el of slide.querySelectorAll("*")) {
    if (el.closest("[data-deck-bg]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right <= limit || r.left >= fr.right || r.bottom <= fr.top || r.top >= fr.bottom) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const media = /^(IMG|VIDEO|CANVAS|svg)$/.test(el.tagName);
    const paint = (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || cs.backgroundImage !== "none"
      || parseFloat(cs.borderRightWidth) > 0 || cs.boxShadow !== "none";
    if (!text && !media && !paint) continue;
    // Элемент, обрезанный родителем с overflow:hidden до зоны, в кадр не попадает
    let clipped = false;
    for (let p = el.parentElement; p && p !== slide; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflow !== "visible" && p.getBoundingClientRect().right <= limit) { clipped = true; break; }
    }
    if (clipped) continue;
    const label = (el.textContent || el.getAttribute("src") || el.className?.baseVal || el.className || "").toString().trim().slice(0, 40);
    bad.push(`${el.tagName.toLowerCase()} → ${Math.round(((r.right - fr.left) / fr.width) * 100)}%  ${label}`);
  }
  return bad.slice(0, 8);
}

// Облачная среда: браузер лежит в /opt/pw-browsers/chromium; локально Playwright найдёт свой
const exe = process.env.CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  ! pageerror:", e.message));

if (fxMode) {
  for (const fx of ["tunnel", "voxel", "number", "screen", "funnel", "cost"]) {
    await page.goto(`${BASE}/montage-fx?fx=${fx}`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: HIDE_DEV });
    await page.waitForTimeout(4200);
    await save(page, `fx-${fx}`);
    console.log(`✓ fx-${fx}`);
  }
} else {
  await page.addInitScript(() => { try { localStorage.setItem("sd-speaker", "live"); } catch {} });
  await page.goto(`${BASE}${PATH}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE_DEV });
  await page.waitForTimeout(WAIT);
  const last = only ? Math.max(...only.map((k) => keys.indexOf(k))) : keys.length - 1;
  for (let i = 0; i <= last; i++) {
    if (i > 0) {
      await page.evaluate(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
      await page.waitForTimeout(only && !only.includes(keys[i]) ? 450 : SLOW[keys[i]] ?? WAIT);
    }
    if (only && !only.includes(keys[i])) continue;
    await save(page, PREFIX + keys[i]);
    const bad = await page.evaluate(zoneCheck);
    console.log(`✓ ${PREFIX}${keys[i]}${bad.length ? `  ⚠ зона камеры:\n    ${bad.join("\n    ")}` : ""}`);
  }
}
await browser.close();
