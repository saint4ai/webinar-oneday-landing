import { test, devices } from "@playwright/test";

const BASE = "https://onai.academy/workshop";

const PAGES = [
  { name: "main", path: "" },
  { name: "thank-you", path: "/thank-you" },
  { name: "privacy", path: "/privacy" },
];

for (const pg of PAGES) {
  test(`${pg.name}: find ALL elements wider than 320px`, async ({ browser }) => {
    const ctx = await browser.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 320, height: 568 },
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}${pg.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const wide = await page.evaluate((vw) => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("*"));
      return els
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > vw + 2 && r.height > 0 && r.width > 0;
        })
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString() || "").slice(0, 70),
          w: Math.round(el.getBoundingClientRect().width),
          right: Math.round(el.getBoundingClientRect().right),
          text: (el.textContent || "").trim().slice(0, 40),
        }))
        .slice(0, 15);
    }, 320);

    console.log(`\n📄 ${pg.name} (320px)`);
    wide.forEach((e) =>
      console.log(`  <${e.tag} class="${e.cls}"> w=${e.w} right=${e.right} "${e.text}"`)
    );

    await ctx.close();
  });
}
