import { chromium } from "playwright";
import os from "os";

const browser = await chromium.launch();
const pages = [
  ["", "01-dashboard"],
  ["calls", "02-calls"],
  ["managers", "03-managers"],
  ["analytics", "04-analytics"],
  ["managers/compare", "05-compare"],
  ["calls/pending", "06-pending"],
  ["analytics/trends", "07-trends"],
];
const out = os.homedir() + "/Downloads/higgs_review/callvision";

for (const [path, name] of pages) {
  const p = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  try {
    const resp = await p.goto(`http://localhost:3002/${path}`, { waitUntil: "networkidle", timeout: 30000 });
    await p.waitForTimeout(2800);
    await p.screenshot({ path: `${out}/${name}.png`, fullPage: false });
    console.log(`${name}: HTTP ${resp?.status()} ${errs.length ? "ERR:" + errs[0].slice(0, 70) : "ok"}`);
  } catch (e) {
    console.log(`${name}: FAIL ${String(e).slice(0, 80)}`);
  }
  await p.close();
}
await browser.close();
console.log("DONE");
