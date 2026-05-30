import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", e => errs.push(e.message.slice(0,100)));
await p.goto("http://localhost:3001/sales-deck", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.keyboard.press("End");  // прыжок в конец
await p.waitForTimeout(800);
await p.keyboard.press("ArrowLeft"); // End = stub(28), назад на Slide 25(27)
await p.waitForTimeout(2500);
await p.screenshot({ path: "_screenshots/s25-fix.png" });
await b.close();
console.log(errs.length ? "ERR:"+errs.join("|") : "NO_ERRORS");
