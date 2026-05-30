import { chromium } from "playwright";
import { mkdirSync } from "fs";

// capRange.mjs <port> <startHash> <endHash> <outDir> <wait> [width]
const port = process.argv[2] || "3001";
const start = Number(process.argv[3] || 50);
const end = Number(process.argv[4] || 101);
const outDir = process.argv[5] || "/tmp/review2";
const wait = Number(process.argv[6] || 2600);
const width = Number(process.argv[7] || 1920);
const height = Number(process.argv[8]) || (width === 1920 ? 1080 : width === 1366 ? 768 : Math.round((width * 9) / 16));

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const allErrors = {};

for (let h = start; h <= end; h++) {
  const p = await browser.newPage({ viewport: { width, height } });
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(`http://localhost:${port}/sales-deck#${h}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(wait);
  await p.screenshot({ path: `${outDir}/h${String(h).padStart(3, "0")}.png` });
  if (errs.length) allErrors[h] = errs;
  await p.close();
}

await browser.close();
console.log("ERRORS:", Object.keys(allErrors).length ? JSON.stringify(allErrors, null, 2) : "none");
console.log(`saved ${end - start + 1} shots @${width} -> ${outDir}`);
