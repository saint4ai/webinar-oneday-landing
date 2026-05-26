/**
 * Префиксит путь basePath'ом (для деплоя под /workshop).
 *
 * router.push() и next/link учитывают basePath автоматически,
 * а вот fetch() и нативные <a href> — нет. Для них используем эти хелперы.
 *
 * В dev (NODE_ENV=development) basePath пустой → пути остаются без префикса.
 * В prod → /workshop/... .
 */

function prefix(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path}`;
}

/** Для fetch('/api/...') */
export const apiUrl = prefix;

/** Для <a href="/..."> (внутренние ссылки, которые НЕ через next/link) */
export const withBase = prefix;
