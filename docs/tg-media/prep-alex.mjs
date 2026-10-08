// Фото Александра для карточек: приглушает лаймовый логотип на футболке до золота (по цвету, без ручной маски).
// Вход docs/tg-media/obj/alex-2.png (вырез, прозрачный фон), выход docs/tg-media/obj/alex-2-gold.webp.
// Запуск: node docs/tg-media/prep-alex.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "obj/alex-2.png");
const out = join(here, "obj/alex-2-gold.webp");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const GOLD_H = 41; // оттенок золота #E3C07B
let changed = 0;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 0.25 || mx < 0.4) continue; // только насыщенные светлые пиксели: логотип, не кожа и не тень
  let h;
  if (mx === g) h = 60 * (((b - r) / d) + 2);
  else if (mx === r) h = 60 * ((((g - b) / d) % 6 + 6) % 6);
  else h = 60 * (((r - g) / d) + 4);
  if (h < 85 || h > 170) continue; // лайм и зелёный
  // золото с той же яркостью, насыщенность ниже, чтобы не горело
  const s = Math.min(0.5, d / mx), v = mx;
  const c = v * s, hp = GOLD_H / 60, x = c * (1 - Math.abs((hp % 2) - 1)), m = v - c;
  const [rr, gg, bb] = hp < 1 ? [c, x, 0] : [x, c, 0];
  data[i] = Math.round((rr + m) * 255); data[i + 1] = Math.round((gg + m) * 255); data[i + 2] = Math.round((bb + m) * 255);
  changed++;
}
await sharp(data, { raw: info }).webp({ quality: 94, alphaQuality: 100 }).toFile(out);
console.log("alex-2-gold.webp: перекрашено пикселей", changed);
