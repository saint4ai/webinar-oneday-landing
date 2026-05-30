import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", e => errs.push(e.message.slice(0,100)));
await p.goto("http://localhost:3001/sales-deck", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.keyboard.press("Home");
const targets = { 32:"s30", 34:"s32" };
let pos = 1;
for (let i=0;i<36;i++){
  if (targets[pos]) { await p.waitForTimeout(2300); await p.screenshot({ path: `_screenshots/fix-${targets[pos]}.png` }); console.log("shot", targets[pos]); }
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(380); pos++;
}
await b.close();
console.log(errs.length ? "ERR:"+[...new Set(errs)].join("|") : "NO_ERRORS");
