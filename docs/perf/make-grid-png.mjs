#!/usr/bin/env node
/**
 * Растровая сетка фона слайдов: public/montage/fisheye-grid-night.png из fisheye-grid.svg.
 * Раньше сетку рисовал слой с mask-image: url(fisheye-grid.svg) цветом #FBF3E4 при opacity 0.07; штрихи SVG идут с прозрачностью 0.5,
 * поэтому в картинке линии цвета #FBF3E4 с прозрачностью 0.5 × 0.07 = 0.035. Замер docs/reports/deck_perf_1009.md: слой с векторной сеткой
 * стоил около половины затрат GPU-процесса на каждый кадр, картинка той же сетки втрое дешевле.
 *   node docs/perf/make-grid-png.mjs
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "..", "public", "montage");
const svg = readFileSync(join(pub, "fisheye-grid.svg"), "utf8").replace('stroke="currentColor"', 'stroke="#FBF3E4"').replace('opacity="0.5"', 'opacity="0.035"');
// 2400×1500: в полтора раза больше родного размера SVG (1600×1000); density 108 = 72 × 1,5
await sharp(Buffer.from(svg), { density: 108 }).resize(2400, 1500).png({ compressionLevel: 9 }).toFile(join(pub, "fisheye-grid-night.png"));
console.log("готово: public/montage/fisheye-grid-night.png");
