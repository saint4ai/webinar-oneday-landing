import { chromium } from "playwright";

const port = process.argv[2] || "3001";
const hash = process.argv[3] || "17";
const url = `http://localhost:${port}/sales-deck#${hash}`;

const browser = await chromium.launch();
const errors = [];

// 1920 — три фазы декодинга заголовка (биты → частично → текст)
const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push(String(e)));
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
await p.screenshot({ path: `/tmp/dec-1.png` });
await p.waitForTimeout(450); // ~950ms
await p.screenshot({ path: `/tmp/dec-2.png` });
await p.waitForTimeout(1500); // ~2450ms
await p.screenshot({ path: `/tmp/dec-3.png` });
await p.close();

await browser.close();
console.log("CONSOLE_ERRORS:" + (errors.length ? "\n" + errors.join("\n") : " none"));
console.log("saved /tmp/dec-1.png (биты) /tmp/dec-2.png (частично) /tmp/dec-3.png (текст)");
