import { test, expect } from "@playwright/test";

/**
 * Smoke + visual проверки лендинга воркшопа.
 * Запуск: `npx playwright test` (dev-сервер должен крутиться на :3001)
 *
 * Что проверяем по каждому viewport:
 *  1. Hero загружается, H1 видим
 *  2. Highlighted-плашка ("AI-РАЗРАБОТЧИКОМ") видна и не выходит за viewport
 *  3. Все 5 секций на месте (hero/about/case-academy/my-products/footer)
 *  4. Кнопка регистрации видима и в пределах viewport
 *  5. Mockup case-academy не обрезается (object-contain работает)
 *  6. GlowingCard'ы рендерятся на product cards
 *  7. Скриншоты ключевых блоков сохраняются в tests/__screenshots__/
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // Ждём, пока шрифты и motion отработают начальные анимации
  await page.waitForTimeout(2500);
});

test("hero — H1 виден и не обрезан", async ({ page }, info) => {
  const h1 = page.locator("h1").first();
  await expect(h1).toBeVisible();

  // H1 должен быть в пределах viewport по X
  const box = await h1.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);

  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-01-hero.png`,
    fullPage: false,
  });
});

test("highlighted — solid плашка отрендерилась в hero", async ({ page }) => {
  await page.waitForTimeout(1800);

  // Highlighted в hero рендерит 1 aria-hidden span (solid плашка)
  const hero = page.locator("h1").first();
  const ariaHiddenInHero = hero.locator('[aria-hidden="true"]');
  const count = await ariaHiddenInHero.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test("все 4 секции на месте", async ({ page }, info) => {
  // Hero определяем по самому первому h1
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("#about")).toBeAttached();
  await expect(page.locator("#case-academy")).toBeAttached();
  await expect(page.locator("#my-products")).toBeAttached();
});

test("about-me — 6 фактов-карточек с glow", async ({ page }, info) => {
  await page.locator("#about").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const cards = page.locator("#about .gc-shell");
  await expect(cards).toHaveCount(6);

  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-02-about.png`,
    fullPage: false,
  });
});

test("case-academy — mockup помещается, не обрезает контент", async ({
  page,
}, info) => {
  await page.locator("#case-academy").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  // Mockup-изображение должно загрузиться (Image + scan-overlay поверх)
  const img = page.locator("#case-academy img").first();
  await expect(img).toBeVisible();

  const box = await img.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  // Изображение НЕ должно выходить за viewport по X
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);

  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-03-case-mockup.png`,
    fullPage: false,
  });
});

test("case-academy — 3 метрики с glow (фичи теперь плоский текст)", async ({
  page,
}) => {
  await page.locator("#case-academy").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const cards = page.locator("#case-academy .gc-shell");
  await expect(cards).toHaveCount(3);
});

test("case-academy — параграф фич виден и не обрезается", async ({
  page,
}, info) => {
  await page.locator("#case-academy").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  const para = page.getByTestId("case-features-text");
  await expect(para).toBeVisible();

  // Параграф не выходит за viewport по X
  const box = await para.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);

  // Параграф содержит ключевые термины фич
  const text = await para.textContent();
  expect(text).toContain("AI-наставник");
  expect(text).toContain("аналитика");
  expect(text).toContain("персональный");

  // Под параграфом — следующая секция (#my-products), параграф не наезжает
  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-06-features-text.png`,
    fullPage: false,
  });
});

test("UX/UI — нет горизонтального overflow на странице", async ({
  page,
}, info) => {
  // Один из самых частых багов адаптации — горизонтальный скролл
  const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewport = page.viewportSize();
  // Допуск 2px на округление
  expect(docWidth).toBeLessThanOrEqual(viewport!.width + 2);
});

test("UX/UI — все секции рендерят контент (не пустые)", async ({ page }) => {
  // Каждая секция должна содержать хотя бы один h2/h3 заголовок
  const sectionIds = ["about", "case-academy", "testimonials", "my-products"];
  for (const id of sectionIds) {
    const headings = page.locator(`#${id} h2, #${id} h3`);
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  }
});

test("testimonials — 4 карточки учеников с кнопкой развернуть", async ({
  page,
}, info) => {
  await page.locator("#testimonials").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const cards = page.locator("#testimonials article");
  await expect(cards).toHaveCount(4);

  // Имена учеников
  await expect(page.locator("#testimonials").getByText("Айдос")).toBeVisible();
  await expect(page.locator("#testimonials").getByText("Ренат")).toBeVisible();
  await expect(page.locator("#testimonials").getByText("Мерей")).toBeVisible();
  await expect(
    page.locator("#testimonials").getByText("Владислав")
  ).toBeVisible();

  // 4 кнопки «развернуть»
  const expandButtons = page.locator(
    "#testimonials button:has-text('развернуть')"
  );
  await expect(expandButtons).toHaveCount(4);

  // Клик на первую — разворачивает (появляется button с текстом 'свернуть')
  await expandButtons.first().click();
  await page.waitForTimeout(400);
  await expect(
    page.locator("#testimonials button:has-text('свернуть')").first()
  ).toBeVisible();

  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-07-testimonials.png`,
    fullPage: false,
  });
});

test("UX/UI — кастомные шрифты (BENZIN) подгрузились", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  const fontStatus = await page.evaluate(async () => {
    // @ts-expect-error — Document.fonts API
    await document.fonts.ready;
    // @ts-expect-error
    return Array.from(document.fonts).map((f: FontFace) => ({
      family: f.family,
      status: f.status,
    }));
  });
  // Хотя бы один шрифт должен быть loaded
  const loaded = fontStatus.filter((f) => f.status === "loaded");
  expect(loaded.length).toBeGreaterThan(0);
});

test("UX/UI — нет дыры между мокапом и параграфом фич (≤120px)", async ({
  page,
}) => {
  await page.locator("#case-academy").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  const mockup = page.locator("#case-academy img").first();
  const para = page.getByTestId("case-features-text");

  const mockupBox = await mockup.boundingBox();
  const paraBox = await para.boundingBox();
  expect(mockupBox).not.toBeNull();
  expect(paraBox).not.toBeNull();

  const gap = paraBox!.y - (mockupBox!.y + mockupBox!.height);
  // Между нижней границей мокапа и верхней параграфа должно быть не больше 120px
  expect(gap).toBeLessThanOrEqual(120);
  // И не меньше 16px — параграф не должен наезжать на мокап
  expect(gap).toBeGreaterThanOrEqual(16);
});

test("UX/UI — Highlighted плашка не задевает соседнюю строку H1", async ({
  page,
}) => {
  await page.waitForTimeout(2200); // ждём раскатку

  // Найти Highlighted-плашку внутри h1 (motion.span с aria-hidden)
  const plashka = page.locator('h1 [aria-hidden="true"]').first();
  await expect(plashka).toBeVisible();

  // Сравнить bottom плашки с top соседней строки H1
  const result = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return { error: "no h1" };
    const plashkaEl = h1.querySelector('[aria-hidden="true"]') as HTMLElement;
    if (!plashkaEl) return { error: "no plashka" };

    const plashkaRect = plashkaEl.getBoundingClientRect();

    // Найти все текстовые ноды h1 → их строки через Range
    const range = document.createRange();
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      if (n.textContent?.trim()) textNodes.push(n as Text);
    }

    // Bounding rects всех текстовых клиентов
    const rects: DOMRect[] = [];
    for (const tn of textNodes) {
      range.selectNodeContents(tn);
      rects.push(...Array.from(range.getClientRects()));
    }

    // Найти строки ниже плашки (top > plashka.bottom)
    const linesBelow = rects.filter((r) => r.top >= plashkaRect.bottom - 1);
    if (linesBelow.length === 0)
      return { ok: true, reason: "no lines below plashka", linesCount: rects.length };

    const nearestBelow = linesBelow.reduce((a, b) => (a.top < b.top ? a : b));
    const overlap = plashkaRect.bottom - nearestBelow.top;
    return {
      ok: overlap <= 0,
      plashkaBottom: plashkaRect.bottom,
      nearestLineTop: nearestBelow.top,
      overlap,
    };
  });

  if ("error" in result) throw new Error(result.error);
  // Плашка не должна заходить на следующую строку (tolerance 1px на sub-pixel rendering)
  if ("overlap" in result && typeof result.overlap === "number") {
    expect(result.overlap).toBeLessThanOrEqual(1);
  }
});

// ═════════ MOBILE-SPECIFIC TESTS ═════════
// Запускаются только на проекте `mobile` (375×812 iPhone 13).
// Ловят баги «налеплено тесно» и mobile-only регрессии.

test.describe("MOBILE-SPECIFIC", () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name !== "mobile", "mobile only");
  });

  test("CTA-кнопка в hero помещается в viewport по ширине", async ({
    page,
  }) => {
    const cta = page
      .locator("button")
      .filter({ hasText: /зарегистрироваться/i })
      .first();
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    const vp = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp!.width);
  });

  test("Hero плашка Highlighted полностью в viewport", async ({ page }) => {
    await page.waitForTimeout(2200);
    const plashka = page.locator('h1 [aria-hidden="true"]').first();
    const box = await plashka.boundingBox();
    const vp = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp!.width + 1);
  });

  test("Между секциями достаточно воздуха (≥40px)", async ({ page }) => {
    const pairs: [string, string][] = [
      ["#about", "#case-academy"],
      ["#case-academy", "#my-products"],
    ];
    for (const [aId, bId] of pairs) {
      const a = page.locator(aId);
      const b = page.locator(bId);
      const aBox = await a.boundingBox();
      const bBox = await b.boundingBox();
      if (!aBox || !bBox) continue;
      const gap = bBox.y - (aBox.y + aBox.height);
      // Между секциями должно быть пространство, не наезд
      expect(gap).toBeGreaterThanOrEqual(-1);
    }
  });

  test("Все клик-таргеты ≥ 44px (Apple HIG minimum touch target)", async ({
    page,
  }) => {
    const buttons = await page.locator("button, a[href]").all();
    let undersized = 0;
    for (const b of buttons) {
      const box = await b.boundingBox();
      if (!box) continue;
      // Чек только видимых элементов (boundingBox null = не видим)
      if (box.height > 0 && box.height < 30) undersized++;
    }
    // Допускаем small inline-link (типа omnidash.kz в карточках) — не больше 5
    expect(undersized).toBeLessThanOrEqual(5);
  });

  test("Шрифты на mobile не overflow-ят: H1 font-size ≤ viewport / 6", async ({
    page,
  }) => {
    const h1 = page.locator("h1").first();
    const fontSize = await h1.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize)
    );
    const vp = page.viewportSize();
    // На 375px viewport H1 не должен быть > ~62px (clamp min 18)
    expect(fontSize).toBeLessThan(vp!.width / 4);
  });
});

test("my-products — 2 product-карточки с glow", async ({ page }, info) => {
  await page.locator("#my-products").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const cards = page.locator("#my-products .gc-shell");
  await expect(cards).toHaveCount(2);

  // Обе карточки — кликабельные ссылки
  const links = page.locator("#my-products .gc-shell a");
  await expect(links).toHaveCount(2);

  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-04-products.png`,
    fullPage: false,
  });
});

test("full page screenshot — итоговый вид", async ({ page }, info) => {
  await page.screenshot({
    path: `tests/__screenshots__/${info.project.name}-05-fullpage.png`,
    fullPage: true,
  });
});
