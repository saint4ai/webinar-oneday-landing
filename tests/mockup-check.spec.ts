import { test, devices } from "@playwright/test";

/**
 * Mockup screenshot — проверяем, что скриншот платформы
 * корректно помещается в mockup-планшет на mobile / tablet / desktop.
 */
const URL = "https://onai.academy/workshop";

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`Mockup планшет — ${vp.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      ...devices["iPhone 13"],
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1500);

    // Прокрутить до case секции и дать анимации проиграть
    await page.locator("#case-academy").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    // Чуть-чуть дальше чтобы scroll-driven анимация ушла в финальное состояние
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: "instant" }));
    await page.waitForTimeout(1500);

    // Скриншот только mockup-блока
    const mockup = page.locator("#case-academy");
    await mockup.screenshot({
      path: `tests/__screenshots__/mockup-${vp.name}.png`,
    });

    console.log(`✅ ${vp.name}: tests/__screenshots__/mockup-${vp.name}.png`);
    await ctx.close();
  });
}
