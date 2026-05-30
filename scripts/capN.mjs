import { chromium } from "playwright";

const port = process.argv[2] || "3001";
const hash = process.argv[3] || "17";
const tag = process.argv[4] || `s${hash}`;
const wait = Number(process.argv[5] || 3600);
const url = `http://localhost:${port}/sales-deck#${hash}`;

const browser = await chromium.launch();
const errors = [];

for (const [w, h] of [[1920, 1080], [1440, 900]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.on("console", (m) => m.type() === "error" && errors.push(`[${w}] ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`[${w}] ${String(e)}`));
  await p.goto(url, { waitUntil: "networkidle" });
  await p.waitForTimeout(wait);
  await p.screenshot({ path: `/tmp/${tag}-${w}.png` });
  await p.close();
}

await browser.close();
console.log("CONSOLE_ERRORS:" + (errors.length ? "\n" + errors.join("\n") : " none"));
console.log(`saved /tmp/${tag}-1920.png /tmp/${tag}-1440.png`);
