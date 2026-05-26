/**
 * Custom image loader для next/image — корректно работает с basePath /workshop.
 *
 * Без него Next.js Image генерит `/workshop/_next/image?url=/alex.png` (без
 * /workshop в query param) — а image proxy ожидает url относительно
 * basePath или absolute. Получаем 400.
 *
 * Наш loader просто возвращает прямой URL с basePath-префиксом (без
 * проксирования через /_next/image). По сути аналог `unoptimized:true`,
 * но с корректным basePath.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src }: LoaderArgs): string {
  // External URLs — оставляем как есть
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  // Уже с базовым префиксом — не дублируем
  if (BASE && src.startsWith(BASE)) {
    return src;
  }
  // Локальный путь — префиксуем
  return `${BASE}${src}`;
}
