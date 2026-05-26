import { test, expect } from "@playwright/test";

/**
 * Thank You page — full-screen capture на 3 viewport (mobile/tablet/desktop)
 * + проверка что главные элементы помещаются в один экран без скролла.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/thank-you", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // anim + confetti settle
});

test("ty — full viewport capture", async ({ page }, info) => {
  // Снимаем ровно viewport (без full page) — чтобы проверить one-screen fit
  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-ty-viewport.png`,
    fullPage: false,
  });
});

test("ty — screenshot гифтов в полёте", async ({ page }, info) => {
  // Перезаходим без долгого wait — чтобы поймать гифты mid-flight
  await page.goto("/thank-you");
  await page.waitForTimeout(1500); // ~mid-flight для 3-5s animation
  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-ty-gifts-flight.png`,
    fullPage: false,
  });
});

test("ty — main CTA visible in initial viewport (no scroll)", async ({
  page,
}) => {
  // Главная CTA-кнопка должна быть видна без скролла
  const cta = page
    .locator("a")
    .filter({ hasText: /забрать бонусы/i })
    .first();
  await expect(cta).toBeVisible();

  const box = await cta.boundingBox();
  const vp = page.viewportSize();
  expect(box).not.toBeNull();
  // Кнопка ВНУТРИ viewport
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp!.height);
});

test("ty — H1 + bonuses + CTA все видны без скролла", async ({ page }) => {
  const h1 = page.locator("h1").first();
  const cta = page
    .locator("a")
    .filter({ hasText: /забрать бонусы/i })
    .first();
  const bonusPills = page.locator("text=/бонус 0[123]/i");

  await expect(h1).toBeInViewport();
  await expect(cta).toBeInViewport();
  await expect(bonusPills.first()).toBeInViewport();
});
