import { chromium } from "playwright";

// capElement.mjs <port> <hash> <selector> <tag> <wait>
const port = process.argv[2] || "3001";
const hash = process.argv[3] || "58";
const sel = process.argv[4] || 'div[style*="height: 220px"]';
const tag = process.argv[5] || "elem";
const wait = Number(process.argv[6] || 3000);

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`http://localhost:${port}/sales-deck#${hash}`, { waitUntil: "networkidle" });
await p.waitForTimeout(wait);
const el = p.locator(sel).first();
const n = await el.count();
if (!n) { console.log("SELECTOR NOT FOUND:", sel); await browser.close(); process.exit(1); }
await el.screenshot({ path: `/tmp/${tag}.png` });
await browser.close();
console.log("saved /tmp/" + tag + ".png");
