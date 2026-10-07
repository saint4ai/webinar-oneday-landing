// Увеличивает мелкие lego-объекты презентации (273 px и меньше) в 3 раза для крупных карточек.
// Запуск: node docs/tg-media/prep-objects.mjs [mail]
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "../../public/montage/lego");
const out = join(here, "obj");

// Аргумент «mail»: подготовить только объекты карточек рассылки, старые файлы не трогать.
const onlyMail = process.argv[2] === "mail";

const items = onlyMail ? [] : ["lg-i-cards", "lg-i-phones", "lg-i-clapper", "lg-i-robot", "lg-i-botchat"];
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

// Карточки рассылки (бонусы, до эфира, в эфире, последний звонок): ещё три мелких объекта в 3 раза.
for (const name of ["lg-i-box", "lg-i-camera", "lg-i-hourglass"]) {
  const img = sharp(join(src, `${name}.webp`));
  const { width } = await img.metadata();
  await img
    .resize({ width: width * 3, kernel: "lanczos3" })
    .sharpen({ sigma: 1.1, m1: 0.8, m2: 1.6 })
    .png({ compressionLevel: 9 })
    .toFile(join(out, `${name}-x3.png`));
  console.log(name, width, "->", width * 3);
}

// Крупные объекты 900 px: в png без увеличения (план с человечком для «Ещё два бонуса в конце эфира»).
await sharp(join(src, "lg-s50-plan.webp")).png({ compressionLevel: 9 }).toFile(join(out, "lg-s50-plan.png"));
console.log("lg-s50-plan.png");

// Будильник отдельно: вырезан из lg-s41-deadline (на offer.jpg он стоит рядом с песочными часами).
// Берём связную область вокруг будильника, всё остальное (край песочных часов) убираем по альфе.
{
  const { data, info } = await sharp(join(src, "lg-s41-deadline.webp")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const keep = new Uint8Array(W * H);
  const stack = [[720, 680]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 540 || x >= W || y < 440 || y >= H) continue;
    const i = y * W + x;
    if (keep[i] || data[i * 4 + 3] < 24) continue;
    keep[i] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (keep[y * W + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const buf = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const s = ((y + y0) * W + (x + x0)) * 4, d = (y * cw + x) * 4;
    if (keep[(y + y0) * W + (x + x0)]) { buf[d] = data[s]; buf[d + 1] = data[s + 1]; buf[d + 2] = data[s + 2]; buf[d + 3] = data[s + 3]; }
  }
  await sharp(buf, { raw: { width: cw, height: ch, channels: 4 } })
    .resize({ width: cw * 2, kernel: "lanczos3" })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 1.4 })
    .png({ compressionLevel: 9 })
    .toFile(join(out, "lg-s41-alarm-x2.png"));
  console.log("lg-s41-alarm-x2.png", cw, "x", ch, "->", cw * 2);
}

// Лист сравнения макетов: верхние два макета без нижней таблицы субтитров (1700x1510).
if (!onlyMail) {
  const sheet = "C:/Проекты/reels-montage-pipeline/reference/style-previews/layout-2026-09-18/layout-2026-09-18.png";
  await sharp(sheet)
    .extract({ left: 0, top: 0, width: 1700, height: 1510 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(join(out, "layout-sheet-top.jpg"));
  console.log("layout-sheet-top.jpg");
}
