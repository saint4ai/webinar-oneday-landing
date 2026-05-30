import { chromium } from "playwright";

const port = process.argv[2] || "3001";
// Маппинг: hash (1-based позиция) → человекочитаемый ярлык слайда
const SLIDES = [
  [1, "01-coldopen"], [2, "02-chat"], [3, "03-org"], [4, "04-bonus-announce"],
  [5, "05-bonus-list"], [6, "06-poll-bonus"], [7, "07-program"], [8, "08-benefits"],
  [9, "09-targeting"], [10, "10-azim-chat"], [11, "10b-azim-app"], [12, "11-fire"],
  [13, "12-transition"], [14, "13-alex"], [15, "14-authority"], [16, "15-chapter1"],
  [17, "16-definition"], [18, "17-misconception"], [19, "18-howitworks"], [20, "19-whattobuild"],
  [21, "20-timescale"], [22, "21-downsides"], [23, "21b-downsides-fix"], [24, "22-cost"],
  [25, "23-forwhom"], [26, "24-whovibecoder"], [27, "25-pollidea"], [28, "26-chapter3"],
  [29, "27-direction1"], [30, "28-direction2"], [31, "29-direction3"], [32, "30-summary"],
  [33, "31-todayshow"], [34, "32-pollwhich"], [35, "33-transition2"],
  [36, "45-sales-pain"], [37, "46-sales-solution"],
];

const browser = await chromium.launch();
const report = [];

for (const [hash, name] of SLIDES) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 90)));
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 90)));
  try {
    await p.goto(`http://localhost:${port}/sales-deck#${hash}`, { waitUntil: "networkidle", timeout: 30000 });
    await p.waitForTimeout(2600); // дать анимациям доиграть
    await p.screenshot({ path: `/tmp/all-${String(hash).padStart(2, "0")}-${name}.png` });
    // фильтруем 404 фавикона — не баг слайда
    const realErrs = errs.filter((e) => !e.includes("404") && !e.includes("favicon"));
    report.push(`#${hash} ${name}: ${realErrs.length ? "ERR " + realErrs[0] : "ok"}`);
  } catch (e) {
    report.push(`#${hash} ${name}: FAIL ${String(e).slice(0, 70)}`);
  }
  await p.close();
}

await browser.close();
console.log(report.join("\n"));
console.log("DONE " + SLIDES.length + " slides");
