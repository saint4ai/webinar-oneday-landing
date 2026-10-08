// Считает видимые границы объектов (по альфа-каналу) и пишет docs/tg-media/bbox.js.
// card.html по ним ставит объект так, чтобы его низ стоял ровно на тени, без зазора.
// Запуск: node docs/tg-media/prep-bbox.mjs
import sharp from "sharp";
import { readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const files = [];
for (const [d, pre] of [["public/montage/lego", "L:"], ["docs/tg-media/obj", "X:"]])
  for (const f of readdirSync(join(root, d))) if (/\.(webp|png)$/.test(f)) files.push([join(root, d, f), pre + f]);
files.push([join(root, "public/montage/alex-cacao.webp"), "P:alex-cacao.webp"]);

const out = {};
for (const [p, key] of files) {
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let t = h, b = -1, l = w, r = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 40) { if (y < t) t = y; if (y > b) b = y; if (x < l) l = x; if (x > r) r = x; }
  // [ширина, высота, левая, верхняя, правая, нижняя граница видимой части в долях картинки]
  out[key] = [w, h, +(l / w).toFixed(4), +(t / h).toFixed(4), +((r + 1) / w).toFixed(4), +((b + 1) / h).toFixed(4)];
}
writeFileSync(join(here, "bbox.js"), "// Сгенерировано prep-bbox.mjs, руками не править.\nwindow.BB = " + JSON.stringify(out) + ";\n");
console.log("bbox.js:", Object.keys(out).length, "объектов");
