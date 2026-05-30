#!/usr/bin/env node
/**
 * screenshot-slides.mjs — прогон по всем слайдам sales-deck + скриншоты.
 *
 * Использование:
 *   1. Поднять dev-сервер (preview MCP уже на :3001 или PORT=3033 npm run dev)
 *   2. node scripts/screenshot-slides.mjs [base_url=http://localhost:3001] [count=17]
 *
 * Результат: _screenshots/slide-NN.png (1440x900 viewport).
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://localhost:3001";
const COUNT = parseInt(process.argv[3] || "17", 10);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "_screenshots");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  // Глушим Next dev overlay errors чтобы они не загораживали скрин
  await page.addInitScript(() => {
    window.addEventListener("error", (e) => e.preventDefault());
    window.addEventListener("unhandledrejection", (e) => e.preventDefault());
  });

  console.log(`→ Открываю ${BASE}/sales-deck`);
  await page.goto(`${BASE}/sales-deck`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  for (let i = 1; i <= COUNT; i++) {
    // Навигация через keyboard — самый надёжный способ для SlideDeck
    if (i === 1) {
      await page.keyboard.press("Home");
    } else {
      await page.keyboard.press("ArrowRight");
    }
    await page.waitForTimeout(2200); // анимации входа (включая AI-плашку с delay 1.0)

    const filename = `slide-${String(i).padStart(2, "0")}.png`;
    const filepath = join(OUT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`  ✓ ${filename}`);
  }

  await browser.close();
  console.log(`\n✓ Готово. Скриншоты: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("✗ Ошибка:", err);
  process.exit(1);
});
