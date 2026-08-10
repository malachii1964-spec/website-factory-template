import type { MetadataRoute } from "next";
import { getAllGuides } from "@/lib/guides";
import { STRAINS } from "@/lib/strains";
import { GROWERS } from "@/lib/growers";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const guides = getAllGuides();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE}/guides`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/strains`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/start`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/diagnose`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/tools`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/strain-finder`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/strain-directory`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/build-my-grow`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/terpenes`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/frostybuds-soil`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/grow-like-the-greats`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/seeds`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/recipes`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/gear`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/local-ny`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/plant-doctor`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/medical-card`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/legal`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${SITE}/guides/${g.slug}`,
    lastModified: new Date(g.updated),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const strainPages: MetadataRoute.Sitemap = STRAINS.map((s) => ({
    url: `${SITE}/strains/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const growerPages: MetadataRoute.Sitemap = GROWERS.map((g) => ({
    url: `${SITE}/grow-like-the-greats/${g.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...guidePages, ...strainPages, ...growerPages];
}
