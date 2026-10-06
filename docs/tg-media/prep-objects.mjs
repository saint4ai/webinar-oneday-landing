// Увеличивает мелкие lego-объекты презентации (273 px и меньше) в 3 раза для крупных карточек.
// Запуск: node docs/tg-media/prep-objects.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "../../public/montage/lego");
const out = join(here, "obj");

const items = ["lg-i-cards", "lg-i-phones", "lg-i-clapper", "lg-i-robot", "lg-i-botchat"];
for (const name of items) {
  const img = sharp(join(src, `${name}.webp`));
  const { width } = await img.metadata();
  await img
    .resize({ width: width * 3, kernel: "lanczos3" })
    .sharpen({ sigma: 1.1, m1: 0.8, m2: 1.6 })
    .png({ compressionLevel: 9 })
    .toFile(join(out, `${name}-x3.png`));
  console.log(name, width, "->", width * 3);
}

// Лист сравнения макетов: верхние два макета без нижней таблицы субтитров (1700x1510).
const sheet = "C:/Проекты/reels-montage-pipeline/reference/style-previews/layout-2026-09-18/layout-2026-09-18.png";
await sharp(sheet)
  .extract({ left: 0, top: 0, width: 1700, height: 1510 })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(join(out, "layout-sheet-top.jpg"));
console.log("layout-sheet-top.jpg");
