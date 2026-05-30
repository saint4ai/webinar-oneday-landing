import { chromium } from "playwright";
import { mkdirSync } from "fs";

const port = process.argv[2] || "3001";
const outDir = process.argv[3] || "/tmp/review";
mkdirSync(outDir, { recursive: true });

// [deck-hash, имя файла] — весь кластер 41-57 (после вставки болей 41/43/47)
const SLIDES = [
  [44, "S41_realtor_pain"],
  [45, "S42_realtor_solution"],
  [46, "S43_manager_pain"],
  [47, "S44_manager_solution"],
  [48, "S45_sales_pain_callvision"],
  [49, "S46_sales_solution_callvision"],
  [50, "S47_hr_pain"],
  [51, "S48_hr_solution"],
  [52, "S49_niche_punchline"],
  [53, "S50_engagement"],
  [54, "S51_market_price"],
  [55, "S52_market_time"],
  [56, "S53_research1_light"],
  [57, "S54_research2"],
  [58, "S55_research3"],
  [59, "S56_research4"],
  [60, "S57_perplexity_light"],
];

const browser = await chromium.launch();
const errors = [];

for (const [w, h] of [[1920, 1080], [1440, 900]]) {
  for (const [hash, name] of SLIDES) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    p.on("pageerror", (e) => errors.push(`[${name} ${w}] ${String(e)}`));
    await p.goto(`http://localhost:${port}/sales-deck#${hash}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(3000);
    await p.screenshot({ path: `${outDir}/${name}-${w}.png` });
    await p.close();
  }
}

await browser.close();
console.log("REVIEW DONE → " + outDir);
console.log(errors.length ? "PAGE_ERRORS:\n" + errors.join("\n") : "PAGE_ERRORS: none");
