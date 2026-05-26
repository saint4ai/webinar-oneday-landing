import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — smoke + visual проверки лендинга воркшопа.
 * Dev-сервер уже крутится на :3001 (через Preview MCP).
 * Не запускаем webServer — используем уже работающий.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "tablet",
      use: {
        ...devices["iPad Pro 11"],
      },
    },
    {
      name: "desktop",
      use: {
        viewport: { width: 1440, height: 900 },
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    },
  ],
});
