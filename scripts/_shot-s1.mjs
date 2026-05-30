import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
for (const w of [1440, 1920]) {
  const ctx = await b.newContext({ viewport: { width: w, height: Math.round(w*0.5625) } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3001/sales-deck", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.keyboard.press("Home");
  await p.waitForTimeout(2800);
  await p.screenshot({ path: `_screenshots/s1-${w}.png` });
  await ctx.close();
  console.log("shot", w);
}
await b.close();
