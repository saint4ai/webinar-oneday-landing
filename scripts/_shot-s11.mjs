import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const errors = [];
for (const w of [1440, 1920]) {
  const ctx = await b.newContext({ viewport: { width: w, height: Math.round(w*0.5625) } });
  const p = await ctx.newPage();
  p.on("pageerror", e => errors.push(`[${w}] ${e.message.slice(0,100)}`));
  await p.goto("http://localhost:3001/sales-deck", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.keyboard.press("Home");
  for (let i=1;i<11;i++){ await p.keyboard.press("ArrowRight"); await p.waitForTimeout(350); }
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `_screenshots/s11-${w}.png` });
  await ctx.close();
  console.log("shot", w);
}
await b.close();
console.log(errors.length ? "ERRORS:\n"+errors.join("\n") : "NO_ERRORS");
