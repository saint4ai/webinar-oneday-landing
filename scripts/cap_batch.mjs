import { chromium } from "playwright";
import { mkdirSync } from "fs";

/*
 * cap_batch.mjs — скриншоты набора слайдов ОДНИМ браузером (launch ровно 1 раз).
 * Снимай ТОЛЬКО слайды, помеченные qa_audit.mjs — не всю деку.
 *
 * Usage: node cap_batch.mjs <port> <hashesCSV> <outDir> [wait=2400] [W=1920] [H=1080] [routeBase=/sales-deck]
 * Пример: node cap_batch.mjs 3001 54,68,72 _screenshots/flagged 2400
 */
const port = process.argv[2] || "3001";
const hashes = (process.argv[3] || "1").split(",").map((s) => s.trim()).filter(Boolean);
const outDir = process.argv[4] || "_screenshots/batch";
const wait = +(process.argv[5] || 2400);
const W = +(process.argv[6] || 1920);
const H = +(process.argv[7] || 1080);
const routeBase = process.argv[8] || "/sales-deck";

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const h of hashes) {
    // ?cap=<h> → уникальный URL → реальный reload; domcontentloaded + best-effort networkidle (на dev networkidle может зависнуть при HMR)
    try {
      await page.goto(`http://localhost:${port}${routeBase}?cap=${h}#${h}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForLoadState("networkidle", { timeout: 7000 }).catch(() => {});
    } catch { /* navigation timeout — продолжаем */ }
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${outDir}/h${String(h).padStart(3, "0")}.png` });
    console.log(`shot h${h}`);
  }
  console.log(`OK: ${hashes.length} кадров -> ${outDir} (1 браузер, 1 launch)`);
} finally {
  await browser.close();
}
