import { chromium } from "playwright";
import { mkdirSync } from "fs";

// capBatch.mjs <port> <hashesCSV> <outDir> [wait=2200] [W=1920] [H=1080]
// ЭКОНОМ-РЕЖИМ: ОДИН браузер на ВСЕ слайды (launch ровно 1 раз вместо launch-на-каждый-кадр).
// Это снимает главный пик CPU. close гарантирован в finally — без осиротевших headless_shell.
// Пример: node scripts/capBatch.mjs 3001 54,62,63,64,65 _screenshots/x 2200
const port = process.argv[2] || "3001";
const hashes = (process.argv[3] || "1").split(",").map((s) => s.trim()).filter(Boolean);
const outDir = process.argv[4] || "_screenshots/batch";
const wait = +(process.argv[5] || 2200);
const W = +(process.argv[6] || 1920);
const H = +(process.argv[7] || 1080);

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const h of hashes) {
    // ?cap=<h> делает URL уникальным → полный reload (иначе hash-only goto = same-document, слайд не сменится)
    // networkidle ждёт докомпиляции dev-сервера (HMR-websocket Playwright не считает за сеть)
    await page.goto(`http://localhost:${port}/sales-deck?cap=${h}#${h}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${outDir}/h${String(h).padStart(3, "0")}.png` });
    console.log(`shot h${h}`);
  }
  console.log(`OK: ${hashes.length} кадров -> ${outDir} (1 браузер, 1 launch)`);
} finally {
  await browser.close();
}
