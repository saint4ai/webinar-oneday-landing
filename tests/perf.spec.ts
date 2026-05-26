import { test, expect } from "@playwright/test";

/**
 * Performance audit — LCP, FCP, TTI, payload size.
 *
 * Запуск:
 *   npx playwright test perf.spec.ts --project=mobile
 *   npx playwright test perf.spec.ts --project=desktop
 */

const URL = "https://onai.academy/workshop";

type Vitals = {
  fcp: number; // First Contentful Paint (ms)
  lcp: number; // Largest Contentful Paint (ms)
  domContentLoaded: number;
  loadEvent: number;
  transferKB: number;
  imageCount: number;
};

async function measureVitals(page: import("@playwright/test").Page): Promise<Vitals> {
  let transferTotal = 0;
  page.on("response", async (resp) => {
    try {
      const buf = await resp.body();
      transferTotal += buf.length;
    } catch {
      // ignore (некоторые resources не дают body)
    }
  });

  await page.goto(URL, { waitUntil: "load", timeout: 30_000 });

  // Wait LCP to stabilize (5 sec window per Lighthouse spec)
  await page.waitForTimeout(5000);

  const vitals = await page.evaluate(() => {
    return new Promise<{
      fcp: number;
      lcp: number;
      domContentLoaded: number;
      loadEvent: number;
      imageCount: number;
    }>((resolve) => {
      let fcp = 0;
      let lcp = 0;

      try {
        const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0];
        if (fcpEntry) fcp = fcpEntry.startTime;
      } catch {}

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            lcp = entry.startTime;
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        // Flush after small delay
        setTimeout(() => {
          observer.disconnect();
          const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
          resolve({
            fcp,
            lcp,
            domContentLoaded: nav?.domContentLoadedEventEnd || 0,
            loadEvent: nav?.loadEventEnd || 0,
            imageCount: document.querySelectorAll("img").length,
          });
        }, 100);
      } catch {
        resolve({ fcp, lcp: 0, domContentLoaded: 0, loadEvent: 0, imageCount: 0 });
      }
    });
  });

  return {
    ...vitals,
    transferKB: Math.round(transferTotal / 1024),
  };
}

test("Performance vitals — onai.academy/workshop", async ({ page }) => {
  const v = await measureVitals(page);

  console.log("\n📊 Performance metrics");
  console.log("─────────────────────────────");
  console.log(`  FCP                : ${v.fcp.toFixed(0)} ms`);
  console.log(`  LCP                : ${v.lcp.toFixed(0)} ms`);
  console.log(`  DOMContentLoaded   : ${v.domContentLoaded.toFixed(0)} ms`);
  console.log(`  Load event         : ${v.loadEvent.toFixed(0)} ms`);
  console.log(`  Total transfer     : ${v.transferKB} KB`);
  console.log(`  Image count        : ${v.imageCount}`);
  console.log("─────────────────────────────");
  console.log(
    `  LCP rating         : ${
      v.lcp < 2500 ? "✅ GOOD" : v.lcp < 4000 ? "⚠️ NEEDS IMPROVEMENT" : "❌ POOR"
    } (target <2500ms)`
  );

  expect(v.lcp, "LCP должен быть < 4000ms").toBeLessThan(4000);
});
