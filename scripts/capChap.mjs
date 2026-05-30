import { chromium } from "playwright";

const port = process.argv[2] || "3001";
const browser = await chromium.launch();
const errors = [];

async function shoot(hash, tag) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on("console", (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`[${tag}] ${String(e)}`));
  await p.goto(`http://localhost:${port}/sales-deck#${hash}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(650);
  await p.screenshot({ path: `/tmp/${tag}-mid.png` });
  await p.waitForTimeout(1900);
  await p.screenshot({ path: `/tmp/${tag}-end.png` });
  await p.close();
}

await shoot("16", "ch15"); // Slide 15 · ГЛАВА 1
await shoot("28", "ch26"); // Slide 26 · ТРИ НАПРАВЛЕНИЯ

await browser.close();
console.log("CONSOLE_ERRORS:" + (errors.length ? "\n" + errors.join("\n") : " none"));
console.log("saved /tmp/ch15-mid.png /tmp/ch15-end.png /tmp/ch26-mid.png /tmp/ch26-end.png");
