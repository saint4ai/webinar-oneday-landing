import { test, devices } from "@playwright/test";

const URL = "https://onai.academy/workshop";

const VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "375", width: 375, height: 812 },
  { name: "390", width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test(`Final CTA — ${vp.name}px (текст «места ограничены» влезает)`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      ...devices["iPhone 13"],
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.locator("#final-cta").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    await page.locator("#final-cta").screenshot({
      path: `tests/__screenshots__/cta-${vp.name}.png`,
    });

    console.log(`✅ cta-${vp.name}.png`);
    await ctx.close();
  });
}
