import type { MetadataRoute } from "next";

export const BASE_URL = "https://lakeerieironroots.com";

/**
 * Four routes is not many, but a farm that lives on local search should be
 * telling Google exactly what exists rather than leaving it to a crawler.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${BASE_URL}/visit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
