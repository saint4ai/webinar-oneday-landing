import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", e => errs.push(e.message.slice(0,120)));
await p.goto("http://localhost:3001/sales-deck", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.keyboard.press("Home");
// deck order: 1..17 = 17 шт, 18=10b, далее 19=Slide18 ... 26=Slide25
// нажатий от старта (#1) до Slide_18 = 18 раз ArrowRight (10b на позиции 11)
const targets = { 19:"s18", 20:"s19", 21:"s20", 22:"s21", 23:"s21b", 24:"s22", 25:"s23", 26:"s24", 27:"s25" };
let pos = 1;
for (let i=0;i<27;i++){
  if (targets[pos]) { await p.waitForTimeout(2400); await p.screenshot({ path: `_screenshots/cluster-${targets[pos]}.png` }); console.log("shot", targets[pos]); }
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(400); pos++;
}
await b.close();
console.log(errs.length ? "ERR:"+errs.join("|") : "NO_ERRORS");
