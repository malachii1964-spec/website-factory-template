import type { MetadataRoute } from "next";
import { SITE_URL } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Transactional and machine endpoints carry no indexable content and
        // can expose session-specific query strings, so keep them out of the index.
        disallow: ["/api/", "/checkout/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
