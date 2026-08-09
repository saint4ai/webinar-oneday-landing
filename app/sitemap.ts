// Генерится один раз на сборке — обязательно для output:'export'.
export const dynamic = "force-static";

import type { MetadataRoute } from "next";

const SITE_URL = "https://onai.academy/workshop";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
