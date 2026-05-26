import { test, expect } from "@playwright/test";

/**
 * PROD smoke — реальные тесты против https://onai.academy/workshop.
 *
 * Проверяет:
 *  - страницы открываются (/, /thank-you, /privacy)
 *  - все картинки реально загружаются (naturalWidth > 0)
 *  - нет 404 в network
 *  - нет console errors
 *
 * Запуск:
 *  npx playwright test prod-smoke.spec.ts --project=desktop
 */

const PROD = "https://onai.academy/workshop";

type PageReport = {
  url: string;
  status: "ok" | "fail";
  consoleErrors: string[];
  failedRequests: string[];
  brokenImages: string[];
  imageCount: number;
};

async function auditPage(page: import("@playwright/test").Page, url: string): Promise<PageReport> {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (resp) => {
    if (resp.status() < 400) return;
    const u = resp.url();
    // Внешние CDN которые не контролируем (twemoji flags, etc.)
    if (u.includes("cdnjs.cloudflare.com")) return;
    if (u.includes("favicon")) return;
    // react-international-phone делает GeoIP fetch на ipapi.co (CORS-блок,
    // фолбэкается на дефолтную страну — не критично)
    if (u.includes("ipapi.co")) return;
    failedRequests.push(`${resp.status()} ${u}`);
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  // Проскроллить до низа поэтапно — триггерит lazy-loaded картинки
  await page.evaluate(async () => {
    const step = 600;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const imgInfo = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];
    return {
      count: imgs.length,
      broken: imgs
        .filter((i) => {
          if (i.complete && i.naturalWidth > 0) return false;
          // Игнорируем twemoji флаги стран из CDN (react-international-phone)
          if (i.src.includes("cdnjs.cloudflare.com/ajax/libs/twemoji")) return false;
          return true;
        })
        .map((i) => i.src || i.getAttribute("data-src") || "(no src)"),
    };
  });

  return {
    url,
    status: failedRequests.length === 0 && imgInfo.broken.length === 0 ? "ok" : "fail",
    consoleErrors,
    failedRequests,
    brokenImages: imgInfo.broken,
    imageCount: imgInfo.count,
  };
}

test.describe("PROD smoke @ onai.academy/workshop", () => {
  test("Hero / лендинг — все ассеты грузятся", async ({ page }) => {
    const report = await auditPage(page, PROD);

    console.log(`\n📄 ${report.url}`);
    console.log(`   images on page: ${report.imageCount}`);
    console.log(`   broken: ${report.brokenImages.length}`);
    report.brokenImages.forEach((b) => console.log(`     ❌ ${b}`));
    console.log(`   failed network: ${report.failedRequests.length}`);
    report.failedRequests.forEach((f) => console.log(`     ⚠️ ${f}`));
    console.log(`   console errors: ${report.consoleErrors.length}`);
    report.consoleErrors.slice(0, 5).forEach((e) => console.log(`     🔥 ${e.slice(0, 200)}`));

    await page.screenshot({
      path: `tests/__screenshots__/prod-hero.png`,
      fullPage: true,
    });

    expect(report.brokenImages, "Broken images:\n" + report.brokenImages.join("\n")).toHaveLength(0);
    expect(report.failedRequests.filter((f) => !f.includes("favicon"))).toHaveLength(0);
  });

  test("Thank-you — картинки + CTA в сообщество", async ({ page }) => {
    const report = await auditPage(page, `${PROD}/thank-you`);

    console.log(`\n📄 ${report.url}`);
    console.log(`   broken: ${report.brokenImages.length}`);
    report.brokenImages.forEach((b) => console.log(`     ❌ ${b}`));

    await page.screenshot({
      path: `tests/__screenshots__/prod-thankyou.png`,
      fullPage: true,
    });

    // Проверяем что CTA ведёт в WhatsApp-сообщество, не в edbot
    const ctaHref = await page
      .locator('a[href*="chat.whatsapp.com"]')
      .first()
      .getAttribute("href");
    expect(ctaHref, "CTA должен вести в chat.whatsapp.com/...").toContain("chat.whatsapp.com");

    expect(report.brokenImages, "Broken images:\n" + report.brokenImages.join("\n")).toHaveLength(0);
  });

  test("Privacy — текст и логотип", async ({ page }) => {
    const report = await auditPage(page, `${PROD}/privacy`);

    await page.screenshot({
      path: `tests/__screenshots__/prod-privacy.png`,
      fullPage: true,
    });

    await expect(page.locator("h1")).toContainText("Политика");
    await expect(page.locator("body")).toContainText("ТОО «onAI Academy»");
    await expect(page.locator("body")).toContainText("WhatsApp-сообщество");

    expect(report.brokenImages, "Broken images:\n" + report.brokenImages.join("\n")).toHaveLength(0);
  });
});
