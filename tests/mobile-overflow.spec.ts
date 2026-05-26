import { test, expect, devices } from "@playwright/test";

/**
 * Mobile overflow audit — нет horizontal scroll и нет видимых элементов
 * (текст, кнопки, картинки) которые выходят за viewport, на всех страницах.
 *
 * Игнорируем:
 *  - inline-block-плашки внутри <Highlighted> (lime/orange подложки) — у них
 *    overflow:visible by design, но они визуально клипуются на body/section
 *    overflow:hidden. Главное чтобы body не скроллился.
 */

const BASE = "https://onai.academy/workshop";

const PAGES = [
  { name: "main", path: "" },
  { name: "thank-you", path: "/thank-you" },
  { name: "privacy", path: "/privacy" },
];

const VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "375", width: 375, height: 812 },
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
];

for (const pg of PAGES) {
  for (const vp of VIEWPORTS) {
    test(`${pg.name} @ ${vp.width}px — нет overflow`, async ({ browser }) => {
      const ctx = await browser.newContext({
        ...devices["iPhone 13"],
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await ctx.newPage();
      await page.goto(`${BASE}${pg.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(2000);

      // 1. Body overflow check
      const bodyW = await page.evaluate(() => document.body.scrollWidth);
      const docW = await page.evaluate(() => document.documentElement.scrollWidth);

      // 2. Visible TEXT/BUTTON overflow check (без декоративных плашек)
      const offenders = await page.evaluate((vw) => {
        const isInsideHighlighted = (el: Element): boolean => {
          let cur: Element | null = el;
          while (cur) {
            if (cur.classList?.contains("inline-block") &&
                cur.classList?.contains("whitespace-nowrap")) return true;
            cur = cur.parentElement;
          }
          return false;
        };

        const els = Array.from(
          document.querySelectorAll<HTMLElement>(
            "h1, h2, h3, p, button, input, label, a, li"
          )
        );
        return els
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) return false;
            if (r.right <= vw + 1) return false;
            if (isInsideHighlighted(el)) return false;
            return true;
          })
          .slice(0, 8)
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            right: Math.round(el.getBoundingClientRect().right),
            width: Math.round(el.getBoundingClientRect().width),
            text: (el.textContent || "").trim().slice(0, 50),
          }));
      }, vp.width);

      console.log(`\n📄 ${pg.name} @ ${vp.width}px`);
      console.log(`   body.scrollWidth: ${bodyW} doc: ${docW}`);
      if (offenders.length > 0) {
        console.log(`   ❌ ${offenders.length} overflow:`);
        offenders.forEach((o) =>
          console.log(`     <${o.tag}> right=${o.right} w=${o.width} "${o.text}"`)
        );
      } else {
        console.log(`   ✅ ok`);
      }

      await page.screenshot({
        path: `tests/__screenshots__/overflow-${pg.name}-${vp.width}.png`,
        fullPage: true,
      });

      expect(bodyW, `body scrollWidth ${bodyW} > viewport ${vp.width}`).toBeLessThanOrEqual(
        vp.width + 1
      );
      expect(offenders, `${offenders.length} text/button elements overflow viewport`).toHaveLength(0);

      await ctx.close();
    });
  }
}
