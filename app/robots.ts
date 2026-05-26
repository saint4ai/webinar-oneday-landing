import type { MetadataRoute } from "next";

const SITE_URL = "https://onai.academy/workshop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/thank-you", "/oferta"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
