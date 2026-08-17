import type { MetadataRoute } from "next";
import { products } from "@/lib/products";

export const SITE_URL = "https://www.futuredeskai.com";

// Public, indexable routes. Checkout and API routes are deliberately absent:
// they are transactional, not content, and appear in robots.ts as disallowed.
const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
  { path: "/membership", changeFrequency: "monthly", priority: 0.8 },
  { path: "/local-business", changeFrequency: "monthly", priority: 0.8 },
  { path: "/free-toolkit", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
