import { chromium } from "playwright";

const port = process.argv[2] || "3001";
const hash = process.argv[3] || "15"; // Slide_14_AuthorityStats = deck #15
const url = `http://localhost:${port}/sales-deck#${hash}`;

const browser = await chromium.launch();

// 1920 — два кадра: после раскатки цифр (t=4.6s) и после прокрутки карусели (t=8.2s)
const p1 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
p1.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p1.on("pageerror", (e) => errors.push(String(e)));
await p1.goto(url, { waitUntil: "networkidle" });
await p1.waitForTimeout(4600);
await p1.screenshot({ path: `/tmp/s14-1920-a.png` });
await p1.waitForTimeout(3600);
await p1.screenshot({ path: `/tmp/s14-1920-b.png` });

// 1440 — проверка сетки на меньшем экране
const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p2.goto(url, { waitUntil: "networkidle" });
await p2.waitForTimeout(5000);
await p2.screenshot({ path: `/tmp/s14-1440.png` });

await browser.close();
console.log("CONSOLE_ERRORS:" + (errors.length ? "\n" + errors.join("\n") : " none"));
console.log("saved /tmp/s14-1920-a.png /tmp/s14-1920-b.png /tmp/s14-1440.png");
