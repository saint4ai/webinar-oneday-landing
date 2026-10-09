#!/usr/bin/env node
/**
 * Облегчённые копии каруселей для слайда car: 1080 px по ширине вместо 2160 и 1440 (на слайде карусель занимает 16% ширины кадра,
 * то есть 307 px при кадре 1920 и 614 px при кадре 3840). Оригиналы не трогаем. Распакованная картинка 2160×2700 весит 23 МБ в памяти, 1080×1350 весит 5,8 МБ;
 * замер docs/reports/deck_perf_1009.md: группа слайдов car и 08c наращивала память GPU-процесса на 78 МБ за проход.
 *   node docs/perf/make-small-images.mjs
 */
import sharp from "sharp";
import { statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "..", "public", "montage", "carousels");
for (const base of ["lazyweb", "chat4"]) {
  for (let k = 1; k <= 4; k++) {
    const src = join(dir, `${base}-${k}.jpg`), out = join(dir, `${base}-${k}-1080.jpg`);
    const info = await sharp(src).resize({ width: 1080 }).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(out);
    console.log(`${base}-${k}-1080.jpg ${info.width}×${info.height} ${Math.round(statSync(out).size / 1024)} КБ (оригинал ${Math.round(statSync(src).size / 1024)} КБ)`);
  }
}
