#!/usr/bin/env node
/**
 * verify-no-errors.mjs — жёсткая проверка что страница НЕ падает.
 * Имитирует реальный браузер пользователя: грузит, перезагружает 2 раза,
 * листает слайды, собирает ВСЕ ошибки. Exit 1 если что-то не так.
 *
 * Это то, что Александр просил: «открой сам через Playwright и проверь сам».
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3001";
const errors = [];
const overlays = [];

async function checkOverlay(page, when) {
  // Реальный Next error overlay имеет диалог с заголовком "Runtime Error" /
  // "Build Error" / "Unhandled Runtime Error" / "Failed to compile".
  // Просто наличие nextjs-portal — НЕ ошибка (dev-индикатор/toasts есть всегда).
  const txt = await page.evaluate(() => {
    const p = document.querySelector("nextjs-portal");
    if (!p || !p.shadowRoot) return "";
    // Ищем именно диалог ошибки, а не служебный CSS портала
    const dialog = p.shadowRoot.querySelector(
      "[data-nextjs-dialog], [data-nextjs-dialog-header], [data-nextjs-error-overlay]"
    );
    if (!dialog) return "";
    const t = dialog.textContent || "";
    if (/Runtime Error|Build Error|Unhandled|Failed to compile|module factory/i.test(t)) {
      return t.slice(0, 200);
    }
    return "";
  });
  if (txt) overlays.push(`[${when}] ${txt.trim()}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 180)}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // 404 на отдельные ассеты (avif/favicon) — не краш страницы, игнорим
    if (/Failed to load resource.*404/i.test(t)) return;
    if (/favicon|\.avif|\.png|\.webp/i.test(t)) return;
    errors.push(`console: ${t.slice(0, 180)}`);
  });

  console.log("→ Заход 1 (cold)");
  await page.goto(`${BASE}/sales-deck`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await checkOverlay(page, "cold");

  // Листаем до слайда 11 (где AzimAppMockup) — именно он падал
  console.log("→ Листаю до слайда 11 (AzimAppMockup)");
  await page.keyboard.press("Home");
  for (let i = 1; i < 11; i++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(400); }
  await page.waitForTimeout(1500);
  await checkOverlay(page, "slide-11");
  await page.screenshot({ path: "_screenshots/verify-slide-11.png" });

  // Reload 1 — имитируем F5 пользователя (тут ловится HMR/cache баг)
  console.log("→ Reload #1 (F5)");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await checkOverlay(page, "reload-1");

  // Reload 2
  console.log("→ Reload #2 (F5)");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await checkOverlay(page, "reload-2");

  // Прямой заход на #11 по хешу
  console.log("→ Прямой заход по хешу #11");
  await page.goto(`${BASE}/sales-deck#11`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await checkOverlay(page, "hash-11");

  await browser.close();

  console.log("\n" + "═".repeat(50));
  const bad = errors.length || overlays.length;
  if (overlays.length) {
    console.error(`✗ OVERLAY (${overlays.length}):`);
    overlays.forEach((o) => console.error(`  ${o}`));
  }
  if (errors.length) {
    console.error(`✗ ERRORS (${errors.length}):`);
    [...new Set(errors)].slice(0, 8).forEach((e) => console.error(`  ${e}`));
  }
  if (bad) { console.error("\n✗ СТРАНИЦА ПАДАЕТ."); process.exit(1); }
  console.log("✓ ЧИСТО — cold + 2 reload + hash-заход, ноль ошибок, ноль overlay.");
}
main().catch((e) => { console.error("script err:", e); process.exit(1); });
