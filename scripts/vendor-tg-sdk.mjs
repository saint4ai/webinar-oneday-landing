#!/usr/bin/env node
/**
 * Скачивает скрипт Telegram Web App и кладёт его в form-api/tg-webapp-sdk.ts строкой.
 * Зачем: общий CSP от nginx не пускает https://telegram.org в script-src, поэтому скрипт отдаём со своего адреса.
 * Запуск из корня репозитория: node scripts/vendor-tg-sdk.mjs (Node 20, без зависимостей).
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const URL_SDK = "https://telegram.org/js/telegram-web-app.js";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "form-api", "tg-webapp-sdk.ts");

const res = await fetch(URL_SDK);
if (res.status !== 200) {
  console.error(`Ответ ${res.status} вместо 200 от ${URL_SDK}`);
  process.exit(1);
}
const text = await res.text();
if (!text.includes("WebApp")) {
  console.error("В скачанном тексте нет слова WebApp, файл не записан.");
  process.exit(1);
}

const sha = createHash("sha256").update(text).digest("hex");
const date = new Date().toISOString().slice(0, 10);
const out =
  `// Сгенерировано scripts/vendor-tg-sdk.mjs из ${URL_SDK}, ${date}, sha256 ${sha}.\n` +
  `// Не править руками: перегенерировать скриптом.\n` +
  `export const TG_WEBAPP_SDK: string = ${JSON.stringify(text)};\n`;
writeFileSync(OUT, out);
console.log(`Записано ${OUT}: ${text.length} символов, sha256 ${sha}`);
