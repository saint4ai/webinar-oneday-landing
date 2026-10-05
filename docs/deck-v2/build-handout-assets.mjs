#!/usr/bin/env node
/**
 * Раздатки эфира → веб-ассеты деки (05.10.2026). Исходники 4K и 2K в репозиторий не кладём: только лёгкие петли и кропы.
 *
 *   node docs/deck-v2/build-handout-assets.mjs                 # всё
 *   node docs/deck-v2/build-handout-assets.mjs --only hits     # hits | ai | viral | growth
 *   HANDOUT_DIR="D:/путь/к/папке" node docs/deck-v2/build-handout-assets.mjs
 *
 * Что получается:
 *   public/montage/reels/hit-*.mp4|jpg   слайд 10 и полоса на 22r: залетевшие рилсы (папка 05), петля 20 с, 540×960, без звука
 *   public/montage/reels/ai-*.mp4|jpg    слайды 17, 21, 22: ролики про ИИ-монтаж (папка 06), петля 24–26 с
 *   public/montage/results/viral-1..6.jpg    слайд 10v: скрины рилсов со счётчиками (папка 04)
 *   public/montage/results/growth-*.png      слайд 10g: кропы панели Instagram на 05.10 (папка 01)
 * Обложка (01) собрана раньше: public/montage/cover/s01–s10 и v01–v07, те же материалы.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const require = createRequire(join(root, "package.json"));
const sharp = require("sharp");

const SRC = process.env.HANDOUT_DIR ?? "C:/Users/smmmc/Downloads/Раздаточный материал креативов эфира";
const REELS = join(root, "public/montage/reels");
const RESULTS = join(root, "public/montage/results");
mkdirSync(REELS, { recursive: true });
mkdirSync(RESULTS, { recursive: true });

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const want = (k) => !only || only.includes(k);

/** Файл папки по номеру в начале имени: «01 Instagram …mp4» → "01". */
function byPrefix(dir, prefix) {
  const hit = readdirSync(dir).find((f) => f.startsWith(prefix + " "));
  if (!hit) throw new Error(`В ${dir} нет файла «${prefix} …»`);
  return join(dir, hit);
}

function ffmpeg(a) {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error("ffmpeg упал: " + a.join(" "));
}

/** Петля 9:16 для телефона на слайде: 540×960, 30 к/с, H.264, без звука. start и len — секунды исходника, poster — секунда кадра-обложки. */
function loop(src, name, start, len, poster = start + 1) {
  const out = join(REELS, name);
  ffmpeg(["-ss", String(start), "-t", String(len), "-i", src,
    "-vf", "scale=540:960:flags=lanczos,fps=30,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "main", "-movflags", "+faststart", "-an", out + ".mp4"]);
  ffmpeg(["-ss", String(poster), "-i", src, "-frames:v", "1", "-vf", "scale=540:960:flags=lanczos,format=yuvj420p", "-q:v", "3", out + ".jpg"]);
  console.log(`✓ reels/${name}.mp4  ${(statSync(out + ".mp4").size / 1048576).toFixed(2)} МБ`);
}

if (want("hits")) {
  const dir = join(SRC, "05 Залетевшие рилсы - видео");
  // 01 четыре умных коннектора (117 тыс.), 02 одно слово (91 тыс.), 03 Artemis (62 тыс.), 04 замена Semrush (30 тыс.)
  // Кадр-обложка с третьей секунды: там уже читается заголовок рилса, а не середина анимации (постеры идут и на полосу 22r)
  loop(byPrefix(dir, "01"), "hit-connectors", 0, 20, 3);
  loop(byPrefix(dir, "02"), "hit-gitingest", 0, 20, 3);
  loop(byPrefix(dir, "03"), "hit-artemis", 0, 20, 3);
  loop(byPrefix(dir, "04"), "hit-semrush", 0, 20, 3);
}

if (want("ai")) {
  const dir = join(SRC, "06 Ролики про ИИ-монтаж");
  loop(byPrefix(dir, "03"), "ai-system", 24, 24); // система, на которой Claude монтирует: шаги записи, расшифровки и проверки кадров
  loop(byPrefix(dir, "01"), "ai-palmier", 6, 26); // Palmier: монтаж обычными командами
  loop(byPrefix(dir, "02"), "ai-notman", 0, 24); // «этот рилс смонтировал не человек»
}

if (want("viral")) {
  // Скрины рилсов из приложения (счётчик на самом скрине). Порядок — по убыванию просмотров.
  const dir = join(SRC, "04 Новые скриншоты (добавь сюда)");
  const order = ["8084", "8085", "8091", "8087", "8086", "8083"]; // 135, 118, 63,8, 62,2, 23,6, 21,2 тыс.
  for (let i = 0; i < order.length; i++) {
    const f = readdirSync(dir).find((n) => n.toUpperCase() === `IMG_${order[i]}.PNG`);
    await sharp(join(dir, f)).jpeg({ quality: 90, mozjpeg: true }).toFile(join(RESULTS, `viral-${i + 1}.jpg`)); // файлы .PNG на деле JPEG
    console.log(`✓ results/viral-${i + 1}.jpg ← IMG_${order[i]}`);
  }
}

if (want("growth")) {
  const dir = join(SRC, "01 Скриншоты статистики");
  const views = join(dir, "Instagram - 784 840 просмотров за 30 дней.png");
  const subs = join(dir, "Instagram - 16 402 подписчика, 7 848 действий в профиле.png");
  const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
  // Левая колонка панели: просмотры 784 840, 8,3% / 91,7%, зрители 342 807. Белые поля до портрета 2:3, масштаб текста остаётся крупным
  await sharp(views).extract({ left: 0, top: 540, width: 480, height: 520 }).extend({ top: 100, bottom: 100, background: WHITE }).png().toFile(join(RESULTS, "growth-reach.png"));
  // Правая колонка: подписчики 16 402 и часы наибольшей активности
  await sharp(subs).extract({ left: 570, top: 100, width: 712, height: 1080 }).png().toFile(join(RESULTS, "growth-followers.png"));
  console.log("✓ results/growth-reach.png, growth-followers.png");
}

if (!existsSync(join(REELS, "hit-connectors.mp4")) && want("hits")) throw new Error("hit-connectors.mp4 не создан");
