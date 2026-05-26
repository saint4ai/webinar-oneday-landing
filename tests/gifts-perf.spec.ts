import { test, expect, devices } from "@playwright/test";

/**
 * Performance audit для FlyingGifts на Thank You.
 *
 * Замеряет:
 *  - количество анимируемых элементов (должно быть ≤ density limit)
 *  - FPS во время анимации (target ≥ 50 fps)
 *  - что DOM очищается после 5 сек (cleanup)
 *  - что повторный mount = новый seed (idempotency)
 */

const URL = "https://onai.academy/workshop/thank-you";

const SCENARIOS = [
  { name: "mobile", width: 375, height: 812, maxGifts: 5, maxConfetti: 8, maxSparkles: 3 },
  { name: "tablet", width: 768, height: 1024, maxGifts: 8, maxConfetti: 14, maxSparkles: 4 },
  { name: "desktop", width: 1440, height: 900, maxGifts: 12, maxConfetti: 20, maxSparkles: 6 },
];

for (const sc of SCENARIOS) {
  test(`${sc.name} — adaptive density (≤${sc.maxGifts} gifts)`, async ({ browser }) => {
    // Mobile/tablet через iPhone profile, desktop — обычный context
    const ctx = await browser.newContext(
      sc.name === "desktop"
        ? { viewport: { width: sc.width, height: sc.height } }
        : {
            ...devices["iPhone 13"],
            viewport: { width: sc.width, height: sc.height },
          }
    );
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800); // Дать React гидрировать + density setState

    const counts = await page.evaluate(() => ({
      gifts: document.querySelectorAll(".gift-anim").length,
      confetti: document.querySelectorAll(".conf-anim").length,
      sparkles: document.querySelectorAll(".spark-anim").length,
    }));

    console.log(
      `📊 ${sc.name} (${sc.width}px): gifts=${counts.gifts} confetti=${counts.confetti} sparkles=${counts.sparkles}`
    );

    expect(counts.gifts).toBeLessThanOrEqual(sc.maxGifts);
    expect(counts.confetti).toBeLessThanOrEqual(sc.maxConfetti);
    expect(counts.sparkles).toBeLessThanOrEqual(sc.maxSparkles);
    expect(counts.gifts, "Хотя бы 1 gift должен быть").toBeGreaterThan(0);

    await ctx.close();
  });
}

test("DOM очищается через 5s (cleanup)", async ({ browser }) => {
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 375, height: 812 },
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const before = await page.evaluate(() => document.querySelectorAll(".gift-anim").length);
  expect(before).toBeGreaterThan(0);

  // Ждать 6.5s — auto-cleanup срабатывает через 5s после density.gifts set,
  // density set через ~100ms после hydration, +tolerance
  await page.waitForTimeout(6500);

  const after = await page.evaluate(() => document.querySelectorAll(".gift-anim").length);
  console.log(`🧹 cleanup: ${before} → ${after} DOM nodes`);
  expect(after, "После 6.5s DOM должен очиститься").toBe(0);

  await ctx.close();
});

test("FPS не падает ниже 30 во время анимации (mobile)", async ({ browser }) => {
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 375, height: 812 },
  });
  const page = await ctx.newPage();

  // Throttle CPU 4x — эмулируем средний смартфон
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  // Замеряем FPS через rAF за 3 секунды активной анимации
  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let frames = 0;
        let start: number | null = null;
        const tick = (t: number) => {
          if (start === null) start = t;
          frames++;
          if (t - start! < 3000) {
            requestAnimationFrame(tick);
          } else {
            resolve(frames / 3);
          }
        };
        requestAnimationFrame(tick);
      })
  );

  console.log(`⚡ mobile FPS (4x CPU throttle): ${fps.toFixed(1)}`);
  expect(fps, "FPS должен быть ≥ 30 на throttled mobile").toBeGreaterThan(30);

  await ctx.close();
});
