// Готовит картинки для вёрстки гайдов: обрезки обложек, плоские логотипы, lego-иконки PNG. Фоны со свечением: prep-bg.py.
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

// 2. Плоские логотипы без SVG-градиента и без <defs> (градиенты в PDF превращаются в тяжёлые shading-узоры).
const flat = (t) => t.replace(/<defs>[\s\S]*?<\/defs>/g, "");
const light = readFileSync(join(root, "workshop-montazh/assets/logos/onai-logo-gold.svg"), "utf8").replace(/url\(#gold\)/g, "#C9A05A");
writeFileSync(join(img, "logo-light.svg"), flat(light));
const night = readFileSync(join(root, "docs/tg-media/onai-logo-night.svg"), "utf8").replace(/url\(#gold\)/g, "#E3C07B");
writeFileSync(join(img, "logo-night.svg"), flat(night));

// 3. Свечение ночных страниц теперь запечено в непрозрачные фоны: python docs/guides/html/prep-bg.py (PNG с альфой в PDF не используем).

// 4. Lego-иконки в PNG без альфа-канала (не больше 240 px по большой стороне).
const lego = ["lg-i-hourglass", "lg-i-hook", "lg-i-phonearrow", "lg-i-rocket", "lg-i-magnifier", "lg-i-camera", "lg-i-cards",
  "lg-i-calendar", "lg-i-chatkey", "lg-i-box", "lg-i-phones", "lg-i-robot", "lg-i-clapper", "lg-i-botchat"];
for (const n of lego) {
  const p = join(root, `public/montage/lego/${n}.webp`);
  if (!existsSync(p)) { console.log("нет", n); continue; }
  // иконки лежат на кремовых карточках: клеим на крем, чтобы в PDF не было PNG с альфой (SMask)
  await sharp(p).resize({ width: 240, height: 240, fit: "inside" }).flatten({ background: "#FBF3E4" }).png({ compressionLevel: 9 }).toFile(join(img, `${n}.png`));
}
console.log("ok");
