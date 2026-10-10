// Готовит картинки для раздаток к урокам: дополнительные lego-объекты в PNG и одноцветные логотипы сервисов.
// Запуск: node docs/guides/html/prep-lessons-assets.mjs
// Логотипы не перерисованы: берутся настоящие файлы из репозитория, меняется только заливка на цвет текста бренда.
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const img = join(here, "img");

// 1. Lego-объекты, которых ещё нет в img/ (иконки i-… до 240 px, сцены s-… до 360 px, фабрика крупнее).
const small = ["lg-i-laptopfilm"];
const scene = ["lg-s13-editor", "lg-s21-robot", "lg-s32-hand", "lg-s43-leaving", "lg-s59-desk", "lg-s50-plan"];
const jobs = [
  ...small.map((n) => [n, 240]),
  ...scene.map((n) => [n, 360]),
  ["lg-s49-factory", 900],
];
for (const [n, size] of jobs) {
  const p = join(root, `public/montage/lego/${n}.webp`);
  if (!existsSync(p)) { console.log("нет", n); continue; }
  await sharp(p).resize({ width: size, height: size, fit: "inside" }).png({ compressionLevel: 9 }).toFile(join(img, `${n}.png`));
}

// 2. Логотипы сервисов: настоящие SVG в фирменных цветах сервисов (Александр 10.10: логотип каждого сервиса настоящий).
// У OpenAI фирменный знак чёрный: красим в цвет текста бренда. Zernio: значок с zernio.com/icon.svg (img-src/zernio.svg).
const INK = "#2A211C";
const logos = [
  ["claude", "public/logos/claude.svg"],
  ["telegram", "public/logos/telegram.svg"],
  ["instagram", "public/logos/instagram.svg"],
  ["whatsapp", "workshop-montazh/assets/logos/whatsapp.svg"],
  ["openai", "workshop-montazh/assets/logos/openai_mark.svg", INK],
  ["zernio", "docs/guides/html/img-src/zernio.svg"],
];
for (const [name, rel, recolor] of logos) {
  let s = readFileSync(join(root, rel), "utf8");
  if (recolor) {
    if (/fill=["']#[0-9A-Fa-f]{3,6}["']/.test(s.split(">")[0])) s = s.replace(/^(<svg[^>]*?)fill=(["'])#[0-9A-Fa-f]{3,6}/, `$1fill="${recolor}"`);
    else s = s.replace(/^<svg/, `<svg fill="${recolor}"`);
  }
  s = s.replace(/<title>[^<]*<\/title>/, "");
  writeFileSync(join(img, `logo-${name}.svg`), s);
}
console.log("ok");
