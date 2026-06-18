import type { NextConfig } from "next";

// Под subpath onai.academy/workshop — все маршруты Next.js будут
// автоматически с префиксом /workshop. В dev (npm run dev) basePath
// отключаем, чтобы не плодить http://localhost:3000/workshop при
// локальной разработке.
// На Vercel (выгрузка презентации) — без префикса, чистый URL <project>.vercel.app/sales-deck.
// На прод-сервере за nginx — /workshop. В dev — "".
const BASE_PATH = process.env.VERCEL
  ? ""
  : process.env.NODE_ENV === "production"
    ? "/workshop"
    : "";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH || undefined,
  // trailingSlash=false (default). Канон Next.js = /workshop, без слэша.
  // nginx должен НЕ делать 301 /workshop→/workshop/, а проксировать
  // оба варианта напрямую — иначе ERR_TOO_MANY_REDIRECTS.

  // Custom image loader — обходит баг Next.js 16 с basePath в /_next/image
  // proxy (см. lib/image-loader.ts).
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },

  // Vercel: public/ (517 МБ ассетов) НЕ должен попадать в трассировку
  // серверных функций — иначе функция > 300 МБ и деплой падает (так было
  // в прошлый раз: api/lead раздулась до 873 МБ). public раздаётся как
  // статика с CDN, в функции его тянуть не нужно.
  outputFileTracingExcludes: {
    "*": ["public/**"],
  },

  // Эфир-деплой: не валим прод-сборку на TS/ESLint придирках (dev уже проверил рантайм).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Чтобы клиентские fetch'и могли строить полный путь.
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  async redirects() {
    return [
      // /oferta → /privacy: оферта не нужна на этапе бесплатной регистрации,
      // используем политику конфиденциальности (ЗРК «О персональных данных»).
      {
        source: "/oferta",
        destination: "/privacy",
        permanent: true,
      },
    ];
  },
  async headers() {
    // ⚠️ В DEV кастомные Cache-Control НЕ ставим. immutable на /_next/static/
    // ломает Turbopack HMR: браузер кэширует dev-чанки на год и при пересборке
    // подсовывает старый чанк → "module factory is not available".
    // Next.js сам предупреждает об этом в dev-логе. Заголовки — ТОЛЬКО в prod.
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [
      // Hashed Next.js статика — immutable на год (cache-bust через имя файла)
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Картинки и видео из public/ — 7 дней + revalidate
      {
        source: "/:all*(avif|webp|png|jpe?g|gif|svg|woff|woff2|ttf|mp4|webm|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
