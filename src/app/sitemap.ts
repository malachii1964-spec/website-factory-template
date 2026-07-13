import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const now = new Date();
  return ["", "/plants", "/hydroponics", "/about", "/contact"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/plants" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
