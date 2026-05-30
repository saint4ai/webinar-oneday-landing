import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3001/sales-deck", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.keyboard.press("Home");
for (let i=1;i<10;i++){ await p.keyboard.press("ArrowRight"); await p.waitForTimeout(350); }
await p.waitForTimeout(2500);
await p.screenshot({ path: "_screenshots/s10-check.png" });
await b.close();
console.log("done");
