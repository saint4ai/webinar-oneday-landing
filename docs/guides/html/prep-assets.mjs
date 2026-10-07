// Готовит картинки для вёрстки гайдов: обрезки обложек, плоские логотипы, свечение, lego-иконки PNG.
// Запуск: node docs/guides/html/prep-assets.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const img = join(here, "img");

// 1. Обложки гайдов: только иллюстрация (верхние 740 px), без вшитой подписи.
for (const [src, out] of [["bonus-virusny", "cover-virusny"], ["bonus-plan", "cover-plan"], ["bonus-hooks", "cover-hooks"]]) {
  await sharp(join(root, `workshop-montazh/assets/bonus/${src}.png`))
    .extract({ left: 0, top: 0, width: 1100, height: 740 })
    .flatten({ background: "#FBF3E4" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(join(img, `${out}.jpg`));
}

// 2. Плоские логотипы без SVG-градиента (градиенты в PDF превращаются в тяжёлые shading-узоры).
const light = readFileSync(join(root, "workshop-montazh/assets/logos/onai-logo-gold.svg"), "utf8").replace(/url\(#gold\)/g, "#C9A05A");
writeFileSync(join(img, "logo-light.svg"), light);
const night = readFileSync(join(root, "docs/tg-media/onai-logo-night.svg"), "utf8").replace(/url\(#gold\)/g, "#E3C07B");
writeFileSync(join(img, "logo-night.svg"), night);

// 3. Свечение: растровая PNG с прозрачностью (вместо CSS-градиента).
const glow = (rgb, a, name) => sharp(Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><defs><radialGradient id="g"><stop offset="0" stop-color="${rgb}" stop-opacity="${a}"/><stop offset="1" stop-color="${rgb}" stop-opacity="0"/></radialGradient></defs><rect width="900" height="900" fill="url(#g)"/></svg>`
)).png().toFile(join(img, name));
await glow("#E3C07B", 0.42, "glow-gold.png");
await glow("#A0532A", 0.40, "glow-brown.png");

// 4. Lego-иконки в PNG (не больше 240 px по большой стороне).
const lego = ["lg-i-hourglass", "lg-i-hook", "lg-i-phonearrow", "lg-i-rocket", "lg-i-magnifier", "lg-i-camera", "lg-i-cards",
  "lg-i-calendar", "lg-i-chatkey", "lg-i-box", "lg-i-phones", "lg-i-robot", "lg-i-clapper", "lg-i-botchat"];
for (const n of lego) {
  const p = join(root, `public/montage/lego/${n}.webp`);
  if (!existsSync(p)) { console.log("нет", n); continue; }
  await sharp(p).resize({ width: 240, height: 240, fit: "inside" }).png({ compressionLevel: 9 }).toFile(join(img, `${n}.png`));
}
console.log("ok");
