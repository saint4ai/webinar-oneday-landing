import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const errs = [];
// desktop 1920 + 1440, tablet 834, mobile 390
const VIEWPORTS = [
  { w: 1920, h: 1080, tag: "1920" },
  { w: 1440, h: 900, tag: "1440" },
  { w: 834, h: 1112, tag: "tablet" },
  { w: 390, h: 844, tag: "mobile" },
];
for (const vp of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h } });
  const p = await ctx.newPage();
  p.on("pageerror", e => errs.push(`[${vp.tag}] ${e.message.slice(0,90)}`));
  await p.goto("http://localhost:3001/sales-deck/formats", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  await p.keyboard.press("Home"); await p.waitForTimeout(2000);
  await p.screenshot({ path: `_screenshots/fmt-editorial-${vp.tag}.png` });
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(2200);
  await p.screenshot({ path: `_screenshots/fmt-kinetic-${vp.tag}.png` });
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(2200);
  await p.screenshot({ path: `_screenshots/fmt-split-${vp.tag}.png` });
  await ctx.close();
  console.log("done", vp.tag);
}
// reduced-motion check
const ctxR = await b.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: "reduce" });
const pr = await ctxR.newPage();
pr.on("pageerror", e => errs.push(`[reduce] ${e.message.slice(0,90)}`));
await pr.goto("http://localhost:3001/sales-deck/formats", { waitUntil: "networkidle" });
await pr.waitForTimeout(1500);
await pr.screenshot({ path: "_screenshots/fmt-editorial-reduce.png" });
await ctxR.close();
console.log("done reduce");
await b.close();
console.log(errs.length ? "ERR:"+[...new Set(errs)].join("|") : "NO_ERRORS");
